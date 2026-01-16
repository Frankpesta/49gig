"use node";

import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import Pusher from "pusher";
import type { Id } from "../_generated/dataModel";
import type { FunctionReference } from "convex/server";

const api = require("../_generated/api") as {
  api: {
    notifications: {
      queries: {
        listUserIdsByRole: unknown;
        listAllUserIds: unknown;
        getNotificationPreferences: unknown;
      };
      mutations: {
        createNotifications: unknown;
      };
    };
  };
};

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.PUSHER_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: process.env.PUSHER_CLUSTER || "",
  useTLS: true,
});

const pusherEnabled =
  !!process.env.PUSHER_APP_ID &&
  !!process.env.PUSHER_KEY &&
  !!process.env.PUSHER_SECRET &&
  !!process.env.PUSHER_CLUSTER;

async function dispatchNotifications({
  ctx,
  userIds,
  title,
  message,
  type,
  data,
}: {
  ctx: any;
  userIds: Id<"users">[];
  title: string;
  message: string;
  type: string;
  data?: Record<string, unknown>;
}) {
  if (userIds.length === 0) return;

  const now = Date.now();
  const getNotificationPreferences = api.api.notifications.queries
    .getNotificationPreferences as unknown as FunctionReference<"query", "internal">;
  const createNotifications = api.api.notifications.mutations
    .createNotifications as unknown as FunctionReference<
    "mutation",
    "internal"
  >;

  const preferences = await ctx.runQuery(getNotificationPreferences, {
    userIds,
  });

  const inAppUserIds = preferences
    .filter((pref: { inApp: boolean }) => pref.inApp)
    .map((pref: { userId: Id<"users"> }) => pref.userId);

  if (inAppUserIds.length > 0) {
    await ctx.runMutation(createNotifications, {
      notifications: inAppUserIds.map((userId: Id<"users">) => ({
        userId,
        title,
        message,
        type,
        data,
        createdAt: now,
      })),
    });
  }

  if (!pusherEnabled) return;

  const channels = preferences
    .filter((pref: { push: boolean }) => pref.push)
    .map((pref: { userId: Id<"users"> }) => `user-${pref.userId}`);

  if (channels.length === 0) return;

  await pusher.trigger(channels, "notification:new", {
    title,
    message,
    type,
    data,
    createdAt: now,
  });
}

export const sendSystemNotification = internalAction({
  args: {
    userIds: v.array(v.id("users")),
    title: v.string(),
    message: v.string(),
    type: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await dispatchNotifications({
      ctx,
      userIds: args.userIds,
      title: args.title,
      message: args.message,
      type: args.type || "system",
      data: args.data || undefined,
    });
    return { success: true };
  },
});

export const sendSystemBroadcast = internalAction({
  args: {
    roles: v.optional(
      v.array(
        v.union(
          v.literal("client"),
          v.literal("freelancer"),
          v.literal("admin"),
          v.literal("moderator")
        )
      )
    ),
    title: v.string(),
    message: v.string(),
    type: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const listAllUserIds = api.api.notifications.queries
      .listAllUserIds as unknown as FunctionReference<"query", "internal">;
    const listUserIdsByRole = api.api.notifications.queries
      .listUserIdsByRole as unknown as FunctionReference<"query", "internal">;

    let userIds: Id<"users">[] = [];
    if (!args.roles || args.roles.length === 0) {
      userIds = await ctx.runQuery(listAllUserIds, {});
    } else {
      for (const role of args.roles) {
        const ids = await ctx.runQuery(listUserIdsByRole, { role });
        userIds = userIds.concat(ids);
      }
    }

    const uniqueUserIds = Array.from(new Set(userIds.map((id) => id)));

    await dispatchNotifications({
      ctx,
      userIds: uniqueUserIds,
      title: args.title,
      message: args.message,
      type: args.type || "system",
      data: args.data || undefined,
    });

    return { success: true, count: uniqueUserIds.length };
  },
});

export const sendAdminNotification = action({
  args: {
    target: v.object({
      userIds: v.optional(v.array(v.id("users"))),
      roles: v.optional(
        v.array(
          v.union(
            v.literal("client"),
            v.literal("freelancer"),
            v.literal("admin"),
            v.literal("moderator")
          )
        )
      ),
      all: v.optional(v.boolean()),
    }),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    if (identity.role !== "admin" && identity.role !== "moderator") {
      throw new Error("Not authorized");
    }

    const listAllUserIds = api.api.notifications.queries
      .listAllUserIds as unknown as FunctionReference<"query", "internal">;
    const listUserIdsByRole = api.api.notifications.queries
      .listUserIdsByRole as unknown as FunctionReference<"query", "internal">;

    let userIds: Id<"users">[] = [];
    if (args.target.all) {
      userIds = await ctx.runQuery(listAllUserIds, {});
    }
    if (args.target.roles && args.target.roles.length > 0) {
      for (const role of args.target.roles) {
        const ids = await ctx.runQuery(listUserIdsByRole, { role });
        userIds = userIds.concat(ids);
      }
    }
    if (args.target.userIds && args.target.userIds.length > 0) {
      userIds = userIds.concat(args.target.userIds);
    }

    const uniqueUserIds = Array.from(new Set(userIds.map((id) => id)));
    if (uniqueUserIds.length === 0) {
      return { success: true, count: 0 };
    }

    await dispatchNotifications({
      ctx,
      userIds: uniqueUserIds,
      title: args.title,
      message: args.message,
      type: "admin",
      data: args.data || undefined,
    });

    return { success: true, count: uniqueUserIds.length };
  },
});
