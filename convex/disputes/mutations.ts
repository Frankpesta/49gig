import { mutation, internalMutation, MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";
import type { FunctionReference } from "convex/server";
import {
  dollarsToCents,
  escrowNetToClientLockedGross,
  assertNonNegativeIntegerCents,
} from "./amounts";
import { effectivePlatformFeePercentForProject } from "../platformFeeResolve";
import {
  freelancersRemovedForPermanentExclusion,
  mergePermanentExclusions,
} from "../match_exclusions";
import {
  computeTeamPoolShareCentsByFreelancerId,
  sumShareCentsForFreelancers,
} from "../teamEscrowShares";
import type { Id } from "../_generated/dataModel";
import {
  getDisputePartyUserIds,
  getDisputeRecipientFreelancerIds,
  viewerIsDisputeParty,
} from "./partyAccess";
import { getDisputeReasonPolicy } from "../../lib/dispute-flow";

const api = require("../_generated/api") as {
  api: {
    notifications: { actions: { sendSystemNotification: unknown } };
    disputes: { actions: { releaseDisputeFunds: unknown } };
    projects: { actions: { sendSelectReplacementClientEmail: unknown } };
  };
};

const internalAny = require("../_generated/api").internal as {
  disputes: {
    staffEmails: {
      sendDisputeAssignmentEmailInternal: unknown;
      sendDisputePartyEmailsInternal: unknown;
      sendDisputeEscalationAdminsInternal: unknown;
    };
  };
};
const internalApi = require("../_generated/api").internal as any;

const ACTIVE_DISPUTE_STATUSES = new Set<string>([
  "open",
  "negotiation",
  "platform_intervention_requested",
  "awaiting_party_evidence",
  "under_review",
  "judgment_issued",
  "objection_window",
  "appeal_review",
  "enforcing_resolution",
  "escalated",
]);

function disputeIsActive(status: string) {
  return ACTIVE_DISPUTE_STATUSES.has(status);
}

function deadlineFromHours(now: number, hours: number) {
  return now + Math.max(1, hours) * 60 * 60 * 1000;
}

async function recordDisputeStageEvent(
  ctx: MutationCtx,
  args: {
    disputeId: Id<"disputes">;
    projectId: Id<"projects">;
    actorId?: Id<"users">;
    actorRole: "client" | "freelancer" | "moderator" | "admin" | "system";
    eventType: string;
    fromStatus?: string;
    toStatus?: string;
    title: string;
    description?: string;
    metadata?: unknown;
    createdAt: number;
  }
) {
  await ctx.db.insert("disputeStageEvents", {
    disputeId: args.disputeId,
    projectId: args.projectId,
    actorId: args.actorId,
    actorRole: args.actorRole,
    eventType: args.eventType,
    fromStatus: args.fromStatus,
    toStatus: args.toStatus,
    title: args.title,
    description: args.description,
    metadata: args.metadata,
    createdAt: args.createdAt,
  });
}

async function transitionDisputeStage(
  ctx: MutationCtx,
  args: {
    dispute: Doc<"disputes">;
    actor?: Doc<"users">;
    toStatus:
      | "negotiation"
      | "platform_intervention_requested"
      | "awaiting_party_evidence"
      | "under_review"
      | "judgment_issued"
      | "objection_window"
      | "appeal_review"
      | "enforcing_resolution"
      | "resolved"
      | "closed"
      | "cancelled";
    title: string;
    description?: string;
    stageDeadlineAt?: number;
    extraPatch?: Record<string, unknown>;
    metadata?: unknown;
  }
) {
  const now = Date.now();
  const actorRole =
    args.actor?.role === "admin" || args.actor?.role === "moderator"
      ? args.actor.role
      : args.actor?.role === "freelancer"
        ? "freelancer"
        : args.actor?.role === "client"
          ? "client"
          : "system";
  await ctx.db.patch(args.dispute._id, {
    status: args.toStatus,
    stage: args.toStatus === "cancelled" ? args.dispute.stage : args.toStatus,
    stageStartedAt: now,
    stageDeadlineAt: args.stageDeadlineAt,
    updatedAt: now,
    ...(args.extraPatch ?? {}),
  });
  await recordDisputeStageEvent(ctx, {
    disputeId: args.dispute._id,
    projectId: args.dispute.projectId,
    actorId: args.actor?._id,
    actorRole,
    eventType: `dispute_${args.toStatus}`,
    fromStatus: args.dispute.status,
    toStatus: args.toStatus,
    title: args.title,
    description: args.description,
    metadata: args.metadata,
    createdAt: now,
  });
}

/** Role labels for disputed members (accepted match rows only), before sweep rejects them. */
async function teamRoleLabelsForDisputedFreelancers(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  disputedFreelancerIds: Id<"users">[]
): Promise<string[]> {
  if (disputedFreelancerIds.length === 0) return [];
  const rm = new Set(disputedFreelancerIds.map(String));
  const rows = await ctx.db
    .query("matches")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();
  const out = new Set<string>();
  for (const m of rows) {
    if (!rm.has(String(m.freelancerId))) continue;
    if (m.status === "accepted" && m.teamRole) out.add(m.teamRole);
  }
  return [...out];
}

/**
 * Align project UX with applyFreelancerReplacementInternal so clients see “Choose replacement” / matches
 * after moderator client-favor or replacement decisions (partial or full team).
 *
 * For partial team disputes, scopes `pendingTeamMemberSlots` / `rolesAwaitingMatch` to the removed seats only
 * so matching and copy do not treat the whole team as open.
 */
async function ensureReplacementMatchingProjectFields(
  ctx: MutationCtx,
  args: {
    projectId: Id<"projects">;
    disputeId: Id<"disputes">;
    now: number;
    partialDisputedFreelancerIds?: Id<"users">[];
  }
) {
  const p = await ctx.db.get(args.projectId);
  if (!p) return;
  const partialReplacement =
    !!args.partialDisputedFreelancerIds &&
    args.partialDisputedFreelancerIds.length > 0;
  if (p.status !== "matching" && !(p.status === "in_progress" && partialReplacement)) {
    return;
  }

  const patch: Record<string, unknown> = {
    replacementMatchingAt: p.replacementMatchingAt ?? args.now,
    awaitingMatch: true,
    awaitingMatchSince: p.awaitingMatchSince ?? args.now,
    replacementFlowDisputeId: p.replacementFlowDisputeId ?? args.disputeId,
    updatedAt: args.now,
  };

  if (args.partialDisputedFreelancerIds && args.partialDisputedFreelancerIds.length > 0) {
    const roleLabels = await teamRoleLabelsForDisputedFreelancers(
      ctx,
      args.projectId,
      args.partialDisputedFreelancerIds
    );
    patch.pendingTeamMemberSlots = args.partialDisputedFreelancerIds.length;
    patch.rolesAwaitingMatch = roleLabels.length > 0 ? roleLabels : undefined;
  } else if (
    (p.matchedFreelancerIds?.length ?? 0) === 0 &&
    !p.matchedFreelancerId
  ) {
    patch.pendingTeamMemberSlots = undefined;
    patch.rolesAwaitingMatch = undefined;
  }

  await ctx.db.patch(args.projectId, patch as any);
}

async function disputeNetScopeCents(
  ctx: MutationCtx,
  project: Doc<"projects">,
  dispute: Doc<"disputes">
): Promise<number> {
  const teamBasis =
    dispute.teamEscrowBasisFreelancerIds && dispute.teamEscrowBasisFreelancerIds.length > 0
      ? dispute.teamEscrowBasisFreelancerIds
      : project.matchedFreelancerIds ?? [];
  const disputedIds = dispute.disputedFreelancerIds ?? [];
  const isPartialTeam =
    teamBasis.length > 0 &&
    disputedIds.length > 0 &&
    disputedIds.length < teamBasis.length;
  const poolCents = dispute.monthlyCycleId
    ? Math.max(0, ((await ctx.db.get(dispute.monthlyCycleId))?.amountCents ?? 0))
    : dollarsToCents(project.escrowedAmount ?? 0);

  if (!isPartialTeam) {
    return poolCents;
  }

  const shareMap = await computeTeamPoolShareCentsByFreelancerId(
    ctx,
    project._id,
    teamBasis,
    project.teamBudgetBreakdown,
    poolCents
  );
  return sumShareCentsForFreelancers(shareMap, disputedIds);
}

/** Audit when client refund gross is below dispute.lockedAmount because escrow could not cover it. */
export const logDisputeClientRefundCapInternal = internalMutation({
  args: {
    disputeId: v.id("disputes"),
    projectId: v.id("projects"),
    clientId: v.id("users"),
    snapshotLockedGrossUsd: v.number(),
    appliedRefundGrossUsd: v.number(),
  },
  handler: async (ctx, args) => {
    const snapC = Math.round(args.snapshotLockedGrossUsd * 100);
    const appC = Math.round(args.appliedRefundGrossUsd * 100);
    if (appC >= snapC) return { logged: false as const };
    const shortfall =
      Math.round((args.snapshotLockedGrossUsd - args.appliedRefundGrossUsd) * 100) / 100;
    await ctx.db.insert("auditLogs", {
      action: "dispute_client_refund_capped_by_escrow",
      actionType: "system",
      actorId: args.clientId,
      actorRole: "system",
      targetType: "dispute",
      targetId: String(args.disputeId),
      details: {
        projectId: args.projectId,
        snapshotLockedGrossUsd: args.snapshotLockedGrossUsd,
        appliedRefundGrossUsd: args.appliedRefundGrossUsd,
        shortfallGrossUsd: shortfall,
      },
      createdAt: Date.now(),
    });
    return { logged: true as const };
  },
});

/**
 * Helper to get current user in mutations
 */
/** Client, staff, or freelancers who are parties to this dispute (partial team → disputed only). */
function assertDisputeThreadAccess(
  user: Doc<"users">,
  project: Doc<"projects">,
  dispute: Doc<"disputes">
) {
  const isStaff = user.role === "admin" || user.role === "moderator";
  if (isStaff) return;
  if (project.clientId === user._id) return;
  if (
    user.role === "freelancer" &&
    viewerIsDisputeParty(user._id, project, dispute)
  ) {
    return;
  }
  throw new Error("You are not a party to this dispute.");
}

async function getCurrentUserInMutation(
  ctx: MutationCtx,
  userId?: string
): Promise<Doc<"users"> | null> {
  if (userId) {
    const user = await ctx.db.get(userId as Doc<"users">["_id"]);
    if (!user || user.status !== "active") {
      return null;
    }
    return user;
  }

  const user = await getCurrentUser(ctx);
  if (!user || user.status !== "active") {
    return null;
  }
  return user as Doc<"users">;
}

/**
 * Initiate a dispute
 * Records client gross funding in dispute (escrow net + platform-fee portion). Unreleased escrow stays net in `project.escrowedAmount`.
 */
export const initiateDispute = mutation({
  args: {
    projectId: v.string(), // Accept string (e.g. from URL); normalized in handler
    milestoneId: v.optional(v.string()),
    monthlyCycleId: v.optional(v.string()),
    type: v.union(
      v.literal("milestone_quality"),
      v.literal("payment"),
      v.literal("communication"),
      v.literal("freelancer_replacement"),
      v.literal("client_deliverable_quality"),
      v.literal("client_timeline_scope"),
      v.literal("client_payment_billing"),
      v.literal("client_communication_conduct"),
      v.literal("client_request_replacement"),
      v.literal("freelancer_payment_issue"),
      v.literal("freelancer_scope_requirements"),
      v.literal("freelancer_communication"),
      v.literal("freelancer_platform_policy")
    ),
    reason: v.string(),
    description: v.string(),
    evidence: v.optional(
      v.array(
        v.object({
          type: v.union(
            v.literal("message"),
            v.literal("file"),
            v.literal("milestone_deliverable")
          ),
          messageId: v.optional(v.id("messages")),
          fileId: v.optional(v.id("_storage")),
          milestoneId: v.optional(v.id("milestones")),
          description: v.optional(v.string()),
        })
      )
    ),
    // Partial team dispute: which freelancers are being disputed (team hires only)
    disputedFreelancerIds: v.optional(v.array(v.id("users"))),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const projectId = ctx.db.normalizeId("projects", args.projectId);
    if (!projectId) {
      throw new Error("Invalid project ID");
    }
    const milestoneIdRaw = args.milestoneId
      ? ctx.db.normalizeId("milestones", args.milestoneId)
      : undefined;
    const milestoneId = milestoneIdRaw ?? undefined;
    const monthlyCycleIdRaw = args.monthlyCycleId
      ? ctx.db.normalizeId("monthlyBillingCycles", args.monthlyCycleId)
      : undefined;
    const monthlyCycleId = monthlyCycleIdRaw ?? undefined;

    // Get project
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check authorization - must be client or freelancer on this project
    const isClient = project.clientId === user._id;
    const isFreelancer =
      project.matchedFreelancerId === user._id ||
      (project.matchedFreelancerIds?.includes(user._id) ?? false);

    if (!isClient && !isFreelancer) {
      throw new Error("Unauthorized - must be project client or freelancer");
    }

    const CLIENT_DISPUTE_TYPES = new Set<string>([
      "milestone_quality",
      "payment",
      "communication",
      "freelancer_replacement",
      "client_deliverable_quality",
      "client_timeline_scope",
      "client_payment_billing",
      "client_communication_conduct",
      "client_request_replacement",
    ]);
    const FREELANCER_DISPUTE_TYPES = new Set<string>([
      "milestone_quality",
      "payment",
      "communication",
      "freelancer_payment_issue",
      "freelancer_scope_requirements",
      "freelancer_communication",
      "freelancer_platform_policy",
    ]);
    if (isClient && !CLIENT_DISPUTE_TYPES.has(args.type)) {
      throw new Error("That dispute type is only available when you are the freelancer on the hire.");
    }
    if (isFreelancer && !FREELANCER_DISPUTE_TYPES.has(args.type)) {
      throw new Error("That dispute type is only available when you are the client on the hire.");
    }

    // Check if dispute already exists for this project/milestone
    const existingDisputes = await ctx.db
      .query("disputes")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "open"),
          q.eq(q.field("status"), "negotiation"),
          q.eq(q.field("status"), "platform_intervention_requested"),
          q.eq(q.field("status"), "awaiting_party_evidence"),
          q.eq(q.field("status"), "under_review"),
          q.eq(q.field("status"), "judgment_issued"),
          q.eq(q.field("status"), "objection_window"),
          q.eq(q.field("status"), "appeal_review"),
          q.eq(q.field("status"), "enforcing_resolution"),
          q.eq(q.field("status"), "escalated")
        )
      )
      .collect();

    let monthlyCycleDoc: Doc<"monthlyBillingCycles"> | undefined;
    if (monthlyCycleId) {
      const cycle = await ctx.db.get(monthlyCycleId);
      if (!cycle) {
        throw new Error("Monthly cycle not found");
      }
      if (cycle.projectId !== projectId) {
        throw new Error("Monthly cycle does not belong to this project");
      }
      const now = Date.now();
      if (now < cycle.monthEndDate) {
        throw new Error(
          "This billing period has not ended yet. Disputes open after the period ends.",
        );
      }
      if (project.status !== "in_progress" && project.status !== "disputed") {
        throw new Error(
          "Monthly payment disputes can only be opened while the hire is in progress (or on an hire that is already disputed).",
        );
      }
      monthlyCycleDoc = cycle;
      const cycleDispute = existingDisputes.find(
        (d) => d.monthlyCycleId === monthlyCycleId
      );
      if (cycleDispute) {
        throw new Error("Dispute already exists for this monthly payment");
      }
    } else if (milestoneId) {
      const milestoneDispute = existingDisputes.find(
        (d) => d.milestoneId === milestoneId
      );
      if (milestoneDispute) {
        throw new Error("Dispute already exists for this milestone");
      }
    } else {
      const projectDispute = existingDisputes.find(
        (d) => !d.milestoneId && !d.monthlyCycleId
      );
      if (projectDispute) {
        throw new Error("An open dispute already exists for this project");
      }
    }

    const escrowNet = Math.max(0, project.escrowedAmount ?? 0);
    const platformFeePct = await effectivePlatformFeePercentForProject(
      ctx,
      project.platformFee
    );

    // Validate partial team dispute: all specified freelancers must be on the project
    const teamMemberIds = project.matchedFreelancerIds ?? [];
    let disputedIdsUnique: Id<"users">[] | undefined;
    if (args.disputedFreelancerIds && args.disputedFreelancerIds.length > 0) {
      if (!isClient) {
        throw new Error("Only clients can initiate partial team disputes.");
      }
      if (teamMemberIds.length === 0) {
        throw new Error("Partial team disputes are only available for team hires.");
      }
      disputedIdsUnique = Array.from(
        new Set(args.disputedFreelancerIds.map(String))
      ) as Id<"users">[];
      for (const fid of disputedIdsUnique) {
        if (!teamMemberIds.includes(fid)) {
          throw new Error(`Freelancer ${fid} is not a matched member of this project.`);
        }
      }
    }

    const isPartialTeamDispute =
      isClient &&
      !!disputedIdsUnique &&
      disputedIdsUnique.length > 0 &&
      teamMemberIds.length > 0 &&
      disputedIdsUnique.length < teamMemberIds.length;

    // Client gross that corresponds to all net escrow (cannot lock more than this for a partial team dispute).
    const fullEscrowClientGross = escrowNetToClientLockedGross(escrowNet, platformFeePct);

    let lockedAmount: number;
    if (isPartialTeamDispute && disputedIdsUnique) {
      const totalPoolCents = Math.round(escrowNet * 100);
      const shareMap = await computeTeamPoolShareCentsByFreelancerId(
        ctx,
        projectId,
        teamMemberIds as Id<"users">[],
        project.teamBudgetBreakdown,
        totalPoolCents
      );
      const disputedNetCents = sumShareCentsForFreelancers(
        shareMap,
        disputedIdsUnique
      );
      lockedAmount = escrowNetToClientLockedGross(disputedNetCents / 100, platformFeePct);
    } else {
      lockedAmount = fullEscrowClientGross;
    }
    lockedAmount = Math.min(lockedAmount, fullEscrowClientGross);

    const now = Date.now();
    const policy = getDisputeReasonPolicy(args.type);
    const negotiationDeadlineAt = deadlineFromHours(now, policy.negotiationHours);
    const evidenceDeadlineAt = deadlineFromHours(now, policy.evidenceHours);
    const track = policy.fastTrackEligible ? "fast_track" : "normal";

    // Create dispute
    const disputeId = await ctx.db.insert("disputes", {
      projectId,
      milestoneId,
      monthlyCycleId,
      initiatorId: user._id,
      initiatorRole: user.role === "client" ? "client" : "freelancer",
      type: args.type,
      reason: args.reason,
      description: args.description,
      evidence: args.evidence || [],
      status: "negotiation",
      track,
      stage: "negotiation",
      stageStartedAt: now,
      stageDeadlineAt: negotiationDeadlineAt,
      negotiationDeadlineAt,
      evidenceDeadlineAt,
      fastTrackEligible: policy.fastTrackEligible,
      policyReasonLabel: policy.label,
      requiredEvidenceChecklist: policy.requiredEvidence.map((item) => ({
        id: item.id,
        owner: item.owner,
        label: item.label,
        description: item.description,
      })),
      lockedAmount,
      disputedFreelancerIds:
        disputedIdsUnique && disputedIdsUnique.length > 0
          ? disputedIdsUnique
          : undefined,
      teamEscrowBasisFreelancerIds:
        teamMemberIds.length > 0 ? [...teamMemberIds] : undefined,
      createdAt: now,
      updatedAt: now,
    });

    await recordDisputeStageEvent(ctx, {
      disputeId,
      projectId,
      actorId: user._id,
      actorRole: user.role === "client" ? "client" : "freelancer",
      eventType: "dispute_opened",
      toStatus: "negotiation",
      title: "Dispute opened",
      description:
        "The case is in the direct negotiation window. Either party can request platform intervention when negotiation fails.",
      metadata: {
        reasonType: args.type,
        reasonLabel: policy.label,
        track,
        requiredEvidence: policy.requiredEvidence.map((item) => item.id),
      },
      createdAt: now,
    });

    for (const evidence of args.evidence ?? []) {
      await ctx.db.insert("disputeEvidence", {
        disputeId,
        projectId,
        submittedBy: user._id,
        submittedByRole: user.role === "client" ? "client" : "freelancer",
        title: evidence.description?.trim() || "Initial evidence",
        description: evidence.description,
        evidenceType:
          evidence.type === "file"
            ? "file"
            : evidence.type === "message"
              ? "message"
              : "deliverable",
        messageId: evidence.messageId,
        fileId: evidence.fileId,
        status: "submitted",
        createdAt: now,
        updatedAt: now,
      });
    }

    if (monthlyCycleId) {
      await ctx.db.patch(monthlyCycleId, {
        status: "disputed",
        disputeId,
        updatedAt: Date.now(),
      });
    }

    // Full-team or solo hire: mark hire disputed for everyone. Partial team: unaffected members keep working.
    if (!isPartialTeamDispute) {
      await ctx.db.patch(projectId, {
        status: "disputed",
        updatedAt: Date.now(),
      });
    }

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    const releaseDisputeFunds =
      api.api.disputes.actions.releaseDisputeFunds as unknown as FunctionReference<"action">;

    const syntheticDispute: Pick<Doc<"disputes">, "initiatorId" | "disputedFreelancerIds"> = {
      initiatorId: user._id,
      disputedFreelancerIds:
        disputedIdsUnique && disputedIdsUnique.length > 0
          ? disputedIdsUnique
          : undefined,
    };
    const partyUserIds = getDisputePartyUserIds(
      project,
      syntheticDispute as Doc<"disputes">
    );
    const notifyUserIds = partyUserIds.filter(
      (id) => String(id) !== String(user._id)
    );

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "dispute_initiated",
      actionType: "dispute",
      actorId: user._id,
      actorRole: user.role,
      targetType: "dispute",
      targetId: disputeId,
      details: {
        projectId,
        milestoneId,
        type: args.type,
        lockedAmount,
      },
      createdAt: Date.now(),
    });

    if (notifyUserIds.length > 0) {
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: notifyUserIds,
        title: "New dispute opened",
        message: `A dispute was opened for ${project.intakeForm.title}.`,
        type: "dispute",
        data: { disputeId, projectId },
      });
      await (
        ctx.scheduler.runAfter as (
          delayMs: number,
          fn: unknown,
          fnArgs: Record<string, unknown>
        ) => Promise<unknown>
      )(0, internalAny.disputes.staffEmails.sendDisputePartyEmailsInternal, {
        userIds: notifyUserIds,
        subject: `[49GIG] Dispute opened: ${project.intakeForm.title ?? "Hire"}`,
        headline: "A dispute was opened",
        bodyText: `A dispute was opened on "${project.intakeForm.title}".\n\nReason: ${args.reason}\n\nOpen the dispute thread in your dashboard for details and next steps.`,
        disputeId,
      });
    }
    await ctx.db.insert("disputeMessages", {
      disputeId,
      authorId: user._id,
      authorRole: "system",
      body: `Dispute opened by ${user.name ?? "a party"} (${isClient ? "client" : "freelancer"}). Reason: ${args.reason}`,
      createdAt: Date.now(),
    });

    return disputeId;
  },
});

/**
 * Post a message in the dispute thread (parties + moderators/admins).
 */
export const sendDisputeChatMessage = mutation({
  args: {
    disputeId: v.id("disputes"),
    body: v.string(),
    userId: v.optional(v.id("users")),
    attachments: v.optional(
      v.array(
        v.object({
          fileId: v.id("_storage"),
          fileName: v.string(),
          fileSize: v.number(),
          mimeType: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) throw new Error("Not authenticated");

    const text = args.body.trim();
    if (!text && (!args.attachments || args.attachments.length === 0)) {
      throw new Error("Message or attachment required");
    }

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute not found");
    if (dispute.status === "resolved" || dispute.status === "closed") {
      throw new Error("This dispute is closed");
    }

    const project = await ctx.db.get(dispute.projectId);
    if (!project) throw new Error("Project not found");

    assertDisputeThreadAccess(user, project, dispute);

    const isClient = project.clientId === user._id;
    const isFreelancerParty =
      user.role === "freelancer" &&
      viewerIsDisputeParty(user._id, project, dispute);

    let authorRole: "client" | "freelancer" | "moderator" | "admin" | "system" =
      "client";
    if (user.role === "admin") authorRole = "admin";
    else if (user.role === "moderator") authorRole = "moderator";
    else if (isFreelancerParty) authorRole = "freelancer";
    else authorRole = "client";

    // Resolve attachment download URLs from storage
    const attachments = args.attachments?.length
      ? await Promise.all(
          args.attachments.map(async (att) => {
            const url = (await ctx.storage.getUrl(att.fileId)) ?? "";
            return { ...att, url };
          })
        )
      : undefined;

    await ctx.db.insert("disputeMessages", {
      disputeId: args.disputeId,
      authorId: user._id,
      authorName: user.name,
      authorRole,
      body: text || "📎 Attachment",
      attachments: attachments?.length ? attachments : undefined,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/** Generate a Convex storage upload URL for dispute file attachments. */
export const generateDisputeUploadUrl = mutation({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Add evidence to a dispute
 */
export const addEvidence = mutation({
  args: {
    disputeId: v.id("disputes"),
    evidence: v.object({
      type: v.union(
        v.literal("message"),
        v.literal("file"),
        v.literal("milestone_deliverable")
      ),
      messageId: v.optional(v.id("messages")),
      fileId: v.optional(v.id("_storage")),
      milestoneId: v.optional(v.id("milestones")),
      description: v.optional(v.string()),
    }),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) {
      throw new Error("Dispute not found");
    }

    // Get project
    const project = await ctx.db.get(dispute.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    assertDisputeThreadAccess(user, project, dispute);

    // Check if dispute is still active
    if (!disputeIsActive(dispute.status)) {
      throw new Error("Cannot add evidence to closed dispute");
    }

    // Add evidence
    const now = Date.now();
    await ctx.db.patch(args.disputeId, {
      evidence: [...dispute.evidence, args.evidence],
      updatedAt: now,
    });
    await ctx.db.insert("disputeEvidence", {
      disputeId: args.disputeId,
      projectId: dispute.projectId,
      submittedBy: user._id,
      submittedByRole:
        user.role === "admin" || user.role === "moderator"
          ? user.role
          : user.role === "freelancer"
            ? "freelancer"
            : "client",
      title: args.evidence.description?.trim() || "Additional evidence",
      description: args.evidence.description,
      evidenceType:
        args.evidence.type === "file"
          ? "file"
          : args.evidence.type === "message"
            ? "message"
            : "deliverable",
      messageId: args.evidence.messageId,
      fileId: args.evidence.fileId,
      status: "submitted",
      createdAt: now,
      updatedAt: now,
    });
    await recordDisputeStageEvent(ctx, {
      disputeId: args.disputeId,
      projectId: dispute.projectId,
      actorId: user._id,
      actorRole:
        user.role === "admin" || user.role === "moderator"
          ? user.role
          : user.role === "freelancer"
            ? "freelancer"
            : "client",
      eventType: "dispute_evidence_submitted",
      title: "Evidence submitted",
      description: args.evidence.description,
      createdAt: now,
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "dispute_evidence_added",
      actionType: "dispute",
      actorId: user._id,
      actorRole: user.role,
      targetType: "dispute",
      targetId: args.disputeId,
      details: {
        evidenceType: args.evidence.type,
      },
      createdAt: now,
    });

    return { success: true };
  },
});

export const submitStructuredEvidence = mutation({
  args: {
    disputeId: v.id("disputes"),
    checklistItemId: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
    evidenceType: v.union(
      v.literal("message"),
      v.literal("file"),
      v.literal("link"),
      v.literal("deliverable"),
      v.literal("payment_record"),
      v.literal("other")
    ),
    messageId: v.optional(v.id("messages")),
    fileId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) throw new Error("Not authenticated");

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute not found");
    if (!disputeIsActive(dispute.status)) {
      throw new Error("Cannot submit evidence to a closed dispute.");
    }

    const project = await ctx.db.get(dispute.projectId);
    if (!project) throw new Error("Project not found");
    assertDisputeThreadAccess(user, project, dispute);

    const title = args.title.trim();
    if (!title) throw new Error("Evidence title is required.");
    if (args.evidenceType === "file" && !args.fileId) {
      throw new Error("A file is required for file evidence.");
    }
    if (args.evidenceType === "link" && !args.url?.trim()) {
      throw new Error("A URL is required for link evidence.");
    }

    const now = Date.now();
    const evidenceId = await ctx.db.insert("disputeEvidence", {
      disputeId: args.disputeId,
      projectId: dispute.projectId,
      submittedBy: user._id,
      submittedByRole:
        user.role === "admin" || user.role === "moderator"
          ? user.role
          : user.role === "freelancer"
            ? "freelancer"
            : "client",
      checklistItemId: args.checklistItemId,
      title,
      description: args.description,
      evidenceType: args.evidenceType,
      messageId: args.messageId,
      fileId: args.fileId,
      url: args.url?.trim(),
      status: "submitted",
      createdAt: now,
      updatedAt: now,
    });

    if (args.checklistItemId && dispute.requiredEvidenceChecklist) {
      await ctx.db.patch(args.disputeId, {
        requiredEvidenceChecklist: dispute.requiredEvidenceChecklist.map((item) =>
          item.id === args.checklistItemId && !item.satisfiedAt
            ? { ...item, satisfiedAt: now }
            : item
        ),
        updatedAt: now,
      });
    }

    await recordDisputeStageEvent(ctx, {
      disputeId: args.disputeId,
      projectId: dispute.projectId,
      actorId: user._id,
      actorRole:
        user.role === "admin" || user.role === "moderator"
          ? user.role
          : user.role === "freelancer"
            ? "freelancer"
            : "client",
      eventType: "dispute_structured_evidence_submitted",
      title: "Evidence submitted",
      description: title,
      metadata: { evidenceId, checklistItemId: args.checklistItemId },
      createdAt: now,
    });

    return { success: true, evidenceId };
  },
});

export const requestPlatformIntervention = mutation({
  args: {
    disputeId: v.id("disputes"),
    reason: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) throw new Error("Not authenticated");

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute not found");
    if (!disputeIsActive(dispute.status)) throw new Error("This dispute is closed.");

    const project = await ctx.db.get(dispute.projectId);
    if (!project) throw new Error("Project not found");
    assertDisputeThreadAccess(user, project, dispute);

    const now = Date.now();
    const policy = getDisputeReasonPolicy(dispute.type);
    await transitionDisputeStage(ctx, {
      dispute,
      actor: user,
      toStatus: "awaiting_party_evidence",
      title: "Platform intervention requested",
      description:
        args.reason.trim() ||
        "A party requested platform intervention because direct negotiation did not resolve the case.",
      stageDeadlineAt: deadlineFromHours(now, policy.evidenceHours),
      extraPatch: {
        platformInterventionRequestedAt: now,
        platformInterventionRequestedBy: user._id,
        evidenceDeadlineAt: deadlineFromHours(now, policy.evidenceHours),
      },
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    const recipientIds = getDisputePartyUserIds(project, dispute).filter(
      (id) => String(id) !== String(user._id)
    );
    if (recipientIds.length > 0) {
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: recipientIds,
        title: "Platform intervention requested",
        message: `A party requested 49GIG review for ${project.intakeForm.title}. Please submit evidence before the deadline.`,
        type: "dispute",
        data: { disputeId: args.disputeId, projectId: dispute.projectId },
      });
      await (
        ctx.scheduler.runAfter as (
          delayMs: number,
          fn: unknown,
          fnArgs: Record<string, unknown>
        ) => Promise<unknown>
      )(0, internalAny.disputes.staffEmails.sendDisputePartyEmailsInternal, {
        userIds: recipientIds,
        subject: `[49GIG] Platform intervention requested: ${project.intakeForm.title ?? "Hire"}`,
        headline: "Platform intervention requested",
        bodyText: `A party requested 49GIG intervention on "${project.intakeForm.title}". Please submit evidence before the deadline so staff can review the case fairly.`,
        disputeId: args.disputeId,
      });
    }

    return { success: true };
  },
});

export const reviewDisputeEvidence = mutation({
  args: {
    evidenceId: v.id("disputeEvidence"),
    status: v.union(v.literal("accepted"), v.literal("rejected")),
    reviewNotes: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== "admin" && user.role !== "moderator") {
      throw new Error("Only staff can review dispute evidence.");
    }

    const evidence = await ctx.db.get(args.evidenceId);
    if (!evidence) throw new Error("Evidence not found");
    const now = Date.now();
    await ctx.db.patch(args.evidenceId, {
      status: args.status,
      reviewNotes: args.reviewNotes,
      reviewedBy: user._id,
      reviewedAt: now,
      updatedAt: now,
    });
    await recordDisputeStageEvent(ctx, {
      disputeId: evidence.disputeId,
      projectId: evidence.projectId,
      actorId: user._id,
      actorRole: user.role,
      eventType: "dispute_evidence_reviewed",
      title: `Evidence ${args.status}`,
      description: evidence.title,
      metadata: { evidenceId: args.evidenceId, reviewNotes: args.reviewNotes },
      createdAt: now,
    });
    return { success: true };
  },
});

export const issueDisputeJudgment = mutation({
  args: {
    disputeId: v.id("disputes"),
    decision: v.union(
      v.literal("client_favor"),
      v.literal("freelancer_favor"),
      v.literal("partial"),
      v.literal("replacement")
    ),
    resolutionAmount: v.optional(v.number()),
    notes: v.string(),
    clientMessage: v.optional(v.string()),
    freelancerMessage: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== "admin" && user.role !== "moderator") {
      throw new Error("Only staff can issue a dispute judgment.");
    }

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute not found");
    if (!disputeIsActive(dispute.status)) {
      throw new Error("Cannot issue judgment for a closed dispute.");
    }
    const project = await ctx.db.get(dispute.projectId);
    if (!project) throw new Error("Project not found");

    const policy = getDisputeReasonPolicy(dispute.type);
    if (!policy.outcomes.includes(args.decision)) {
      throw new Error("This outcome is not allowed for the selected dispute reason.");
    }

    const notes = args.notes.trim();
    if (!notes) throw new Error("Judgment notes are required.");

    const scopeCents = await disputeNetScopeCents(ctx, project, dispute);
    let resolutionAmount = args.resolutionAmount;
    if (args.decision === "partial") {
      if (typeof resolutionAmount !== "number") {
        throw new Error("Partial judgments require a client refund amount in cents.");
      }
      assertNonNegativeIntegerCents(resolutionAmount, "resolutionAmount");
      if (resolutionAmount > scopeCents) {
        throw new Error("Resolution amount cannot exceed the disputed escrow scope.");
      }
    } else if (resolutionAmount !== undefined) {
      assertNonNegativeIntegerCents(resolutionAmount, "resolutionAmount");
    }

    const now = Date.now();
    const objectionWindowEndsAt = deadlineFromHours(now, policy.objectionHours);
    await transitionDisputeStage(ctx, {
      dispute,
      actor: user,
      toStatus: "objection_window",
      title: "Judgment issued",
      description: notes,
      stageDeadlineAt: objectionWindowEndsAt,
      extraPatch: {
        judgmentIssuedAt: now,
        objectionWindowEndsAt,
        resolution: {
          decision: args.decision,
          resolutionAmount,
          notes,
          clientMessage: args.clientMessage,
          freelancerMessage: args.freelancerMessage,
          resolvedBy: user._id,
          resolvedAt: now,
        },
      },
      metadata: {
        decision: args.decision,
        resolutionAmount,
        objectionWindowEndsAt,
      },
    });

    const recipients = getDisputePartyUserIds(project, dispute);
    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    if (recipients.length > 0) {
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: recipients,
        title: "Dispute judgment issued",
        message: `49GIG has issued a judgment for ${project.intakeForm.title}. You can object before the window closes.`,
        type: "dispute",
        data: { disputeId: args.disputeId, projectId: dispute.projectId },
      });
      await (
        ctx.scheduler.runAfter as (
          delayMs: number,
          fn: unknown,
          fnArgs: Record<string, unknown>
        ) => Promise<unknown>
      )(0, internalAny.disputes.staffEmails.sendDisputePartyEmailsInternal, {
        userIds: recipients,
        subject: `[49GIG] Dispute judgment issued: ${project.intakeForm.title ?? "Hire"}`,
        headline: "Dispute judgment issued",
        bodyText: `49GIG has issued a judgment for "${project.intakeForm.title}". Review the decision in your dashboard. If there is a material error, submit an objection before the window closes.`,
        disputeId: args.disputeId,
      });
    }

    return { success: true };
  },
});

export const raiseDisputeObjection = mutation({
  args: {
    disputeId: v.id("disputes"),
    reason: v.string(),
    evidenceIds: v.optional(v.array(v.id("_storage"))),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) throw new Error("Not authenticated");

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute not found");
    if (dispute.status !== "objection_window") {
      throw new Error("Objections can only be raised during the objection window.");
    }
    if (dispute.objectionWindowEndsAt && Date.now() > dispute.objectionWindowEndsAt) {
      throw new Error("The objection window has closed.");
    }

    const project = await ctx.db.get(dispute.projectId);
    if (!project) throw new Error("Project not found");
    assertDisputeThreadAccess(user, project, dispute);

    const reason = args.reason.trim();
    if (!reason) throw new Error("Objection reason is required.");

    const now = Date.now();
    await transitionDisputeStage(ctx, {
      dispute,
      actor: user,
      toStatus: "appeal_review",
      title: "Objection raised",
      description: reason,
      extraPatch: {
        appealWindowEndsAt: deadlineFromHours(now, 24),
        objection: {
          raisedBy: user._id,
          raisedAt: now,
          reason,
          evidenceIds: args.evidenceIds,
          status: "pending",
        },
      },
    });

    return { success: true };
  },
});

export const enforceDisputeJudgment = mutation({
  args: {
    disputeId: v.id("disputes"),
    notes: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== "admin" && user.role !== "moderator") {
      throw new Error("Only staff can enforce a dispute judgment.");
    }

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute not found");
    if (!dispute.resolution) throw new Error("No judgment has been issued.");
    if (dispute.status === "resolved" || dispute.status === "closed") {
      throw new Error("This dispute is already closed.");
    }

    const now = Date.now();
    await transitionDisputeStage(ctx, {
      dispute,
      actor: user,
      toStatus: "resolved",
      title: "Judgment enforced",
      description: args.notes,
      extraPatch: {
        resolvedAt: now,
        enforcedAt: now,
        stageDeadlineAt: undefined,
      },
    });

    const releaseDisputeFunds =
      api.api.disputes.actions.releaseDisputeFunds as unknown as FunctionReference<"action">;
    await ctx.scheduler.runAfter(0, releaseDisputeFunds, {
      disputeId: args.disputeId,
    });

    return { success: true };
  },
});

/**
 * Assign dispute to moderator
 */
export const assignModerator = mutation({
  args: {
    disputeId: v.id("disputes"),
    moderatorId: v.id("users"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Only admins and moderators can assign
    if (user.role !== "admin" && user.role !== "moderator") {
      throw new Error("Unauthorized");
    }

    // Moderators may only claim a dispute for themselves; admins may assign to any moderator/admin.
    if (user.role === "moderator" && args.moderatorId !== user._id) {
      throw new Error("Moderators can only assign disputes to themselves.");
    }

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) {
      throw new Error("Dispute not found");
    }

    const assignee = await ctx.db.get(args.moderatorId);
    if (!assignee || (assignee.role !== "moderator" && assignee.role !== "admin")) {
      throw new Error("Assignee must be a moderator or admin");
    }

    // Assign moderator
    const now = Date.now();
    await ctx.db.patch(args.disputeId, {
      assignedModeratorId: args.moderatorId,
      assignedAt: now,
      status: "under_review",
      stage: "under_review",
      stageStartedAt: now,
      stageDeadlineAt: undefined,
      updatedAt: now,
    });
    await recordDisputeStageEvent(ctx, {
      disputeId: args.disputeId,
      projectId: dispute.projectId,
      actorId: user._id,
      actorRole: user.role,
      eventType: "dispute_assigned",
      fromStatus: dispute.status,
      toStatus: "under_review",
      title: "Case assigned for platform review",
      description: `Assigned to ${assignee.name ?? "a moderator"}.`,
      createdAt: now,
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "dispute_assigned",
      actionType: user.role === "admin" ? "admin" : "dispute",
      actorId: user._id,
      actorRole: user.role,
      targetType: "dispute",
      targetId: args.disputeId,
      details: {
        moderatorId: args.moderatorId,
        assigneeRole: assignee.role,
      },
      createdAt: now,
    });

    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [args.moderatorId],
      title: "Dispute assigned",
      message: "A dispute has been assigned to you for review.",
      type: "dispute",
      data: { disputeId: args.disputeId, projectId: dispute.projectId },
    });

    await (
      ctx.scheduler.runAfter as (
        delayMs: number,
        fn: unknown,
        fnArgs: { disputeId: typeof args.disputeId }
      ) => Promise<unknown>
    )(0, internalAny.disputes.staffEmails.sendDisputeAssignmentEmailInternal, {
      disputeId: args.disputeId,
    });

    return { success: true };
  },
});

/**
 * Resolve a dispute (moderator/admin only)
 */
export const resolveDispute = mutation({
  args: {
    disputeId: v.id("disputes"),
    decision: v.union(
      v.literal("client_favor"),
      v.literal("freelancer_favor"),
      v.literal("partial"),
      v.literal("replacement")
    ),
    resolutionAmount: v.optional(v.number()),
    notes: v.string(),
    clientMessage: v.optional(v.string()),
    freelancerMessage: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Only moderators and admins can resolve
    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error("Unauthorized - only moderators and admins can resolve disputes");
    }

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) {
      throw new Error("Dispute not found");
    }

    // Check if already resolved
    if (dispute.status === "resolved" || dispute.status === "closed") {
      throw new Error("Dispute already resolved");
    }

    // Get project
    const project = await ctx.db.get(dispute.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const now = Date.now();

    let resolutionAmountCents: number | undefined;
    if (args.decision === "partial") {
      if (args.resolutionAmount == null) {
        throw new Error("Resolution amount is required for partial decisions");
      }
      resolutionAmountCents = assertNonNegativeIntegerCents(
        Math.round(args.resolutionAmount),
        "Resolution amount"
      );
      if (resolutionAmountCents <= 0) {
        throw new Error("Resolution amount must be greater than zero");
      }
      const maxResolutionCents = await disputeNetScopeCents(ctx, project, dispute);
      if (resolutionAmountCents > maxResolutionCents) {
        throw new Error("Resolution amount cannot exceed the disputed escrow amount");
      }
    }

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    const releaseDisputeFunds =
      api.api.disputes.actions.releaseDisputeFunds as unknown as FunctionReference<"action">;
    const sendSelectReplacementClientEmail = api.api.projects.actions
      .sendSelectReplacementClientEmail as unknown as FunctionReference<
      "action",
      "internal"
    >;

    // Build personalized messages for each party if not explicitly provided
    const decisionClientMsg = args.clientMessage?.trim() ||
      (args.decision === "client_favor"
        ? `The dispute for "${project.intakeForm.title}" was resolved in your favor. Your funds are reserved for this hire and you can select replacement freelancer(s) to continue.`
        : args.decision === "freelancer_favor"
        ? `The dispute for "${project.intakeForm.title}" was not resolved in your favor. The freelancer's position was upheld.`
        : args.decision === "partial"
        ? `The dispute for "${project.intakeForm.title}" was partially resolved. A portion of the funds has been redistributed. ${args.notes}`
        : `The dispute for "${project.intakeForm.title}" resulted in a replacement decision. A new freelancer will be matched.`);

    const decisionFreelancerMsg = args.freelancerMessage?.trim() ||
      (args.decision === "freelancer_favor"
        ? `The dispute for "${project.intakeForm.title}" was resolved in your favor. ${args.notes}`
        : args.decision === "client_favor"
        ? `The dispute for "${project.intakeForm.title}" was not resolved in your favor. The client's position was upheld.`
        : args.decision === "partial"
        ? `The dispute for "${project.intakeForm.title}" was partially resolved. A portion of the funds has been redistributed. ${args.notes}`
        : `The dispute for "${project.intakeForm.title}" resulted in a replacement decision. You have been removed from this hire.`);

    // Update dispute
    await ctx.db.patch(args.disputeId, {
      status: "resolved",
      stage: "resolved",
      stageStartedAt: now,
      stageDeadlineAt: undefined,
      resolution: {
        decision: args.decision,
        resolutionAmount: resolutionAmountCents,
        notes: args.notes,
        clientMessage: decisionClientMsg,
        freelancerMessage: decisionFreelancerMsg,
        resolvedBy: user._id,
        resolvedAt: now,
      },
      resolvedAt: now,
      enforcedAt: now,
      updatedAt: now,
    });
    await recordDisputeStageEvent(ctx, {
      disputeId: args.disputeId,
      projectId: dispute.projectId,
      actorId: user._id,
      actorRole: user.role,
      eventType: "dispute_resolved",
      fromStatus: dispute.status,
      toStatus: "resolved",
      title: "Dispute resolved",
      description: args.notes,
      metadata: { decision: args.decision, resolutionAmount: resolutionAmountCents },
      createdAt: now,
    });

    // Update project status
    const isPartialTeamClientFavor =
      args.decision === "client_favor" &&
      (project.matchedFreelancerIds?.length ?? 0) > 0 &&
      !!dispute.disputedFreelancerIds &&
      dispute.disputedFreelancerIds.length > 0 &&
      dispute.disputedFreelancerIds.length < (project.matchedFreelancerIds?.length ?? 0);

    let newProjectStatus: Doc<"projects">["status"] = "disputed";
    if (args.decision === "replacement") {
      newProjectStatus = "matching";
    } else if (args.decision === "client_favor") {
      newProjectStatus = isPartialTeamClientFavor ? "in_progress" : "matching";
    } else if (args.decision === "partial") {
      newProjectStatus = "in_progress";
    } else {
      // Freelancer favor — work continues; unreleased escrow stays until normal monthly approval flow
      newProjectStatus = "in_progress";
    }

    const exclusionPatch: {
      permanentlyExcludedFreelancerIds?: Doc<"users">["_id"][];
    } = {};
    if (args.decision === "client_favor" || args.decision === "replacement") {
      const removed = freelancersRemovedForPermanentExclusion(project, dispute);
      if (removed.length > 0) {
        exclusionPatch.permanentlyExcludedFreelancerIds = mergePermanentExclusions(
          project.permanentlyExcludedFreelancerIds,
          removed
        );
      }
    }

    await ctx.db.patch(dispute.projectId, {
      status: newProjectStatus,
      updatedAt: now,
      ...exclusionPatch,
    });

    await ctx.scheduler.runAfter(0, releaseDisputeFunds, {
      disputeId: args.disputeId,
    });

    // Remove freelancers from project when ruling is against them (no suspension)
    if (args.decision === "client_favor" || args.decision === "replacement") {
      const isTeamProject = (project.matchedFreelancerIds?.length ?? 0) > 0;
      const isPartialTeam =
        isTeamProject &&
        dispute.disputedFreelancerIds &&
        dispute.disputedFreelancerIds.length > 0 &&
        dispute.disputedFreelancerIds.length < (project.matchedFreelancerIds?.length ?? 0);

      if (isPartialTeam && dispute.disputedFreelancerIds) {
        // Partial team dispute: remove only the disputed members, keep remaining
        const disputed = dispute.disputedFreelancerIds;
        const remainingIds = (project.matchedFreelancerIds ?? []).filter(
          (id) => !disputed.includes(id)
        );
        const nextSelected = (project.selectedFreelancerIds ?? []).filter(
          (id) => !disputed.includes(id)
        );
        await ctx.db.patch(dispute.projectId, {
          matchedFreelancerIds: remainingIds,
          status: "in_progress",
          selectedFreelancerIds:
            nextSelected.length > 0 ? nextSelected : undefined,
          updatedAt: now,
        } as any);
      } else {
        // Single hire or full team: remove all matched freelancers from the project
        if (isTeamProject) {
          await ctx.db.patch(dispute.projectId, {
            matchedFreelancerIds: [],
            selectedFreelancerIds: undefined,
            selectedFreelancerId: undefined,
            updatedAt: now,
          } as any);
        } else {
          await ctx.db.patch(dispute.projectId, {
            matchedFreelancerId: undefined,
            selectedFreelancerId: undefined,
            updatedAt: now,
          } as any);
        }
      }
    }

    if (args.decision === "client_favor" || args.decision === "replacement") {
      const teamLenPreRemove = (project.matchedFreelancerIds?.length ?? 0);
      const isPartialTeamResolve =
        teamLenPreRemove > 0 &&
        (dispute.disputedFreelancerIds?.length ?? 0) > 0 &&
        dispute.disputedFreelancerIds!.length < teamLenPreRemove;
      await ensureReplacementMatchingProjectFields(ctx, {
        projectId: dispute.projectId,
        disputeId: args.disputeId,
        now,
        partialDisputedFreelancerIds:
          isPartialTeamResolve && dispute.disputedFreelancerIds
            ? dispute.disputedFreelancerIds
            : undefined,
      });
    }

    if (args.decision === "client_favor" || args.decision === "replacement") {
      const removedSweep = freelancersRemovedForPermanentExclusion(project, dispute);
      if (removedSweep.length > 0) {
        await ctx.runMutation(
          internalApi.projects.mutations.sweepFreelancersRemovedFromProjectInternal,
          {
            projectId: dispute.projectId,
            freelancerIds: removedSweep,
          }
        );
      }
    }

    const recipientFreelancerIds = getDisputeRecipientFreelancerIds(project, dispute);

    // Send personalized notifications to each party
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [project.clientId],
      title: "Dispute resolved",
      message: decisionClientMsg,
      type: "dispute",
      data: { disputeId: args.disputeId, projectId: dispute.projectId },
    });
    await (
      ctx.scheduler.runAfter as (
        delayMs: number,
        fn: unknown,
        fnArgs: Record<string, unknown>
      ) => Promise<unknown>
    )(0, internalAny.disputes.staffEmails.sendDisputePartyEmailsInternal, {
      userIds: [project.clientId],
      subject: `[49GIG] Dispute resolved: ${project.intakeForm.title ?? "Hire"}`,
      headline: "Dispute resolved",
      bodyText: decisionClientMsg,
      disputeId: args.disputeId,
    });
    if (args.decision === "client_favor" || args.decision === "replacement") {
      await ctx.scheduler.runAfter(0, sendSelectReplacementClientEmail, {
        projectId: dispute.projectId,
      });
    }

    const uniqueFreelancerIds = recipientFreelancerIds;

    if (
      (args.decision === "client_favor" || args.decision === "replacement") &&
      uniqueFreelancerIds.length > 0
    ) {
      const removedIds = freelancersRemovedForPermanentExclusion(project, dispute);
      const removedSet = new Set(removedIds.map(String));
      const isPartialTeamResolve =
        (project.matchedFreelancerIds?.length ?? 0) > 0 &&
        (dispute.disputedFreelancerIds?.length ?? 0) > 0 &&
        (dispute.disputedFreelancerIds?.length ?? 0) <
          (project.matchedFreelancerIds?.length ?? 0);

      const ruledAgainst = uniqueFreelancerIds.filter((id) => removedSet.has(String(id)));
      if (ruledAgainst.length > 0) {
        await ctx.scheduler.runAfter(0, sendSystemNotification, {
          userIds: ruledAgainst,
          title: "Dispute resolved",
          message: decisionFreelancerMsg,
          type: "dispute",
          data: { disputeId: args.disputeId, projectId: dispute.projectId },
        });
        await (
          ctx.scheduler.runAfter as (
            delayMs: number,
            fn: unknown,
            fnArgs: Record<string, unknown>
          ) => Promise<unknown>
        )(0, internalAny.disputes.staffEmails.sendDisputePartyEmailsInternal, {
          userIds: ruledAgainst,
          subject: `[49GIG] Dispute resolved: ${project.intakeForm.title ?? "Hire"}`,
          headline: "Dispute resolved",
          bodyText: decisionFreelancerMsg,
          disputeId: args.disputeId,
        });
      }

      if (isPartialTeamResolve) {
        const remainingNotify = uniqueFreelancerIds.filter(
          (id) => !removedSet.has(String(id))
        );
        if (remainingNotify.length > 0) {
          const partialMsg = `A dispute on "${project.intakeForm.title}" was resolved. You remain on this hire while the client replaces removed team members.`;
          await ctx.scheduler.runAfter(0, sendSystemNotification, {
            userIds: remainingNotify,
            title: "Dispute resolved",
            message: partialMsg,
            type: "dispute",
            data: { disputeId: args.disputeId, projectId: dispute.projectId },
          });
          await (
            ctx.scheduler.runAfter as (
              delayMs: number,
              fn: unknown,
              fnArgs: Record<string, unknown>
            ) => Promise<unknown>
          )(0, internalAny.disputes.staffEmails.sendDisputePartyEmailsInternal, {
            userIds: remainingNotify,
            subject: `[49GIG] Dispute resolved: ${project.intakeForm.title ?? "Hire"}`,
            headline: "Dispute resolved",
            bodyText: partialMsg,
            disputeId: args.disputeId,
          });
        }
      }
    } else if (uniqueFreelancerIds.length > 0) {
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: uniqueFreelancerIds,
        title: "Dispute resolved",
        message: decisionFreelancerMsg,
        type: "dispute",
        data: { disputeId: args.disputeId, projectId: dispute.projectId },
      });
      await (
        ctx.scheduler.runAfter as (
          delayMs: number,
          fn: unknown,
          fnArgs: Record<string, unknown>
        ) => Promise<unknown>
      )(0, internalAny.disputes.staffEmails.sendDisputePartyEmailsInternal, {
        userIds: uniqueFreelancerIds,
        subject: `[49GIG] Dispute resolved: ${project.intakeForm.title ?? "Hire"}`,
        headline: "Dispute resolved",
        bodyText: decisionFreelancerMsg,
        disputeId: args.disputeId,
      });
    }

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "dispute_resolved",
      actionType: user.role === "admin" ? "admin" : "dispute",
      actorId: user._id,
      actorRole: user.role,
      targetType: "dispute",
      targetId: args.disputeId,
      details: {
        decision: args.decision,
        resolutionAmount: resolutionAmountCents,
      },
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * Internal: resolve a dispute without auth (for automated resolution from actions).
 * Only callable from server code (e.g. attemptAutomatedResolution).
 */
export const resolveDisputeInternal = internalMutation({
  args: {
    disputeId: v.id("disputes"),
    decision: v.union(
      v.literal("client_favor"),
      v.literal("freelancer_favor"),
      v.literal("partial"),
      v.literal("replacement")
    ),
    resolutionAmount: v.optional(v.number()),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) {
      throw new Error("Dispute not found");
    }
    if (dispute.status === "resolved" || dispute.status === "closed") {
      throw new Error("Dispute already resolved");
    }

    const project = await ctx.db.get(dispute.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const now = Date.now();

    let resolutionAmountCents: number | undefined;
    if (args.decision === "partial") {
      if (args.resolutionAmount == null) {
        throw new Error("Resolution amount is required for partial decisions");
      }
      resolutionAmountCents = assertNonNegativeIntegerCents(
        Math.round(args.resolutionAmount),
        "Resolution amount"
      );
      if (resolutionAmountCents <= 0) {
        throw new Error("Resolution amount must be greater than zero");
      }
      const maxResolutionCents = await disputeNetScopeCents(ctx, project, dispute);
      if (resolutionAmountCents > maxResolutionCents) {
        throw new Error("Resolution amount cannot exceed the disputed escrow amount");
      }
    }

    const releaseDisputeFunds =
      api.api.disputes.actions.releaseDisputeFunds as unknown as FunctionReference<"action">;

    await ctx.db.patch(args.disputeId, {
      status: "resolved",
      stage: "resolved",
      stageStartedAt: now,
      stageDeadlineAt: undefined,
      resolution: {
        decision: args.decision,
        resolutionAmount: resolutionAmountCents,
        notes: args.notes,
        resolvedAt: now,
      },
      resolvedAt: now,
      enforcedAt: now,
      updatedAt: now,
    });
    await recordDisputeStageEvent(ctx, {
      disputeId: args.disputeId,
      projectId: dispute.projectId,
      actorRole: "system",
      eventType: "dispute_resolved",
      fromStatus: dispute.status,
      toStatus: "resolved",
      title: "Dispute resolved automatically",
      description: args.notes,
      metadata: { decision: args.decision, resolutionAmount: resolutionAmountCents },
      createdAt: now,
    });

    const isPartialTeamClientFavorInternal =
      args.decision === "client_favor" &&
      (project.matchedFreelancerIds?.length ?? 0) > 0 &&
      !!dispute.disputedFreelancerIds &&
      dispute.disputedFreelancerIds.length > 0 &&
      dispute.disputedFreelancerIds.length < (project.matchedFreelancerIds?.length ?? 0);

    let newProjectStatus: Doc<"projects">["status"] = "disputed";
    if (args.decision === "replacement") {
      newProjectStatus = "matching";
    } else if (args.decision === "client_favor") {
      newProjectStatus = isPartialTeamClientFavorInternal ? "in_progress" : "matching";
    } else if (args.decision === "partial") {
      newProjectStatus = "in_progress";
    } else {
      newProjectStatus = "in_progress";
    }

    const exclusionPatch: {
      permanentlyExcludedFreelancerIds?: Doc<"users">["_id"][];
    } = {};
    if (args.decision === "client_favor" || args.decision === "replacement") {
      const removed = freelancersRemovedForPermanentExclusion(project, dispute);
      if (removed.length > 0) {
        exclusionPatch.permanentlyExcludedFreelancerIds = mergePermanentExclusions(
          project.permanentlyExcludedFreelancerIds,
          removed
        );
      }
    }

    await ctx.db.patch(dispute.projectId, {
      status: newProjectStatus,
      updatedAt: now,
      ...exclusionPatch,
    });

    await ctx.scheduler.runAfter(0, releaseDisputeFunds, {
      disputeId: args.disputeId,
    });

    if (args.decision === "client_favor" || args.decision === "replacement") {
      const isTeamProject = (project.matchedFreelancerIds?.length ?? 0) > 0;
      const isPartialTeam =
        isTeamProject &&
        dispute.disputedFreelancerIds &&
        dispute.disputedFreelancerIds.length > 0 &&
        dispute.disputedFreelancerIds.length < (project.matchedFreelancerIds?.length ?? 0);

      if (isPartialTeam && dispute.disputedFreelancerIds) {
        const disputed = dispute.disputedFreelancerIds;
        const remainingIds = (project.matchedFreelancerIds ?? []).filter(
          (id) => !disputed.includes(id)
        );
        const nextSelected = (project.selectedFreelancerIds ?? []).filter(
          (id) => !disputed.includes(id)
        );
        await ctx.db.patch(dispute.projectId, {
          matchedFreelancerIds: remainingIds,
          status: "in_progress",
          selectedFreelancerIds:
            nextSelected.length > 0 ? nextSelected : undefined,
          updatedAt: now,
        } as any);
      } else {
        if (isTeamProject) {
          await ctx.db.patch(dispute.projectId, {
            matchedFreelancerIds: [],
            selectedFreelancerIds: undefined,
            selectedFreelancerId: undefined,
            updatedAt: now,
          } as any);
        } else {
          await ctx.db.patch(dispute.projectId, {
            matchedFreelancerId: undefined,
            selectedFreelancerId: undefined,
            updatedAt: now,
          } as any);
        }
      }
    }

    if (args.decision === "client_favor" || args.decision === "replacement") {
      const teamLenPreRemove = (project.matchedFreelancerIds?.length ?? 0);
      const isPartialTeamResolve =
        teamLenPreRemove > 0 &&
        (dispute.disputedFreelancerIds?.length ?? 0) > 0 &&
        dispute.disputedFreelancerIds!.length < teamLenPreRemove;
      await ensureReplacementMatchingProjectFields(ctx, {
        projectId: dispute.projectId,
        disputeId: args.disputeId,
        now,
        partialDisputedFreelancerIds:
          isPartialTeamResolve && dispute.disputedFreelancerIds
            ? dispute.disputedFreelancerIds
            : undefined,
      });
    }

    if (args.decision === "client_favor" || args.decision === "replacement") {
      const removedSweep = freelancersRemovedForPermanentExclusion(project, dispute);
      if (removedSweep.length > 0) {
        await ctx.runMutation(
          internalApi.projects.mutations.sweepFreelancersRemovedFromProjectInternal,
          {
            projectId: dispute.projectId,
            freelancerIds: removedSweep,
          }
        );
      }
    }

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    const sendSelectReplacementClientEmail = api.api.projects.actions
      .sendSelectReplacementClientEmail as unknown as FunctionReference<
      "action",
      "internal"
    >;

    const decisionClientMsg =
      args.decision === "client_favor"
        ? `The dispute for "${project.intakeForm.title}" was resolved in your favor. Your funds are reserved for this hire and you can select replacement freelancer(s) to continue.`
        : args.decision === "freelancer_favor"
          ? `The dispute for "${project.intakeForm.title}" was not resolved in your favor.`
          : args.decision === "partial"
            ? `The dispute for "${project.intakeForm.title}" was partially resolved. ${args.notes}`
            : `The dispute for "${project.intakeForm.title}" resulted in a replacement decision.`;

    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [project.clientId],
      title: "Dispute resolved",
      message: decisionClientMsg,
      type: "dispute",
      data: { disputeId: args.disputeId, projectId: dispute.projectId },
    });
    await (
      ctx.scheduler.runAfter as (
        delayMs: number,
        fn: unknown,
        fnArgs: Record<string, unknown>
      ) => Promise<unknown>
    )(0, internalAny.disputes.staffEmails.sendDisputePartyEmailsInternal, {
      userIds: [project.clientId],
      subject: `[49GIG] Dispute resolved: ${project.intakeForm.title ?? "Hire"}`,
      headline: "Dispute resolved",
      bodyText: decisionClientMsg,
      disputeId: args.disputeId,
    });
    if (args.decision === "client_favor" || args.decision === "replacement") {
      await ctx.scheduler.runAfter(0, sendSelectReplacementClientEmail, {
        projectId: dispute.projectId,
      });
    }

    const decisionFreelancerMsg =
      args.decision === "freelancer_favor"
        ? `The dispute for "${project.intakeForm.title}" was resolved in your favor. ${args.notes}`
        : args.decision === "client_favor"
          ? `The dispute for "${project.intakeForm.title}" was not resolved in your favor. The client's position was upheld.`
          : args.decision === "partial"
            ? `The dispute for "${project.intakeForm.title}" was partially resolved. ${args.notes}`
            : `The dispute for "${project.intakeForm.title}" resulted in a replacement decision. You have been removed from this hire.`;

    const uniqueFreelancerIds = getDisputeRecipientFreelancerIds(project, dispute);

    if (
      (args.decision === "client_favor" || args.decision === "replacement") &&
      uniqueFreelancerIds.length > 0
    ) {
      const removedIds = freelancersRemovedForPermanentExclusion(project, dispute);
      const removedSet = new Set(removedIds.map(String));
      const isPartialTeamResolve =
        (project.matchedFreelancerIds?.length ?? 0) > 0 &&
        (dispute.disputedFreelancerIds?.length ?? 0) > 0 &&
        (dispute.disputedFreelancerIds?.length ?? 0) <
          (project.matchedFreelancerIds?.length ?? 0);

      const ruledAgainst = uniqueFreelancerIds.filter((id) => removedSet.has(String(id)));
      if (ruledAgainst.length > 0) {
        await ctx.scheduler.runAfter(0, sendSystemNotification, {
          userIds: ruledAgainst,
          title: "Dispute resolved",
          message: decisionFreelancerMsg,
          type: "dispute",
          data: { disputeId: args.disputeId, projectId: dispute.projectId },
        });
        await (
          ctx.scheduler.runAfter as (
            delayMs: number,
            fn: unknown,
            fnArgs: Record<string, unknown>
          ) => Promise<unknown>
        )(0, internalAny.disputes.staffEmails.sendDisputePartyEmailsInternal, {
          userIds: ruledAgainst,
          subject: `[49GIG] Dispute resolved: ${project.intakeForm.title ?? "Hire"}`,
          headline: "Dispute resolved",
          bodyText: decisionFreelancerMsg,
          disputeId: args.disputeId,
        });
      }
      if (isPartialTeamResolve) {
        const remainingNotify = uniqueFreelancerIds.filter(
          (id) => !removedSet.has(String(id))
        );
        if (remainingNotify.length > 0) {
          const partialMsg = `A dispute on "${project.intakeForm.title}" was resolved. You remain on this hire while the client replaces removed team members.`;
          await ctx.scheduler.runAfter(0, sendSystemNotification, {
            userIds: remainingNotify,
            title: "Dispute resolved",
            message: partialMsg,
            type: "dispute",
            data: { disputeId: args.disputeId, projectId: dispute.projectId },
          });
          await (
            ctx.scheduler.runAfter as (
              delayMs: number,
              fn: unknown,
              fnArgs: Record<string, unknown>
            ) => Promise<unknown>
          )(0, internalAny.disputes.staffEmails.sendDisputePartyEmailsInternal, {
            userIds: remainingNotify,
            subject: `[49GIG] Dispute resolved: ${project.intakeForm.title ?? "Hire"}`,
            headline: "Dispute resolved",
            bodyText: partialMsg,
            disputeId: args.disputeId,
          });
        }
      }
    } else if (uniqueFreelancerIds.length > 0) {
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: uniqueFreelancerIds,
        title: "Dispute resolved",
        message: decisionFreelancerMsg,
        type: "dispute",
        data: { disputeId: args.disputeId, projectId: dispute.projectId },
      });
      await (
        ctx.scheduler.runAfter as (
          delayMs: number,
          fn: unknown,
          fnArgs: Record<string, unknown>
        ) => Promise<unknown>
      )(0, internalAny.disputes.staffEmails.sendDisputePartyEmailsInternal, {
        userIds: uniqueFreelancerIds,
        subject: `[49GIG] Dispute resolved: ${project.intakeForm.title ?? "Hire"}`,
        headline: "Dispute resolved",
        bodyText: decisionFreelancerMsg,
        disputeId: args.disputeId,
      });
    }

    return { success: true };
  },
});

export const processDisputeDeadlineInternal = internalMutation({
  args: {
    disputeId: v.id("disputes"),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute || !disputeIsActive(dispute.status)) {
      return { processed: false as const };
    }

    const project = await ctx.db.get(dispute.projectId);
    if (!project) return { processed: false as const };

    if (dispute.status === "negotiation") {
      const deadline = dispute.negotiationDeadlineAt ?? dispute.stageDeadlineAt;
      if (!deadline || deadline > args.now) return { processed: false as const };
      const policy = getDisputeReasonPolicy(dispute.type);
      const sendSystemNotification =
        api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
          "action",
          "internal"
        >;
      await transitionDisputeStage(ctx, {
        dispute,
        toStatus: "awaiting_party_evidence",
        title: "Negotiation window ended",
        description:
          "The case moved to the evidence stage because the direct negotiation window expired.",
        stageDeadlineAt: deadlineFromHours(args.now, policy.evidenceHours),
        extraPatch: {
          evidenceDeadlineAt: deadlineFromHours(args.now, policy.evidenceHours),
          nonCooperationFlags: [
            ...(dispute.nonCooperationFlags ?? []),
            "negotiation_deadline_expired",
          ],
        },
      });
      const recipients = getDisputePartyUserIds(project, dispute);
      if (recipients.length > 0) {
        await ctx.scheduler.runAfter(0, sendSystemNotification, {
          userIds: recipients,
          title: "Dispute evidence window opened",
          message: `Negotiation ended for ${project.intakeForm.title}. Please submit evidence before the review deadline.`,
          type: "dispute",
          data: { disputeId: args.disputeId, projectId: dispute.projectId },
        });
      }
      return { processed: true as const, status: "awaiting_party_evidence" as const };
    }

    if (dispute.status === "awaiting_party_evidence") {
      const deadline = dispute.evidenceDeadlineAt ?? dispute.stageDeadlineAt;
      if (!deadline || deadline > args.now) return { processed: false as const };
      const sendSystemNotification =
        api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
          "action",
          "internal"
        >;
      await transitionDisputeStage(ctx, {
        dispute,
        toStatus: "under_review",
        title: "Evidence window closed",
        description: "The evidence window ended and the case is now ready for staff review.",
        extraPatch: {
          nonCooperationFlags: [
            ...(dispute.nonCooperationFlags ?? []),
            "evidence_deadline_expired",
          ],
        },
      });
      const recipients = getDisputePartyUserIds(project, dispute);
      if (recipients.length > 0) {
        await ctx.scheduler.runAfter(0, sendSystemNotification, {
          userIds: recipients,
          title: "Dispute evidence window closed",
          message: `The evidence window closed for ${project.intakeForm.title}. 49GIG staff will review the case.`,
          type: "dispute",
          data: { disputeId: args.disputeId, projectId: dispute.projectId },
        });
      }
      return { processed: true as const, status: "under_review" as const };
    }

    if (dispute.status === "objection_window") {
      const deadline = dispute.objectionWindowEndsAt ?? dispute.stageDeadlineAt;
      if (!deadline || deadline > args.now) return { processed: false as const };
      if (!dispute.resolution) return { processed: false as const };

      await ctx.db.patch(args.disputeId, {
        status: "resolved",
        stage: "resolved",
        stageStartedAt: args.now,
        stageDeadlineAt: undefined,
        resolvedAt: args.now,
        enforcedAt: args.now,
        updatedAt: args.now,
      });
      await recordDisputeStageEvent(ctx, {
        disputeId: args.disputeId,
        projectId: dispute.projectId,
        actorRole: "system",
        eventType: "dispute_judgment_auto_enforced",
        fromStatus: dispute.status,
        toStatus: "resolved",
        title: "Judgment automatically enforced",
        description: "The objection window closed with no accepted objection.",
        createdAt: args.now,
      });

      const releaseDisputeFunds =
        api.api.disputes.actions.releaseDisputeFunds as unknown as FunctionReference<"action">;
      const sendSystemNotification =
        api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
          "action",
          "internal"
        >;
      await ctx.scheduler.runAfter(0, releaseDisputeFunds, {
        disputeId: args.disputeId,
      });
      const recipients = getDisputePartyUserIds(project, dispute);
      if (recipients.length > 0) {
        await ctx.scheduler.runAfter(0, sendSystemNotification, {
          userIds: recipients,
          title: "Dispute judgment enforced",
          message: `The objection window closed and the judgment for ${project.intakeForm.title} has been enforced.`,
          type: "dispute",
          data: { disputeId: args.disputeId, projectId: dispute.projectId },
        });
      }
      return { processed: true as const, status: "resolved" as const };
    }

    if (dispute.status === "appeal_review") {
      const deadline = dispute.appealWindowEndsAt ?? dispute.stageDeadlineAt;
      if (!deadline || deadline > args.now) return { processed: false as const };
      await transitionDisputeStage(ctx, {
        dispute,
        toStatus: "under_review",
        title: "Appeal review due",
        description:
          "The objection review deadline has passed. Staff should accept or reject the objection.",
      });
      return { processed: true as const, status: "under_review" as const };
    }

    return { processed: false as const };
  },
});

export const backfillProfessionalDisputeLifecycleInternal = internalMutation({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = Math.min(args.limit ?? 100, 500);
    const disputes = await ctx.db.query("disputes").take(limit);
    let updated = 0;

    for (const dispute of disputes) {
      if (dispute.stage || dispute.track || dispute.requiredEvidenceChecklist) continue;
      const policy = getDisputeReasonPolicy(dispute.type);
      const isTerminal =
        dispute.status === "resolved" ||
        dispute.status === "closed" ||
        dispute.status === "cancelled";
      const stage = isTerminal
        ? dispute.status === "resolved"
          ? "resolved"
          : "closed"
        : dispute.status === "under_review" || dispute.status === "escalated"
          ? "under_review"
          : "negotiation";
      const stageStartedAt = dispute.updatedAt ?? dispute.createdAt ?? now;
      const negotiationDeadlineAt = deadlineFromHours(
        dispute.createdAt ?? now,
        policy.negotiationHours
      );

      await ctx.db.patch(dispute._id, {
        track: policy.fastTrackEligible ? "fast_track" : "normal",
        stage,
        stageStartedAt,
        stageDeadlineAt: isTerminal ? undefined : negotiationDeadlineAt,
        negotiationDeadlineAt: isTerminal ? undefined : negotiationDeadlineAt,
        evidenceDeadlineAt: isTerminal
          ? undefined
          : deadlineFromHours(stageStartedAt, policy.evidenceHours),
        fastTrackEligible: policy.fastTrackEligible,
        policyReasonLabel: policy.label,
        requiredEvidenceChecklist: policy.requiredEvidence.map((item) => ({
          id: item.id,
          owner: item.owner,
          label: item.label,
          description: item.description,
        })),
        updatedAt: now,
      });
      await recordDisputeStageEvent(ctx, {
        disputeId: dispute._id,
        projectId: dispute.projectId,
        actorRole: "system",
        eventType: "dispute_lifecycle_backfilled",
        toStatus: dispute.status,
        title: "Lifecycle fields backfilled",
        description: "Legacy dispute was made compatible with the professional case flow.",
        createdAt: now,
      });
      updated++;
    }

    return { updated };
  },
});

/**
 * Escalate dispute to admin
 */
export const escalateDispute = mutation({
  args: {
    disputeId: v.id("disputes"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.status !== "active") {
      throw new Error("Not authenticated");
    }

    // Only moderators can escalate
    if (user.role !== "moderator") {
      throw new Error("Unauthorized - only moderators can escalate disputes");
    }

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) {
      throw new Error("Dispute not found");
    }

    // Escalate
    await ctx.db.patch(args.disputeId, {
      status: "escalated",
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "dispute_escalated",
      actionType: "dispute",
      actorId: user._id,
      actorRole: user.role,
      targetType: "dispute",
      targetId: args.disputeId,
      details: {
        reason: args.reason,
      },
      createdAt: Date.now(),
    });

    const project = await ctx.db.get(dispute.projectId);
    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    if (project) {
      const partyIds = getDisputePartyUserIds(project, dispute).filter(
        (id) => String(id) !== String(user._id)
      );
      if (partyIds.length > 0) {
        await ctx.scheduler.runAfter(0, sendSystemNotification, {
          userIds: partyIds,
          title: "Dispute escalated",
          message: `A dispute on "${project.intakeForm.title}" was escalated for admin review.`,
          type: "dispute",
          data: { disputeId: args.disputeId, projectId: dispute.projectId },
        });
        await (
          ctx.scheduler.runAfter as (
            delayMs: number,
            fn: unknown,
            fnArgs: Record<string, unknown>
          ) => Promise<unknown>
        )(0, internalAny.disputes.staffEmails.sendDisputePartyEmailsInternal, {
          userIds: partyIds,
          subject: `[49GIG] Dispute escalated: ${project.intakeForm.title ?? "Hire"}`,
          headline: "Dispute escalated",
          bodyText: `A dispute on "${project.intakeForm.title}" was escalated for admin review.\n\nModerator note: ${args.reason}`,
          disputeId: args.disputeId,
        });
      }
    }

    await (
      ctx.scheduler.runAfter as (
        delayMs: number,
        fn: unknown,
        fnArgs: Record<string, unknown>
      ) => Promise<unknown>
    )(0, internalAny.disputes.staffEmails.sendDisputeEscalationAdminsInternal, {
      disputeId: args.disputeId,
      reason: args.reason,
    });

    return { success: true };
  },
});

/**
 * Close a resolved dispute
 */
export const closeDispute = mutation({
  args: {
    disputeId: v.id("disputes"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.status !== "active") {
      throw new Error("Not authenticated");
    }

    // Only admins and moderators can close
    if (user.role !== "admin" && user.role !== "moderator") {
      throw new Error("Unauthorized");
    }

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) {
      throw new Error("Dispute not found");
    }

    if (dispute.status !== "resolved") {
      throw new Error("Can only close resolved disputes");
    }

    await ctx.db.patch(args.disputeId, {
      status: "closed",
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "dispute_closed",
      actionType: user.role === "admin" ? "admin" : "dispute",
      actorId: user._id,
      actorRole: user.role,
      targetType: "dispute",
      targetId: args.disputeId,
      createdAt: Date.now(),
    });

    const project = await ctx.db.get(dispute.projectId);
    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    if (project) {
      const partyIds = getDisputePartyUserIds(project, dispute);
      if (partyIds.length > 0) {
        const msg = `The dispute on "${project.intakeForm.title}" has been closed by support.`;
        await ctx.scheduler.runAfter(0, sendSystemNotification, {
          userIds: partyIds,
          title: "Dispute closed",
          message: msg,
          type: "dispute",
          data: { disputeId: args.disputeId, projectId: dispute.projectId },
        });
        await (
          ctx.scheduler.runAfter as (
            delayMs: number,
            fn: unknown,
            fnArgs: Record<string, unknown>
          ) => Promise<unknown>
        )(0, internalAny.disputes.staffEmails.sendDisputePartyEmailsInternal, {
          userIds: partyIds,
          subject: `[49GIG] Dispute closed: ${project.intakeForm.title ?? "Hire"}`,
          headline: "Dispute closed",
          bodyText: msg,
          disputeId: args.disputeId,
        });
      }
    }

    return { success: true };
  },
});

/**
 * Cancel a dispute — only the initiator can cancel, and only while open or under_review.
 * The other party is notified of the cancellation.
 */
export const cancelDispute = mutation({
  args: {
    disputeId: v.id("disputes"),
    reason: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) throw new Error("Not authenticated");

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute not found");

    if (dispute.initiatorId !== user._id) {
      throw new Error("Only the dispute initiator can cancel this dispute");
    }

    if (!disputeIsActive(dispute.status)) {
      throw new Error("Only active disputes can be cancelled");
    }

    if (!args.reason.trim()) {
      throw new Error("A cancellation reason is required");
    }

    const now = Date.now();
    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;

    await ctx.db.patch(args.disputeId, {
      status: "cancelled",
      stage: dispute.stage,
      cancellationReason: args.reason.trim(),
      cancelledAt: now,
      cancelledBy: user._id,
      updatedAt: now,
    });
    await recordDisputeStageEvent(ctx, {
      disputeId: args.disputeId,
      projectId: dispute.projectId,
      actorId: user._id,
      actorRole: user.role === "freelancer" ? "freelancer" : "client",
      eventType: "dispute_cancelled",
      fromStatus: dispute.status,
      toStatus: "cancelled",
      title: "Dispute cancelled",
      description: args.reason.trim(),
      createdAt: now,
    });

    // Restore project status from "disputed" back to "in_progress"
    const project = await ctx.db.get(dispute.projectId);
    if (project && project.status === "disputed") {
      await ctx.db.patch(dispute.projectId, {
        status: "in_progress",
        updatedAt: now,
      });
    }

    const notifyIds =
      project
        ? getDisputePartyUserIds(project, dispute).filter(
            (id) => String(id) !== String(user._id)
          )
        : [];

    if (notifyIds.length > 0) {
      const cancelMsg = `The dispute has been cancelled by the ${dispute.initiatorRole} who initiated it.\n\nReason: ${args.reason.trim()}`;
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: notifyIds,
        title: "Dispute cancelled",
        message: cancelMsg.replace(/\n\n/g, " "),
        type: "dispute",
        data: { disputeId: args.disputeId, projectId: dispute.projectId },
      });
      await (
        ctx.scheduler.runAfter as (
          delayMs: number,
          fn: unknown,
          fnArgs: Record<string, unknown>
        ) => Promise<unknown>
      )(0, internalAny.disputes.staffEmails.sendDisputePartyEmailsInternal, {
        userIds: notifyIds,
        subject: `[49GIG] Dispute cancelled: ${project?.intakeForm.title ?? "Hire"}`,
        headline: "Dispute cancelled",
        bodyText: cancelMsg,
        disputeId: args.disputeId,
      });
    }

    await ctx.db.insert("auditLogs", {
      action: "dispute_cancelled",
      actionType: "dispute",
      actorId: user._id,
      actorRole: user.role,
      targetType: "dispute",
      targetId: args.disputeId,
      details: { reason: args.reason.trim() },
      createdAt: now,
    });

    return { success: true };
  },
});
