import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import type { FunctionReference } from "convex/server";
import { clearReplacementFlowFieldsOnProject } from "../projects/replacement";
import { getRoleLabelsForProjectIntake } from "../../lib/team-slots";
import {
  isTeamProject,
  openTeamRoleLabelsForProject,
  projectEligibleForAdminManualMatch,
} from "../projects/manualMatchEligibility";
import { isFreelancerPermanentlyExcluded } from "../match_exclusions";

const api = require("../_generated/api") as {
  api: {
    contracts: { actions: { generateAndSendContract: unknown } };
    notifications: { actions: { sendSystemNotification: unknown } };
    projects: { actions: { sendManualMatchFoundClientEmail: unknown } };
    wallets: { mutations: { clearPendingRefundsForProject: unknown } };
  };
};

const internalAny = require("../_generated/api").internal as {
  projects: {
    actions: { sendMatchSuccessEmails: FunctionReference<"action", "internal"> };
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
    const clearPendingRefundsForProject = api.api.wallets.mutations
      .clearPendingRefundsForProject as unknown as FunctionReference<
      "mutation",
      "internal"
    >;

    const project = await ctx.db.get(args.projectId);

    if (
      project &&
      isFreelancerPermanentlyExcluded(project, args.freelancerId as string)
    ) {
      throw new Error("Freelancer is not eligible for this hire.");
    }

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

    if (
      (project.clientId === user._id || user.role === "admin") &&
      isFreelancerPermanentlyExcluded(project, match.freelancerId as string)
    ) {
      throw new Error(
        "This freelancer is no longer available for this hire. Refresh the page to see current matches."
      );
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
 * - Accept: record freelancer confirmation; for single hire (or team roster complete) finalize
 *   `matched` and generate contract. For team hires still filling slots, stay on `matching` until
 *   everyone client-selected has accepted and headcount is complete.
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
    const clearPendingRefundsForProject = api.api.wallets.mutations
      .clearPendingRefundsForProject as unknown as FunctionReference<
      "mutation",
      "internal"
    >;

    if (args.response === "accepted") {
      await ctx.db.patch(args.matchId, {
        status: "accepted",
        freelancerAction: "accepted",
        freelancerActionAt: now,
        updatedAt: now,
      });

      const allProjectMatches = await ctx.db
        .query("matches")
        .withIndex("by_project", (q) => q.eq("projectId", match.projectId))
        .collect();

      const intake = project.intakeForm;
      const isTeam = intake.hireType === "team";
      const clientAcceptedMatches = allProjectMatches.filter(
        (m) => m.clientAction === "accepted"
      );
      const allFreelancerAcceptedOnClientPicks = clientAcceptedMatches.every(
        (m) => m.freelancerAction === "accepted"
      );
      const confirmedFreelancerIdsFromMatches = [
        ...new Set(
          clientAcceptedMatches
            .filter((m) => m.freelancerAction === "accepted")
            .map((m) => m.freelancerId)
        ),
      ];

      const slotsRemain = (project.pendingTeamMemberSlots ?? 0) > 0;
      const awaitingMoreClientPicks = project.awaitingMatch === true && slotsRemain;

      if (isTeam && clientAcceptedMatches.length > 0) {
        if (!allFreelancerAcceptedOnClientPicks) {
          await ctx.db.patch(match.projectId, {
            status: awaitingMoreClientPicks ? "matching" : "awaiting_freelancer",
            matchedFreelancerIds:
              confirmedFreelancerIdsFromMatches.length > 0
                ? confirmedFreelancerIdsFromMatches
                : undefined,
            updatedAt: now,
          } as any);

          await ctx.db.insert("auditLogs", {
            action: "match_freelancer_accepted",
            actionType: "system",
            actorId: user._id,
            actorRole: user.role,
            targetType: "match",
            targetId: args.matchId,
            details: { projectId: match.projectId, partialTeam: true },
            createdAt: now,
          });

          await ctx.scheduler.runAfter(0, sendSystemNotification, {
            userIds: [project.clientId],
            title: "Team member confirmed",
            message: awaitingMoreClientPicks
              ? `A freelancer has accepted for "${project.intakeForm.title}". Complete your team when ready.`
              : `A freelancer on your team has accepted "${project.intakeForm.title}". Waiting for remaining confirmations.`,
            type: "match",
            data: { matchId: args.matchId, projectId: match.projectId },
          });

          return {
            success: true,
            projectId: match.projectId,
            contractFlowStarted: false,
          };
        }

        if (awaitingMoreClientPicks) {
          await ctx.db.patch(match.projectId, {
            status: "matching",
            matchedFreelancerIds:
              confirmedFreelancerIdsFromMatches.length > 0
                ? confirmedFreelancerIdsFromMatches
                : undefined,
            updatedAt: now,
          } as any);

          await ctx.db.insert("auditLogs", {
            action: "match_freelancer_accepted",
            actionType: "system",
            actorId: user._id,
            actorRole: user.role,
            targetType: "match",
            targetId: args.matchId,
            details: { projectId: match.projectId, awaitingMoreMembers: true },
            createdAt: now,
          });

          await ctx.scheduler.runAfter(0, sendSystemNotification, {
            userIds: [project.clientId],
            title: "Team selections confirmed",
            message: `Everyone selected so far has accepted for "${project.intakeForm.title}". Add more team members when you're ready.`,
            type: "match",
            data: { matchId: args.matchId, projectId: match.projectId },
          });

          return {
            success: true,
            projectId: match.projectId,
            contractFlowStarted: false,
          };
        }

        const mergedIds = [
          ...new Set(clientAcceptedMatches.map((m) => m.freelancerId)),
        ];
        const teamFinalPatch: Record<string, unknown> = {
          matchedFreelancerIds: mergedIds,
          status: "matched",
          matchedAt: project.matchedAt ?? now,
          updatedAt: now,
        };
        clearReplacementFlowFieldsOnProject(teamFinalPatch);
        await ctx.db.patch(match.projectId, teamFinalPatch as any);
        await ctx.runMutation(clearPendingRefundsForProject, {
          userId: project.clientId,
          projectId: match.projectId,
        });

        for (const m of allProjectMatches) {
          if (m._id === args.matchId) continue;
          if (mergedIds.includes(m.freelancerId)) continue;
          if (m.status === "rejected") continue;
          await ctx.db.patch(m._id, { status: "rejected", updatedAt: now });
        }

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

        await ctx.scheduler.runAfter(0, sendSystemNotification, {
          userIds: [project.clientId],
          title: "Freelancer confirmed",
          message: `Your selected freelancer(s) have accepted the opportunity for "${project.intakeForm.title}". Contract generation is starting.`,
          type: "match",
          data: { matchId: args.matchId, projectId: match.projectId },
        });
        await ctx.scheduler.runAfter(0, sendSystemNotification, {
          userIds: [project.clientId],
          title: "Continuation credit applied",
          message: `Your pending dispute refund hold for "${project.intakeForm.title}" has been applied to continuation with your new freelancer.`,
          type: "payment",
          data: { projectId: match.projectId, continuationCreditApplied: true },
        });

        await ctx.scheduler.runAfter(0, internalAny.projects.actions.sendMatchSuccessEmails, {
          projectId: match.projectId,
        });
        const generateAndSendContract = api.api.contracts.actions
          .generateAndSendContract as unknown as FunctionReference<"action">;
        await ctx.scheduler.runAfter(0, generateAndSendContract, { matchId: args.matchId });
      } else {
        const projectPatch: Record<string, unknown> = {
          matchedFreelancerId: match.freelancerId,
          status: "matched",
          updatedAt: now,
        };
        clearReplacementFlowFieldsOnProject(projectPatch);
        await ctx.db.patch(match.projectId, projectPatch as any);
        await ctx.runMutation(clearPendingRefundsForProject, {
          userId: project.clientId,
          projectId: match.projectId,
        });

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

        await ctx.scheduler.runAfter(0, sendSystemNotification, {
          userIds: [project.clientId],
          title: "Freelancer confirmed",
          message: `Your selected freelancer has accepted the opportunity for "${project.intakeForm.title}". Contract generation is starting.`,
          type: "match",
          data: { matchId: args.matchId, projectId: match.projectId },
        });
        await ctx.scheduler.runAfter(0, sendSystemNotification, {
          userIds: [project.clientId],
          title: "Continuation credit applied",
          message: `Your pending dispute refund hold for "${project.intakeForm.title}" has been applied to continuation with your new freelancer.`,
          type: "payment",
          data: { projectId: match.projectId, continuationCreditApplied: true },
        });

        await ctx.scheduler.runAfter(0, internalAny.projects.actions.sendMatchSuccessEmails, {
          projectId: match.projectId,
        });
        const generateAndSendContract = api.api.contracts.actions
          .generateAndSendContract as unknown as FunctionReference<"action">;
        await ctx.scheduler.runAfter(0, generateAndSendContract, { matchId: args.matchId });
      }

      return {
        success: true,
        projectId: match.projectId,
        contractFlowStarted: true,
      };
    }

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

    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [project.clientId],
      title: "Freelancer declined",
      message: `A freelancer has declined the opportunity for "${project.intakeForm.title}". Please review other candidates.`,
      type: "match",
      data: { matchId: args.matchId, projectId: match.projectId, freelancerDeclined: true },
    });

    return { success: true, contractFlowStarted: false };
  },
});

/**
 * Admin manually assigns a freelancer to a project.
 * Bypasses scoring/vetting and creates a pending candidate for the client to review.
 */
export const adminManualMatch = mutation({
  args: {
    projectId: v.id("projects"),
    freelancerId: v.id("users"),
    note: v.optional(v.string()),
    /** For team hires with open slots, which role this candidate fills (label e.g. "Backend developer #1"). */
    teamRole: v.optional(v.string()),
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
    if (!(await projectEligibleForAdminManualMatch(ctx, project))) {
      throw new Error(
        "Manual matching is only for hires with awaitingMatch (draft–funded queue) or status matching, with no one matched yet on single hires, or open team role/headcount on team hires."
      );
    }

    const freelancer = await ctx.db.get(args.freelancerId);
    if (!freelancer || (freelancer.status !== "active")) {
      throw new Error("Freelancer not found or inactive");
    }
    if (freelancer.role !== "freelancer") {
      throw new Error("Selected user is not a freelancer");
    }

    if (
      project.matchedFreelancerId === args.freelancerId ||
      project.matchedFreelancerIds?.includes(args.freelancerId)
    ) {
      throw new Error("This freelancer is already on the hire team.");
    }

    if (isFreelancerPermanentlyExcluded(project, args.freelancerId as string)) {
      throw new Error(
        "This freelancer was removed from this hire after a dispute and cannot be suggested again."
      );
    }

    let resolvedTeamRole: string | undefined;
    if (isTeamProject(project)) {
      const openLabels = await openTeamRoleLabelsForProject(ctx, project);
      const allLabels = getRoleLabelsForProjectIntake(project.intakeForm);
      const trimmed = args.teamRole?.trim();
      if (trimmed) {
        resolvedTeamRole = trimmed;
      } else if (openLabels.length > 0) {
        resolvedTeamRole = openLabels[0];
      } else if (allLabels.length > 0) {
        const projectMatches = await ctx.db
          .query("matches")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
          .collect();
        const filledAccepted = new Set(
          projectMatches
            .filter((m) => m.status === "accepted" && m.teamRole)
            .map((m) => m.teamRole as string)
        );
        const missing = allLabels.find((l) => !filledAccepted.has(l));
        resolvedTeamRole = missing;
      }

      if (allLabels.length > 0 && openLabels.length > 0) {
        const chosen = resolvedTeamRole;
        if (
          !chosen ||
          !openLabels.some((r) => r.toLowerCase() === chosen.toLowerCase())
        ) {
          throw new Error(
            `Team role must be one of the open roles: ${openLabels.join(", ")}`
          );
        }
      }
    }

    const now = Date.now();
    const sendSystemNotification = api.api.notifications.actions
      .sendSystemNotification as unknown as FunctionReference<"action", "internal">;
    const sendManualMatchFoundClientEmail = api.api.projects.actions
      .sendManualMatchFoundClientEmail as unknown as FunctionReference<"action", "internal">;

    const sameFreelancerMatches = await ctx.db
      .query("matches")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("freelancerId"), args.freelancerId))
      .collect();
    const existing =
      resolvedTeamRole !== undefined
        ? sameFreelancerMatches.find((m) => m.teamRole === resolvedTeamRole)
        : sameFreelancerMatches.find((m) => m.teamRole === undefined);
    if (existing && (existing.status === "pending" || existing.status === "accepted")) {
      throw new Error("A match already exists for this freelancer on this project.");
    }

    // Create the match with high score and admin note
    const matchId = await ctx.db.insert("matches", {
      projectId: args.projectId,
      freelancerId: args.freelancerId,
      status: "pending",
      /** Above algorithm scores so this candidate sorts first for the client (no admin label in UI). */
      score: 1000,
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
      teamRole: resolvedTeamRole,
      createdAt: now,
      updatedAt: now,
    });

    // Audit log
    await ctx.db.insert("auditLogs", {
      action: "admin_manual_match",
      actionType: "admin",
      actorId: adminUser._id,
      actorRole: "admin",
      targetType: "match",
      targetId: matchId,
      details: {
        projectId: args.projectId,
        freelancerId: args.freelancerId,
        note: args.note,
        teamRole: resolvedTeamRole,
      },
      createdAt: now,
    });

    // Notify client
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [project.clientId],
      title: "New match added by admin",
      message: `An admin added a candidate for "${project.intakeForm.title}". Review matches and select who you want to proceed with.`,
      type: "match",
      data: { matchId, projectId: args.projectId },
    });
    await ctx.scheduler.runAfter(0, sendManualMatchFoundClientEmail, {
      projectId: args.projectId,
      freelancerId: args.freelancerId,
    });

    return { matchId };
  },
});

