import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

type DbCtx = QueryCtx | MutationCtx;

/**
 * Split a total escrow pool (cents, freelancer-net) across team members using the same
 * rules as monthly cycle approval: role weights from teamBudgetBreakdown (cents per role)
 * plus accepted match teamRole, else equal split.
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

    const equalShare = Math.floor(totalPoolCents / freelancerIds.length);
    shareCentsByFreelancer = freelancerIds.map((fid) => {
      const match = acceptedByFreelancer.get(fid);
      const role = match?.teamRole;
      const roleAmount =
        role && breakdownHasRole(teamBudgetBreakdown, role)
          ? teamBudgetBreakdown[role]!
          : equalShare;
      return Math.max(0, roleAmount);
    });

    const totalAllocated = shareCentsByFreelancer.reduce((a, b) => a + b, 0);
    const remainder = totalPoolCents - totalAllocated;
    if (remainder !== 0 && shareCentsByFreelancer.length > 0) {
      shareCentsByFreelancer = [...shareCentsByFreelancer];
      shareCentsByFreelancer[0] += remainder;
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

function breakdownHasRole(
  breakdown: Record<string, number>,
  role: string
): boolean {
  return breakdown[role] != null && Number.isFinite(breakdown[role]);
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
