import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";

/**
 * Get matches for a project
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
    // Authorization: Only client who owns project, matched freelancer, or admin can view
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

    // Check authorization: client, matched freelancer, or admin/moderator
    const isClient = project.clientId === user._id;
    const isMatchedFreelancer = project.matchedFreelancerId === user._id ||
      (project.matchedFreelancerIds && project.matchedFreelancerIds.includes(user._id));
    if (!isClient && !isMatchedFreelancer && user.role !== "admin" && user.role !== "moderator") {
      return [];
    }

    // Build query
    let query = ctx.db
      .query("matches")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const matches = await query.order("desc").collect();

    // Enrich with freelancer info
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const freelancer = await ctx.db.get(match.freelancerId);
        return {
          ...match,
          freelancer: freelancer
            ? {
                _id: freelancer._id,
                name: freelancer.name,
                email: freelancer.email,
                profile: freelancer.profile,
                resumeBio: freelancer.resumeBio,
              }
            : null,
        };
      })
    );

    return enrichedMatches;
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

