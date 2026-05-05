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
import { disputeNetScopeFreelancerNetCents } from "./lockingBasis";
import { getDisputeReasonPolicy } from "../../lib/dispute-flow";

const api = require("../_generated/api") as {
  api: {
    notifications: { actions: { sendSystemNotification: unknown } };
    disputes: { actions: { releaseDisputeFunds: unknown } };
    projects: { actions: { sendSelectReplacementClientEmail: unknown } };
    matching: {
      actions: {
        generateMatches: unknown;
        generateTeamMatches: unknown;
      };
    };
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
  "under_review",
  "escalated",
  // Legacy lifecycle statuses (still treated as active so legacy rows are not orphaned).
  "negotiation",
  "platform_intervention_requested",
  "awaiting_party_evidence",
  "judgment_issued",
  "objection_window",
  "appeal_review",
  "enforcing_resolution",
]);

function disputeIsActive(status: string) {
  return ACTIVE_DISPUTE_STATUSES.has(status);
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

/** Admins bypass; moderators must own the assignment. */
function assertAssignedStaffForDispute(
  user: Doc<"users">,
  dispute: Doc<"disputes">,
  actionDescription: string
): void {
  if (user.role === "admin") return;
  if (user.role !== "moderator") {
    throw new Error("Unauthorized — only admins and moderators can do this.");
  }
  if (!dispute.assignedModeratorId) {
    throw new Error(
      `Assign this dispute to a moderator before ${actionDescription}.`
    );
  }
  if (String(dispute.assignedModeratorId) !== String(user._id)) {
    throw new Error(`Only the assigned moderator can ${actionDescription}.`);
  }
}

function assertEnforcementWindow(dispute: Doc<"disputes">): void {
  if (dispute.status !== "resolved") {
    throw new Error("The dispute must have a recorded judgment before enforcement.");
  }
  if (dispute.resolutionExecutedAt != null) {
    throw new Error("Enforcement has already been finalized for this dispute.");
  }
}

async function appendDisputeEnforcementEvent(
  ctx: MutationCtx,
  args: {
    disputeId: Id<"disputes">;
    projectId: Id<"projects">;
    actorId: Id<"users">;
    kind: string;
    details?: unknown;
  }
) {
  await ctx.db.insert("disputeEnforcementEvents", {
    disputeId: args.disputeId,
    projectId: args.projectId,
    actorId: args.actorId,
    kind: args.kind,
    details: args.details,
    createdAt: Date.now(),
  });
}

/**
 * Initiate a dispute
 * Records client gross funding in dispute (escrow net + platform-fee portion). Unreleased escrow stays net in `project.escrowedAmount`.
 */
export const initiateDispute = mutation({
  args: {
    projectId: v.string(), // Accept string (e.g. from URL); normalized in handler
    monthlyCycleId: v.optional(v.string()),
    type: v.union(
      v.literal("deliverable_quality"),
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
            v.literal("deliverable"),
            v.literal("milestone_deliverable")
          ),
          messageId: v.optional(v.id("messages")),
          fileId: v.optional(v.id("_storage")),
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
    const monthlyCycleIdRaw = args.monthlyCycleId
      ? ctx.db.normalizeId("monthlyBillingCycles", args.monthlyCycleId)
      : undefined;
    const monthlyCycleId = monthlyCycleIdRaw ?? undefined;

    const storedType =
      args.type === "milestone_quality" ? "deliverable_quality" : args.type;

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
      "deliverable_quality",
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
      "deliverable_quality",
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

    // Check if dispute already exists for this project / billing period
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
    } else {
      const projectDispute = existingDisputes.find((d) => !d.monthlyCycleId);
      if (projectDispute) {
        throw new Error("An open dispute already exists for this project");
      }
    }

    const escrowNetWhole = Math.max(0, project.escrowedAmount ?? 0);
    const platformFeePct = await effectivePlatformFeePercentForProject(
      ctx,
      project.platformFee
    );

    /** Freelancer-net pool (cents) this dispute attaches to — cycle slice or full hire escrow net. */
    let basisPoolFreelancerNetCents: number;
    if (monthlyCycleDoc != null) {
      basisPoolFreelancerNetCents = Math.max(
        0,
        Math.round(monthlyCycleDoc.amountCents ?? 0)
      );
    } else {
      basisPoolFreelancerNetCents = Math.round(escrowNetWhole * 100);
    }

    const basisFreelancerNetUsd =
      basisPoolFreelancerNetCents > 0 ? basisPoolFreelancerNetCents / 100 : 0;

    // Partial team scope: only clients may pick specific members. Freelancer disputes are always initiator vs client
    // (economics: initiator's seat only when the hire has multiple matched freelancers).
    const teamMemberIds = project.matchedFreelancerIds ?? [];
    let disputedIdsUnique: Id<"users">[] | undefined;

    if (isFreelancer) {
      if (teamMemberIds.length > 1) {
        if (!teamMemberIds.includes(user._id)) {
          throw new Error("You are not a matched member of this team hire.");
        }
        disputedIdsUnique = [user._id];
      }
    } else if (isClient && args.disputedFreelancerIds && args.disputedFreelancerIds.length > 0) {
      if (teamMemberIds.length === 0) {
        throw new Error("Partial team scope is only for team hires.");
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
      teamMemberIds.length > 1 &&
      !!disputedIdsUnique &&
      disputedIdsUnique.length > 0 &&
      disputedIdsUnique.length < teamMemberIds.length;

    // Gross upper bounds: economics basis pool vs whole hire escrow held.
    const maxClientGrossForEconomicsBasis = escrowNetToClientLockedGross(
      basisFreelancerNetUsd,
      platformFeePct
    );
    const fullEscrowClientGross = escrowNetToClientLockedGross(
      escrowNetWhole,
      platformFeePct
    );

    let lockedAmount: number;
    if (isPartialTeamDispute && disputedIdsUnique) {
      const shareMap = await computeTeamPoolShareCentsByFreelancerId(
        ctx,
        projectId,
        teamMemberIds as Id<"users">[],
        project.teamBudgetBreakdown,
        basisPoolFreelancerNetCents
      );
      const disputedNetCents = sumShareCentsForFreelancers(
        shareMap,
        disputedIdsUnique
      );
      lockedAmount = escrowNetToClientLockedGross(disputedNetCents / 100, platformFeePct);
    } else {
      lockedAmount = maxClientGrossForEconomicsBasis;
    }
    lockedAmount = Math.min(
      lockedAmount,
      maxClientGrossForEconomicsBasis,
      fullEscrowClientGross
    );

    const now = Date.now();
    const policy = getDisputeReasonPolicy(storedType);

    // Create dispute (simplified lifecycle: open -> under_review -> resolved/cancelled).
    const disputeId = await ctx.db.insert("disputes", {
      projectId,
      monthlyCycleId,
      initiatorId: user._id,
      initiatorRole: user.role === "client" ? "client" : "freelancer",
      type: storedType,
      reason: args.reason,
      description: args.description,
      evidence: args.evidence || [],
      status: "open",
      stage: "under_review",
      stageStartedAt: now,
      policyReasonLabel: policy.label,
      lockedAmount,
      lockedEconomicsFreelancerNetPoolCents: basisPoolFreelancerNetCents,
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
      toStatus: "open",
      title: "Dispute opened",
      description:
        "The case is open for staff review. Use the project chat to communicate; staff will request more evidence here as needed.",
      metadata: {
        reasonType: storedType,
        reasonLabel: policy.label,
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
        type: storedType,
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
        v.literal("deliverable"),
        v.literal("milestone_deliverable")
      ),
      messageId: v.optional(v.id("messages")),
      fileId: v.optional(v.id("_storage")),
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
    evidenceRequestId: v.optional(v.id("disputeEvidenceRequests")),
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

    let evidenceRequest: Doc<"disputeEvidenceRequests"> | null = null;
    if (args.evidenceRequestId) {
      evidenceRequest = await ctx.db.get(args.evidenceRequestId);
      if (!evidenceRequest || evidenceRequest.disputeId !== args.disputeId) {
        throw new Error("Evidence request not found for this dispute.");
      }
      if (evidenceRequest.status !== "pending") {
        throw new Error("This evidence request is no longer accepting submissions.");
      }
      const allowed = evidenceRequest.requestedFromUserIds.some(
        (id) => String(id) === String(user._id)
      );
      if (!allowed) {
        throw new Error("You are not one of the parties asked to submit this evidence.");
      }
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
      evidenceRequestId: args.evidenceRequestId,
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

    if (evidenceRequest) {
      const fulfilled = Array.from(
        new Set([
          ...(evidenceRequest.fulfilledByUserIds ?? []).map(String),
          String(user._id),
        ])
      ) as Id<"users">[];
      const allFulfilled = evidenceRequest.requestedFromUserIds.every((id) =>
        fulfilled.some((f) => String(f) === String(id))
      );
      await ctx.db.patch(evidenceRequest._id, {
        fulfilledByUserIds: fulfilled,
        status: allFulfilled ? "fulfilled" : "pending",
        resolvedAt: allFulfilled ? now : evidenceRequest.resolvedAt,
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
      metadata: {
        evidenceId,
        checklistItemId: args.checklistItemId,
        evidenceRequestId: args.evidenceRequestId,
      },
      createdAt: now,
    });

    return { success: true, evidenceId };
  },
});

/**
 * Staff create a follow-up request asking specific dispute parties to upload evidence.
 * Free-form description; scope decides who is on the hook (client, freelancer, both, or specific freelancer ids).
 */
export const requestDisputeEvidence = mutation({
  args: {
    disputeId: v.id("disputes"),
    scope: v.union(
      v.literal("client"),
      v.literal("freelancer"),
      v.literal("both"),
      v.literal("specific")
    ),
    freelancerIds: v.optional(v.array(v.id("users"))),
    description: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== "admin" && user.role !== "moderator") {
      throw new Error("Only staff can request evidence.");
    }

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute not found");
    if (!disputeIsActive(dispute.status)) {
      throw new Error("Cannot request evidence on a closed dispute.");
    }

    const project = await ctx.db.get(dispute.projectId);
    if (!project) throw new Error("Project not found");

    const description = args.description.trim();
    if (!description) throw new Error("Describe what evidence you need.");
    if (description.length > 2000) {
      throw new Error("Evidence request description is too long.");
    }

    const partyClientId = project.clientId;
    const partyFreelancerIds: Id<"users">[] = (() => {
      if (project.matchedFreelancerIds && project.matchedFreelancerIds.length > 0) {
        return project.matchedFreelancerIds as Id<"users">[];
      }
      if (project.matchedFreelancerId) return [project.matchedFreelancerId as Id<"users">];
      return [];
    })();

    let recipients: Id<"users">[] = [];
    if (args.scope === "client") {
      recipients = [partyClientId];
    } else if (args.scope === "freelancer") {
      recipients = [...partyFreelancerIds];
    } else if (args.scope === "both") {
      recipients = [partyClientId, ...partyFreelancerIds];
    } else {
      const requested = args.freelancerIds ?? [];
      if (requested.length === 0) {
        throw new Error("Select at least one freelancer to ask.");
      }
      const allowed = new Set(partyFreelancerIds.map(String));
      for (const id of requested) {
        if (!allowed.has(String(id))) {
          throw new Error("One of the selected freelancers is not on this hire.");
        }
      }
      recipients = requested;
    }

    recipients = Array.from(new Set(recipients.map(String))) as Id<"users">[];
    if (recipients.length === 0) {
      throw new Error("No parties available to ask for evidence.");
    }

    const now = Date.now();
    const requestId = await ctx.db.insert("disputeEvidenceRequests", {
      disputeId: args.disputeId,
      projectId: dispute.projectId,
      requestedBy: user._id,
      requestedFromUserIds: recipients,
      scope: args.scope,
      description,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    await recordDisputeStageEvent(ctx, {
      disputeId: args.disputeId,
      projectId: dispute.projectId,
      actorId: user._id,
      actorRole: user.role,
      eventType: "dispute_evidence_requested",
      title: "Staff requested more evidence",
      description,
      metadata: {
        evidenceRequestId: requestId,
        scope: args.scope,
        recipients,
      },
      createdAt: now,
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: recipients,
      title: "Staff requested more evidence",
      message: `Please upload the requested evidence for "${project.intakeForm.title}" so the case can move forward.`,
      type: "dispute",
      data: { disputeId: args.disputeId, projectId: dispute.projectId, evidenceRequestId: requestId },
    });
    await (
      ctx.scheduler.runAfter as (
        delayMs: number,
        fn: unknown,
        fnArgs: Record<string, unknown>
      ) => Promise<unknown>
    )(0, internalAny.disputes.staffEmails.sendDisputePartyEmailsInternal, {
      userIds: recipients,
      subject: `[49GIG] Evidence requested: ${project.intakeForm.title ?? "Hire"}`,
      headline: "Staff requested more evidence",
      bodyText: `49GIG staff need additional evidence to resolve the dispute on "${project.intakeForm.title}".\n\nWhat staff are asking for:\n${description}\n\nUpload your evidence on the dispute page.`,
      disputeId: args.disputeId,
    });

    return { success: true, evidenceRequestId: requestId };
  },
});

/**
 * Staff cancel a pending evidence request (e.g. it was raised in error or no longer needed).
 */
export const cancelDisputeEvidenceRequest = mutation({
  args: {
    evidenceRequestId: v.id("disputeEvidenceRequests"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== "admin" && user.role !== "moderator") {
      throw new Error("Only staff can cancel evidence requests.");
    }

    const request = await ctx.db.get(args.evidenceRequestId);
    if (!request) throw new Error("Evidence request not found");
    if (request.status !== "pending") {
      throw new Error("This request is no longer pending.");
    }

    const now = Date.now();
    await ctx.db.patch(args.evidenceRequestId, {
      status: "cancelled",
      resolvedAt: now,
      updatedAt: now,
    });

    await recordDisputeStageEvent(ctx, {
      disputeId: request.disputeId,
      projectId: request.projectId,
      actorId: user._id,
      actorRole: user.role,
      eventType: "dispute_evidence_request_cancelled",
      title: "Evidence request cancelled",
      description: request.description,
      metadata: { evidenceRequestId: args.evidenceRequestId },
      createdAt: now,
    });

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
    partialFreelancerSharePercent: v.optional(v.number()),
    notes: v.string(),
    clientMessage: v.optional(v.string()),
    freelancerMessage: v.optional(v.string()),
    projectStatusAfterResolution: v.union(
      v.literal("draft"),
      v.literal("pending_funding"),
      v.literal("funded"),
      v.literal("matching"),
      v.literal("awaiting_freelancer"),
      v.literal("matched"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error("Unauthorized - only moderators and admins can resolve disputes");
    }

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) {
      throw new Error("Dispute not found");
    }

    if (dispute.status === "resolved" || dispute.status === "closed") {
      throw new Error("Dispute already resolved");
    }

    assertAssignedStaffForDispute(user, dispute, "record a judgment");

    const project = await ctx.db.get(dispute.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const now = Date.now();

    let resolutionAmountCents: number | undefined;
    let partialPercentRecorded: number | undefined;
    if (args.decision === "partial") {
      const scope = await disputeNetScopeFreelancerNetCents(ctx, project, dispute);
      const hasPct = args.partialFreelancerSharePercent != null;
      const hasAmt = args.resolutionAmount != null;
      if (hasPct && hasAmt) {
        throw new Error(
          "Provide either freelancer share (%) or exact freelancer payment (amount), not both."
        );
      }
      if (hasPct) {
        const p = args.partialFreelancerSharePercent!;
        if (!Number.isInteger(p) || p < 1 || p > 99) {
          throw new Error("Freelancer share must be a whole percent from 1 to 99.");
        }
        partialPercentRecorded = p;
        resolutionAmountCents = Math.floor((scope * p) / 100);
      } else if (hasAmt) {
        resolutionAmountCents = assertNonNegativeIntegerCents(
          Math.round(args.resolutionAmount!),
          "Resolution amount"
        );
      } else {
        throw new Error(
          "Partial judgment requires freelancer share (%) or freelancer net payment (cents)."
        );
      }
      if (resolutionAmountCents <= 0) {
        throw new Error("Freelancer payment from the split must be greater than zero.");
      }
      if (resolutionAmountCents > scope) {
        throw new Error("Resolution amount cannot exceed the disputed freelancer-net pool.");
      }
    }

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;

    const titleLine = project.intakeForm?.title ?? "Hire";

    const neutralPartyMsg = `Staff recorded a judgment on the dispute for "${titleLine}". Assigned staff will apply the outcome in the platform (including any fund movements or roster changes when applicable). You will be notified as steps complete.`;

    const decisionClientMsg =
      args.clientMessage?.trim() ||
      neutralPartyMsg;

    const decisionFreelancerMsg =
      args.freelancerMessage?.trim() ||
      neutralPartyMsg;

    await ctx.db.patch(args.disputeId, {
      status: "resolved",
      stage: "resolved",
      stageStartedAt: now,
      stageDeadlineAt: undefined,
      resolution: {
        decision: args.decision,
        resolutionAmount: resolutionAmountCents,
        partialFreelancerSharePercent: partialPercentRecorded,
        notes: args.notes,
        clientMessage: decisionClientMsg,
        freelancerMessage: decisionFreelancerMsg,
        projectStatusAfterResolution: args.projectStatusAfterResolution,
        resolvedBy: user._id,
        resolvedAt: now,
      },
      resolvedAt: now,
      resolutionExecutedAt: undefined,
      resolutionExecutionSummary: undefined,
      updatedAt: now,
    });
    await recordDisputeStageEvent(ctx, {
      disputeId: args.disputeId,
      projectId: dispute.projectId,
      actorId: user._id,
      actorRole: user.role,
      eventType: "dispute_judgment_recorded",
      fromStatus: dispute.status,
      toStatus: "resolved",
      title: "Judgment recorded",
      description: args.notes,
      metadata: {
        decision: args.decision,
        resolutionAmount: resolutionAmountCents,
        partialFreelancerSharePercent: partialPercentRecorded,
        projectStatusAfterResolution: args.projectStatusAfterResolution,
      },
      createdAt: now,
    });

    if (project.status === "disputed") {
      await ctx.db.patch(dispute.projectId, {
        status: args.projectStatusAfterResolution,
        updatedAt: now,
      });
    }

    const recipientFreelancerIds = getDisputeRecipientFreelancerIds(project, dispute);
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [project.clientId],
      title: "Dispute judgment recorded",
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
      subject: `[49GIG] Dispute judgment: ${project.intakeForm.title ?? "Hire"}`,
      headline: "Judgment recorded",
      bodyText: decisionClientMsg,
      disputeId: args.disputeId,
    });

    if (recipientFreelancerIds.length > 0) {
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: recipientFreelancerIds,
        title: "Dispute judgment recorded",
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
        userIds: recipientFreelancerIds,
        subject: `[49GIG] Dispute judgment: ${project.intakeForm.title ?? "Hire"}`,
        headline: "Judgment recorded",
        bodyText: decisionFreelancerMsg,
        disputeId: args.disputeId,
      });
    }

    await ctx.db.insert("auditLogs", {
      action: "dispute_judgment_recorded",
      actionType: user.role === "admin" ? "admin" : "dispute",
      actorId: user._id,
      actorRole: user.role,
      targetType: "dispute",
      targetId: args.disputeId,
      details: {
        decision: args.decision,
        resolutionAmount: resolutionAmountCents,
        partialFreelancerSharePercent: partialPercentRecorded,
        projectStatusAfterResolution: args.projectStatusAfterResolution,
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
  handler: async () => {
    throw new Error(
      "Automated dispute resolution is disabled. Staff must record a judgment and run manual enforcement."
    );
  },
});

export const finalizeDisputeProjectAfterResolutionInternal = internalMutation({
  args: {
    disputeId: v.id("disputes"),
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute || dispute.status !== "resolved" || !dispute.resolution) {
      return { finalized: false as const, reason: "dispute_not_resolved" as const };
    }

    const project = await ctx.db.get(dispute.projectId);
    if (!project) {
      return { finalized: false as const, reason: "project_not_found" as const };
    }

    // Idempotency guard: if we already finalized this dispute once, return early.
    const alreadyFinalized = await ctx.db
      .query("disputeStageEvents")
      .withIndex("by_dispute", (q) => q.eq("disputeId", args.disputeId))
      .filter((q) =>
        q.eq(q.field("eventType"), "dispute_project_status_finalized")
      )
      .first();
    if (alreadyFinalized) {
      return { finalized: true as const, status: project.status, alreadyFinalized: true };
    }

    const now = Date.now();
    const { decision } = dispute.resolution;
    const teamBasis =
      dispute.teamEscrowBasisFreelancerIds && dispute.teamEscrowBasisFreelancerIds.length > 0
        ? dispute.teamEscrowBasisFreelancerIds
        : project.matchedFreelancerIds ?? [];
    const disputedIds = dispute.disputedFreelancerIds ?? [];
    const isPartialTeam =
      teamBasis.length > 1 &&
      disputedIds.length > 0 &&
      disputedIds.length < teamBasis.length;

    let status: Doc<"projects">["status"];
    if (decision === "client_favor") {
      status = isPartialTeam ? "in_progress" : "matching";
    } else if (decision === "replacement") {
      status = "matching";
    } else {
      status = "in_progress";
    }

    const projectPatch: Partial<Doc<"projects">> = {
      status,
      updatedAt: now,
    };

    if (decision === "client_favor" || decision === "replacement") {
      const removed = freelancersRemovedForPermanentExclusion(project, dispute);
      if (removed.length > 0) {
        projectPatch.permanentlyExcludedFreelancerIds = mergePermanentExclusions(
          project.permanentlyExcludedFreelancerIds,
          removed
        );
      }

      if (isPartialTeam) {
        const removedSet = new Set(disputedIds.map(String));
        const remainingIds = (project.matchedFreelancerIds ?? []).filter(
          (id) => !removedSet.has(String(id))
        );
        const nextSelected = (project.selectedFreelancerIds ?? []).filter(
          (id) => !removedSet.has(String(id))
        );
        projectPatch.matchedFreelancerIds = remainingIds;
        projectPatch.selectedFreelancerIds = nextSelected.length > 0 ? nextSelected : undefined;
        projectPatch.status = "in_progress";
      } else if ((project.matchedFreelancerIds?.length ?? 0) > 0) {
        projectPatch.matchedFreelancerIds = [];
        projectPatch.selectedFreelancerIds = undefined;
        projectPatch.selectedFreelancerId = undefined;
      } else {
        projectPatch.matchedFreelancerId = undefined;
        projectPatch.selectedFreelancerId = undefined;
      }
    }

    const chosenStatus = dispute.resolution.projectStatusAfterResolution;
    if (chosenStatus) {
      projectPatch.status = chosenStatus;
    }
    const finalStatus = projectPatch.status ?? status;

    await ctx.db.patch(dispute.projectId, projectPatch);

    if (decision === "client_favor" || decision === "replacement") {
      await ensureReplacementMatchingProjectFields(ctx, {
        projectId: dispute.projectId,
        disputeId: args.disputeId,
        now,
        partialDisputedFreelancerIds: isPartialTeam ? disputedIds : undefined,
      });

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

    await recordDisputeStageEvent(ctx, {
      disputeId: args.disputeId,
      projectId: dispute.projectId,
      actorRole: "system",
      eventType: "dispute_project_status_finalized",
      title: "Hire status finalized",
      description: `Hire moved to ${String(finalStatus).replace(/_/g, " ")} after dispute enforcement.`,
      metadata: {
        decision,
        isPartialTeam,
        disputedFreelancerIds: disputedIds,
        projectStatusAfterResolution: chosenStatus,
      },
      createdAt: now,
    });

    return { finalized: true as const, status: finalStatus };
  },
});

/** Apply escrow/fund movements from judgment (delegates to `releaseDisputeFunds`). */
export const scheduleJudgmentFundsRelease = mutation({
  args: {
    disputeId: v.id("disputes"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (
      !user ||
      (user.role !== "moderator" && user.role !== "admin")
    ) {
      throw new Error("Unauthorized");
    }
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute not found");
    assertEnforcementWindow(dispute);
    assertAssignedStaffForDispute(user, dispute, "release funds");

    const releaseDisputeFunds =
      api.api.disputes.actions.releaseDisputeFunds as unknown as FunctionReference<"action">;
    await ctx.scheduler.runAfter(0, releaseDisputeFunds, {
      disputeId: args.disputeId,
    });

    await appendDisputeEnforcementEvent(ctx, {
      disputeId: args.disputeId,
      projectId: dispute.projectId,
      actorId: user._id,
      kind: "schedule_funds_release",
      details: {},
    });

    await ctx.db.insert("auditLogs", {
      action: "dispute_enforcement_schedule_funds",
      actionType: user.role === "admin" ? "admin" : "dispute",
      actorId: user._id,
      actorRole: user.role,
      targetType: "dispute",
      targetId: args.disputeId,
      details: {},
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/** Align hire roster and status with judgment (replacement fields, exclusions, removals). */
export const applyJudgmentProjectRoster = mutation({
  args: {
    disputeId: v.id("disputes"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (
      !user ||
      (user.role !== "moderator" && user.role !== "admin")
    ) {
      throw new Error("Unauthorized");
    }
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute not found");
    assertEnforcementWindow(dispute);
    assertAssignedStaffForDispute(user, dispute, "update hire roster");

    const result = await ctx.runMutation(
      internalApi.disputes.mutations.finalizeDisputeProjectAfterResolutionInternal,
      {
        disputeId: args.disputeId,
      }
    );

    await appendDisputeEnforcementEvent(ctx, {
      disputeId: args.disputeId,
      projectId: dispute.projectId,
      actorId: user._id,
      kind: "apply_project_roster",
      details: result,
    });

    await ctx.db.insert("auditLogs", {
      action: "dispute_enforcement_roster",
      actionType: user.role === "admin" ? "admin" : "dispute",
      actorId: user._id,
      actorRole: user.role,
      targetType: "dispute",
      targetId: args.disputeId,
      details: result,
      createdAt: Date.now(),
    });

    return result;
  },
});

/** Regenerate ranked replacement candidates after client-favor/replacement judgments. */
export const enqueueJudgmentReplacementCandidates = mutation({
  args: {
    disputeId: v.id("disputes"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (
      !user ||
      (user.role !== "moderator" && user.role !== "admin")
    ) {
      throw new Error("Unauthorized");
    }
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute?.resolution) throw new Error("Dispute judgment not found");
    assertEnforcementWindow(dispute);
    assertAssignedStaffForDispute(
      user,
      dispute,
      "regenerate replacement candidates"
    );

    const decision = dispute.resolution.decision;
    if (decision !== "client_favor" && decision !== "replacement") {
      throw new Error(
        "Replacement candidate generation applies to client favor or replacement judgments only."
      );
    }

    const project = await ctx.db.get(dispute.projectId);
    if (!project) throw new Error("Project not found");

    const generateTeamMatches =
      api.api.matching.actions.generateTeamMatches as unknown as FunctionReference<
        "action",
        "internal"
      >;
    const generateMatches =
      api.api.matching.actions.generateMatches as unknown as FunctionReference<
        "action",
        "internal"
      >;

    if ((project.intakeForm as { hireType?: string } | undefined)?.hireType === "team") {
      await ctx.scheduler.runAfter(0, generateTeamMatches, {
        projectId: dispute.projectId,
      });
    } else {
      await ctx.scheduler.runAfter(0, generateMatches, {
        projectId: dispute.projectId,
      });
    }

    await appendDisputeEnforcementEvent(ctx, {
      disputeId: args.disputeId,
      projectId: dispute.projectId,
      actorId: user._id,
      kind: "enqueue_replacement_matches",
      details: { hireType: project.intakeForm?.hireType },
    });

    return { success: true };
  },
});

/** Notify the client to pick replacement freelancer(s). */
export const sendJudgmentReplacementClientNotice = mutation({
  args: {
    disputeId: v.id("disputes"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (
      !user ||
      (user.role !== "moderator" && user.role !== "admin")
    ) {
      throw new Error("Unauthorized");
    }
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute?.resolution) throw new Error("Dispute judgment not found");
    assertEnforcementWindow(dispute);
    assertAssignedStaffForDispute(
      user,
      dispute,
      "send replacement reminder email"
    );

    const decision = dispute.resolution.decision;
    if (decision !== "client_favor" && decision !== "replacement") {
      throw new Error(
        "Replacement notice applies to client favor or replacement judgments only."
      );
    }

    const sendSelectReplacementClientEmail =
      api.api.projects.actions.sendSelectReplacementClientEmail as unknown as FunctionReference<
        "action",
        "internal"
      >;

    await ctx.scheduler.runAfter(0, sendSelectReplacementClientEmail, {
      projectId: dispute.projectId,
    });

    await appendDisputeEnforcementEvent(ctx, {
      disputeId: args.disputeId,
      projectId: dispute.projectId,
      actorId: user._id,
      kind: "notify_client_replacement_flow",
      details: {},
    });

    return { success: true };
  },
});

/** Clear hire `disputed` status and unblock the disputed billing cycle without changing roster. */
export const resumeProjectAfterJudgmentDispute = mutation({
  args: {
    disputeId: v.id("disputes"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (
      !user ||
      (user.role !== "moderator" && user.role !== "admin")
    ) {
      throw new Error("Unauthorized");
    }
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute not found");
    assertEnforcementWindow(dispute);
    assertAssignedStaffForDispute(user, dispute, "resume hire from disputed state");

    const project = await ctx.db.get(dispute.projectId);
    if (!project) throw new Error("Project not found");

    const now = Date.now();
    const resumeStatus =
      dispute.resolution?.projectStatusAfterResolution ?? "in_progress";
    if (project.status === "disputed") {
      await ctx.db.patch(dispute.projectId, {
        status: resumeStatus,
        updatedAt: now,
      });
    }

    if (dispute.monthlyCycleId) {
      const cycle = await ctx.db.get(dispute.monthlyCycleId);
      if (cycle?.status === "disputed") {
        await ctx.db.patch(dispute.monthlyCycleId, {
          status: "pending",
          disputeId: undefined,
          updatedAt: now,
        });
      }
    }

    await appendDisputeEnforcementEvent(ctx, {
      disputeId: args.disputeId,
      projectId: dispute.projectId,
      actorId: user._id,
      kind: "resume_project_in_progress",
      details: {},
    });

    await ctx.db.insert("auditLogs", {
      action: "dispute_enforcement_resume_project",
      actionType: user.role === "admin" ? "admin" : "dispute",
      actorId: user._id,
      actorRole: user.role,
      targetType: "dispute",
      targetId: args.disputeId,
      details: {},
      createdAt: now,
    });

    return { success: true };
  },
});

/** Mark enforcement workflow complete — run after substantive actions finished. */
export const finalizeDisputeEnforcement = mutation({
  args: {
    disputeId: v.id("disputes"),
    summary: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (
      !user ||
      (user.role !== "moderator" && user.role !== "admin")
    ) {
      throw new Error("Unauthorized");
    }

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute not found");
    if (dispute.status !== "resolved") {
      throw new Error("Dispute is not resolved");
    }
    if (dispute.resolutionExecutedAt != null) {
      throw new Error("Enforcement is already finalized");
    }
    assertAssignedStaffForDispute(user, dispute, "finalize enforcement");

    const now = Date.now();
    const trimmed = args.summary?.trim();

    await ctx.db.patch(args.disputeId, {
      resolutionExecutedAt: now,
      resolutionExecutionSummary: trimmed || undefined,
      enforcedAt: now,
      updatedAt: now,
    });

    await recordDisputeStageEvent(ctx, {
      disputeId: args.disputeId,
      projectId: dispute.projectId,
      actorId: user._id,
      actorRole: user.role,
      eventType: "dispute_enforcement_finalized",
      title: "Enforcement finalized",
      description: trimmed,
      metadata: {},
      createdAt: now,
    });

    await appendDisputeEnforcementEvent(ctx, {
      disputeId: args.disputeId,
      projectId: dispute.projectId,
      actorId: user._id,
      kind: "finalize_enforcement",
      details: trimmed ? { summary: trimmed } : {},
    });

    await ctx.db.insert("auditLogs", {
      action: "dispute_enforcement_finalized",
      actionType: user.role === "admin" ? "admin" : "dispute",
      actorId: user._id,
      actorRole: user.role,
      targetType: "dispute",
      targetId: args.disputeId,
      details: { summary: trimmed },
      createdAt: now,
    });

    return { success: true };
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

    // Restore the disputed monthly billing cycle back to pending so normal flow resumes.
    if (dispute.monthlyCycleId) {
      const cycle = await ctx.db.get(dispute.monthlyCycleId);
      if (cycle && cycle.status === "disputed") {
        await ctx.db.patch(dispute.monthlyCycleId, {
          status: "pending",
          updatedAt: now,
        });
      }
    }

    // Cancel any pending evidence requests on this dispute so parties don't get stale prompts.
    const openRequests = await ctx.db
      .query("disputeEvidenceRequests")
      .withIndex("by_dispute", (q) => q.eq("disputeId", args.disputeId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
    for (const req of openRequests) {
      await ctx.db.patch(req._id, {
        status: "cancelled",
        resolvedAt: now,
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
