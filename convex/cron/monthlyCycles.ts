import { internalAction } from "../_generated/server";

const internalAny: any = require("../_generated/api").internal;

/**
 * Auto-release monthly cycles that have passed their 48h window.
 * Run hourly - releases cycles where client did not approve within 48h of month end.
 */
export const autoReleaseMonthlyCycles = internalAction({
  args: {},
  handler: async (ctx): Promise<{ released: number }> => {
    const ready = await ctx.runQuery(
      internalAny.monthlyBillingCycles.queries.getCyclesReadyForAutoReleaseInternal,
      {}
    );

    let released = 0;
    for (const c of ready) {
      const result = await ctx.runMutation(
        internalAny.monthlyBillingCycles.mutations.autoReleaseMonthlyCycleInternal,
        { monthlyCycleId: c._id }
      );
      if (result?.released) released++;
    }

    if (released > 0) {
      console.log(`[Cron] Auto-released ${released} monthly cycle(s)`);
    }
    return { released };
  },
});

/**
 * Send monthly cycle pending reminders to clients.
 * Run daily - reminds clients who have pending cycles to approve.
 */
export const sendMonthlyCyclePendingReminders = internalAction({
  args: {},
  handler: async (ctx): Promise<{ sent: number }> => {
    const pending = await ctx.runQuery(
      internalAny.monthlyBillingCycles.queries.getPendingCyclesForReminderInternal,
      {}
    );

    const sentTo = new Set<string>(); // Avoid duplicate emails per client per project
    let sent = 0;

    for (const p of pending) {
      const key = `${p.clientId}:${p.projectId}:${p.monthLabel}`;
      if (sentTo.has(key)) continue;
      sentTo.add(key);

      const client = await ctx.runQuery(
        internalAny.users.queries.getUserByIdInternal,
        { userId: p.clientId }
      );
      if (client?.email) {
        await ctx.runAction(
          internalAny.projects.actions.sendMonthlyCyclePendingReminderEmail,
          {
            clientEmail: client.email,
            clientName: client.name,
            projectName: p.projectName,
            monthLabel: p.monthLabel,
          }
        );
        sent++;
      }
    }

    if (sent > 0) {
      console.log(`[Cron] Monthly cycle reminders sent: ${sent}`);
    }
    return { sent };
  },
});
