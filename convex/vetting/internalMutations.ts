/**
 * Internal mutations for vetting: store generated MCQ and coding prompts, and skill test sessions.
 * Only callable from server (e.g. actions), not from the client.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

const experienceLevelValidator = v.union(
  v.literal("junior"),
  v.literal("mid"),
  v.literal("senior"),
  v.literal("expert")
);

export const insertVettingMcqBatch = internalMutation({
  args: {
    questions: v.array(
      v.object({
        questionKey: v.string(),
        categoryId: v.string(),
        skillTopics: v.array(v.string()),
        experienceLevel: experienceLevelValidator,
        questionIndex: v.number(),
        questionText: v.string(),
        options: v.array(v.string()),
        correctOptionIndex: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ids: string[] = [];
    for (const q of args.questions) {
      const id = await ctx.db.insert("vettingMcqQuestions", {
        questionKey: q.questionKey,
        categoryId: q.categoryId,
        skillTopics: q.skillTopics,
        experienceLevel: q.experienceLevel,
        questionIndex: q.questionIndex,
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        createdAt: now,
      });
      ids.push(id);
    }
    return ids as any;
  },
});

export const insertVettingCodingBatch = internalMutation({
  args: {
    prompts: v.array(
      v.object({
        promptKey: v.string(),
        categoryId: v.string(),
        language: v.string(),
        experienceLevel: experienceLevelValidator,
        promptIndex: v.number(),
        title: v.string(),
        description: v.string(),
        starterCode: v.optional(v.string()),
        testCases: v.optional(
          v.array(
            v.object({
              input: v.string(),
              expectedOutput: v.string(),
            })
          )
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ids: string[] = [];
    for (const p of args.prompts) {
      const id = await ctx.db.insert("vettingCodingPrompts", {
        promptKey: p.promptKey,
        categoryId: p.categoryId,
        language: p.language,
        experienceLevel: p.experienceLevel,
        promptIndex: p.promptIndex,
        title: p.title,
        description: p.description,
        starterCode: p.starterCode,
        testCases: p.testCases,
        createdAt: now,
      });
      ids.push(id);
    }
    return ids as any;
  },
});

/** Get or create vetting result for freelancer (returns vettingResultId). */
export const getOrCreateVettingResult = internalMutation({
  args: { freelancerId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .first();
    if (existing) return existing._id;
    const now = Date.now();
    return await ctx.db.insert("vettingResults", {
      freelancerId: args.freelancerId,
      englishProficiency: {},
      skillAssessments: [],
      overallScore: 0,
      status: "pending",
      currentStep: "english",
      stepsCompleted: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Create a new skill test session (called from startSkillTest action). */
export const createSkillTestSession = internalMutation({
  args: {
    freelancerId: v.id("users"),
    vettingResultId: v.id("vettingResults"),
    pathType: v.union(
      v.literal("coding_mcq"),
      v.literal("portfolio_mcq"),
      v.literal("mcq_only")
    ),
    experienceLevel: experienceLevelValidator,
    categoryId: v.string(),
    selectedSkills: v.array(v.string()),
    selectedLanguage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const THIRTY_MINUTES_MS = 30 * 60 * 1000;
    const status =
      args.pathType === "coding_mcq"
        ? "coding"
        : args.pathType === "portfolio_mcq"
        ? "portfolio_review"
        : "mcq";
    const id = await ctx.db.insert("vettingSkillTestSessions", {
      freelancerId: args.freelancerId,
      vettingResultId: args.vettingResultId,
      status,
      pathType: args.pathType,
      experienceLevel: args.experienceLevel,
      categoryId: args.categoryId,
      selectedSkills: args.selectedSkills,
      selectedLanguage: args.selectedLanguage,
      startedAt: now,
      expiresAt: now + THIRTY_MINUTES_MS,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

/** Patch session with question/prompt IDs and optional status (called from startSkillTest action). */
export const updateSkillTestSessionIds = internalMutation({
  args: {
    sessionId: v.id("vettingSkillTestSessions"),
    mcqQuestionIds: v.optional(v.array(v.id("vettingMcqQuestions"))),
    codingPromptIds: v.optional(v.array(v.id("vettingCodingPrompts"))),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.mcqQuestionIds !== undefined) updates.mcqQuestionIds = args.mcqQuestionIds;
    if (args.codingPromptIds !== undefined) updates.codingPromptIds = args.codingPromptIds;
    if (args.status !== undefined) updates.status = args.status;
    await ctx.db.patch(args.sessionId, updates as any);
    return { ok: true };
  },
});
