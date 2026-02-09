import { internalAction } from "../_generated/server";
import { internal, api } from "../_generated/api";
import type { FunctionReference } from "convex/server";

const internalAny: any = require("../_generated/api").internal;

/**
 * Auto-release milestone payments
 * Runs every hour to check for milestones that have passed their autoReleaseAt time
 */
export const autoReleaseMilestones = internalAction({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    timestamp: number;
    milestonesReleased: number;
    errors: string[];
  }> => {
    const now = Date.now();
    const errors: string[] = [];
    let milestonesReleased = 0;

    try {
      // Query milestones that are approved and have passed their autoReleaseAt time
      const milestonesToRelease = await ctx.runQuery(
        // @ts-expect-error - Type instantiation depth issue with internal API types
        internal.projects.queries.getMilestonesReadyForAutoRelease,
        { now }
      );

      console.log(
        `[Cron] Auto-release milestones at ${new Date(now).toISOString()}`,
        `Found ${milestonesToRelease.length} milestones ready for release`
      );

      // Release each milestone
      for (const milestone of milestonesToRelease) {
        try {
          // Get project to access clientId and freelancerId
          const project = await ctx.runQuery(internal.projects.queries.getProjectInternal, {
            projectId: milestone.projectId,
          });

          if (!project) {
            errors.push(`Project not found for milestone ${milestone._id}`);
            continue;
          }

          if (!project.matchedFreelancerId) {
            errors.push(`No freelancer matched for milestone ${milestone._id}`);
            continue;
          }

          // Get freelancer to check for subaccount
          const freelancer = await ctx.runQuery(internal.payments.queries.verifyUser, {
            userId: project.matchedFreelancerId,
          });

          if (!freelancer) {
            errors.push(`Freelancer not found for milestone ${milestone._id}`);
            continue;
          }

          const freelancerDoc = freelancer as typeof freelancer & {
            flutterwaveSubaccountId?: string;
          };

          if (!freelancerDoc.flutterwaveSubaccountId) {
            errors.push(
              `Freelancer ${project.matchedFreelancerId} has no subaccount for milestone ${milestone._id}`
            );
            continue;
          }

          // Call the release action
          const releaseAction = api.payments.actions.releaseMilestonePayment as unknown as FunctionReference<
            "action",
            "public"
          >;

          await ctx.runAction(releaseAction, {
            milestoneId: milestone._id,
            userId: project.clientId, // Use client ID as the actor
          });

          milestonesReleased++;
          console.log(`[Cron] Released milestone ${milestone._id}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          errors.push(`Failed to release milestone ${milestone._id}: ${errorMessage}`);
          console.error(`[Cron] Error releasing milestone ${milestone._id}:`, error);
        }
      }

      console.log(
        `[Cron] Auto-release completed: ${milestonesReleased} released, ${errors.length} errors`
      );

      return {
        success: true,
        timestamp: now,
        milestonesReleased,
        errors,
      };
    } catch (error) {
      console.error("[Cron] Auto-release milestones error:", error);
      return {
        success: false,
        timestamp: now,
        milestonesReleased: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  },
});
