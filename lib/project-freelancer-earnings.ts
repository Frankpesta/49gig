/**
 * Freelancer-facing totals for a hire (net of platform fee, team = this person's share).
 */

import { getDurationMonths } from "./project-duration";
import { teamSlotsToMatchSpecs, type TeamSlotIntake } from "./team-slots";

function roundUsd2(n: number): number {
  return Math.round(Math.max(0, n) * 100) / 100;
}

/** Map `match.teamRole` (seat label) to budget-calculator role key (breakdown key). */
export function budgetRoleKeyForMatchTeamRole(
  teamRole: string | undefined,
  teamSlots: TeamSlotIntake[] | undefined
): string | null {
  if (!teamRole?.trim() || !teamSlots?.length) return null;
  const specs = teamSlotsToMatchSpecs(teamSlots);
  const spec = specs.find((s) => s.teamRoleLabel === teamRole);
  return spec?.roleKey ?? null;
}

export type ProjectLikeForFreelancerEarnings = {
  totalAmount: number;
  platformFee?: number;
  teamBudgetBreakdown?: Record<string, number>;
  intakeForm: {
    hireType?: string;
    teamSlots?: TeamSlotIntake[];
    projectDuration?: string;
    startDate?: number;
    endDate?: number;
    /** Exact headcount for team hires */
    teamMemberCount?: number;
  };
  matchedFreelancerIds?: string[];
  matchedFreelancerId?: string;
};

/**
 * Estimated freelancer-net USD for this freelancer for the full engagement duration.
 * - Single hire: full net contract total.
 * - Team: per-seat share from `teamBudgetBreakdown` when mappable; otherwise equal split of net total by team size.
 */
export function freelancerEngagementNetTotalUsd(
  project: ProjectLikeForFreelancerEarnings,
  viewerTeamRole: string | undefined
): number {
  const fee = project.platformFee ?? 25;
  const netTotal = (project.totalAmount * (100 - fee)) / 100;
  const months = Math.max(
    1,
    getDurationMonths(project.intakeForm.projectDuration)
  );

  const isTeam = project.intakeForm.hireType === "team";
  if (!isTeam) {
    return roundUsd2(netTotal);
  }

  const breakdown = project.teamBudgetBreakdown;
  const slots = project.intakeForm.teamSlots;
  const budgetKey = budgetRoleKeyForMatchTeamRole(viewerTeamRole, slots);

  if (
    budgetKey &&
    breakdown &&
    typeof breakdown[budgetKey] === "number" &&
    Number.isFinite(breakdown[budgetKey])
  ) {
    const monthlyNetUsd = breakdown[budgetKey] / 100;
    return roundUsd2(monthlyNetUsd * months);
  }

  const matchedN = project.matchedFreelancerIds?.length
    ? project.matchedFreelancerIds.length
    : project.matchedFreelancerId
      ? 1
      : 0;
  const teamSize = Math.max(
    1,
    project.intakeForm.teamMemberCount ?? matchedN ?? 1
  );
  return roundUsd2(netTotal / teamSize);
}
