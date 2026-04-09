import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { ensureUserReferralCode } from "./helpers";
import { clientBankWithdrawableCents } from "../wallets/clientBalanceMath";

/** Assign a share code if missing (idempotent). */
export const ensureMyReferralCode = mutation({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await getCurrentUser(ctx);
    if (!user || user.status !== "active") {
      throw new Error("Not authenticated");
    }
    const code = await ensureUserReferralCode(ctx, user._id);
    return { referralCode: code };
  },
});

/**
 * Crypto withdrawal request (client wallet funds excluding legacy hiring-only credit).
 * Admin reviews and manually sends payment, then marks as completed.
 */
export const requestClientReferralCryptoPayout = mutation({
  args: {
    amountCents: v.number(),
    cryptoNetwork: v.string(),
    cryptoAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.status !== "active" || user.role !== "client") {
      throw new Error("Only clients can submit this request");
    }
    if (args.amountCents < 100) throw new Error("Minimum request is $1.00");
    if (!args.cryptoNetwork.trim()) throw new Error("Crypto network is required");
    if (!args.cryptoAddress.trim()) throw new Error("Wallet address is required");

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (!wallet) throw new Error("No wallet balance");

    const txs = await ctx.db
      .query("walletTransactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .collect();
    const cur = (wallet.currency ?? "usd").toLowerCase();
    const available = clientBankWithdrawableCents(txs, cur);
    if (args.amountCents > available)
      throw new Error("Insufficient withdrawable balance");

    const existing = await ctx.db
      .query("clientReferralPayoutRequests")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
    if (existing) throw new Error("You already have a pending payout request.");

    const now = Date.now();
    await ctx.db.insert("clientReferralPayoutRequests", {
      userId: user._id,
      amountCents: args.amountCents,
      currency: wallet.currency ?? "usd",
      method: "crypto",
      cryptoNetwork: args.cryptoNetwork.trim(),
      cryptoAddress: args.cryptoAddress.trim(),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * PayPal withdrawal request (client wallet funds excluding legacy hiring-only credit).
 * Admin reviews and manually sends payment, then marks as completed.
 */
export const requestClientReferralPaypalPayout = mutation({
  args: {
    amountCents: v.number(),
    paypalEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.status !== "active" || user.role !== "client") {
      throw new Error("Only clients can submit this request");
    }
    if (args.amountCents < 100) {
      throw new Error("Minimum request is $1.00");
    }
    const email = args.paypalEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("A valid PayPal email address is required");
    }

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (!wallet) throw new Error("No wallet balance");

    const txs = await ctx.db
      .query("walletTransactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .collect();
    const cur = (wallet.currency ?? "usd").toLowerCase();
    const available = clientBankWithdrawableCents(txs, cur);
    if (args.amountCents > available) {
      throw new Error("Insufficient withdrawable balance");
    }

    // Check for an already-pending request to avoid duplicates
    const existing = await ctx.db
      .query("clientReferralPayoutRequests")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
    if (existing) {
      throw new Error("You already have a pending payout request. Please wait for it to be processed.");
    }

    const now = Date.now();
    await ctx.db.insert("clientReferralPayoutRequests", {
      userId: user._id,
      amountCents: args.amountCents,
      currency: wallet.currency ?? "usd",
      method: "paypal",
      paypalEmail: email,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Admin: mark a client payout request as completed (funds sent off-platform).
 * Deducts from the client's wallet via a completed debit.
 */
export const markClientPayoutCompleted = mutation({
  args: {
    requestId: v.id("clientReferralPayoutRequests"),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await getCurrentUser(ctx);
    if (!admin || admin.role !== "admin") {
      throw new Error("Only admins can mark payouts as completed");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Payout request not found");
    if (request.status !== "pending" && request.status !== "processing") {
      throw new Error("This request is already finalized");
    }

    const now = Date.now();

    // Deduct from client wallet as a withdrawal_referral debit
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", request.userId))
      .first();
    if (wallet) {
      await ctx.db.insert("walletTransactions", {
        walletId: wallet._id,
        userId: request.userId,
        type: "debit",
        category: "withdrawal_referral",
        amountCents: request.amountCents,
        currency: request.currency,
        status: "completed",
        description: request.method === "paypal"
          ? `PayPal payout to ${request.paypalEmail}`
          : `Crypto payout (${request.cryptoNetwork}) to ${request.cryptoAddress}`,
        createdAt: now,
      });
    }

    await ctx.db.patch(args.requestId, {
      status: "completed",
      adminNote: args.adminNote,
      processedBy: admin._id,
      processedAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Admin: reject a client referral payout request.
 */
export const rejectClientPayout = mutation({
  args: {
    requestId: v.id("clientReferralPayoutRequests"),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await getCurrentUser(ctx);
    if (!admin || admin.role !== "admin") {
      throw new Error("Only admins can reject payouts");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Payout request not found");
    if (request.status !== "pending") {
      throw new Error("Only pending requests can be rejected");
    }

    const now = Date.now();
    await ctx.db.patch(args.requestId, {
      status: "rejected",
      adminNote: args.adminNote,
      processedBy: admin._id,
      processedAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});
