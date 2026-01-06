import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";

/**
 * Create a match (internal - called by matching action)
 */
export const createMatch = internalMutation({
  args: {
    projectId: v.id("projects"),
    freelancerId: v.id("users"),
    score: v.number(),
    confidence: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    scoringBreakdown: v.object({
      skillOverlap: v.number(),
      vettingScore: v.number(),
      ratings: v.number(),
      availability: v.number(),
      pastPerformance: v.number(),
      timezoneCompatibility: v.number(),
    }),
    explanation: v.string(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if match already exists
    const existing = await ctx.db
      .query("matches")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("freelancerId"), args.freelancerId))
      .first();

    if (existing) {
      // Update existing match
      await ctx.db.patch(existing._id, {
        score: args.score,
        confidence: args.confidence,
        scoringBreakdown: args.scoringBreakdown,
        explanation: args.explanation,
        expiresAt: args.expiresAt,
        updatedAt: now,
      });
      return existing._id;
    }

    // Create new match
    const matchId = await ctx.db.insert("matches", {
      projectId: args.projectId,
      freelancerId: args.freelancerId,
      score: args.score,
      confidence: args.confidence,
      scoringBreakdown: args.scoringBreakdown,
      explanation: args.explanation,
      status: "pending",
      expiresAt: args.expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    return matchId;
  },
});

/**
 * Accept a match (client action)
 */
export const acceptMatch = mutation({
  args: {
    matchId: v.id("matches"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    // Get user
    let user: Doc<"users"> | null = null;
    if (args.userId) {
      const userDoc = await ctx.db.get(args.userId);
      if (userDoc && (userDoc as Doc<"users">).status === "active") {
        user = userDoc as Doc<"users">;
      }
    }

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get project
    const project = await ctx.db.get(match.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only client who owns project can accept
    if (project.clientId !== user._id && user.role !== "admin") {
      throw new Error("Not authorized to accept this match");
    }

    // Only pending matches can be accepted
    if (match.status !== "pending") {
      throw new Error("Match is not in pending status");
    }

    const now = Date.now();

    // Update match status
    await ctx.db.patch(args.matchId, {
      status: "accepted",
      clientAction: "accepted",
      clientActionAt: now,
      updatedAt: now,
    });

    // Update project to matched status
    await ctx.db.patch(match.projectId, {
      matchedFreelancerId: match.freelancerId,
      status: "matched",
      updatedAt: now,
    });

    // Reject all other pending matches for this project
    const otherMatches = await ctx.db
      .query("matches")
      .withIndex("by_project", (q) => q.eq("projectId", match.projectId))
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "pending"),
          q.neq(q.field("_id"), args.matchId)
        )
      )
      .collect();

    for (const otherMatch of otherMatches) {
      await ctx.db.patch(otherMatch._id, {
        status: "rejected",
        updatedAt: now,
      });
    }

    // Log audit
    await ctx.db.insert("auditLogs", {
      action: "match_accepted",
      actionType: user.role === "admin" ? "admin" : "system",
      actorId: user._id,
      actorRole: user.role,
      targetType: "match",
      targetId: args.matchId,
      details: {
        projectId: match.projectId,
        freelancerId: match.freelancerId,
        score: match.score,
      },
      createdAt: now,
    });

    return args.matchId;
  },
});

/**
 * Reject a match (client action)
 */
export const rejectMatch = mutation({
  args: {
    matchId: v.id("matches"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    // Get user
    let user: Doc<"users"> | null = null;
    if (args.userId) {
      const userDoc = await ctx.db.get(args.userId);
      if (userDoc && (userDoc as Doc<"users">).status === "active") {
        user = userDoc as Doc<"users">;
      }
    }

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get project
    const project = await ctx.db.get(match.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only client who owns project can reject
    if (project.clientId !== user._id && user.role !== "admin") {
      throw new Error("Not authorized to reject this match");
    }

    // Only pending matches can be rejected
    if (match.status !== "pending") {
      throw new Error("Match is not in pending status");
    }

    const now = Date.now();

    // Update match status
    await ctx.db.patch(args.matchId, {
      status: "rejected",
      clientAction: "rejected",
      clientActionAt: now,
      updatedAt: now,
    });

    // Log audit
    await ctx.db.insert("auditLogs", {
      action: "match_rejected",
      actionType: user.role === "admin" ? "admin" : "system",
      actorId: user._id,
      actorRole: user.role,
      targetType: "match",
      targetId: args.matchId,
      details: {
        projectId: match.projectId,
        freelancerId: match.freelancerId,
        score: match.score,
      },
      createdAt: now,
    });

    return args.matchId;
  },
});

