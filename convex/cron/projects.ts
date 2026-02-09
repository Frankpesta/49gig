import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Delete unfunded projects (draft or pending_funding) older than 14 days.
 * Run this cron every 6–12 hours (e.g. every 6 hours).
 */
export const cleanupUnfundedProjectsAfter48h = internalAction({
  args: {},
  handler: async (ctx): Promise<{ deleted: number; errors: string[] }> => {
    const now = Date.now();
    const createdBefore = now - FOURTEEN_DAYS_MS;
    const errors: string[] = [];
    let deleted = 0;

    try {
      const projectIds = await ctx.runQuery(
        internal.projects.queries.getUnfundedProjectsOlderThanInternal,
        { createdBefore }
      );

      for (const projectId of projectIds) {
        try {
          await ctx.runMutation(
            internal.projects.mutations.deleteUnfundedProjectInternal,
            { projectId }
          );
          deleted++;
        } catch (e) {
          errors.push(
            `${projectId}: ${e instanceof Error ? e.message : "Unknown error"}`
          );
        }
      }

      if (deleted > 0 || errors.length > 0) {
        console.log(
          `[Cron] Cleanup unfunded projects: ${deleted} deleted, ${errors.length} errors`
        );
      }
    } catch (error) {
      console.error("[Cron] cleanupUnfundedProjectsAfter48h error:", error);
      errors.push(
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    return { deleted, errors };
  },
});
