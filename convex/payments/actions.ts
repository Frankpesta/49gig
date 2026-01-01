import { action } from "../_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";
import { internal } from "../_generated/api";

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

    // Check if payment already exists
    const existingPayment = await ctx.runQuery(
      internal.payments.queries.getPaymentByProject,
      {
        projectId: args.projectId,
      }
    );

    if (existingPayment) {
      if (existingPayment.status === "succeeded") {
        throw new Error("Project is already funded");
      }
      // If there's a pending payment intent, return its client secret
      if (existingPayment.stripePaymentIntentId && existingPayment.status === "pending") {
        const stripe = getStripe();
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            existingPayment.stripePaymentIntentId
          );
          return {
            clientSecret: paymentIntent.client_secret,
            paymentId: existingPayment._id,
          };
        } catch (stripeError) {
          // If retrieval fails, continue to create a new one
          console.error("Failed to retrieve existing payment intent:", stripeError);
        }
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

      default:
        // Log unhandled event types
        console.log(`Unhandled webhook event: ${args.eventType}`);
    }

    return { processed: true };
  },
});

