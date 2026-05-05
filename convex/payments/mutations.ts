import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import type { FunctionReference } from "convex/server";
import { assertUsdCurrency } from "../currencyPolicy";
const apiModule = require("../_generated/api");
const api = apiModule as {
  api: {
    notifications: { actions: { sendSystemNotification: unknown } };
  };
};
const internalAny: any = apiModule.internal;

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
    projectId: v.optional(v.id("projects")),
    type: v.union(
      v.literal("pre_funding"),
      v.literal("top_up"),
      v.literal("milestone_release"),
      v.literal("monthly_release"),
      v.literal("refund"),
      v.literal("platform_fee"),
      v.literal("payout")
    ),
    topUpMonths: v.optional(v.number()),
    amount: v.number(),
    currency: v.string(),
    platformFee: v.optional(v.number()),
    netAmount: v.number(),
    flutterwaveTransactionId: v.optional(v.string()),
    flutterwaveRefundId: v.optional(v.string()),
    flutterwaveTransferId: v.optional(v.string()),
    flutterwaveCustomerEmail: v.optional(v.string()),
    flutterwaveSubaccountId: v.optional(v.string()),
    monthlyCycleId: v.optional(v.id("monthlyBillingCycles")),
    userId: v.id("users"),
    recipientId: v.optional(v.id("users")),
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
    fundingGrossAmount: v.optional(v.number()),
    clientWalletCreditApplied: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    assertUsdCurrency(args.currency, "createPayment");
    if (!Number.isFinite(args.amount) || args.amount < 0) {
      throw new Error("Payment amount must be non-negative");
    }
    if (!Number.isFinite(args.netAmount) || args.netAmount < 0) {
      throw new Error("Payment net amount must be non-negative");
    }
    if (args.platformFee != null && (!Number.isFinite(args.platformFee) || args.platformFee < 0)) {
      throw new Error("Payment platform fee amount must be non-negative");
    }

    // CRITICAL: Check for existing payment to prevent duplicates
    // This is a safety check in case the action's check didn't catch it
    if (args.type === "pre_funding") {
      if (!args.projectId) {
        throw new Error("projectId is required for pre_funding payments");
      }
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
      projectId: args.projectId ?? undefined,
      monthlyCycleId: args.monthlyCycleId,
      recipientId: args.recipientId,
      type: args.type,
      amount: args.amount,
      currency: args.currency,
      platformFee: args.platformFee,
      netAmount: args.netAmount,
      fundingGrossAmount: args.fundingGrossAmount,
      clientWalletCreditApplied: args.clientWalletCreditApplied,
      flutterwaveTransactionId: args.flutterwaveTransactionId,
      flutterwaveRefundId: args.flutterwaveRefundId,
      flutterwaveTransferId: args.flutterwaveTransferId,
      flutterwaveCustomerEmail: args.flutterwaveCustomerEmail,
      flutterwaveSubaccountId: args.flutterwaveSubaccountId,
      topUpMonths: args.topUpMonths,
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
 * Update user's Flutterwave subaccount ID and payout bank details (for transfers)
 * Internal mutation
 */
export const updateUserFlutterwaveSubaccountId = internalMutation({
  args: {
    userId: v.id("users"),
    flutterwaveSubaccountId: v.string(),
    bankCode: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<void> => {
    const patch: Record<string, unknown> = {
      flutterwaveSubaccountId: args.flutterwaveSubaccountId,
    };
    if (args.bankCode != null) patch.flutterwavePayoutBankCode = args.bankCode;
    if (args.accountNumber != null) patch.flutterwavePayoutAccountNumber = args.accountNumber;
    await ctx.db.patch(args.userId, patch);
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
 * Pre-funding paid entirely from in-platform wallet (no Flutterwave card charge).
 */
export const completePreFundingWithWalletOnlyInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
    fundingGrossAmount: v.number(),
    currency: v.string(),
    walletCreditCents: v.number(),
  },
  handler: async (ctx, args) => {
    assertUsdCurrency(args.currency, "completePreFundingWithWalletOnlyInternal");
    const user = (await ctx.db.get(args.userId)) as Doc<"users"> | null;
    if (!user || user.status !== "active" || user.role !== "client") {
      throw new Error("Only clients can complete funding");
    }
    const project = (await ctx.db.get(args.projectId)) as Doc<"projects"> | null;
    if (!project || project.clientId !== args.userId) {
      throw new Error("Project not found");
    }
    if (project.status !== "draft" && project.status !== "pending_funding") {
      throw new Error("Project is not in a state that allows payment");
    }

    const grossCents = Math.round(args.fundingGrossAmount * 100);
    if (args.walletCreditCents <= 0 || grossCents <= 0) {
      throw new Error("Invalid amount");
    }
    if (args.walletCreditCents !== grossCents) {
      throw new Error("Wallet funding must cover the full hire total");
    }

    const inFlight = await ctx.db
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
    if (inFlight?.status === "succeeded") {
      throw new Error("Project is already funded");
    }
    if (
      inFlight &&
      (inFlight.status === "pending" || inFlight.status === "processing")
    ) {
      throw new Error("A payment is already being processed for this project");
    }

    const spendable = await ctx.runQuery(
      internalAny.wallets.queries.getClientSpendableWalletCentsInternal,
      { userId: args.userId, currency: args.currency }
    );
    if (spendable < args.walletCreditCents) {
      throw new Error("Insufficient wallet balance");
    }

    const defaultPlatformFee =
      project.platformFee ??
      (await ctx.runQuery(internalAny.platformSettings.queries.getPlatformFeePercentageInternal, {}));
    const platformFeeAmount = (args.fundingGrossAmount * defaultPlatformFee) / 100;
    const netAmount = args.fundingGrossAmount - platformFeeAmount;
    const currencyLower = args.currency.toLowerCase();
    const now = Date.now();
    const txRef = `49gig-wallet-${args.projectId}-${now}`;

    const clientWalletCreditApplied = args.walletCreditCents / 100;

    const paymentId = await ctx.db.insert("payments", {
      projectId: args.projectId,
      type: "pre_funding",
      amount: 0,
      currency: currencyLower,
      platformFee: platformFeeAmount,
      netAmount,
      fundingGrossAmount: args.fundingGrossAmount,
      clientWalletCreditApplied,
      flutterwaveTransactionId: txRef,
      flutterwaveCustomerEmail: user.email,
      status: "succeeded",
      webhookReceived: true,
      webhookReceivedAt: now,
      webhookEventId: "wallet-only",
      createdAt: now,
      updatedAt: now,
      processedAt: now,
    });

    await ctx.runMutation(internalAny.wallets.mutations.debitWallet, {
      userId: args.userId,
      amountCents: args.walletCreditCents,
      currency: currencyLower,
      description: "Applied to hire funding (wallet balance)",
      paymentId,
      category: "hiring_credit",
    });

    const monthsFunded = Math.max(1, project.fundUpfrontMonths ?? 1);
    await ctx.db.patch(args.projectId, {
      status: "funded",
      escrowedAmount: netAmount,
      lastFundedMonthIndex: monthsFunded,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(
      0,
      internalAny.matching.postFundPipeline.runPostFundMatchingForProject,
      { projectId: args.projectId }
    );

    await ctx.db.insert("auditLogs", {
      action: "project_funded",
      actionType: "admin",
      actorId: args.userId,
      actorRole: "system",
      targetType: "project",
      targetId: args.projectId,
      details: {
        paymentId,
        amount: 0,
        netAmount,
        fundedWithWalletOnly: true,
      },
      createdAt: now,
    });

    await ctx.db.insert("auditLogs", {
      action: "payment_succeeded",
      actionType: "admin",
      actorId: args.userId,
      actorRole: "system",
      targetType: "payment",
      targetId: paymentId,
      details: {
        transactionId: txRef,
        amount: 0,
        fundedWithWalletOnly: true,
      },
      createdAt: now,
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    const amountLabel = `${args.fundingGrossAmount} ${args.currency.toUpperCase()}`;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [args.userId],
      title: "Hire funded from wallet",
      message: `Your wallet covered ${amountLabel} for ${project.intakeForm.title}.`,
      type: "payment",
      data: { paymentId, projectId: args.projectId },
    });

    await ctx.runMutation(
      internalAny.referrals.internalMutations.tryCreateReferralAccrualForPreFunding,
      { paymentId }
    );

    return { paymentId, txRef };
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

    const alreadySucceeded = payment.status === "succeeded";

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

    // Webhook + return URL can both call this; run fund/match side effects only once
    if (alreadySucceeded) {
      return payment._id;
    }

    // Get project to access clientId for audit logs (projectId optional for payouts)
    const projectId = payment.projectId;
    const project = projectId
      ? (await ctx.db.get(projectId)) as Doc<"projects"> | null
      : null;
    const clientId = project?.clientId;

    if (
      payment.type === "pre_funding" &&
      clientId &&
      (payment.clientWalletCreditApplied ?? 0) > 0
    ) {
      const applyDollars = payment.clientWalletCreditApplied as number;
      const cents = Math.round(applyDollars * 100);
      if (cents > 0) {
        await ctx.runMutation(internalAny.wallets.mutations.debitWallet, {
          userId: clientId,
          amountCents: cents,
          currency: payment.currency.toLowerCase(),
          description: "Applied to hire funding (wallet balance)",
          paymentId: payment._id,
          category: "hiring_credit",
        });
      }
    }

    // Update project based on payment type (fee already taken; netAmount goes to escrow)
    if (payment.type === "pre_funding" && project && projectId) {
      const monthsFunded = Math.max(1, project.fundUpfrontMonths ?? 1);
      await ctx.db.patch(projectId, {
        status: "funded",
        escrowedAmount: payment.netAmount,
        lastFundedMonthIndex: monthsFunded,
        updatedAt: now,
      });

      // Generate post-fund matches, then accept client's selection (ordered pipeline)
      await ctx.scheduler.runAfter(
        0,
        internalAny.matching.postFundPipeline.runPostFundMatchingForProject,
        { projectId }
      );

      // Log audit
      if (clientId) {
        await ctx.db.insert("auditLogs", {
          action: "project_funded",
          actionType: "admin",
          actorId: clientId,
          actorRole: "system",
          targetType: "project",
          targetId: projectId,
          details: {
            paymentId: payment._id,
            amount: payment.amount,
            netAmount: payment.netAmount,
          },
          createdAt: now,
        });
      }
    }

    if (payment.type === "top_up" && project && projectId) {
      const monthsToAdd = Math.max(1, payment.topUpMonths ?? 1);
      const newLastFunded = (project.lastFundedMonthIndex ?? 0) + monthsToAdd;
      const newEscrow = (project.escrowedAmount ?? 0) + payment.netAmount;
      const patch: Record<string, unknown> = {
        escrowedAmount: newEscrow,
        lastFundedMonthIndex: newLastFunded,
        updatedAt: now,
      };
      if (project.status === "cancelled") {
        patch.status = "in_progress";
        patch.paymentReminderSentAt = undefined;
      }
      await ctx.db.patch(projectId, patch);

      if (clientId) {
        await ctx.db.insert("auditLogs", {
          action: "project_top_up",
          actionType: "admin",
          actorId: clientId,
          actorRole: "system",
          targetType: "project",
          targetId: projectId,
          details: {
            paymentId: payment._id,
            monthsAdded: monthsToAdd,
            netAmount: payment.netAmount,
            reactivated: project.status === "cancelled",
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
      const notifyAmount =
        payment.type === "pre_funding" && payment.fundingGrossAmount != null
          ? payment.fundingGrossAmount
          : payment.amount;
      const amountLabel = `${notifyAmount} ${payment.currency}`;
      const title =
        payment.type === "top_up" && project.status === "cancelled"
          ? "Payment received — hire reactivated"
          : "Payment received";
      const message =
        payment.type === "top_up"
          ? project.status === "cancelled"
            ? `We received ${amountLabel}. Your hire "${project.intakeForm.title}" has been reactivated.`
            : `We received ${amountLabel} for the next month(s) of ${project.intakeForm.title}.`
          : `We received ${amountLabel} for ${project.intakeForm.title}.`;
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: [project.clientId],
        title,
        message,
        type: "payment",
        data: { paymentId: payment._id, projectId },
      });

      if (project.matchedFreelancerId && payment.type === "milestone_release") {
        await ctx.scheduler.runAfter(0, sendSystemNotification, {
          userIds: [project.matchedFreelancerId],
          title: "Release payment sent",
          message: `A scheduled release payment was sent for ${project.intakeForm.title}.`,
          type: "payment",
          data: { paymentId: payment._id, projectId },
        });
      }
    }

    if (payment.type === "pre_funding") {
      await ctx.runMutation(
        internalAny.referrals.internalMutations.tryCreateReferralAccrualForPreFunding,
        { paymentId: payment._id }
      );
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

    const alreadyFailed = payment.status === "failed";

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

    // Webhook retries can replay this event; run side effects only on the
    // first transition into "failed".
    if (alreadyFailed) {
      return payment._id;
    }

    // Get project to access clientId for audit log
    const projectId = payment.projectId;
    const project = projectId
      ? (await ctx.db.get(projectId)) as Doc<"projects"> | null
      : null;
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

    if (project && projectId) {
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: [project.clientId],
        title: "Payment failed",
        message: `A payment attempt for ${project.intakeForm.title} failed.`,
        type: "payment",
        data: { paymentId: payment._id, projectId },
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

    const alreadyCancelled = payment.status === "cancelled";

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

    // Webhook retries can replay this event; run side effects only on the
    // first transition into "cancelled".
    if (alreadyCancelled) {
      return payment._id;
    }

    // Get project to access clientId for audit log
    const projectId = payment.projectId;
    const project = projectId
      ? (await ctx.db.get(projectId)) as Doc<"projects"> | null
      : null;
    const clientId = project?.clientId;

    // If pre-funding was cancelled, revert project to draft
    if (payment.type === "pre_funding" && project && projectId) {
      await ctx.db.patch(projectId, {
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

    if (project && projectId) {
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: [project.clientId],
        title: "Payment cancelled",
        message: `A payment for ${project.intakeForm.title} was cancelled.`,
        type: "payment",
        data: { paymentId: payment._id, projectId },
      });
    }

    return payment._id;
  },
});

/**
 * Mark a pending Flutterwave checkout row as terminal so the client can start a new session.
 * Supports initial funding (`pre_funding`) and add-payment (`top_up`).
 * Used when verify fails, checkout is stale, or the user cancels/abandons — avoids duplicate pending rows blocking `createPaymentIntent`.
 */
export const releaseStuckPreFundingPaymentInternal = internalMutation({
  args: {
    paymentId: v.id("payments"),
    reason: v.string(),
    terminalStatus: v.optional(v.union(v.literal("failed"), v.literal("cancelled"))),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) return;
    if (payment.type !== "pre_funding" && payment.type !== "top_up") return;
    if (payment.status !== "pending" && payment.status !== "processing") return;
    const now = Date.now();
    const terminal = args.terminalStatus ?? "failed";
    await ctx.db.patch(args.paymentId, {
      status: terminal,
      errorMessage: args.reason,
      updatedAt: now,
    });
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

    if (args.status === "in_progress") {
      await ctx.runMutation(internalAny.referrals.internalMutations.onProjectEnteredInProgress, {
        projectId: args.projectId,
      });
    }
    if (args.status === "cancelled") {
      await ctx.runMutation(internalAny.referrals.internalMutations.voidReferralAccrualsForProject, {
        projectId: args.projectId,
      });
    }

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

/**
 * Check + record a webhook event as processed.
 * Returns `true` if this is the first time we've seen `{provider, eventId}`;
 * returns `false` if already recorded (caller should short-circuit).
 *
 * Idempotency note: Convex serializes mutations touching the same row, but this
 * uses an index lookup + insert so concurrent distinct mutations can race and
 * both insert. That's fine — downstream handlers still have transition guards,
 * and the dup row is harmless.
 */
export const recordWebhookEventIfNew = internalMutation({
  args: {
    provider: v.union(v.literal("flutterwave")),
    eventId: v.string(),
    eventType: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<boolean> => {
    if (!args.eventId.trim()) {
      return true;
    }
    const existing = await ctx.db
      .query("processedWebhookEvents")
      .withIndex("by_provider_event", (q) =>
        q.eq("provider", args.provider).eq("eventId", args.eventId)
      )
      .first();
    if (existing) {
      return false;
    }
    await ctx.db.insert("processedWebhookEvents", {
      provider: args.provider,
      eventId: args.eventId,
      eventType: args.eventType,
      processedAt: Date.now(),
    });
    return true;
  },
});
