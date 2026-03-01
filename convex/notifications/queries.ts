import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";

export const getNotificationById = query({
  args: {
    notificationId: v.id("notifications"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let user: Doc<"users"> | null = null;
    if (args.userId) {
      const u = await ctx.db.get(args.userId);
      if (u && u.status === "active") user = u;
    } else {
      const u = await getCurrentUser(ctx);
      if (u && (u as Doc<"users">).status === "active") user = u as Doc<"users">;
    }
    if (!user) return null;

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== user._id) return null;

    // Resolve IDs to human-readable labels for display
    const resolved: Record<string, string> = {};
    const data = notification.data as Record<string, unknown> | undefined;
    if (data) {
      if (typeof data.projectId === "string") {
        const project = await ctx.db.get(data.projectId as Doc<"projects">["_id"]);
        resolved.projectTitle = project?.intakeForm?.title ?? "Unknown project";
      }
      if (typeof data.matchId === "string") {
        const match = await ctx.db.get(data.matchId as Doc<"matches">["_id"]);
        if (match) {
          const freelancer = await ctx.db.get(match.freelancerId);
          const project = await ctx.db.get(match.projectId);
          resolved.matchLabel = freelancer?.name
            ? `${freelancer.name}${project?.intakeForm?.title ? ` – ${project.intakeForm.title}` : ""}`
            : project?.intakeForm?.title ?? "Match";
        }
      }
      if (typeof data.disputeId === "string") {
        const dispute = await ctx.db.get(data.disputeId as Doc<"disputes">["_id"]);
        if (dispute) {
          const project = await ctx.db.get(dispute.projectId);
          resolved.disputeLabel = project?.intakeForm?.title
            ? `Dispute for ${project.intakeForm.title}`
            : "Dispute";
        }
      }
      if (typeof data.userId === "string") {
        const u = await ctx.db.get(data.userId as Doc<"users">["_id"]);
        resolved.userLabel = u?.name ?? "User";
      }
      if (typeof data.milestoneId === "string") {
        const milestone = await ctx.db.get(data.milestoneId as Doc<"milestones">["_id"]);
        resolved.milestoneLabel = milestone?.title ?? "Milestone";
      }
      if (typeof data.paymentId === "string") {
        const payment = await ctx.db.get(data.paymentId as Doc<"payments">["_id"]);
        if (payment) {
          const curr = payment.currency?.toUpperCase() ?? "USD";
          resolved.paymentLabel =
            curr === "USD" ? `$${payment.amount.toFixed(2)}` : `${payment.amount} ${curr}`;
        }
      }
      if (typeof data.vettingResultId === "string") {
        resolved.vettingLabel = "Verification";
      }
    }

    return { ...notification, resolved };
  },
});

export const getMyNotifications = query({
  args: {
    limit: v.optional(v.number()),
    refreshKey: v.optional(v.number()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let user: Doc<"users"> | null = null;
    if (args.userId) {
      const u = await ctx.db.get(args.userId);
      if (u && u.status === "active") user = u;
    } else {
      const u = await getCurrentUser(ctx);
      if (u && (u as Doc<"users">).status === "active") user = u as Doc<"users">;
    }
    if (!user) {
      return [];
    }

    const limit = args.limit ?? 20;
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return notifications;
  },
});

export const listUserIdsByRole = internalQuery({
  args: {
    role: v.union(
      v.literal("client"),
      v.literal("freelancer"),
      v.literal("admin"),
      v.literal("moderator")
    ),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", args.role))
      .collect();

    return users
      .filter((u) => (u as Doc<"users">).status === "active")
      .map((u) => u._id);
  },
});

export const listAllUserIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users
      .filter((u) => (u as Doc<"users">).status === "active")
      .map((u) => u._id);
  },
});

export const getNotificationPreferences = internalQuery({
  args: {
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const results: Array<{
      userId: Doc<"users">["_id"];
      email: boolean;
      push: boolean;
      inApp: boolean;
    }> = [];

    for (const userId of args.userIds) {
      const user = await ctx.db.get(userId);
      if (!user || user.status !== "active") {
        continue;
      }
      const prefs = user.notificationPreferences || {
        email: true,
        push: true,
        inApp: true,
      };
      results.push({
        userId,
        email: prefs.email,
        push: prefs.push,
        inApp: prefs.inApp,
      });
    }

    return results;
  },
});
