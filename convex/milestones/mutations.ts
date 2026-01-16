import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";
import type { FunctionReference } from "convex/server";

const api = require("../_generated/api") as {
  api: {
    notifications: { actions: { sendSystemNotification: unknown } };
  };
};

/**
 * Helper to get current user in mutations
 */
async function getCurrentUserInMutation(
  ctx: any,
  userId?: string
): Promise<Doc<"users"> | null> {
  if (userId) {
    const user = await ctx.db.get(userId as any as Doc<"users">["_id"]);
    if (!user) {
      return null;
    }
    const userDoc = user as Doc<"users">;
    if (userDoc.status !== "active") {
      return null;
    }
    return userDoc;
  }

  // Fall back to Convex Auth
  const user = await getCurrentUser(ctx);
  if (!user) {
    return null;
  }
  const userDoc = user as Doc<"users">;
  if (userDoc.status !== "active") {
    return null;
  }
  return userDoc;
}

/**
 * Submit milestone deliverables (freelancer)
 */
export const submitMilestone = mutation({
  args: {
    milestoneId: v.id("milestones"),
    deliverables: v.array(
      v.object({
        name: v.string(),
        fileId: v.optional(v.id("_storage")),
        url: v.optional(v.string()),
      })
    ),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) {
      throw new Error("Milestone not found");
    }

    // Get project for authorization
    const project = await ctx.db.get(milestone.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only matched freelancer can submit
    if (project.matchedFreelancerId !== user._id && user.role !== "admin") {
      throw new Error("Not authorized to submit this milestone");
    }

    // Only in_progress milestones can be submitted
    if (milestone.status !== "in_progress") {
      throw new Error("Milestone is not in progress");
    }

    const now = Date.now();
    const deliverablesWithTimestamp = args.deliverables.map((d) => ({
      ...d,
      submittedAt: now,
    }));

    await ctx.db.patch(args.milestoneId, {
      status: "submitted",
      deliverables: deliverablesWithTimestamp,
      submittedAt: now,
      updatedAt: now,
    });

    // Log audit
    await ctx.db.insert("auditLogs", {
      action: "milestone_submitted",
      actionType: "system",
      actorId: user._id,
      actorRole: user.role,
      targetType: "milestone",
      targetId: args.milestoneId,
      details: {
        projectId: milestone.projectId,
        deliverableCount: args.deliverables.length,
      },
      createdAt: now,
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;

    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [project.clientId],
      title: "Milestone submitted",
      message: `A milestone was submitted for ${project.intakeForm.title}.`,
      type: "milestone",
      data: { milestoneId: args.milestoneId, projectId: milestone.projectId },
    });

    return args.milestoneId;
  },
});

/**
 * Approve milestone (client)
 */
export const approveMilestone = mutation({
  args: {
    milestoneId: v.id("milestones"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) {
      throw new Error("Milestone not found");
    }

    // Get project for authorization
    const project = await ctx.db.get(milestone.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only client who owns project or admin can approve
    if (project.clientId !== user._id && user.role !== "admin") {
      throw new Error("Not authorized to approve this milestone");
    }

    // Only submitted milestones can be approved
    if (milestone.status !== "submitted") {
      throw new Error("Milestone is not submitted");
    }

    const now = Date.now();
    const autoReleaseAt = now + 48 * 60 * 60 * 1000; // 48 hours

    await ctx.db.patch(args.milestoneId, {
      status: "approved",
      approvedBy: user._id,
      approvedAt: now,
      autoReleaseAt,
      updatedAt: now,
    });

    // Log audit
    await ctx.db.insert("auditLogs", {
      action: "milestone_approved",
      actionType: "system",
      actorId: user._id,
      actorRole: user.role,
      targetType: "milestone",
      targetId: args.milestoneId,
      details: {
        projectId: milestone.projectId,
        amount: milestone.amount,
        autoReleaseAt,
      },
      createdAt: now,
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;

    if (project.matchedFreelancerId) {
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: [project.matchedFreelancerId],
        title: "Milestone approved",
        message: `A milestone was approved for ${project.intakeForm.title}.`,
        type: "milestone",
        data: { milestoneId: args.milestoneId, projectId: milestone.projectId },
      });
    }

    return args.milestoneId;
  },
});

/**
 * Reject milestone (client)
 */
export const rejectMilestone = mutation({
  args: {
    milestoneId: v.id("milestones"),
    reason: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) {
      throw new Error("Milestone not found");
    }

    // Get project for authorization
    const project = await ctx.db.get(milestone.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only client who owns project or admin can reject
    if (project.clientId !== user._id && user.role !== "admin") {
      throw new Error("Not authorized to reject this milestone");
    }

    // Only submitted milestones can be rejected
    if (milestone.status !== "submitted") {
      throw new Error("Milestone is not submitted");
    }

    const now = Date.now();

    await ctx.db.patch(args.milestoneId, {
      status: "rejected",
      rejectionReason: args.reason,
      updatedAt: now,
    });

    // Log audit
    await ctx.db.insert("auditLogs", {
      action: "milestone_rejected",
      actionType: "system",
      actorId: user._id,
      actorRole: user.role,
      targetType: "milestone",
      targetId: args.milestoneId,
      details: {
        projectId: milestone.projectId,
        reason: args.reason,
      },
      createdAt: now,
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;

    if (project.matchedFreelancerId) {
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: [project.matchedFreelancerId],
        title: "Milestone rejected",
        message: `A milestone was rejected for ${project.intakeForm.title}.`,
        type: "milestone",
        data: { milestoneId: args.milestoneId, projectId: milestone.projectId },
      });
    }

    return args.milestoneId;
  },
});

/**
 * Start milestone work (freelancer)
 */
export const startMilestone = mutation({
  args: {
    milestoneId: v.id("milestones"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) {
      throw new Error("Milestone not found");
    }

    // Get project for authorization
    const project = await ctx.db.get(milestone.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only matched freelancer can start
    if (project.matchedFreelancerId !== user._id && user.role !== "admin") {
      throw new Error("Not authorized to start this milestone");
    }

    // Only pending milestones can be started
    if (milestone.status !== "pending") {
      throw new Error("Milestone is not pending");
    }

    const now = Date.now();

    await ctx.db.patch(args.milestoneId, {
      status: "in_progress",
      updatedAt: now,
    });

    // Log audit
    await ctx.db.insert("auditLogs", {
      action: "milestone_started",
      actionType: "system",
      actorId: user._id,
      actorRole: user.role,
      targetType: "milestone",
      targetId: args.milestoneId,
      details: {
        projectId: milestone.projectId,
      },
      createdAt: now,
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;

    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [project.clientId],
      title: "Milestone started",
      message: `Work has started on a milestone for ${project.intakeForm.title}.`,
      type: "milestone",
      data: { milestoneId: args.milestoneId, projectId: milestone.projectId },
    });

    return args.milestoneId;
  },
});

