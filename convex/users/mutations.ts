import { mutation, internalMutation } from "../_generated/server";
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
 * Supports Convex Auth, session tokens, and direct userId
 */
async function getCurrentUserInMutation(
  ctx: any,
  userId?: string,
  sessionToken?: string
): Promise<Doc<"users"> | null> {
  // If userId is provided directly, use it
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

  // If session token is provided, validate it
  if (sessionToken) {
    const now = Date.now();
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("sessionToken", sessionToken))
      .first();

    if (!session || !session.isActive || session.expiresAt < now || session.revokedAt) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.status !== "active") {
      return null;
    }
    return user;
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
 * Update user profile
 * Supports both Convex Auth and session token authentication
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    profile: v.object({
      // Client profile fields
      companyName: v.optional(v.string()),
      companySize: v.optional(v.string()),
      industry: v.optional(v.string()),
      workEmail: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      companyWebsite: v.optional(v.string()),
      country: v.optional(v.string()),
      // Freelancer profile fields
      bio: v.optional(v.string()),
      skills: v.optional(v.array(v.string())),
      techField: v.optional(
        v.union(
          v.literal("development"),
          v.literal("data_science"),
          v.literal("technical_writing"),
          v.literal("design"),
          v.literal("other"),
          v.literal("software_development"),
          v.literal("ui_ux_design"),
          v.literal("data_analytics"),
          v.literal("devops_cloud"),
          v.literal("cybersecurity_it"),
          v.literal("ai_ml_blockchain"),
          v.literal("qa_testing")
        )
      ),
      experienceLevel: v.optional(
        v.union(
          v.literal("junior"),
          v.literal("mid"),
          v.literal("senior"),
          v.literal("expert")
        )
      ),
      languagesWritten: v.optional(v.array(v.string())),
      hourlyRate: v.optional(v.number()),
      availability: v.optional(
        v.union(
          v.literal("available"),
          v.literal("busy"),
          v.literal("unavailable")
        )
      ),
      timezone: v.optional(v.string()),
      portfolioUrl: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      primaryRole: v.optional(v.string()),
      weeklyHours: v.optional(v.number()),
      earliestStartDate: v.optional(v.number()),
    }),
    userId: v.optional(v.id("users")),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId, args.sessionToken);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Update name if provided
    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name) {
      updates.name = args.name;
    }

    // Update profile
    const updatedProfile = {
      ...user.profile,
      ...args.profile,
    };

    updates.profile = updatedProfile;

    await ctx.db.patch(user._id, updates);

    // Log audit
    await ctx.db.insert("auditLogs", {
      action: "profile_updated",
      actionType: "system",
      actorId: user._id,
      actorRole: user.role,
      targetType: "user",
      targetId: user._id,
      details: {
        updatedFields: Object.keys(args.profile),
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = mutation({
  args: {
    preferences: v.object({
      email: v.boolean(),
      push: v.boolean(),
      inApp: v.boolean(),
    }),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(user._id, {
      notificationPreferences: args.preferences,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      action: "notification_preferences_updated",
      actionType: "system",
      actorId: user._id,
      actorRole: user.role,
      targetType: "user",
      targetId: user._id,
      details: args.preferences,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Soft-delete a user by ID (internal - for system use e.g. verification failure)
 */
export const deleteUserAccountInternal = internalMutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    if (user.status === "deleted") return;

    const now = Date.now();
    await ctx.db.patch(args.userId, {
      status: "deleted",
      updatedAt: now,
    });

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.patch(session._id, {
        isActive: false,
        revokedAt: now,
        revokedReason: args.reason || "account_deleted",
        updatedAt: now,
      });
    }

    await ctx.db.insert("auditLogs", {
      action: "account_deleted",
      actionType: "system",
      actorId: args.userId,
      actorRole: user.role,
      targetType: "user",
      targetId: args.userId,
      details: { reason: args.reason },
      createdAt: now,
    });
  },
});

/**
 * Soft-delete account and revoke sessions
 */
export const deleteAccount = mutation({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    if (user.status === "deleted") {
      throw new Error("Account already deleted");
    }

    const now = Date.now();
    await ctx.db.patch(user._id, {
      status: "deleted",
      updatedAt: now,
    });

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const session of sessions) {
      await ctx.db.patch(session._id, {
        isActive: false,
        revokedAt: now,
        revokedReason: "account_deleted",
        updatedAt: now,
      });
    }

    await ctx.db.insert("auditLogs", {
      action: "account_deleted",
      actionType: "system",
      actorId: user._id,
      actorRole: user.role,
      targetType: "user",
      targetId: user._id,
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * Update user role (admin/moderator only)
 */
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    newRole: v.union(
      v.literal("client"),
      v.literal("freelancer"),
      v.literal("moderator"),
      v.literal("admin")
    ),
    adminUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const admin = await getCurrentUserInMutation(ctx, args.adminUserId);
    if (!admin) {
      throw new Error("Not authenticated");
    }

    // Only admin can change roles
    if (admin.role !== "admin") {
      throw new Error("Only admins can change user roles");
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Prevent changing own role
    if (targetUser._id === admin._id) {
      throw new Error("Cannot change your own role");
    }

    // Prevent demoting the last admin
    if (targetUser.role === "admin" && args.newRole !== "admin") {
      const adminCount = await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", "admin"))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();
      if (adminCount.length <= 1) {
        throw new Error("Cannot demote the last admin");
      }
    }

    const now = Date.now();
    await ctx.db.patch(args.userId, {
      role: args.newRole,
      roleChangedAt: now,
      roleChangedBy: admin._id,
      updatedAt: now,
    });

    // Log audit
    await ctx.db.insert("auditLogs", {
      action: "role_changed",
      actionType: "admin",
      actorId: admin._id,
      actorRole: admin.role,
      targetType: "user",
      targetId: args.userId,
      details: {
        oldRole: targetUser.role,
        newRole: args.newRole,
      },
      createdAt: now,
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [args.userId],
      title: "Role updated",
      message: `Your role was updated to ${args.newRole}.`,
      type: "account",
      data: { userId: args.userId, role: args.newRole },
    });

    return { success: true };
  },
});

/**
 * Update user status (admin/moderator only)
 */
export const updateUserStatus = mutation({
  args: {
    userId: v.id("users"),
    newStatus: v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("deleted")
    ),
    adminUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const admin = await getCurrentUserInMutation(ctx, args.adminUserId);
    if (!admin) {
      throw new Error("Not authenticated");
    }

    // Only admin or moderator can change status
    if (admin.role !== "admin" && admin.role !== "moderator") {
      throw new Error("Not authorized to change user status");
    }

    // Only admin can delete users
    if (args.newStatus === "deleted" && admin.role !== "admin") {
      throw new Error("Only admins can delete users");
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Prevent suspending/deleting yourself
    if (targetUser._id === admin._id) {
      throw new Error("Cannot change your own status");
    }

    const now = Date.now();
    await ctx.db.patch(args.userId, {
      status: args.newStatus,
      updatedAt: now,
    });

    // Log audit
    await ctx.db.insert("auditLogs", {
      action: "user_status_changed",
      actionType: admin.role === "admin" ? "admin" : "system",
      actorId: admin._id,
      actorRole: admin.role,
      targetType: "user",
      targetId: args.userId,
      details: {
        oldStatus: targetUser.status,
        newStatus: args.newStatus,
      },
      createdAt: now,
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [args.userId],
      title: "Account status updated",
      message: `Your account status is now ${args.newStatus}.`,
      type: "account",
      data: { userId: args.userId, status: args.newStatus },
    });

    return { success: true };
  },
});

