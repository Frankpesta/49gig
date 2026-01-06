import { mutation, MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";
import { api } from "../_generated/api";

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
 * Locks funds in escrow
 */
export const initiateDispute = mutation({
  args: {
    projectId: v.id("projects"),
    milestoneId: v.optional(v.id("milestones")),
    type: v.union(
      v.literal("milestone_quality"),
      v.literal("payment"),
      v.literal("communication"),
      v.literal("freelancer_replacement")
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

    // Get project
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check authorization - must be client or freelancer on this project
    const isClient = project.clientId === user._id;
    const isFreelancer = project.matchedFreelancerId === user._id;

    if (!isClient && !isFreelancer) {
      throw new Error("Unauthorized - must be project client or freelancer");
    }

    // Check if dispute already exists for this project/milestone
    const existingDisputes = await ctx.db
      .query("disputes")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "open"),
          q.eq(q.field("status"), "under_review")
        )
      )
      .collect();

    if (args.milestoneId) {
      const milestoneDispute = existingDisputes.find(
        (d) => d.milestoneId === args.milestoneId
      );
      if (milestoneDispute) {
        throw new Error("Dispute already exists for this milestone");
      }
    } else {
      // Check for open project-level disputes
      const projectDispute = existingDisputes.find((d) => !d.milestoneId);
      if (projectDispute) {
        throw new Error("An open dispute already exists for this project");
      }
    }

    // Calculate locked amount
    let lockedAmount = 0;
    if (args.milestoneId) {
      const milestone = await ctx.db.get(args.milestoneId);
      if (milestone) {
        lockedAmount = milestone.amount;
      }
    } else {
      // Lock all remaining escrowed funds
      lockedAmount = project.escrowedAmount || 0;
    }

    // Create dispute
    const disputeId = await ctx.db.insert("disputes", {
      projectId: args.projectId,
      milestoneId: args.milestoneId,
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

    // Update project status to disputed
    await ctx.db.patch(args.projectId, {
      status: "disputed",
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "dispute_initiated",
      actionType: "dispute",
      actorId: user._id,
      actorRole: user.role,
      targetType: "dispute",
      targetId: disputeId,
      details: {
        projectId: args.projectId,
        milestoneId: args.milestoneId,
        type: args.type,
        lockedAmount,
      },
      createdAt: Date.now(),
    });

    // TODO: Send notification to other party
    // TODO: Create system message in project chat

    return disputeId;
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
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.status !== "active") {
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

    // Verify moderator exists and is a moderator
    const moderator = await ctx.db.get(args.moderatorId);
    if (!moderator || moderator.role !== "moderator") {
      throw new Error("Invalid moderator");
    }

    // Assign moderator
    await ctx.db.patch(args.disputeId, {
      assignedModeratorId: args.moderatorId,
      assignedAt: Date.now(),
      status: "under_review",
      updatedAt: Date.now(),
    });

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
      },
      createdAt: Date.now(),
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
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.status !== "active") {
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
      newProjectStatus = "matching"; // Start matching for new freelancer
    } else if (args.decision === "client_favor" || args.decision === "partial") {
      newProjectStatus = "in_progress"; // Continue project
    } else {
      newProjectStatus = "completed"; // Freelancer favor - project complete
    }

    await ctx.db.patch(dispute.projectId, {
      status: newProjectStatus,
      updatedAt: now,
    });

    // TODO: Release funds based on resolution
    // TODO: Handle freelancer replacement if needed
    // TODO: Send notifications

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

