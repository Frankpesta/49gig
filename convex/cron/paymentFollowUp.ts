import { internalAction } from "../_generated/server";

const internalAny: any = require("../_generated/api").internal;

const GRACE_DAYS = 14;
const REMINDER_THROTTLE_DAYS = 3;

/**
 * Send payment follow-up reminders and terminate projects that didn't fund within grace.
 * Run daily. Finds in-progress projects where current month > lastFundedMonthIndex,
 * sends reminder (throttled); if past grace period, cancels project.
 */
export const sendPaymentFollowUpRemindersAndTerminate = internalAction({
  args: {},
  handler: async (ctx): Promise<{ remindersSent: number; terminated: number }> => {
    const now = Date.now();

    const list = await ctx.runQuery(
      internalAny.projects.queries.getProjectsNeedingPaymentFollowUpInternal,
      {
        now,
        graceDays: GRACE_DAYS,
        reminderThrottleDays: REMINDER_THROTTLE_DAYS,
      }
    );

    let remindersSent = 0;
    let terminated = 0;

    for (const item of list) {
      if (item.shouldTerminate) {
        await ctx.runMutation(
          internalAny.projects.mutations.cancelProjectForNonPaymentInternal,
          { projectId: item.projectId }
        );
        terminated++;

        await ctx.runAction(internalAny.notifications.actions.sendSystemNotification, {
          userIds: [item.clientId],
          title: "Hire ended — payment not received",
          message: `Your hire "${item.title}" has been ended because the next month's payment was not received within the 14-day grace period. You can reactivate it by adding payment from the project page.`,
          type: "payment",
          data: { projectId: item.projectId },
        });
      } else if (item.sendReminder) {
        await ctx.runMutation(
          internalAny.projects.mutations.markPaymentReminderSentInternal,
          { projectId: item.projectId }
        );
        remindersSent++;

        await ctx.runAction(internalAny.notifications.actions.sendSystemNotification, {
          userIds: [item.clientId],
          title: "Fund next month for your hire",
          message: `Your paid period for "${item.title}" is ending. Please add payment for the next month(s) to avoid interruption. After ${GRACE_DAYS} days without payment, the hire will be ended.`,
          type: "payment",
          data: { projectId: item.projectId },
        });
      }
    }

    if (remindersSent > 0 || terminated > 0) {
      console.log(
        `[Cron] Payment follow-up: ${remindersSent} reminder(s), ${terminated} project(s) terminated`
      );
    }

    return { remindersSent, terminated };
  },
});
