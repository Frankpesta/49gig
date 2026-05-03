import { query, internalQuery, type QueryCtx } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc, Id } from "../_generated/dataModel";

async function getCurrentUserInQuery(
  ctx: QueryCtx,
  userId?: string
): Promise<Doc<"users"> | null> {
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
 * Resolve which freelancer seat a client's review refers to on this hire.
 */
function reviewTargetFreelancerIdFromProject(
  project: Doc<"projects">,
  freelancerId?: Id<"users">
): Id<"users"> | null {
  const team = project.matchedFreelancerIds ?? [];
  if (team.length > 0) {
    if (!freelancerId) return null;
    return team.some((id) => String(id) === String(freelancerId))
      ? freelancerId
      : null;
  }
  const solo = project.matchedFreelancerId;
  if (!solo) return null;
  if (freelancerId && String(freelancerId) !== String(solo)) return null;
  return solo;
}

/**
 * Client/admin: load the saved review row for one freelancer seat on this hire (if any).
 */
export const getReviewByProject = query({
  args: {
    projectId: v.id("projects"),
    freelancerId: v.optional(v.id("users")),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserInQuery(ctx, args.userId);
    if (!currentUser) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    const isPrivileged =
      currentUser.role === "admin" || currentUser.role === "moderator";
    if (
      project.clientId !== currentUser._id &&
      !isPrivileged
    ) {
      throw new Error("Not authorized");
    }

    const targetId = reviewTargetFreelancerIdFromProject(project, args.freelancerId);
    if (!targetId) return null;

    return await ctx.db
      .query("reviews")
      .withIndex("by_project_freelancer", (q) =>
        q.eq("projectId", args.projectId).eq("freelancerId", targetId)
      )
      .unique();
  },
});

/**
 * Freelancers see reviews on their own profile; admins/moderators inspect any freelancer.
 * Clients never browse another user's rating history via this endpoint.
 */
export const getReviewsForFreelancer = query({
  args: {
    freelancerId: v.id("users"),
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserInQuery(ctx, args.userId);
    if (!currentUser) throw new Error("Not authenticated");
    const canView =
      args.freelancerId === currentUser._id ||
      currentUser.role === "admin" ||
      currentUser.role === "moderator";

    if (!canView || currentUser.role === "client") {
      throw new Error("Not authorized to view these reviews");
    }

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
 * Freelancer-visible rating rollup for profile cards. Clients calling this intentionally get zeros — they must not browse reputation.
 */
export const getFreelancerRatingStats = query({
  args: {
    freelancerId: v.id("users"),
    viewerUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const viewer = await ctx.db.get(args.viewerUserId);
    if (!viewer || viewer.status !== "active") {
      return { averageRating: 0 as const, count: 0 as const };
    }

    const isPrivileged =
      viewer.role === "admin" || viewer.role === "moderator";
    const isSelf = String(viewer._id) === String(args.freelancerId);
    const isFreelancerPeer =
      viewer.role === "freelancer" &&
      String(viewer._id) !== String(args.freelancerId);

    if (
      viewer.role === "client" ||
      !(isPrivileged || isSelf || isFreelancerPeer)
    ) {
      return { averageRating: 0 as const, count: 0 as const };
    }

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .collect();
    if (reviews.length === 0) {
      return { averageRating: 0 as const, count: 0 as const };
    }
    const sum = reviews.reduce((s, r) => s + r.rating, 0);
    return {
      averageRating: Math.round((sum / reviews.length) * 10) / 10,
      count: reviews.length,
    };
  },
});
