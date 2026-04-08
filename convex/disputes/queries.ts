import { query, internalQuery, QueryCtx } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";
import { clientLockedGrossToFreelancerEscrowPool } from "./amounts";

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
        v.literal("closed")
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
          if (project && user.role !== "admin" && user.role !== "moderator") {
            const isFreelancer =
              project.matchedFreelancerId === user._id ||
              (project.matchedFreelancerIds?.includes(user._id) ?? false);
            const isClient = project.clientId === user._id;
            if (isFreelancer && !isClient) {
              lockedAmount = clientLockedGrossToFreelancerEscrowPool(
                d.lockedAmount,
                project.platformFee ?? 15
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

    // Get user's projects (as client or matched freelancer)
    const userProjects = await ctx.db
      .query("projects")
      .filter((q) =>
        q.or(
          q.eq(q.field("clientId"), user._id),
          q.eq(q.field("matchedFreelancerId"), user._id)
        )
      )
      .collect();

    const projectIds = userProjects.map((p) => p._id);

    if (projectIds.length === 0) {
      return [];
    }

    // Get disputes for user's projects
    const allDisputes: any[] = [];
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
    return enrichDisputes(sorted);
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

    // Check authorization (include team freelancers)
    const isClient = project.clientId === user._id;
    const isFreelancer =
      project.matchedFreelancerId === user._id ||
      (project.matchedFreelancerIds && project.matchedFreelancerIds.includes(user._id));
    const isInitiator = dispute.initiatorId === user._id;
    const isAssignedModerator =
      dispute.assignedModeratorId === user._id;
    const isAdminOrModerator =
      user.role === "admin" || user.role === "moderator";

    if (
      !isClient &&
      !isFreelancer &&
      !isInitiator &&
      !isAssignedModerator &&
      !isAdminOrModerator
    ) {
      return null;
    }

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

    // Task 9: Role-based visibility of resolution notes and locked amount
    let visibleResolution = dispute.resolution;
    // Stored lockedAmount is client gross (includes platform fee). Freelancers see net escrow pool.
    let visibleLockedAmount = dispute.lockedAmount;
    if (isFreelancer && !isAdminOrModerator) {
      visibleLockedAmount = clientLockedGrossToFreelancerEscrowPool(
        dispute.lockedAmount,
        project.platformFee ?? 15
      );
    }

    if (dispute.resolution && !isAdminOrModerator) {
      const { decision } = dispute.resolution;
      // Determine if the viewer is the "winner"
      const viewerIsClient = isClient;
      const viewerIsFreelancer = isFreelancer;
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

    return {
      ...dispute,
      evidence: enrichedEvidence,
      resolution: visibleResolution,
      lockedAmount: visibleLockedAmount,
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
        v.literal("closed")
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

    const openDisputes = await ctx.db
      .query("disputes")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    const underReviewDisputes = await ctx.db
      .query("disputes")
      .withIndex("by_status", (q) => q.eq("status", "under_review"))
      .collect();

    const allPending = [...openDisputes, ...underReviewDisputes];

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
    const isFreelancer =
      project.matchedFreelancerId === user._id ||
      (project.matchedFreelancerIds?.includes(user._id) ?? false);
    const isStaff = user.role === "admin" || user.role === "moderator";
    const isAssigned = dispute.assignedModeratorId === user._id;

    if (!isClient && !isFreelancer && !isStaff && !isAssigned) {
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
    const fIds = project.matchedFreelancerId
      ? [project.matchedFreelancerId]
      : project.matchedFreelancerIds ?? [];
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

