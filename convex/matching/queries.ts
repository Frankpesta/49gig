import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";

/** Client-safe display name: first name + last initial (e.g. "Daniel O.") */
function toDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0]!;
  const first = parts[0]!;
  const lastInitial = parts[parts.length - 1]!.charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
}

/**
 * Get matches for a project.
 * For clients: returns freelancer data safe for client view (no email, displayName only, vetting score).
 */
export const getMatches = query({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.id("users")),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("rejected"),
        v.literal("expired")
      )
    ),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return [];
    }

    let user: Doc<"users"> | null = null;
    if (args.userId) {
      const userDoc = await ctx.db.get(args.userId);
      if (userDoc && (userDoc as Doc<"users">).status === "active") {
        user = userDoc as Doc<"users">;
      }
    }

    if (!user) {
      return [];
    }

    const isClient = project.clientId === user._id;
    const isMatchedFreelancer = project.matchedFreelancerId === user._id ||
      (project.matchedFreelancerIds && project.matchedFreelancerIds.includes(user._id));
    if (!isClient && !isMatchedFreelancer && user.role !== "admin" && user.role !== "moderator") {
      return [];
    }

    let matchQuery = ctx.db
      .query("matches")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId));

    if (args.status) {
      matchQuery = matchQuery.filter((q) => q.eq(q.field("status"), args.status));
    }

    const matches = await matchQuery.order("desc").collect();

    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const freelancer = await ctx.db.get(match.freelancerId);
        const vettingResult = await ctx.db
          .query("vettingResults")
          .withIndex("by_freelancer", (q) => q.eq("freelancerId", match.freelancerId))
          .first();

        const vettingScore = vettingResult?.overallScore ?? match.scoringBreakdown.vettingScore ?? 0;
        const vettingStatus = vettingResult?.status ?? null;

        return {
          ...match,
          vettingScore: Math.round(vettingScore),
          vettingStatus,
          freelancer: freelancer
            ? {
                _id: freelancer._id,
                displayName: toDisplayName(freelancer.name),
                profile: freelancer.profile,
                resumeBio: freelancer.resumeBio,
                verificationStatus: freelancer.verificationStatus,
              }
            : null,
        };
      })
    );

    return enrichedMatches;
  },
});

/**
 * Get client-safe freelancer profile for "View profile" modal.
 * Caller must be the project client and the freelancer must be a match for that project.
 */
export const getFreelancerPublicProfile = query({
  args: {
    projectId: v.id("projects"),
    freelancerId: v.id("users"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || project.clientId !== args.userId) {
      return null;
    }
    const match = await ctx.db
      .query("matches")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("freelancerId"), args.freelancerId))
      .first();
    if (!match) return null;

    const freelancer = await ctx.db.get(args.freelancerId);
    if (!freelancer || freelancer.role !== "freelancer") return null;

    const vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .first();

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .collect();
    const ratingCount = reviews.length;
    const averageRating =
      ratingCount > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / ratingCount) * 10) / 10
        : 0;

    return {
      displayName: toDisplayName(freelancer.name),
      profile: freelancer.profile,
      resumeBio: freelancer.resumeBio,
      verificationStatus: freelancer.verificationStatus,
      vettingScore: Math.round(vettingResult?.overallScore ?? match.scoringBreakdown.vettingScore ?? 0),
      vettingStatus: vettingResult?.status ?? null,
      averageRating,
      reviewCount: ratingCount,
    };
  },
});

/**
 * Get a specific match
 */
export const getMatch = internalQuery({
  args: {
    projectId: v.id("projects"),
    freelancerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db
      .query("matches")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("freelancerId"), args.freelancerId))
      .first();

    return match;
  },
});

/**
 * Get matches for a freelancer
 */
export const getFreelancerMatches = query({
  args: {
    freelancerId: v.id("users"),
    userId: v.optional(v.id("users")),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("rejected"),
        v.literal("expired")
      )
    ),
  },
  handler: async (ctx, args) => {
    // Authorization: Only the freelancer themselves or admin can view
    let user: Doc<"users"> | null = null;
    if (args.userId) {
      const userDoc = await ctx.db.get(args.userId);
      if (userDoc && (userDoc as Doc<"users">).status === "active") {
        user = userDoc as Doc<"users">;
      }
    }

    if (!user) {
      return [];
    }

    if (args.freelancerId !== user._id && user.role !== "admin" && user.role !== "moderator") {
      return [];
    }

    // Build query
    let query = ctx.db
      .query("matches")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const matches = await query.order("desc").collect();

    // Enrich with project info
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const project = await ctx.db.get(match.projectId);
        return {
          ...match,
          project: project
            ? {
                _id: project._id,
                intakeForm: project.intakeForm,
                status: project.status,
                totalAmount: project.totalAmount,
                currency: project.currency,
              }
            : null,
        };
      })
    );

    return enrichedMatches;
  },
});

