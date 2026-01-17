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

    // Get project
    const project = await ctx.runQuery(
      (api as any)["projects/queries"].getProject,
      { projectId: dispute.projectId }
    );

    if (!project) {
      throw new Error("Project not found");
    }

    // Automated resolution rules
    // Rule 1: If milestone_quality dispute and milestone is overdue by >7 days, favor client
    if (dispute.type === "milestone_quality" && dispute.milestoneId) {
      const milestone = await ctx.runQuery(
        (api as any)["projects/queries"].getMilestoneById,
        { milestoneId: dispute.milestoneId }
      );

      if (milestone && milestone.dueDate) {
        const daysOverdue =
          (Date.now() - milestone.dueDate) / (1000 * 60 * 60 * 24);
        if (daysOverdue > 7) {
          // Auto-resolve in client's favor
          await ctx.runMutation(api.disputes.mutations.resolveDispute, {
            disputeId: args.disputeId,
            decision: "client_favor",
            notes: `Automated resolution: Milestone overdue by ${Math.round(daysOverdue)} days`,
          });

          return {
            canAutoResolve: true,
            resolved: true,
            decision: "client_favor",
          };
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
            await ctx.runMutation(api.disputes.mutations.resolveDispute, {
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

    // Rule 3: If payment dispute and payment was successful, favor freelancer
    if (dispute.type === "payment" && dispute.milestoneId) {
      const payments = await ctx.runQuery(
        (api as any)["payments/queries"].getPaymentByProject,
        { projectId: dispute.projectId }
      );

      // Check if milestone payment was successful
      const milestonePayment = payments?.find(
        (p: any) => p.milestoneId === dispute.milestoneId && p.status === "succeeded"
      );

      if (milestonePayment) {
        // Auto-resolve in freelancer's favor
        await ctx.runMutation(api.disputes.mutations.resolveDispute, {
          disputeId: args.disputeId,
          decision: "freelancer_favor",
          notes: "Automated resolution: Payment was successful",
        });

        return {
          canAutoResolve: true,
          resolved: true,
          decision: "freelancer_favor",
        };
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
 * Called after dispute is resolved
 */
export const releaseDisputeFunds = action({
  args: {
    disputeId: v.id("disputes"),
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.runQuery(api.disputes.queries.getDispute, {
      disputeId: args.disputeId,
    });

    if (!dispute || !dispute.resolution) {
      throw new Error("Dispute not resolved");
    }

    // Get project
    const project = await ctx.runQuery(
      (api as any)["projects/queries"].getProject,
      { projectId: dispute.projectId }
    );

    if (!project) {
      throw new Error("Project not found");
    }

    const { decision, resolutionAmount } = dispute.resolution;
    const basePayment = await ctx.runQuery(
      internal.payments.queries.getPaymentByProject,
      { projectId: dispute.projectId }
    );
    const currency = basePayment?.currency || "usd";

    // Handle fund release based on decision
    if (decision === "client_favor") {
      // Refund to client
      await ctx.runAction(api.payments.actions.refundPaymentIntent, {
        projectId: dispute.projectId,
        amount: dispute.lockedAmount,
        reason: "dispute_client_favor",
      });
      await ctx.runMutation(
        (api as any)["projects/mutations"].updateProjectStatusInternal,
        {
          projectId: dispute.projectId,
          status: "cancelled",
          escrowedAmount: 0, // Release all funds
        }
      );
    } else if (decision === "freelancer_favor") {
      // Release to freelancer
      if (project.matchedFreelancerId) {
        await ctx.runAction(api.payments.actions.createPayoutTransfer, {
          projectId: dispute.projectId,
          freelancerId: project.matchedFreelancerId,
          milestoneId: dispute.milestoneId,
          amount: resolutionAmount || dispute.lockedAmount,
          currency,
        });
      }
    } else if (decision === "partial") {
      // Split funds
      if (resolutionAmount) {
        const clientRefund = dispute.lockedAmount - resolutionAmount;
        if (clientRefund > 0) {
          await ctx.runAction(api.payments.actions.refundPaymentIntent, {
            projectId: dispute.projectId,
            amount: clientRefund,
            reason: "dispute_partial_refund",
          });
        }
        if (resolutionAmount > 0 && project.matchedFreelancerId) {
          await ctx.runAction(api.payments.actions.createPayoutTransfer, {
            projectId: dispute.projectId,
            freelancerId: project.matchedFreelancerId,
            milestoneId: dispute.milestoneId,
            amount: resolutionAmount,
            currency,
          });
        }
      }
    } else if (decision === "replacement") {
      // Hold funds for new freelancer
      // Project will be re-matched
      // Funds remain in escrow
    }

    return { success: true };
  },
});

