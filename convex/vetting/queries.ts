import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";

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

    return {
      userId: user._id,
      verificationStatus: user.verificationStatus || "not_started",
      verificationCompletedAt: user.verificationCompletedAt,
      vettingResult: vettingResult
        ? {
            status: vettingResult.status,
            currentStep: vettingResult.currentStep,
            stepsCompleted: vettingResult.stepsCompleted,
            overallScore: vettingResult.overallScore,
            englishProficiency: vettingResult.englishProficiency,
            skillAssessments: vettingResult.skillAssessments,
            fraudFlags: vettingResult.fraudFlags,
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

    // Only admins, moderators, or the freelancer themselves can view
    const isAuthorized =
      user.role === "admin" ||
      user.role === "moderator" ||
      user._id === args.freelancerId;

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
 * Get all pending verifications (admin/moderator only)
 */
export const getPendingVerifications = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("in_progress"),
        v.literal("flagged")
      )
    ),
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

    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      throw new Error("Unauthorized");
    }

    const status = args.status || "pending";
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
 */
export const isFreelancerVerified = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      return { verified: false, reason: "not_authenticated" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return { verified: false, reason: "user_not_found" };
    }

    // If userId is provided, check that user instead (for admin checks)
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

/**
 * Get current skill test session for a freelancer (most recent in-progress or completed).
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
    const session = await ctx.db
      .query("vettingSkillTestSessions")
      .withIndex("by_freelancer_created", (q) => q.eq("freelancerId", userId!))
      .order("desc")
      .first();
    if (!session) return null;
    const expiresAt = session.expiresAt ?? session.startedAt + 30 * 60 * 1000;
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

