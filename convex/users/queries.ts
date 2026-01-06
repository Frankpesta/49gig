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
    // Get user
    let user: Doc<"users"> | null = null;
    if (args.userId) {
      const userDoc = await ctx.db.get(args.userId);
      if (userDoc && (userDoc as Doc<"users">).status === "active") {
        user = userDoc as Doc<"users">;
      }
    }

    if (!user) {
      return [];
    }

    // Only admin or moderator can view all users
    if (user.role !== "admin" && user.role !== "moderator") {
      return [];
    }

    // Build query - use index if available, otherwise filter
    let users;
    
    if (args.role) {
      // Use role index
      const query = ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", args.role!));
      
      // Apply status filter if provided
      if (args.status) {
        users = await query
          .filter((q) => q.eq(q.field("status"), args.status!))
          .collect();
      } else {
        users = await query.collect();
      }
    } else if (args.status) {
      // Use status index
      users = await ctx.db
        .query("users")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      // No filters, get all users
      users = await ctx.db.query("users").collect();
    }

    // Return without sensitive data
    return users.map((u) => {
      const { passwordHash, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
  },
});

