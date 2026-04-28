// @ts-nocheck
import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Doc } from "../_generated/dataModel";
import {
  getRoleLabel,
  getRoleIdForSkill,
  getRoleIdFromCategoryLabel,
  freelancerMatchesRole,
  humanizeTeamRoleKey,
  getSkillsForCategory,
} from "../../lib/platform-skills";
import { getRoleLabelsForProjectIntake, teamSlotsToMatchSpecs } from "../../lib/team-slots";
import {
  normalizeRequiredSkillsForMatching,
  projectPrimaryRoleId,
  calculateSkillOverlapPercent,
  isFreelancerEligibleForProjectMatch,
  platformRoleIdForTeamRoleKey,
  freelancerHasExactSoftwareSubField,
  MIN_REQUIRED_SKILL_OVERLAP_PERCENT,
} from "../../lib/matching-skill-utils";
import { isFreelancerPermanentlyExcluded } from "../match_exclusions";
import { isFreelancerInMatchingPool } from "../../lib/freelancer-matching-readiness";

function projectAllowsPostFundMatchGeneration(project: Doc<"projects">): boolean {
  if (project.status === "funded") return true;
  if (project.status !== "matching") return false;
  return (
    project.awaitingMatch === true ||
    (project.pendingTeamMemberSlots != null && project.pendingTeamMemberSlots > 0) ||
    (project.rolesAwaitingMatch != null && project.rolesAwaitingMatch.length > 0)
  );
}

/**
 * Matching Engine - Deterministic, Explainable Algorithm
 * 
 * Scoring Factors:
 * 1. Skill Overlap (40%)
 * 2. Vetting Score (25%)
 * 3. Ratings (15%)
 * 4. Availability (10%)
 * 5. Past Performance (10%)
 */

interface ScoringBreakdown {
  skillOverlap: number;
  vettingScore: number;
  ratings: number;
  availability: number;
  pastPerformance: number;
  timezoneCompatibility: number;
}

/**
 * Calculate timezone compatibility (0-100)
 */
function calculateTimezoneCompatibility(
  projectTimezone: string | undefined,
  freelancerTimezone: string | undefined
): number {
  if (!projectTimezone || !freelancerTimezone) return 50; // Neutral if unknown

  // Simple timezone matching (can be enhanced)
  if (projectTimezone === freelancerTimezone) return 100;

  // Check if timezones are in similar regions (simplified)
  const timezoneRegions: Record<string, string[]> = {
    "US": ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"],
    "EU": ["Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Rome"],
    "Asia": ["Asia/Tokyo", "Asia/Shanghai", "Asia/Hong_Kong", "Asia/Singapore"],
  };

  // For now, return 70 if different but both exist
  return 70;
}

/**
 * Calculate availability score (0-100)
 */
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
      return 50; // Neutral if unknown
  }
}

/**
 * Calculate past performance score (0-100)
 * Based on completed projects, on-time delivery, etc.
 */
async function calculatePastPerformance(
  ctx: any,
  freelancerId: string
): Promise<number> {
  // Get completed projects for this freelancer
  const projects = await ctx.runQuery(internal.projects.queries.getProjectsByFreelancer, {
    freelancerId: freelancerId as any,
  });

  const completedProjects = (projects || []).filter(
    (p: any) => p.status === "completed"
  );

  if (completedProjects.length === 0) return 50; // Neutral for new freelancers

  // Calculate on-time delivery rate
  const milestones = await Promise.all(
    completedProjects.map((p: any) =>
      ctx.runQuery(internal.projects.queries.getProjectMilestonesInternal, {
        projectId: p._id,
      })
    )
  );

  let onTimeCount = 0;
  let totalMilestones = 0;

  for (const projectMilestones of milestones) {
    if (!projectMilestones) continue;
    for (const milestone of projectMilestones) {
      totalMilestones++;
      if (milestone.submittedAt && milestone.submittedAt <= milestone.dueDate) {
        onTimeCount++;
      }
    }
  }

  const onTimeRate = totalMilestones > 0 ? (onTimeCount / totalMilestones) * 100 : 50;

  // Combine with project completion rate
  const completionRate = (completedProjects.length / (projects?.length || 1)) * 100;

  // Weighted average: 70% on-time, 30% completion
  return onTimeRate * 0.7 + completionRate * 0.3;
}

/**
 * Calculate ratings score (0-100)
 * Based on historical client ratings (reviews table)
 */
async function calculateRatingsScore(
  ctx: { runQuery: (fn: any, args: any) => Promise<any> },
  freelancerId: string
): Promise<number> {
  try {
    const stats = await ctx.runQuery(
      internal.reviews.queries.getFreelancerRatingStatsInternal,
      { freelancerId }
    );
    if (!stats || stats.count === 0) return 50; // Neutral if no reviews
    // Average rating 1-5 → 0-100 score
    return Math.round((stats.averageRating / 5) * 100);
  } catch {
    return 50;
  }
}

/**
 * Generate human-readable explanation for match
 */
function generateExplanation(
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

/**
 * Determine match confidence level
 */
function determineConfidence(score: number): "low" | "medium" | "high" {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  return "low";
}

/** Single source of truth for scoring weights (used by all match generation paths) */
const SCORING_WEIGHTS = {
  skillOverlap: 0.4,
  vettingScore: 0.25,
  ratings: 0.15,
  availability: 0.1,
  pastPerformance: 0.1,
};

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

function computeOverallScore(breakdown: ScoringBreakdown): number {
  return (
    breakdown.skillOverlap * SCORING_WEIGHTS.skillOverlap +
    breakdown.vettingScore * SCORING_WEIGHTS.vettingScore +
    breakdown.ratings * SCORING_WEIGHTS.ratings +
    breakdown.availability * SCORING_WEIGHTS.availability +
    breakdown.pastPerformance * SCORING_WEIGHTS.pastPerformance
  );
}

/**
 * Score one freelancer against normalized intake skills (or a per-role subset for team groups).
 */
async function scoreOneFreelancer(
  ctx: any,
  freelancer: Doc<"users">,
  intakeForm: Doc<"projects">["intakeForm"],
  vettingScore: number,
  options?: { requiredSkillSubset?: string[]; categoryRoleId?: string }
): Promise<{ score: number; breakdown: ScoringBreakdown }> {
  const categoryRoleId =
    options?.categoryRoleId ?? projectPrimaryRoleId(intakeForm);
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
  const ratings = await calculateRatingsScore(ctx, freelancer._id);
  const availability = calculateAvailabilityScore(freelancer.profile?.availability);
  const pastPerformance = await calculatePastPerformance(ctx, freelancer._id);
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

/**
 * Generate matches for a project
 * This is called when a project is funded and ready for matching
 * Can be called as an action (from webhook) or scheduled action
 */
export const generateMatches = action({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()), // Default: 10
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Get project directly from database (internal action, no auth needed)
    const project = await ctx.runQuery(internal.projects.queries.getProjectInternal, {
      projectId: args.projectId,
    });

    if (!project) {
      throw new Error("Project not found");
    }

    if (!projectAllowsPostFundMatchGeneration(project)) {
      throw new Error("Project is not in a state that allows match generation");
    }

    // Get all verified freelancers directly from database (includes busy / on other hires — scored lower)
    const allUsers = await ctx.runQuery(internal.users.queries.getAllUsers, {});

    // Global matching-pool gate (active, platform + KYC approved, phone verified)
    const verifiedFreelancers = (allUsers || []).filter((u: any) =>
      isFreelancerInMatchingPool(u)
    );

    // Get vetting results for each freelancer
    const approvedFreelancers = await Promise.all(
      verifiedFreelancers.map(async (freelancer: any) => {
        const vettingResult = await ctx.runQuery(
          internal.vetting.queries.getVettingResultByFreelancer,
          { freelancerId: freelancer._id }
        );
        return { freelancer, vettingResult, overallScore: vettingResult?.overallScore || 0 };
      })
    );

    if (approvedFreelancers.length === 0) {
      // No verified freelancers at all — queue the project for auto-assignment
      await ctx.runMutation(internal.matching.mutations.setProjectAwaitingMatch, {
        projectId: args.projectId,
        awaiting: true,
      });
      return [];
    }

    const intakeForm = project.intakeForm;
    const normalizedSkills = normalizeRequiredSkillsForMatching(intakeForm);
    const projectRoleId = projectPrimaryRoleId(intakeForm);
    const requestedLevel = intakeForm.experienceLevel || "mid";
    const requestedSoftwareSubField = intakeForm.softwareDevFields?.[0];

    // Calculate scores for each freelancer
    const scores: Array<{
      freelancer: Doc<"users">;
      vettingResult: any;
      score: number;
      breakdown: ScoringBreakdown;
    }> = [];

    for (const vettingResult of approvedFreelancers) {
      const freelancer = vettingResult.freelancer;

      if (isFreelancerPermanentlyExcluded(project, freelancer._id as string)) {
        continue;
      }

      // Skip if freelancer already matched to this project
      const existingMatch = await ctx.runQuery(
        internal.matching.queries.getMatch,
        {
          projectId: args.projectId,
          freelancerId: freelancer._id,
        }
      );

      if (existingMatch) continue;

      if (
        !isFreelancerEligibleForProjectMatch(
          freelancer,
          normalizedSkills,
          projectRoleId
        )
      ) {
        continue;
      }
      if (!freelancerMatchesExperience(freelancer, requestedLevel, false)) {
        continue;
      }
      if (
        requestedSoftwareSubField &&
        !freelancerHasExactSoftwareSubField(freelancer, requestedSoftwareSubField)
      ) {
        continue;
      }

      const vettingScore = vettingResult?.overallScore || 0;
      const { score: overallScore, breakdown } = await scoreOneFreelancer(
        ctx,
        freelancer,
        intakeForm,
        vettingScore
      );

      scores.push({
        freelancer,
        vettingResult,
        score: overallScore,
        breakdown,
      });
    }

    // Sort by score (descending) and take top N
    scores.sort((a, b) => b.score - a.score);
    const topMatches = scores.slice(0, limit);

    // Create match records
    const matchIds: string[] = [];
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const match of topMatches) {
      const explanation = generateExplanation(
        match.breakdown,
        match.freelancer.name,
        project.intakeForm.title
      );

      const confidence = determineConfidence(match.score);

      const matchId = await ctx.runMutation(
        internal.matching.mutations.createMatch,
        {
          projectId: args.projectId,
          freelancerId: match.freelancer._id,
          score: match.score,
          confidence,
          scoringBreakdown: match.breakdown,
          explanation,
          expiresAt,
        }
      );

      matchIds.push(matchId);
    }

    // If we found matches now but project was previously awaiting, clear the flag
    if (matchIds.length > 0) {
      await ctx.runMutation(internal.matching.mutations.setProjectAwaitingMatch, {
        projectId: args.projectId,
        awaiting: false,
        clearRolesAwaitingMatch: true,
      });
    } else {
      // Freelancers exist but none scored well enough — still queue for retry
      await ctx.runMutation(internal.matching.mutations.setProjectAwaitingMatch, {
        projectId: args.projectId,
        awaiting: true,
      });
    }

    return matchIds;
  },
});

/**
 * Generate team matches for a project
 * Matches multiple freelancers with different specializations
 */
export const generateTeamMatches = action({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Get project
    const project = await ctx.runQuery(internal.projects.queries.getProjectInternal, {
      projectId: args.projectId,
    });

    if (!project) {
      throw new Error("Project not found");
    }

    if (!projectAllowsPostFundMatchGeneration(project)) {
      throw new Error("Project is not in a state that allows match generation");
    }

    // Check if project requires a team
    const intakeForm = project.intakeForm;
    if (intakeForm.hireType !== "team") {
      throw new Error("This project does not require a team");
    }

    const normalizedIntakeSkills = normalizeRequiredSkillsForMatching(intakeForm);

    // Import team matching utilities
    const { determineTeamComposition, matchFreelancerToRole } = await import(
      "../../lib/team-matching"
    );

    // Determine team composition
    const teamComposition = determineTeamComposition({
      teamSlots: intakeForm.teamSlots,
      teamMemberCount: intakeForm.teamMemberCount,
      teamSize: intakeForm.teamSize,
      description: intakeForm.description,
      skills: intakeForm.requiredSkills || [],
      category: intakeForm.talentCategory as any,
      experienceLevel: intakeForm.experienceLevel as any,
    });

    const allUsers = await ctx.runQuery(internal.users.queries.getAllUsers, {});

    const verifiedFreelancers = (allUsers || []).filter((u: any) =>
      isFreelancerInMatchingPool(u)
    );

    if (verifiedFreelancers.length === 0) {
      await ctx.runMutation(internal.matching.mutations.setProjectAwaitingMatch, {
        projectId: args.projectId,
        awaiting: true,
      });
      return {
        teamSize: 0,
        composition: teamComposition,
        matchIds: [] as string[],
      };
    }

    const existingProjectMatches = await ctx.runQuery(
      internal.matching.queries.listProjectMatchesInternal,
      { projectId: args.projectId }
    );

    const { teamSlotsToMatchSpecs } = await import("../../lib/team-slots");
    const defaultExp = (intakeForm.experienceLevel as any) || "mid";
    const slotSpecs =
      intakeForm.teamSlots?.some((s: { roleId?: string }) => !!s.roleId)
        ? teamSlotsToMatchSpecs(intakeForm.teamSlots as any, defaultExp)
        : [];

    // Get vetting results
    const approvedFreelancers = await Promise.all(
      verifiedFreelancers.map(async (freelancer: any) => {
        const vettingResult = await ctx.runQuery(
          internal.vetting.queries.getVettingResultByFreelancer,
          { freelancerId: freelancer._id }
        );
        return { freelancer, vettingResult, overallScore: vettingResult?.overallScore || 0 };
      })
    );

    const teamMatches: Array<{
      roleKey: string;
      teamRoleLabel: string;
      freelancer: Doc<"users">;
      score: number;
      matchReasons: string[];
    }> = [];

    const reservedFreelancerIds = new Set(
      (existingProjectMatches || [])
        .filter((m: { status: string }) => m.status === "pending" || m.status === "accepted")
        .map((m: { freelancerId: string }) => m.freelancerId as string)
    );
    const permanentlyExcludedIds = new Set(
      (project.permanentlyExcludedFreelancerIds ?? []).map(String)
    );

    if (slotSpecs.length > 0) {
      const acceptedBySlot = slotSpecs.map(() => 0);
      for (const m of existingProjectMatches || []) {
        if (m.status !== "accepted" || !m.teamRole) continue;
        const idx = slotSpecs.findIndex((s) => s.teamRoleLabel === m.teamRole);
        if (idx >= 0) acceptedBySlot[idx]++;
      }

      for (let slotIndex = 0; slotIndex < slotSpecs.length; slotIndex++) {
        const spec = slotSpecs[slotIndex];
        if (acceptedBySlot[slotIndex] >= 1) continue;

        // Use only slot-specific skills for per-slot filtering — not merged with project skills.
        const requiredSkills = normalizeRequiredSkillsForMatching({
          requiredSkills: spec.skills ?? [],
        });

        const slotCategoryRoleId = platformRoleIdForTeamRoleKey(spec.roleKey);

        const roleMatches: Array<{
          freelancer: Doc<"users">;
          score: number;
          matchReasons: string[];
          vettingScore: number;
        }> = [];

        for (const { freelancer, vettingResult } of approvedFreelancers) {
          if (reservedFreelancerIds.has(freelancer._id as string)) continue;
          if (permanentlyExcludedIds.has(String(freelancer._id))) continue;

          const existingMatch = await ctx.runQuery(
            internal.matching.queries.getMatch,
            {
              projectId: args.projectId,
              freelancerId: freelancer._id,
            }
          );

          if (existingMatch) continue;

          // Category + skill gate (techField always enforced).
          if (!isFreelancerEligibleForProjectMatch(freelancer, requiredSkills, slotCategoryRoleId)) {
            continue;
          }

          if (!freelancerMatchesExperience(freelancer, spec.experienceLevel, false)) {
            continue;
          }

          // Sub-field gate: distinguish frontend/backend/mobile/etc. within software_development.
          if (!freelancerHasExactSoftwareSubField(freelancer, spec.roleKey)) continue;

          const matchResult = matchFreelancerToRole(
            freelancer,
            spec.roleKey,
            requiredSkills,
            spec.experienceLevel as any
          );

          if (matchResult.score <= 0) continue;

          const vettingScore = vettingResult?.overallScore || 0;
          const combinedScore = matchResult.score * 0.7 + vettingScore * 0.3;

          roleMatches.push({
            freelancer,
            score: combinedScore,
            matchReasons: matchResult.matchReasons,
            vettingScore,
          });
        }

        roleMatches.sort((a, b) => b.score - a.score);
        const best = roleMatches[0];
        if (best) {
          teamMatches.push({
            roleKey: spec.roleKey,
            teamRoleLabel: spec.teamRoleLabel,
            freelancer: best.freelancer,
            score: best.score,
            matchReasons: best.matchReasons,
          });
          reservedFreelancerIds.add(best.freelancer._id as string);
        }
      }
    } else {
      const acceptedCountByCompKey: Record<string, number> = {};
      for (const key of Object.keys(teamComposition)) {
        acceptedCountByCompKey[key] = 0;
      }
      for (const m of existingProjectMatches || []) {
        if (m.status !== "accepted" || !m.teamRole) continue;
        for (const key of Object.keys(teamComposition)) {
          if (humanizeTeamRoleKey(key) === m.teamRole) {
            acceptedCountByCompKey[key] = (acceptedCountByCompKey[key] ?? 0) + 1;
            break;
          }
        }
      }

      for (const [role, count] of Object.entries(teamComposition)) {
        const alreadyAccepted = acceptedCountByCompKey[role] ?? 0;
        const effectiveNeed = Math.max(0, count - alreadyAccepted);
        if (effectiveNeed === 0) continue;

        const roleMatches: Array<{
          freelancer: Doc<"users">;
          score: number;
          matchReasons: string[];
          vettingScore: number;
        }> = [];

        const roleCategoryId = platformRoleIdForTeamRoleKey(role);

        for (const { freelancer, vettingResult } of approvedFreelancers) {
          if (reservedFreelancerIds.has(freelancer._id as string)) continue;
          if (permanentlyExcludedIds.has(String(freelancer._id))) continue;

          const existingMatch = await ctx.runQuery(
            internal.matching.queries.getMatch,
            {
              projectId: args.projectId,
              freelancerId: freelancer._id,
            }
          );

          if (existingMatch) continue;

          if (
            !isFreelancerEligibleForProjectMatch(
              freelancer,
              normalizedIntakeSkills,
              roleCategoryId
            )
          ) {
            continue;
          }
          if (
            !freelancerMatchesExperience(
              freelancer,
              intakeForm.experienceLevel as string,
              false
            )
          ) {
            continue;
          }
          if (!freelancerHasExactSoftwareSubField(freelancer, role)) continue;

          const matchResult = matchFreelancerToRole(
            freelancer,
            role,
            normalizedIntakeSkills,
            intakeForm.experienceLevel as any
          );

          if (matchResult.score <= 0) continue;

          const vettingScore = vettingResult?.overallScore || 0;
          const combinedScore = matchResult.score * 0.7 + vettingScore * 0.3;

          roleMatches.push({
            freelancer,
            score: combinedScore,
            matchReasons: matchResult.matchReasons,
            vettingScore,
          });
        }

        roleMatches.sort((a, b) => b.score - a.score);
        const topMatches = roleMatches.slice(0, effectiveNeed);

        for (const match of topMatches) {
          teamMatches.push({
            roleKey: role,
            teamRoleLabel: humanizeTeamRoleKey(role),
            freelancer: match.freelancer,
            score: match.score,
            matchReasons: match.matchReasons,
          });
          reservedFreelancerIds.add(match.freelancer._id as string);
        }
      }
    }

    let missingRoleLabels: string[] = [];
    if (slotSpecs.length > 0) {
      const acceptedBySlot = slotSpecs.map(() => 0);
      for (const m of existingProjectMatches || []) {
        if (m.status !== "accepted" || !m.teamRole) continue;
        const idx = slotSpecs.findIndex((s) => s.teamRoleLabel === m.teamRole);
        if (idx >= 0) acceptedBySlot[idx]++;
      }
      for (let i = 0; i < slotSpecs.length; i++) {
        if (acceptedBySlot[i] >= 1) continue;
        const created = teamMatches.some((t) => t.teamRoleLabel === slotSpecs[i].teamRoleLabel);
        if (!created) missingRoleLabels.push(slotSpecs[i].teamRoleLabel);
      }
    } else {
      for (const [roleKey, need] of Object.entries(teamComposition)) {
        const alreadyAccepted = (() => {
          let n = 0;
          for (const m of existingProjectMatches || []) {
            if (m.status !== "accepted" || !m.teamRole) continue;
            if (humanizeTeamRoleKey(roleKey) === m.teamRole) n++;
          }
          return n;
        })();
        const created = teamMatches.filter((t) => t.roleKey === roleKey).length;
        if (alreadyAccepted + created < need) {
          missingRoleLabels.push(humanizeTeamRoleKey(roleKey));
        }
      }
    }

    // Create match records for each team member
    const matchIds: string[] = [];
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const teamMatch of teamMatches) {
      const explanation = `${teamMatch.freelancer.name} is matched for the ${teamMatch.teamRoleLabel} role. ${teamMatch.matchReasons.join(". ")}.`;

      const confidence = teamMatch.score >= 80 ? "high" : teamMatch.score >= 60 ? "medium" : "low";

      const matchId = await ctx.runMutation(
        internal.matching.mutations.createMatch,
        {
          projectId: args.projectId,
          freelancerId: teamMatch.freelancer._id,
          score: teamMatch.score,
          confidence,
          scoringBreakdown: {
            skillOverlap: teamMatch.score * 0.4,
            vettingScore: teamMatch.score * 0.3,
            ratings: 50,
            availability: 50,
            pastPerformance: 50,
            timezoneCompatibility: 50,
          },
          explanation,
          expiresAt,
          teamRole: teamMatch.teamRoleLabel,
        }
      );

      matchIds.push(matchId);
    }

    if (matchIds.length > 0) {
      const slotsRemaining = project.pendingTeamMemberSlots ?? 0;
      const stillAwaiting =
        missingRoleLabels.length > 0 || slotsRemaining > 0;
      await ctx.runMutation(internal.matching.mutations.setProjectAwaitingMatch, {
        projectId: args.projectId,
        awaiting: stillAwaiting,
        rolesAwaitingMatch: stillAwaiting ? missingRoleLabels : [],
        clearRolesAwaitingMatch: !stillAwaiting,
      });
    } else {
      const allMissing =
        slotSpecs.length > 0
          ? slotSpecs.map((s) => s.teamRoleLabel)
          : Object.keys(teamComposition).map((k) => humanizeTeamRoleKey(k));
      await ctx.runMutation(internal.matching.mutations.setProjectAwaitingMatch, {
        projectId: args.projectId,
        awaiting: true,
        rolesAwaitingMatch: allMissing.length > 0 ? allMissing : undefined,
      });
    }

    return {
      teamSize: teamMatches.length,
      composition: teamComposition,
      matchIds,
    };
  },
});

/**
 * Generate matches for a project in draft or pending_funding (pre-funding).
 * Single: top 10 matches, persisted. Team: top 10 per required-skill group, persisted.
 * Used right after project create so client can see matches before payment.
 */
export const generateMatchesForDraft = action({
  args: {
    projectId: v.id("projects"),
    allowLowerExperience: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.runQuery(
      internal.projects.queries.getProjectInternal,
      { projectId: args.projectId }
    );

    if (!project) {
      throw new Error("Project not found");
    }

    if (project.status !== "draft" && project.status !== "pending_funding") {
      throw new Error(
        "Pre-funding matching only allowed for draft or pending_funding projects"
      );
    }

    const intakeForm = project.intakeForm;
    const isTeam = intakeForm.hireType === "team";
    const normalizedSkills = normalizeRequiredSkillsForMatching(intakeForm);
    const projectRoleId = projectPrimaryRoleId(intakeForm);
    const requestedLevel = intakeForm.experienceLevel || "mid";
    const allowLowerExperience = args.allowLowerExperience === true;
    const requestedSoftwareSubField = intakeForm.softwareDevFields?.[0];
    const allUsers = await ctx.runQuery(internal.users.queries.getAllUsers, {});

    const verifiedFreelancers = (allUsers || []).filter((u: any) =>
      isFreelancerInMatchingPool(u)
    );

    const approvedFreelancers = await Promise.all(
      verifiedFreelancers.map(async (freelancer: any) => {
        const vettingResult = await ctx.runQuery(
          internal.vetting.queries.getVettingResultByFreelancer,
          { freelancerId: freelancer._id }
        );
        return {
          freelancer,
          vettingResult,
          overallScore: vettingResult?.overallScore || 0,
        };
      })
    );

    if (approvedFreelancers.length === 0) {
      if (isTeam) {
        const roleLabels = getRoleLabelsForProjectIntake(intakeForm);
        await ctx.runMutation(internal.matching.mutations.setProjectAwaitingMatch, {
          projectId: args.projectId,
          awaiting: true,
          rolesAwaitingMatch:
            roleLabels.length > 0 ? roleLabels : undefined,
        });
      } else {
        await ctx.runMutation(internal.matching.mutations.setProjectAwaitingMatch, {
          projectId: args.projectId,
          awaiting: true,
        });
      }
      return { matchIds: [], isTeam: false, groupCount: 0, availability: null };
    }

    // Default shows requested level or higher. Lower levels only appear after explicit client opt-in.
    const levelFiltered = approvedFreelancers.filter((a) => {
      return freelancerMatchesExperience(
        a.freelancer,
        requestedLevel,
        allowLowerExperience
      );
    });
    const lowerLevelFreelancers = approvedFreelancers.filter((a) =>
      experienceLevelIndex(a.freelancer.profile?.experienceLevel || "mid") <
      experienceLevelIndex(requestedLevel)
    );

    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days
    const matchIds: string[] = [];

    if (!isTeam) {
      // Single: top 20, filter by experience level
      const scores: Array<{
        freelancer: Doc<"users">;
        score: number;
        breakdown: ScoringBreakdown;
      }> = [];

      for (const { freelancer, overallScore: vettingScore } of levelFiltered) {
        if (isFreelancerPermanentlyExcluded(project, freelancer._id as string)) {
          continue;
        }
        if (
          !isFreelancerEligibleForProjectMatch(
            freelancer,
            normalizedSkills,
            projectRoleId
          )
        ) {
          continue;
        }
        if (
          requestedSoftwareSubField &&
          !freelancerHasExactSoftwareSubField(freelancer, requestedSoftwareSubField)
        ) {
          continue;
        }
        const { score: overallScore, breakdown } = await scoreOneFreelancer(
          ctx,
          freelancer,
          intakeForm,
          vettingScore
        );
        scores.push({ freelancer, score: overallScore, breakdown });
      }

      scores.sort((a, b) => b.score - a.score);
      const top10 = scores
        .filter((m) =>
          normalizedSkills.length > 0
            ? m.breakdown.skillOverlap >= MIN_REQUIRED_SKILL_OVERLAP_PERCENT
            : m.breakdown.skillOverlap >= 45
        )
        .slice(0, 10);

      let hasLowerLevelWithExactSkills = false;
      if (!allowLowerExperience && top10.length === 0 && lowerLevelFreelancers.length > 0) {
        for (const { freelancer, overallScore: vettingScore } of lowerLevelFreelancers) {
          if (
            !isFreelancerEligibleForProjectMatch(
              freelancer,
              normalizedSkills,
              projectRoleId
            )
          ) {
            continue;
          }
          if (
            requestedSoftwareSubField &&
            !freelancerHasExactSoftwareSubField(freelancer, requestedSoftwareSubField)
          ) {
            continue;
          }
          const { breakdown } = await scoreOneFreelancer(
            ctx,
            freelancer,
            intakeForm,
            vettingScore
          );
          if (
            normalizedSkills.length > 0
              ? breakdown.skillOverlap >= MIN_REQUIRED_SKILL_OVERLAP_PERCENT
              : breakdown.skillOverlap >= 45
          ) {
            hasLowerLevelWithExactSkills = true;
            break;
          }
        }
      }

      for (const match of top10) {
        const explanation = generateExplanation(
          match.breakdown,
          match.freelancer.name,
          intakeForm.title
        );
        const confidence = determineConfidence(match.score);
        const matchId = await ctx.runMutation(
          internal.matching.mutations.createMatch,
          {
            projectId: args.projectId,
            freelancerId: match.freelancer._id,
            score: match.score,
            confidence,
            scoringBreakdown: match.breakdown,
            explanation,
            expiresAt,
          }
        );
        matchIds.push(matchId);
      }

      const availability =
        top10.length === 0
          ? { atRequestedLevel: 0, hasLowerLevelWithExactSkills }
          : null;
      if (matchIds.length === 0) {
        await ctx.runMutation(internal.matching.mutations.setProjectAwaitingMatch, {
          projectId: args.projectId,
          awaiting: true,
        });
      } else {
        await ctx.runMutation(internal.matching.mutations.setProjectAwaitingMatch, {
          projectId: args.projectId,
          awaiting: false,
          clearRolesAwaitingMatch: true,
        });
      }
      return { matchIds, isTeam: false, groupCount: 0, availability };
    }

    const rolesMissing: string[] = [];

    // Unified spec list: each entry drives one seat's matching and post-loop availability check.
    // Both the slot-based path and the skill-grouping path populate this.
    type RoleSpec = {
      skills: string[];
      roleId: string;
      roleLabel: string;
      softwareSubFieldKey?: string;
    };
    const roleSpecs: RoleSpec[] = [];

    // When the project uses per-seat teamSlots, derive labels via teamSlotsToMatchSpecs so
    // the stored teamRole exactly matches what getRoleLabelsForProjectIntake returns in the UI.
    const hasSlots =
      Array.isArray(intakeForm.teamSlots) &&
      intakeForm.teamSlots.some((s: any) => s.roleId);

    if (hasSlots) {
      const specs = teamSlotsToMatchSpecs(intakeForm.teamSlots, requestedLevel as any);

      for (const spec of specs) {
        const specRoleId = platformRoleIdForTeamRoleKey(spec.roleKey);
        // Use ONLY the slot's own skills — never merge project-level skills here.
        // Merging would let every freelancer who matches any project-wide skill pass every slot.
        const slotSkills = normalizeRequiredSkillsForMatching({
          requiredSkills: spec.skills ?? [],
        });

        roleSpecs.push({
          skills: slotSkills,
          roleId: specRoleId,
          roleLabel: spec.teamRoleLabel,
          softwareSubFieldKey: spec.roleKey,
        });

        const matchCountBeforeSpec = matchIds.length;
        const groupScores: Array<{
          freelancer: Doc<"users">;
          score: number;
          breakdown: ScoringBreakdown;
        }> = [];

        for (const { freelancer, overallScore: vettingScore } of levelFiltered) {
          if (isFreelancerPermanentlyExcluded(project, freelancer._id as string)) continue;

          // Category + skill eligibility gate (techField always enforced).
          if (!isFreelancerEligibleForProjectMatch(freelancer, slotSkills, specRoleId)) continue;

          // Sub-field gate: within software_development, discriminate frontend/backend/mobile/etc.
          // by requiring the freelancer's saved software sub-field to match the seat exactly.
          if (!freelancerHasExactSoftwareSubField(freelancer, spec.roleKey)) continue;
          if (!freelancerMatchesExperience(freelancer, spec.experienceLevel, allowLowerExperience)) {
            continue;
          }

          const { score: overallScore, breakdown } = await scoreOneFreelancer(
            ctx,
            freelancer,
            intakeForm,
            vettingScore,
            { requiredSkillSubset: slotSkills.length > 0 ? slotSkills : undefined, categoryRoleId: specRoleId }
          );
          groupScores.push({ freelancer, score: overallScore, breakdown });
        }

        groupScores.sort((a, b) => b.score - a.score);
        const top10 = groupScores
          .filter((m) =>
            slotSkills.length > 0
              ? m.breakdown.skillOverlap >= MIN_REQUIRED_SKILL_OVERLAP_PERCENT
              : m.breakdown.skillOverlap >= 45
          )
          .slice(0, 10);

        for (const match of top10) {
          const explanation = generateExplanation(match.breakdown, match.freelancer.name, intakeForm.title);
          const confidence = determineConfidence(match.score);
          const matchId = await ctx.runMutation(internal.matching.mutations.createMatch, {
            projectId: args.projectId,
            freelancerId: match.freelancer._id,
            score: match.score,
            confidence,
            scoringBreakdown: match.breakdown,
            explanation,
            expiresAt,
            teamRole: spec.teamRoleLabel,
          });
          matchIds.push(matchId);
        }

        if (matchIds.length === matchCountBeforeSpec) {
          rolesMissing.push(spec.teamRoleLabel);
        }
      }
    } else {
      // No explicit team slots — group required skills by role id so teamRole labels stay
      // consistent with what getRoleLabelsFromProject returns in the UI.
      const roleSkills: Record<string, string[]> = {};
      const fallbackRoleId = getRoleIdFromCategoryLabel(
        intakeForm.talentCategory || "Software Development"
      );
      for (const skill of normalizedSkills) {
        const roleId = getRoleIdForSkill(skill) ?? fallbackRoleId;
        if (!roleSkills[roleId]) roleSkills[roleId] = [];
        roleSkills[roleId].push(skill);
      }
      const roleEntries = Object.entries(roleSkills).filter(([, skills]) => skills.length > 0);
      const groups =
        roleEntries.length > 0
          ? roleEntries.map(([roleId, skills]) => ({
              roleId,
              roleLabel: getRoleLabel(roleId),
              skills,
            }))
          : [
              {
                roleId: fallbackRoleId,
                roleLabel: getRoleLabel(fallbackRoleId),
                skills: getSkillsForCategory(fallbackRoleId).slice(0, 14),
              },
            ];

      for (const group of groups) {
        roleSpecs.push({
          skills: group.skills,
          roleId: group.roleId,
          roleLabel: group.roleLabel,
        });

        const matchCountBeforeGroup = matchIds.length;
        const groupScores: Array<{
          freelancer: Doc<"users">;
          score: number;
          breakdown: ScoringBreakdown;
        }> = [];

        for (const { freelancer, overallScore: vettingScore } of levelFiltered) {
          if (isFreelancerPermanentlyExcluded(project, freelancer._id as string)) continue;
          if (!isFreelancerEligibleForProjectMatch(freelancer, group.skills, group.roleId)) continue;
          if (!freelancerHasExactSoftwareSubField(freelancer, group.roleId)) continue;
          const { score: overallScore, breakdown } = await scoreOneFreelancer(
            ctx,
            freelancer,
            intakeForm,
            vettingScore,
            { requiredSkillSubset: group.skills, categoryRoleId: group.roleId }
          );
          groupScores.push({ freelancer, score: overallScore, breakdown });
        }

        groupScores.sort((a, b) => b.score - a.score);
        const top10 = groupScores
          .filter((m) => m.breakdown.skillOverlap >= MIN_REQUIRED_SKILL_OVERLAP_PERCENT)
          .slice(0, 10);

        for (const match of top10) {
          const explanation = generateExplanation(match.breakdown, match.freelancer.name, intakeForm.title);
          const confidence = determineConfidence(match.score);
          const matchId = await ctx.runMutation(internal.matching.mutations.createMatch, {
            projectId: args.projectId,
            freelancerId: match.freelancer._id,
            score: match.score,
            confidence,
            scoringBreakdown: match.breakdown,
            explanation,
            expiresAt,
            teamRole: group.roleLabel,
          });
          matchIds.push(matchId);
        }

        if (matchIds.length === matchCountBeforeGroup) {
          rolesMissing.push(group.roleLabel);
        }
      }
    }

    let hasLowerLevelWithExactSkills = false;
    if (!allowLowerExperience && matchIds.length === 0 && lowerLevelFreelancers.length > 0) {
      for (const spec of roleSpecs) {
        for (const { freelancer, overallScore: vettingScore } of lowerLevelFreelancers) {
          if (!isFreelancerEligibleForProjectMatch(freelancer, spec.skills, spec.roleId)) continue;
          if (
            spec.softwareSubFieldKey &&
            !freelancerHasExactSoftwareSubField(freelancer, spec.softwareSubFieldKey)
          ) {
            continue;
          }
          const { breakdown } = await scoreOneFreelancer(
            ctx,
            freelancer,
            intakeForm,
            vettingScore,
            { requiredSkillSubset: spec.skills, categoryRoleId: spec.roleId }
          );
          if (
            breakdown.skillOverlap >= MIN_REQUIRED_SKILL_OVERLAP_PERCENT &&
            freelancerMatchesRole(freelancer.profile?.techField, spec.roleId)
          ) {
            hasLowerLevelWithExactSkills = true;
            break;
          }
        }
        if (hasLowerLevelWithExactSkills) break;
      }
    }

    const availability =
      matchIds.length === 0
        ? { atRequestedLevel: 0, hasLowerLevelWithExactSkills }
        : null;

    if (rolesMissing.length > 0) {
      await ctx.runMutation(internal.matching.mutations.setProjectAwaitingMatch, {
        projectId: args.projectId,
        awaiting: true,
        rolesAwaitingMatch: rolesMissing,
      });
    } else {
      await ctx.runMutation(internal.matching.mutations.setProjectAwaitingMatch, {
        projectId: args.projectId,
        awaiting: false,
        clearRolesAwaitingMatch: true,
      });
    }

    return {
      matchIds,
      isTeam: true,
      groupCount: roleSpecs.length,
      availability,
    };
  },
});
