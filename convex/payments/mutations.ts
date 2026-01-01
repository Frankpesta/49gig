import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import { internal } from "../_generated/api";

/**
 * Helper to get current user in mutations
 */
async function getCurrentUserInMutation(
  ctx: any,
  userId?: string
): Promise<Doc<"users"> | null> {
  if (userId) {
    const user = await ctx.db.get(userId as any as Doc<"users">["_id"]);
    if (!user) {
      return null;
    }
    const userDoc = user as Doc<"users">;
    if (userDoc.status !== "active") {
      return null;
    }
    return userDoc;
  }
  return null;
}

/**
 * Create a payment record
 * Internal mutation called by actions
 */
export const createPayment = internalMutation({
  args: {
    projectId: v.id("projects"),
    type: v.union(
      v.literal("pre_funding"),
      v.literal("milestone_release"),
      v.literal("refund"),
      v.literal("platform_fee"),
      v.literal("payout")
    ),
    amount: v.number(),
    currency: v.string(),
    platformFee: v.optional(v.number()),
    netAmount: v.number(),
    stripePaymentIntentId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    milestoneId: v.optional(v.id("milestones")),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const paymentId = await ctx.db.insert("payments", {
      projectId: args.projectId,
      milestoneId: args.milestoneId,
      type: args.type,
      amount: args.amount,
      currency: args.currency,
      platformFee: args.platformFee,
      netAmount: args.netAmount,
      stripePaymentIntentId: args.stripePaymentIntentId,
      stripeCustomerId: args.stripeCustomerId,
      status: "pending",
      webhookReceived: false,
      createdAt: now,
      updatedAt: now,
    });

    // Log audit
    await ctx.db.insert("auditLogs", {
      action: "payment_created",
      actionType: "admin",
      actorId: args.userId,
      actorRole: "client",
      targetType: "payment",
      targetId: paymentId,
      details: {
        type: args.type,
        amount: args.amount,
        projectId: args.projectId,
      },
      createdAt: now,
    });

    return paymentId;
  },
});

/**
 * Update user's Stripe customer ID
 * Internal mutation
 */
export const updateUserStripeId = internalMutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.patch(args.userId, {
      stripeCustomerId: args.stripeCustomerId,
    });
  },
});

/**
 * Handle successful payment (called by webhook handler)
 * Internal mutation
 */
export const handlePaymentSuccess = internalMutation({
  args: {
    paymentIntentId: v.string(),
    eventId: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    // Find payment by Stripe payment intent ID
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_stripe_payment_intent", (q) =>
        q.eq("stripePaymentIntentId", args.paymentIntentId)
      )
      .first();

    if (!payment) {
      throw new Error(`Payment not found for intent: ${args.paymentIntentId}`);
    }

    // Update payment status
    const now = Date.now();
    await ctx.db.patch(payment._id, {
      status: "succeeded",
      webhookReceived: true,
      webhookReceivedAt: now,
      webhookEventId: args.eventId,
      processedAt: now,
      updatedAt: now,
    });

    // Get project to access clientId for audit logs
    const project = await ctx.db.get(payment.projectId);
    const clientId = project?.clientId;

    // Update project based on payment type
    if (payment.type === "pre_funding" && project) {
      // Update project to funded status
      await ctx.db.patch(payment.projectId, {
        status: "funded",
        escrowedAmount: payment.amount,
        updatedAt: now,
      });

      // Log audit
      if (clientId) {
        await ctx.db.insert("auditLogs", {
          action: "project_funded",
          actionType: "admin",
          actorId: clientId, // Use project owner as actor for system events
          actorRole: "system",
          targetType: "project",
          targetId: payment.projectId,
          details: {
            paymentId: payment._id,
            amount: payment.amount,
          },
          createdAt: now,
        });
      }
    }

    // Log audit for payment
    if (clientId) {
      await ctx.db.insert("auditLogs", {
        action: "payment_succeeded",
        actionType: "admin",
        actorId: clientId, // Use project owner as actor
        actorRole: "system",
        targetType: "payment",
        targetId: payment._id,
        details: {
          paymentIntentId: args.paymentIntentId,
          amount: payment.amount,
        },
        createdAt: now,
      });
    }

    return payment._id;
  },
});

/**
 * Handle failed payment (called by webhook handler)
 * Internal mutation
 */
export const handlePaymentFailure = internalMutation({
  args: {
    paymentIntentId: v.string(),
    eventId: v.string(),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_stripe_payment_intent", (q) =>
        q.eq("stripePaymentIntentId", args.paymentIntentId)
      )
      .first();

    if (!payment) {
      throw new Error(`Payment not found for intent: ${args.paymentIntentId}`);
    }

    const now = Date.now();
    await ctx.db.patch(payment._id, {
      status: "failed",
      webhookReceived: true,
      webhookReceivedAt: now,
      webhookEventId: args.eventId,
      errorMessage: args.errorMessage,
      updatedAt: now,
    });

    // Get project to access clientId for audit log
    const project = await ctx.db.get(payment.projectId);
    const clientId = project?.clientId;

    // Log audit
    if (clientId) {
      await ctx.db.insert("auditLogs", {
        action: "payment_failed",
        actionType: "admin",
        actorId: clientId, // Use project owner as actor
        actorRole: "system",
        targetType: "payment",
        targetId: payment._id,
        details: {
          paymentIntentId: args.paymentIntentId,
          error: args.errorMessage,
        },
        createdAt: now,
      });
    }

    return payment._id;
  },
});

/**
 * Handle payment cancellation (called by webhook handler)
 * Internal mutation
 */
export const handlePaymentCancellation = internalMutation({
  args: {
    paymentIntentId: v.string(),
    eventId: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_stripe_payment_intent", (q) =>
        q.eq("stripePaymentIntentId", args.paymentIntentId)
      )
      .first();

    if (!payment) {
      throw new Error(`Payment not found for intent: ${args.paymentIntentId}`);
    }

    const now = Date.now();
    await ctx.db.patch(payment._id, {
      status: "cancelled",
      webhookReceived: true,
      webhookReceivedAt: now,
      webhookEventId: args.eventId,
      updatedAt: now,
    });

    // Get project to access clientId for audit log
    const project = await ctx.db.get(payment.projectId);
    const clientId = project?.clientId;

    // If pre-funding was cancelled, revert project to draft
    if (payment.type === "pre_funding" && project) {
      await ctx.db.patch(payment.projectId, {
        status: "draft",
        updatedAt: now,
      });
    }

    // Log audit
    if (clientId) {
      await ctx.db.insert("auditLogs", {
        action: "payment_cancelled",
        actionType: "admin",
        actorId: clientId, // Use project owner as actor
        actorRole: "system",
        targetType: "payment",
        targetId: payment._id,
        details: {
          paymentIntentId: args.paymentIntentId,
        },
        createdAt: now,
      });
    }

    return payment._id;
  },
});

/**
 * Update project status (internal mutation for use by actions)
 */
export const updateProjectStatus = internalMutation({
  args: {
    projectId: v.id("projects"),
    status: v.union(
      v.literal("draft"),
      v.literal("pending_funding"),
      v.literal("funded"),
      v.literal("matching"),
      v.literal("matched"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("disputed")
    ),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const now = Date.now();
    const updates: any = {
      status: args.status,
      updatedAt: now,
    };

    if (args.status === "in_progress" && !project.startedAt) {
      updates.startedAt = now;
    }

    if (args.status === "completed" && !project.completedAt) {
      updates.completedAt = now;
    }

    await ctx.db.patch(args.projectId, updates);

    // Log audit
    await ctx.db.insert("auditLogs", {
      action: "project_status_updated",
      actionType: "admin",
      actorId: args.userId,
      actorRole: "client",
      targetType: "project",
      targetId: args.projectId,
      details: {
        oldStatus: project.status,
        newStatus: args.status,
      },
      createdAt: now,
    });

    return args.projectId;
  },
});

