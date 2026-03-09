import { action } from "../_generated/server";
import { v } from "convex/values";

const { internal } = require("../_generated/api");

/**
 * Reconcile wallet from payments - credits wallet for monthly_release payments
 * that weren't properly credited (sync issue). Call when wallet shows 0 but
 * transactions page shows released payments.
 */
export const reconcileWalletFromPayments = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<
    { reconciled: false; message: string } | { reconciled: true; creditedCents: number }
  > => {
    const user = await ctx.runQuery(internal.payments.queries.verifyUser, {
      userId: args.userId,
    });
    if (!user || user.role !== "freelancer") {
      throw new Error("Only freelancers can reconcile wallet");
    }

    const paymentsCents = await ctx.runQuery(
      internal.wallets.queries.getMonthlyReleasePaymentsSumInternal,
      { userId: args.userId }
    ) as number;
    const creditsSum = await ctx.runQuery(
      internal.wallets.queries.getWalletCreditsSumInternal,
      { userId: args.userId }
    ) as number;

    const diffCents = paymentsCents - creditsSum;
    if (diffCents <= 0) {
      return { reconciled: false, message: "Wallet already in sync" };
    }

    await ctx.runMutation(internal.wallets.mutations.creditWallet, {
      userId: args.userId,
      amountCents: diffCents,
      currency: "usd",
      description: "Wallet reconciliation from payment records",
    });

    return { reconciled: true, creditedCents: diffCents };
  },
});
