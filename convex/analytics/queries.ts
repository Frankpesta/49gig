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

