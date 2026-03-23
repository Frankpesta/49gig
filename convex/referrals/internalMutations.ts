import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { FunctionReference } from "convex/server";

const internalAny: any = require("../_generated/api").internal;
const apiModule = require("../_generated/api");
const sendSystemNotificationRef = apiModule.api.notifications.actions
  .sendSystemNotification as FunctionReference<"action">;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const tryCreateReferralAccrualForPreFunding = internalMutation({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment || payment.type !== "pre_funding" || payment.status !== "succeeded") {
      return;
    }
    const projectId = payment.projectId;
    if (!projectId) return;

    const existing = await ctx.db
      .query("referralAccruals")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();
    if (existing) return;

    const project = await ctx.db.get(projectId);
    if (!project) return;

    const client = await ctx.db.get(project.clientId);
    if (!client?.referredByUserId) return;

    const referrer = await ctx.db.get(client.referredByUserId);
    if (!referrer || referrer.status !== "active") return;
    if (referrer._id === client._id) return;

    const pct = await ctx.runQuery(
      internalAny.platformSettings.queries.getReferralBonusPercentageInternal,
      {}
    );
    const netDollars = payment.netAmount;
    const netCents = Math.round(netDollars * 100);
    const bonusCents = Math.floor((netCents * pct) / 100);
    if (bonusCents <= 0) return;

    const now = Date.now();

    await ctx.db.insert("referralAccruals", {
      referrerId: referrer._id,
      referredClientId: client._id,
      projectId,
      firstPaymentId: payment._id,
      netAmountCents: netCents,
      bonusPercent: pct,
      bonusCents,
      status: "awaiting_first_monthly_approval",
      workStartedAt: undefined,
      createdAt: now,
      updatedAt: now,
      creditedAt: undefined,
    });

    await ctx.scheduler.runAfter(0, sendSystemNotificationRef, {
      userIds: [referrer._id],
      title: "Referral progress",
      message: `A hire you referred has been funded. You'll earn ${pct}% of the first funding after the client approves the first monthly payment for that hire.`,
      type: "account",
      data: { projectId, paymentId: payment._id },
    });
  },
});

export const onProjectEnteredInProgress = internalMutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || project.status !== "in_progress") return;

    const startedAt = project.startedAt ?? Date.now();
    const accrual = await ctx.db
      .query("referralAccruals")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();
    if (!accrual || accrual.status !== "awaiting_in_progress") return;

    const now = Date.now();
    await ctx.db.patch(accrual._id, {
      status: "awaiting_eligibility_period",
      workStartedAt: startedAt,
      updatedAt: now,
    });
  },
});

export const voidReferralAccrualsForProject = internalMutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const accrual = await ctx.db
      .query("referralAccruals")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();
    if (!accrual) return;
    if (accrual.status === "credited" || accrual.status === "void") return;
    const now = Date.now();
    await ctx.db.patch(accrual._id, { status: "void", updatedAt: now });
  },
});

/**
 * When the client approves the first monthly cycle for a hire, credit the referrer
 * (client or freelancer) if a referral accrual exists for that project.
 */
export const creditReferralOnFirstMonthlyApproval = internalMutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const approved = await ctx.db
      .query("monthlyBillingCycles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();
    if (approved.length !== 1) return;

    const a = await ctx.db
      .query("referralAccruals")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();
    if (!a) return;

    const latest = await ctx.db.get(a._id);
    if (!latest || latest.status === "credited" || latest.status === "void") return;

    const creditable = new Set([
      "awaiting_first_monthly_approval",
      "awaiting_in_progress",
    ]);
    if (!creditable.has(latest.status)) return;

    const now = Date.now();
    const project = await ctx.db.get(latest.projectId);
    if (!project || project.status === "cancelled") {
      await ctx.db.patch(latest._id, { status: "void", updatedAt: now });
      return;
    }

    const referrer = await ctx.db.get(latest.referrerId);
    if (!referrer || referrer.status !== "active") {
      await ctx.db.patch(latest._id, { status: "void", updatedAt: now });
      return;
    }

    const pay = await ctx.db.get(latest.firstPaymentId);
    const currency = (pay?.currency ?? "usd").toLowerCase();

    const category =
      referrer.role === "client"
        ? ("client_referral_payout" as const)
        : ("referral_bonus" as const);

    await ctx.runMutation(internalAny.wallets.mutations.getOrCreateWallet, {
      userId: referrer._id,
      currency,
    });

    await ctx.runMutation(internalAny.wallets.mutations.creditWallet, {
      userId: referrer._id,
      amountCents: latest.bonusCents,
      currency,
      description:
        referrer.role === "client"
          ? "Referral reward (first month approved)"
          : "Referral reward (first month approved)",
      projectId: latest.projectId,
      paymentId: latest.firstPaymentId,
      category,
    });

    await ctx.db.patch(latest._id, {
      status: "credited",
      creditedAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, sendSystemNotificationRef, {
      userIds: [referrer._id],
      title: "Referral reward credited",
      message:
        referrer.role === "client"
          ? `You received ${(latest.bonusCents / 100).toFixed(2)} ${currency.toUpperCase()} referral reward in your wallet (you can withdraw from the Wallet page).`
          : `You received ${(latest.bonusCents / 100).toFixed(2)} ${currency.toUpperCase()} to your wallet from a referral.`,
      type: "payment",
      data: { referralAccrualId: latest._id, projectId: latest.projectId },
    });
  },
});

export const creditDueReferralAccruals = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const pending = await ctx.db
      .query("referralAccruals")
      .withIndex("by_status", (q) => q.eq("status", "awaiting_eligibility_period"))
      .collect();

    for (const a of pending) {
      const fresh = await ctx.db.get(a._id);
      if (!fresh || fresh.status !== "awaiting_eligibility_period") continue;

      const start = fresh.workStartedAt;
      if (!start || now < start + SEVEN_DAYS_MS) continue;

      const project = await ctx.db.get(fresh.projectId);
      if (!project || project.status === "cancelled") {
        await ctx.db.patch(fresh._id, { status: "void", updatedAt: now });
        continue;
      }

      const referrer = await ctx.db.get(fresh.referrerId);
      if (!referrer || referrer.status !== "active") {
        await ctx.db.patch(fresh._id, { status: "void", updatedAt: now });
        continue;
      }

      const pay = await ctx.db.get(fresh.firstPaymentId);
      const currency = (pay?.currency ?? "usd").toLowerCase();

      const category =
        referrer.role === "client"
          ? ("client_referral_payout" as const)
          : ("referral_bonus" as const);

      await ctx.runMutation(internalAny.wallets.mutations.getOrCreateWallet, {
        userId: referrer._id,
        currency,
      });

      await ctx.runMutation(internalAny.wallets.mutations.creditWallet, {
        userId: referrer._id,
        amountCents: fresh.bonusCents,
        currency,
        description:
          referrer.role === "client"
            ? "Referral reward (withdrawable)"
            : "Referral reward",
        projectId: fresh.projectId,
        paymentId: fresh.firstPaymentId,
        category,
      });

      await ctx.db.patch(fresh._id, {
        status: "credited",
        creditedAt: now,
        updatedAt: now,
      });

      await ctx.scheduler.runAfter(0, sendSystemNotificationRef, {
        userIds: [referrer._id],
        title: "Referral reward credited",
        message:
          referrer.role === "client"
            ? `You received ${(fresh.bonusCents / 100).toFixed(2)} ${currency.toUpperCase()} referral reward in your wallet (you can withdraw from the Wallet page).`
            : `You received ${(fresh.bonusCents / 100).toFixed(2)} ${currency.toUpperCase()} to your wallet from a referral.`,
        type: "payment",
        data: { referralAccrualId: fresh._id, projectId: fresh.projectId },
      });
    }
  },
});
