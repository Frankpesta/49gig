import { internalAction } from "../_generated/server";

const internalAny: any = require("../_generated/api").internal;

export const processDisputeDeadlines = internalAction({
  args: {},
  handler: async (ctx): Promise<{ processed: number }> => {
    const now = Date.now();
    const dueIds = await ctx.runQuery(
      internalAny.disputes.queries.getDisputesDueForDeadlineInternal,
      { now, limit: 50 }
    );

    let processed = 0;
    for (const disputeId of dueIds) {
      const result = await ctx.runMutation(
        internalAny.disputes.mutations.processDisputeDeadlineInternal,
        { disputeId, now }
      );
      if (result?.processed) processed++;
    }

    if (processed > 0) {
      console.log(`[Cron] Processed ${processed} dispute deadline(s)`);
    }
    return { processed };
  },
});
