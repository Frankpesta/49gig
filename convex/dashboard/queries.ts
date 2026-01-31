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
      let satisfactionRate =
        completedProjects.length > 0
          ? Math.round((satisfiedCount / completedProjects.length) * 100)
          : 0;

      // Satisfaction from client's ratings when available (1-5 → 0-100)
      const clientReviews = await ctx.db
        .query("reviews")
        .withIndex("by_client", (q) => q.eq("clientId", user._id))
        .collect();
      if (clientReviews.length > 0) {
        const avgRating =
          clientReviews.reduce((sum, r) => sum + r.rating, 0) / clientReviews.length;
        satisfactionRate = Math.round(avgRating * 20); // 1-5 → 20-100
      }

      // Active projects progress: % of milestones completed (paid or approved) for active projects
      const activeProjectIds = new Set(activeProjects.map((p) => p._id));
      const allMilestones = await ctx.db.query("milestones").collect();
      const activeMilestones = allMilestones.filter((m) =>
        activeProjectIds.has(m.projectId)
      );
      const completedMilestones = activeMilestones.filter(
        (m) => m.status === "paid" || m.status === "approved"
      );
      const activeProjectsProgress =
        activeMilestones.length > 0
          ? Math.round((completedMilestones.length / activeMilestones.length) * 100)
          : 0;

      // Calculate trends (compare current period with previous period)
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

      // Active Projects trend (30 days) - count projects that were active 30 days ago
      // We need to check projects that existed 30 days ago and were active then
      const activeProjects30DaysAgo = projects.filter(
        (p) =>
          p.createdAt < thirtyDaysAgo &&
          ACTIVE_PROJECT_STATUSES.has(p.status) &&
          (p.matchedAt === undefined || p.matchedAt < thirtyDaysAgo)
      ).length;
      const activeProjectsTrend = activeProjects30DaysAgo > 0
        ? Math.round(((activeProjects.length - activeProjects30DaysAgo) / activeProjects30DaysAgo) * 100)
        : activeProjects.length > 0 ? 100 : 0;

      // Proposals trend (7 days)
      const proposals7DaysAgo = matches.filter(
        (m) => projectIds.has(m.projectId) && m.createdAt < sevenDaysAgo
      ).length;
      const proposalsTrend = proposals7DaysAgo > 0
        ? Math.round(((proposals.length - proposals7DaysAgo) / proposals7DaysAgo) * 100)
        : proposals.length > 0 ? 100 : 0;

      // Escrow trend (30 days)
      const escrowed30DaysAgo = projects
        .filter((p) => p.createdAt < thirtyDaysAgo)
        .reduce((sum, project) => sum + (project.escrowedAmount || 0), 0);
      const escrowedTrend = escrowed30DaysAgo > 0
        ? Math.round(((escrowed - escrowed30DaysAgo) / escrowed30DaysAgo) * 100)
        : escrowed > 0 ? 100 : 0;

      // Total Spend trend (30 days)
      const totalSpend30DaysAgo = payments
        .filter(
          (payment) =>
            projectIds.has(payment.projectId) &&
            (payment.type === "pre_funding" || payment.type === "milestone_release") &&
            payment.createdAt < thirtyDaysAgo
        )
        .reduce((sum, payment) => sum + payment.amount, 0);
      const totalSpendTrend = totalSpend30DaysAgo > 0
        ? Math.round(((totalSpend - totalSpend30DaysAgo) / totalSpend30DaysAgo) * 100)
        : totalSpend > 0 ? 100 : 0;

      return {
        role: "client",
        metrics: {
          activeProjects: activeProjects.length,
          activeProjectsProgress,
          proposals: proposals.length,
          escrowed,
          totalSpend,
          avgMatchHours,
          satisfactionRate,
          trends: {
            activeProjects: { value: Math.abs(activeProjectsTrend), isPositive: activeProjectsTrend >= 0, label: "30d" },
            proposals: { value: Math.abs(proposalsTrend), isPositive: proposalsTrend >= 0, label: "7d" },
            escrowed: { value: Math.abs(escrowedTrend), isPositive: escrowedTrend >= 0, label: "30d" },
            totalSpend: { value: Math.abs(totalSpendTrend), isPositive: totalSpendTrend >= 0, label: "30d" },
          },
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

      // Client ratings / reputation
      const clientReviews = await ctx.db
        .query("reviews")
        .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
        .collect();
      const avgRating =
        clientReviews.length > 0
          ? Math.round(
              (clientReviews.reduce((s, r) => s + r.rating, 0) / clientReviews.length) * 10
            ) / 10
          : 0;
      const reviewCount = clientReviews.length;

      const acceptedMatches = matches.filter((match) => match.status === "accepted");
      const respondedMatches = matches.filter(
        (match) => match.status === "accepted" || match.status === "rejected"
      );
      const responseRate =
        matches.length > 0
          ? Math.round((respondedMatches.length / matches.length) * 100)
          : 0;

      // Calculate trends (use thirtyDaysAgo from handler scope)
      // Active Projects trend (30 days)
      const activeProjects30DaysAgo = projects.filter(
        (p) =>
          p.matchedAt && p.matchedAt < thirtyDaysAgo &&
          ACTIVE_PROJECT_STATUSES.has(p.status)
      ).length;
      const activeProjectsTrend = activeProjects30DaysAgo > 0
        ? Math.round(((activeProjects.length - activeProjects30DaysAgo) / activeProjects30DaysAgo) * 100)
        : activeProjects.length > 0 ? 100 : 0;

      // Earnings trend (30 days)
      const earnings30DaysAgo = payments
        .filter(
          (payment) =>
            projectIds.has(payment.projectId) &&
            (payment.type === "payout" || payment.type === "milestone_release") &&
            payment.createdAt < thirtyDaysAgo
        )
        .reduce((sum, payment) => sum + payment.netAmount, 0);
      const earningsTrend = earnings30DaysAgo > 0
        ? Math.round(((earnings - earnings30DaysAgo) / earnings30DaysAgo) * 100)
        : earnings > 0 ? 100 : 0;

      return {
        role: "freelancer",
        metrics: {
          activeProjects: activeProjects.length,
          earnings,
          matchScore,
          estimatedHours,
          pendingReviews: pendingReviews.length,
          responseRate,
          avgRating,
          reviewCount,
          trends: {
            activeProjects: { value: Math.abs(activeProjectsTrend), isPositive: activeProjectsTrend >= 0, label: "30d" },
            earnings: { value: Math.abs(earningsTrend), isPositive: earningsTrend >= 0, label: "30d" },
          },
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
