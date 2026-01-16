import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";

/**
 * Get platform analytics (admin only)
 */
export const getPlatformAnalytics = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Get user
    let user: Doc<"users"> | null = null;
    if (args.userId) {
      const userDoc = await ctx.db.get(args.userId);
      if (userDoc && (userDoc as Doc<"users">).status === "active") {
        user = userDoc as Doc<"users">;
      }
    } else {
      user = await getCurrentUser(ctx);
    }

    if (!user || user.role !== "admin") {
      return null;
    }

    // Get user counts by role
    const allUsers = await ctx.db.query("users").collect();
    const userCounts = {
      total: allUsers.length,
      clients: allUsers.filter((u) => u.role === "client").length,
      freelancers: allUsers.filter((u) => u.role === "freelancer").length,
      moderators: allUsers.filter((u) => u.role === "moderator").length,
      admins: allUsers.filter((u) => u.role === "admin").length,
      active: allUsers.filter((u) => u.status === "active").length,
      suspended: allUsers.filter((u) => u.status === "suspended").length,
    };

    // Get project counts by status
    const allProjects = await ctx.db.query("projects").collect();
    const projectCounts = {
      total: allProjects.length,
      draft: allProjects.filter((p) => p.status === "draft").length,
      pending_funding: allProjects.filter((p) => p.status === "pending_funding").length,
      funded: allProjects.filter((p) => p.status === "funded").length,
      matched: allProjects.filter((p) => p.status === "matched").length,
      in_progress: allProjects.filter((p) => p.status === "in_progress").length,
      completed: allProjects.filter((p) => p.status === "completed").length,
      cancelled: allProjects.filter((p) => p.status === "cancelled").length,
      disputed: allProjects.filter((p) => p.status === "disputed").length,
    };

    // Get payment statistics
    const allPayments = await ctx.db.query("payments").collect();
    const paymentStats = {
      total: allPayments.length,
      succeeded: allPayments.filter((p) => p.status === "succeeded").length,
      pending: allPayments.filter((p) => p.status === "pending").length,
      failed: allPayments.filter((p) => p.status === "failed").length,
      totalAmount: allPayments
        .filter((p) => p.status === "succeeded")
        .reduce((sum, p) => sum + p.amount, 0),
      totalPlatformFees: allPayments
        .filter((p) => p.status === "succeeded")
        .reduce((sum, p) => sum + (p.platformFee || 0), 0),
    };

    // Get verification statistics
    const allVettingResults = await ctx.db.query("vettingResults").collect();
    const verificationStats = {
      total: allVettingResults.length,
      approved: allVettingResults.filter((v) => v.status === "approved").length,
      pending: allVettingResults.filter((v) => v.status === "pending").length,
      rejected: allVettingResults.filter((v) => v.status === "rejected").length,
      averageScore:
        allVettingResults.length > 0
          ? allVettingResults.reduce((sum, v) => sum + (v.overallScore || 0), 0) /
            allVettingResults.length
          : 0,
    };

    // Get dispute statistics
    const allDisputes = await ctx.db.query("disputes").collect();
    const disputeStats = {
      total: allDisputes.length,
      open: allDisputes.filter((d) => d.status === "open").length,
      resolved: allDisputes.filter((d) => d.status === "resolved").length,
      escalated: allDisputes.filter((d) => d.status === "escalated").length,
    };

    // Get match statistics
    const allMatches = await ctx.db.query("matches").collect();
    const matchStats = {
      total: allMatches.length,
      pending: allMatches.filter((m) => m.status === "pending").length,
      accepted: allMatches.filter((m) => m.status === "accepted").length,
      rejected: allMatches.filter((m) => m.status === "rejected").length,
      averageScore:
        allMatches.length > 0
          ? allMatches.reduce((sum, m) => sum + m.score, 0) / allMatches.length
          : 0,
    };

    return {
      users: userCounts,
      projects: projectCounts,
      payments: paymentStats,
      verifications: verificationStats,
      disputes: disputeStats,
      matches: matchStats,
      generatedAt: Date.now(),
    };
  },
});


/**
 * Admin dashboard charts (time series + distributions)
 */
export const getAdminChartData = query({
  args: {
    userId: v.optional(v.id("users")),
    rangeDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let user: Doc<"users"> | null = null;
    if (args.userId) {
      const userDoc = await ctx.db.get(args.userId);
      if (userDoc && (userDoc as Doc<"users">).status === "active") {
        user = userDoc as Doc<"users">;
      }
    } else {
      user = await getCurrentUser(ctx);
    }

    if (!user || user.role !== "admin") {
      return null;
    }

    const now = new Date();
    const rangeDays = args.rangeDays === 90 || args.rangeDays === 365 || args.rangeDays === 30
      ? args.rangeDays
      : 180;
    const monthsCount = rangeDays === 30 ? 1 : rangeDays === 90 ? 3 : rangeDays === 365 ? 12 : 6;
    const months: Array<{
      key: string;
      label: string;
      start: number;
      end: number;
    }> = [];
    for (let i = monthsCount - 1; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = date.getTime();
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();
      months.push({
        key: `${date.getFullYear()}-${date.getMonth() + 1}`,
        label: date.toLocaleString("en-US", { month: "short" }),
        start,
        end,
      });
    }

    const allUsers = await ctx.db.query("users").collect();
    const allPayments = await ctx.db.query("payments").collect();
    const allProjects = await ctx.db.query("projects").collect();
    const allDisputes = await ctx.db.query("disputes").collect();

    const usersByMonth = months.map((month) => {
      const monthUsers = allUsers.filter(
        (u) => u.createdAt >= month.start && u.createdAt < month.end
      );
      return {
        month: month.label,
        total: monthUsers.length,
        clients: monthUsers.filter((u) => u.role === "client").length,
        freelancers: monthUsers.filter((u) => u.role === "freelancer").length,
      };
    });

    const revenueByMonth = months.map((month) => {
      const monthPayments = allPayments.filter(
        (p) =>
          p.status === "succeeded" &&
          p.type === "platform_fee" &&
          p.createdAt >= month.start &&
          p.createdAt < month.end
      );
      return {
        month: month.label,
        revenue: monthPayments.reduce((sum, p) => sum + p.amount, 0),
        volume: monthPayments.length,
      };
    });

    const projectsByMonth = months.map((month) => {
      const monthProjects = allProjects.filter(
        (p) => p.createdAt >= month.start && p.createdAt < month.end
      );
      return {
        month: month.label,
        created: monthProjects.length,
      };
    });

    const statusKeys = [
      "draft",
      "pending_funding",
      "funded",
      "matching",
      "matched",
      "in_progress",
      "completed",
      "cancelled",
      "disputed",
    ] as const;

    const projectStatusByMonth = months.map((month) => {
      const monthProjects = allProjects.filter(
        (p) => p.createdAt >= month.start && p.createdAt < month.end
      );
      const counts: Record<string, number> = {};
      for (const key of statusKeys) {
        counts[key] = monthProjects.filter((p) => p.status === key).length;
      }
      return {
        month: month.label,
        ...counts,
      } as {
        month: string;
        draft: number;
        pending_funding: number;
        funded: number;
        matching: number;
        matched: number;
        in_progress: number;
        completed: number;
        cancelled: number;
        disputed: number;
      };
    });

    const projectStatusCounts: Record<string, number> = {};
    for (const project of allProjects) {
      projectStatusCounts[project.status] =
        (projectStatusCounts[project.status] || 0) + 1;
    }

    const disputeStatusCounts: Record<string, number> = {};
    for (const dispute of allDisputes) {
      disputeStatusCounts[dispute.status] =
        (disputeStatusCounts[dispute.status] || 0) + 1;
    }

    return {
      usersByMonth,
      revenueByMonth,
      projectsByMonth,
      projectStatusByMonth,
      projectStatus: Object.entries(projectStatusCounts).map(([name, value]) => ({
        name,
        value,
      })),
      disputeStatus: Object.entries(disputeStatusCounts).map(([name, value]) => ({
        name,
        value,
      })),
      generatedAt: Date.now(),
    };
  },
});
