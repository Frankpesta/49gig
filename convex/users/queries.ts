import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { getCurrentUser } from "../auth";
import {
  getFreelancerMatchingReadinessIssues,
  isInOneStepSignupApprovalQueue,
  type MatchingReadinessIssue,
} from "../../lib/freelancer-matching-readiness";

/**
 * Get current user profile (Convex Auth only - requires identity)
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
 * Get full user profile for editing (supports session token for email/password users).
 * Use this when the profile page needs to display skills, techField, etc. from signup.
 */
export const getProfileForEdit = query({
  args: {
    sessionToken: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let user = null;

    if (args.sessionToken) {
      const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken!))
        .first();
      if (session?.isActive && session.expiresAt >= Date.now()) {
        user = await ctx.db.get(session.userId);
      }
    }

    if (!user && args.userId) {
      user = await ctx.db.get(args.userId);
    }

    if (!user && !args.sessionToken && !args.userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.email) {
        user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
      }
    }

    if (!user || user.status !== "active") {
      return null;
    }

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
    /** Admin only: active freelancers with tests (pending_admin) + KYC submitted (pending_review). */
    signupApprovalQueueOnly: v.optional(v.boolean()),
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

      if (args.signupApprovalQueueOnly === true && currentUser.role === "admin") {
        const kycRows = await ctx.db
          .query("kycSubmissions")
          .withIndex("by_status", (q) => q.eq("status", "pending_review"))
          .collect();
        const oneStepQueueIds = new Set<string>();
        const kycSubmittedAtByUser = new Map<string, number>();
        for (const k of kycRows) {
          const f = await ctx.db.get(k.freelancerId);
          if (!f) continue;
          const vetting = await ctx.db
            .query("vettingResults")
            .withIndex("by_freelancer", (q) =>
              q.eq("freelancerId", k.freelancerId)
            )
            .first();
          if (!isInOneStepSignupApprovalQueue(f, vetting, k)) continue;
          oneStepQueueIds.add(String(k.freelancerId));
          kycSubmittedAtByUser.set(String(k.freelancerId), k.submittedAt);
        }

        list = list.filter((u) => oneStepQueueIds.has(String(u._id)));
        list.sort(
          (a, b) =>
            (kycSubmittedAtByUser.get(String(b._id)) ?? 0) -
            (kycSubmittedAtByUser.get(String(a._id)) ?? 0)
        );
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
 * Full user document for admin/moderator (e.g. inspect any account from Users page).
 * Excludes password hash only.
 */
export const getUserProfileForAdmin = query({
  args: {
    targetUserId: v.id("users"),
    adminUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let currentUser: Doc<"users"> | null = null;
    if (args.adminUserId) {
      const u = await ctx.db.get(args.adminUserId);
      if (u && (u as Doc<"users">).status === "active") currentUser = u as Doc<"users">;
    }
    if (!currentUser) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.email) {
        const u = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
        if (u && (u as Doc<"users">).status === "active") currentUser = u as Doc<"users">;
      }
    }
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "moderator")) {
      return null;
    }

    const target = await ctx.db.get(args.targetUserId);
    if (!target) return null;

    const lastSession = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .order("desc")
      .first();

    const { passwordHash, ...rest } = target;
    return { ...rest, _lastSessionIp: lastSession?.ipAddress ?? null };
  },
});

/**
 * Freelancer-facing: concrete reasons the account may be excluded from client matching pools.
 */
export const getMyFreelancerMatchingReadiness = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let user: Doc<"users"> | null = null;
    if (args.userId) {
      const u = await ctx.db.get(args.userId);
      if (u && (u as Doc<"users">).status === "active") user = u as Doc<"users">;
    } else {
      const u = await getCurrentUser(ctx);
      if (u && (u as Doc<"users">).status === "active") user = u as Doc<"users">;
    }
    if (!user || user.role !== "freelancer") {
      return { issues: [] as MatchingReadinessIssue[] };
    }
    return { issues: getFreelancerMatchingReadinessIssues(user) };
  },
});

/**
 * Get user by ID (internal - returns name, email, role, status, profile for callers that need them e.g. vetting)
 */
export const getUserByIdInternal = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.status !== "active") return null;
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      profile: user.profile,
      notificationPreferences: user.notificationPreferences,
    };
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

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Freelancers who signed up but have not finished verification (cron reminder emails).
 */
export const listFreelancersNeedingVerificationReminderInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const minAccountAgeMs = 2 * DAY_MS;
    const reminderCooldownMs = 5 * DAY_MS;

    const freelancers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "freelancer"))
      .collect();

    const eligible: Array<{ userId: Id<"users">; email: string; name: string }> = [];

    for (const u of freelancers) {
      if (u.status !== "active" || !u.email) continue;

      // Respect the user's email notification preference
      if (u.notificationPreferences?.email === false) continue;

      const verification = u.verificationStatus ?? "not_started";
      if (verification !== "not_started" && verification !== "in_progress") continue;

      if (now - u.createdAt < minAccountAgeMs) continue;

      const last = u.verificationIncompleteReminderSentAt ?? 0;
      if (now - last < reminderCooldownMs) continue;

      const vetting = await ctx.db
        .query("vettingResults")
        .withIndex("by_freelancer", (q) => q.eq("freelancerId", u._id))
        .first();

      if (vetting?.weightedTerminationJobScheduled) continue;

      eligible.push({
        userId: u._id,
        email: u.email,
        name: u.name ?? "there",
      });
    }

    return eligible;
  },
});

/**
 * Get emails for admin broadcast. Used by sendAdminBroadcastEmail action.
 */
export const getEmailsForAdminBroadcastInternal = internalQuery({
  args: {
    recipientType: v.union(
      v.literal("all"),
      v.literal("clients"),
      v.literal("freelancers")
    ),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    const active = users.filter((u) => u.status === "active" && u.email);
    if (args.recipientType === "all") {
      return active.map((u) => ({ email: u.email, name: u.name, role: u.role }));
    }
    if (args.recipientType === "clients") {
      return active.filter((u) => u.role === "client").map((u) => ({ email: u.email, name: u.name, role: u.role }));
    }
    if (args.recipientType === "freelancers") {
      return active.filter((u) => u.role === "freelancer").map((u) => ({ email: u.email, name: u.name, role: u.role }));
    }
    return [];
  },
});

/**
 * Get recipient counts for admin broadcast (admin/moderator only)
 */
export const getBroadcastRecipientCounts = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let currentUser: Doc<"users"> | null = null;
    if (args.userId) {
      const u = await ctx.db.get(args.userId);
      if (u && (u as Doc<"users">).status === "active") currentUser = u as Doc<"users">;
    }
    if (!currentUser) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.email) {
        const u = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
        if (u && (u as Doc<"users">).status === "active") currentUser = u as Doc<"users">;
      }
    }
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "moderator")) {
      return null;
    }
    const users = await ctx.db.query("users").collect();
    const active = users.filter((u) => u.status === "active" && u.email);
    return {
      all: active.length,
      clients: active.filter((u) => u.role === "client").length,
      freelancers: active.filter((u) => u.role === "freelancer").length,
    };
  },
});

