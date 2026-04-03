import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get or create wallet for a user (internal).
 * Returns wallet ID.
 */
export const getOrCreateWallet = internalMutation({
  args: {
    userId: v.id("users"),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) return existing._id;

    const now = Date.now();
    const walletId = await ctx.db.insert("wallets", {
      userId: args.userId,
      balanceCents: 0,
      currency: args.currency ?? "usd",
      updatedAt: now,
    });
    return walletId;
  },
});

/**
 * Credit wallet (internal) - e.g. from monthly approval
 * Creates wallet if it doesn't exist.
 */
export const creditWallet = internalMutation({
  args: {
    userId: v.id("users"),
    amountCents: v.number(),
    currency: v.string(),
    description: v.string(),
    projectId: v.optional(v.id("projects")),
    monthlyCycleId: v.optional(v.id("monthlyBillingCycles")),
    paymentId: v.optional(v.id("payments")),
    category: v.optional(
      v.union(
        v.literal("earnings"),
        v.literal("referral_bonus"),
        v.literal("client_referral_credit"),
        v.literal("client_referral_payout"),
        v.literal("hiring_credit"),
        v.literal("withdrawal_referral")
      )
    ),
  },
  handler: async (ctx, args) => {
    let wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!wallet) {
      const walletId = await ctx.db.insert("wallets", {
        userId: args.userId,
        balanceCents: 0,
        currency: args.currency,
        updatedAt: Date.now(),
      });
      wallet = (await ctx.db.get(walletId))!;
    }

    const newBalance = (wallet.balanceCents ?? 0) + args.amountCents;
    const now = Date.now();

    await ctx.db.patch(wallet._id, {
      balanceCents: newBalance,
      updatedAt: now,
    });

    await ctx.db.insert("walletTransactions", {
      walletId: wallet._id,
      userId: args.userId,
      type: "credit",
      category: args.category,
      amountCents: args.amountCents,
      currency: args.currency,
      balanceAfterCents: newBalance,
      description: args.description,
      projectId: args.projectId,
      monthlyCycleId: args.monthlyCycleId,
      paymentId: args.paymentId,
      status: "completed",
      createdAt: now,
    });

    return { walletId: wallet._id, newBalanceCents: newBalance };
  },
});

/**
 * Debit wallet (internal) - e.g. from withdrawal
 */
export const debitWallet = internalMutation({
  args: {
    userId: v.id("users"),
    amountCents: v.number(),
    currency: v.string(),
    description: v.string(),
    flutterwaveTransferId: v.optional(v.string()),
    paymentId: v.optional(v.id("payments")),
    category: v.optional(
      v.union(
        v.literal("earnings"),
        v.literal("referral_bonus"),
        v.literal("client_referral_credit"),
        v.literal("client_referral_payout"),
        v.literal("hiring_credit"),
        v.literal("withdrawal_referral")
      )
    ),
  },
  handler: async (ctx, args) => {
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!wallet) {
      throw new Error(`Wallet not found for user ${args.userId}`);
    }

    if (wallet.balanceCents < args.amountCents) {
      throw new Error("Insufficient wallet balance");
    }

    const newBalance = wallet.balanceCents - args.amountCents;
    const now = Date.now();

    await ctx.db.patch(wallet._id, {
      balanceCents: newBalance,
      updatedAt: now,
    });

    await ctx.db.insert("walletTransactions", {
      walletId: wallet._id,
      userId: args.userId,
      type: "debit",
      category: args.category,
      amountCents: args.amountCents,
      currency: args.currency,
      balanceAfterCents: newBalance,
      description: args.description,
      paymentId: args.paymentId,
      flutterwaveTransferId: args.flutterwaveTransferId,
      status: "completed",
      createdAt: now,
    });

    return { walletId: wallet._id, newBalanceCents: newBalance };
  },
});

/**
 * Record a pending refund credit (does not increase available balance yet).
 */
export const recordPendingRefund = internalMutation({
  args: {
    userId: v.id("users"),
    amountCents: v.number(),
    currency: v.string(),
    description: v.string(),
    projectId: v.optional(v.id("projects")),
    paymentId: v.optional(v.id("payments")),
  },
  handler: async (ctx, args) => {
    if (args.amountCents <= 0) return { success: true };
    let wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!wallet) {
      const walletId = await ctx.db.insert("wallets", {
        userId: args.userId,
        balanceCents: 0,
        currency: args.currency,
        updatedAt: Date.now(),
      });
      wallet = (await ctx.db.get(walletId))!;
    }

    await ctx.db.insert("walletTransactions", {
      walletId: wallet._id,
      userId: args.userId,
      type: "refund",
      amountCents: args.amountCents,
      currency: args.currency,
      description: args.description,
      projectId: args.projectId,
      paymentId: args.paymentId,
      status: "pending",
      createdAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      action: "pending_refund_recorded",
      actionType: "system",
      actorId: args.userId,
      actorRole: "system",
      targetType: "wallet_transaction",
      targetId: wallet._id,
      details: {
        projectId: args.projectId,
        amountCents: args.amountCents,
        currency: args.currency,
        description: args.description,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Mark pending refund holds for a project as consumed when client continues with replacement.
 */
export const clearPendingRefundsForProject = internalMutation({
  args: {
    userId: v.id("users"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!wallet) return { cleared: 0 };

    const pending = await ctx.db
      .query("walletTransactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("projectId"), args.projectId),
          q.eq(q.field("type"), "refund"),
          q.eq(q.field("status"), "pending")
        )
      )
      .collect();

    let cleared = 0;
    for (const tx of pending) {
      await ctx.db.patch(tx._id, {
        status: "failed",
        description: `${tx.description} (consumed as project continuation credit)`,
      });
      await ctx.db.insert("auditLogs", {
        action: "pending_refund_consumed",
        actionType: "system",
        actorId: args.userId,
        actorRole: "system",
        targetType: "wallet_transaction",
        targetId: tx._id,
        details: {
          projectId: args.projectId,
          amountCents: tx.amountCents,
          currency: tx.currency,
        },
        createdAt: Date.now(),
      });
      cleared += 1;
    }

    return { cleared };
  },
});
