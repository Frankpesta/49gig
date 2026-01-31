import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";

async function getCurrentUserInQuery(ctx: any, userId?: string): Promise<Doc<"users"> | null> {
  if (userId) {
    const user = await ctx.db.get(userId as any);
    if (!user || (user as Doc<"users">).status !== "active") return null;
    return user as Doc<"users">;
  }
  const user = await getCurrentUser(ctx);
  if (!user || user.status !== "active") return null;
  return user;
}

/**
 * Get the client's review for a project (if any).
 */
export const getReviewByProject = query({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserInQuery(ctx, args.userId);
    if (!currentUser) throw new Error("Not authenticated");
    return await ctx.db
      .query("reviews")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();
  },
});

/**
 * Get all reviews for a freelancer (for reputation / feedback display).
 */
export const getReviewsForFreelancer = query({
  args: {
    freelancerId: v.id("users"),
    userId: v.optional(v.id("users")), // Viewer (freelancer sees own, clients may see when viewing profile)
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserInQuery(ctx, args.userId);
    if (!currentUser) throw new Error("Not authenticated");
    // Freelancer can see own reviews; clients/admins can see any freelancer's reviews
    const canView =
      args.freelancerId === currentUser._id ||
      currentUser.role === "client" ||
      currentUser.role === "admin" ||
      currentUser.role === "moderator";
    if (!canView) throw new Error("Not authorized to view these reviews");

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .order("desc")
      .take(args.limit ?? 20);
    return reviews;
  },
});

/**
 * Internal: get freelancer rating stats for matching engine.
 */
export const getFreelancerRatingStatsInternal = internalQuery({
  args: { freelancerId: v.id("users") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .collect();
    if (reviews.length === 0) return { averageRating: 0, count: 0 };
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    return {
      averageRating: Math.round((sum / reviews.length) * 10) / 10,
      count: reviews.length,
    };
  },
});

/**
 * Get freelancer's average rating and review count (for matching & public display).
 * No auth required – reputation is public.
 */
export const getFreelancerRatingStats = query({
  args: {
    freelancerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .collect();
    if (reviews.length === 0) {
      return { averageRating: 0, count: 0 };
    }
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    return {
      averageRating: Math.round((sum / reviews.length) * 10) / 10,
      count: reviews.length,
    };
  },
});
