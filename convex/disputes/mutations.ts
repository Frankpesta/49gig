import { mutation, internalMutation, MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";
import type { FunctionReference } from "convex/server";
import { escrowNetToClientLockedGross } from "./amounts";
import {
  freelancersRemovedForPermanentExclusion,
  mergePermanentExclusions,
} from "../match_exclusions";
import {
  computeTeamPoolShareCentsByFreelancerId,
  sumShareCentsForFreelancers,
} from "../teamEscrowShares";
import type { Id } from "../_generated/dataModel";

const api = require("../_generated/api") as {
  api: {
    notifications: { actions: { sendSystemNotification: unknown } };
    disputes: { actions: { releaseDisputeFunds: unknown } };
    projects: { actions: { sendSelectReplacementClientEmail: unknown } };
  };
};

const internalAny = require("../_generated/api").internal as {
  disputes: { staffEmails: { sendDisputeAssignmentEmailInternal: unknown } };
};
const internalApi = require("../_generated/api").internal as any;

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
  if (!p || p.status !== "matching") return;

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

/**
 * Helper to get current user in mutations
 */
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
          q.eq(q.field("status"), "under_review")
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
    const platformFeePct = project.platformFee ?? 15;

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
      lockedAmount = escrowNetToClientLockedGross(escrowNet, platformFeePct);
    }

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
      status: "open",
      lockedAmount,
      disputedFreelancerIds:
        disputedIdsUnique && disputedIdsUnique.length > 0
          ? disputedIdsUnique
          : undefined,
      teamEscrowBasisFreelancerIds:
        teamMemberIds.length > 0 ? [...teamMemberIds] : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (monthlyCycleId) {
      await ctx.db.patch(monthlyCycleId, {
        status: "disputed",
        disputeId,
        updatedAt: Date.now(),
      });
    }

    // Update project status to disputed
    await ctx.db.patch(projectId, {
      status: "disputed",
      updatedAt: Date.now(),
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    const releaseDisputeFunds =
      api.api.disputes.actions.releaseDisputeFunds as unknown as FunctionReference<"action">;
    
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

    const otherPartyId =
      user._id === project.clientId ? project.matchedFreelancerId : project.clientId;
    if (otherPartyId) {
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: [otherPartyId],
        title: "New dispute opened",
        message: `A dispute was opened for ${project.intakeForm.title}.`,
        type: "dispute",
        data: { disputeId, projectId },
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

    const isClient = project.clientId === user._id;
    const isFreelancer =
      project.matchedFreelancerId === user._id ||
      (project.matchedFreelancerIds?.includes(user._id) ?? false);
    const isStaff = user.role === "admin" || user.role === "moderator";

    if (!isClient && !isFreelancer && !isStaff) {
      throw new Error("Not authorized to post in this dispute");
    }

    let authorRole: "client" | "freelancer" | "moderator" | "admin" | "system" =
      "client";
    if (user.role === "admin") authorRole = "admin";
    else if (user.role === "moderator") authorRole = "moderator";
    else if (isFreelancer) authorRole = "freelancer";
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

    // Check authorization - must be client, freelancer, or admin/moderator
    const isClient = project.clientId === user._id;
    const isFreelancer = project.matchedFreelancerId === user._id;
    const isInitiator = dispute.initiatorId === user._id;
    const isAdminOrModerator =
      user.role === "admin" || user.role === "moderator";

    if (!isClient && !isFreelancer && !isInitiator && !isAdminOrModerator) {
      throw new Error("Unauthorized");
    }

    // Check if dispute is still open
    if (dispute.status !== "open" && dispute.status !== "under_review") {
      throw new Error("Cannot add evidence to closed dispute");
    }

    // Add evidence
    await ctx.db.patch(args.disputeId, {
      evidence: [...dispute.evidence, args.evidence],
      updatedAt: Date.now(),
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
      createdAt: Date.now(),
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
    await ctx.db.patch(args.disputeId, {
      assignedModeratorId: args.moderatorId,
      assignedAt: Date.now(),
      status: "under_review",
      updatedAt: Date.now(),
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
      createdAt: Date.now(),
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
      resolution: {
        decision: args.decision,
        resolutionAmount: args.resolutionAmount,
        notes: args.notes,
        clientMessage: decisionClientMsg,
        freelancerMessage: decisionFreelancerMsg,
        resolvedBy: user._id,
        resolvedAt: now,
      },
      resolvedAt: now,
      updatedAt: now,
    });

    // Update project status
    let newProjectStatus: Doc<"projects">["status"] = "disputed";
    if (args.decision === "replacement") {
      newProjectStatus = "matching";
    } else if (args.decision === "client_favor") {
      newProjectStatus = "matching";
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
          status: "matching",
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

    // Send personalized notifications to each party
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [project.clientId],
      title: "Dispute resolved",
      message: decisionClientMsg,
      type: "dispute",
      data: { disputeId: args.disputeId, projectId: dispute.projectId },
    });
    if (args.decision === "client_favor" || args.decision === "replacement") {
      await ctx.scheduler.runAfter(0, sendSelectReplacementClientEmail, {
        projectId: dispute.projectId,
      });
    }

    const freelancerIds = [
      project.matchedFreelancerId,
      ...(project.matchedFreelancerIds ?? []),
    ].filter(Boolean) as Doc<"users">["_id"][];
    const uniqueFreelancerIds = Array.from(new Set(freelancerIds.map(String))).map(
      (id) => id as Doc<"users">["_id"]
    );

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
      }

      if (isPartialTeamResolve) {
        const remainingNotify = uniqueFreelancerIds.filter(
          (id) => !removedSet.has(String(id))
        );
        if (remainingNotify.length > 0) {
          await ctx.scheduler.runAfter(0, sendSystemNotification, {
            userIds: remainingNotify,
            title: "Dispute resolved",
            message: `A dispute on "${project.intakeForm.title}" was resolved. You remain on this hire while the client replaces removed team members.`,
            type: "dispute",
            data: { disputeId: args.disputeId, projectId: dispute.projectId },
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
        resolutionAmount: args.resolutionAmount,
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

    const releaseDisputeFunds =
      api.api.disputes.actions.releaseDisputeFunds as unknown as FunctionReference<"action">;

    await ctx.db.patch(args.disputeId, {
      status: "resolved",
      resolution: {
        decision: args.decision,
        resolutionAmount: args.resolutionAmount,
        notes: args.notes,
        resolvedAt: now,
      },
      resolvedAt: now,
      updatedAt: now,
    });

    let newProjectStatus: Doc<"projects">["status"] = "disputed";
    if (args.decision === "replacement") {
      newProjectStatus = "matching";
    } else if (args.decision === "client_favor") {
      newProjectStatus = "matching";
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
          status: "matching",
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

    const freelancerNotifyIds = [
      project.matchedFreelancerId,
      ...(project.matchedFreelancerIds ?? []),
    ].filter(Boolean) as Doc<"users">["_id"][];
    const uniqueFreelancerIds = Array.from(new Set(freelancerNotifyIds.map(String))).map(
      (id) => id as Doc<"users">["_id"]
    );

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
      }
      if (isPartialTeamResolve) {
        const remainingNotify = uniqueFreelancerIds.filter(
          (id) => !removedSet.has(String(id))
        );
        if (remainingNotify.length > 0) {
          await ctx.scheduler.runAfter(0, sendSystemNotification, {
            userIds: remainingNotify,
            title: "Dispute resolved",
            message: `A dispute on "${project.intakeForm.title}" was resolved. You remain on this hire while the client replaces removed team members.`,
            type: "dispute",
            data: { disputeId: args.disputeId, projectId: dispute.projectId },
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
    }

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

    // TODO: Notify admins

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

    if (dispute.status !== "open" && dispute.status !== "under_review") {
      throw new Error("Only open or under-review disputes can be cancelled");
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
      cancellationReason: args.reason.trim(),
      cancelledAt: now,
      cancelledBy: user._id,
      updatedAt: now,
    });

    // Restore project status from "disputed" back to "in_progress"
    const project = await ctx.db.get(dispute.projectId);
    if (project && project.status === "disputed") {
      await ctx.db.patch(dispute.projectId, {
        status: "in_progress",
        updatedAt: now,
      });
    }

    // Notify the other party
    const initiatorRole = dispute.initiatorRole;
    let notifyIds: Doc<"users">["_id"][] = [];
    if (initiatorRole === "client" && project) {
      const freelancerIds = [
        project.matchedFreelancerId,
        ...(project.matchedFreelancerIds ?? []),
      ].filter(Boolean) as Doc<"users">["_id"][];
      notifyIds = Array.from(new Set(freelancerIds.map(String))).map(
        (id) => id as Doc<"users">["_id"]
      );
    } else if (project) {
      notifyIds = [project.clientId];
    }

    if (notifyIds.length > 0) {
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: notifyIds,
        title: "Dispute cancelled",
        message: `The dispute has been cancelled by the ${initiatorRole} who initiated it. Reason: ${args.reason.trim()}`,
        type: "dispute",
        data: { disputeId: args.disputeId, projectId: dispute.projectId },
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
