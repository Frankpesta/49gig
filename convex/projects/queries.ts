import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";
import {
  openTeamRoleLabelsForProject,
  projectEligibleForAdminManualMatch,
  isTeamProject,
} from "./manualMatchEligibility";

/**
 * Helper function to get current user in queries
 * Supports both Convex Auth and session token authentication via userId
 */
async function getCurrentUserInQuery(
  ctx: any,
  userId?: string
): Promise<Doc<"users"> | null> {
  if (userId) {
    const user = await ctx.db.get(userId as any as Doc<"users">["_id"]);
    if (!user) {
      return null;
    }
    const userDoc = user as Doc<"users">;
    if (userDoc.status !== "active") {
      return null;
    }
    return userDoc;
  }

  // Fall back to Convex Auth
  const user = await getCurrentUser(ctx);
  if (!user) {
    return null;
  }
  const userDoc = user as Doc<"users">;
  if (userDoc.status !== "active") {
    return null;
  }
  return userDoc;
}

/**
 * Get all projects for the current user
 * - Clients see their own projects
 * - Freelancers see projects they're matched to
 * - Admins see all projects
 */
export const getProjects = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("pending_funding"),
        v.literal("funded"),
        v.literal("matching"),
        v.literal("awaiting_freelancer"),
        v.literal("matched"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled"),
        v.literal("disputed")
      )
    ),
    /** Client filter: hires where matching is still in progress (queue or partial team). */
    matchingInProgress: v.optional(v.boolean()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    let projects: Doc<"projects">[];

    if (user.role === "admin") {
      // Admins see all projects
      if (args.status) {
        projects = await ctx.db
          .query("projects")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .collect();
      } else {
        projects = await ctx.db
          .query("projects")
          .withIndex("by_created", (q) => q.gte("createdAt", 0))
          .order("desc")
          .collect();
      }
    } else if (user.role === "client") {
      // Clients see their own projects
      if (args.status) {
        projects = await ctx.db
          .query("projects")
          .withIndex("by_client", (q) => q.eq("clientId", user._id))
          .filter((q) => q.eq(q.field("status"), args.status!))
          .order("desc")
          .collect();
      } else {
        projects = await ctx.db
          .query("projects")
          .withIndex("by_client", (q) => q.eq("clientId", user._id))
          .order("desc")
          .collect();
      }
    } else if (user.role === "freelancer") {
      // Solo matched via `matchedFreelancerId`, plus any hire where the client selected this
      // freelancer or they have already accepted (team rosters, legacy rows missing index field).
      const byAssigned = await ctx.db
        .query("projects")
        .withIndex("by_freelancer", (q) => q.eq("matchedFreelancerId", user._id))
        .collect();

      const myMatches = await ctx.db
        .query("matches")
        .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
        .collect();

      const relevantProjectIds = new Set<string>();
      for (const m of myMatches) {
        if (m.status === "rejected" || m.status === "expired") continue;
        const awaitingMyResponse =
          m.clientAction === "accepted" && m.freelancerAction == null;
        const iAccepted = m.freelancerAction === "accepted";
        if (awaitingMyResponse || iAccepted) {
          relevantProjectIds.add(m.projectId as string);
        }
      }

      const byMatch: Doc<"projects">[] = [];
      for (const pid of relevantProjectIds) {
        const p = await ctx.db.get(pid as Doc<"projects">["_id"]);
        if (p) byMatch.push(p);
      }

      const seen = new Set<string>();
      projects = [];
      const pushUnique = (p: Doc<"projects">) => {
        const id = p._id as string;
        if (seen.has(id)) return;
        seen.add(id);
        projects.push(p);
      };
      for (const p of byAssigned) pushUnique(p);
      for (const p of byMatch) pushUnique(p);

      if (args.status) {
        projects = projects.filter((p) => p.status === args.status);
      }
      projects.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      // Moderators see all projects (read-only)
      if (args.status) {
        projects = await ctx.db
          .query("projects")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .collect();
      } else {
        projects = await ctx.db
          .query("projects")
          .withIndex("by_created", (q) => q.gte("createdAt", 0))
          .order("desc")
          .collect();
      }
    }

    if (args.matchingInProgress && user.role === "client") {
      projects = projects.filter(
        (p) =>
          p.clientId === user._id &&
          (p.status === "awaiting_freelancer" ||
            p.status === "matching" ||
            p.awaitingMatch === true ||
            (p.pendingTeamMemberSlots != null && p.pendingTeamMemberSlots > 0) ||
            (p.rolesAwaitingMatch != null && p.rolesAwaitingMatch.length > 0))
      );
    }

    // Enrich with client/freelancer info
    const enrichedProjects = await Promise.all(
      projects.map(async (project) => {
        const client = await ctx.db.get(project.clientId);
        const freelancer = project.matchedFreelancerId
          ? await ctx.db.get(project.matchedFreelancerId)
          : null;

        return {
          ...project,
          client: client
            ? {
                _id: client._id,
                name: client.name,
                email: client.email,
              }
            : null,
          freelancer: freelancer
            ? {
                _id: freelancer._id,
                name: freelancer.name,
                email: freelancer.email,
              }
            : null,
        };
      })
    );

    return enrichedProjects;
  },
});

/**
 * Admins: hires in the matching pipeline — `awaitingMatch` (draft through funded) or status `matching`,
 * where manual adding a candidate is still meaningful (solo: nobody matched; team: open role/headcount).
 */
export const listManualMatchProjectsAdmin = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }
    if (user.role !== "admin") {
      throw new Error("Only admins can list manual match projects");
    }

    const awaitingRows = await ctx.db
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

    const matchingRows = await ctx.db
      .query("projects")
      .withIndex("by_status", (q) => q.eq("status", "matching"))
      .collect();

    const byId = new Map<string, Doc<"projects">>();
    for (const p of awaitingRows) {
      byId.set(p._id, p);
    }
    for (const p of matchingRows) {
      byId.set(p._id, p);
    }

    const merged = Array.from(byId.values()).sort(
      (a, b) => b.updatedAt - a.updatedAt
    );

    const eligible: Doc<"projects">[] = [];
    for (const project of merged) {
      if (await projectEligibleForAdminManualMatch(ctx, project)) {
        eligible.push(project);
      }
    }

    const enriched = await Promise.all(
      eligible.map(async (project) => {
        const client = await ctx.db.get(project.clientId);
        const freelancer = project.matchedFreelancerId
          ? await ctx.db.get(project.matchedFreelancerId)
          : null;
        const manualMatchOpenTeamRoles = isTeamProject(project)
          ? await openTeamRoleLabelsForProject(ctx, project)
          : [];
        return {
          ...project,
          manualMatchOpenTeamRoles,
          client: client
            ? {
                _id: client._id,
                name: client.name,
                email: client.email,
              }
            : null,
          freelancer: freelancer
            ? {
                _id: freelancer._id,
                name: freelancer.name,
                email: freelancer.email,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

/**
 * Get a single project by ID with full details.
 * Accepts projectId as string (e.g. from URL) and normalizes to support external IDs.
 */
export const getProject = query({
  args: {
    projectId: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const projectId = ctx.db.normalizeId("projects", args.projectId);
    if (!projectId) {
      return null;
    }

    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) {
      return null;
    }

    const project = await ctx.db.get(projectId);
    if (!project) {
      return null;
    }

    // Authorization: client, matched freelancer(s), freelancer with pending/accepted match, admin, or moderator
    let canView =
      user.role === "admin" ||
      user.role === "moderator" ||
      project.clientId === user._id ||
      project.matchedFreelancerId === user._id ||
      (project.matchedFreelancerIds && project.matchedFreelancerIds.includes(user._id));

    // Freelancer with a match (pending or accepted) for this project can view details before/after acceptance
    if (!canView && user.role === "freelancer") {
      const match = await ctx.db
        .query("matches")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .filter((q) => q.eq(q.field("freelancerId"), user._id))
        .first();
      if (match && (match.status === "pending" || match.status === "accepted")) {
        canView = true;
      }
    }

    if (!canView) {
      return null;
    }

    const matchRows = await ctx.db
      .query("matches")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    const pendingMatchesCount = matchRows.filter((m) => m.status === "pending").length;

    const confirmedTeamMembers: Array<{
      _id: Doc<"users">["_id"];
      name: string;
      teamRole?: string;
    }> = [];
    const seenConfirmedFreelancer = new Set<string>();
    for (const m of matchRows) {
      if (m.status !== "accepted" || m.freelancerAction !== "accepted") continue;
      const fid = m.freelancerId as string;
      if (seenConfirmedFreelancer.has(fid)) continue;
      seenConfirmedFreelancer.add(fid);
      const u = await ctx.db.get(m.freelancerId);
      if (!u) continue;
      confirmedTeamMembers.push({
        _id: u._id,
        name: u.name,
        teamRole: m.teamRole,
      });
    }

    // Get client and freelancer info
    const client = await ctx.db.get(project.clientId);
    const freelancer = project.matchedFreelancerId
      ? await ctx.db.get(project.matchedFreelancerId)
      : null;

    return {
      ...project,
      pendingMatchesCount,
      confirmedTeamMembers,
      client: client
        ? {
            _id: client._id,
            name: client.name,
            email: client.email,
            profile: client.profile,
          }
        : null,
      freelancer: freelancer
        ? {
            _id: freelancer._id,
            name: freelancer.name,
            email: freelancer.email,
            profile: freelancer.profile,
          }
        : null,
    };
  },
});

/**
 * Get milestones for a project.
 * Accepts projectId as string (e.g. from URL) and normalizes to support external IDs.
 */
export const getProjectMilestones = query({
  args: {
    projectId: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const projectId = ctx.db.normalizeId("projects", args.projectId);
    if (!projectId) {
      return [];
    }

    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) {
      return [];
    }

    const project = await ctx.db.get(projectId);
    if (!project) {
      return [];
    }

    // Authorization: client, matched freelancer, freelancer with pending/accepted match, admin, or moderator
    let canViewMilestones =
      user.role === "admin" ||
      user.role === "moderator" ||
      project.clientId === user._id ||
      project.matchedFreelancerId === user._id ||
      (project.matchedFreelancerIds && project.matchedFreelancerIds.includes(user._id));

    if (!canViewMilestones && user.role === "freelancer") {
      const match = await ctx.db
        .query("matches")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .filter((q) => q.eq(q.field("freelancerId"), user._id))
        .first();
      if (match && (match.status === "pending" || match.status === "accepted")) {
        canViewMilestones = true;
      }
    }

    if (!canViewMilestones) {
      return [];
    }

    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .order("asc")
      .collect();

    return milestones;
  },
});

/**
 * Get a single milestone by ID
 */
export const getMilestoneById = query({
  args: {
    milestoneId: v.id("milestones"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const milestone = await ctx.db.get(args.milestoneId);
    if (!milestone) {
      throw new Error("Milestone not found");
    }

    // Get project for authorization
    const project = await ctx.db.get(milestone.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Authorization: client, matched freelancer, freelancer with pending/accepted match, admin, or moderator
    let canViewMilestone =
      user.role === "admin" ||
      user.role === "moderator" ||
      project.clientId === user._id ||
      project.matchedFreelancerId === user._id;

    if (!canViewMilestone && user.role === "freelancer") {
      const match = await ctx.db
        .query("matches")
        .withIndex("by_project", (q) => q.eq("projectId", milestone.projectId))
        .filter((q) => q.eq(q.field("freelancerId"), user._id))
        .first();
      if (match && (match.status === "pending" || match.status === "accepted")) {
        canViewMilestone = true;
      }
    }

    if (!canViewMilestone) {
      throw new Error("Not authorized to view this milestone");
    }

    return milestone;
  },
});

/**
 * Get project (internal - no auth required)
 */
export const getProjectInternal = internalQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    return project;
  },
});

/**
 * Get projects by freelancer (internal - for matching engine)
 */
export const getProjectsByFreelancer = internalQuery({
  args: {
    freelancerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_freelancer", (q) => q.eq("matchedFreelancerId", args.freelancerId))
      .collect();
    return projects;
  },
});

/**
 * Get all freelancer IDs who have an active project (matched or in_progress).
 * Used by matching to exclude them from new matches until they complete.
 */
export const getFreelancerIdsWithActiveProjects = internalQuery({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();
    const ids = new Set<string>();
    for (const p of projects) {
      if (p.status !== "matched" && p.status !== "in_progress") continue;
      if (p.matchedFreelancerId) ids.add(p.matchedFreelancerId);
      if (p.matchedFreelancerIds) for (const id of p.matchedFreelancerIds) ids.add(id);
    }
    return Array.from(ids);
  },
});

/**
 * Get project milestones (internal)
 */
export const getProjectMilestonesInternal = internalQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .collect();
    return milestones;
  },
});

/**
 * Get milestones ready for auto-release (approved, autoReleaseAt <= now)
 * Used by cron to release payments 48h after client approval
 */
export const getMilestonesReadyForAutoRelease = internalQuery({
  args: {
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const candidates = await ctx.db
      .query("milestones")
      .withIndex("by_auto_release", (q) => q.lte("autoReleaseAt", args.now))
      .collect();
    return candidates.filter(
      (m) => m.status === "approved" && m.autoReleaseAt != null && m.autoReleaseAt <= args.now
    );
  },
});

/**
 * Get milestone by ID (internal - no auth required)
 */
export const getMilestoneByIdInternal = internalQuery({
  args: {
    milestoneId: v.id("milestones"),
  },
  handler: async (ctx, args) => {
    const milestone = await ctx.db.get(args.milestoneId);
    return milestone;
  },
});

/**
 * Get unfunded projects (draft or pending_funding) older than a given timestamp.
 * Used by cron to delete projects not funded within 14 days.
 */
export const getUnfundedProjectsOlderThanInternal = internalQuery({
  args: {
    createdBefore: v.number(),
  },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_created", (q) => q.lt("createdAt", args.createdBefore))
      .collect();
    return projects
      .filter(
        (p) => p.status === "draft" || p.status === "pending_funding"
      )
      .map((p) => p._id);
  },
});

/**
 * Get unfunded projects for reminder (created within a time window).
 * E.g. createdBetween: [now - 8 days, now - 7 days] for 7-day reminder.
 */
export const getUnfundedProjectsForReminderInternal = internalQuery({
  args: {
    createdAfter: v.number(),
    createdBefore: v.number(),
  },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_created", (q) =>
        q.gte("createdAt", args.createdAfter).lt("createdAt", args.createdBefore)
      )
      .collect();
    return projects.filter(
      (p) => p.status === "draft" || p.status === "pending_funding"
    );
  },
});

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Get in-progress projects where paid duration is nearing or past and client needs to fund next month(s).
 * Used by cron: send reminders and optionally terminate after grace period.
 */
export const getProjectsNeedingPaymentFollowUpInternal = internalQuery({
  args: {
    now: v.number(),
    graceDays: v.number(),
    reminderThrottleDays: v.number(),
  },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_status", (q) => q.eq("status", "in_progress"))
      .collect();

    const startDate = (p: Doc<"projects">) => p.intakeForm?.startDate ?? 0;
    const result: Array<{
      projectId: Doc<"projects">["_id"];
      clientId: Doc<"users">["_id"];
      title: string;
      lastFundedMonthIndex: number;
      currentMonthIndex: number;
      endOfLastFundedMonthMs: number;
      sendReminder: boolean;
      shouldTerminate: boolean;
    }> = [];

    for (const p of projects) {
      const lastFunded = p.lastFundedMonthIndex;
      if (lastFunded == null || lastFunded < 1) continue;
      const start = startDate(p);
      if (!start || !Number.isFinite(start)) continue;

      const elapsed = args.now - start;
      const currentMonthIndex = Math.floor(elapsed / MONTH_MS) + 1;
      if (currentMonthIndex <= lastFunded) continue;

      const endOfLastFundedMonthMs = start + lastFunded * MONTH_MS;
      const graceEndMs = endOfLastFundedMonthMs + args.graceDays * 24 * 60 * 60 * 1000;
      const shouldTerminate = args.now >= graceEndMs;

      const reminderThrottleMs = args.reminderThrottleDays * 24 * 60 * 60 * 1000;
      const lastReminder = p.paymentReminderSentAt ?? 0;
      const sendReminder = !shouldTerminate && (args.now - lastReminder >= reminderThrottleMs);

      result.push({
        projectId: p._id,
        clientId: p.clientId,
        title: p.intakeForm?.title ?? "Project",
        lastFundedMonthIndex: lastFunded,
        currentMonthIndex,
        endOfLastFundedMonthMs,
        sendReminder,
        shouldTerminate,
      });
    }

    return result;
  },
});

/**
 * Get all projects associated with a specific user (as client OR freelancer).
 * Admin/moderator only.
 */
export const getProjectsForUser = query({
  args: {
    targetUserId: v.id("users"),
    adminUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const admin = await getCurrentUserInQuery(ctx, args.adminUserId);
    if (!admin || (admin.role !== "admin" && admin.role !== "moderator")) {
      return null;
    }

    // Fetch as client
    const asClient = await ctx.db
      .query("projects")
      .withIndex("by_client", (q) => q.eq("clientId", args.targetUserId))
      .order("desc")
      .collect();

    // Fetch as matched freelancer (single)
    const asFreelancer = await ctx.db
      .query("projects")
      .withIndex("by_freelancer", (q) =>
        q.eq("matchedFreelancerId", args.targetUserId)
      )
      .order("desc")
      .collect();

    // Merge, deduplicate by _id
    const seen = new Set<string>();
    const merged = [];
    for (const p of [...asClient, ...asFreelancer]) {
      if (!seen.has(p._id)) {
        seen.add(p._id);
        merged.push(p);
      }
    }

    // Sort by createdAt desc
    merged.sort((a, b) => b.createdAt - a.createdAt);

    // Enrich with names
    const enriched = await Promise.all(
      merged.map(async (project) => {
        const client = await ctx.db.get(project.clientId);
        const freelancer = project.matchedFreelancerId
          ? await ctx.db.get(project.matchedFreelancerId)
          : null;
        return {
          ...project,
          client: client
            ? { _id: client._id, name: client.name, email: client.email }
            : null,
          freelancer: freelancer
            ? { _id: freelancer._id, name: freelancer.name, email: freelancer.email }
            : null,
          userRole: project.clientId === args.targetUserId ? "client" : "freelancer",
        };
      })
    );

    return enriched;
  },
});

/**
 * Get the matched team members (with names) for a project.
 * Used in the dispute creation form so the client can choose which members to dispute.
 */
export const getProjectTeamMembers = query({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) return [];

    const project = await ctx.db.get(args.projectId);
    if (!project) return [];

    // Only clients on this project or admins/moderators can call this
    const isClient = project.clientId === user._id;
    const isAdminOrMod = user.role === "admin" || user.role === "moderator";
    if (!isClient && !isAdminOrMod) return [];

    const ids: string[] = project.matchedFreelancerIds ?? [];
    if (ids.length === 0) return [];

    return Promise.all(
      ids.map(async (id) => {
        const u = await ctx.db.get(id as any);
        return {
          _id: id,
          name: (u as any)?.name ?? "Unknown",
          role: (u as any)?.role ?? "freelancer",
        };
      })
    );
  },
});

/** Admin: escrow, dispute refund wallet rows, monthly cycles for a hire. */
export const getProjectMoneyAuditForAdmin = query({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user || user.role !== "admin") return null;

    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", project.clientId))
      .first();

    let pendingRefundCents = 0;
    let completedRefundCents = 0;
    if (wallet) {
      const txs = await ctx.db
        .query("walletTransactions")
        .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
        .collect();
      for (const t of txs) {
        if (t.projectId !== args.projectId || t.type !== "refund") continue;
        if (t.status === "pending") pendingRefundCents += t.amountCents;
        else if (t.status === "completed") completedRefundCents += t.amountCents;
      }
    }

    const cycles = await ctx.db
      .query("monthlyBillingCycles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return {
      projectId: args.projectId,
      title: project.intakeForm?.title ?? null,
      status: project.status,
      escrowedAmount: project.escrowedAmount ?? 0,
      currency: project.currency ?? "usd",
      clientId: project.clientId,
      pendingRefundCents,
      completedRefundCents,
      cycles: cycles
        .map((c) => ({
          _id: c._id,
          monthIndex: c.monthIndex,
          status: c.status,
          amountCents: c.amountCents,
          currency: c.currency,
        }))
        .sort((a, b) => a.monthIndex - b.monthIndex),
    };
  },
});