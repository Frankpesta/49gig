import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get scheduled calls that overlap with [startTime, endTime].
 * Used to detect conflicts before creating a new session.
 */
export const getOverlappingCallsInternal = internalQuery({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("scheduledCalls")
      .withIndex("by_start_time", (q) => q.lt("startTime", args.endTime))
      .collect();
    return all.filter(
      (c) => c.endTime > args.startTime
    );
  },
});
