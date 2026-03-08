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
