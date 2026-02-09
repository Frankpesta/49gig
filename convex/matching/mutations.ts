import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import type { FunctionReference } from "convex/server";

const api = require("../_generated/api") as {
  api: {
    contracts: { actions: { generateAndSendContract: unknown } };
    notifications: { actions: { sendSystemNotification: unknown } };
  };
};

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
    teamRole: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const sendSystemNotification = api.api.notifications.actions
      .sendSystemNotification as unknown as FunctionReference<"action", "internal">;

    const project = await ctx.db.get(args.projectId);

    // Check if match already exists (same project, freelancer, and teamRole if provided)
    const existingList = await ctx.db
      .query("matches")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("freelancerId"), args.freelancerId))
      .collect();
    const existing =
      args.teamRole !== undefined
        ? existingList.find((m) => m.teamRole === args.teamRole)
        : existingList.find((m) => m.teamRole === undefined);

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

      if (project) {
        await ctx.scheduler.runAfter(0, sendSystemNotification, {
          userIds: [args.freelancerId],
          title: "Match updated",
          message: `We refreshed your match for ${project.intakeForm.title}.`,
          type: "match",
          data: { matchId: existing._id, projectId: args.projectId },
        });
      }
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
      teamRole: args.teamRole,
      createdAt: now,
      updatedAt: now,
    });

    if (project) {
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: [args.freelancerId],
        title: "New match opportunity",
        message: `You have a new match for ${project.intakeForm.title}.`,
        type: "match",
        data: { matchId, projectId: args.projectId },
      });
    }

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

    // Client who owns project, matched freelancer, or admin can accept
    const isClient = project.clientId === user._id;
    const isMatchedFreelancer = match.freelancerId === user._id;
    if (!isClient && !isMatchedFreelancer && user.role !== "admin") {
      throw new Error("Not authorized to accept this match");
    }

    // Only pending matches can be accepted
    if (match.status !== "pending") {
      throw new Error("Match is not in pending status");
    }

    const now = Date.now();

    const sendSystemNotification = api.api.notifications.actions
      .sendSystemNotification as unknown as FunctionReference<"action", "internal">;

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

    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [match.freelancerId],
      title: "You’ve been selected",
      message: `You were selected for ${project.intakeForm.title}.`,
      type: "match",
      data: { matchId: args.matchId, projectId: match.projectId },
    });

    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [project.clientId],
      title: "Match accepted",
      message: `Contract generation has started for ${project.intakeForm.title}.`,
      type: "match",
      data: { matchId: args.matchId, projectId: match.projectId },
    });

    // Generate contract and email both parties
    const generateAndSendContract = api.api.contracts.actions
      .generateAndSendContract as unknown as FunctionReference<"action">;

    await ctx.scheduler.runAfter(0, generateAndSendContract, {
      matchId: args.matchId,
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

    // Client who owns project, matched freelancer, or admin can reject
    const isClient = project.clientId === user._id;
    const isMatchedFreelancer = match.freelancerId === user._id;
    if (!isClient && !isMatchedFreelancer && user.role !== "admin") {
      throw new Error("Not authorized to reject this match");
    }

    // Only pending matches can be rejected
    if (match.status !== "pending") {
      throw new Error("Match is not in pending status");
    }

    const now = Date.now();

    const sendSystemNotification = api.api.notifications.actions
      .sendSystemNotification as unknown as FunctionReference<"action", "internal">;

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

    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [match.freelancerId],
      title: "Match declined",
      message: `The client declined the match for ${project.intakeForm.title}.`,
      type: "match",
      data: { matchId: args.matchId, projectId: match.projectId },
    });

    return args.matchId;
  },
});

