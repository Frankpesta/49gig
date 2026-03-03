import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";
import type { FunctionReference } from "convex/server";

const apiModule = require("../_generated/api");
const api = apiModule as {
  api: { notifications: { actions: { sendSystemNotification: unknown } } };
};
const internalAny: any = apiModule.internal;

/**
 * Approve a monthly billing cycle (client action).
 * Credits freelancer(s) wallet(s) and updates cycle status.
 */
export const approveMonthlyCycle = mutation({
  args: {
    monthlyCycleId: v.id("monthlyBillingCycles"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || (user as Doc<"users">).status !== "active") {
      throw new Error("Not authenticated");
    }

    const cycle = await ctx.db.get(args.monthlyCycleId);
    if (!cycle) {
      throw new Error("Monthly cycle not found");
    }
    if (cycle.status !== "pending") {
      throw new Error(`Cycle is not pending (status: ${cycle.status})`);
    }

    const project = await ctx.db.get(cycle.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.clientId !== (user as Doc<"users">)._id) {
      throw new Error("Only the project client can approve monthly cycles");
    }

    const now = Date.now();

    // Get freelancer(s)
    const freelancerIds: Doc<"users">["_id"][] = project.matchedFreelancerId
      ? [project.matchedFreelancerId]
      : project.matchedFreelancerIds ?? [];

    if (freelancerIds.length === 0) {
      throw new Error("Project has no matched freelancer(s)");
    }

    const amountPerFreelancerCents = Math.floor(cycle.amountCents / freelancerIds.length);
    const remainder = cycle.amountCents - amountPerFreelancerCents * freelancerIds.length;

    // Credit each freelancer's wallet (creates wallet if needed)
    for (let i = 0; i < freelancerIds.length; i++) {
      const fid = freelancerIds[i];
      const shareCents = amountPerFreelancerCents + (i === 0 ? remainder : 0);
      if (shareCents <= 0) continue;

      const monthLabel = new Date(cycle.monthStartDate).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      await ctx.scheduler.runAfter(0, internalAny.wallets.mutations.creditWallet, {
        userId: fid,
        amountCents: shareCents,
        currency: cycle.currency,
        description: `Monthly approval: ${project.intakeForm.title} - ${monthLabel}`,
        projectId: cycle.projectId,
        monthlyCycleId: args.monthlyCycleId,
      });
    }

    // Create payment record(s) for audit - one per freelancer
    for (let i = 0; i < freelancerIds.length; i++) {
      const fid = freelancerIds[i];
      const shareCents = amountPerFreelancerCents + (i === 0 ? remainder : 0);
      if (shareCents <= 0) continue;

      await ctx.scheduler.runAfter(0, internalAny.payments.mutations.createPayment, {
        projectId: cycle.projectId,
        monthlyCycleId: args.monthlyCycleId,
        type: "monthly_release",
        amount: shareCents / 100,
        currency: cycle.currency,
        platformFee: 0,
        netAmount: shareCents / 100,
        userId: fid,
        status: "succeeded",
      });
    }

    // Update cycle status
    await ctx.db.patch(args.monthlyCycleId, {
      status: "approved",
      approvedBy: (user as Doc<"users">)._id,
      approvedAt: now,
      updatedAt: now,
    });

    // Decrease project escrowed amount
    const totalReleased = cycle.amountCents;
    await ctx.db.patch(cycle.projectId, {
      escrowedAmount: Math.max(0, project.escrowedAmount - totalReleased / 100),
      updatedAt: now,
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    const monthLabel = new Date(cycle.monthStartDate).toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: freelancerIds,
      title: "Monthly payment approved",
      message: `Client approved ${monthLabel} payment for ${project.intakeForm.title}. Funds have been added to your wallet.`,
      type: "payment",
      data: { projectId: cycle.projectId, monthlyCycleId: args.monthlyCycleId },
    });

    return { success: true };
  },
});

/**
 * Ensure monthly cycles exist for a project (client/admin). Idempotent.
 * Use when cycles are missing for an in_progress project.
 */
export const ensureMonthlyCycles = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || (user as Doc<"users">).status !== "active") {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const isClient = project.clientId === (user as Doc<"users">)._id;
    const isAdmin = (user as Doc<"users">).role === "admin";
    if (!isClient && !isAdmin) {
      throw new Error("Only the project client or admin can create monthly cycles");
    }

    if (project.status !== "matched" && project.status !== "in_progress") {
      throw new Error("Monthly cycles can only be created for matched or in-progress projects");
    }

    await ctx.scheduler.runAfter(0, internalAny.monthlyBillingCycles.mutations.autoCreateMonthlyCyclesInternal, {
      projectId: args.projectId,
    });

    return { success: true, message: "Monthly cycles will be created shortly" };
  },
});

/**
 * Internal: create monthly billing cycles for a project (called after match acceptance)
 */
export const autoCreateMonthlyCyclesInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return [];

    const existing = await ctx.db
      .query("monthlyBillingCycles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();
    if (existing) return [];

    const monthMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let startMs = project.intakeForm.startDate ?? 0;
    let endMs = project.intakeForm.endDate ?? 0;
    let durationMs = endMs - startMs;
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      // Fallback when dates missing/invalid: 3 months from now
      startMs = now;
      endMs = now + 3 * monthMs;
      durationMs = 3 * monthMs;
    }
    const durationMonths = Math.max(1, Math.ceil(durationMs / monthMs));

    const platformFeeDoc = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "platformFeePercentage"))
      .first();
    const defaultFee = platformFeeDoc && typeof platformFeeDoc.value === "number"
      ? (platformFeeDoc.value >= 0 && platformFeeDoc.value <= 100 ? platformFeeDoc.value : 25)
      : 25;
    const platformFeePercent = project.platformFee ?? defaultFee;
    const netPercent = 100 - platformFeePercent;
    const totalNet = (project.totalAmount * netPercent) / 100;
    const amountPerMonth = totalNet / durationMonths;
    const amountPerMonthCents = Math.round(amountPerMonth * 100);

    const cycleIds: Doc<"monthlyBillingCycles">["_id"][] = [];

    for (let i = 0; i < durationMonths; i++) {
      const monthStart = startMs + i * monthMs;
      const monthEnd = Math.min(monthStart + monthMs, endMs);

      const id = await ctx.db.insert("monthlyBillingCycles", {
        projectId: args.projectId,
        monthIndex: i + 1,
        monthStartDate: monthStart,
        monthEndDate: monthEnd,
        amountCents: amountPerMonthCents,
        currency: project.currency,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });
      cycleIds.push(id);
    }

    await ctx.db.insert("auditLogs", {
      action: "monthly_cycles_auto_created",
      actionType: "admin",
      actorId: project.clientId,
      actorRole: "system",
      targetType: "project",
      targetId: args.projectId,
      details: {
        cycleCount: durationMonths,
        totalNetCents: amountPerMonthCents * durationMonths,
        amountPerMonthCents,
      },
      createdAt: now,
    });

    return cycleIds;
  },
});
