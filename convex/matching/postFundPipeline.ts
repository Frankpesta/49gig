import { internalAction } from "../_generated/server";
import { v } from "convex/values";

const internalAny = require("../_generated/api").internal as any;
const apiAny = require("../_generated/api").api as any;

/**
 * Runs after pre-funding payment succeeds: generate post-fund matches, then accept
 * the client's pre-selected freelancer(s). Ordering avoids races between matching
 * and acceptance.
 */
export const runPostFundMatchingForProject = internalAction({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.runQuery(internalAny.projects.queries.getProjectInternal, {
      projectId: args.projectId,
    });
    if (!project || project.status !== "funded") {
      return;
    }

    // Skip auto-generation when automatic matching is disabled; admins match manually.
    // Still run acceptSelectedMatchInternal below for any pre-selected freelancer(s).
    const automaticMatchingEnabled = await ctx.runQuery(
      internalAny.platformSettings.queries.getAutomaticMatchingEnabledInternal,
      {}
    );

    if (automaticMatchingEnabled) {
      try {
        if (project.intakeForm.hireType === "team") {
          await ctx.runAction(apiAny.matching.actions.generateTeamMatches, {
            projectId: args.projectId,
          });
        } else {
          await ctx.runAction(apiAny.matching.actions.generateMatches, {
            projectId: args.projectId,
            limit: 10,
          });
        }
      } catch (e) {
        console.error("[postFundMatching] generate failed", args.projectId, e);
      }
    }

    await ctx.runMutation(internalAny.projects.mutations.acceptSelectedMatchInternal, {
      projectId: args.projectId,
    });
  },
});
