import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";

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

    return await ctx.db
      .query("monthlyBillingCycles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

/**
 * Get pending cycles awaiting client approval (for client dashboard).
 * Admins see all pending cycles across projects.
 */
export const getPendingCyclesForClient = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || (user as Doc<"users">).status !== "active") return [];

    const isAdmin = (user as Doc<"users">).role === "admin";
    let allCycles: Doc<"monthlyBillingCycles">[];

    if (isAdmin) {
      allCycles = await ctx.db
        .query("monthlyBillingCycles")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect();
    } else {
      const clientId = (user as Doc<"users">)._id;
      if ((user as Doc<"users">).role !== "client") return [];
      const myProjects = await ctx.db
        .query("projects")
        .withIndex("by_client", (q) => q.eq("clientId", clientId))
        .collect();
      const projectIds = myProjects.map((p) => p._id);
      allCycles = [];
      for (const pid of projectIds) {
        const cycles = await ctx.db
          .query("monthlyBillingCycles")
          .withIndex("by_project", (q) => q.eq("projectId", pid))
          .filter((q) => q.eq(q.field("status"), "pending"))
          .collect();
        allCycles.push(...cycles);
      }
    }

    return allCycles.sort((a, b) => a.monthStartDate - b.monthStartDate);
  },
});

/**
 * Get all pending cycles with project/client info (internal - for reminder cron)
 */
export const getPendingCyclesForReminderInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const cycles = await ctx.db
      .query("monthlyBillingCycles")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    const result: Array<{
      cycleId: Doc<"monthlyBillingCycles">["_id"];
      projectId: Doc<"projects">["_id"];
      clientId: Doc<"users">["_id"];
      projectName: string;
      monthLabel: string;
    }> = [];

    for (const c of cycles) {
      const project = await ctx.db.get(c.projectId);
      if (!project) continue;
      result.push({
        cycleId: c._id,
        projectId: c.projectId,
        clientId: project.clientId,
        projectName: project.intakeForm.title,
        monthLabel: new Date(c.monthStartDate).toLocaleString("default", {
          month: "short",
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

    return cycles.filter((c) => {
      const releaseAt = c.autoReleaseAt ?? c.monthEndDate + AUTO_RELEASE_DELAY_MS;
      return releaseAt <= now;
    });
  },
});
