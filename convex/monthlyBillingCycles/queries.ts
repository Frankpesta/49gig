import { query } from "../_generated/server";
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
      (project.matchedFreelancerIds?.includes((user as Doc<"users">)._id) ?? false);

    if (!isClient && !isFreelancer && (user as Doc<"users">).role !== "admin") {
      return [];
    }

    return await ctx.db
      .query("monthlyBillingCycles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

/**
 * Get pending cycles awaiting client approval (for client dashboard)
 */
export const getPendingCyclesForClient = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || (user as Doc<"users">).status !== "active") return [];

    const clientId = (user as Doc<"users">)._id;
    if ((user as Doc<"users">).role !== "client") return [];

    const myProjects = await ctx.db
      .query("projects")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .collect();

    const projectIds = myProjects.map((p) => p._id);
    const allCycles: Doc<"monthlyBillingCycles">[] = [];

    for (const pid of projectIds) {
      const cycles = await ctx.db
        .query("monthlyBillingCycles")
        .withIndex("by_project", (q) => q.eq("projectId", pid))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();
      allCycles.push(...cycles);
    }

    return allCycles.sort((a, b) => a.monthStartDate - b.monthStartDate);
  },
});
