import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import type { FunctionReference } from "convex/server";
import { clearReplacementFlowFieldsOnProject } from "../projects/replacement";

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

    // Mark client selection — wait for freelancer confirmation before contract
    await ctx.db.patch(args.matchId, {
      clientAction: "accepted",
      clientActionAt: now,
      updatedAt: now,
    });

    const acceptProjectPatch: Record<string, unknown> = {
      status: "awaiting_freelancer",
      updatedAt: now,
    };
    clearReplacementFlowFieldsOnProject(acceptProjectPatch);
    await ctx.db.patch(match.projectId, acceptProjectPatch as any);

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
      action: "match_client_selected",
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
      title: "Waiting for freelancer confirmation",
      message: `Your selected freelancer for "${project.intakeForm.title}" has been notified and will confirm shortly.`,
      type: "match",
      data: { matchId: args.matchId, projectId: match.projectId },
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

/**
 * Internal: mark a project as awaiting auto-assignment (or clear the flag).
 * Called by generateMatches when no suitable freelancers are found.
 */
export const setProjectAwaitingMatch = internalMutation({
  args: {
    projectId: v.id("projects"),
    awaiting: v.boolean(),
    /** When set, replaces roles awaiting match (omit to leave unchanged). */
    rolesAwaitingMatch: v.optional(v.array(v.string())),
    clearRolesAwaitingMatch: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const project = await ctx.db.get(args.projectId);
    if (!project) return;
    const patch: Record<string, unknown> = {
      awaitingMatch: args.awaiting || undefined,
      awaitingMatchSince: args.awaiting ? (project.awaitingMatchSince ?? now) : undefined,
      updatedAt: now,
    };
    if (args.clearRolesAwaitingMatch) {
      patch.rolesAwaitingMatch = undefined;
    } else if (args.rolesAwaitingMatch !== undefined) {
      patch.rolesAwaitingMatch =
        args.rolesAwaitingMatch.length > 0 ? args.rolesAwaitingMatch : undefined;
    }
    await ctx.db.patch(args.projectId, patch);
  },
});

/**
 * Freelancer responds to a client selection (accept or reject).
 * - Accept: finalise match, set project to "matched", generate contract.
 * - Reject: set match to "rejected", revert project to "matching", email client.
 */
export const respondToMatchAsFreelancer = mutation({
  args: {
    matchId: v.id("matches"),
    response: v.union(v.literal("accepted"), v.literal("rejected")),
    rejectionReason: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    let user: Doc<"users"> | null = null;
    if (args.userId) {
      const u = await ctx.db.get(args.userId);
      if (u && u.status === "active") user = u;
    }
    if (!user) throw new Error("Not authenticated");

    // Only the matched freelancer or admin can respond
    if (match.freelancerId !== user._id && user.role !== "admin") {
      throw new Error("Not authorised");
    }

    // Only respond if client has already selected this match
    if (match.clientAction !== "accepted") {
      throw new Error("Client has not selected this match yet");
    }

    if (match.freelancerAction) {
      throw new Error("You have already responded to this match");
    }

    const project = await ctx.db.get(match.projectId);
    if (!project) throw new Error("Project not found");

    const now = Date.now();
    const sendSystemNotification = api.api.notifications.actions
      .sendSystemNotification as unknown as FunctionReference<"action", "internal">;

    if (args.response === "accepted") {
      // Finalise match
      await ctx.db.patch(args.matchId, {
        status: "accepted",
        freelancerAction: "accepted",
        freelancerActionAt: now,
        updatedAt: now,
      });

      const projectPatch: Record<string, unknown> = {
        matchedFreelancerId: match.freelancerId,
        status: "matched",
        updatedAt: now,
      };
      clearReplacementFlowFieldsOnProject(projectPatch);
      await ctx.db.patch(match.projectId, projectPatch as any);

      // Reject all other pending matches
      const others = await ctx.db
        .query("matches")
        .withIndex("by_project", (q) => q.eq("projectId", match.projectId))
        .filter((q) =>
          q.and(q.neq(q.field("status"), "accepted"), q.neq(q.field("_id"), args.matchId))
        )
        .collect();
      for (const m of others) {
        await ctx.db.patch(m._id, { status: "rejected", updatedAt: now });
      }

      // Log audit
      await ctx.db.insert("auditLogs", {
        action: "match_freelancer_accepted",
        actionType: "system",
        actorId: user._id,
        actorRole: user.role,
        targetType: "match",
        targetId: args.matchId,
        details: { projectId: match.projectId },
        createdAt: now,
      });

      // Notify client
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: [project.clientId],
        title: "Freelancer confirmed",
        message: `Your selected freelancer has accepted the opportunity for "${project.intakeForm.title}". Contract generation is starting.`,
        type: "match",
        data: { matchId: args.matchId, projectId: match.projectId },
      });

      // Generate and send contract
      const generateAndSendContract = api.api.contracts.actions
        .generateAndSendContract as unknown as FunctionReference<"action">;
      await ctx.scheduler.runAfter(0, generateAndSendContract, { matchId: args.matchId });

    } else {
      // Freelancer rejected — revert project to "matching" for new selection
      await ctx.db.patch(args.matchId, {
        status: "rejected",
        freelancerAction: "rejected",
        freelancerActionAt: now,
        freelancerRejectionReason: args.rejectionReason?.trim(),
        updatedAt: now,
      });

      await ctx.db.patch(match.projectId, {
        status: "matching",
        updatedAt: now,
      } as any);

      // Log audit
      await ctx.db.insert("auditLogs", {
        action: "match_freelancer_rejected",
        actionType: "system",
        actorId: user._id,
        actorRole: user.role,
        targetType: "match",
        targetId: args.matchId,
        details: { projectId: match.projectId, reason: args.rejectionReason },
        createdAt: now,
      });

      // Notify client to select a different freelancer
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: [project.clientId],
        title: "Freelancer declined",
        message: `A freelancer has declined the opportunity for "${project.intakeForm.title}". Please review other candidates.`,
        type: "match",
        data: { matchId: args.matchId, projectId: match.projectId, freelancerDeclined: true },
      });
    }

    return { success: true };
  },
});

/**
 * Admin manually assigns a freelancer to a project.
 * Bypasses the scoring/vetting filter. Creates a match with a manually-set score of 100
 * and sets clientAction to "accepted" so the freelancer immediately receives an offer to accept.
 */
export const adminManualMatch = mutation({
  args: {
    projectId: v.id("projects"),
    freelancerId: v.id("users"),
    note: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const adminUser = args.userId
      ? await ctx.db.get(args.userId)
      : null;
    if (!adminUser || adminUser.role !== "admin") {
      throw new Error("Only admins can manually assign freelancers.");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const freelancer = await ctx.db.get(args.freelancerId);
    if (!freelancer || (freelancer.status !== "active")) {
      throw new Error("Freelancer not found or inactive");
    }
    if (freelancer.role !== "freelancer") {
      throw new Error("Selected user is not a freelancer");
    }

    const now = Date.now();
    const sendSystemNotification = api.api.notifications.actions
      .sendSystemNotification as unknown as FunctionReference<"action", "internal">;

    // Check for existing pending match
    const existing = await ctx.db
      .query("matches")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("freelancerId"), args.freelancerId))
      .first();
    if (existing && (existing.status === "pending" || existing.status === "accepted")) {
      throw new Error("A match already exists for this freelancer on this project.");
    }

    // Create the match with high score and admin note
    const matchId = await ctx.db.insert("matches", {
      projectId: args.projectId,
      freelancerId: args.freelancerId,
      status: "pending",
      score: 100,
      confidence: "high",
      scoringBreakdown: {
        skillOverlap: 100,
        vettingScore: 100,
        ratings: 100,
        availability: 100,
        pastPerformance: 100,
        timezoneCompatibility: 100,
      },
      explanation: `Manually assigned by admin${args.note ? `: ${args.note}` : ""}`,
      clientAction: "accepted",
      createdAt: now,
      updatedAt: now,
    });

    // Update project status to awaiting freelancer acceptance
    await ctx.db.patch(args.projectId, {
      status: "awaiting_freelancer",
      updatedAt: now,
    } as any);

    // Audit log
    await ctx.db.insert("auditLogs", {
      action: "admin_manual_match",
      actionType: "admin",
      actorId: adminUser._id,
      actorRole: "admin",
      targetType: "match",
      targetId: matchId,
      details: { projectId: args.projectId, freelancerId: args.freelancerId, note: args.note },
      createdAt: now,
    });

    // Notify freelancer
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [args.freelancerId],
      title: "New hire opportunity",
      message: `You have been matched with a project by the admin${args.note ? `. Note: ${args.note}` : ""}. Please review and accept or decline.`,
      type: "match",
      data: { matchId, projectId: args.projectId },
    });

    // Notify client
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [project.clientId],
      title: "Freelancer assigned",
      message: `An admin has manually assigned a freelancer to "${project.intakeForm.title}". Awaiting their acceptance.`,
      type: "match",
      data: { matchId, projectId: args.projectId },
    });

    return { matchId };
  },
});

