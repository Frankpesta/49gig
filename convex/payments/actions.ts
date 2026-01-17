// @ts-nocheck
import { action } from "../_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";
import { internal, api } from "../_generated/api";

/**
 * Get Stripe instance (lazy initialization)
 */
function getStripe(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set. Please configure it in the Convex dashboard.");
  }
  return new Stripe(apiKey, {
    apiVersion: "2025-12-15.clover",
  });
}

/**
 * Create a Stripe Payment Intent for project pre-funding
 * This creates a payment intent that the client will pay
 */
export const createPaymentIntent = action({
  args: {
    projectId: v.id("projects"),
    amount: v.number(), // Amount in cents
    currency: v.string(), // e.g., "usd"
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<{ clientSecret: string | null; paymentId: string }> => {
    // Verify user and project
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

    // Check if payment already exists - CRITICAL: Check for ANY payment, not just succeeded
    // This prevents duplicate payment creation
    const existingPayment = await ctx.runQuery(
      internal.payments.queries.getPaymentByProject,
      {
        projectId: args.projectId,
      }
    );

    if (existingPayment) {
      // If payment already succeeded, project is funded
      if (existingPayment.status === "succeeded") {
        throw new Error("Project is already funded");
      }
      
      // If there's a pending payment intent, return its client secret
      // This handles the case where user refreshes the page or navigates back
      if (existingPayment.stripePaymentIntentId && 
          (existingPayment.status === "pending" || existingPayment.status === "processing")) {
        const stripe = getStripe();
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            existingPayment.stripePaymentIntentId
          );
          
          // Only return if payment intent is still in a valid state
          if (paymentIntent.status === "requires_payment_method" || 
              paymentIntent.status === "requires_confirmation" ||
              paymentIntent.status === "requires_action") {
            return {
              clientSecret: paymentIntent.client_secret,
              paymentId: existingPayment._id,
            };
          }
          
          // If payment intent is already succeeded/failed, we can create a new one
          // But log this case for monitoring
          console.warn(`Payment intent ${paymentIntent.id} is in state ${paymentIntent.status}, creating new payment`);
        } catch (stripeError) {
          // If retrieval fails, continue to create a new one
          console.error("Failed to retrieve existing payment intent:", stripeError);
        }
      }
      
      // If there's a pending payment without a valid payment intent, don't create duplicate
      // Wait for webhook to process or user to retry
      if (existingPayment.status === "pending" && !existingPayment.stripePaymentIntentId) {
        throw new Error("A payment is already being processed for this project. Please wait or contact support.");
      }
    }

    // Create or retrieve Stripe customer
    const stripe = getStripe();
    // User object from verifyUser query should have all fields including stripeCustomerId
    // Type assertion needed because TypeScript doesn't know about optional fields
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

      // Update user with Stripe customer ID
      await ctx.runMutation(internal.payments.mutations.updateUserStripeId, {
        userId: args.userId,
        stripeCustomerId: customerId,
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: args.amount,
      currency: args.currency,
      customer: customerId,
      metadata: {
        projectId: args.projectId,
        userId: args.userId,
        type: "pre_funding",
      },
      description: `Project funding: ${project.intakeForm.title}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create payment record in database
    const platformFee = project.platformFee || 10; // Default 10%
    const platformFeeAmount = Math.round((args.amount * platformFee) / 100);
    const netAmount = args.amount - platformFeeAmount;

    const paymentId = await ctx.runMutation(
      internal.payments.mutations.createPayment,
      {
        projectId: args.projectId,
        type: "pre_funding",
        amount: args.amount / 100, // Convert cents to dollars
        currency: args.currency,
        platformFee: platformFeeAmount / 100,
        netAmount: netAmount / 100,
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: customerId,
        userId: args.userId,
      }
    );

    // Update project status to pending_funding only if still in draft
    // This prevents race conditions from multiple simultaneous calls
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
 * This is called by Stripe when payment events occur
 */
export const handleStripeWebhook = action({
  args: {
    eventType: v.string(),
    eventId: v.string(),
    paymentIntentId: v.optional(v.string()),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    // Verify webhook hasn't been processed
    const existingWebhook = await ctx.runQuery(
      internal.payments.queries.getWebhookByEventId,
      {
        eventId: args.eventId,
      }
    );

    if (existingWebhook) {
      // Idempotent: already processed
      return { processed: true, existing: true };
    }

    // Process webhook based on event type
    switch (args.eventType) {
      case "payment_intent.succeeded":
        if (args.paymentIntentId) {
          await ctx.runMutation(
            internal.payments.mutations.handlePaymentSuccess,
            {
              paymentIntentId: args.paymentIntentId,
              eventId: args.eventId,
              data: args.data,
            }
          );

          // Get payment to find project
          const payment = await ctx.runQuery(
            internal.payments.queries.getPaymentByIntentId,
            {
              paymentIntentId: args.paymentIntentId,
            }
          );

          // If this is a pre-funding payment, trigger matching
          if (payment && payment.type === "pre_funding") {
            try {
              // Generate matches for the funded project
              // Call matching action directly
              await ctx.runAction(api.matching.actions.generateMatches, {
                projectId: payment.projectId,
                limit: 5,
              });
            } catch (error) {
              // Log error but don't fail the webhook
              console.error("Failed to trigger matching:", error);
            }
          }
        }
        break;

      case "payment_intent.payment_failed":
        if (args.paymentIntentId) {
          await ctx.runMutation(
            internal.payments.mutations.handlePaymentFailure,
            {
              paymentIntentId: args.paymentIntentId,
              eventId: args.eventId,
              errorMessage: args.data?.last_payment_error?.message || "Payment failed",
            }
          );
        }
        break;

      case "payment_intent.canceled":
        if (args.paymentIntentId) {
          await ctx.runMutation(
            internal.payments.mutations.handlePaymentCancellation,
            {
              paymentIntentId: args.paymentIntentId,
              eventId: args.eventId,
            }
          );
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
        // Log unhandled event types
        console.log(`Unhandled webhook event: ${args.eventType}`);
    }

    return { processed: true };
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
    const loginLink = await stripe.accounts.createLoginLink(accountId,
      args.returnUrl ? { redirect_url: args.returnUrl } : undefined
    );

    return { url: loginLink.url, accountId };
  },
});

/**
 * Refund a payment intent (full or partial) for dispute resolution
 */
export const refundPaymentIntent = action({
  args: {
    projectId: v.id("projects"),
    amount: v.number(), // Amount in dollars
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
      message: "A refund was issued for your project.",
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
    amount: v.number(), // Amount in dollars
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
    const freelancerDoc = freelancer;
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
      message: `A payout of ${args.amount} ${args.currency.toUpperCase()} was sent for ${project.intakeForm.title}.`,
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

    return { success: true, transferId: transfer.id };
  },
});
