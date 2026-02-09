import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";

/**
 * Get current user profile
 */
export const getCurrentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    if (!identity.email) {
      return null;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || user.status !== "active") {
      return null;
    }

    // Return user without sensitive data
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
});

/**
 * Get user by ID (public profile)
 */
export const getUserProfile = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.status !== "active") {
      return null;
    }

    // Return public profile only
    const { passwordHash, email, ...publicProfile } = user;
    return publicProfile;
  },
});

/**
 * Get all users (internal - for admin/matching use)
 */
export const getAllUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users;
  },
});

/**
 * Get all users (admin/moderator only)
 */
export const getAllUsersAdmin = query({
  args: {
    role: v.optional(
      v.union(
        v.literal("client"),
        v.literal("freelancer"),
        v.literal("moderator"),
        v.literal("admin")
      )
    ),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("suspended"),
        v.literal("deleted")
      )
    ),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    try {
      // Get current user - try userId (session token) then Convex Auth
      let currentUser: Doc<"users"> | null = null;

      if (args.userId) {
        const userDoc = await ctx.db.get(args.userId);
        if (userDoc && (userDoc as Doc<"users">).status === "active") {
          currentUser = userDoc as Doc<"users">;
        }
      }

      if (!currentUser) {
        const identity = await ctx.auth.getUserIdentity();
        if (identity?.email) {
          const userDoc = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();
          if (userDoc && (userDoc as Doc<"users">).status === "active") {
            currentUser = userDoc as Doc<"users">;
          }
        }
      }

      if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "moderator")) {
        return [];
      }

      // Fetch all users (or filtered by index), then filter in memory to avoid index+filter API issues
      let list: Doc<"users">[];
      if (args.role && args.status) {
        const byRole = await ctx.db
          .query("users")
          .withIndex("by_role", (q) => q.eq("role", args.role!))
          .collect();
        list = byRole.filter((u) => u.status === args.status);
      } else if (args.role) {
        list = await ctx.db
          .query("users")
          .withIndex("by_role", (q) => q.eq("role", args.role!))
          .collect();
      } else if (args.status) {
        list = await ctx.db
          .query("users")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .collect();
      } else {
        list = await ctx.db.query("users").collect();
      }

      return list.map((u) => {
        const { passwordHash, ...rest } = u;
        return rest;
      });
    } catch (error) {
      console.error("Error in getAllUsersAdmin:", error);
      return [];
    }
  },
});

/**
 * Get user by ID (internal - returns name and email for notifications)
 */
export const getUserByIdInternal = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.status !== "active") return null;
    return { _id: user._id, name: user.name, email: user.email };
  },
});

/**
 * Get all moderators and admins (internal - for sending session emails)
 */
export const getModeratorsAndAdminsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.filter(
      (u) =>
        u.status === "active" &&
        (u.role === "moderator" || u.role === "admin")
    ).map((u) => ({ _id: u._id, name: u.name, email: u.email }));
  },
});

