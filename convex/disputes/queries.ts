import { query, internalQuery, QueryCtx } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc, Id } from "../_generated/dataModel";
import {
  freelancerSeatLockedEconomicsFreelancerNetUsd,
  disputeNetScopeFreelancerNetCents,
  resolvedLockedEconomicsFreelancerNetPoolCents,
} from "./lockingBasis";
import { effectivePlatformFeePercentForProject } from "../platformFeeResolve";
import {
  computeTeamPoolShareCentsByFreelancerId,
  sumShareCentsForFreelancers,
  teamBasisUserIdsForDispute,
} from "../teamEscrowShares";
import { viewerIsDisputeParty } from "./partyAccess";

async function getCurrentUserInQuery(
  ctx: QueryCtx,
  userId?: string
): Promise<Doc<"users"> | null> {
  if (userId) {
    const user = await ctx.db.get(userId as Doc<"users">["_id"]);
    if (!user || (user as Doc<"users">).status !== "active") return null;
    return user as Doc<"users">;
  }
  const user = await getCurrentUser(ctx);
  if (!user || (user as Doc<"users">).status !== "active") return null;
  return user as Doc<"users">;
}

/**
 * Clients and staff see client-gross USD (`dispute.lockedAmount` snapshot at filing).
 * Freelancers each see freelancer-net USD for **their seat** from `lockedEconomicsFreelancerNetPoolCents`
 * (fallback: legacy monthly-cycle / escrow rules), subdivided consistently with initiation.
 */
async function clientOrStaffVisibleLockedGrossUsd(
  ctx: QueryCtx,
  dispute: Doc<"disputes">,
  project: Doc<"projects">,
  feePct: number
): Promise<number> {
  void ctx;
  void project;
  void feePct;
  return Math.round(Math.max(0, dispute.lockedAmount) * 100) / 100;
}

/** Full names for disputor and disputed party/parties (for dispute detail UI). */
async function disputePartyDisplayNames(
  ctx: QueryCtx,
  dispute: Doc<"disputes">,
  project: Doc<"projects">
): Promise<{ initiatorFullName: string; disputedPartyNames: string[] }> {
  const initiator = await ctx.db.get(dispute.initiatorId);
  const initiatorFullName = initiator?.name?.trim() || "Unknown";

  const teamIds: Id<"users">[] = project.matchedFreelancerId
    ? [project.matchedFreelancerId]
    : [...(project.matchedFreelancerIds ?? [])];
  const disputedIds = dispute.disputedFreelancerIds ?? [];
  const isPartialTeam =
    teamIds.length > 1 &&
    disputedIds.length > 0 &&
    disputedIds.length < teamIds.length;

  let disputedUserIds: Id<"users">[] = [];
  if (dispute.initiatorRole === "client") {
    if (isPartialTeam) {
      disputedUserIds = [...disputedIds];
    } else if (teamIds.length > 0) {
      disputedUserIds = [...teamIds];
    }
  } else {
    disputedUserIds = [project.clientId];
  }

  const disputedPartyNames: string[] = [];
  const seen = new Set<string>();
  for (const id of disputedUserIds) {
    const key = String(id);
    if (seen.has(key)) continue;
    seen.add(key);
    const u = await ctx.db.get(id);
    disputedPartyNames.push(u?.name?.trim() || "Unknown");
  }

  return { initiatorFullName, disputedPartyNames };
}

/**
 * Get all disputes for the current user
 * Role-based filtering:
 * - Clients: Disputes for their projects
 * - Freelancers: Disputes for their matched projects
 * - Admins/Moderators: All disputes
 */
export const getDisputes = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("under_review"),
        v.literal("resolved"),
        v.literal("escalated"),
        v.literal("closed"),
        v.literal("cancelled")
      )
    ),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) {
      return [];
    }

    const enrichDisputes = async (rawDisputes: Doc<"disputes">[]) => {
      return Promise.all(
        rawDisputes.map(async (d) => {
          const project = await ctx.db.get(d.projectId);
          const initiator = await ctx.db.get(d.initiatorId);
          // Respondent is the other party on the project
          let respondentName: string | null = null;
          if (project) {
            const otherUserId =
              initiator?._id === project.clientId
                ? project.matchedFreelancerId
                : project.clientId;
            if (otherUserId) {
              const respondent = await ctx.db.get(otherUserId);
              respondentName = respondent?.name ?? null;
            }
          }
          let lockedAmount = d.lockedAmount;
          if (project) {
            const feePct = await effectivePlatformFeePercentForProject(
              ctx,
              project.platformFee
            );
            const isFreelancerOnProject =
              project.matchedFreelancerId === user._id ||
              (project.matchedFreelancerIds?.includes(user._id) ?? false);
            const isProjectClient = project.clientId === user._id;

            if (
              isProjectClient ||
              user.role === "admin" ||
              user.role === "moderator"
            ) {
              lockedAmount = await clientOrStaffVisibleLockedGrossUsd(
                ctx,
                d,
                project,
                feePct
              );
            } else if (isFreelancerOnProject) {
              lockedAmount = await freelancerSeatLockedEconomicsFreelancerNetUsd(
                ctx,
                d,
                project,
                user._id
              );
            }
          }
          return {
            ...d,
            lockedAmount,
            projectTitle: project?.intakeForm?.title ?? null,
            initiatorName: initiator?.name ?? null,
            respondentName,
          };
        })
      );
    };

    // Admins and moderators see all disputes
    if (user.role === "admin" || user.role === "moderator") {
      let raw;
      if (args.status) {
        raw = await ctx.db
          .query("disputes")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .collect();
      } else {
        raw = await ctx.db.query("disputes").order("desc").collect();
      }
      return enrichDisputes(raw);
    }

    // Projects as client + solo matched freelancer + team (accepted match rows; team uses matchedFreelancerIds)
    const projectIdSet = new Set<string>();

    const asClient = await ctx.db
      .query("projects")
      .withIndex("by_client", (q) => q.eq("clientId", user._id))
      .collect();
    for (const p of asClient) projectIdSet.add(p._id as string);

    const asSoloFreelancer = await ctx.db
      .query("projects")
      .withIndex("by_freelancer", (q) => q.eq("matchedFreelancerId", user._id))
      .collect();
    for (const p of asSoloFreelancer) projectIdSet.add(p._id as string);

    const acceptedTeamMatches = await ctx.db
      .query("matches")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();
    for (const m of acceptedTeamMatches) projectIdSet.add(m.projectId as string);

    // Disputes they initiated while not yet on project roster (edge)
    const asInitiator = await ctx.db
      .query("disputes")
      .withIndex("by_initiator", (q) => q.eq("initiatorId", user._id))
      .collect();
    for (const d of asInitiator) projectIdSet.add(d.projectId as string);

    const projectIds = Array.from(projectIdSet) as Doc<"projects">["_id"][];

    if (projectIds.length === 0) {
      return [];
    }

    // Get disputes for user's projects
    const allDisputes: Doc<"disputes">[] = [];
    for (const projectId of projectIds) {
      const disputes = await ctx.db
        .query("disputes")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .collect();
      allDisputes.push(...disputes);
    }

    // Filter by status if provided
    const filtered = args.status
      ? allDisputes.filter((d) => d.status === args.status)
      : allDisputes;

    const sorted = filtered.sort((a, b) => b.createdAt - a.createdAt);
    const partyFiltered: Doc<"disputes">[] = [];
    for (const d of sorted) {
      const proj = await ctx.db.get(d.projectId);
      if (!proj) continue;
      if (
        user.role === "freelancer" &&
        viewerIsDisputeParty(user._id, proj, d)
      ) {
        partyFiltered.push(d);
      } else if (user.role !== "freelancer") {
        partyFiltered.push(d);
      }
    }
    return enrichDisputes(partyFiltered);
  },
});

/**
 * Get open disputes (open or under_review) for a project.
 */
export const getOpenDisputesForProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("disputes")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "open"),
          q.eq(q.field("status"), "under_review")
        )
      )
      .collect();
  },
});

/**
 * Internal: get dispute by ID without auth (for actions e.g. releaseDisputeFunds).
 */
export const internalGetDispute = internalQuery({
  args: { disputeId: v.id("disputes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.disputeId);
  },
});

/**
 * Get a specific dispute by ID
 * Includes authorization check
 */
export const getDispute = query({
  args: {
    disputeId: v.id("disputes"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) {
      return null;
    }

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) {
      return null;
    }

    // Get project
    const project = await ctx.db.get(dispute.projectId);
    if (!project) {
      return null;
    }

    // Check authorization (include team freelancers + anyone with a match row — e.g. removed after dispute)
    const isClient = project.clientId === user._id;
    let isFreelancer =
      project.matchedFreelancerId === user._id ||
      (project.matchedFreelancerIds && project.matchedFreelancerIds.includes(user._id));
    if (!isFreelancer && user.role === "freelancer") {
      const anyMatchOnHire = await ctx.db
        .query("matches")
        .withIndex("by_project", (q) => q.eq("projectId", dispute.projectId))
        .filter((q) => q.eq(q.field("freelancerId"), user._id))
        .first();
      isFreelancer = anyMatchOnHire != null;
    }
    const isAssignedModerator =
      dispute.assignedModeratorId === user._id;
    const isAdminOrModerator =
      user.role === "admin" || user.role === "moderator";
    const isParty =
      isClient ||
      isAdminOrModerator ||
      isAssignedModerator ||
      viewerIsDisputeParty(user._id, project, dispute);

    if (!isParty) {
      return null;
    }

    const feePctForViews = await effectivePlatformFeePercentForProject(
      ctx,
      project.platformFee
    );

    // Enrich evidence with file URLs
    const enrichedEvidence = await Promise.all(
      dispute.evidence.map(async (e) => {
        if (e.type === "file" && e.fileId) {
          const url = await ctx.storage.getUrl(e.fileId);
          return { ...e, fileUrl: url };
        }
        return { ...e, fileUrl: null };
      })
    );

    // Role-based visibility of resolution notes and locked amount
    let visibleResolution = dispute.resolution;
    // Stored lockedAmount is client gross (includes platform fee).
    let visibleLockedAmount = dispute.lockedAmount;

    const isFreelancerParty =
      user.role === "freelancer" &&
      viewerIsDisputeParty(user._id, project, dispute);

    if (isFreelancerParty && !isAdminOrModerator) {
      visibleLockedAmount = await freelancerSeatLockedEconomicsFreelancerNetUsd(
        ctx,
        dispute,
        project,
        user._id
      );
    } else if (isClient || isAdminOrModerator || isAssignedModerator) {
      visibleLockedAmount = await clientOrStaffVisibleLockedGrossUsd(
        ctx,
        dispute,
        project,
        feePctForViews
      );
    }

    if (dispute.resolution && !isAdminOrModerator) {
      const { decision } = dispute.resolution;
      // Determine if the viewer is the "winner"
      const viewerIsClient = isClient;
      const viewerIsFreelancer = isFreelancerParty;
      const clientWon = decision === "client_favor";
      const freelancerWon = decision === "freelancer_favor";
      const isWinner =
        (viewerIsClient && clientWon) ||
        (viewerIsFreelancer && freelancerWon) ||
        decision === "partial"; // Both parties see partial notes

      if (!isWinner) {
        // Loser sees a generic message; no admin notes revealed
        visibleResolution = {
          ...dispute.resolution,
          notes: "This dispute was resolved. The outcome was not in your favour.",
        };
      }
    }

    const { initiatorFullName, disputedPartyNames } = await disputePartyDisplayNames(
      ctx,
      dispute,
      project
    );
    const structuredEvidence = await ctx.db
      .query("disputeEvidence")
      .withIndex("by_dispute", (q) => q.eq("disputeId", args.disputeId))
      .collect();
    structuredEvidence.sort((a, b) => a.createdAt - b.createdAt);
    const enrichedStructuredEvidence = await Promise.all(
      structuredEvidence.map(async (e) => {
        const submitter = await ctx.db.get(e.submittedBy);
        const submitterDisplayName =
          submitter?.name?.trim() || "Unknown";
        const submitterRole = e.submittedByRole;
        return {
          ...e,
          fileUrl: e.fileId ? await ctx.storage.getUrl(e.fileId) : null,
          submitterDisplayName,
          submitterRole,
        };
      })
    );
    const stageEvents = await ctx.db
      .query("disputeStageEvents")
      .withIndex("by_dispute", (q) => q.eq("disputeId", args.disputeId))
      .collect();

    // Evidence requests: staff see all; parties see only requests addressed to them.
    const allRequests = await ctx.db
      .query("disputeEvidenceRequests")
      .withIndex("by_dispute", (q) => q.eq("disputeId", args.disputeId))
      .collect();
    const evidenceRequests = isAdminOrModerator
      ? allRequests
      : allRequests.filter((r) =>
          r.requestedFromUserIds.some((id) => String(id) === String(user._id))
        );

    return {
      ...dispute,
      evidence: enrichedEvidence,
      structuredEvidence: enrichedStructuredEvidence,
      stageEvents,
      evidenceRequests,
      resolution: visibleResolution,
      lockedAmount: visibleLockedAmount,
      initiatorFullName,
      disputedPartyNames,
    };
  },
});

/**
 * Staff: freelancer-net cents in scope for partial judgments (same basis as `resolveDispute` validation).
 */
export const getDisputePartialJudgmentScopeForStaff = query({
  args: {
    disputeId: v.id("disputes"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      return null;
    }
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) return null;
    const project = await ctx.db.get(dispute.projectId);
    if (!project) return null;
    const freelancerNetCents = await disputeNetScopeFreelancerNetCents(
      ctx,
      project,
      dispute
    );
    return {
      freelancerNetCents,
      freelancerNetUsd: Math.round((freelancerNetCents / 100) * 100) / 100,
      tiedToMonthlyCycle: dispute.monthlyCycleId != null,
    };
  },
});

/**
 * Get disputes assigned to a moderator
 */
export const getModeratorDisputes = query({
  args: {
    moderatorId: v.optional(v.id("users")),
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("under_review"),
        v.literal("resolved"),
        v.literal("escalated"),
        v.literal("closed"),
        v.literal("cancelled")
      )
    ),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) {
      return [];
    }

    // Only moderators and admins can access this
    if (user.role !== "moderator" && user.role !== "admin") {
      return [];
    }

    const moderatorId = args.moderatorId || user._id;

    // Get disputes assigned to this moderator
    const disputes = await ctx.db
      .query("disputes")
      .withIndex("by_status")
      .filter((q) => q.eq(q.field("assignedModeratorId"), moderatorId))
      .collect();

    // Filter by status if provided
    const filtered = args.status
      ? disputes.filter((d) => d.status === args.status)
      : disputes;

    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get pending disputes (open or under_review) for moderators
 */
export const getPendingDisputes = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) {
      return [];
    }

    // Only moderators and admins can see pending disputes
    if (user.role !== "moderator" && user.role !== "admin") {
      return [];
    }

    const pendingStatuses = ["open", "under_review", "escalated"] as const;
    const allPending = (
      await Promise.all(
        pendingStatuses.map((status) =>
          ctx.db
            .query("disputes")
            .withIndex("by_status", (q) => q.eq("status", status))
            .collect()
        )
      )
    ).flat();

    return allPending.sort((a, b) => a.createdAt - b.createdAt); // Oldest first
  },
});

export const listDisputeMessages = query({
  args: {
    disputeId: v.id("disputes"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) return [];

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) return [];

    const project = await ctx.db.get(dispute.projectId);
    if (!project) return [];

    const isClient = project.clientId === user._id;
    const isStaff = user.role === "admin" || user.role === "moderator";
    const isAssigned = dispute.assignedModeratorId === user._id;
    const isParty =
      isClient ||
      isStaff ||
      isAssigned ||
      viewerIsDisputeParty(user._id, project, dispute);

    if (!isParty) {
      return [];
    }

    const rows = await ctx.db
      .query("disputeMessages")
      .withIndex("by_dispute", (q) => q.eq("disputeId", args.disputeId))
      .order("asc")
      .collect();

    const withNames = await Promise.all(
      rows.map(async (m) => {
        const author = await ctx.db.get(m.authorId);
        return {
          ...m,
          authorName: author?.name ?? "Unknown",
        };
      })
    );

    return withNames;
  },
});

/** Rich context for admin/moderator dispute review (party names, hire, cycle). */
export const getDisputeAdminContext = query({
  args: {
    disputeId: v.id("disputes"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      return null;
    }

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) return null;

    const project = await ctx.db.get(dispute.projectId);
    if (!project) return null;

    const client = await ctx.db.get(project.clientId);
    const allFIds = project.matchedFreelancerId
      ? [project.matchedFreelancerId]
      : project.matchedFreelancerIds ?? [];
    const disputed = dispute.disputedFreelancerIds ?? [];
    const isPartialTeam =
      allFIds.length > 1 &&
      disputed.length > 0 &&
      disputed.length < allFIds.length;
    const fIds = isPartialTeam ? disputed : allFIds;
    const freelancers = (
      await Promise.all(fIds.map((id) => ctx.db.get(id)))
    ).filter(Boolean) as Doc<"users">[];

    const initiator = await ctx.db.get(dispute.initiatorId);
    const monthlyCycle = dispute.monthlyCycleId
      ? await ctx.db.get(dispute.monthlyCycleId)
      : null;
    const assignee = dispute.assignedModeratorId
      ? await ctx.db.get(dispute.assignedModeratorId)
      : null;

    return {
      dispute,
      project,
      hireTitle: project.intakeForm?.title ?? "Untitled hire",
      projectStatus: project.status,
      client: client
        ? { _id: client._id, name: client.name, email: client.email }
        : null,
      freelancers: freelancers.map((f) => ({
        _id: f._id,
        name: f.name,
        email: f.email,
      })),
      initiator: initiator
        ? {
            _id: initiator._id,
            name: initiator.name,
            email: initiator.email,
            role: dispute.initiatorRole,
          }
        : null,
      monthlyCycle,
      assignedTo: assignee
        ? { _id: assignee._id, name: assignee.name, role: assignee.role }
        : null,
    };
  },
});

/** Internal: raw dispute row for scheduled emails. */
export const getDisputeDocInternal = internalQuery({
  args: { disputeId: v.id("disputes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.disputeId);
  },
});

/**
 * Freelancer-net escrow cents attributed to disputed team members, using teamBudgetBreakdown
 * and accepted matches (same rules as monthly releases). Uses team snapshot on the dispute when set.
 */
export const computeDisputedTeamEscrowNetCentsFromDisputeInternal = internalQuery({
  args: { disputeId: v.id("disputes") },
  handler: async (ctx, args) => {
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) return { disputedNetCents: 0 };
    const project = await ctx.db.get(dispute.projectId);
    if (!project) return { disputedNetCents: 0 };

    const disputedIds = dispute.disputedFreelancerIds ?? [];
    const teamBasis = teamBasisUserIdsForDispute(dispute, project);

    if (disputedIds.length === 0 || teamBasis.length === 0) {
      return { disputedNetCents: 0 };
    }

    for (const id of disputedIds) {
      if (!teamBasis.some((m) => String(m) === String(id))) {
        throw new Error(
          "Dispute references freelancers who were not on the team snapshot for this hire."
        );
      }
    }

    const totalPoolCents = await resolvedLockedEconomicsFreelancerNetPoolCents(
      ctx,
      dispute,
      project
    );
    const shareMap = await computeTeamPoolShareCentsByFreelancerId(
      ctx,
      dispute.projectId,
      teamBasis,
      project.teamBudgetBreakdown,
      totalPoolCents
    );
    const disputedNetCents = sumShareCentsForFreelancers(shareMap, disputedIds);
    return { disputedNetCents };
  },
});

/** Disputed members' share of a specific monthly cycle amount (team rules). */
export const computeDisputedMonthlyCycleShareCentsInternal = internalQuery({
  args: { disputeId: v.id("disputes") },
  handler: async (ctx, args) => {
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute?.monthlyCycleId) return { disputedNetCents: 0 };
    const cycle = await ctx.db.get(dispute.monthlyCycleId);
    const project = await ctx.db.get(dispute.projectId);
    if (!cycle || !project) return { disputedNetCents: 0 };

    const disputedIds = dispute.disputedFreelancerIds ?? [];
    const teamBasis = teamBasisUserIdsForDispute(dispute, project);
    if (disputedIds.length === 0 || teamBasis.length === 0) {
      return { disputedNetCents: 0 };
    }
    for (const id of disputedIds) {
      if (!teamBasis.some((m) => String(m) === String(id))) {
        throw new Error(
          "Dispute references freelancers who were not on the team snapshot for this hire."
        );
      }
    }

    const poolCents = await resolvedLockedEconomicsFreelancerNetPoolCents(
      ctx,
      dispute,
      project
    );
    const shareMap = await computeTeamPoolShareCentsByFreelancerId(
      ctx,
      dispute.projectId,
      teamBasis,
      project.teamBudgetBreakdown,
      poolCents
    );
    const disputedNetCents = sumShareCentsForFreelancers(shareMap, disputedIds);
    return { disputedNetCents };
  },
});

/** Internal: freelancer-net escrow pool cents that seat economics & `lockedAmount` are computed from. */
export const disputeEconomicsBasisPoolFreelancerNetCentsInternal = internalQuery({
  args: { disputeId: v.id("disputes") },
  handler: async (ctx, args) => {
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) return { poolCents: 0 as const };
    const project = await ctx.db.get(dispute.projectId);
    if (!project) return { poolCents: 0 as const };
    const poolCents = await resolvedLockedEconomicsFreelancerNetPoolCents(
      ctx,
      dispute,
      project
    );
    return { poolCents };
  },
});

/**
 * Enforcement audit rows for staff dashboards.
 */
export const listDisputeEnforcementEvents = query({
  args: {
    disputeId: v.id("disputes"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (
      !user ||
      (user.role !== "admin" && user.role !== "moderator")
    ) {
      return [];
    }
    const events = await ctx.db
      .query("disputeEnforcementEvents")
      .withIndex("by_dispute", (q) => q.eq("disputeId", args.disputeId))
      .order("desc")
      .collect();

    const withNames = await Promise.all(
      events.map(async (e) => {
        const actor = await ctx.db.get(e.actorId);
        return {
          ...e,
          actorName: actor?.name?.trim() ?? "Staff",
        };
      })
    );
    return withNames;
  },
});