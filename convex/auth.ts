import { query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Resolve the signed-in users row for queries/mutations that accept optional `userId` from the client.
 * Email/password sessions use localStorage + `verifySession` and do not populate Convex Auth identity;
 * those callers must pass `userId`. OAuth / Convex Auth can omit `userId` and fall back to identity email.
 */
export async function resolveViewerUser(
  ctx: QueryCtx | MutationCtx,
  userId?: Id<"users">
): Promise<Doc<"users"> | null> {
  if (userId) {
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const doc = user as Doc<"users">;
    if (doc.status !== "active") return null;
    return doc;
  }
  const user = await getCurrentUser(ctx);
  if (!user) return null;
  const doc = user as Doc<"users">;
  if (doc.status !== "active") return null;
  return doc;
}

/**
 * Canonical viewer resolution for mutations/queries that mirror email/password + Convex Auth.
 * Order:
 * 1. `sessionToken` (when present) — source of truth for custom sessions; avoids acting on a
 *    stale `userId` when the browser row is still valid (e.g. React state vs localStorage).
 * 2. `userId` — active row from DB (matches `getMyWallet`, etc.).
 * 3. Convex Auth identity (`getCurrentUser`) when neither applies.
 */
export async function resolveAuthenticatedUser(
  ctx: QueryCtx | MutationCtx,
  opts: { userId?: Id<"users">; sessionToken?: string }
): Promise<Doc<"users"> | null> {
  const token = opts.sessionToken?.trim();
  if (token) {
    const now = Date.now();
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", token))
      .first();
    if (
      session &&
      session.isActive &&
      session.expiresAt >= now &&
      !session.revokedAt
    ) {
      const sessionUser = await ctx.db.get(session.userId);
      if (
        sessionUser &&
        (sessionUser as Doc<"users">).status === "active"
      ) {
        return sessionUser as Doc<"users">;
      }
    }
  }

  if (opts.userId) {
    const byId = await ctx.db.get(opts.userId);
    if (byId && (byId as Doc<"users">).status === "active") {
      return byId as Doc<"users">;
    }
  }

  return resolveViewerUser(ctx, undefined);
}

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

