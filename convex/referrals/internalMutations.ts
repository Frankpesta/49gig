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
      status: "awaiting_in_progress",
      workStartedAt: undefined,
      createdAt: now,
      updatedAt: now,
      creditedAt: undefined,
    });

    await ctx.scheduler.runAfter(0, sendSystemNotificationRef, {
      userIds: [referrer._id],
      title: "Referral progress",
      message: `A hire you referred has been funded. You'll earn ${pct}% of the first funding net (after platform fee) once the hire is active for 7 days.`,
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

export const creditDueReferralAccruals = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const pending = await ctx.db
      .query("referralAccruals")
      .withIndex("by_status", (q) => q.eq("status", "awaiting_eligibility_period"))
      .collect();

    for (const a of pending) {
      const start = a.workStartedAt;
      if (!start || now < start + SEVEN_DAYS_MS) continue;

      const project = await ctx.db.get(a.projectId);
      if (!project || project.status === "cancelled") {
        await ctx.db.patch(a._id, { status: "void", updatedAt: now });
        continue;
      }

      const referrer = await ctx.db.get(a.referrerId);
      if (!referrer || referrer.status !== "active") {
        await ctx.db.patch(a._id, { status: "void", updatedAt: now });
        continue;
      }

      const pay = await ctx.db.get(a.firstPaymentId);
      const currency = (pay?.currency ?? "usd").toLowerCase();

      const category =
        referrer.role === "client"
          ? ("client_referral_credit" as const)
          : ("referral_bonus" as const);

      await ctx.runMutation(internalAny.wallets.mutations.getOrCreateWallet, {
        userId: referrer._id,
        currency,
      });

      await ctx.runMutation(internalAny.wallets.mutations.creditWallet, {
        userId: referrer._id,
        amountCents: a.bonusCents,
        currency,
        description:
          referrer.role === "client"
            ? "Referral reward (hiring credit)"
            : "Referral reward",
        projectId: a.projectId,
        paymentId: a.firstPaymentId,
        category,
      });

      await ctx.db.patch(a._id, {
        status: "credited",
        creditedAt: now,
        updatedAt: now,
      });

      await ctx.scheduler.runAfter(0, sendSystemNotificationRef, {
        userIds: [referrer._id],
        title: "Referral reward credited",
        message:
          referrer.role === "client"
            ? `You received hiring credit from a successful referral.`
            : `You received ${(a.bonusCents / 100).toFixed(2)} ${currency.toUpperCase()} to your wallet from a referral.`,
        type: "payment",
        data: { referralAccrualId: a._id, projectId: a.projectId },
      });
    }
  },
});
