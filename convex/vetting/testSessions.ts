/**
 * Test Session Management
 * 
 * Handles secure test session creation, validation, and tracking
 */

import { mutation, query, MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import { getCurrentUser } from "../auth";

/**
 * Helper function to get current user in mutations
 */
async function getCurrentUserInMutation(
  ctx: MutationCtx,
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
 * Create a new test session
 */
export const createTestSession = mutation({
  args: {
    testType: v.union(
      v.literal("english_grammar"),
      v.literal("english_comprehension"),
      v.literal("english_written"),
      v.literal("skill_mcq"),
      v.literal("skill_coding"),
      v.literal("skill_portfolio")
    ),
    skillName: v.optional(v.string()),
    experienceLevel: v.optional(v.string()),
    browserFingerprint: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    
    if (!user) {
      throw new Error("Not authenticated");
    }

    if (user.role !== "freelancer") {
      throw new Error("Only freelancers can create test sessions");
    }

    // Generate unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const now = Date.now();

    // Calculate session expiry (2 hours for tests)
    const expiresAt = now + 2 * 60 * 60 * 1000;

    // Get or create vetting result
    let vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .first();

    if (!vettingResult) {
      // Create vetting result if it doesn't exist
      const newVettingResultId = await ctx.db.insert("vettingResults", {
        freelancerId: user._id,
        identityVerification: {
          provider: "smile_identity",
          status: "pending",
        },
        englishProficiency: {},
        skillAssessments: [],
        overallScore: 0,
        status: "pending",
        currentStep: "identity",
        stepsCompleted: [],
        createdAt: now,
        updatedAt: now,
      });
      const newVettingResult = await ctx.db.get(newVettingResultId);
      if (!newVettingResult) {
        throw new Error("Failed to create vetting result");
      }
      vettingResult = newVettingResult;
    }

    // Store session metadata in vetting result (or create sessions table in production)
    // For now, we'll return the session ID and let the client track it

    return {
      sessionId,
      expiresAt,
      createdAt: now,
      vettingResultId: vettingResult._id,
    };
  },
});

/**
 * Validate test session
 */
export const validateTestSession = query({
  args: {
    sessionId: v.string(),
    testType: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // In production, fetch session from database and validate
    // For now, basic validation structure
    
    // Check if session exists and is not expired
    // This would query a sessions table
    
    return {
      valid: true,
      expired: false,
      testType: args.testType,
    };
  },
});

/**
 * Track test activity (for anti-cheat)
 */
export const trackTestActivity = mutation({
  args: {
    sessionId: v.string(),
    activity: v.union(
      v.literal("tab_switch"),
      v.literal("window_blur"),
      v.literal("copy_attempt"),
      v.literal("paste_attempt"),
      v.literal("right_click"),
      v.literal("fullscreen_exit")
    ),
    timestamp: v.number(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get vetting result
    const vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .first();

    if (!vettingResult) {
      return { logged: false, error: "Vetting result not found" };
    }

    // Update suspicious activity in appropriate field
    // This would ideally be in a separate test_activities table
    // For now, we'll log it in audit logs
    
    await ctx.db.insert("auditLogs", {
      action: "test_activity_tracked",
      actionType: "system",
      actorId: user._id,
      actorRole: user.role,
      targetType: "vettingResult",
      targetId: vettingResult._id,
      details: {
        sessionId: args.sessionId,
        activity: args.activity,
        timestamp: args.timestamp,
      },
      createdAt: Date.now(),
    });

    return {
      logged: true,
      timestamp: args.timestamp,
    };
  },
});

/**
 * Complete test session
 */
export const completeTestSession = mutation({
  args: {
    sessionId: v.string(),
    testType: v.string(),
    timeSpent: v.number(), // in seconds
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Mark session as completed
    // Calculate time spent vs expected time
    // Flag if suspicious

    return {
      completed: true,
      completedAt: now,
      timeSpent: args.timeSpent,
    };
  },
});
