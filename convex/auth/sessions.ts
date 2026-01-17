import { internalMutation, mutation, query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Session configuration constants
 */
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const REFRESH_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const ROTATION_INTERVAL_MS = 60 * 60 * 1000; // 1 hour - rotate tokens every hour
const MAX_ROTATION_COUNT = 100; // Maximum number of rotations before requiring re-auth

/**
 * Generate a secure random token
 */
function generateToken(): string {
  // In production, use crypto.randomBytes or similar
  return `token_${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Create a new session for a user
 */
export const createSession = mutation({
  args: {
    userId: v.id("users"),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sessionToken = generateToken();
    const refreshToken = generateToken();

    const sessionId = await ctx.db.insert("sessions", {
      userId: args.userId,
      sessionToken,
      refreshToken,
      expiresAt: now + SESSION_DURATION_MS,
      refreshExpiresAt: now + REFRESH_DURATION_MS,
      lastRotatedAt: now,
      rotationCount: 0,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return {
      sessionId,
      sessionToken,
      refreshToken,
      expiresAt: now + SESSION_DURATION_MS,
    };
  },
});

/**
 * Rotate session token
 * Called periodically to refresh the session token
 */
export const rotateSessionToken = mutation({
  args: {
    refreshToken: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find session by refresh token
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_refresh_token", (q) =>
        q.eq("refreshToken", args.refreshToken)
      )
      .first();

    if (!session) {
      throw new Error("Invalid refresh token");
    }

    if (!session.isActive) {
      throw new Error("Session is not active");
    }

    if (session.revokedAt) {
      throw new Error("Session has been revoked");
    }

    // Check if refresh token is expired
    if (session.refreshExpiresAt < now) {
      // Revoke session
      await ctx.db.patch(session._id, {
        isActive: false,
        revokedAt: now,
        revokedReason: "refresh_token_expired",
        updatedAt: now,
      });
      throw new Error("Refresh token expired");
    }

    // Check rotation count
    if (session.rotationCount >= MAX_ROTATION_COUNT) {
      // Revoke session - requires re-authentication
      await ctx.db.patch(session._id, {
        isActive: false,
        revokedAt: now,
        revokedReason: "max_rotations_reached",
        updatedAt: now,
      });
      throw new Error("Maximum rotations reached. Please sign in again.");
    }

    // Check if rotation is needed (token is close to expiry or rotation interval passed)
    const timeSinceLastRotation = now - session.lastRotatedAt;
    const timeUntilExpiry = session.expiresAt - now;

    // Rotate if:
    // 1. Token expires in less than 1 hour, OR
    // 2. It's been more than 1 hour since last rotation
    if (timeUntilExpiry < ROTATION_INTERVAL_MS || timeSinceLastRotation >= ROTATION_INTERVAL_MS) {
      const newSessionToken = generateToken();
      const newExpiresAt = now + SESSION_DURATION_MS;

      await ctx.db.patch(session._id, {
        sessionToken: newSessionToken,
        expiresAt: newExpiresAt,
        lastRotatedAt: now,
        rotationCount: session.rotationCount + 1,
        updatedAt: now,
      });

      // Create audit log
      await ctx.db.insert("auditLogs", {
        action: "session_token_rotated",
        actionType: "auth",
        actorId: session.userId,
        actorRole: "client", // Will be updated from user data if needed
        targetType: "session",
        targetId: session._id,
        details: {
          rotationCount: session.rotationCount + 1,
        },
        createdAt: now,
      });

      return {
        sessionToken: newSessionToken,
        expiresAt: newExpiresAt,
        rotationCount: session.rotationCount + 1,
      };
    }

    // No rotation needed, return current token info
    return {
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
      rotationCount: session.rotationCount,
    };
  },
});

/**
 * Validate session token
 */
export const validateSession = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session) {
      return { valid: false, reason: "session_not_found" };
    }

    if (!session.isActive) {
      return { valid: false, reason: "session_inactive" };
    }

    if (session.revokedAt) {
      return { valid: false, reason: "session_revoked" };
    }

    if (session.expiresAt < now) {
      return { valid: false, reason: "session_expired" };
    }

    return {
      valid: true,
      userId: session.userId,
      expiresAt: session.expiresAt,
    };
  },
});

/**
 * Revoke session (logout)
 */
export const revokeSession = mutation({
  args: {
    sessionToken: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session) {
      throw new Error("Session not found");
    }

    // Only allow users to revoke their own sessions
    if (session.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    await ctx.db.patch(session._id, {
      isActive: false,
      revokedAt: now,
      revokedReason: args.reason || "user_logout",
      updatedAt: now,
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "session_revoked",
      actionType: "auth",
      actorId: user._id,
      actorRole: user.role,
      targetType: "session",
      targetId: session._id,
      details: {
        reason: args.reason || "user_logout",
      },
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * Revoke all sessions for a user
 */
export const revokeAllSessions = mutation({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    const targetUserId = args.userId || currentUser._id;

    // Only allow users to revoke their own sessions, or admins to revoke any
    if (targetUserId !== currentUser._id && currentUser.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const session of sessions) {
      await ctx.db.patch(session._id, {
        isActive: false,
        revokedAt: now,
        revokedReason: "all_sessions_revoked",
        updatedAt: now,
      });
    }

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "all_sessions_revoked",
      actionType: "auth",
      actorId: currentUser._id,
      actorRole: currentUser.role,
      targetType: "user",
      targetId: targetUserId,
      details: {
        sessionsRevoked: sessions.length,
      },
      createdAt: now,
    });

    return { success: true, sessionsRevoked: sessions.length };
  },
});

/**
 * Get active sessions for a user
 */
export const getActiveSessions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return [];
    }

    const now = Date.now();
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter out expired sessions
    const activeSessions = sessions
      .filter((s) => s.expiresAt > now && !s.revokedAt)
      .map((s) => ({
        _id: s._id,
        createdAt: s.createdAt,
        lastRotatedAt: s.lastRotatedAt,
        expiresAt: s.expiresAt,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        rotationCount: s.rotationCount,
      }));

    return activeSessions;
  },
});

/**
 * Cleanup expired or revoked sessions
 */
export const cleanupSessions = internalMutation({
  args: {
    now: v.number(),
    revokeBefore: v.number(),
  },
  handler: async (ctx, args) => {
    const expiredSessions = await ctx.db
      .query("sessions")
      .withIndex("by_expires", (q) => q.lt("expiresAt", args.now))
      .collect();

    const revokedSessionsAll = await ctx.db
      .query("sessions")
      .withIndex("by_active", (q) => q.eq("isActive", false))
      .collect();
    const revokedSessions = revokedSessionsAll.filter((s) =>
      s.revokedAt && s.revokedAt < args.revokeBefore
    );

    const toDelete = new Map();
    for (const s of expiredSessions) {
      toDelete.set(s._id, s);
    }
    for (const s of revokedSessions) {
      toDelete.set(s._id, s);
    }

    for (const session of toDelete.values()) {
      await ctx.db.delete(session._id);
    }

    return {
      expiredDeleted: expiredSessions.length,
      revokedDeleted: revokedSessions.length,
      totalDeleted: toDelete.size,
    };
  },
});
