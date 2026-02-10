import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";

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
        v.literal("matched"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled"),
        v.literal("disputed")
      )
    ),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    let projects;

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
      // Freelancers see projects they're matched to
      if (args.status) {
        projects = await ctx.db
          .query("projects")
          .withIndex("by_freelancer", (q) => q.eq("matchedFreelancerId", user._id))
          .filter((q) => q.eq(q.field("status"), args.status!))
          .order("desc")
          .collect();
      } else {
        projects = await ctx.db
          .query("projects")
          .withIndex("by_freelancer", (q) => q.eq("matchedFreelancerId", user._id))
          .order("desc")
          .collect();
      }
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

    // Get client and freelancer info
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