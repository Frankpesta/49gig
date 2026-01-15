import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";

export const createNotifications = internalMutation({
  args: {
    notifications: v.array(
      v.object({
        userId: v.id("users"),
        title: v.string(),
        message: v.string(),
        type: v.string(),
        data: v.optional(v.any()),
        createdAt: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const notification of args.notifications) {
      const id = await ctx.db.insert("notifications", notification);
      ids.push(id);
    }
    return ids;
  },
});

export const markNotificationRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.notificationId, { readAt: Date.now() });
    return { success: true };
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_read", (q) => q.eq("userId", user._id).eq("readAt", undefined))
      .collect();

    const now = Date.now();
    for (const notification of unread) {
      await ctx.db.patch(notification._id, { readAt: now });
    }

    return { success: true };
  },
});
