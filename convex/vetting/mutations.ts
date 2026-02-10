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

    // Check all steps are completed (English + Skills only)
    const requiredSteps = ["english", "skills"];
    const allStepsCompleted = requiredSteps.every((step) =>
      vettingResult.stepsCompleted.includes(step as any)
    );

    if (!allStepsCompleted) {
      throw new Error("Not all verification steps are completed");
    }

    // Check English proficiency is completed
    if (!vettingResult.englishProficiency.overallScore) {
      throw new Error("English proficiency test not completed");
    }

    // Check at least one skill is assessed
    if (vettingResult.skillAssessments.length === 0) {
      throw new Error("At least one skill assessment is required");
    }

    const englishScore = vettingResult.englishProficiency.overallScore;
    const avgSkillScore =
      vettingResult.skillAssessments.length > 0
        ? vettingResult.skillAssessments.reduce((s, a) => s + a.score, 0) /
          vettingResult.skillAssessments.length
        : 0;

    // Minimum 50% required in BOTH English and Skills; otherwise reject (do NOT delete account — user can retake)
    const MIN_PERCENT = 50;
    const englishFailed = englishScore < MIN_PERCENT;
    const skillsFailed = avgSkillScore < MIN_PERCENT;
    if (englishFailed || skillsFailed) {
      const overallScore = calculateOverallScore({
        englishScore,
        skillScores: vettingResult.skillAssessments.map((a) => a.score),
      });

      // Allow retake: remove failed step(s) from stepsCompleted and set currentStep to first failed
      const newStepsCompleted = vettingResult.stepsCompleted.filter(
        (s) => (s === "english" && !englishFailed) || (s === "skills" && !skillsFailed)
      );
      const retakeStep = englishFailed ? "english" : "skills";

      await ctx.db.patch(vettingResult._id, {
        overallScore,
        status: "rejected",
        currentStep: retakeStep,
        stepsCompleted: newStepsCompleted,
        updatedAt: Date.now(),
      });

      await ctx.db.insert("auditLogs", {
        action: "verification_failed_minimum_scores",
        actionType: "system",
        actorId: user._id,
        actorRole: user.role,
        targetType: "vettingResult",
        targetId: vettingResult._id,
        details: { englishScore, avgSkillScore, minRequired: MIN_PERCENT },
        createdAt: Date.now(),
      });

      const failedParts: string[] = [];
      if (englishFailed) failedParts.push("English");
      if (skillsFailed) failedParts.push("Skills");

      return {
        success: false,
        accountDeleted: false,
        status: "rejected" as const,
        englishScore: Math.round(englishScore),
        avgSkillScore: Math.round(avgSkillScore),
        message: `You need at least ${MIN_PERCENT}% in both English and Skills. Your scores: English ${Math.round(englishScore)}%, Skills average ${Math.round(avgSkillScore)}%. Please retake the ${failedParts.join(" and ")} section(s) to continue.`,
      };
    }

    // Recalculate overall score (English 30%, Skills 70%)
    const overallScore = calculateOverallScore({
      englishScore,
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
      status = "flagged";
    }

    // Update vetting result
    await ctx.db.patch(vettingResult._id, {
      overallScore,
      status,
      currentStep: "complete",
      updatedAt: Date.now(),
    });

    // Auto-approve when they pass; only pending_review for flagged cases
    let userVerificationStatus: "not_started" | "in_progress" | "pending_review" | "approved" | "rejected" | "suspended" | undefined;

    if (status === "approved") {
      userVerificationStatus = "approved"; // Automatic — no admin review needed
    } else if (status === "rejected") {
      userVerificationStatus = "rejected";
    } else if (status === "flagged") {
      userVerificationStatus = "pending_review";
    } else {
      userVerificationStatus = "in_progress";
    }

    await ctx.db.patch(user._id, {
      verificationStatus: userVerificationStatus,
      ...(userVerificationStatus === "approved" && { verificationCompletedAt: Date.now() }),
      updatedAt: Date.now(),
    });

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
      title: status === "approved" ? "Verification approved" : "Verification submitted",
      message:
        status === "approved"
          ? "Your verification has been approved. Welcome aboard!"
          : status === "flagged"
          ? "Verification completed and pending review."
          : "Verification was rejected due to fraud flags.",
      type: "verification",
      data: { vettingResultId: vettingResult._id },
    });

    return {
      success: true,
      accountDeleted: false,
      status,
      overallScore,
      message:
        status === "approved"
          ? "Verification approved. You can now access the full platform."
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
    if (session.expiresAt != null && Date.now() > session.expiresAt) {
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

    await ctx.db.patch(args.sessionId, {
      mcqAnswers: args.answers,
      mcqScore,
      status: "completed",
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Push aggregate skill assessment to vetting result so completeVerification can use it
    const vettingResult = await ctx.db.get(session.vettingResultId);
    if (vettingResult) {
      const codingSubmissions = session.codingSubmissions ?? [];
      let combinedScore = mcqScore;
      if (session.pathType === "coding_mcq" && codingSubmissions.length > 0) {
        let codingTotal = 0;
        let codingPassed = 0;
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
      await ctx.db.patch(session.vettingResultId, {
        skillAssessments: [...(vettingResult.skillAssessments || []), newAssessment],
        ...(!hasSkills && {
          stepsCompleted: [...stepsCompleted, "skills"],
          currentStep: "complete",
        }),
        updatedAt: Date.now(),
      });
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
 * Submit one coding submission for a session. Runs code via Judge0 (action) and stores result.
 * Client should call the executeCodingChallenge action first to get runResult, then pass it here; or we can call the action from a mutation - we cannot. So the flow is: client runs action executeCodingChallenge with code + test cases, gets result, then calls this mutation with sessionId, promptId, code, runResult.
 */
export const submitCodingSubmission = mutation({
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

    const existing = session.codingSubmissions ?? [];
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
    const skillScores = vettingResult.skillAssessments.map((a) => a.score);
    const newOverallScore = calculateOverallScore({
      englishScore: overallScore,
      skillScores,
    });

    await ctx.db.patch(args.vettingResultId, {
      overallScore: newOverallScore,
    });

    return { success: true, overallScore: newOverallScore };
  },
});

