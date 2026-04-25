import { query, internalQuery, QueryCtx } from "../_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";

async function resolveViewerForVerificationQuery(
  ctx: QueryCtx,
  adminUserId?: Id<"users">
): Promise<Doc<"users"> | null> {
  if (adminUserId) {
    const u = await ctx.db.get(adminUserId);
    if (!u || u.status !== "active") return null;
    return u;
  }
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.email) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", identity.email!))
    .first();
}

/**
 * Get verification status for current freelancer
 * Returns null if user is not a freelancer or not authenticated
 * Works with both Convex Auth and session tokens
 */
export const getVerificationStatus = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let user = null;

    // If userId is provided, use it directly (for session token auth)
    if (args.userId) {
      user = await ctx.db.get(args.userId);
    } else {
      // Try Convex Auth
      const identity = await ctx.auth.getUserIdentity();
      if (!identity || !identity.email) {
        return null;
      }

      // User authenticated via Convex Auth
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
    }

    // Check if user exists and is active
    if (!user || user.status !== "active") {
      return null;
    }

    // Check if user is a freelancer
    if (user.role !== "freelancer") {
      return null;
    }

    // Get verification results
    const vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .first();

    const kycSubmission = await ctx.db
      .query("kycSubmissions")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .first();

    return {
      userId: user._id,
      verificationStatus: user.verificationStatus || "not_started",
      verificationCompletedAt: user.verificationCompletedAt,
      kycStatus: user.kycStatus ?? "not_submitted",
      kycApprovedAt: user.kycApprovedAt,
      vettingResult: vettingResult
        ? {
            status: vettingResult.status,
            currentStep: vettingResult.currentStep,
            stepsCompleted: vettingResult.stepsCompleted,
            overallScore: vettingResult.overallScore,
            englishProficiency: vettingResult.englishProficiency,
            skillAssessments: vettingResult.skillAssessments,
            fraudFlags: vettingResult.fraudFlags,
            englishAttemptRound: vettingResult.englishAttemptRound ?? 0,
            skillsAttemptRound: vettingResult.skillsAttemptRound ?? 0,
            englishFailedAttempts: vettingResult.englishFailedAttempts ?? 0,
            skillsFailedAttempts: vettingResult.skillsFailedAttempts ?? 0,
            englishRetakeAvailableAt: vettingResult.englishRetakeAvailableAt,
            skillsRetakeAvailableAt: vettingResult.skillsRetakeAvailableAt,
            usedMcqQuestionIds: vettingResult.usedMcqQuestionIds,
            usedCodingPromptIds: vettingResult.usedCodingPromptIds,
            verificationEvaluatedAt: vettingResult.verificationEvaluatedAt,
            autoFinalizeError: vettingResult.autoFinalizeError,
            weightedTerminationJobScheduled: vettingResult.weightedTerminationJobScheduled ?? false,
            weightedFailureScheduledFor: vettingResult.weightedFailureScheduledFor,
          }
        : null,
      kycSubmission: kycSubmission
        ? {
            status: kycSubmission.status,
            idType: kycSubmission.idType,
            addressDocType: kycSubmission.addressDocType,
            idRejectionCount: kycSubmission.idRejectionCount,
            addressRejectionCount: kycSubmission.addressRejectionCount,
          }
        : null,
    };
  },
});

/**
 * Get verification results by freelancer ID (admin/moderator only)
 */
export const getVerificationResults = query({
  args: {
    freelancerId: v.id("users"),
    adminUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const viewer = await resolveViewerForVerificationQuery(ctx, args.adminUserId);
    if (!viewer) {
      throw new Error("Not authenticated");
    }

    // Only admins, moderators, or the freelancer themselves can view
    const isAuthorized =
      viewer.role === "admin" ||
      viewer.role === "moderator" ||
      viewer._id === args.freelancerId;

    if (!isAuthorized) {
      throw new Error("Unauthorized");
    }

    const freelancer = await ctx.db.get(args.freelancerId);
    if (!freelancer || freelancer.role !== "freelancer") {
      throw new Error("Freelancer not found");
    }

    const vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .first();

    return {
      freelancer: {
        _id: freelancer._id,
        name: freelancer.name,
        email: freelancer.email,
        verificationStatus: freelancer.verificationStatus,
        verificationCompletedAt: freelancer.verificationCompletedAt,
      },
      vettingResult,
    };
  },
});

/**
 * Get all pending verifications (admin only)
 */
export const getPendingVerifications = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("in_progress"),
        v.literal("flagged"),
        v.literal("pending_admin")
      )
    ),
    adminUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const viewer = await resolveViewerForVerificationQuery(ctx, args.adminUserId);
    if (!viewer || viewer.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const status = args.status ?? "pending_admin";
    const results = await ctx.db
      .query("vettingResults")
      .withIndex("by_status", (q) => q.eq("status", status))
      .collect();

    // Get freelancer details for each result
    const resultsWithFreelancers = await Promise.all(
      results.map(async (result) => {
        const freelancer = await ctx.db.get(result.freelancerId);
        return {
          ...result,
          freelancer: freelancer
            ? {
                _id: freelancer._id,
                name: freelancer.name,
                email: freelancer.email,
              }
            : null,
        };
      })
    );

    return resultsWithFreelancers;
  },
});

/**
 * Check if freelancer is verified and can access platform
 * Supports both Convex Auth (identity) and session token auth
 */
export const isFreelancerVerified = query({
  args: {
    userId: v.optional(v.id("users")),
    sessionToken: v.optional(v.string()),
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

    if (!user) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.email) {
        user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
      }
    }

    if (!user) {
      return { verified: false, reason: "not_authenticated" };
    }

    const targetUserId = args.userId || user._id;
    if (targetUserId !== user._id && user.role !== "admin" && user.role !== "moderator") {
      throw new Error("Unauthorized");
    }

    const targetUser = await ctx.db.get(targetUserId);
    if (!targetUser || targetUser.role !== "freelancer") {
      return { verified: false, reason: "not_freelancer" };
    }

    // Check verification status
    if (targetUser.verificationStatus !== "approved") {
      return {
        verified: false,
        reason: "not_verified",
        status: targetUser.verificationStatus || "not_started",
      };
    }

    // Double-check with vetting results
    const vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", targetUserId))
      .first();

    if (!vettingResult || vettingResult.status !== "approved") {
      return {
        verified: false,
        reason: "vetting_not_approved",
        status: vettingResult?.status || "not_found",
      };
    }

    // KYC must also be approved for matching
    if (targetUser.kycStatus !== "approved") {
      return {
        verified: false,
        reason: "kyc_not_approved",
        status: targetUser.kycStatus || "not_submitted",
      };
    }

    return { verified: true };
  },
});

/**
 * Get vetting result by freelancer ID (internal)
 */
export const getVettingResultByFreelancer = internalQuery({
  args: {
    freelancerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .first();

    return vettingResult;
  },
});

/** Aligned with submit mutations: submissions allowed shortly after timer hits zero. */
const SKILL_TEST_SUBMIT_GRACE_MS = 5 * 60 * 1000;
const DEFAULT_SKILL_TEST_DURATION_MS = 30 * 60 * 1000;

function skillSessionExpiresAt(session: Doc<"vettingSkillTestSessions">): number {
  return session.expiresAt ?? session.startedAt + DEFAULT_SKILL_TEST_DURATION_MS;
}

/**
 * Whether this row is an in-flight session the client should resume (not a finished attempt).
 */
function isResumableSkillSession(session: Doc<"vettingSkillTestSessions">, now: number): boolean {
  if (session.status === "completed") return false;
  return now <= skillSessionExpiresAt(session) + SKILL_TEST_SUBMIT_GRACE_MS;
}

/**
 * Get the active skill test session for a freelancer (in-progress, still within expiry + grace).
 * Completed sessions are omitted so a failed first attempt does not trap the UI on the score card
 * when vetting has already cleared the skills step for retake; the client then shows "Start skill test".
 */
export const getSkillTestSession = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let userId = args.userId;
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity?.email) return null;
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
      if (!user || user.role !== "freelancer") return null;
      userId = user._id;
    }
    const now = Date.now();
    const sessions = await ctx.db
      .query("vettingSkillTestSessions")
      .withIndex("by_freelancer_created", (q) => q.eq("freelancerId", userId!))
      .order("desc")
      .take(40);
    const session = sessions.find((s) => isResumableSkillSession(s, now));
    if (!session) return null;
    const expiresAt = skillSessionExpiresAt(session);
    return {
      _id: session._id,
      status: session.status,
      pathType: session.pathType,
      experienceLevel: session.experienceLevel,
      categoryId: session.categoryId,
      selectedSkills: session.selectedSkills,
      selectedLanguage: session.selectedLanguage,
      codingPromptIds: session.codingPromptIds ?? [],
      mcqQuestionIds: session.mcqQuestionIds ?? [],
      mcqScore: session.mcqScore,
      startedAt: session.startedAt,
      expiresAt,
      completedAt: session.completedAt,
      vettingResultId: session.vettingResultId,
    };
  },
});

/**
 * Get MCQ questions for a session (question text + options only; correct answer never sent to client).
 */
export const getMcqQuestionsForSession = query({
  args: {
    sessionId: v.id("vettingSkillTestSessions"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    let userId = args.userId;
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity?.email) return null;
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
      if (!user) return null;
      userId = user._id;
    }
    if (session.freelancerId !== userId) return null;
    const ids = session.mcqQuestionIds ?? [];
    if (ids.length === 0) return [];
    const out: Array<{ _id: string; questionText: string; options: string[]; questionIndex: number }> = [];
    for (let i = 0; i < ids.length; i++) {
      const doc = await ctx.db.get(ids[i]);
      if (doc) {
        out.push({
          _id: doc._id,
          questionText: doc.questionText,
          options: doc.options,
          questionIndex: doc.questionIndex,
        });
      }
    }
    out.sort((a, b) => a.questionIndex - b.questionIndex);
    return out;
  },
});

/**
 * Get coding prompts for a session.
 */
export const getCodingPromptsForSession = query({
  args: {
    sessionId: v.id("vettingSkillTestSessions"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    let userId = args.userId;
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity?.email) return null;
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
      if (!user) return null;
      userId = user._id;
    }
    if (session.freelancerId !== userId) return null;
    const ids = session.codingPromptIds ?? [];
    if (ids.length === 0) return [];
    const out: Array<{
      _id: string;
      title: string;
      description: string;
      starterCode?: string;
      promptIndex: number;
      testCases?: Array<{ input: string; expectedOutput: string }>;
    }> = [];
    for (const id of ids) {
      const doc = await ctx.db.get(id);
      if (doc) {
        out.push({
          _id: doc._id,
          title: doc.title,
          description: doc.description,
          starterCode: doc.starterCode,
          promptIndex: doc.promptIndex,
          testCases: doc.testCases,
        });
      }
    }
    out.sort((a, b) => a.promptIndex - b.promptIndex);
    return out;
  },
});

