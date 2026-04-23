import { internalAction } from "../_generated/server";

// Avoid "excessively deep" TS instantiation with `internal` (see convex/cron/projects.ts).
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const internalAny: any = require("../_generated/api").internal;

/**
 * Email freelancers who have not completed verification (tests / onboarding).
 * Run daily; each user receives at most one email per 7 days.
 */
export const sendIncompleteVerificationReminders = internalAction({
  args: {},
  handler: async (ctx): Promise<{ sent: number; errors: string[] }> => {
    const errors: string[] = [];
    let sent = 0;

    const recipients = await ctx.runQuery(
      internalAny.users.queries.listFreelancersNeedingVerificationReminderInternal,
      {}
    );

    for (const row of recipients) {
      try {
        await ctx.runAction(internalAny.vetting.staffEmails.sendVerificationIncompleteReminderInternal, {
          email: row.email,
          name: row.name,
        });
        await ctx.runMutation(internalAny.users.mutations.markVerificationIncompleteReminderSentInternal, {
          userId: row.userId,
        });
        sent++;
      } catch (e) {
        errors.push(`${row.userId}: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }

    if (sent > 0 || errors.length > 0) {
      console.log(
        `[Cron] Incomplete verification reminders: ${sent} sent, ${errors.length} errors`
      );
    }

    return { sent, errors };
  },
});
