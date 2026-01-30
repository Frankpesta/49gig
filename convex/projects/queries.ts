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
 * Get a single project by ID with full details
 */
export const getProject = query({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Authorization: client, matched freelancer, freelancer with pending/accepted match, admin, or moderator
    let canView =
      user.role === "admin" ||
      user.role === "moderator" ||
      project.clientId === user._id ||
      project.matchedFreelancerId === user._id;

    // Freelancer with a match (pending or accepted) for this project can view details before/after acceptance
    if (!canView && user.role === "freelancer") {
      const match = await ctx.db
        .query("matches")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .filter((q) => q.eq(q.field("freelancerId"), user._id))
        .first();
      if (match && (match.status === "pending" || match.status === "accepted")) {
        canView = true;
      }
    }

    if (!canView) {
      throw new Error("Not authorized to view this project");
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
 * Get milestones for a project
 */
export const getProjectMilestones = query({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Authorization: client, matched freelancer, freelancer with pending/accepted match, admin, or moderator
    let canViewMilestones =
      user.role === "admin" ||
      user.role === "moderator" ||
      project.clientId === user._id ||
      project.matchedFreelancerId === user._id;

    if (!canViewMilestones && user.role === "freelancer") {
      const match = await ctx.db
        .query("matches")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .filter((q) => q.eq(q.field("freelancerId"), user._id))
        .first();
      if (match && (match.status === "pending" || match.status === "accepted")) {
        canViewMilestones = true;
      }
    }

    if (!canViewMilestones) {
      throw new Error("Not authorized to view this project");
    }

    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
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