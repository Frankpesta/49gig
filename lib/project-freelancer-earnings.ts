/**
 * Freelancer-facing totals for a hire (net of platform fee, team = this person's share).
 */

import { getDurationMonths } from "./project-duration";
import { teamSlotsToMatchSpecs, type TeamSlotIntake } from "./team-slots";
import { DEFAULT_PLATFORM_FEE_PERCENT } from "./platform-fee";

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
  const fee = project.platformFee ?? DEFAULT_PLATFORM_FEE_PERCENT;
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

/**
 * Same weighted split as Convex `computeTeamPoolShareCentsByFreelancerId`.
 * Keys in the map match `freelancerIdsOrdered` string ids.
 */
export function splitFreelancerNetPoolCentsByTeamOrdered(
  totalPoolCents: number,
  freelancerIdsOrdered: string[],
  teamRolesByFreelancerId: Map<string, string | undefined>,
  teamBudgetBreakdown: Record<string, number> | undefined,
  teamSlots: TeamSlotIntake[] | undefined
): Map<string, number> {
  const out = new Map<string, number>();
  const n = freelancerIdsOrdered.length;
  if (n === 0 || totalPoolCents <= 0) return out;

  let shareCentsByIndex: number[];

  if (
    teamBudgetBreakdown &&
    Object.keys(teamBudgetBreakdown).length > 0 &&
    n > 1
  ) {
    const weights = freelancerIdsOrdered.map((fid) => {
      const teamRole = teamRolesByFreelancerId.get(fid);
      const budgetKey = budgetRoleKeyForMatchTeamRole(teamRole, teamSlots);
      if (
        budgetKey &&
        teamBudgetBreakdown[budgetKey] != null &&
        Number.isFinite(teamBudgetBreakdown[budgetKey])
      ) {
        return Math.max(0, teamBudgetBreakdown[budgetKey]!);
      }
      return 0;
    });

    const sumW = weights.reduce((a, b) => a + b, 0);
    if (sumW <= 0) {
      const amountPer = Math.floor(totalPoolCents / n);
      const remainder = totalPoolCents - amountPer * n;
      shareCentsByIndex = freelancerIdsOrdered.map((_, i) =>
        amountPer + (i === 0 ? remainder : 0)
      );
    } else {
      let allocated = 0;
      shareCentsByIndex = freelancerIdsOrdered.map((_, i) => {
        const w = weights[i] ?? 0;
        if (i === n - 1) {
          return Math.max(0, totalPoolCents - allocated);
        }
        const share = Math.floor((totalPoolCents * w) / sumW);
        allocated += share;
        return share;
      });
    }
  } else {
    const amountPer = Math.floor(totalPoolCents / n);
    const remainder = totalPoolCents - amountPer * n;
    shareCentsByIndex = freelancerIdsOrdered.map((_, i) =>
      amountPer + (i === 0 ? remainder : 0)
    );
  }

  for (let i = 0; i < n; i++) {
    const fid = freelancerIdsOrdered[i];
    out.set(fid, Math.max(0, shareCentsByIndex[i] ?? 0));
  }
  return out;
}

/**
 * Estimated or actual freelancer-net cents for **this viewer** for one monthly escrow pool cycle.
 */
export function freelancerMonthlyNetPoolShareCents(opts: {
  project: Pick<
    ProjectLikeForFreelancerEarnings,
    "matchedFreelancerIds" | "matchedFreelancerId" | "teamBudgetBreakdown" | "intakeForm"
  >;
  confirmedTeamMembers: Array<{ _id: string; teamRole?: string }>;
  poolCents: number;
  releasedFreelancerCents?: Record<string, number>;
  viewerUserId: string;
}): number {
  const viewerKey = opts.viewerUserId;
  const released = opts.releasedFreelancerCents?.[viewerKey];
  if (released != null && Number.isFinite(released)) {
    return Math.max(0, released);
  }
  const { project } = opts;
  if (project.intakeForm.hireType !== "team") {
    return Math.max(0, opts.poolCents);
  }

  let orderedIds: string[] = [];
  if (project.matchedFreelancerIds && project.matchedFreelancerIds.length > 0) {
    orderedIds = project.matchedFreelancerIds.map(String);
  } else if (opts.confirmedTeamMembers.length > 0) {
    orderedIds = opts.confirmedTeamMembers.map((m) => String(m._id));
  } else if (project.matchedFreelancerId) {
    orderedIds = [String(project.matchedFreelancerId)];
  }

  if (orderedIds.length === 0) return 0;

  const rolesMap = new Map<string, string | undefined>(
    opts.confirmedTeamMembers.map((m) => [String(m._id), m.teamRole])
  );

  const shareMap = splitFreelancerNetPoolCentsByTeamOrdered(
    opts.poolCents,
    orderedIds,
    rolesMap,
    project.teamBudgetBreakdown,
    project.intakeForm.teamSlots
  );
  return Math.max(0, shareMap.get(viewerKey) ?? 0);
}
