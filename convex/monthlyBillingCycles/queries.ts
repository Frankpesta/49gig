import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";

/**
 * Get a single monthly cycle by ID (for dispute resolution).
 */
export const getCycleById = query({
  args: { monthlyCycleId: v.id("monthlyBillingCycles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.monthlyCycleId);
  },
});

/**
 * Get monthly cycles for a project by project ID
 */
export const getCyclesByProjectId = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || (user as Doc<"users">).status !== "active") return [];

    const project = await ctx.db.get(args.projectId);
    if (!project) return [];

    const isClient = project.clientId === (user as Doc<"users">)._id;
    const isFreelancer =
      project.matchedFreelancerId === (user as Doc<"users">)._id ||
      (project.matchedFreelancerIds?.includes((user as Doc<"users">)._id) ?? false) ||
      project.selectedFreelancerId === (user as Doc<"users">)._id ||
      (project.selectedFreelancerIds?.includes((user as Doc<"users">)._id) ?? false);
    const isAdmin = (user as Doc<"users">).role === "admin";
    const isModerator = (user as Doc<"users">).role === "moderator";

    if (!isClient && !isFreelancer && !isAdmin && !isModerator) {
      return [];
    }

    const monthlyBillingVisibleStatuses = new Set<
      Doc<"projects">["status"]
    >(["in_progress", "completed", "disputed"]);
    if (!monthlyBillingVisibleStatuses.has(project.status)) {
      return [];
    }

    return await ctx.db
      .query("monthlyBillingCycles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

/**
 * Get pending cycles awaiting client approval (client dashboard only).
 * Only cycles whose billing period has ended (`monthEndDate <= now`) — same rule as approval & reminders.
 * Pass `clockMs` from the client (e.g. updated every minute) so the list refreshes when a period matures
 * without requiring a database change.
 */
export const getPendingCyclesForClient = query({
  args: { clockMs: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || (user as Doc<"users">).status !== "active") return [];

    if ((user as Doc<"users">).role !== "client") return [];

    const now = args.clockMs ?? Date.now();
    const clientId = (user as Doc<"users">)._id;
    const myProjects = await ctx.db
      .query("projects")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .collect();
    const projectIds = myProjects
      .filter((p) => p.status === "in_progress")
      .map((p) => p._id);
    const allCycles: Doc<"monthlyBillingCycles">[] = [];
    for (const pid of projectIds) {
      const cycles = await ctx.db
        .query("monthlyBillingCycles")
        .withIndex("by_project", (q) => q.eq("projectId", pid))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();
      for (const c of cycles) {
        if (c.monthEndDate <= now) {
          allCycles.push(c);
        }
      }
    }

    return allCycles.sort((a, b) => a.monthStartDate - b.monthStartDate);
  },
});

const REMINDER_THROTTLE_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Cycles eligible for client reminder: month has ended, hire is active, throttled,
 * and at most one row per project (the earliest billing month still pending).
 */
export const getPendingCyclesForReminderInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const cycles = await ctx.db
      .query("monthlyBillingCycles")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const eligible: Doc<"monthlyBillingCycles">[] = [];

    for (const c of cycles) {
      // Do not remind for future periods — client can't approve until the month is over.
      if (c.monthEndDate > now) continue;

      const project = await ctx.db.get(c.projectId);
      if (!project) continue;
      if (project.status !== "in_progress") continue;

      const last = c.clientApprovalReminderSentAt ?? 0;
      if (now - last < REMINDER_THROTTLE_MS) continue;

      eligible.push(c);
    }

    eligible.sort((a, b) => a.monthStartDate - b.monthStartDate);

    const byProject = new Map<
      Doc<"projects">["_id"],
      Doc<"monthlyBillingCycles">
    >();
    for (const c of eligible) {
      if (!byProject.has(c.projectId)) {
        byProject.set(c.projectId, c);
      }
    }

    const result: Array<{
      cycleId: Doc<"monthlyBillingCycles">["_id"];
      projectId: Doc<"projects">["_id"];
      clientId: Doc<"users">["_id"];
      projectName: string;
      monthLabel: string;
    }> = [];

    for (const c of byProject.values()) {
      const project = await ctx.db.get(c.projectId);
      if (!project) continue;
      result.push({
        cycleId: c._id,
        projectId: c.projectId,
        clientId: project.clientId,
        projectName: project.intakeForm.title,
        monthLabel: new Date(c.monthStartDate).toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
      });
    }

    return result;
  },
});

const AUTO_RELEASE_DELAY_MS = 48 * 60 * 60 * 1000; // 48 hours after month ends

/**
 * Get pending cycles ready for auto-release (autoReleaseAt <= now).
 * For cycles without autoReleaseAt (legacy), use monthEndDate + 48h.
 */
export const getCyclesReadyForAutoReleaseInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cycles = await ctx.db
      .query("monthlyBillingCycles")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const ready: typeof cycles = [];
    for (const c of cycles) {
      const releaseAt = c.autoReleaseAt ?? c.monthEndDate + AUTO_RELEASE_DELAY_MS;
      if (releaseAt > now) continue;
      const project = await ctx.db.get(c.projectId);
      if (!project || project.status !== "in_progress") continue;
      ready.push(c);
    }
    return ready;
  },
});
