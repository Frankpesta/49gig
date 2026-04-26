/**
 * Internal mutations for vetting: store generated MCQ and coding prompts, and skill test sessions.
 * Only callable from server (e.g. actions), not from the client.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { runCompleteVerificationForFreelancer } from "./completeVerificationCore";
import { hardDeleteUserAccount } from "../users/hardDeleteUser";

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

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const internalAny = require("../_generated/api").internal as any;

/**
 * Remove freelancer after verification failure (same outcome as failing a retake).
 * Invoked synchronously from other mutations or after a delayed scheduler run for weighted-score failure.
 */
export const terminateFreelancerVerificationFailure = internalMutation({
  args: {
    freelancerId: v.id("users"),
    vettingResultId: v.id("vettingResults"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const freelancer = await ctx.db.get(args.freelancerId);
    if (!freelancer || freelancer.role !== "freelancer" || freelancer.status !== "active") {
      return { skipped: true as const };
    }
    const vettingRow = await ctx.db.get(args.vettingResultId);
    if (!vettingRow || vettingRow.freelancerId !== args.freelancerId) {
      return { skipped: true as const };
    }

    const now = Date.now();
    const email = freelancer.email ?? "";
    const name = freelancer.name ?? "there";

    await ctx.scheduler.runAfter(
      0,
      internalAny.vetting.staffEmails.sendVerificationTerminatedEmailInternal,
      { email, name }
    );

    try {
      await hardDeleteUserAccount(ctx, {
        targetUserId: args.freelancerId,
        auditActorId: args.freelancerId,
        auditActorRole: "system",
        auditActionType: "system",
        reason: `verification_failure:${args.reason}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await ctx.db.patch(args.vettingResultId, {
        status: "rejected",
        weightedTerminationJobScheduled: undefined,
        weightedFailureScheduledFor: undefined,
        updatedAt: Date.now(),
      });
      await ctx.db.patch(args.freelancerId, {
        status: "deleted",
        verificationStatus: "rejected",
        updatedAt: Date.now(),
      });
      await ctx.runMutation(internalAny.auth.sessions.revokeAllSessionsForUserInternal, {
        userId: args.freelancerId,
        reason: "verification_terminated",
      });
      await ctx.db.insert("auditLogs", {
        action: "freelancer_verification_failure_hard_delete_blocked",
        actionType: "system",
        actorId: args.freelancerId,
        actorRole: freelancer.role,
        targetType: "vettingResult",
        targetId: args.vettingResultId,
        details: { reason: args.reason, error: message },
        createdAt: now,
      });
      return { skipped: false as const, hardDeleteFailed: true as const };
    }

    return { skipped: false as const, hardDeleteFailed: false as const };
  },
});

/**
 * After the skill test is fully submitted, automatically runs the same logic as
 * the former "Submit for review" (completeVerification).
 */
export const runAutoCompleteVerification = internalMutation({
  args: { freelancerId: v.id("users") },
  handler: async (ctx, args) => {
    try {
      await runCompleteVerificationForFreelancer(ctx, args.freelancerId);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const row = await ctx.db
        .query("vettingResults")
        .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
        .first();
      if (row) {
        await ctx.db.patch(row._id, {
          autoFinalizeError: message,
          updatedAt: Date.now(),
        });
      }
    }
  },
});
