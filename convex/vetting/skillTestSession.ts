"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
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
      internal.users.queries.getUserByIdInternal,
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
      throw new Error("Could not determine vetting path. Complete your profile (category, skills).");
    }

    const vettingResultId: Id<"vettingResults"> = await ctx.runMutation(
      internal.vetting.internalMutations.getOrCreateVettingResult,
      { freelancerId: args.userId }
    );

    const sessionId: Id<"vettingSkillTestSessions"> = await ctx.runMutation(
      internal.vetting.internalMutations.createSkillTestSession,
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

    const mcqIds = await ctx.runAction(
      (internal as any)["vetting/questionGeneration"].getOrGenerateSkillMcqQuestions,
      {
        categoryId: path.categoryId,
        skillTopics: path.selectedSkills,
        experienceLevel: path.experienceLevel,
      }
    );

    let codingIds: Id<"vettingCodingPrompts">[] = [];
    if (path.pathType === "coding_mcq" && path.selectedLanguage) {
      codingIds = await ctx.runAction(
        (internal as any)["vetting/questionGeneration"].getOrGenerateCodingPrompts,
        {
          categoryId: path.categoryId,
          language: path.selectedLanguage,
          experienceLevel: path.experienceLevel,
        }
      );
    }

    await ctx.runMutation(
      internal.vetting.internalMutations.updateSkillTestSessionIds,
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
