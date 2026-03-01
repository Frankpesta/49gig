import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";

/**
 * Get wallet for current user (freelancer)
 */
export const getMyWallet = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || (user as Doc<"users">).status !== "active") return null;

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", (user as Doc<"users">)._id))
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
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || (user as Doc<"users">).status !== "active") return null;

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", (user as Doc<"users">)._id))
      .first();

    const availableCents = wallet?.balanceCents ?? 0;

    // Pending: sum of freelancer's share from monthly cycles awaiting client approval
    const userId = (user as Doc<"users">)._id;
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
          q.eq(q.field("status"), "funded")
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

    let pendingCents = 0;
    for (const project of myProjects) {
      const freelancerCount = project.matchedFreelancerId
        ? 1
        : (project.matchedFreelancerIds?.length ?? 1);
      const cycles = await ctx.db
        .query("monthlyBillingCycles")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();
      for (const c of cycles) {
        pendingCents += Math.floor(c.amountCents / freelancerCount);
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

    return {
      availableCents,
      pendingCents,
      withdrawnCents,
    };
  },
});

/**
 * Get wallet transactions for current user
 */
export const getMyWalletTransactions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || (user as Doc<"users">).status !== "active") return [];

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", (user as Doc<"users">)._id))
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
