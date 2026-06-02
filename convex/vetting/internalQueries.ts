/**
 * Internal queries for vetting: fetch question/prompt IDs without exposing correct answers.
 */

import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

const experienceLevelValidator = v.union(
  v.literal("junior"),
  v.literal("mid"),
  v.literal("senior"),
  v.literal("expert")
);

export const getVettingResultDocInternal = internalQuery({
  args: { vettingResultId: v.id("vettingResults") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.vettingResultId);
  },
});

/** Return up to 50 existing MCQ question IDs for a category+skills+level. */
export const getExistingMcqIds = internalQuery({
  args: {
    categoryId: v.string(),
    skillTopics: v.array(v.string()),
    experienceLevel: experienceLevelValidator,
    excludeIds: v.optional(v.array(v.id("vettingMcqQuestions"))),
  },
  handler: async (ctx, args) => {
    const exclude = new Set((args.excludeIds ?? []).map(String));
    const normalizedTarget = [...args.skillTopics].sort().join(",").toLowerCase();
    const questions = await ctx.db
      .query("vettingMcqQuestions")
      .withIndex("by_category_level", (q) =>
        q.eq("categoryId", args.categoryId).eq("experienceLevel", args.experienceLevel)
      )
      .take(500);
    return questions
      .filter((q) => {
        if (exclude.has(String(q._id))) return false;
        const normalized = [...(q.skillTopics ?? [])].sort().join(",").toLowerCase();
        return normalized === normalizedTarget;
      })
      .map((q) => q._id);
  },
});

/** Get correct option index for given MCQ question IDs (for server-side scoring). */
export const getMcqCorrectAnswers = internalQuery({
  args: {
    questionIds: v.array(v.id("vettingMcqQuestions")),
  },
  handler: async (ctx, args) => {
    const out: Array<{ questionId: string; correctOptionIndex: number }> = [];
    for (const id of args.questionIds) {
      const doc = await ctx.db.get(id);
      if (doc) out.push({ questionId: id, correctOptionIndex: doc.correctOptionIndex });
    }
    return out;
  },
});

function getEffectiveScore(session: {
  pathType: string;
  mcqScore?: number;
  portfolioScore?: number;
  codingSubmissions?: Array<{ runResult?: { passed?: number; total?: number } }>;
}): number | null {
  if (session.mcqScore == null) return null;
  if (session.pathType === "mcq_only") return session.mcqScore;
  if (session.pathType === "portfolio_mcq" && session.portfolioScore != null)
    return Math.round(session.portfolioScore * 0.3 + session.mcqScore * 0.7);
  if (session.pathType === "coding_mcq" && session.codingSubmissions?.length) {
    let codingTotal = 0,
      codingPassed = 0;
    for (const sub of session.codingSubmissions) {
      const r = sub.runResult;
      if (r && typeof r.passed === "number" && typeof r.total === "number" && r.total > 0) {
        codingPassed += r.passed;
        codingTotal += r.total;
      }
    }
    const codingScore = codingTotal > 0 ? Math.round((codingPassed / codingTotal) * 100) : 0;
    return Math.round((codingScore + session.mcqScore) / 2);
  }
  return session.mcqScore;
}

/** Count completed skill test sessions with effective score below 60% for a freelancer. */
export const countFailedSkillTestSessions = internalQuery({
  args: {
    freelancerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("vettingSkillTestSessions")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .collect();
    return sessions.filter((s) => {
      if (s.status !== "completed") return false;
      const score = getEffectiveScore(s);
      return score != null && score < 60;
    }).length;
  },
});

/** Get freelancer verification status by userId (for OAuth callback). */
export const getFreelancerVerificationStatusByUserId = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "freelancer") {
      return { isFullyVetted: false, verificationStatus: null };
    }
    const vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.userId))
      .first();
    const isFullyVetted =
      user.verificationStatus === "approved" &&
      (vettingResult?.status ?? null) === "approved" &&
      user.kycStatus === "approved";
    return {
      isFullyVetted,
      verificationStatus: user.verificationStatus ?? null,
    };
  },
});

/** Return up to 5 existing coding prompt IDs for category+language+level. */
export const getExistingCodingPromptIds = internalQuery({
  args: {
    categoryId: v.string(),
    language: v.string(),
    experienceLevel: experienceLevelValidator,
    excludeIds: v.optional(v.array(v.id("vettingCodingPrompts"))),
  },
  handler: async (ctx, args) => {
    const exclude = new Set((args.excludeIds ?? []).map(String));
    const prompts = await ctx.db
      .query("vettingCodingPrompts")
      .withIndex("by_category_language_level", (q) =>
        q
          .eq("categoryId", args.categoryId)
          .eq("language", args.language)
          .eq("experienceLevel", args.experienceLevel)
      )
      .take(40);
    return prompts.filter((p) => !exclude.has(String(p._id))).map((p) => p._id);
  },
});
