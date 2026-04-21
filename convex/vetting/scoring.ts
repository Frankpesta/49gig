import type { Doc } from "../_generated/dataModel";
import { calculateOverallScore } from "./engine";

/**
 * Single source of truth for the pass threshold applied by
 * `completeVerification` to both the English composite and the average skill
 * score. UI copy and backend logic must import this — do NOT hardcode 50.
 */
export const MIN_PERCENT_TO_PASS = 50;

/**
 * Cooldown applied after a first-attempt failure before the retake can be
 * submitted. Enforced server-side in `submitEnglishProficiency` and
 * `startSkillTest`; surfaced to the client by `getVerificationStatus`.
 */
export const RETAKE_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

/** English composite: simple average of grammar, comprehension, written (each 0–100). */
export function englishCompositeFromVetting(
  english: Doc<"vettingResults">["englishProficiency"]
): number | null {
  const g = english.grammarScore;
  const c = english.comprehensionScore;
  const w = english.writtenResponseScore;
  if (g == null || c == null || w == null) return null;
  return Math.round(((g + c + w) / 3) * 100) / 100;
}

export function averageSkillScore(vetting: Doc<"vettingResults">): number {
  const arr = vetting.skillAssessments;
  if (!arr.length) return 0;
  return arr.reduce((s, a) => s + a.score, 0) / arr.length;
}

/** Weighted verification score: English composite 30%, average skill 70%. */
export function weightedVerificationOverall(vetting: Doc<"vettingResults">): number | null {
  const eng = englishCompositeFromVetting(vetting.englishProficiency);
  if (eng == null) return null;
  return calculateOverallScore({
    englishScore: eng,
    skillScores: vetting.skillAssessments.map((a) => a.score),
  });
}
