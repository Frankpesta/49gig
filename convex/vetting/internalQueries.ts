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
