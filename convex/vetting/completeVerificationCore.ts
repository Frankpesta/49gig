import { MutationCtx } from "../_generated/server";
import { calculateOverallScore } from "./engine";
import {
  averageSkillScore,
  englishCompositeFromVetting,
  weightedVerificationOverall,
  MIN_PERCENT_TO_PASS,
  RETAKE_COOLDOWN_MS,
  WEIGHTED_FAILURE_COUNTDOWN_MS,
} from "./scoring";
import { Doc, Id } from "../_generated/dataModel";
import type { FunctionReference } from "convex/server";
const internalAny = require("../_generated/api").internal as any;

const api = require("../_generated/api") as {
  api: {
    notifications: { actions: { sendSystemNotification: unknown } };
  };
};

type FraudFlag = NonNullable<Doc<"vettingResults">["fraudFlags"]>[number];

export type CompleteVerificationResult = {
  success: boolean;
  accountDeleted: boolean;
  message?: string;
  status: string;
  alreadyComplete?: boolean;
  overallScore?: number;
  weightedFailurePending?: true;
  countdownSeconds?: number;
  englishScore?: number;
  avgSkillScore?: number;
};

/**
 * End-to-end evaluation after English + skills are done (and scored).
 * Used by the public "complete verification" action and the automatic post–skill-test run.
 */
export async function runCompleteVerificationForFreelancer(
  ctx: MutationCtx,
  freelancerId: Id<"users">,
): Promise<CompleteVerificationResult> {
  const freelancer = await ctx.db.get(freelancerId);
  if (!freelancer || freelancer.role !== "freelancer") {
    throw new Error("Not authenticated or not a freelancer");
  }
  const fr = freelancer;

  const vettingResult = await ctx.db
    .query("vettingResults")
    .withIndex("by_freelancer", (q) => q.eq("freelancerId", freelancerId))
    .first();

  if (!vettingResult) {
    throw new Error("Verification not initialized");
  }
  const vettingRow = vettingResult;
  const evaluatedAt = Date.now();

  if (
    vettingRow.status === "pending_admin" ||
    vettingRow.status === "approved" ||
    vettingRow.status === "flagged"
  ) {
    return {
      success: true,
      accountDeleted: false,
      alreadyComplete: true,
      message: "Already processed",
      status: vettingRow.status,
      overallScore: vettingRow.overallScore,
    };
  }

  const requiredSteps = ["english", "skills"] as const;
  const allStepsCompleted = requiredSteps.every((step) =>
    vettingRow.stepsCompleted.includes(step),
  );

  if (!allStepsCompleted) {
    throw new Error("Not all verification steps are completed");
  }

  await ctx.db.patch(vettingRow._id, {
    autoFinalizeError: undefined,
    updatedAt: Date.now(),
  });

  const englishComposite = englishCompositeFromVetting(vettingRow.englishProficiency);
  if (englishComposite == null) {
    throw new Error("Finish the English test (including the written section) before submitting.");
  }

  if (vettingRow.skillAssessments.length === 0) {
    throw new Error("At least one skill assessment is required");
  }

  const avgSkillScore = averageSkillScore(vettingRow);
  const MIN_PERCENT = MIN_PERCENT_TO_PASS;
  const englishFailed = englishComposite < MIN_PERCENT;
  const skillsFailed = avgSkillScore < MIN_PERCENT;

  const engRound = vettingRow.englishAttemptRound ?? 0;
  const skRound = vettingRow.skillsAttemptRound ?? 0;

  async function hardFailVerification(reason: string) {
    await ctx.runMutation(
      internalAny.vetting.internalMutations.terminateFreelancerVerificationFailure,
      {
        freelancerId: fr._id,
        vettingResultId: vettingRow._id,
        reason,
      },
    );
  }

  if (englishFailed) {
    if (engRound >= 1) {
      await hardFailVerification("english_below_minimum_after_retake");
      return {
        success: false,
        accountDeleted: true,
        status: "rejected",
        message:
          "We're unable to proceed after two English attempts. We've sent you an email with more information.",
      };
    }
    const overallScore =
      weightedVerificationOverall(vettingRow) ??
      calculateOverallScore({
        englishScore: englishComposite,
        skillScores: vettingRow.skillAssessments.map((a) => a.score),
      });
    const newStepsCompleted = vettingRow.stepsCompleted.filter((s) => s !== "english");
    const englishCooldownUntil = Date.now() + RETAKE_COOLDOWN_MS;
    await ctx.db.patch(vettingRow._id, {
      overallScore,
      status: "pending",
      currentStep: "english",
      stepsCompleted: newStepsCompleted,
      englishAttemptRound: 1,
      englishFailedAttempts: (vettingRow.englishFailedAttempts ?? 0) + 1,
      englishRetakeAvailableAt: englishCooldownUntil,
      verificationEvaluatedAt: evaluatedAt,
      englishProficiency: {
        ...vettingRow.englishProficiency,
        grammarScore: undefined,
        comprehensionScore: undefined,
        writtenResponse: undefined,
        writtenResponseScore: undefined,
        overallScore: undefined,
        completedAt: undefined,
        testSessionId: undefined,
      },
      updatedAt: Date.now(),
    });
    await ctx.db.patch(fr._id, {
      verificationStatus: "in_progress",
      updatedAt: Date.now(),
    });
    await ctx.db.insert("auditLogs", {
      action: "verification_failed_minimum_scores",
      actionType: "system",
      actorId: fr._id,
      actorRole: fr.role,
      targetType: "vettingResult",
      targetId: vettingRow._id,
      details: {
        englishComposite,
        avgSkillScore,
        minRequired: MIN_PERCENT,
        dimension: "english",
        retakeOffered: true,
      },
      createdAt: Date.now(),
    });
    return {
      success: false,
      accountDeleted: false,
      status: "rejected",
      englishScore: Math.round(englishComposite),
      avgSkillScore: Math.round(avgSkillScore),
      message: `You scored below ${MIN_PERCENT}% on the English assessment (average of grammar, comprehension, and writing). You failed the first try — tap Retake below to try once more. If you score below ${MIN_PERCENT}% again, your application will be closed.`,
    };
  }

  if (skillsFailed) {
    if (skRound >= 1) {
      await hardFailVerification("skills_below_minimum_after_retake");
      return {
        success: false,
        accountDeleted: true,
        status: "rejected",
        message:
          "We're unable to proceed after two skill assessment attempts. We've sent you an email with more information.",
      };
    }
    const overallScore =
      weightedVerificationOverall(vettingRow) ??
      calculateOverallScore({
        englishScore: englishComposite,
        skillScores: vettingRow.skillAssessments.map((a) => a.score),
      });
    const newStepsCompleted = vettingRow.stepsCompleted.filter((s) => s !== "skills");
    const skillsCooldownUntil = Date.now() + RETAKE_COOLDOWN_MS;
    await ctx.db.patch(vettingRow._id, {
      overallScore,
      status: "pending",
      currentStep: "skills",
      stepsCompleted: newStepsCompleted,
      skillsAttemptRound: 1,
      skillsFailedAttempts: (vettingRow.skillsFailedAttempts ?? 0) + 1,
      skillsRetakeAvailableAt: skillsCooldownUntil,
      skillAssessments: [],
      verificationEvaluatedAt: evaluatedAt,
      updatedAt: Date.now(),
    });
    await ctx.db.patch(fr._id, {
      verificationStatus: "in_progress",
      updatedAt: Date.now(),
    });
    await ctx.db.insert("auditLogs", {
      action: "verification_failed_minimum_scores",
      actionType: "system",
      actorId: fr._id,
      actorRole: fr.role,
      targetType: "vettingResult",
      targetId: vettingRow._id,
      details: {
        englishComposite,
        avgSkillScore,
        minRequired: MIN_PERCENT,
        dimension: "skills",
        retakeOffered: true,
      },
      createdAt: Date.now(),
    });
    return {
      success: false,
      accountDeleted: false,
      status: "rejected",
      englishScore: Math.round(englishComposite),
      avgSkillScore: Math.round(avgSkillScore),
      message: `You scored below ${MIN_PERCENT}% on the skills assessment (average across your skill tests). You failed the first try — start the skill test again for one more attempt. If you score below ${MIN_PERCENT}% again, your application will be closed.`,
    };
  }

  const overallScore =
    weightedVerificationOverall(vettingRow) ??
    calculateOverallScore({
      englishScore: englishComposite,
      skillScores: vettingRow.skillAssessments.map((a) => a.score),
    });

  if (overallScore < MIN_PERCENT) {
    const encouragingMessage =
      `Unfortunately you did not meet our minimum weighted score (${MIN_PERCENT}% across English and skills) after completing every attempt. You cannot join 49GIG as a freelancer at this time. Keep practicing your craft — when you're ready, you're welcome to try again in the future.`;

    if (vettingRow.weightedTerminationJobScheduled && vettingRow.weightedFailureScheduledFor != null) {
      const remainingMs = vettingRow.weightedFailureScheduledFor - Date.now();
      return {
        success: false,
        weightedFailurePending: true,
        countdownSeconds: Math.max(0, Math.ceil(remainingMs / 1000)),
        overallScore,
        accountDeleted: false,
        status: "rejected",
        message: encouragingMessage,
      };
    }

    const deadline = Date.now() + WEIGHTED_FAILURE_COUNTDOWN_MS;
    await ctx.db.patch(vettingRow._id, {
      overallScore,
      verificationEvaluatedAt: evaluatedAt,
      weightedTerminationJobScheduled: true,
      weightedFailureScheduledFor: deadline,
      updatedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(
      WEIGHTED_FAILURE_COUNTDOWN_MS,
      internalAny.vetting.internalMutations.terminateFreelancerVerificationFailure,
      {
        freelancerId: fr._id,
        vettingResultId: vettingRow._id,
        reason: "weighted_below_minimum_final",
      },
    );

    await ctx.db.insert("auditLogs", {
      action: "verification_weighted_below_minimum_scheduled_removal",
      actionType: "system",
      actorId: fr._id,
      actorRole: fr.role,
      targetType: "vettingResult",
      targetId: vettingRow._id,
      details: { overallScore, minRequired: MIN_PERCENT, removalScheduledFor: deadline },
      createdAt: Date.now(),
    });

    return {
      success: false,
      weightedFailurePending: true,
      countdownSeconds: Math.ceil(WEIGHTED_FAILURE_COUNTDOWN_MS / 1000),
      overallScore,
      accountDeleted: false,
      status: "rejected",
      message: encouragingMessage,
    };
  }

  const proc = vettingRow.proctoringSummary;
  if (!proc?.englishProctoringReadyAt || !proc?.skillsProctoringReadyAt) {
    throw new Error(
      "Enable your webcam for both the English and skill assessments before submitting. Open each section, allow camera access, then submit again.",
    );
  }

  const now = Date.now();
  const proctoringFlags: FraudFlag[] = [];
  const hiddenMs = proc.visibilityHiddenMsTotal ?? 0;
  if (hiddenMs > 5 * 60 * 1000) {
    proctoringFlags.push({
      flagType: "proctoring_hidden_long",
      severity: "medium",
      description: `Test window was hidden or in background for ${Math.round(hiddenMs / 60000)}+ minutes total (browser-reported).`,
      detectedAt: now,
      resolved: false,
    });
  }
  if ((proc.pasteAttempts ?? 0) > 8) {
    proctoringFlags.push({
      flagType: "proctoring_excessive_paste",
      severity: "medium",
      description: `Elevated paste activity during tests (${proc.pasteAttempts} events).`,
      detectedAt: now,
      resolved: false,
    });
  }
  if ((proc.cameraOffSegments ?? 0) >= 3) {
    proctoringFlags.push({
      flagType: "proctoring_camera_interruptions",
      severity: "high",
      description: `Webcam stream was interrupted ${proc.cameraOffSegments} times during assessments.`,
      detectedAt: now,
      resolved: false,
    });
  }

  const existingFlags = [...(vettingRow.fraudFlags ?? [])];
  const allFlags = [...existingFlags, ...proctoringFlags];

  const criticalOrHigh = allFlags.filter(
    (f) => f.severity === "critical" || f.severity === "high",
  );

  let vettingStatus: "pending_admin" | "rejected";
  let userVerificationStatus: "pending_review" | "rejected";

  if (criticalOrHigh.length > 0) {
    vettingStatus = "rejected";
    userVerificationStatus = "rejected";
  } else {
    vettingStatus = "pending_admin";
    userVerificationStatus = "pending_review";
  }

  await ctx.db.patch(vettingRow._id, {
    overallScore,
    verificationEvaluatedAt: evaluatedAt,
    fraudFlags: allFlags.length > 0 ? allFlags : undefined,
    status: vettingStatus,
    currentStep: "complete",
    updatedAt: now,
  });

  await ctx.db.patch(fr._id, {
    verificationStatus: userVerificationStatus,
    updatedAt: now,
  });

  await ctx.db.insert("auditLogs", {
    action: "verification_completed",
    actionType: "system",
    actorId: fr._id,
    actorRole: fr.role,
    targetType: "vettingResult",
    targetId: vettingRow._id,
    details: {
      overallScore,
      vettingStatus,
      stepsCompleted: vettingRow.stepsCompleted,
    },
    createdAt: now,
  });

  const sendSystemNotification = api.api.notifications.actions
    .sendSystemNotification as unknown as FunctionReference<"action", "internal">;
  await ctx.scheduler.runAfter(0, sendSystemNotification, {
    userIds: [fr._id],
    title:
      vettingStatus === "rejected" ? "Verification not approved" : "Verification submitted",
    message:
      vettingStatus === "rejected"
        ? "Your verification could not be approved due to integrity checks."
        : "Your tests are submitted. Complete KYC if you haven't yet, then wait for admin approval.",
    type: "verification",
    data: { vettingResultId: vettingRow._id },
  });

  return {
    success: vettingStatus !== "rejected",
    accountDeleted: false,
    status: vettingStatus,
    overallScore,
    message:
      vettingStatus === "rejected"
        ? "Verification was rejected due to integrity checks. Contact support if you need help."
        : "Submitted. Upload KYC if needed, then an admin will approve your account.",
  };
}
