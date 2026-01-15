import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";

const ACTIVE_PROJECT_STATUSES = new Set([
  "pending_funding",
  "funded",
  "matching",
  "matched",
  "in_progress",
]);

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

export const getDashboardMetrics = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    if (user.role === "client") {
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_client", (q) => q.eq("clientId", user._id))
        .collect();

      const projectIds = new Set(projects.map((project) => project._id));
      const activeProjects = projects.filter((project) =>
        ACTIVE_PROJECT_STATUSES.has(project.status)
      );

      const escrowed = projects.reduce(
        (sum, project) => sum + (project.escrowedAmount || 0),
        0
      );

      const matches = await ctx.db
        .query("matches")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect();
      const proposals = matches.filter((match) => projectIds.has(match.projectId));

      const payments = await ctx.db
        .query("payments")
        .withIndex("by_status", (q) => q.eq("status", "succeeded"))
        .collect();
      const totalSpend = payments
        .filter(
          (payment) =>
            projectIds.has(payment.projectId) &&
            (payment.type === "pre_funding" || payment.type === "milestone_release")
        )
        .reduce((sum, payment) => sum + payment.amount, 0);

      const matchedProjects = projects.filter(
        (project) => project.matchedAt && project.createdAt
      );
      const avgMatchHours =
        matchedProjects.length > 0
          ? Math.round(
              matchedProjects.reduce((sum, project) => {
                return sum + (project.matchedAt! - project.createdAt) / 36e5;
              }, 0) / matchedProjects.length
            )
          : 0;

      const disputes = await ctx.db
        .query("disputes")
        .withIndex("by_status", (q) => q.eq("status", "open"))
        .collect();
      const disputedProjectIds = new Set(
        disputes.map((dispute) => dispute.projectId)
      );
      const completedProjects = projects.filter(
        (project) => project.status === "completed"
      );
      const satisfiedCount = completedProjects.filter(
        (project) => !disputedProjectIds.has(project._id)
      ).length;
      const satisfactionRate =
        completedProjects.length > 0
          ? Math.round((satisfiedCount / completedProjects.length) * 100)
          : 0;

      return {
        role: "client",
        metrics: {
          activeProjects: activeProjects.length,
          proposals: proposals.length,
          escrowed,
          totalSpend,
          avgMatchHours,
          satisfactionRate,
        },
      };
    }

    if (user.role === "freelancer") {
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_freelancer", (q) => q.eq("matchedFreelancerId", user._id))
        .collect();

      const projectIds = new Set(projects.map((project) => project._id));
      const activeProjects = projects.filter((project) =>
        ACTIVE_PROJECT_STATUSES.has(project.status)
      );

      const payments = await ctx.db
        .query("payments")
        .withIndex("by_status", (q) => q.eq("status", "succeeded"))
        .collect();
      const earnings = payments
        .filter(
          (payment) =>
            projectIds.has(payment.projectId) &&
            (payment.type === "payout" || payment.type === "milestone_release")
        )
        .reduce((sum, payment) => sum + payment.netAmount, 0);

      const matches = await ctx.db
        .query("matches")
        .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
        .collect();
      const scoredMatches = matches.filter((match) => match.createdAt >= thirtyDaysAgo);
      const matchScore =
        scoredMatches.length > 0
          ? Math.round(
              scoredMatches.reduce((sum, match) => sum + match.score, 0) /
                scoredMatches.length
            )
          : 0;

      const estimatedHours = activeProjects.reduce((sum, project) => {
        return sum + (project.intakeForm.estimatedHours || 0);
      }, 0);

      const submittedMilestones = await ctx.db
        .query("milestones")
        .withIndex("by_status", (q) => q.eq("status", "submitted"))
        .collect();
      const pendingReviews = submittedMilestones.filter((milestone) =>
        projectIds.has(milestone.projectId)
      );

      const acceptedMatches = matches.filter((match) => match.status === "accepted");
      const respondedMatches = matches.filter(
        (match) => match.status === "accepted" || match.status === "rejected"
      );
      const responseRate =
        matches.length > 0
          ? Math.round((respondedMatches.length / matches.length) * 100)
          : 0;

      return {
        role: "freelancer",
        metrics: {
          activeProjects: activeProjects.length,
          earnings,
          matchScore,
          estimatedHours,
          pendingReviews: pendingReviews.length,
          responseRate,
        },
      };
    }

    // Admin
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_created", (q) => q.gte("createdAt", 0))
      .collect();
    const totalProjects = projects.length;

    const clients = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "client"))
      .collect();
    const freelancers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "freelancer"))
      .collect();
    const activeClients = clients.filter((u) => u.status === "active").length;
    const activeFreelancers = freelancers.filter((u) => u.status === "active").length;

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_status", (q) => q.eq("status", "succeeded"))
      .collect();
    const revenue = payments
      .filter((payment) => payment.type === "platform_fee")
      .reduce((sum, payment) => sum + payment.amount, 0);

    const disputes = await ctx.db
      .query("disputes")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();
    const openDisputes = disputes.length;

    const failedPayments = await ctx.db
      .query("payments")
      .withIndex("by_status", (q) => q.eq("status", "failed"))
      .collect();
    const totalProcessed = payments.length + failedPayments.length;
    const systemHealth =
      totalProcessed > 0
        ? Math.round((payments.length / totalProcessed) * 100)
        : 100;

    return {
      role: "admin",
      metrics: {
        totalProjects,
        activeClients,
        activeFreelancers,
        revenue,
        openDisputes,
        systemHealth,
      },
    };
  },
});
