import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get verification status for current freelancer
 * Returns null if user is not a freelancer or not authenticated
 * Works with both Convex Auth and session tokens
 */
export const getVerificationStatus = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let user = null;

    // If userId is provided, use it directly (for session token auth)
    if (args.userId) {
      user = await ctx.db.get(args.userId);
    } else {
      // Try Convex Auth
      const identity = await ctx.auth.getUserIdentity();
      if (!identity || !identity.email) {
        return null;
      }

      // User authenticated via Convex Auth
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
    }

    // Check if user exists and is active
    if (!user || user.status !== "active") {
      return null;
    }

    // Check if user is a freelancer
    if (user.role !== "freelancer") {
      return null;
    }

    // Get verification results
    const vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .first();

    return {
      userId: user._id,
      verificationStatus: user.verificationStatus || "not_started",
      verificationCompletedAt: user.verificationCompletedAt,
      vettingResult: vettingResult
        ? {
            status: vettingResult.status,
            currentStep: vettingResult.currentStep,
            stepsCompleted: vettingResult.stepsCompleted,
            overallScore: vettingResult.overallScore,
            englishProficiency: vettingResult.englishProficiency,
            skillAssessments: vettingResult.skillAssessments,
            fraudFlags: vettingResult.fraudFlags,
          }
        : null,
    };
  },
});

/**
 * Get verification results by freelancer ID (admin/moderator only)
 */
export const getVerificationResults = query({
  args: {
    freelancerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Only admins, moderators, or the freelancer themselves can view
    const isAuthorized =
      user.role === "admin" ||
      user.role === "moderator" ||
      user._id === args.freelancerId;

    if (!isAuthorized) {
      throw new Error("Unauthorized");
    }

    const freelancer = await ctx.db.get(args.freelancerId);
    if (!freelancer || freelancer.role !== "freelancer") {
      throw new Error("Freelancer not found");
    }

    const vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .first();

    return {
      freelancer: {
        _id: freelancer._id,
        name: freelancer.name,
        email: freelancer.email,
        verificationStatus: freelancer.verificationStatus,
        verificationCompletedAt: freelancer.verificationCompletedAt,
      },
      vettingResult,
    };
  },
});

/**
 * Get all pending verifications (admin/moderator only)
 */
export const getPendingVerifications = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("in_progress"),
        v.literal("flagged")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      throw new Error("Unauthorized");
    }

    const status = args.status || "pending";
    const results = await ctx.db
      .query("vettingResults")
      .withIndex("by_status", (q) => q.eq("status", status))
      .collect();

    // Get freelancer details for each result
    const resultsWithFreelancers = await Promise.all(
      results.map(async (result) => {
        const freelancer = await ctx.db.get(result.freelancerId);
        return {
          ...result,
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

    return resultsWithFreelancers;
  },
});

/**
 * Check if freelancer is verified and can access platform
 */
export const isFreelancerVerified = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      return { verified: false, reason: "not_authenticated" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return { verified: false, reason: "user_not_found" };
    }

    // If userId is provided, check that user instead (for admin checks)
    const targetUserId = args.userId || user._id;
    if (targetUserId !== user._id && user.role !== "admin" && user.role !== "moderator") {
      throw new Error("Unauthorized");
    }

    const targetUser = await ctx.db.get(targetUserId);
    if (!targetUser || targetUser.role !== "freelancer") {
      return { verified: false, reason: "not_freelancer" };
    }

    // Check verification status
    if (targetUser.verificationStatus !== "approved") {
      return {
        verified: false,
        reason: "not_verified",
        status: targetUser.verificationStatus || "not_started",
      };
    }

    // Double-check with vetting results
    const vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", targetUserId))
      .first();

    if (!vettingResult || vettingResult.status !== "approved") {
      return {
        verified: false,
        reason: "vetting_not_approved",
        status: vettingResult?.status || "not_found",
      };
    }

    return { verified: true };
  },
});

/**
 * Get vetting result by freelancer ID (internal)
 */
export const getVettingResultByFreelancer = internalQuery({
  args: {
    freelancerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .first();

    return vettingResult;
  },
});

