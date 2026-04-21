"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

const internalAny: any = require("../_generated/api").internal;
import type { VettingPathType } from "./paths";
import { getVettingPath } from "./paths";

/**
 * Start the skill test: determine path from profile, create session, get or generate
 * MCQ (and coding prompts if path is coding_mcq), attach to session.
 * Returns { sessionId, pathType, status }.
 */
export const startSkillTest = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    sessionId: Id<"vettingSkillTestSessions">;
    pathType: VettingPathType;
    status: string;
    experienceLevel: string;
    categoryId: string;
  }> => {
    const user = await ctx.runQuery(
      internalAny.users.queries.getUserByIdInternal,
      { userId: args.userId }
    );

    if (!user || user.role !== "freelancer" || user.status !== "active") {
      throw new Error("User not found or not an active freelancer");
    }

    const profile = user.profile ?? {};
    const path = getVettingPath({
      techField: profile.techField,
      experienceLevel: profile.experienceLevel,
      skills: profile.skills,
      languagesWritten: profile.languagesWritten,
    });

    if (!path) {
      throw new Error(
        "Complete your profile first: set your tech category and at least one skill in Dashboard → Profile. " +
        "For Software Development, also add at least one programming language. Then return here to start the skill test."
      );
    }

    const existingVetting = await ctx.runQuery(
      internalAny.vetting.queries.getVettingResultByFreelancer,
      { freelancerId: args.userId }
    );
    if (
      existingVetting?.skillsRetakeAvailableAt != null &&
      Date.now() < existingVetting.skillsRetakeAvailableAt &&
      (existingVetting.skillsAttemptRound ?? 0) >= 1
    ) {
      const remainingMinutes = Math.max(
        1,
        Math.ceil(
          (existingVetting.skillsRetakeAvailableAt - Date.now()) / 60000
        )
      );
      throw new Error(
        `Your skill test retake will be available in about ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}. Please come back when the cooldown ends.`
      );
    }

    const vettingResultId: Id<"vettingResults"> = await ctx.runMutation(
      internalAny.vetting.internalMutations.getOrCreateVettingResult,
      { freelancerId: args.userId }
    );

    const sessionId: Id<"vettingSkillTestSessions"> = await ctx.runMutation(
      internalAny.vetting.internalMutations.createSkillTestSession,
      {
        freelancerId: args.userId,
        vettingResultId,
        pathType: path.pathType,
        experienceLevel: path.experienceLevel,
        categoryId: path.categoryId,
        selectedSkills: path.selectedSkills,
        selectedLanguage: path.selectedLanguage,
      }
    );

    const vettingDoc = await ctx.runQuery(
      internalAny.vetting.internalQueries.getVettingResultDocInternal,
      { vettingResultId }
    );
    const excludeMcq = vettingDoc?.usedMcqQuestionIds ?? [];
    const excludeCoding = vettingDoc?.usedCodingPromptIds ?? [];

    const mcqIds = await ctx.runAction(
      (internalAny as any)["vetting/questionGeneration"].getOrGenerateSkillMcqQuestions,
      {
        categoryId: path.categoryId,
        skillTopics: path.selectedSkills,
        experienceLevel: path.experienceLevel,
        excludeQuestionIds: excludeMcq,
      }
    );

    let codingIds: Id<"vettingCodingPrompts">[] = [];
    if (path.pathType === "coding_mcq" && path.selectedLanguage) {
      codingIds = await ctx.runAction(
        (internalAny as any)["vetting/questionGeneration"].getOrGenerateCodingPrompts,
        {
          categoryId: path.categoryId,
          language: path.selectedLanguage,
          experienceLevel: path.experienceLevel,
          excludePromptIds: excludeCoding,
        }
      );
    }

    await ctx.runMutation(
      internalAny.vetting.internalMutations.updateSkillTestSessionIds,
      {
        sessionId,
        mcqQuestionIds: mcqIds,
        codingPromptIds: codingIds.length > 0 ? codingIds : undefined,
      }
    );

    const status = path.pathType === "coding_mcq" ? "coding" : "mcq";
    return {
      sessionId,
      pathType: path.pathType,
      status,
      experienceLevel: path.experienceLevel,
      categoryId: path.categoryId,
    };
  },
});
