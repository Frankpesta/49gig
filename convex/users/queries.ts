import { query } from "../_generated/server";
import { v } from "convex/values";

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

