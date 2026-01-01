/**
 * Verification Engine
 * 
 * This module contains the core logic for:
 * - Calculating overall verification scores
 * - Detecting fraud and suspicious activity
 * - Auto-approve/reject logic
 */

import type { Doc } from "../_generated/dataModel";

export interface ScoreInputs {
  identityScore: number;
  englishScore: number;
  skillScores: number[];
}

/**
 * Calculate overall verification score
 * Weighted: Identity 20%, English 30%, Skills 50%
 */
export function calculateOverallScore(inputs: ScoreInputs): number {
  const { identityScore, englishScore, skillScores } = inputs;

  // Calculate average skill score
  const avgSkillScore =
    skillScores.length > 0
      ? skillScores.reduce((sum, score) => sum + score, 0) / skillScores.length
      : 0;

  // Weighted calculation
  const overallScore =
    identityScore * 0.2 + englishScore * 0.3 + avgSkillScore * 0.5;

  return Math.round(overallScore * 100) / 100; // Round to 2 decimal places
}

/**
 * Check for fraud flags based on suspicious activity
 */
export function checkFraudFlags(
  vettingResult: Doc<"vettingResults">,
  context: {
    suspiciousActivity?: string[];
    ipAddress?: string;
    browserFingerprint?: string;
  }
): Array<{
  flagType: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  detectedAt: number;
  resolved: boolean;
}> {
  const flags: Array<{
    flagType: string;
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    detectedAt: number;
    resolved: boolean;
  }> = [];

  const now = Date.now();

  // Check for multiple IP addresses
  const ipAddresses = new Set<string>();
  if (vettingResult.englishProficiency.ipAddress) {
    ipAddresses.add(vettingResult.englishProficiency.ipAddress);
  }
  vettingResult.skillAssessments.forEach((assessment) => {
    if (assessment.ipAddress) {
      ipAddresses.add(assessment.ipAddress);
    }
  });
  if (context.ipAddress) {
    ipAddresses.add(context.ipAddress);
  }

  if (ipAddresses.size > 3) {
    flags.push({
      flagType: "multiple_ips",
      severity: "high",
      description: `Verification completed from ${ipAddresses.size} different IP addresses`,
      detectedAt: now,
      resolved: false,
    });
  }

  // Check for multiple browser fingerprints
  const fingerprints = new Set<string>();
  if (vettingResult.englishProficiency.browserFingerprint) {
    fingerprints.add(vettingResult.englishProficiency.browserFingerprint);
  }
  vettingResult.skillAssessments.forEach((assessment) => {
    if (assessment.browserFingerprint) {
      fingerprints.add(assessment.browserFingerprint);
    }
  });
  if (context.browserFingerprint) {
    fingerprints.add(context.browserFingerprint);
  }

  if (fingerprints.size > 2) {
    flags.push({
      flagType: "multiple_browsers",
      severity: "medium",
      description: `Verification completed from ${fingerprints.size} different browsers`,
      detectedAt: now,
      resolved: false,
    });
  }

  // Check for suspicious activity in English test
  if (vettingResult.englishProficiency.suspiciousActivity) {
    const suspiciousCount = vettingResult.englishProficiency.suspiciousActivity.length;
    if (suspiciousCount > 0) {
      flags.push({
        flagType: "english_test_suspicious",
        severity: suspiciousCount > 2 ? "high" : "medium",
        description: `English test flagged ${suspiciousCount} suspicious activities: ${vettingResult.englishProficiency.suspiciousActivity.join(", ")}`,
        detectedAt: now,
        resolved: false,
      });
    }
  }

  // Check for suspicious activity in skill assessments
  const skillSuspiciousCount = vettingResult.skillAssessments.reduce(
    (count, assessment) =>
      count + (assessment.suspiciousActivity?.length || 0),
    0
  );

  if (skillSuspiciousCount > 0) {
    flags.push({
      flagType: "skill_assessment_suspicious",
      severity: skillSuspiciousCount > 3 ? "high" : "medium",
      description: `Skill assessments flagged ${skillSuspiciousCount} suspicious activities`,
      detectedAt: now,
      resolved: false,
    });
  }

  // Check for too many retakes
  const retakeCount = vettingResult.skillAssessments.filter((assessment) =>
    assessment.suspiciousActivity?.includes("skill_retake_detected")
  ).length;

  if (retakeCount > 2) {
    flags.push({
      flagType: "excessive_retakes",
      severity: "high",
      description: `Multiple skill assessments were retaken (${retakeCount} retakes detected)`,
      detectedAt: now,
      resolved: false,
    });
  }

  // Check for timing anomalies
  const englishTime = vettingResult.englishProficiency.timeSpent || 0;
  const expectedEnglishTime = 1800; // 30 minutes
  if (englishTime < expectedEnglishTime * 0.2) {
    flags.push({
      flagType: "timing_anomaly_english",
      severity: "critical",
      description: `English test completed in ${Math.round(englishTime / 60)} minutes (expected ~30 minutes)`,
      detectedAt: now,
      resolved: false,
    });
  }

  // Check for plagiarism indicators (if written response is too similar to known patterns)
  // This would be enhanced with actual plagiarism detection
  if (context.suspiciousActivity?.includes("plagiarism_detected")) {
    flags.push({
      flagType: "plagiarism",
      severity: "critical",
      description: "Plagiarism detected in written response",
      detectedAt: now,
      resolved: false,
    });
  }

  return flags;
}

/**
 * Auto-approve/reject logic based on scores and flags
 */
export function determineVerificationStatus(
  overallScore: number,
  fraudFlags: Doc<"vettingResults">["fraudFlags"]
): "approved" | "flagged" | "rejected" {
  // Critical or high severity flags = automatic rejection
  if (fraudFlags && fraudFlags.length > 0) {
    const criticalFlags = fraudFlags.filter(
      (f) => f.severity === "critical" || f.severity === "high"
    );
    if (criticalFlags.length > 0) {
      return "rejected";
    }
  }

  // Score thresholds
  if (overallScore >= 85 && (!fraudFlags || fraudFlags.length === 0)) {
    return "approved"; // Auto-approve high scores with no flags
  }

  if (overallScore < 60) {
    return "rejected"; // Auto-reject low scores
  }

  if (overallScore >= 70 && overallScore < 85) {
    return "flagged"; // Flag for manual review
  }

  // Default to flagged for review
  return "flagged";
}

/**
 * Validate verification completeness
 */
export function isVerificationComplete(
  vettingResult: Doc<"vettingResults">
): {
  complete: boolean;
  missingSteps: string[];
} {
  const requiredSteps = ["identity", "english", "skills"];
  const completedSteps = vettingResult.stepsCompleted || [];

  const missingSteps = requiredSteps.filter(
    (step) => !completedSteps.includes(step as any)
  );

  // Check identity is verified
  if (vettingResult.identityVerification.status !== "verified") {
    missingSteps.push("identity_verification");
  }

  // Check English is completed
  if (!vettingResult.englishProficiency.overallScore) {
    missingSteps.push("english_proficiency");
  }

  // Check at least one skill is assessed
  if (vettingResult.skillAssessments.length === 0) {
    missingSteps.push("skill_assessments");
  }

  return {
    complete: missingSteps.length === 0,
    missingSteps,
  };
}

