import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Internal: insert a scheduled call after Google Meet event is created.
 */
export const createScheduledCallInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
    freelancerIds: v.array(v.id("users")),
    startTime: v.number(),
    endTime: v.number(),
    meetLink: v.string(),
    googleEventId: v.optional(v.string()),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("scheduledCalls", {
      projectId: args.projectId,
      freelancerIds: args.freelancerIds,
      startTime: args.startTime,
      endTime: args.endTime,
      meetLink: args.meetLink,
      googleEventId: args.googleEventId,
      title: args.title,
      createdAt: now,
      updatedAt: now,
    });
  },
});
