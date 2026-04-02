import { mutation, internalMutation, MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";
import type { FunctionReference } from "convex/server";

const api = require("../_generated/api") as {
  api: {
    notifications: { actions: { sendSystemNotification: unknown } };
    disputes: { actions: { releaseDisputeFunds: unknown } };
  };
};

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
 * Records full unreleased escrow as lockedAmount (dollars); project becomes disputed so releases are blocked until resolution.
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

    // All unreleased escrow is frozen while a dispute is open (same currency units as project.escrowedAmount: dollars).
    const lockedAmount = Math.max(0, project.escrowedAmount ?? 0);

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

    // Update dispute
    await ctx.db.patch(args.disputeId, {
      status: "resolved",
      resolution: {
        decision: args.decision,
        resolutionAmount: args.resolutionAmount,
        notes: args.notes,
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
      newProjectStatus = "cancelled";
    } else if (args.decision === "partial") {
      newProjectStatus = "in_progress";
    } else {
      // Freelancer favor — work continues; unreleased escrow stays until normal monthly approval flow
      newProjectStatus = "in_progress";
    }

    await ctx.db.patch(dispute.projectId, {
      status: newProjectStatus,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, releaseDisputeFunds, {
      disputeId: args.disputeId,
    });
    const notifyUserIds = [project.clientId, project.matchedFreelancerId].filter(
      Boolean
    ) as Doc<"users">["_id"][];
    if (notifyUserIds.length > 0) {
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: notifyUserIds,
        title: "Dispute resolved",
        message: `The dispute for ${project.intakeForm.title} has been resolved.`,
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
      newProjectStatus = "cancelled";
    } else if (args.decision === "partial") {
      newProjectStatus = "in_progress";
    } else {
      newProjectStatus = "in_progress";
    }

    await ctx.db.patch(dispute.projectId, {
      status: newProjectStatus,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, releaseDisputeFunds, {
      disputeId: args.disputeId,
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    const notifyUserIds = [project.clientId, project.matchedFreelancerId].filter(
      Boolean
    ) as Doc<"users">["_id"][];
    if (notifyUserIds.length > 0) {
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: notifyUserIds,
        title: "Dispute resolved",
        message: `The dispute for ${project.intakeForm.title} has been resolved.`,
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

