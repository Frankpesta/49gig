import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import { isFreelancerPermanentlyExcluded } from "../match_exclusions";
import { freelancerEngagementNetTotalUsd } from "../../lib/project-freelancer-earnings";
import { skillsForTeamRoleLabel, type TeamSlotIntake } from "../../lib/team-slots";

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

    if (isClient && project.permanentlyExcludedFreelancerIds?.length) {
      const banned = new Set(project.permanentlyExcludedFreelancerIds.map(String));
      return enrichedMatches.filter((m) => !banned.has(String(m.freelancerId)));
    }

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

    const isPreFundingSelected =
      (project.status === "draft" || project.status === "pending_funding") &&
      (project.selectedFreelancerId === args.freelancerId ||
        (project.selectedFreelancerIds &&
          project.selectedFreelancerIds.includes(args.freelancerId)));

    if (!match && !isPreFundingSelected) {
      return null;
    }

    if (isFreelancerPermanentlyExcluded(project, args.freelancerId as string)) {
      return null;
    }

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

    const vettingScore = Math.round(
      vettingResult?.overallScore ?? match?.scoringBreakdown.vettingScore ?? 0
    );

    return {
      displayName: toDisplayName(freelancer.name),
      profile: freelancer.profile,
      resumeBio: freelancer.resumeBio,
      verificationStatus: freelancer.verificationStatus,
      vettingScore,
      vettingStatus: vettingResult?.status ?? null,
      averageRating,
      reviewCount: ratingCount,
    };
  },
});

/**
 * Get all projects in the awaiting-match queue (pre- and post-funding).
 * Used by the auto-assignment cron and KYC-approval trigger.
 */
export const getProjectsAwaitingMatch = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_awaiting_match", (q) => q.eq("awaitingMatch", true))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "draft"),
          q.eq(q.field("status"), "pending_funding"),
          q.eq(q.field("status"), "funded"),
          q.eq(q.field("status"), "matching")
        )
      )
      .collect();
  },
});

/** Internal: all match rows for a project (post-fund team refill). */
export const listProjectMatchesInternal = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("matches")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

/**
 * Get a single match record by its ID (internal use by auto-assign notifications).
 */
export const getMatchById = internalQuery({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.matchId);
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


/**
 * Get matches awaiting freelancer response (client selected, freelancer hasn't acted yet).
 */
export const getPendingFreelancerMatches = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    if (!args.userId) return [];
    const user = await ctx.db.get(args.userId);
    if (!user || user.status !== "active" || user.role !== "freelancer") return [];

    const allMatches = await ctx.db
      .query("matches")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.userId!))
      .collect();

    const pendingSelection = allMatches.filter(
      (m) => m.clientAction === "accepted" && !m.freelancerAction
    );

    // Same hire can briefly have two `matches` rows for one freelancer (duplicate team seats /
    // legacy data). The Match Requests UI would show two identical approval cards — collapse to
    // one row per (project, freelancer) so freelancers only ever respond once.
    const dedupedByProject = new Map<string, (typeof pendingSelection)[0]>();
    for (const m of pendingSelection) {
      const key = `${m.projectId}:${m.freelancerId}`;
      const existing = dedupedByProject.get(key);
      if (!existing) {
        dedupedByProject.set(key, m);
        continue;
      }
      const existingAt = existing.clientActionAt ?? 0;
      const mAt = m.clientActionAt ?? 0;
      const winner =
        m.score > existing.score ||
        (m.score === existing.score && mAt > existingAt)
          ? m
          : existing;
      dedupedByProject.set(key, winner);
    }
    const pendingDeduped = Array.from(dedupedByProject.values());

    return Promise.all(
      pendingDeduped.map(async (match) => {
        const project = await ctx.db.get(match.projectId);
        if (!project) {
          return {
            ...match,
            projectTitle: null,
            projectDescription: null,
            clientName: null,
            projectDuration: null,
            freelancerNetTotalUsd: 0,
            hireType: null,
            experienceLevel: null,
            roleType: null,
            requiredSkills: [] as string[],
            freelancerSkillsScope: "project" as const,
            specialRequirements: null,
            startDate: null,
          };
        }

        const intake = project.intakeForm;
        const client = await ctx.db.get(project.clientId);
        const teamSlots = (Array.isArray(intake.teamSlots) ? intake.teamSlots : []) as TeamSlotIntake[];
        const hasSeatRows = teamSlots.some((s) => !!s.roleId);
        const hireType = intake.hireType ?? null;
        const useSeatSkills = hireType === "team" && hasSeatRows && !!match.teamRole;
        const displaySkills = useSeatSkills
          ? skillsForTeamRoleLabel(match.teamRole, teamSlots)
          : (intake.requiredSkills ?? []);

        const freelancerNetTotalUsd = freelancerEngagementNetTotalUsd(
          {
            totalAmount: project.totalAmount,
            platformFee: project.platformFee,
            teamBudgetBreakdown: project.teamBudgetBreakdown,
            intakeForm: {
              hireType: intake.hireType,
              teamSlots,
              projectDuration: intake.projectDuration,
              teamMemberCount: intake.teamMemberCount,
            },
            matchedFreelancerIds: project.matchedFreelancerIds,
            matchedFreelancerId: project.matchedFreelancerId,
          },
          match.teamRole
        );

        return {
          ...match,
          projectTitle: intake.title ?? null,
          projectDescription: intake.description ?? null,
          clientName: client?.name ?? null,
          projectDuration: intake.projectDuration ?? null,
          freelancerNetTotalUsd,
          hireType,
          experienceLevel: intake.experienceLevel ?? null,
          roleType: intake.roleType ?? null,
          requiredSkills: displaySkills,
          freelancerSkillsScope: useSeatSkills ? ("seat" as const) : ("project" as const),
          specialRequirements: intake.specialRequirements ?? null,
          startDate: intake.startDate ?? null,
        };
      })
    );
  },
});
