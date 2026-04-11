import type { Doc } from "../_generated/dataModel";
import { calculateOverallScore } from "./engine";

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
