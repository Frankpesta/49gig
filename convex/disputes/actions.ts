// @ts-nocheck
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";

/**
 * Automated dispute resolution
 * Attempts to resolve disputes based on predefined rules
 */
export const attemptAutomatedResolution = action({
  args: {
    disputeId: v.id("disputes"),
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.runQuery(api.disputes.queries.getDispute, {
      disputeId: args.disputeId,
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    if (dispute.status !== "open") {
      return { canAutoResolve: false, reason: "Dispute not in open status" };
    }

    // Actions have no viewer identity — use internal query (getProject requires userId + auth).
    const project = await ctx.runQuery(internal.projects.queries.getProjectInternal, {
      projectId: dispute.projectId,
    });

    if (!project) {
      throw new Error("Project not found");
    }

    // Rule 1: Work/deliverable quality dispute - if monthly cycle is overdue by >7 days, favor client
    if (dispute.type === "milestone_quality") {
      if (dispute.monthlyCycleId) {
        const cycle = await ctx.runQuery(
          (api as any)["monthlyBillingCycles/queries"].getCycleById,
          { monthlyCycleId: dispute.monthlyCycleId }
        );
        if (cycle?.monthEndDate) {
          const daysOverdue = (Date.now() - cycle.monthEndDate) / (1000 * 60 * 60 * 24);
          if (daysOverdue > 7) {
            await ctx.runMutation(internal.disputes.mutations.resolveDisputeInternal, {
              disputeId: args.disputeId,
              decision: "client_favor",
              notes: `Automated resolution: Monthly period overdue by ${Math.round(daysOverdue)} days`,
            });
            return { canAutoResolve: true, resolved: true, decision: "client_favor" };
          }
        }
      } else if (dispute.milestoneId) {
        const milestone = await ctx.runQuery(
          (api as any)["projects/queries"].getMilestoneById,
          { milestoneId: dispute.milestoneId }
        );
        if (milestone?.dueDate) {
          const daysOverdue = (Date.now() - milestone.dueDate) / (1000 * 60 * 60 * 24);
          if (daysOverdue > 7) {
            await ctx.runMutation(internal.disputes.mutations.resolveDisputeInternal, {
              disputeId: args.disputeId,
              decision: "client_favor",
              notes: `Automated resolution: Milestone overdue by ${Math.round(daysOverdue)} days`,
            });
            return { canAutoResolve: true, resolved: true, decision: "client_favor" };
          }
        }
      }
    }

    // Rule 2: If communication dispute and no messages in chat for >3 days, favor client
    if (dispute.type === "communication") {
      // Get project chat
      const chat = await ctx.runQuery(api.chat.queries.getProjectChat, {
        projectId: dispute.projectId,
      });

      if (chat) {
        const messages = await ctx.runQuery(api.chat.queries.getMessages, {
          chatId: chat._id,
          limit: 1,
        });

        if (messages.length > 0) {
          const lastMessageTime = messages[messages.length - 1].createdAt;
          const daysSinceLastMessage =
            (Date.now() - lastMessageTime) / (1000 * 60 * 60 * 24);

          if (daysSinceLastMessage > 3) {
            // Auto-resolve in client's favor
            await ctx.runMutation(internal.disputes.mutations.resolveDisputeInternal, {
              disputeId: args.disputeId,
              decision: "client_favor",
              notes: `Automated resolution: No communication for ${Math.round(daysSinceLastMessage)} days`,
            });

            return {
              canAutoResolve: true,
              resolved: true,
              decision: "client_favor",
            };
          }
        }
      }
    }

    // Rule 3: Payment dispute - if monthly cycle was already approved/released, favor freelancer
    if (dispute.type === "payment") {
      if (dispute.monthlyCycleId) {
        const cycle = await ctx.runQuery(
          (api as any)["monthlyBillingCycles/queries"].getCycleById,
          { monthlyCycleId: dispute.monthlyCycleId }
        );
        if (cycle?.status === "approved") {
          await ctx.runMutation(internal.disputes.mutations.resolveDisputeInternal, {
            disputeId: args.disputeId,
            decision: "freelancer_favor",
            notes: "Automated resolution: Monthly payment was already released",
          });
          return { canAutoResolve: true, resolved: true, decision: "freelancer_favor" };
        }
      } else if (dispute.milestoneId) {
        const payments = await ctx.runQuery(
          internal.payments.queries.getPaymentsByProjectInternal,
          { projectId: dispute.projectId }
        );
        const milestonePayment = payments?.find(
          (p: any) => p.milestoneId === dispute.milestoneId && p.status === "succeeded"
        );
        if (milestonePayment) {
          await ctx.runMutation(internal.disputes.mutations.resolveDisputeInternal, {
            disputeId: args.disputeId,
            decision: "freelancer_favor",
            notes: "Automated resolution: Payment was successful",
          });
          return { canAutoResolve: true, resolved: true, decision: "freelancer_favor" };
        }
      }
    }

    // Cannot auto-resolve
    return {
      canAutoResolve: false,
      reason: "No automated resolution rules apply",
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

    if (decision === "client_favor") {
      await ctx.runMutation(
        internal.monthlyBillingCycles.mutations.finalizeClientWinsDisputeInternal,
        {
          projectId: dispute.projectId,
          disputeId: args.disputeId,
          currency,
        }
      );
    } else if (decision === "freelancer_favor") {
      // Unblock work only — escrow stays until normal monthly approval / auto-release.
      if (dispute.monthlyCycleId) {
        await ctx.runMutation(
          internal.monthlyBillingCycles.mutations.clearMonthlyCycleDisputeInternal,
          { monthlyCycleId: dispute.monthlyCycleId }
        );
      }
    } else if (decision === "partial") {
      if (resolutionAmount != null && resolutionAmount > 0) {
        const escrowCents = Math.round(Math.max(0, project.escrowedAmount ?? 0) * 100);
        const freelancerCents = Math.min(resolutionAmount, escrowCents);
        const clientCents = Math.max(0, escrowCents - freelancerCents);
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
            }
          );
        }
        // Full escrow was split; cancel unreleased cycles so they cannot be approved again.
        await ctx.runMutation(
          internal.monthlyBillingCycles.mutations.cancelPendingAndDisputedCyclesInternal,
          { projectId: dispute.projectId }
        );
      }
    } else if (decision === "replacement") {
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

