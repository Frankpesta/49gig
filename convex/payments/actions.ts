// @ts-nocheck
import { action } from "../_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";
import React from "react";
import { internal, api } from "../_generated/api";
import { sendEmail } from "../email/send";
import {
  RefundIssuedEmail,
  PayoutSentEmail,
  PayoutFailedEmail,
} from "../../emails/templates";

function getAppUrl() {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://49gig.com";
}

function getLogoUrl(appUrl: string) {
  return appUrl + "/logo-light.png";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get Stripe instance (lazy initialization)
 */
function getStripe(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error(
      "STRIPE_SECRET_KEY environment variable is not set. Please configure it in the Convex dashboard."
    );
  }
  return new Stripe(apiKey, {
    apiVersion: "2025-12-15.clover",
  });
}

/**
 * Create a Stripe Payment Intent for project pre-funding
 */
export const createPaymentIntent = action({
  args: {
    projectId: v.id("projects"),
    amount: v.number(),
    currency: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<{ clientSecret: string | null; paymentId: string }> => {
    const user = await ctx.runQuery(internal.payments.queries.verifyUser, {
      userId: args.userId,
    });
    if (!user || user.role !== "client") {
      throw new Error("Only clients can create payment intents");
    }

    const project = await ctx.runQuery(internal.payments.queries.getProject, {
      projectId: args.projectId,
      userId: args.userId,
    });
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.clientId !== user._id) {
      throw new Error("Not authorized to pay for this project");
    }
    if (project.status !== "draft" && project.status !== "pending_funding") {
      throw new Error("Project is not in a state that allows payment");
    }

    const existingPayment = await ctx.runQuery(
      internal.payments.queries.getPaymentByProject,
      { projectId: args.projectId }
    );
    if (existingPayment) {
      if (existingPayment.status === "succeeded") {
        throw new Error("Project is already funded");
      }
      if (
        existingPayment.stripePaymentIntentId &&
        (existingPayment.status === "pending" || existingPayment.status === "processing")
      ) {
        const stripe = getStripe();
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            existingPayment.stripePaymentIntentId
          );
          if (
            paymentIntent.status === "requires_payment_method" ||
            paymentIntent.status === "requires_confirmation" ||
            paymentIntent.status === "requires_action"
          ) {
            return {
              clientSecret: paymentIntent.client_secret,
              paymentId: existingPayment._id,
            };
          }
          console.warn(
            "Payment intent " + paymentIntent.id + " is in state " + paymentIntent.status + ", creating new payment"
          );
        } catch (stripeError) {
          console.error("Failed to retrieve existing payment intent:", stripeError);
        }
      }
      if (existingPayment.status === "pending" && !existingPayment.stripePaymentIntentId) {
        throw new Error(
          "A payment is already being processed for this project. Please wait or contact support."
        );
      }
    }

    const stripe = getStripe();
    const userWithStripe = user as typeof user & { stripeCustomerId?: string };
    let customerId: string | undefined = userWithStripe.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: args.userId,
        },
      });
      customerId = customer.id;
      await ctx.runMutation(internal.payments.mutations.updateUserStripeId, {
        userId: args.userId,
        stripeCustomerId: customerId,
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: args.amount,
      currency: args.currency,
      customer: customerId,
      metadata: {
        projectId: args.projectId,
        userId: args.userId,
        type: "pre_funding",
      },
      description: "Project funding: " + project.intakeForm.title,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    const platformFee = project.platformFee || 10;
    const platformFeeAmount = Math.round((args.amount * platformFee) / 100);
    const netAmount = args.amount - platformFeeAmount;

    const paymentId = await ctx.runMutation(
      internal.payments.mutations.createPayment,
      {
        projectId: args.projectId,
        type: "pre_funding",
        amount: args.amount / 100,
        currency: args.currency,
        platformFee: platformFeeAmount / 100,
        netAmount: netAmount / 100,
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: customerId,
        userId: args.userId,
      }
    );

    const currentProject = await ctx.runQuery(internal.payments.queries.getProject, {
      projectId: args.projectId,
      userId: args.userId,
    });

    if (currentProject && currentProject.status === "draft") {
      await ctx.runMutation(internal.projects.mutations.updateProjectStatusInternal, {
        projectId: args.projectId,
        status: "pending_funding",
      });
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId,
    };
  },
});

/**
 * Handle Stripe webhook events
 */
export const handleStripeWebhook = action({
  args: {
    eventType: v.string(),
    eventId: v.string(),
    paymentIntentId: v.optional(v.string()),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const existingWebhook = await ctx.runQuery(
      internal.payments.queries.getWebhookByEventId,
      { eventId: args.eventId }
    );

    if (existingWebhook) {
      return { processed: true, existing: true };
    }

    switch (args.eventType) {
      case "payment_intent.succeeded":
        if (args.paymentIntentId) {
          await ctx.runMutation(internal.payments.mutations.handlePaymentSuccess, {
            paymentIntentId: args.paymentIntentId,
            eventId: args.eventId,
            data: args.data,
          });

          const payment = await ctx.runQuery(internal.payments.queries.getPaymentByIntentId, {
            paymentIntentId: args.paymentIntentId,
          });

          if (payment && payment.type === "pre_funding") {
            try {
              await ctx.runAction(api.matching.actions.generateMatches, {
                projectId: payment.projectId,
                limit: 5,
              });
            } catch (error) {
              console.error("Failed to trigger matching:", error);
            }
          }
        }
        break;

      case "payment_intent.payment_failed":
        if (args.paymentIntentId) {
          await ctx.runMutation(internal.payments.mutations.handlePaymentFailure, {
            paymentIntentId: args.paymentIntentId,
            eventId: args.eventId,
            errorMessage: args.data?.last_payment_error?.message || "Payment failed",
          });
        }
        break;

      case "payment_intent.canceled":
        if (args.paymentIntentId) {
          await ctx.runMutation(internal.payments.mutations.handlePaymentCancellation, {
            paymentIntentId: args.paymentIntentId,
            eventId: args.eventId,
          });
        }
        break;

      case "transfer.created": {
        const transferId = args.data?.object?.id as string | undefined;
        if (transferId) {
          await ctx.runMutation(internal.payments.mutations.updatePaymentByTransferId, {
            transferId,
            status: "processing",
          });
        }
        break;
      }
      case "transfer.paid": {
        const transferId = args.data?.object?.id as string | undefined;
        if (transferId) {
          await ctx.runMutation(internal.payments.mutations.updatePaymentByTransferId, {
            transferId,
            status: "succeeded",
          });
          const payment = await ctx.runQuery(internal.payments.queries.getPaymentByTransferId, {
            transferId,
          });
          if (payment) {
            await ctx.runMutation(internal.payments.mutations.logPaymentAudit, {
              action: "transfer_succeeded",
              actorId: payment.userId,
              actorRole: "system",
              targetId: payment._id,
              details: { transferId },
            });
          }
        }
        break;
      }
      case "transfer.failed":
      case "transfer.reversed": {
        const transferId = args.data?.object?.id as string | undefined;
        const failureMessage = args.data?.object?.failure_message as string | undefined;
        if (transferId) {
          await ctx.runMutation(internal.payments.mutations.updatePaymentByTransferId, {
            transferId,
            status: "failed",
            errorMessage: failureMessage,
          });
          const payment = await ctx.runQuery(internal.payments.queries.getPaymentByTransferId, {
            transferId,
          });
          if (payment) {
            const sendSystemNotification =
              api.api.notifications.actions.sendSystemNotification as unknown as import("convex/server").FunctionReference<
                "action",
                "internal"
              >;
            await ctx.scheduler.runAfter(0, sendSystemNotification, {
              userIds: [payment.userId],
              title: "Payout failed",
              message: "We could not complete your payout. Please contact support.",
              type: "payment",
              data: { transferId, paymentId: payment._id },
            });

            const appUrl = getAppUrl();
            const logoUrl = getLogoUrl(appUrl);
            const date = formatDate();
            const transferUser = await ctx.db.get(payment.userId);
            if (transferUser?.email) {
              await sendEmail({
                to: transferUser.email,
                subject: "Payout failed",
                react: React.createElement(PayoutFailedEmail, {
                  name: transferUser.name || "there",
                  amount: payment.amount.toFixed(2),
                  currency: payment.currency.toUpperCase(),
                  appUrl,
                  logoUrl,
                  date,
                  reason: failureMessage || "Payout failed",
                }),
              });
            }

            await ctx.runMutation(internal.payments.mutations.logPaymentAudit, {
              action: "transfer_failed",
              actorId: payment.userId,
              actorRole: "system",
              targetId: payment._id,
              details: { transferId, failureMessage },
            });
          }
        }
        break;
      }

      case "payout.paid": {
        const payoutId = args.data?.object?.id as string | undefined;
        if (payoutId) {
          await ctx.runMutation(internal.payments.mutations.updatePaymentByPayoutId, {
            payoutId,
            status: "succeeded",
          });
          const payment = await ctx.runQuery(internal.payments.queries.getPaymentByPayoutId, {
            payoutId,
          });
          if (payment) {
            await ctx.runMutation(internal.payments.mutations.logPaymentAudit, {
              action: "payout_succeeded",
              actorId: payment.userId,
              actorRole: "system",
              targetId: payment._id,
              details: { payoutId },
            });
          }
        }
        break;
      }
      case "payout.failed":
      case "payout.canceled": {
        const payoutId = args.data?.object?.id as string | undefined;
        const failureMessage = args.data?.object?.failure_message as string | undefined;
        if (payoutId) {
          await ctx.runMutation(internal.payments.mutations.updatePaymentByPayoutId, {
            payoutId,
            status: "failed",
            errorMessage: failureMessage,
          });
          const payment = await ctx.runQuery(internal.payments.queries.getPaymentByPayoutId, {
            payoutId,
          });
          if (payment) {
            const sendSystemNotification =
              api.api.notifications.actions.sendSystemNotification as unknown as import("convex/server").FunctionReference<
                "action",
                "internal"
              >;
            await ctx.scheduler.runAfter(0, sendSystemNotification, {
              userIds: [payment.userId],
              title: "Payout failed",
              message: "We could not complete your payout. Please contact support.",
              type: "payment",
              data: { payoutId, paymentId: payment._id },
            });

            const appUrl = getAppUrl();
            const logoUrl = getLogoUrl(appUrl);
            const date = formatDate();
            const payoutUser = await ctx.db.get(payment.userId);
            if (payoutUser?.email) {
              await sendEmail({
                to: payoutUser.email,
                subject: "Payout failed",
                react: React.createElement(PayoutFailedEmail, {
                  name: payoutUser.name || "there",
                  amount: payment.amount.toFixed(2),
                  currency: payment.currency.toUpperCase(),
                  appUrl,
                  logoUrl,
                  date,
                  reason: failureMessage || "Payout failed",
                }),
              });
            }

            await ctx.runMutation(internal.payments.mutations.logPaymentAudit, {
              action: "payout_failed",
              actorId: payment.userId,
              actorRole: "system",
              targetId: payment._id,
              details: { payoutId, failureMessage },
            });
          }
        }
        break;
      }

      default:
        console.log("Unhandled webhook event: " + args.eventType);
    }

    return { processed: true };
  },
});

/**
 * Refund a payment intent (full or partial) for dispute resolution
 */
export const refundPaymentIntent = action({
  args: {
    projectId: v.id("projects"),
    amount: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.runQuery(internal.payments.queries.getPaymentByProject, {
      projectId: args.projectId,
    });
    if (!payment || !payment.stripePaymentIntentId) {
      throw new Error("No payment intent found for this project");
    }
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const stripe = getStripe();
    const amountInCents = Math.round(args.amount * 100);
    const paymentAmountInCents = Math.round(payment.amount * 100);

    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: amountInCents < paymentAmountInCents ? amountInCents : undefined,
      reason: "requested_by_customer",
      metadata: {
        projectId: args.projectId,
        reason: args.reason || "dispute_resolution",
      },
    });

    await ctx.runMutation(internal.payments.mutations.createPayment, {
      projectId: args.projectId,
      type: "refund",
      amount: args.amount,
      currency: payment.currency,
      platformFee: 0,
      netAmount: args.amount,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      stripeRefundId: refund.id,
      stripeCustomerId: payment.stripeCustomerId,
      userId: project.clientId,
      status: "refunded",
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as import("convex/server").FunctionReference<
        "action",
        "internal"
      >;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [project.clientId],
      title: "Refund issued",
      message: "A refund of " + args.amount + " " + payment.currency.toUpperCase() + " was issued for " + project.intakeForm.title + ".",
      type: "payment",
      data: { projectId: args.projectId, refundId: refund.id },
    });

    await ctx.runMutation(internal.payments.mutations.logPaymentAudit, {
      action: "refund_issued",
      actorId: project.clientId,
      actorRole: "system",
      targetId: refund.id,
      details: {
        amount: args.amount,
        currency: payment.currency,
        projectId: args.projectId,
      },
    });

    const appUrl = getAppUrl();
    const logoUrl = getLogoUrl(appUrl);
    const date = formatDate();
    const client = await ctx.db.get(project.clientId);
    if (client?.email) {
      await sendEmail({
        to: client.email,
        subject: "Refund issued",
        react: React.createElement(RefundIssuedEmail, {
          name: client.name || "there",
          amount: args.amount.toFixed(2),
          projectName: project.intakeForm.title,
          appUrl,
          logoUrl,
          date,
        }),
      });
    }

    return { success: true, refundId: refund.id };
  },
});

/**
 * Create a Stripe Connect transfer to a freelancer
 */
export const createPayoutTransfer = action({
  args: {
    projectId: v.id("projects"),
    freelancerId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    milestoneId: v.optional(v.id("milestones")),
  },
  handler: async (ctx, args) => {
    const stripe = getStripe();
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    const freelancer = await ctx.db.get(args.freelancerId);
    if (!freelancer || freelancer.status !== "active") {
      throw new Error("Freelancer not found");
    }
    const freelancerDoc = freelancer as typeof freelancer & {
      stripeAccountId?: string;
    };
    if (!freelancerDoc.stripeAccountId) {
      throw new Error("Freelancer Stripe account not connected");
    }

    const transfer = await stripe.transfers.create({
      amount: Math.round(args.amount * 100),
      currency: args.currency,
      destination: freelancerDoc.stripeAccountId,
      metadata: {
        projectId: args.projectId,
        freelancerId: args.freelancerId,
      },
    });

    await ctx.runMutation(internal.payments.mutations.createPayment, {
      projectId: args.projectId,
      milestoneId: args.milestoneId,
      type: "payout",
      amount: args.amount,
      currency: args.currency,
      platformFee: 0,
      netAmount: args.amount,
      stripeTransferId: transfer.id,
      stripeAccountId: freelancerDoc.stripeAccountId,
      userId: args.freelancerId,
      status: "succeeded",
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as import("convex/server").FunctionReference<
        "action",
        "internal"
      >;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [args.freelancerId],
      title: "Payout sent",
      message: "A payout of " + args.amount + " " + args.currency.toUpperCase() + " was sent for " + project.intakeForm.title + ".",
      type: "payment",
      data: { projectId: args.projectId, transferId: transfer.id },
    });

    await ctx.runMutation(internal.payments.mutations.logPaymentAudit, {
      action: "payout_sent",
      actorId: args.freelancerId,
      actorRole: "system",
      targetId: transfer.id,
      details: {
        amount: args.amount,
        currency: args.currency,
        projectId: args.projectId,
        milestoneId: args.milestoneId,
      },
    });

    const appUrl = getAppUrl();
    const logoUrl = getLogoUrl(appUrl);
    const date = formatDate();
    if (freelancerDoc?.email) {
      await sendEmail({
        to: freelancerDoc.email,
        subject: "Payout sent",
        react: React.createElement(PayoutSentEmail, {
          name: freelancerDoc.name || "there",
          amount: args.amount.toFixed(2),
          projectName: project.intakeForm.title,
          appUrl,
          logoUrl,
          date,
        }),
      });
    }

    return { success: true, transferId: transfer.id };
  },
});

/**
 * Create Stripe Connect account for a freelancer
 */
export const createConnectAccount = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.payments.queries.verifyUser, {
      userId: args.userId,
    });
    if (!user || user.role !== "freelancer") {
      throw new Error("Only freelancers can create Stripe Connect accounts");
    }

    const existing = user as typeof user & { stripeAccountId?: string };
    if (existing.stripeAccountId) {
      return { accountId: existing.stripeAccountId, alreadyExists: true };
    }

    const stripe = getStripe();
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      capabilities: {
        transfers: { requested: true },
      },
      metadata: {
        userId: args.userId,
      },
    });

    await ctx.runMutation(internal.payments.mutations.updateUserStripeAccountId, {
      userId: args.userId,
      stripeAccountId: account.id,
    });

    return { accountId: account.id, alreadyExists: false };
  },
});

/**
 * Create Stripe Connect onboarding link
 */
export const createConnectAccountLink = action({
  args: {
    userId: v.id("users"),
    returnUrl: v.string(),
    refreshUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.payments.queries.verifyUser, {
      userId: args.userId,
    });
    if (!user || user.role !== "freelancer") {
      throw new Error("Only freelancers can create Stripe Connect accounts");
    }

    const stripe = getStripe();
    let accountId = (user as typeof user & { stripeAccountId?: string }).stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
        metadata: {
          userId: args.userId,
        },
      });
      accountId = account.id;
      await ctx.runMutation(internal.payments.mutations.updateUserStripeAccountId, {
        userId: args.userId,
        stripeAccountId: account.id,
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: args.refreshUrl,
      return_url: args.returnUrl,
      type: "account_onboarding",
    });

    return { url: accountLink.url, accountId };
  },
});

/**
 * Create Stripe Connect dashboard login link
 */
export const createConnectLoginLink = action({
  args: {
    userId: v.id("users"),
    returnUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.payments.queries.verifyUser, {
      userId: args.userId,
    });
    if (!user || user.role !== "freelancer") {
      throw new Error("Only freelancers can access Stripe dashboard");
    }

    const accountId = (user as typeof user & { stripeAccountId?: string }).stripeAccountId;
    if (!accountId) {
      throw new Error("Stripe account not connected");
    }

    const stripe = getStripe();
    const loginLink = await stripe.accounts.createLoginLink(
      accountId,
      args.returnUrl ? { redirect_url: args.returnUrl } : undefined
    );

    return { url: loginLink.url, accountId };
  },
});

/**
 * Get Stripe Connect account status
 */
export const getConnectAccountStatus = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.payments.queries.verifyUser, {
      userId: args.userId,
    });
    if (!user || user.role !== "freelancer") {
      throw new Error("Only freelancers can access Stripe status");
    }

    const accountId = (user as typeof user & { stripeAccountId?: string }).stripeAccountId;
    if (!accountId) {
      return { connected: false };
    }

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(accountId);
    return {
      connected: true,
      accountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: {
        currently_due: account.requirements?.currently_due || [],
        past_due: account.requirements?.past_due || [],
        eventually_due: account.requirements?.eventually_due || [],
        pending_verification: account.requirements?.pending_verification || [],
        disabled_reason: account.requirements?.disabled_reason || null,
      },
    };
  },
});
