import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";
import {
  clientBankWithdrawableCents,
  sumClientReferralHiringCents,
  sumClientSpendableCentsForCurrency,
} from "./clientBalanceMath";
import { computeTeamPoolShareCentsByFreelancerId } from "../teamEscrowShares";

/**
 * Internal: client hiring balance from referral rewards (same currency as project checkout).
 */
export const getClientReferralHiringBalanceCentsInternal = internalQuery({
  args: {
    userId: v.id("users"),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!wallet) return 0;
    const cur = args.currency.toLowerCase();
    const txs = await ctx.db
      .query("walletTransactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .collect();
    return sumClientReferralHiringCents(txs, cur);
  },
});

/**
 * Internal: total client wallet balance usable toward pre-funding (same currency as checkout).
 * Includes referral hiring credit, withdrawable referral cash, escrow returns, etc.
 */
export const getClientSpendableWalletCentsInternal = internalQuery({
  args: {
    userId: v.id("users"),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!wallet) return 0;
    const cur = args.currency.toLowerCase();
    const txs = await ctx.db
      .query("walletTransactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .collect();
    return sumClientSpendableCentsForCurrency(txs, cur);
  },
});

/**
 * Client: withdrawable referral rewards (credited after first monthly approval).
 * Excludes legacy hiring-only credits (client_referral_credit).
 */
export const getClientReferralCashBalanceCents = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.userId);
    if (!user || user.role !== "client") return { cents: 0 };

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (!wallet) return { cents: 0 };

    const txs = await ctx.db
      .query("walletTransactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .collect();

    let sum = 0;
    for (const t of txs) {
      if (t.status !== "completed") continue;
      if (t.type === "credit" && t.category === "client_referral_payout") {
        sum += t.amountCents;
      } else if (t.type === "debit" && t.category === "withdrawal_referral") {
        sum -= t.amountCents;
      }
    }
    return { cents: Math.max(0, sum) };
  },
});

/** Client: referral hiring credits available toward pre-funding (not withdrawable). */
export const getMyClientReferralHiringBalance = query({
  args: {
    userId: v.optional(v.id("users")),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.userId);
    if (!user || user.role !== "client") {
      return { cents: 0 };
    }
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (!wallet) return { cents: 0 };
    const txs = await ctx.db
      .query("walletTransactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .collect();
    return {
      cents: sumClientReferralHiringCents(txs, args.currency.toLowerCase()),
    };
  },
});

/**
 * Client: spendable wallet toward a new hire (pre-funding), plus referral-hiring subset for UI.
 */
export const getMyClientPrefundingWalletBreakdown = query({
  args: {
    userId: v.optional(v.id("users")),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.userId);
    if (!user || user.role !== "client") {
      return {
        spendableCents: 0,
        referralHiringCents: 0,
        bankWithdrawableCents: 0,
      };
    }
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (!wallet) {
      return {
        spendableCents: 0,
        referralHiringCents: 0,
        bankWithdrawableCents: 0,
      };
    }
    const cur = args.currency.toLowerCase();
    const txs = await ctx.db
      .query("walletTransactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .collect();
    return {
      spendableCents: sumClientSpendableCentsForCurrency(txs, cur),
      referralHiringCents: sumClientReferralHiringCents(txs, cur),
      bankWithdrawableCents: clientBankWithdrawableCents(txs, cur),
    };
  },
});

async function resolveUser(ctx: any, userId?: Doc<"users">["_id"]): Promise<Doc<"users"> | null> {
  if (userId) {
    const user = await ctx.db.get(userId);
    if (!user || user.status !== "active") return null;
    return user as Doc<"users">;
  }
  const user = await getCurrentUser(ctx);
  if (!user || (user as Doc<"users">).status !== "active") return null;
  return user as Doc<"users">;
}

/**
 * Internal: sum of monthly_release payments (succeeded) for a freelancer
 */
export const getMonthlyReleasePaymentsSumInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    let sum = 0;
    const byRecipient = await ctx.db
      .query("payments")
      .withIndex("by_recipient", (q) => q.eq("recipientId", args.userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "monthly_release"),
          q.eq(q.field("status"), "succeeded")
        )
      )
      .collect();
    sum += byRecipient.reduce((s, p) => s + Math.round((p.netAmount ?? p.amount) * 100), 0);

    const singleProjects = await ctx.db
      .query("projects")
      .withIndex("by_freelancer", (q) => q.eq("matchedFreelancerId", args.userId))
      .collect();
    for (const proj of singleProjects) {
      const payments = await ctx.db
        .query("payments")
        .withIndex("by_project", (q) => q.eq("projectId", proj._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("type"), "monthly_release"),
            q.eq(q.field("status"), "succeeded")
          )
        )
        .collect();
      for (const p of payments) {
        if (!byRecipient.some((r) => r._id === p._id)) {
          sum += Math.round((p.netAmount ?? p.amount) * 100);
        }
      }
    }
    return sum;
  },
});

/**
 * Internal: sum of credit walletTransactions for a user
 */
export const getWalletCreditsSumInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!wallet) return 0;
    const tx = await ctx.db
      .query("walletTransactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "credit"),
          q.eq(q.field("status"), "completed")
        )
      )
      .collect();
    return tx.reduce((s, t) => s + t.amountCents, 0);
  },
});

/**
 * Get wallet for current user (freelancer)
 */
export const getMyWallet = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.userId);
    if (!user) return null;

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return wallet;
  },
});

/**
 * Get wallet by user ID (public - for own wallet checks)
 */
export const getWalletByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/**
 * Get wallet by user ID (internal - for actions)
 */
export const getWalletByUserIdInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/**
 * Get wallet balance stats: available, pending (awaiting client approval), withdrawn
 */
export const getWalletStats = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.userId);
    if (!user) return null;

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    // Available: derive from walletTransactions (credits - debits); if 0 but payments exist (sync issue), fallback to sum of monthly_release payments
    let availableCents = wallet?.balanceCents ?? 0;
    if (wallet) {
      const allTx = await ctx.db
        .query("walletTransactions")
        .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
        .collect();
      const credits = allTx
        .filter(
          (t) =>
            (t.type === "credit" || t.type === "refund") &&
            t.status === "completed"
        )
        .reduce((s, t) => s + t.amountCents, 0);
      const debits = allTx
        .filter((t) => t.type === "debit" && t.status === "completed")
        .reduce((s, t) => s + t.amountCents, 0);
      availableCents = Math.max(0, credits - debits);
    }
    const userId = user._id;
    if (availableCents === 0) {
      const paymentsAsRecipient = await ctx.db
        .query("payments")
        .withIndex("by_recipient", (q) => q.eq("recipientId", userId))
        .filter((q) =>
          q.and(
            q.eq(q.field("type"), "monthly_release"),
            q.eq(q.field("status"), "succeeded")
          )
        )
        .collect();
      const fromProjects = await ctx.db
        .query("projects")
        .withIndex("by_freelancer", (q) => q.eq("matchedFreelancerId", userId))
        .collect();
      const projectIds = fromProjects.map((p) => p._id);
      let fromPayments = paymentsAsRecipient.reduce((s, p) => s + Math.round((p.netAmount ?? p.amount) * 100), 0);
      for (const projectId of projectIds) {
        const projectPayments = await ctx.db
          .query("payments")
          .withIndex("by_project", (q) => q.eq("projectId", projectId))
          .filter((q) =>
            q.and(
              q.eq(q.field("type"), "monthly_release"),
              q.eq(q.field("status"), "succeeded")
            )
          )
          .collect();
        for (const p of projectPayments) {
          if (!paymentsAsRecipient.some((r) => r._id === p._id)) {
            fromPayments += Math.round((p.netAmount ?? p.amount) * 100);
          }
        }
      }
      if (fromPayments > 0) availableCents = fromPayments;
    }

    let pendingCents = 0;
    if (user.role === "client") {
      if (wallet) {
        const pendingRefunds = await ctx.db
          .query("walletTransactions")
          .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
          .filter((q) =>
            q.and(
              q.eq(q.field("type"), "refund"),
              q.eq(q.field("status"), "pending")
            )
          )
          .collect();
        pendingCents = pendingRefunds.reduce((sum, t) => sum + t.amountCents, 0);
      }
    } else {
      // Pending: sum of freelancer's share from monthly cycles awaiting client approval
      const singleProjects = await ctx.db
        .query("projects")
        .withIndex("by_freelancer", (q) => q.eq("matchedFreelancerId", userId))
        .collect();

      const allProjects = await ctx.db
        .query("projects")
        .filter((q) =>
          q.or(
            q.eq(q.field("status"), "in_progress"),
            q.eq(q.field("status"), "matched"),
            q.eq(q.field("status"), "funded"),
            q.eq(q.field("status"), "disputed")
          )
        )
        .collect();
      const teamProjects = allProjects.filter(
        (p) => p.matchedFreelancerIds?.includes(userId)
      );

      const myProjects = [...singleProjects];
      for (const p of teamProjects) {
        if (!singleProjects.some((sp) => sp._id === p._id)) myProjects.push(p);
      }

      for (const project of myProjects) {
        const teamIds = project.matchedFreelancerId
          ? [project.matchedFreelancerId]
          : [...(project.matchedFreelancerIds ?? [])];
        if (teamIds.length === 0) continue;

        const cycles = await ctx.db
          .query("monthlyBillingCycles")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .filter((q) => q.eq(q.field("status"), "pending"))
          .collect();
        if (cycles.length === 0) continue;

        const poolCents = cycles.reduce((s, c) => s + Math.max(0, c.amountCents), 0);
        if (poolCents <= 0) continue;

        const shareMap = await computeTeamPoolShareCentsByFreelancerId(
          ctx,
          project._id,
          teamIds,
          project.teamBudgetBreakdown,
          poolCents
        );
        pendingCents += shareMap.get(String(userId)) ?? 0;
      }
    }

    // Withdrawn: sum of completed debit transactions
    let withdrawnCents = 0;
    if (wallet) {
      const debits = await ctx.db
        .query("walletTransactions")
        .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("type"), "debit"),
            q.eq(q.field("status"), "completed")
          )
        )
        .collect();
      withdrawnCents = debits.reduce((sum, t) => sum + t.amountCents, 0);
    }

    let needsReconciliation = false;
    if (availableCents > 0 && wallet) {
      const credits = await ctx.db
        .query("walletTransactions")
        .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("type"), "credit"),
            q.eq(q.field("status"), "completed")
          )
        )
        .collect();
      const creditsSum = credits.reduce((s, t) => s + t.amountCents, 0);
      needsReconciliation = creditsSum === 0;
    }

    return {
      availableCents,
      pendingCents,
      withdrawnCents,
      needsReconciliation,
    };
  },
});

/**
 * Get wallet transactions for current user
 */
export const getMyWalletTransactions = query({
  args: {
    limit: v.optional(v.number()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await resolveUser(ctx, args.userId);
    if (!user) return [];

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!wallet) return [];

    const limit = args.limit ?? 50;
    const transactions = await ctx.db
      .query("walletTransactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .order("desc")
      .take(limit);

    return transactions;
  },
});
