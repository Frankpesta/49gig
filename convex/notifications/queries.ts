import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";

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
