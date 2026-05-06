import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { budgetRoleKeyForMatchTeamRole } from "../lib/project-freelancer-earnings";
import type { TeamSlotIntake } from "../lib/team-slots";

type DbCtx = QueryCtx | MutationCtx;

/**
 * Split a total escrow pool (cents, freelancer-net) across team members using the same
 * pricing weights as `teamBudgetBreakdown`: values are **monthly** cents per budget role
 * (see `computeTeamBudgetBreakdown`). Keys are budget role keys (`fullstack_dev`, …), not
 * match `teamRole` labels — map seat labels via `budgetRoleKeyForMatchTeamRole`, then allocate
 * `totalPoolCents` in proportion to those weights. Falls back to equal split when weights missing.
 */
export async function computeTeamPoolShareCentsByFreelancerId(
  ctx: DbCtx,
  projectId: Id<"projects">,
  freelancerIds: Id<"users">[],
  teamBudgetBreakdown: Record<string, number> | undefined,
  totalPoolCents: number
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (freelancerIds.length === 0 || totalPoolCents <= 0) {
    return out;
  }

  let shareCentsByFreelancer: number[];

  if (
    teamBudgetBreakdown &&
    Object.keys(teamBudgetBreakdown).length > 0 &&
    freelancerIds.length > 1
  ) {
    const project = await ctx.db.get(projectId);
    const slots = (project?.intakeForm?.teamSlots ?? []) as TeamSlotIntake[];

    const acceptedMatches = await ctx.db
      .query("matches")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    const acceptedByFreelancer = new Map(
      acceptedMatches
        .filter(
          (m) => m.status === "accepted" && freelancerIds.includes(m.freelancerId)
        )
        .map((m) => [m.freelancerId, m])
    );

    const weights = freelancerIds.map((fid) => {
      const match = acceptedByFreelancer.get(fid);
      const budgetKey = budgetRoleKeyForMatchTeamRole(match?.teamRole, slots);
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
      const amountPer = Math.floor(totalPoolCents / freelancerIds.length);
      const remainder = totalPoolCents - amountPer * freelancerIds.length;
      shareCentsByFreelancer = freelancerIds.map((_, i) =>
        amountPer + (i === 0 ? remainder : 0)
      );
    } else {
      let allocated = 0;
      shareCentsByFreelancer = freelancerIds.map((_, i) => {
        const w = weights[i] ?? 0;
        if (i === freelancerIds.length - 1) {
          return Math.max(0, totalPoolCents - allocated);
        }
        const share = Math.floor((totalPoolCents * w) / sumW);
        allocated += share;
        return share;
      });
    }
  } else {
    const amountPer = Math.floor(totalPoolCents / freelancerIds.length);
    const remainder = totalPoolCents - amountPer * freelancerIds.length;
    shareCentsByFreelancer = freelancerIds.map((_, i) =>
      amountPer + (i === 0 ? remainder : 0)
    );
  }

  for (let i = 0; i < freelancerIds.length; i++) {
    const fid = freelancerIds[i];
    out.set(String(fid), Math.max(0, shareCentsByFreelancer[i] ?? 0));
  }
  return out;
}

/** Sum pool shares (cents) for the given freelancer ids using the computed map. */
export function sumShareCentsForFreelancers(
  shareByFreelancerId: Map<string, number>,
  freelancerIds: Id<"users">[]
): number {
  let sum = 0;
  for (const fid of freelancerIds) {
    sum += shareByFreelancerId.get(String(fid)) ?? 0;
  }
  return Math.max(0, sum);
}

/** Matched team basis for economics (snapshot + legacy union fallback). */
export function teamBasisUserIdsForDispute(
  dispute: Doc<"disputes">,
  project: Doc<"projects">
): Id<"users">[] {
  const disputedIds = dispute.disputedFreelancerIds ?? [];
  let teamBasis: Id<"users">[] =
    dispute.teamEscrowBasisFreelancerIds &&
    dispute.teamEscrowBasisFreelancerIds.length > 0
      ? dispute.teamEscrowBasisFreelancerIds
      : [...(project.matchedFreelancerIds ?? [])];

  if (
    disputedIds.length > 0 &&
    (!dispute.teamEscrowBasisFreelancerIds ||
      dispute.teamEscrowBasisFreelancerIds.length === 0)
  ) {
    const set = new Set(teamBasis.map(String));
    for (const id of disputedIds) set.add(String(id));
    teamBasis = Array.from(set) as Id<"users">[];
  }
  return teamBasis;
}
