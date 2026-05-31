import { mutation, internalMutation, MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { checkFraudFlags } from "./engine";
import { runCompleteVerificationForFreelancer } from "./completeVerificationCore";
import { getCurrentUser } from "../auth";
import { Doc, Id } from "../_generated/dataModel";
import type { FunctionReference } from "convex/server";

const api = require("../_generated/api") as {
  api: {
    notifications: { actions: { sendSystemNotification: unknown } };
  };
};
const internalAny = require("../_generated/api").internal as any;

/**
 * Helper function to get current user in mutations
 * Supports both Convex Auth and session token authentication via userId
 */
async function getCurrentUserInMutation(
  ctx: MutationCtx,
  userId?: string
): Promise<Doc<"users"> | null> {
  if (userId) {
    // Type assertion: userId is from the users table
    const user = await ctx.db.get(userId as any as Doc<"users">["_id"]);
    if (!user) {
      return null;
    }
    // Type assertion: we know this is a user because we queried by userId
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
  // Type assertion: getCurrentUser queries the users table
  const userDoc = user as Doc<"users">;
  if (userDoc.status !== "active") {
    return null;
  }
  return userDoc;
}

async function resolveStaffUser(
  ctx: MutationCtx,
  adminUserId?: string
): Promise<Doc<"users"> | null> {
  if (adminUserId) {
    const u = await ctx.db.get(adminUserId as Doc<"users">["_id"]);
    if (!u || u.status !== "active") return null;
    if (u.role !== "admin" && u.role !== "moderator") return null;
    return u;
  }
  const u = await getCurrentUser(ctx);
  if (!u || u.status !== "active") return null;
  if (u.role !== "admin" && u.role !== "moderator") return null;
  return u;
}

/** Approve/reject freelancer verification: admins only */
async function resolveAdminUser(
  ctx: MutationCtx,
  adminUserId?: string
): Promise<Doc<"users"> | null> {
  if (adminUserId) {
    const u = await ctx.db.get(adminUserId as Doc<"users">["_id"]);
    if (!u || u.status !== "active") return null;
    if (u.role !== "admin") return null;
    return u;
  }
  const u = await getCurrentUser(ctx);
  if (!u || u.status !== "active") return null;
  if (u.role !== "admin") return null;
  return u as Doc<"users">;
}

type FraudFlag = NonNullable<Doc<"vettingResults">["fraudFlags"]>[number];

/**
 * Freelancer confirms webcam is on for a test segment (no recording; server-side timestamp only).
 */
export const confirmProctoringCamera = mutation({
  args: {
    userId: v.optional(v.id("users")),
    segment: v.union(v.literal("english"), v.literal("skills")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== "freelancer") throw new Error("Only freelancers can confirm proctoring");

    const vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .first();
    if (!vettingResult) throw new Error("Verification not initialized");

    const prev = vettingResult.proctoringSummary ?? {};
    const now = Date.now();
    const proctoringSummary = {
      ...prev,
      ...(args.segment === "english"
        ? { englishProctoringReadyAt: now }
        : { skillsProctoringReadyAt: now }),
      lastMetricsAt: now,
    };
    await ctx.db.patch(vettingResult._id, {
      proctoringSummary,
      updatedAt: now,
    });
    return { success: true };
  },
});

/**
 * Batch lightweight proctoring signals (tab hidden, blur, paste, camera dropped). No video upload.
 */
export const submitProctoringMetrics = mutation({
  args: {
    userId: v.optional(v.id("users")),
    delta: v.object({
      visibilityHiddenMs: v.optional(v.number()),
      windowBlurEvents: v.optional(v.number()),
      pasteAttempts: v.optional(v.number()),
      cameraOffSegments: v.optional(v.number()),
      fullscreenExitEvents: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== "freelancer") throw new Error("Only freelancers can submit proctoring metrics");

    const vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .first();
    if (!vettingResult) return { success: false };

    const prev = vettingResult.proctoringSummary ?? {};
    const now = Date.now();
    const d = args.delta;
    const proctoringSummary = {
      ...prev,
      visibilityHiddenMsTotal:
        (prev.visibilityHiddenMsTotal ?? 0) + (d.visibilityHiddenMs ?? 0),
      windowBlurEvents: (prev.windowBlurEvents ?? 0) + (d.windowBlurEvents ?? 0),
      pasteAttempts: (prev.pasteAttempts ?? 0) + (d.pasteAttempts ?? 0),
      cameraOffSegments: (prev.cameraOffSegments ?? 0) + (d.cameraOffSegments ?? 0),
      fullscreenExitEvents:
        (prev.fullscreenExitEvents ?? 0) + (d.fullscreenExitEvents ?? 0),
      lastMetricsAt: now,
    };
    await ctx.db.patch(vettingResult._id, {
      proctoringSummary,
      updatedAt: now,
    });
    return { success: true };
  },
});

/**
 * Initialize verification process for a freelancer
 * Supports both Convex Auth and session token authentication
 */
export const initializeVerification = mutation({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    
    if (!user) {
      throw new Error("Not authenticated");
    }

    if (user.role !== "freelancer") {
      throw new Error("Only freelancers can start verification");
    }

    // Check if verification already exists
    const existing = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .first();

    if (existing) {
      throw new Error("Verification already initialized");
    }

    // Create initial vetting result
    const vettingResultId = await ctx.db.insert("vettingResults", {
      freelancerId: user._id,
      englishProficiency: {},
      skillAssessments: [],
      overallScore: 0,
      status: "pending",
      currentStep: "english",
      stepsCompleted: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update user verification status
    await ctx.db.patch(user._id, {
      verificationStatus: "in_progress",
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "verification_initialized",
      actionType: "system",
      actorId: user._id,
      actorRole: user.role,
      targetType: "vettingResult",
      targetId: vettingResultId,
      createdAt: Date.now(),
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [user._id],
      title: "Verification started",
      message: "Your verification has started. Complete all steps to continue.",
      type: "verification",
      data: { vettingResultId },
    });

    return { vettingResultId };
  },
});

/**
 * Freelancer opts out of the post-failure retake wait and may start the retake immediately.
 * Only valid while the corresponding cooldown timestamp is still in the future.
 */
export const clearVerificationRetakeCooldown = mutation({
  args: {
    section: v.union(v.literal("english"), v.literal("skills")),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }
    if (user.role !== "freelancer") {
      throw new Error("Only freelancers can clear a retake cooldown");
    }

    const vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .first();

    if (!vettingResult) {
      throw new Error("Verification not initialized");
    }

    const now = Date.now();

    if (args.section === "english") {
      if ((vettingResult.englishAttemptRound ?? 0) < 1) {
        throw new Error("English retake cooldown does not apply yet.");
      }
      const until = vettingResult.englishRetakeAvailableAt;
      if (until == null || now >= until) {
        throw new Error("Your English retake is already available — refresh the page if the button still appears.");
      }
      await ctx.db.patch(vettingResult._id, {
        englishRetakeAvailableAt: undefined,
        updatedAt: now,
      });
    } else {
      if ((vettingResult.skillsAttemptRound ?? 0) < 1) {
        throw new Error("Skill test retake cooldown does not apply yet.");
      }
      const until = vettingResult.skillsRetakeAvailableAt;
      if (until == null || now >= until) {
        throw new Error(
          "Your skill test retake is already available — refresh the page if the button still appears."
        );
      }
      await ctx.db.patch(vettingResult._id, {
        skillsRetakeAvailableAt: undefined,
        updatedAt: now,
      });
    }

    await ctx.db.insert("auditLogs", {
      action: "verification_retake_cooldown_cleared",
      actionType: "auth",
      actorId: user._id,
      actorRole: user.role,
      targetType: "vettingResult",
      targetId: vettingResult._id,
      details: { section: args.section },
      createdAt: now,
    });

    return { success: true as const };
  },
});

/**
 * Submit English proficiency test results
 */
export const submitEnglishProficiency = mutation({
  args: {
    grammarScore: v.number(),
    comprehensionScore: v.number(),
    writtenResponse: v.string(),
    timeSpent: v.number(), // in seconds
    testSessionId: v.string(),
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
      throw new Error("Only freelancers can submit test results");
    }

    const vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .first();

    if (!vettingResult) {
      throw new Error("Verification not initialized");
    }

    if (!vettingResult.proctoringSummary?.englishProctoringReadyAt) {
      throw new Error(
        "Enable your webcam for proctoring before submitting the English assessment."
      );
    }

    const englishCooldownUntil = vettingResult.englishRetakeAvailableAt;
    if (
      englishCooldownUntil != null &&
      Date.now() < englishCooldownUntil &&
      (vettingResult.englishAttemptRound ?? 0) >= 1
    ) {
      const remainingMinutes = Math.max(
        1,
        Math.ceil((englishCooldownUntil - Date.now()) / 60000)
      );
      throw new Error(
        `Your English retake will be available in about ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}. Please come back when the cooldown ends.`
      );
    }

    // Validate scores
    if (
      args.grammarScore < 0 ||
      args.grammarScore > 100 ||
      args.comprehensionScore < 0 ||
      args.comprehensionScore > 100
    ) {
      throw new Error("Invalid scores");
    }

    // Check for suspicious activity
    const suspiciousActivity: string[] = [];
    
    // Check time spent (too fast or too slow)
    const expectedTime = 1800; // 30 minutes in seconds
    if (args.timeSpent < expectedTime * 0.3) {
      suspiciousActivity.push("test_completed_too_fast");
    }
    if (args.timeSpent > expectedTime * 2) {
      suspiciousActivity.push("test_took_too_long");
    }

    // Check if session ID matches
    if (
      vettingResult.englishProficiency.testSessionId &&
      vettingResult.englishProficiency.testSessionId !== args.testSessionId
    ) {
      suspiciousActivity.push("session_id_mismatch");
    }

    const prevEng = vettingResult.englishProficiency;
    const duplicatePendingSubmission =
      prevEng.overallScore === undefined &&
      prevEng.writtenResponse === args.writtenResponse &&
      prevEng.grammarScore === args.grammarScore &&
      prevEng.comprehensionScore === args.comprehensionScore &&
      prevEng.testSessionId === args.testSessionId;

    if (duplicatePendingSubmission) {
      return {
        success: true,
        message: "Your written response is already being graded. This page will update shortly.",
        writtenResponsePending: true,
      };
    }

    // Written section is graded asynchronously; English step completes only after written score exists.
    await ctx.db.patch(vettingResult._id, {
      englishProficiency: {
        grammarScore: args.grammarScore,
        comprehensionScore: args.comprehensionScore,
        writtenResponse: args.writtenResponse,
        overallScore: undefined,
        completedAt: undefined,
        writtenResponseScore: undefined,
        testSessionId: args.testSessionId,
        timeSpent: args.timeSpent,
        attempts: (vettingResult.englishProficiency.attempts || 0) + 1,
        suspiciousActivity,
        browserFingerprint: args.browserFingerprint,
        ipAddress: args.ipAddress,
      },
      updatedAt: Date.now(),
    });

    await (
      ctx.scheduler.runAfter as (d: number, fn: unknown, a: Record<string, unknown>) => Promise<unknown>
    )(0, internalAny.vetting.actions.gradeWrittenResponse, {
      vettingResultId: vettingResult._id,
      writtenResponse: args.writtenResponse,
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "english_proficiency_submitted",
      actionType: "system",
      actorId: user._id,
      actorRole: user.role,
      targetType: "vettingResult",
      targetId: vettingResult._id,
      details: {
        grammarScore: args.grammarScore,
        comprehensionScore: args.comprehensionScore,
        timeSpent: args.timeSpent,
        suspiciousActivity,
      },
      createdAt: Date.now(),
    });

    // Trigger AI grading for written response (will be handled by action)
    return {
      success: true,
      message: "English proficiency test submitted. Written response being graded...",
      writtenResponsePending: true,
    };
  },
});

/**
 * Submit skill assessment results
 */
export const submitSkillAssessment = mutation({
  args: {
    skillId: v.string(),
    skillName: v.string(),
    assessmentType: v.union(v.literal("mcq"), v.literal("coding"), v.literal("portfolio")),
    score: v.number(),
    timeSpent: v.number(),
    testSessionId: v.string(),
    details: v.optional(v.any()),
    codeSubmissions: v.optional(
      v.array(
        v.object({
          code: v.string(),
          submittedAt: v.number(),
          testResults: v.optional(v.any()),
        })
      )
    ),
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
      throw new Error("Only freelancers can submit skill assessments");
    }

    const vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .first();

    if (!vettingResult) {
      throw new Error("Verification not initialized");
    }

    // Validate score
    if (args.score < 0 || args.score > 100) {
      throw new Error("Invalid score");
    }

    // Check for suspicious activity
    const suspiciousActivity: string[] = [];

    // Check if skill already assessed
    const existingAssessment = vettingResult.skillAssessments.find(
      (a) => a.skillId === args.skillId
    );

    if (existingAssessment) {
      // Check if this is a retake
      if (existingAssessment.testSessionId !== args.testSessionId) {
        suspiciousActivity.push("skill_retake_detected");
      }
    }

    // Check time spent (varies by assessment type)
    const expectedTimes: Record<string, number> = {
      mcq: 600, // 10 minutes
      coding: 3600, // 1 hour
      portfolio: 300, // 5 minutes (upload time)
    };
    const expectedTime = expectedTimes[args.assessmentType] || 600;
    
    if (args.timeSpent < expectedTime * 0.2) {
      suspiciousActivity.push("assessment_completed_too_fast");
    }
    if (args.timeSpent > expectedTime * 3) {
      suspiciousActivity.push("assessment_took_too_long");
    }

    // Add or update skill assessment
    const updatedAssessments = existingAssessment
      ? vettingResult.skillAssessments.map((a) =>
          a.skillId === args.skillId
            ? {
                ...a,
                score: args.score,
                completedAt: Date.now(),
                testSessionId: args.testSessionId,
                timeSpent: args.timeSpent,
                suspiciousActivity: [
                  ...(a.suspiciousActivity || []),
                  ...suspiciousActivity,
                ],
                browserFingerprint: args.browserFingerprint,
                ipAddress: args.ipAddress,
                details: args.details,
                codeSubmissions: args.codeSubmissions,
              }
            : a
        )
      : [
          ...vettingResult.skillAssessments,
          {
            skillId: args.skillId,
            skillName: args.skillName,
            assessmentType: args.assessmentType,
            score: args.score,
            completedAt: Date.now(),
            testSessionId: args.testSessionId,
            timeSpent: args.timeSpent,
            suspiciousActivity,
            browserFingerprint: args.browserFingerprint,
            ipAddress: args.ipAddress,
            details: args.details,
            codeSubmissions: args.codeSubmissions,
          },
        ];

    await ctx.db.patch(vettingResult._id, {
      skillAssessments: updatedAssessments,
      updatedAt: Date.now(),
    });

    // Check if all skills are completed
    const skillsCompleted = updatedAssessments.length > 0;
    const justAddedSkillsToSteps =
      skillsCompleted && !vettingResult.stepsCompleted.includes("skills");
    if (justAddedSkillsToSteps) {
      await ctx.db.patch(vettingResult._id, {
        stepsCompleted: [...vettingResult.stepsCompleted, "skills"],
        currentStep: "complete",
      });
      if (vettingResult.stepsCompleted.includes("english")) {
        await ctx.scheduler.runAfter(
          0,
          internalAny.vetting.internalMutations.runAutoCompleteVerification,
          { freelancerId: user._id }
        );
      }
    }

    // Check for fraud flags
    const fraudFlags = checkFraudFlags(vettingResult, {
      suspiciousActivity,
      ipAddress: args.ipAddress,
      browserFingerprint: args.browserFingerprint,
    });

    if (fraudFlags.length > 0) {
      await ctx.db.patch(vettingResult._id, {
        fraudFlags: [...(vettingResult.fraudFlags || []), ...fraudFlags],
        status: "flagged",
      });
    }

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "skill_assessment_submitted",
      actionType: "system",
      actorId: user._id,
      actorRole: user.role,
      targetType: "vettingResult",
      targetId: vettingResult._id,
      details: {
        skillId: args.skillId,
        skillName: args.skillName,
        assessmentType: args.assessmentType,
        score: args.score,
        timeSpent: args.timeSpent,
        suspiciousActivity,
      },
      createdAt: Date.now(),
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [user._id],
      title: "Skill assessment submitted",
      message: "Your skill assessment has been received.",
      type: "verification",
      data: { vettingResultId: vettingResult._id },
    });

    return { success: true };
  },
});

/**
 * Complete verification process (trigger final scoring)
 */
export const completeVerification = mutation({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }
    if (user.role !== "freelancer") {
      throw new Error("Only freelancers can complete verification");
    }
    return runCompleteVerificationForFreelancer(ctx, user._id);
  },
});


/**
 * Admin: Approve verification
 */
export const approveVerification = mutation({
  args: {
    freelancerId: v.id("users"),
    reviewNotes: v.optional(v.string()),
    adminUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const admin = await resolveAdminUser(ctx, args.adminUserId);
    if (!admin) {
      throw new Error("Only admins can approve freelancer verification");
    }

    const freelancer = await ctx.db.get(args.freelancerId);
    if (!freelancer || freelancer.role !== "freelancer") {
      throw new Error("Freelancer not found");
    }

    const vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .first();

    if (!vettingResult) {
      throw new Error("Verification not found");
    }

    if (vettingResult.status !== "pending_admin" && vettingResult.status !== "flagged") {
      throw new Error("This freelancer is not awaiting admin approval");
    }
    if (freelancer.kycStatus !== "approved") {
      throw new Error("Approve KYC first before approving verification tests.");
    }

    // Update vetting result
    await ctx.db.patch(vettingResult._id, {
      status: "approved",
      reviewedBy: admin._id,
      reviewedAt: Date.now(),
      reviewNotes: args.reviewNotes,
      updatedAt: Date.now(),
    });

    // Update user verification status
    await ctx.db.patch(args.freelancerId, {
      verificationStatus: "approved",
      verificationCompletedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "verification_approved",
      actionType: "admin",
      actorId: admin._id,
      actorRole: admin.role,
      targetType: "vettingResult",
      targetId: vettingResult._id,
      details: {
        freelancerId: args.freelancerId,
        reviewNotes: args.reviewNotes,
      },
      createdAt: Date.now(),
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [args.freelancerId],
      title: "Verification approved",
      message: "Your verification has been approved. Welcome aboard!",
      type: "verification",
      data: { vettingResultId: vettingResult._id },
    });

    return { success: true };
  },
});

/**
 * Admin: Reject verification
 */
export const rejectVerification = mutation({
  args: {
    freelancerId: v.id("users"),
    reviewNotes: v.string(),
    adminUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const admin = await resolveAdminUser(ctx, args.adminUserId);
    if (!admin) {
      throw new Error("Only admins can reject freelancer verification");
    }

    const freelancer = await ctx.db.get(args.freelancerId);
    if (!freelancer || freelancer.role !== "freelancer") {
      throw new Error("Freelancer not found");
    }

    const vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .first();

    if (!vettingResult) {
      throw new Error("Verification not found");
    }

    // Update vetting result
    await ctx.db.patch(vettingResult._id, {
      status: "rejected",
      reviewedBy: admin._id,
      reviewedAt: Date.now(),
      reviewNotes: args.reviewNotes,
      updatedAt: Date.now(),
    });

    // Update user verification status
    await ctx.db.patch(args.freelancerId, {
      verificationStatus: "rejected",
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "verification_rejected",
      actionType: "admin",
      actorId: admin._id,
      actorRole: admin.role,
      targetType: "vettingResult",
      targetId: vettingResult._id,
      details: {
        freelancerId: args.freelancerId,
        reviewNotes: args.reviewNotes,
      },
      createdAt: Date.now(),
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [args.freelancerId],
      title: "Verification rejected",
      message: "Your verification was rejected. Please review the feedback.",
      type: "verification",
      data: { vettingResultId: vettingResult._id },
    });

    return { success: true };
  },
});

/**
 * Admin only: waive verification and skill tests for a freelancer by writing a passing
 * vetting record, closing open skill sessions, and optionally approving KYC for matching.
 */
export const adminOverrideFreelancerVerificationAndTests = mutation({
  args: {
    freelancerId: v.id("users"),
    adminUserId: v.optional(v.id("users")),
    reason: v.optional(v.string()),
    /** When true, sets kycStatus to approved (needed for matching alongside vetting). */
    approveKyc: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await getCurrentUserInMutation(ctx, args.adminUserId);
    if (!admin) {
      throw new Error("Not authenticated");
    }
    if (admin.role !== "admin") {
      throw new Error("Only admins can override verification and tests");
    }

    const freelancer = await ctx.db.get(args.freelancerId);
    if (!freelancer || freelancer.role !== "freelancer") {
      throw new Error("Freelancer not found");
    }

    const now = Date.now();
    const reviewNotes = args.reason?.trim()
      ? `Admin override: ${args.reason.trim()}`
      : "Admin override: verification and skill tests waived";

    const sessions = await ctx.db
      .query("vettingSkillTestSessions")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .collect();

    for (const s of sessions) {
      if (s.status !== "completed") {
        await ctx.db.patch(s._id, {
          status: "completed",
          completedAt: now,
          mcqScore: s.mcqScore ?? 85,
          portfolioScore: s.portfolioScore ?? 85,
          updatedAt: now,
        });
      }
    }

    const syntheticEnglish = {
      grammarScore: 85,
      comprehensionScore: 85,
      writtenResponseScore: 85,
      overallScore: 85,
      completedAt: now,
    };
    const syntheticSkills = [
      {
        skillId: "admin_verification_override",
        skillName: "Admin verification override",
        assessmentType: "mcq" as const,
        score: 85,
        completedAt: now,
        details: {
          waivedByAdmin: true,
          adminId: admin._id,
          at: now,
        },
      },
    ];

    let vettingDoc = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .first();

    if (!vettingDoc) {
      const vettingResultId = await ctx.db.insert("vettingResults", {
        freelancerId: args.freelancerId,
        englishProficiency: syntheticEnglish,
        skillAssessments: syntheticSkills,
        overallScore: 85,
        status: "approved",
        currentStep: "complete",
        stepsCompleted: ["english", "skills"],
        reviewedBy: admin._id,
        reviewedAt: now,
        reviewNotes,
        fraudFlags: [],
        createdAt: now,
        updatedAt: now,
      });
      vettingDoc = await ctx.db.get(vettingResultId);
    } else {
      await ctx.db.patch(vettingDoc._id, {
        englishProficiency: syntheticEnglish,
        skillAssessments: syntheticSkills,
        overallScore: 85,
        status: "approved",
        currentStep: "complete",
        stepsCompleted: ["english", "skills"],
        reviewedBy: admin._id,
        reviewedAt: now,
        reviewNotes,
        fraudFlags: [],
        updatedAt: now,
      });
      vettingDoc = await ctx.db.get(vettingDoc._id);
    }

    if (!vettingDoc) {
      throw new Error("Failed to update verification record");
    }

    const userPatch: Record<string, unknown> = {
      verificationStatus: "approved",
      verificationCompletedAt: now,
      updatedAt: now,
    };
    if (args.approveKyc === true) {
      userPatch.kycStatus = "approved";
      userPatch.kycApprovedAt = now;
    }
    await ctx.db.patch(args.freelancerId, userPatch);

    await ctx.db.insert("auditLogs", {
      action: "admin_verification_override",
      actionType: "admin",
      actorId: admin._id,
      actorRole: admin.role,
      targetType: "vettingResult",
      targetId: vettingDoc._id,
      details: {
        freelancerId: args.freelancerId,
        reason: args.reason,
        approveKyc: args.approveKyc === true,
      },
      createdAt: now,
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [args.freelancerId],
      title: "Verification updated",
      message:
        args.approveKyc === true
          ? "Your verification and identity checks have been approved by the platform team. You can use the full freelancer experience."
          : "Your verification has been approved by the platform team. Complete any remaining identity (KYC) steps if prompted.",
      type: "verification",
      data: { vettingResultId: vettingDoc._id },
    });

    return { success: true };
  },
});

const GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes for auto-submit after time up

/**
 * Submit MCQ answers for a skill test session. Server scores using stored correct answers; client never sees correct answers.
 */
export const submitMcqAnswers = mutation({
  args: {
    sessionId: v.id("vettingSkillTestSessions"),
    answers: v.array(
      v.object({
        questionId: v.id("vettingMcqQuestions"),
        selectedOptionIndex: v.number(),
      })
    ),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user || user.role !== "freelancer") throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.freelancerId !== user._id) throw new Error("Unauthorized");
    if (
      session.expiresAt != null &&
      Date.now() > session.expiresAt + GRACE_PERIOD_MS
    ) {
      throw new Error("Time's up. This skill test has expired.");
    }

    const questionIds = session.mcqQuestionIds ?? [];
    if (questionIds.length === 0) throw new Error("No MCQ questions in session");

    let correct = 0;
    const answerMap = new Map(
      args.answers.map((a) => [a.questionId, a.selectedOptionIndex])
    );
    for (const qid of questionIds) {
      const doc = await ctx.db.get(qid);
      if (doc && answerMap.has(qid)) {
        if (answerMap.get(qid) === doc.correctOptionIndex) correct++;
      }
    }
    const mcqScore =
      questionIds.length > 0 ? Math.round((correct / questionIds.length) * 100) : 0;

    // Compute combined score for this session (used for pass/fail)
    const codingSubmissions = session.codingSubmissions ?? [];
    let combinedScore = mcqScore;
    if (session.pathType === "coding_mcq" && codingSubmissions.length > 0) {
      let codingTotal = 0,
        codingPassed = 0;
      for (const sub of codingSubmissions) {
        const r = sub.runResult as { passed?: number; total?: number } | undefined;
        if (r && typeof r.passed === "number" && typeof r.total === "number" && r.total > 0) {
          codingPassed += r.passed;
          codingTotal += r.total;
        }
      }
      const codingScore = codingTotal > 0 ? Math.round((codingPassed / codingTotal) * 100) : 0;
      combinedScore = Math.round((codingScore + mcqScore) / 2);
    } else if (session.pathType === "portfolio_mcq" && session.portfolioScore != null) {
      combinedScore = Math.round(session.portfolioScore * 0.3 + mcqScore * 0.7);
    }

    await ctx.db.patch(args.sessionId, {
      mcqAnswers: args.answers,
      mcqScore,
      status: "completed",
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Account removal after repeated failures is handled in completeVerification (retake flow).

    const vettingResult = await ctx.db.get(session.vettingResultId);
    if (vettingResult) {
      const newAssessment = {
        skillId: "skill_test_session",
        skillName: "Skill Test",
        assessmentType: "mcq" as const,
        score: combinedScore,
        completedAt: Date.now(),
        details: { mcqScore, pathType: session.pathType },
      };
      const stepsCompleted = vettingResult.stepsCompleted ?? [];
      const hasSkills = stepsCompleted.includes("skills");
      const prevMcq = vettingResult.usedMcqQuestionIds ?? [];
      const prevCoding = vettingResult.usedCodingPromptIds ?? [];
      const mergedMcq = Array.from(
        new Set([...prevMcq.map(String), ...(session.mcqQuestionIds ?? []).map(String)])
      ) as Id<"vettingMcqQuestions">[];
      const mergedCoding = Array.from(
        new Set([...prevCoding.map(String), ...(session.codingPromptIds ?? []).map(String)])
      ) as Id<"vettingCodingPrompts">[];
      await ctx.db.patch(session.vettingResultId, {
        skillAssessments: [newAssessment],
        usedMcqQuestionIds: mergedMcq,
        usedCodingPromptIds:
          mergedCoding.length > 0 ? mergedCoding : vettingResult.usedCodingPromptIds,
        ...(!hasSkills && {
          stepsCompleted: [...stepsCompleted, "skills"],
          currentStep: "complete",
        }),
        updatedAt: Date.now(),
      });
      if (!hasSkills && stepsCompleted.includes("english")) {
        await ctx.scheduler.runAfter(0, internalAny.vetting.internalMutations.runAutoCompleteVerification, {
          freelancerId: session.freelancerId,
        });
      }
    }

    return { mcqScore, correct, total: questionIds.length };
  },
});

/**
 * Set portfolio score and advance session to MCQ step (for portfolio_mcq path).
 */
export const setSessionPortfolioScore = mutation({
  args: {
    sessionId: v.id("vettingSkillTestSessions"),
    portfolioScore: v.number(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user || user.role !== "freelancer") throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.freelancerId !== user._id) throw new Error("Unauthorized");
    if (session.pathType !== "portfolio_mcq") throw new Error("Not a portfolio path");
    if (session.expiresAt != null && Date.now() > session.expiresAt) {
      throw new Error("Time's up. This skill test has expired.");
    }

    const score = Math.min(100, Math.max(0, args.portfolioScore));
    await ctx.db.patch(args.sessionId, {
      portfolioScore: score,
      status: "mcq",
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

/**
 * Internal: store an authoritative coding submission.
 *
 * Only ever called by the `submitCodingChallenge` ACTION, which re-runs the
 * submitted code server-side via Judge0 (it does NOT trust client-provided
 * results). The result includes per-test-case status/failureType used later for
 * AI coaching feedback. A prior submission for the same prompt is replaced so a
 * prompt is never double-counted.
 */
export const storeCodingSubmissionInternal = internalMutation({
  args: {
    sessionId: v.id("vettingSkillTestSessions"),
    promptId: v.id("vettingCodingPrompts"),
    code: v.string(),
    runResult: v.optional(v.any()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user || user.role !== "freelancer") throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.freelancerId !== user._id) throw new Error("Unauthorized");
    if (session.expiresAt != null && Date.now() > session.expiresAt) {
      throw new Error("Time's up. This skill test has expired.");
    }

    const promptIds = (session.codingPromptIds ?? []).map(String);
    if (!promptIds.includes(String(args.promptId))) {
      throw new Error("Prompt is not part of this session");
    }

    // Replace any prior submission for this prompt (dedupe) so combined scoring
    // counts each prompt once.
    const existing = (session.codingSubmissions ?? []).filter(
      (s) => String(s.promptId) !== String(args.promptId)
    );
    const updated = [
      ...existing,
      {
        promptId: args.promptId,
        code: args.code,
        submittedAt: Date.now(),
        runResult: args.runResult,
      },
    ];
    const allSubmitted =
      (session.codingPromptIds?.length ?? 0) > 0 &&
      updated.length >= (session.codingPromptIds?.length ?? 0);
    await ctx.db.patch(args.sessionId, {
      codingSubmissions: updated,
      status: allSubmitted ? "mcq" : session.status,
      updatedAt: Date.now(),
    });

    return { ok: true, nextStep: allSubmitted ? "mcq" : "coding" };
  },
});

/**
 * Internal: persist AI coaching feedback on the vetting result. Durable so it
 * survives the skillAssessments reset that happens on a first-attempt failure.
 */
export const saveCodingFeedbackInternal = internalMutation({
  args: {
    vettingResultId: v.id("vettingResults"),
    feedback: v.object({
      generatedAt: v.number(),
      attemptRound: v.number(),
      isFinal: v.boolean(),
      overallSummary: v.string(),
      challenges: v.array(
        v.object({
          title: v.string(),
          passedCases: v.number(),
          totalCases: v.number(),
          failureTypes: v.array(v.string()),
          coaching: v.string(),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.vettingResultId);
    if (!row) return { ok: false as const };
    await ctx.db.patch(args.vettingResultId, {
      codingFeedback: args.feedback,
      updatedAt: Date.now(),
    });
    return { ok: true as const };
  },
});

/**
 * Update English written response score (internal - called by actions)
 */
export const updateEnglishWrittenScore = mutation({
  args: {
    vettingResultId: v.id("vettingResults"),
    writtenResponseScore: v.number(),
  },
  handler: async (ctx, args) => {
    const vettingResult = await ctx.db.get(args.vettingResultId);
    if (!vettingResult) {
      throw new Error("Vetting result not found");
    }

    if (vettingResult.englishProficiency.overallScore != null) {
      return {
        success: true,
        overallScore: vettingResult.overallScore,
        skipped: true as const,
      };
    }

    const grammarScore = vettingResult.englishProficiency.grammarScore || 0;
    const comprehensionScore = vettingResult.englishProficiency.comprehensionScore || 0;
    const englishOverall =
      (grammarScore + comprehensionScore + args.writtenResponseScore) / 3;

    const now = Date.now();
    const stepsDone = (
      vettingResult.stepsCompleted.includes("english")
        ? vettingResult.stepsCompleted
        : [...vettingResult.stepsCompleted, "english" as const]
    ) as Doc<"vettingResults">["stepsCompleted"];
    const nextCurrentStep = stepsDone.includes("skills")
      ? vettingResult.currentStep ?? "complete"
      : "skills";

    await ctx.db.patch(args.vettingResultId, {
      englishProficiency: {
        ...vettingResult.englishProficiency,
        writtenResponseScore: args.writtenResponseScore,
        overallScore: Math.round(englishOverall * 100) / 100,
        completedAt: now,
      },
      stepsCompleted: stepsDone,
      currentStep: nextCurrentStep,
      updatedAt: now,
    });

    return {
      success: true,
      overallScore: Math.round(englishOverall * 100) / 100,
    };
  },
});

