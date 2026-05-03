/**
 * Canonical dispute “economics”: which freelancer-net pool is subdivided among which seats,
 * and how seat-level visibility matches initiateDispute / enforcement scope.
 */

import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import {
  computeTeamPoolShareCentsByFreelancerId,
  sumShareCentsForFreelancers,
  teamBasisUserIdsForDispute,
} from "../teamEscrowShares";

export type DbLikeCtx = QueryCtx | MutationCtx;

/**
 * Snapshot pool (freelancer net, integer cents) used when opening the dispute to compute
 * `lockedAmount` and per-seat splits. Prefer this over recomputing from live escrow so seat
 * numbers stay aligned with filing + client gross snapshot across time.
 *
 * Fallback (legacy disputes): monthly cycle → `amountCents`; else → current project escrow net.
 */
export async function resolvedLockedEconomicsFreelancerNetPoolCents(
  ctx: DbLikeCtx,
  dispute: Doc<"disputes">,
  project: Doc<"projects">
): Promise<number> {
  const snap = dispute.lockedEconomicsFreelancerNetPoolCents;
  if (snap != null && Number.isFinite(snap)) {
    return Math.max(0, Math.round(snap));
  }

  if (dispute.monthlyCycleId != null) {
    const cycle = await ctx.db.get(dispute.monthlyCycleId);
    return Math.max(0, Math.round(cycle?.amountCents ?? 0));
  }

  return Math.max(0, Math.round(Math.max(0, project.escrowedAmount ?? 0) * 100));
}

/**
 * Team/solo freelancer-net USD visible to one freelancer party for `lockedAmount`.
 * Uses the same seat-weight rules as initiation / `disputeNetScopeCents`:
 * subdivide snapshot pool cents across stored team basis IDs.
 */
export async function freelancerSeatLockedEconomicsFreelancerNetUsd(
  ctx: DbLikeCtx,
  dispute: Doc<"disputes">,
  project: Doc<"projects">,
  freelancerUserId: Id<"users">
): Promise<number> {
  const poolCents = await resolvedLockedEconomicsFreelancerNetPoolCents(
    ctx,
    dispute,
    project
  );

  let basisIds = teamBasisUserIdsForDispute(dispute, project);
  if (
    basisIds.length === 0 &&
    project.matchedFreelancerId != null &&
    dispute.teamEscrowBasisFreelancerIds == null &&
    dispute.disputedFreelancerIds == null
  ) {
    basisIds = [project.matchedFreelancerId];
  }
  if (basisIds.length === 0 && (project.matchedFreelancerIds?.length ?? 0) === 1) {
    const only = project.matchedFreelancerIds![0]!;
    basisIds = [only];
  }

  if (basisIds.length === 0) {
    return 0;
  }

  if (basisIds.length === 1) {
    const only = basisIds[0];
    return String(only) === String(freelancerUserId)
      ? Math.round(poolCents) / 100
      : 0;
  }

  const shareMap = await computeTeamPoolShareCentsByFreelancerId(
    ctx,
    dispute.projectId,
    basisIds,
    project.teamBudgetBreakdown,
    poolCents
  );
  return Math.round(shareMap.get(String(freelancerUserId)) ?? 0) / 100;
}

/**
 * Freelancer-net cents in scope for this dispute (full pool or disputed seats only on partial team).
 * Used for partial judgments and validation.
 */
export async function disputeNetScopeFreelancerNetCents(
  ctx: DbLikeCtx,
  project: Doc<"projects">,
  dispute: Doc<"disputes">
): Promise<number> {
  const teamBasis =
    dispute.teamEscrowBasisFreelancerIds && dispute.teamEscrowBasisFreelancerIds.length > 0
      ? dispute.teamEscrowBasisFreelancerIds
      : project.matchedFreelancerIds ?? [];
  const disputedIds = dispute.disputedFreelancerIds ?? [];
  const isPartialTeam =
    teamBasis.length > 0 &&
    disputedIds.length > 0 &&
    disputedIds.length < teamBasis.length;
  const poolCents = await resolvedLockedEconomicsFreelancerNetPoolCents(
    ctx,
    dispute,
    project
  );

  if (!isPartialTeam) {
    return poolCents;
  }

  const shareMap = await computeTeamPoolShareCentsByFreelancerId(
    ctx,
    project._id,
    teamBasis,
    project.teamBudgetBreakdown,
    poolCents
  );
  return sumShareCentsForFreelancers(shareMap, disputedIds);
}
