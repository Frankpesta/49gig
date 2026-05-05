import type { QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { freelancerMatchesRole, humanizeTeamRoleKey } from "../../lib/platform-skills";
import {
  teamSlotsToMatchSpecs,
  type TeamSlotIntake,
} from "../../lib/team-slots";
import {
  calculateSkillOverlapPercent,
  freelancerHasExactSoftwareSubField,
  isFreelancerEligibleForProjectMatch,
  MIN_REQUIRED_SKILL_OVERLAP_PERCENT,
  normalizeRequiredSkillsForMatching,
  platformRoleIdForTeamRoleKey,
  projectPrimaryRoleId,
} from "../../lib/matching-skill-utils";
import { isFreelancerPermanentlyExcluded } from "../match_exclusions";
import { isFreelancerInMatchingPool } from "../../lib/freelancer-matching-readiness";

export interface ScoringBreakdown {
  skillOverlap: number;
  vettingScore: number;
  ratings: number;
  availability: number;
  pastPerformance: number;
  timezoneCompatibility: number;
}

export const SCORING_WEIGHTS = {
  skillOverlap: 0.4,
  vettingScore: 0.25,
  ratings: 0.15,
  availability: 0.1,
  pastPerformance: 0.1,
} as const;

function calculateTimezoneCompatibility(
  projectTimezone: string | undefined,
  freelancerTimezone: string | undefined
): number {
  if (!projectTimezone || !freelancerTimezone) return 50;
  if (projectTimezone === freelancerTimezone) return 100;
  return 70;
}

function calculateAvailabilityScore(
  availability: "available" | "busy" | "unavailable" | undefined
): number {
  switch (availability) {
    case "available":
      return 100;
    case "busy":
      return 50;
    case "unavailable":
      return 0;
    default:
      return 50;
  }
}

const AUTO_RELEASE_DELAY_MS = 48 * 60 * 60 * 1000;

async function calculatePastPerformanceForQuery(
  ctx: QueryCtx,
  freelancerId: Id<"users">
): Promise<number> {
  const projects = await ctx.db
    .query("projects")
    .withIndex("by_freelancer", (q) => q.eq("matchedFreelancerId", freelancerId))
    .collect();

  const completedProjects = projects.filter((p) => p.status === "completed");

  if (completedProjects.length === 0) return 50;

  const cyclesLists = await Promise.all(
    completedProjects.map((p) =>
      ctx.db
        .query("monthlyBillingCycles")
        .withIndex("by_project", (q) => q.eq("projectId", p._id))
        .collect()
    )
  );

  let onTimeCount = 0;
  let totalCycles = 0;

  for (const projectCycles of cyclesLists) {
    if (!projectCycles?.length) continue;
    for (const cycle of projectCycles) {
      if (cycle.status === "cancelled") continue;
      totalCycles++;
      const deadline = cycle.autoReleaseAt ?? cycle.monthEndDate + AUTO_RELEASE_DELAY_MS;
      if (
        cycle.status === "approved" &&
        cycle.approvedAt != null &&
        cycle.approvedAt <= deadline
      ) {
        onTimeCount++;
      }
    }
  }

  const onTimeRate = totalCycles > 0 ? (onTimeCount / totalCycles) * 100 : 50;
  const completionRate = (completedProjects.length / (projects?.length || 1)) * 100;
  return onTimeRate * 0.7 + completionRate * 0.3;
}

async function calculateRatingsScoreForQuery(
  ctx: QueryCtx,
  freelancerId: Id<"users">
): Promise<number> {
  const reviews = await ctx.db
    .query("reviews")
    .withIndex("by_freelancer", (q) => q.eq("freelancerId", freelancerId))
    .collect();
  if (reviews.length === 0) return 50;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  const averageRating = Math.round((sum / reviews.length) * 10) / 10;
  return Math.round((averageRating / 5) * 100);
}

export function generateReplacementExplanation(
  breakdown: ScoringBreakdown,
  freelancerName: string,
  projectTitle: string
): string {
  const reasons: string[] = [];

  if (breakdown.skillOverlap >= 80) {
    reasons.push("excellent skill match");
  } else if (breakdown.skillOverlap >= 60) {
    reasons.push("good skill alignment");
  }

  if (breakdown.vettingScore >= 80) {
    reasons.push("high verification score");
  }

  if (breakdown.availability === 100) {
    reasons.push("currently available");
  }

  if (breakdown.pastPerformance >= 80) {
    reasons.push("strong track record");
  }

  if (reasons.length === 0) {
    return `${freelancerName} is a potential match for "${projectTitle}" based on platform criteria.`;
  }

  return `${freelancerName} is a strong match for "${projectTitle}" due to ${reasons.join(", ")}.`;
}

export function determineReplacementConfidence(score: number): "low" | "medium" | "high" {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  return "low";
}

function computeOverallScore(breakdown: ScoringBreakdown): number {
  return (
    breakdown.skillOverlap * SCORING_WEIGHTS.skillOverlap +
    breakdown.vettingScore * SCORING_WEIGHTS.vettingScore +
    breakdown.ratings * SCORING_WEIGHTS.ratings +
    breakdown.availability * SCORING_WEIGHTS.availability +
    breakdown.pastPerformance * SCORING_WEIGHTS.pastPerformance
  );
}

const EXPERIENCE_LEVELS = ["junior", "mid", "senior", "expert"] as const;

function experienceLevelIndex(level: string | undefined): number {
  const i = EXPERIENCE_LEVELS.indexOf(level as (typeof EXPERIENCE_LEVELS)[number]);
  return i >= 0 ? i : 1;
}

function freelancerMatchesExperience(
  freelancer: Doc<"users">,
  requiredLevel: string,
  allowLowerExperience: boolean
): boolean {
  const freelancerLevel = freelancer.profile?.experienceLevel || "mid";
  const freelancerIdx = experienceLevelIndex(freelancerLevel);
  const requiredIdx = experienceLevelIndex(requiredLevel);
  if (allowLowerExperience) return freelancerIdx < requiredIdx;
  return freelancerIdx >= requiredIdx;
}

export type ReplacementGateContext = {
  normalizedSkillsForGate: string[];
  categoryRoleId: string;
  experienceLevel: string;
  softwareGateKey: string | undefined;
  replacingSeatLabel?: string;
};

export async function buildReplacementGateContext(
  ctx: QueryCtx,
  project: Doc<"projects">,
  oldFreelancerId: Id<"users"> | undefined
): Promise<ReplacementGateContext> {
  const intake = project.intakeForm;
  const defaultExp = intake.experienceLevel ?? "mid";

  if (intake.hireType !== "team" || !oldFreelancerId) {
    return {
      normalizedSkillsForGate: normalizeRequiredSkillsForMatching(intake),
      categoryRoleId: projectPrimaryRoleId(intake),
      experienceLevel: defaultExp,
      softwareGateKey: intake.softwareDevFields?.[0],
    };
  }

  const acceptedForFreelancer = await ctx.db
    .query("matches")
    .withIndex("by_project", (q) => q.eq("projectId", project._id))
    .filter((q) =>
      q.and(q.eq(q.field("freelancerId"), oldFreelancerId), q.eq(q.field("status"), "accepted"))
    )
    .first();

  const slots = (intake.teamSlots ?? []) as TeamSlotIntake[];
  const slotSpecs = slots.some((s) => s.roleId)
    ? teamSlotsToMatchSpecs(slots, defaultExp)
    : [];

  if (acceptedForFreelancer?.teamRole && slotSpecs.length > 0) {
    const tr = acceptedForFreelancer.teamRole;
    const spec =
      slotSpecs.find((s) => s.teamRoleLabel === tr) ??
      slotSpecs.find((s) => humanizeTeamRoleKey(s.roleKey) === tr);
    if (spec) {
      return {
        normalizedSkillsForGate: normalizeRequiredSkillsForMatching({
          requiredSkills: spec.skills ?? [],
        }),
        categoryRoleId: platformRoleIdForTeamRoleKey(spec.roleKey),
        experienceLevel: spec.experienceLevel,
        softwareGateKey: spec.roleKey,
        replacingSeatLabel: spec.teamRoleLabel,
      };
    }
  }

  return {
    normalizedSkillsForGate: normalizeRequiredSkillsForMatching(intake),
    categoryRoleId: projectPrimaryRoleId(intake),
    experienceLevel: defaultExp,
    softwareGateKey: intake.softwareDevFields?.[0],
  };
}

function passesMinSkillOverlap(
  normalizedLen: number,
  breakdown: ScoringBreakdown
): boolean {
  return normalizedLen > 0
    ? breakdown.skillOverlap >= MIN_REQUIRED_SKILL_OVERLAP_PERCENT
    : breakdown.skillOverlap >= 45;
}

export async function scoreFreelancerForAdminReplacement(
  ctx: QueryCtx,
  freelancer: Doc<"users">,
  intakeForm: Doc<"projects">["intakeForm"],
  vettingScore: number,
  options?: { requiredSkillSubset?: string[]; categoryRoleId?: string }
): Promise<{ score: number; breakdown: ScoringBreakdown }> {
  const categoryRoleId = options?.categoryRoleId ?? projectPrimaryRoleId(intakeForm);
  const subset = options?.requiredSkillSubset;
  const normalized =
    subset != null && subset.length > 0
      ? subset
      : normalizeRequiredSkillsForMatching(intakeForm);
  const freelancerSkills = freelancer.profile?.skills || [];
  const skillOverlap =
    normalized.length > 0
      ? calculateSkillOverlapPercent(normalized, freelancerSkills)
      : freelancerMatchesRole(freelancer.profile?.techField, categoryRoleId)
        ? 45
        : 0;

  const ratings = await calculateRatingsScoreForQuery(ctx, freelancer._id);
  const availability = calculateAvailabilityScore(freelancer.profile?.availability);
  const pastPerformance = await calculatePastPerformanceForQuery(ctx, freelancer._id);
  const timezoneCompatibility = calculateTimezoneCompatibility(
    undefined,
    freelancer.profile?.timezone
  );

  const breakdown: ScoringBreakdown = {
    skillOverlap,
    vettingScore,
    ratings,
    availability,
    pastPerformance,
    timezoneCompatibility,
  };
  const score = computeOverallScore(breakdown);
  return { score, breakdown };
}

export async function rankAdminReplacementCandidates(
  ctx: QueryCtx,
  project: Doc<"projects">,
  gate: ReplacementGateContext
): Promise<
  Array<{
    freelancer: Doc<"users">;
    vettingOverallScore: number;
    vettingStatus?: string;
    score: number;
    breakdown: ScoringBreakdown;
    explanation: string;
    confidence: "low" | "medium" | "high";
  }>
> {
  const roster = new Set([
    ...(project.matchedFreelancerId ? [String(project.matchedFreelancerId)] : []),
    ...(project.matchedFreelancerIds ?? []).map(String),
  ]);

  const users = await ctx.db
    .query("users")
    .withIndex("by_role", (q) => q.eq("role", "freelancer"))
    .collect();

  const scored: Array<{
    freelancer: Doc<"users">;
    vettingOverallScore: number;
    vettingStatus?: string;
    score: number;
    breakdown: ScoringBreakdown;
    explanation: string;
    confidence: "low" | "medium" | "high";
  }> = [];

  for (const freelancer of users) {
    if (!isFreelancerInMatchingPool(freelancer)) continue;
    if (roster.has(String(freelancer._id))) continue;
    if (isFreelancerPermanentlyExcluded(project, freelancer._id as string)) continue;

    if (
      !isFreelancerEligibleForProjectMatch(
        freelancer,
        gate.normalizedSkillsForGate,
        gate.categoryRoleId
      )
    ) {
      continue;
    }

    if (!freelancerMatchesExperience(freelancer, gate.experienceLevel, false)) {
      continue;
    }

    if (
      gate.softwareGateKey &&
      !freelancerHasExactSoftwareSubField(freelancer, gate.softwareGateKey)
    ) {
      continue;
    }

    const vetting = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", freelancer._id))
      .first();
    const vettingOverallScore = vetting?.overallScore ?? 0;

    const { score, breakdown } = await scoreFreelancerForAdminReplacement(
      ctx,
      freelancer,
      project.intakeForm,
      vettingOverallScore,
      {
        requiredSkillSubset: gate.normalizedSkillsForGate,
        categoryRoleId: gate.categoryRoleId,
      }
    );

    if (!passesMinSkillOverlap(gate.normalizedSkillsForGate.length, breakdown)) {
      continue;
    }

    const explanation = generateReplacementExplanation(
      breakdown,
      freelancer.name,
      project.intakeForm.title
    );
    const confidence = determineReplacementConfidence(score);

    scored.push({
      freelancer,
      vettingOverallScore,
      vettingStatus: vetting?.status,
      score,
      breakdown,
      explanation,
      confidence,
    });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      a.freelancer.name.localeCompare(b.freelancer.name)
  );
  return scored;
}
