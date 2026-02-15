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

/** Return up to 50 existing MCQ question IDs for a category+level (any matching skill set). */
export const getExistingMcqIds = internalQuery({
  args: {
    categoryId: v.string(),
    experienceLevel: experienceLevelValidator,
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("vettingMcqQuestions")
      .withIndex("by_category_level", (q) =>
        q.eq("categoryId", args.categoryId).eq("experienceLevel", args.experienceLevel)
      )
      .take(60);
    return questions.map((q) => q._id);
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

/** Return up to 5 existing coding prompt IDs for category+language+level. */
export const getExistingCodingPromptIds = internalQuery({
  args: {
    categoryId: v.string(),
    language: v.string(),
    experienceLevel: experienceLevelValidator,
  },
  handler: async (ctx, args) => {
    const prompts = await ctx.db
      .query("vettingCodingPrompts")
      .withIndex("by_category_language_level", (q) =>
        q
          .eq("categoryId", args.categoryId)
          .eq("language", args.language)
          .eq("experienceLevel", args.experienceLevel)
      )
      .take(5);
    return prompts.map((p) => p._id);
  },
});
