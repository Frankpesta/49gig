import { query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

/**
 * Helper function to get current user from context
 * Can be used in queries, mutations, and actions
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  // Find user by email
  if (!identity.email) {
    return null;
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", identity.email!))
    .first();

  return user;
}

/**
 * Get the current authenticated user (query)
 * Returns null if not authenticated
 */
export const getCurrentUserQuery = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

/**
 * Check if user has a specific role
 * Server-side authorization check
 */
export const hasRole = query({
  args: {
    requiredRole: v.union(
      v.literal("client"),
      v.literal("freelancer"),
      v.literal("moderator"),
      v.literal("admin")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    if (!identity.email) {
      return false;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || user.status !== "active") {
      return false;
    }

    // Admin has access to everything
    if (user.role === "admin") {
      return true;
    }

    // Moderator has access to moderator and below
    if (args.requiredRole === "moderator" && user.role === "moderator") {
      return true;
    }

    // Exact role match
    return user.role === args.requiredRole;
  },
});

/**
 * Get user by ID (with authorization check)
 */
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    if (!identity.email) {
      return null;
    }
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!currentUser || currentUser.status !== "active") {
      return null;
    }

    // Users can view their own profile
    // Admins and moderators can view any profile
    if (
      currentUser._id === args.userId ||
      currentUser.role === "admin" ||
      currentUser.role === "moderator"
    ) {
      const user = await ctx.db.get(args.userId);
      return user;
    }

    return null;
  },
});

