import { internalAction } from "../_generated/server";

const internalAny: any = require("../_generated/api").internal;
const DAY_MS = 24 * 60 * 60 * 1000;
const FOURTEEN_DAYS_MS = 14 * DAY_MS;

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
        internalAny.projects.queries.getUnfundedProjectsOlderThanInternal,
        { createdBefore }
      );

      for (const projectId of projectIds) {
        try {
          await ctx.runMutation(
            internalAny.projects.mutations.deleteUnfundedProjectInternal,
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

/**
 * Send unfunded project reminder emails (7 days and 3 days before deletion).
 * Run daily.
 */
export const sendUnfundedProjectReminders = internalAction({
  args: {},
  handler: async (ctx): Promise<{ sent: number }> => {
    const now = Date.now();
    let sent = 0;

    // 7-day reminder: projects created 7 days ago (created between 7 and 8 days ago)
    const sevenDaysAgoStart = now - 8 * DAY_MS;
    const sevenDaysAgoEnd = now - 7 * DAY_MS;
    const projects7d = await ctx.runQuery(
      internalAny.projects.queries.getUnfundedProjectsForReminderInternal,
      { createdAfter: sevenDaysAgoStart, createdBefore: sevenDaysAgoEnd }
    );

    for (const project of projects7d) {
      const client = await ctx.runQuery(
        internalAny.users.queries.getUserByIdInternal,
        { userId: project.clientId }
      );
      if (client?.email) {
        await ctx.runAction(
          internalAny.projects.actions.sendUnfundedProjectReminderEmail,
          {
            clientEmail: client.email,
            clientName: client.name,
            projectName: project.intakeForm.title,
            daysLeft: 7,
          }
        );
        sent++;
      }
    }

    // 3-day reminder: projects created 11 days ago
    const elevenDaysAgoStart = now - 12 * DAY_MS;
    const elevenDaysAgoEnd = now - 11 * DAY_MS;
    const projects3d = await ctx.runQuery(
      internalAny.projects.queries.getUnfundedProjectsForReminderInternal,
      { createdAfter: elevenDaysAgoStart, createdBefore: elevenDaysAgoEnd }
    );

    for (const project of projects3d) {
      const client = await ctx.runQuery(
        internalAny.users.queries.getUserByIdInternal,
        { userId: project.clientId }
      );
      if (client?.email) {
        await ctx.runAction(
          internalAny.projects.actions.sendUnfundedProjectReminderEmail,
          {
            clientEmail: client.email,
            clientName: client.name,
            projectName: project.intakeForm.title,
            daysLeft: 3,
          }
        );
        sent++;
      }
    }

    if (sent > 0) {
      console.log(`[Cron] Unfunded reminders sent: ${sent}`);
    }
    return { sent };
  },
});
