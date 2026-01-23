import { mutation, MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { calculateOverallScore, checkFraudFlags } from "./engine";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";
import type { FunctionReference } from "convex/server";

const api = require("../_generated/api") as {
  api: {
    notifications: { actions: { sendSystemNotification: unknown } };
  };
};

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
 * Generate upload URL for identity documents
 */
export const generateIdentityUploadUrl = mutation({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    
    if (!user) {
      throw new Error("Not authenticated");
    }

    if (user.role !== "freelancer") {
      throw new Error("Only freelancers can upload verification documents");
    }

    const url = await ctx.storage.generateUploadUrl();
    return { url };
  },
});

/**
 * Submit identity verification documents
 */
export const submitIdentityVerification = mutation({
  args: {
    documentType: v.string(),
    documentNumber: v.string(),
    documentImageId: v.id("_storage"),
    selfieImageId: v.id("_storage"),
    provider: v.union(v.literal("smile_identity"), v.literal("dojah")),
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
      throw new Error("Only freelancers can submit verification");
    }

    const vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .first();

    if (!vettingResult) {
      throw new Error("Verification not initialized");
    }

    if (vettingResult.identityVerification.status === "verified") {
      throw new Error("Identity already verified");
    }

    // Update identity verification status
    await ctx.db.patch(vettingResult._id, {
      identityVerification: {
        ...vettingResult.identityVerification,
        provider: args.provider,
        status: "pending",
        documentType: args.documentType,
        documentNumber: args.documentNumber,
      },
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "identity_verification_submitted",
      actionType: "system",
      actorId: user._id,
      actorRole: user.role,
      targetType: "vettingResult",
      targetId: vettingResult._id,
      details: {
        provider: args.provider,
        documentType: args.documentType,
        browserFingerprint: args.browserFingerprint,
        ipAddress: args.ipAddress,
      },
      createdAt: Date.now(),
    });

    // Trigger identity verification action
    const processIdentity = (api as any).vetting.actions.processIdentityVerification;
    await ctx.scheduler.runAfter(0, processIdentity, {
      vettingResultId: vettingResult._id,
      documentImageId: args.documentImageId,
      selfieImageId: args.selfieImageId,
      documentType: args.documentType,
      documentNumber: args.documentNumber,
      provider: args.provider,
    });

    return { 
      success: true, 
      message: "Identity verification submitted. Processing...",
      vettingResultId: vettingResult._id,
    };
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

    // Calculate overall English score (weighted: grammar 40%, comprehension 40%, written 20%)
    // Written response will be graded by AI action
    const overallScore =
      args.grammarScore * 0.4 + args.comprehensionScore * 0.4;

    // Update English proficiency
    await ctx.db.patch(vettingResult._id, {
      englishProficiency: {
        grammarScore: args.grammarScore,
        comprehensionScore: args.comprehensionScore,
        overallScore,
        completedAt: Date.now(),
        testSessionId: args.testSessionId,
        timeSpent: args.timeSpent,
        attempts:
          (vettingResult.englishProficiency.attempts || 0) + 1,
        suspiciousActivity,
        browserFingerprint: args.browserFingerprint,
        ipAddress: args.ipAddress,
      },
      updatedAt: Date.now(),
    });

    // Update steps completed
    if (!vettingResult.stepsCompleted.includes("english")) {
      await ctx.db.patch(vettingResult._id, {
        stepsCompleted: [...vettingResult.stepsCompleted, "english"],
        currentStep: "skills",
      });
    }

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
    if (skillsCompleted && !vettingResult.stepsCompleted.includes("skills")) {
      await ctx.db.patch(vettingResult._id, {
        stepsCompleted: [...vettingResult.stepsCompleted, "skills"],
        currentStep: "complete",
      });
    }

    // Recalculate overall score
    const overallScore = calculateOverallScore({
      identityScore: vettingResult.identityVerification.score || 0,
      englishScore: vettingResult.englishProficiency.overallScore || 0,
      skillScores: updatedAssessments.map((a) => a.score),
    });

    await ctx.db.patch(vettingResult._id, {
      overallScore,
    });

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

    const vettingResult = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .first();

    if (!vettingResult) {
      throw new Error("Verification not initialized");
    }

    // Check all steps are completed
    const requiredSteps = ["identity", "english", "skills"];
    const allStepsCompleted = requiredSteps.every((step) =>
      vettingResult.stepsCompleted.includes(step as any)
    );

    if (!allStepsCompleted) {
      throw new Error("Not all verification steps are completed");
    }

    // Check identity is verified
    if (vettingResult.identityVerification.status !== "verified") {
      throw new Error("Identity verification not completed");
    }

    // Check English proficiency is completed
    if (!vettingResult.englishProficiency.overallScore) {
      throw new Error("English proficiency test not completed");
    }

    // Check at least one skill is assessed
    if (vettingResult.skillAssessments.length === 0) {
      throw new Error("At least one skill assessment is required");
    }

    // Recalculate overall score
    const overallScore = calculateOverallScore({
      identityScore: vettingResult.identityVerification.score || 0,
      englishScore: vettingResult.englishProficiency.overallScore || 0,
      skillScores: vettingResult.skillAssessments.map((a) => a.score),
    });

    // Determine status based on score and fraud flags
    let status: "approved" | "flagged" | "rejected" = "approved";
    
    if (vettingResult.fraudFlags && vettingResult.fraudFlags.length > 0) {
      const criticalFlags = vettingResult.fraudFlags.filter(
        (f) => f.severity === "critical" || f.severity === "high"
      );
      if (criticalFlags.length > 0) {
        status = "rejected";
      } else {
        status = "flagged";
      }
    } else if (overallScore < 70) {
      // Minimum threshold
      status = "flagged";
    }

    // Update vetting result
    await ctx.db.patch(vettingResult._id, {
      overallScore,
      status,
      currentStep: "complete",
      updatedAt: Date.now(),
    });

    // Update user verification status
    // Map vetting result status to user verification status
    // Note: "flagged" from vettingResults maps to "pending_review" for users
    let userVerificationStatus: "not_started" | "in_progress" | "pending_review" | "approved" | "rejected" | "suspended" | undefined;
    
    if (status === "approved") {
      userVerificationStatus = "pending_review"; // Needs admin review before final approval
    } else if (status === "rejected") {
      userVerificationStatus = "rejected";
    } else if (status === "flagged") {
      userVerificationStatus = "pending_review"; // Flagged cases need review
    } else {
      userVerificationStatus = "in_progress"; // pending or in_progress from vetting
    }

    await ctx.db.patch(user._id, {
      verificationStatus: userVerificationStatus,
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "verification_completed",
      actionType: "system",
      actorId: user._id,
      actorRole: user.role,
      targetType: "vettingResult",
      targetId: vettingResult._id,
      details: {
        overallScore,
        status,
        stepsCompleted: vettingResult.stepsCompleted,
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
      title: "Verification submitted",
      message:
        status === "approved"
          ? "Verification completed and pending admin review."
          : status === "flagged"
          ? "Verification completed and pending review."
          : "Verification was rejected due to fraud flags.",
      type: "verification",
      data: { vettingResultId: vettingResult._id },
    });

    return {
      success: true,
      status,
      overallScore,
      message:
        status === "approved"
          ? "Verification completed. Awaiting admin review."
          : status === "flagged"
          ? "Verification completed but flagged for review."
          : "Verification rejected due to fraud flags.",
    };
  },
});

/**
 * Admin/Moderator: Approve verification
 */
export const approveVerification = mutation({
  args: {
    freelancerId: v.id("users"),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated");
    }

    const admin = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!admin || (admin.role !== "admin" && admin.role !== "moderator")) {
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

    if (!vettingResult) {
      throw new Error("Verification not found");
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
 * Admin/Moderator: Reject verification
 */
export const rejectVerification = mutation({
  args: {
    freelancerId: v.id("users"),
    reviewNotes: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated");
    }

    const admin = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!admin || (admin.role !== "admin" && admin.role !== "moderator")) {
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
 * Update identity verification status (internal - called by actions)
 */
export const updateIdentityVerification = mutation({
  args: {
    vettingResultId: v.id("vettingResults"),
    status: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("failed"),
      v.literal("rejected")
    ),
    score: v.optional(v.number()),
    livenessCheck: v.optional(v.boolean()),
    verifiedAt: v.optional(v.number()),
    provider: v.optional(v.union(v.literal("smile_identity"), v.literal("dojah"))),
  },
  handler: async (ctx, args) => {
    const vettingResult = await ctx.db.get(args.vettingResultId);
    if (!vettingResult) {
      throw new Error("Vetting result not found");
    }

    await ctx.db.patch(args.vettingResultId, {
      identityVerification: {
        ...vettingResult.identityVerification,
        status: args.status,
        score: args.score,
        livenessCheck: args.livenessCheck,
        verifiedAt: args.verifiedAt,
        provider: args.provider || vettingResult.identityVerification.provider,
      },
      updatedAt: Date.now(),
    });

    // Update steps completed if verified
    if (args.status === "verified" && !vettingResult.stepsCompleted.includes("identity")) {
      await ctx.db.patch(args.vettingResultId, {
        stepsCompleted: [...vettingResult.stepsCompleted, "identity"],
        currentStep: "english",
      });
    }

    return { success: true };
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

    // Recalculate overall English score
    const grammarScore = vettingResult.englishProficiency.grammarScore || 0;
    const comprehensionScore = vettingResult.englishProficiency.comprehensionScore || 0;
    const overallScore =
      grammarScore * 0.4 + comprehensionScore * 0.4 + args.writtenResponseScore * 0.2;

    await ctx.db.patch(args.vettingResultId, {
      englishProficiency: {
        ...vettingResult.englishProficiency,
        writtenResponseScore: args.writtenResponseScore,
        overallScore,
      },
      updatedAt: Date.now(),
    });

    // Recalculate overall verification score
    const identityScore = vettingResult.identityVerification.score || 0;
    const skillScores = vettingResult.skillAssessments.map((a) => a.score);
    const newOverallScore = calculateOverallScore({
      identityScore,
      englishScore: overallScore,
      skillScores,
    });

    await ctx.db.patch(args.vettingResultId, {
      overallScore: newOverallScore,
    });

    return { success: true, overallScore: newOverallScore };
  },
});

