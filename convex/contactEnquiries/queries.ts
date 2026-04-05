import { v } from "convex/values";
import { query, internalQuery, QueryCtx } from "../_generated/server";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";

async function getCurrentUserInQuery(
  ctx: QueryCtx,
  userId?: string
): Promise<Doc<"users"> | null> {
  if (userId) {
    const user = await ctx.db.get(userId as Doc<"users">["_id"]);
    if (!user || user.status !== "active") return null;
    return user;
  }
  const user = await getCurrentUser(ctx);
  if (!user || user.status !== "active") return null;
  return user;
}

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
    userId: v.optional(v.id("users")),
    status: v.optional(v.union(v.literal("new"), v.literal("replied"), v.literal("closed"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      return [];
    }

    const limit = args.limit ?? 100;

    // Admins see all enquiries; moderators only see items assigned to them by an admin.
    if (user.role === "moderator") {
      let q = ctx.db
        .query("contactEnquiries")
        .withIndex("by_assigned_moderator_created", (q) =>
          q.eq("assignedModeratorId", user._id)
        );
      if (args.status) {
        q = q.filter((q) => q.eq(q.field("status"), args.status));
      }
      return await q.order("desc").take(limit);
    }

    let q = ctx.db.query("contactEnquiries").withIndex("by_created");
    if (args.status) {
      q = q.filter((q) => q.eq(q.field("status"), args.status));
    }
    return await q.order("desc").take(limit);
  },
});
