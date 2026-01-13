// @ts-nocheck
import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Doc } from "../_generated/dataModel";

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
 * Calculate skill overlap score (0-100)
 */
function calculateSkillOverlap(
  requiredSkills: string[],
  freelancerSkills: string[]
): number {
  if (requiredSkills.length === 0) return 50; // Neutral if no skills required
  if (freelancerSkills.length === 0) return 0;

  const matchedSkills = requiredSkills.filter((skill) =>
    freelancerSkills.some(
      (fs) => fs.toLowerCase() === skill.toLowerCase()
    )
  );

  return (matchedSkills.length / requiredSkills.length) * 100;
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
 * Based on historical client ratings
 */
async function calculateRatingsScore(
  ctx: any,
  freelancerId: string
): Promise<number> {
  // For now, return neutral score
  // TODO: Implement ratings system when available
  // This would query a ratings/reviews table
  return 50;
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

/**
 * Generate matches for a project
 * This is called when a project is funded and ready for matching
 * Can be called as an action (from webhook) or scheduled action
 */
export const generateMatches = action({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()), // Default: 5
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;

    // Get project directly from database (internal action, no auth needed)
    const project = await ctx.runQuery(internal.projects.queries.getProjectInternal, {
      projectId: args.projectId,
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Only match funded projects
    if (project.status !== "funded") {
      throw new Error("Project must be funded before matching");
    }

    // Get all verified freelancers directly from database
    // Query users with freelancer role and approved verification status
    const allUsers = await ctx.runQuery(internal.users.queries.getAllUsers, {});
    
    // Filter to verified freelancers
    const verifiedFreelancers = (allUsers || []).filter(
      (u: any) =>
        u.role === "freelancer" &&
        u.status === "active" &&
        u.verificationStatus === "approved"
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
      return [];
    }

    // Calculate scores for each freelancer
    const scores: Array<{
      freelancer: Doc<"users">;
      vettingResult: any;
      score: number;
      breakdown: ScoringBreakdown;
    }> = [];

    for (const vettingResult of approvedFreelancers) {
      const freelancer = vettingResult.freelancer;

      // Skip if freelancer already matched to this project
      const existingMatch = await ctx.runQuery(
        internal.matching.queries.getMatch,
        {
          projectId: args.projectId,
          freelancerId: freelancer._id,
        }
      );

      if (existingMatch) continue;

      // Calculate scoring breakdown
      const skillOverlap = calculateSkillOverlap(
        project.intakeForm.requiredSkills || [],
        freelancer.profile?.skills || []
      );

      const vettingScore = vettingResult?.overallScore || 0;
      const ratings = await calculateRatingsScore(ctx, freelancer._id);
      const availability = calculateAvailabilityScore(
        freelancer.profile?.availability
      );
      const pastPerformance = await calculatePastPerformance(
        ctx,
        freelancer._id
      );
      const timezoneCompatibility = calculateTimezoneCompatibility(
        undefined, // Projects don't have timezone field
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

      // Calculate weighted overall score
      const overallScore =
        skillOverlap * 0.4 +
        vettingScore * 0.25 +
        ratings * 0.15 +
        availability * 0.1 +
        pastPerformance * 0.1;

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

    return matchIds;
  },
});

