import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import type { FunctionReference } from "convex/server";

const api = require("../_generated/api") as {
  api: {
    notifications: { actions: { sendSystemNotification: unknown } };
  };
};

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
    flutterwaveTransactionId: v.optional(v.string()),
    flutterwaveRefundId: v.optional(v.string()),
    flutterwaveTransferId: v.optional(v.string()),
    flutterwaveCustomerEmail: v.optional(v.string()),
    flutterwaveSubaccountId: v.optional(v.string()),
    milestoneId: v.optional(v.id("milestones")),
    userId: v.id("users"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("succeeded"),
        v.literal("failed"),
        v.literal("refunded"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // CRITICAL: Check for existing payment to prevent duplicates
    // This is a safety check in case the action's check didn't catch it
    if (args.type === "pre_funding") {
      const existingPayment = await ctx.db
        .query("payments")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .filter((q) => 
          q.and(
            q.eq(q.field("type"), "pre_funding"),
            q.or(
              q.eq(q.field("status"), "pending"),
              q.eq(q.field("status"), "processing"),
              q.eq(q.field("status"), "succeeded")
            )
          )
        )
        .first();

      if (existingPayment) {
        // If there's already a payment with the same transaction ID, return that ID
        if (args.flutterwaveTransactionId && 
            existingPayment.flutterwaveTransactionId === args.flutterwaveTransactionId) {
          return existingPayment._id;
        }
        
        // If there's a pending/processing payment, don't create duplicate
        if (existingPayment.status === "pending" || existingPayment.status === "processing") {
          throw new Error("A payment is already being processed for this project");
        }
        
        // If there's a succeeded payment, don't create duplicate
        if (existingPayment.status === "succeeded") {
          throw new Error("Project is already funded");
        }
      }
    }

    const paymentId = await ctx.db.insert("payments", {
      projectId: args.projectId,
      milestoneId: args.milestoneId,
      type: args.type,
      amount: args.amount,
      currency: args.currency,
      platformFee: args.platformFee,
      netAmount: args.netAmount,
      flutterwaveTransactionId: args.flutterwaveTransactionId,
      flutterwaveRefundId: args.flutterwaveRefundId,
      flutterwaveTransferId: args.flutterwaveTransferId,
      flutterwaveCustomerEmail: args.flutterwaveCustomerEmail,
      flutterwaveSubaccountId: args.flutterwaveSubaccountId,
      status: args.status || "pending",
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
 * Update user's Flutterwave subaccount ID
 * Internal mutation
 */
export const updateUserFlutterwaveSubaccountId = internalMutation({
  args: {
    userId: v.id("users"),
    flutterwaveSubaccountId: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.patch(args.userId, {
      flutterwaveSubaccountId: args.flutterwaveSubaccountId,
    });
  },
});

/**
 * Update payment status by Stripe transfer ID
 * Internal mutation
 */
export const updatePaymentByTransferId = internalMutation({
  args: {
    transferId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("refunded"),
      v.literal("cancelled")
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_flutterwave_transfer", (q) => q.eq("flutterwaveTransferId", args.transferId))
      .first();
    if (!payment) {
      return null;
    }
    const now = Date.now();
    await ctx.db.patch(payment._id, {
      status: args.status,
      errorMessage: args.errorMessage,
      processedAt: now,
      updatedAt: now,
    });
    return payment._id;
  },
});

// Note: Flutterwave uses transfers for payouts, not separate payout objects
// The updatePaymentByTransferId function handles both transfers and payouts

/**
 * Log a payment audit entry
 * Internal mutation
 */
export const logPaymentAudit = internalMutation({
  args: {
    action: v.string(),
    actorId: v.id("users"),
    actorRole: v.union(
      v.literal("client"),
      v.literal("freelancer"),
      v.literal("admin"),
      v.literal("moderator"),
      v.literal("system")
    ),
    targetId: v.optional(v.string()),
    details: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", {
      action: args.action,
      actionType: "payment",
      actorId: args.actorId,
      actorRole: args.actorRole,
      targetType: "payment",
      targetId: args.targetId,
      details: args.details,
      createdAt: Date.now(),
    });
  },
});

/**
 * Handle successful payment (called by webhook handler)
 * Internal mutation
 */
export const handlePaymentSuccess = internalMutation({
  args: {
    transactionId: v.string(), // Flutterwave tx_ref
    eventId: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    // Find payment by Flutterwave transaction ID (tx_ref)
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_flutterwave_transaction", (q) =>
        q.eq("flutterwaveTransactionId", args.transactionId)
      )
      .first();

    if (!payment) {
      throw new Error(`Payment not found for transaction: ${args.transactionId}`);
    }

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;

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
          transactionId: args.transactionId,
          amount: payment.amount,
        },
        createdAt: now,
      });
    }

    if (project) {
      const amountLabel = `${payment.amount} ${payment.currency}`;
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: [project.clientId],
        title: "Payment received",
        message: `We received ${amountLabel} for ${project.intakeForm.title}.`,
        type: "payment",
        data: { paymentId: payment._id, projectId: payment.projectId },
      });

      if (project.matchedFreelancerId && payment.type === "milestone_release") {
        await ctx.scheduler.runAfter(0, sendSystemNotification, {
          userIds: [project.matchedFreelancerId],
          title: "Milestone payout released",
          message: `A milestone payment was released for ${project.intakeForm.title}.`,
          type: "payment",
          data: { paymentId: payment._id, projectId: payment.projectId },
        });
      }
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
    transactionId: v.string(), // Flutterwave tx_ref
    eventId: v.string(),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_flutterwave_transaction", (q) =>
        q.eq("flutterwaveTransactionId", args.transactionId)
      )
      .first();

    if (!payment) {
      throw new Error(`Payment not found for transaction: ${args.transactionId}`);
    }

    const now = Date.now();
    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
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
          transactionId: args.transactionId,
          error: args.errorMessage,
        },
        createdAt: now,
      });
    }

    if (project) {
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: [project.clientId],
        title: "Payment failed",
        message: `A payment attempt for ${project.intakeForm.title} failed.`,
        type: "payment",
        data: { paymentId: payment._id, projectId: payment.projectId },
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
    transactionId: v.string(), // Flutterwave tx_ref
    eventId: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_flutterwave_transaction", (q) =>
        q.eq("flutterwaveTransactionId", args.transactionId)
      )
      .first();

    if (!payment) {
      throw new Error(`Payment not found for transaction: ${args.transactionId}`);
    }

    const now = Date.now();
    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
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
          transactionId: args.transactionId,
        },
        createdAt: now,
      });
    }

    if (project) {
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: [project.clientId],
        title: "Payment cancelled",
        message: `A payment for ${project.intakeForm.title} was cancelled.`,
        type: "payment",
        data: { paymentId: payment._id, projectId: payment.projectId },
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

