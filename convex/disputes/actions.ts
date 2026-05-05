// @ts-nocheck
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { clientRefundGrossAndNetEscrowRemoval } from "./amounts";
import { assertUsdCurrency } from "../currencyPolicy";

/**
 * Automated dispute resolution is disabled — disputes require staff judgment and manual enforcement.
 */
export const attemptAutomatedResolution = action({
  args: {
    disputeId: v.id("disputes"),
  },
  handler: async () => {
    return {
      canAutoResolve: false as const,
      reason: "Automated dispute resolution is disabled; staff enforcement is required.",
    };
  },
});

/**
 * Release funds based on dispute resolution
 * Called after dispute is resolved.
 * Uses monthly payment model: credits freelancer wallet(s) and reduces escrow.
 */
export const releaseDisputeFunds = action({
  args: {
    disputeId: v.id("disputes"),
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.runQuery(internal.disputes.queries.internalGetDispute, {
      disputeId: args.disputeId,
    });

    if (!dispute || dispute.status !== "resolved" || !dispute.resolution) {
      throw new Error("Dispute not resolved");
    }

    const project = await ctx.runQuery(internal.projects.queries.getProjectInternal, {
      projectId: dispute.projectId,
    });

    if (!project) {
      throw new Error("Project not found");
    }

    const { decision, resolutionAmount } = dispute.resolution;
    const basePayment = await ctx.runQuery(
      internal.payments.queries.getPaymentByProject,
      { projectId: dispute.projectId }
    );
    const currency = (basePayment?.currency || project.currency || "usd").toLowerCase();
    assertUsdCurrency(currency, "releaseDisputeFunds");

    const teamMemberIds: string[] = (project as any).matchedFreelancerIds ?? [];
    const disputedIds: string[] = (dispute as any).disputedFreelancerIds ?? [];
    const hasTeamBasisSnapshot =
      (dispute as any).teamEscrowBasisFreelancerIds?.length > 0;
    let teamBasis: string[] = hasTeamBasisSnapshot
      ? (dispute as any).teamEscrowBasisFreelancerIds.map(String)
      : teamMemberIds.map(String);
    if (!hasTeamBasisSnapshot && disputedIds.length > 0) {
      const set = new Set(teamBasis);
      for (const id of disputedIds) set.add(String(id));
      teamBasis = Array.from(set);
    }
    const isPartialTeam =
      teamBasis.length > 0 &&
      disputedIds.length > 0 &&
      disputedIds.every((id) => teamBasis.includes(String(id))) &&
      disputedIds.length < teamBasis.length;

    if (decision === "client_favor") {
      const defaultFee = await ctx.runQuery(
        internal.platformSettings.queries.getPlatformFeePercentageInternal,
        {}
      );
      const feePct = (project as any).platformFee ?? defaultFee;
      const escrowNetNow = Math.max(0, (project as any).escrowedAmount ?? 0);

      let disputedNetCentsForPartial = 0;
      if (isPartialTeam) {
        if (dispute.monthlyCycleId) {
          const c = await ctx.runQuery(
            internal.disputes.queries.computeDisputedMonthlyCycleShareCentsInternal,
            { disputeId: args.disputeId }
          );
          disputedNetCentsForPartial = c.disputedNetCents;
        } else {
          const c = await ctx.runQuery(
            internal.disputes.queries.computeDisputedTeamEscrowNetCentsFromDisputeInternal,
            { disputeId: args.disputeId }
          );
          disputedNetCentsForPartial = c.disputedNetCents;
        }
      }

      const disputedSliceNetUsd = isPartialTeam
        ? disputedNetCentsForPartial / 100
        : undefined;

      const { appliedRefundGrossUsd, netRemovalFromEscrowUsd, cappedVsSnapshot } =
        clientRefundGrossAndNetEscrowRemoval({
          lockedSnapshotGrossUsd: Math.max(0, dispute.lockedAmount ?? 0),
          escrowNetUsdNow: escrowNetNow,
          platformFeePercentEffective: feePct,
          disputedEscrowNetUsdMax: disputedSliceNetUsd,
        });

      const pendingRefundCents = Math.round(appliedRefundGrossUsd * 100);
      if (pendingRefundCents > 0) {
        await ctx.runMutation(internal.wallets.mutations.recordPendingRefund, {
          userId: project.clientId,
          amountCents: pendingRefundCents,
          currency,
          description: isPartialTeam
            ? `Pending dispute refund — locked amount (${String(disputedIds.length)} seat(s)) for ${project.intakeForm.title}`
            : `Pending dispute refund — locked amount for ${project.intakeForm.title}`,
          projectId: dispute.projectId,
        });
      }

      if (netRemovalFromEscrowUsd > 0) {
        await ctx.runMutation(internal.projects.mutations.adjustProjectEscrowInternal, {
          projectId: dispute.projectId,
          deltaDollars: -netRemovalFromEscrowUsd,
        });
      }

      if (cappedVsSnapshot) {
        await ctx.runMutation(internal.disputes.mutations.logDisputeClientRefundCapInternal, {
          disputeId: args.disputeId,
          projectId: dispute.projectId,
          clientId: project.clientId,
          snapshotLockedGrossUsd: dispute.lockedAmount ?? 0,
          appliedRefundGrossUsd,
        });
      }

      if (!isPartialTeam && dispute.monthlyCycleId) {
        await ctx.runMutation(
          internal.monthlyBillingCycles.mutations.cancelDisputedMonthlyCycleInternal,
          { monthlyCycleId: dispute.monthlyCycleId }
        );
      } else if (isPartialTeam && dispute.monthlyCycleId) {
        const removeCents = Math.min(
          disputedNetCentsForPartial,
          Math.round(netRemovalFromEscrowUsd * 100)
        );
        if (removeCents > 0) {
          await ctx.runMutation(
            internal.monthlyBillingCycles.mutations.applyPartialDisputeCycleReductionInternal,
            {
              monthlyCycleId: dispute.monthlyCycleId,
              removeCents,
            }
          );
        }
      }
    }
    
    if (decision === "freelancer_favor") {
      if (dispute.monthlyCycleId) {
        await ctx.runMutation(
          internal.monthlyBillingCycles.mutations
            .releaseMonthlyCycleAfterFreelancerFavorJudgmentInternal,
          {
            disputeId: args.disputeId,
            monthlyCycleId: dispute.monthlyCycleId,
          }
        );
      } else {
        const { scopeCents } = await ctx.runQuery(
          internal.disputes.queries.disputeNetScopeFreelancerNetCentsInternal,
          { disputeId: args.disputeId }
        );
        const payCents = Math.min(
          scopeCents,
          Math.round(Math.max(0, (project as any).escrowedAmount ?? 0) * 100)
        );
        if (payCents > 0) {
          await ctx.runMutation(
            internal.monthlyBillingCycles.mutations.releaseDisputeFundsToWalletInternal,
            {
              projectId: dispute.projectId,
              disputeId: args.disputeId,
              amountCents: payCents,
              currency,
              monthlyCycleId: undefined,
              freelancerIds: isPartialTeam ? (dispute as any).disputedFreelancerIds : undefined,
            }
          );
        }
      }
    } else if (decision === "partial") {
      if (resolutionAmount != null && resolutionAmount > 0) {
        const { scopeCents: scopeFromDispute } = await ctx.runQuery(
          internal.disputes.queries.disputeNetScopeFreelancerNetCentsInternal,
          { disputeId: args.disputeId }
        );
        const scopeCents = Math.min(
          scopeFromDispute,
          Math.round(Math.max(0, (project as any).escrowedAmount ?? 0) * 100)
        );

        const freelancerCents = Math.min(resolutionAmount, scopeCents);
        const clientCents = Math.max(0, scopeCents - freelancerCents);
        if (clientCents > 0) {
          await ctx.runMutation(
            internal.monthlyBillingCycles.mutations.creditClientWalletFromEscrowInternal,
            {
              projectId: dispute.projectId,
              amountCents: clientCents,
              currency,
              description: `Dispute partial resolution — credited to your balance (${project.intakeForm.title})`,
            }
          );
        }
        if (freelancerCents > 0) {
          await ctx.runMutation(
            internal.monthlyBillingCycles.mutations.releaseDisputeFundsToWalletInternal,
            {
              projectId: dispute.projectId,
              disputeId: args.disputeId,
              amountCents: freelancerCents,
              currency,
              // Do not mark cycle approved here; split may be less than one full cycle.
              monthlyCycleId: undefined,
              freelancerIds: isPartialTeam ? disputedIds : undefined,
            }
          );
        }
        if (dispute.monthlyCycleId) {
          await ctx.runMutation(
            internal.monthlyBillingCycles.mutations.cancelDisputedMonthlyCycleInternal,
            { monthlyCycleId: dispute.monthlyCycleId }
          );
        } else if (!isPartialTeam) {
          // Full escrow was split; cancel unreleased cycles so they cannot be approved again.
          await ctx.runMutation(
            internal.monthlyBillingCycles.mutations.cancelPendingAndDisputedCyclesInternal,
            { projectId: dispute.projectId }
          );
        }
      }
    } else if (decision === "replacement") {
      if (dispute.monthlyCycleId) {
        await ctx.runMutation(
          internal.monthlyBillingCycles.mutations.cancelDisputedMonthlyCycleInternal,
          { monthlyCycleId: dispute.monthlyCycleId }
        );
      }
      const result = await ctx.runMutation(
        internal.projects.replacement.applyFreelancerReplacementInternal,
        {
          projectId: dispute.projectId,
          disputeId: args.disputeId,
        }
      );
      if (result.applied) {
        if (result.isTeam) {
          await ctx.runAction(api.matching.actions.generateTeamMatches, {
            projectId: dispute.projectId,
          });
        } else {
          await ctx.runAction(api.matching.actions.generateMatches, {
            projectId: dispute.projectId,
          });
        }
      }
    }

    return { success: true };
  },
});

