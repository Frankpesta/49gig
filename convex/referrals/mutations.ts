import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";
import { ensureUserReferralCode } from "./helpers";

function sumClientReferralCashCents(txs: Doc<"walletTransactions">[]): number {
  let sum = 0;
  for (const t of txs) {
    if (t.status !== "completed") continue;
    if (t.type === "credit" && t.category === "client_referral_payout") {
      sum += t.amountCents;
    } else if (t.type === "debit" && t.category === "withdrawal_referral") {
      sum -= t.amountCents;
    }
  }
  return Math.max(0, sum);
}

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
 * Crypto (or other manual) withdrawal request for client referral cash.
 * Ops processes outside automated Flutterwave.
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
    if (args.amountCents < 100) {
      throw new Error("Minimum request is $1.00");
    }
    const net = args.cryptoNetwork.trim();
    const addr = args.cryptoAddress.trim();
    if (!net || !addr) {
      throw new Error("Network and wallet address are required");
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
    const available = sumClientReferralCashCents(txs);
    if (args.amountCents > available) {
      throw new Error("Insufficient referral cash balance");
    }

    const now = Date.now();
    await ctx.db.insert("clientReferralPayoutRequests", {
      userId: user._id,
      amountCents: args.amountCents,
      currency: wallet.currency ?? "usd",
      method: "crypto",
      cryptoNetwork: net,
      cryptoAddress: addr,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});
