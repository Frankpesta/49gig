import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Verify session token and get user
 * This allows custom session tokens to work with Convex
 */
export const verifySession = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Find session by token
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      return null;
    }

    // Get user
    const user = await ctx.db.get(session.userId);
    if (!user || user.status !== "active") {
      return null;
    }

    // Return user without sensitive data
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
});



/**
 * List sessions for the current user via session token (custom auth)
 */
export const listSessionsForToken = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || !session.isActive || session.expiresAt < Date.now()) {
      return { currentSessionId: null, sessions: [] };
    }

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .order("desc")
      .collect();

    return {
      currentSessionId: session._id,
      sessions: sessions.map((s) => ({
        _id: s._id,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        lastRotatedAt: s.lastRotatedAt,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        isActive: s.isActive,
        revokedAt: s.revokedAt,
        revokedReason: s.revokedReason,
      })),
    };
  },
});
