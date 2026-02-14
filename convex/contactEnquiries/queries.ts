import { v } from "convex/values";
import { query, internalQuery } from "../_generated/server";
import { getCurrentUser } from "../auth";

/**
 * Internal: Get enquiry by ID (for actions).
 */
export const getEnquiryByIdInternal = internalQuery({
  args: { enquiryId: v.id("contactEnquiries") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.enquiryId);
  },
});

/**
 * List contact enquiries. Admin/moderator only.
 */
export const getContactEnquiries = query({
  args: {
    status: v.optional(v.union(v.literal("new"), v.literal("replied"), v.literal("closed"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      return [];
    }

    let q = ctx.db.query("contactEnquiries").withIndex("by_created");
    if (args.status) {
      q = q.filter((q) => q.eq(q.field("status"), args.status));
    }
    const enquiries = await q.order("desc").take(args.limit ?? 100);
    return enquiries;
  },
});
