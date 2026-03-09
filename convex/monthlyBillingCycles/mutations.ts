import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";
import type { FunctionReference } from "convex/server";
import type { MutationCtx } from "../_generated/server";

const apiModule = require("../_generated/api");
const api = apiModule as {
  api: { notifications: { actions: { sendSystemNotification: unknown } } };
};
const internalAny: any = apiModule.internal;

async function getCurrentUserInMutation(
  ctx: MutationCtx,
  userId?: Doc<"users">["_id"]
): Promise<Doc<"users"> | null> {
  if (userId) {
    const user = await ctx.db.get(userId);
    if (!user || (user as Doc<"users">).status !== "active") return null;
    return user as Doc<"users">;
  }
  const user = await getCurrentUser(ctx);
  if (!user || (user as Doc<"users">).status !== "active") return null;
  return user as Doc<"users">;
}

/** Credit wallet inline (no scheduler) - ensures immediate balance update */
async function creditWalletInline(
  ctx: MutationCtx,
  args: {
    userId: Doc<"users">["_id"];
    amountCents: number;
    currency: string;
    description: string;
    projectId?: Doc<"projects">["_id"];
    monthlyCycleId?: Doc<"monthlyBillingCycles">["_id"];
  }
) {
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

  const currentBalance = wallet.balanceCents ?? 0;
  const newBalance = currentBalance + args.amountCents;
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
    status: "completed",
    createdAt: now,
  });

  return { walletId: wallet._id, newBalanceCents: newBalance };
}

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
    const isClient = project.clientId === (user as Doc<"users">)._id;
    const isAdmin = (user as Doc<"users">).role === "admin";
    if (!isClient && !isAdmin) {
      throw new Error("Only the project client or admin can approve monthly cycles");
    }

    const now = Date.now();

    // Get freelancer(s)
    const freelancerIds: Doc<"users">["_id"][] = project.matchedFreelancerId
      ? [project.matchedFreelancerId]
      : project.matchedFreelancerIds ?? [];

    if (freelancerIds.length === 0) {
      throw new Error("Project has no matched freelancer(s)");
    }

    // Compute share per freelancer: role-based from teamBudgetBreakdown, or equal split
    const breakdown = project.teamBudgetBreakdown;
    let shareCentsByFreelancer: number[];

    if (breakdown && Object.keys(breakdown).length > 0 && freelancerIds.length > 1) {
      const acceptedMatches = await ctx.db
        .query("matches")
        .withIndex("by_project", (q) => q.eq("projectId", cycle.projectId))
        .collect();
      const acceptedByFreelancer = new Map(
        acceptedMatches
          .filter((m) => m.status === "accepted" && freelancerIds.includes(m.freelancerId))
          .map((m) => [m.freelancerId, m])
      );

      const equalShare = Math.floor(cycle.amountCents / freelancerIds.length);
      shareCentsByFreelancer = freelancerIds.map((fid) => {
        const match = acceptedByFreelancer.get(fid);
        const role = match?.teamRole;
        const roleAmount = role && breakdown[role] != null ? breakdown[role] : equalShare;
        return Math.max(0, roleAmount);
      });

      const totalAllocated = shareCentsByFreelancer.reduce((a, b) => a + b, 0);
      const remainder = cycle.amountCents - totalAllocated;
      if (remainder !== 0 && shareCentsByFreelancer.length > 0) {
        shareCentsByFreelancer[0] += remainder;
      }
    } else {
      const amountPerFreelancerCents = Math.floor(cycle.amountCents / freelancerIds.length);
      const remainder = cycle.amountCents - amountPerFreelancerCents * freelancerIds.length;
      shareCentsByFreelancer = freelancerIds.map((_, i) =>
        amountPerFreelancerCents + (i === 0 ? remainder : 0)
      );
    }

    // Credit each freelancer's wallet (creates wallet if needed) - inline for immediate balance update
    for (let i = 0; i < freelancerIds.length; i++) {
      const fid = freelancerIds[i];
      const shareCents = shareCentsByFreelancer[i] ?? 0;
      if (shareCents <= 0) continue;

      const monthLabel = new Date(cycle.monthStartDate).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      await creditWalletInline(ctx, {
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
      const shareCents = shareCentsByFreelancer[i] ?? 0;
      if (shareCents <= 0) continue;

      await ctx.scheduler.runAfter(0, internalAny.payments.mutations.createPayment, {
        projectId: cycle.projectId,
        monthlyCycleId: args.monthlyCycleId,
        type: "monthly_release",
        amount: shareCents / 100,
        currency: cycle.currency,
        platformFee: 0,
        netAmount: shareCents / 100,
        userId: project.clientId,
        recipientId: fid,
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
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const isClient = project.clientId === user._id;
    const isAdmin = user.role === "admin";
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

      const AUTO_RELEASE_DELAY_MS = 48 * 60 * 60 * 1000; // 48 hours after month ends
      const id = await ctx.db.insert("monthlyBillingCycles", {
        projectId: args.projectId,
        monthIndex: i + 1,
        monthStartDate: monthStart,
        monthEndDate: monthEnd,
        amountCents: amountPerMonthCents,
        currency: project.currency,
        status: "pending",
        autoReleaseAt: monthEnd + AUTO_RELEASE_DELAY_MS,
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

    // Auto-approve upfront cycles ONLY when: 1) client selected fundUpfrontMonths, 2) payment received (escrowedAmount > 0), 3) freelancer has signed contract
    const fundUpfront = project.fundUpfrontMonths ?? 0;
    const freelancerIds: Doc<"users">["_id"][] = (
      project.matchedFreelancerId
        ? [project.matchedFreelancerId]
        : project.matchedFreelancerIds ?? project.selectedFreelancerId
          ? [project.selectedFreelancerId]
          : project.selectedFreelancerIds ?? []
    ).filter((id): id is Doc<"users">["_id"] => id != null);
    const signatures = project.freelancerContractSignatures ?? [];
    const allFreelancersSigned =
      freelancerIds.length > 0 &&
      freelancerIds.every((fid) => signatures.some((s) => s.freelancerId === fid));
    const hasPayment = (project.escrowedAmount ?? 0) > 0;

    if (fundUpfront > 0 && cycleIds.length > 0 && allFreelancersSigned && hasPayment) {
      const cyclesToApprove = Math.min(fundUpfront, cycleIds.length);

      const breakdown = project.teamBudgetBreakdown;
      let shareCentsByFreelancer: number[];

      if (breakdown && Object.keys(breakdown).length > 0 && freelancerIds.length > 1) {
        const acceptedMatches = await ctx.db
          .query("matches")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
          .collect();
        const acceptedByFreelancer = new Map(
          acceptedMatches
            .filter((m) => m.status === "accepted" && freelancerIds.includes(m.freelancerId))
            .map((m) => [m.freelancerId, m])
        );

        const equalShare = Math.floor(amountPerMonthCents / freelancerIds.length);
        shareCentsByFreelancer = freelancerIds.map((fid) => {
          const match = acceptedByFreelancer.get(fid);
          const role = match?.teamRole;
          const roleAmount = role && breakdown[role] != null ? breakdown[role] : equalShare;
          return Math.max(0, roleAmount);
        });

        const totalAllocated = shareCentsByFreelancer.reduce((a, b) => a + b, 0);
        const remainder = amountPerMonthCents - totalAllocated;
        if (remainder !== 0 && shareCentsByFreelancer.length > 0) {
          shareCentsByFreelancer[0] += remainder;
        }
      } else {
        const amountPerFreelancerCents = Math.floor(amountPerMonthCents / freelancerIds.length);
        const remainder = amountPerMonthCents - amountPerFreelancerCents * freelancerIds.length;
        shareCentsByFreelancer = freelancerIds.map((_, i) =>
          amountPerFreelancerCents + (i === 0 ? remainder : 0)
        );
      }

      for (let i = 0; i < cyclesToApprove; i++) {
        const cycleId = cycleIds[i];
        const cycle = await ctx.db.get(cycleId);
        if (!cycle || cycle.status !== "pending") continue;

        for (let j = 0; j < freelancerIds.length; j++) {
          const fid = freelancerIds[j];
          const shareCents = shareCentsByFreelancer[j] ?? 0;
          if (shareCents <= 0) continue;

          const monthLabel = new Date(cycle.monthStartDate).toLocaleString("default", {
            month: "short",
            year: "numeric",
          });
          await creditWalletInline(ctx, {
            userId: fid,
            amountCents: shareCents,
            currency: cycle.currency,
            description: `Upfront release: ${project.intakeForm.title} - ${monthLabel}`,
            projectId: cycle.projectId,
            monthlyCycleId: cycleId,
          });

          await ctx.scheduler.runAfter(0, internalAny.payments.mutations.createPayment, {
            projectId: cycle.projectId,
            monthlyCycleId: cycleId,
            type: "monthly_release",
            amount: shareCents / 100,
            currency: cycle.currency,
            platformFee: 0,
            netAmount: shareCents / 100,
            userId: project.clientId,
            recipientId: fid,
            status: "succeeded",
          });
        }

        await ctx.db.patch(cycleId, {
          status: "approved",
          approvedBy: project.clientId,
          approvedAt: now,
          updatedAt: now,
        });
      }

      const totalReleasedCents = amountPerMonthCents * cyclesToApprove;
      await ctx.db.patch(args.projectId, {
        escrowedAmount: Math.max(0, project.escrowedAmount - totalReleasedCents / 100),
        updatedAt: now,
      });
    }

    return cycleIds;
  },
});

/**
 * Internal: auto-release a single monthly cycle (no client approval).
 * Called by cron when autoReleaseAt has passed.
 */
export const autoReleaseMonthlyCycleInternal = internalMutation({
  args: { monthlyCycleId: v.id("monthlyBillingCycles") },
  handler: async (ctx, args) => {
    const cycle = await ctx.db.get(args.monthlyCycleId);
    if (!cycle || cycle.status !== "pending") return { released: false };

    const project = await ctx.db.get(cycle.projectId);
    if (!project) return { released: false };

    const now = Date.now();

    const freelancerIds: Doc<"users">["_id"][] = project.matchedFreelancerId
      ? [project.matchedFreelancerId]
      : project.matchedFreelancerIds ?? [];

    if (freelancerIds.length === 0) return { released: false };

    const breakdown = project.teamBudgetBreakdown;
    let shareCentsByFreelancer: number[];

    if (breakdown && Object.keys(breakdown).length > 0 && freelancerIds.length > 1) {
      const acceptedMatches = await ctx.db
        .query("matches")
        .withIndex("by_project", (q) => q.eq("projectId", cycle.projectId))
        .collect();
      const acceptedByFreelancer = new Map(
        acceptedMatches
          .filter((m) => m.status === "accepted" && freelancerIds.includes(m.freelancerId))
          .map((m) => [m.freelancerId, m])
      );

      const equalShare = Math.floor(cycle.amountCents / freelancerIds.length);
      shareCentsByFreelancer = freelancerIds.map((fid) => {
        const match = acceptedByFreelancer.get(fid);
        const role = match?.teamRole;
        const roleAmount = role && breakdown[role] != null ? breakdown[role] : equalShare;
        return Math.max(0, roleAmount);
      });

      const totalAllocated = shareCentsByFreelancer.reduce((a, b) => a + b, 0);
      const remainder = cycle.amountCents - totalAllocated;
      if (remainder !== 0 && shareCentsByFreelancer.length > 0) {
        shareCentsByFreelancer[0] += remainder;
      }
    } else {
      const amountPerFreelancerCents = Math.floor(cycle.amountCents / freelancerIds.length);
      const remainder = cycle.amountCents - amountPerFreelancerCents * freelancerIds.length;
      shareCentsByFreelancer = freelancerIds.map((_, i) =>
        amountPerFreelancerCents + (i === 0 ? remainder : 0)
      );
    }

    const monthLabel = new Date(cycle.monthStartDate).toLocaleString("default", {
      month: "short",
      year: "numeric",
    });

    for (let i = 0; i < freelancerIds.length; i++) {
      const fid = freelancerIds[i];
      const shareCents = shareCentsByFreelancer[i] ?? 0;
      if (shareCents <= 0) continue;

      await creditWalletInline(ctx, {
        userId: fid,
        amountCents: shareCents,
        currency: cycle.currency,
        description: `Auto-release: ${project.intakeForm.title} - ${monthLabel}`,
        projectId: cycle.projectId,
        monthlyCycleId: args.monthlyCycleId,
      });

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

    await ctx.db.patch(args.monthlyCycleId, {
      status: "approved",
      approvedAt: now,
      updatedAt: now,
    });

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
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: freelancerIds,
      title: "Monthly payment auto-released",
      message: `${monthLabel} payment for ${project.intakeForm.title} was automatically released. Funds have been added to your wallet.`,
      type: "payment",
      data: { projectId: cycle.projectId, monthlyCycleId: args.monthlyCycleId },
    });

    return { released: true };
  },
});

/**
 * Internal: process upfront release for existing cycles.
 * Only releases when freelancer has signed the contract.
 * Called: 1) after payment (may skip if freelancer hasn't signed), 2) when contract becomes fully signed.
 */
export const processUpfrontReleaseForProjectInternal = internalMutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return { released: 0 };

    const fundUpfront = project.fundUpfrontMonths ?? 0;
    if (fundUpfront <= 0) return { released: 0 };

    const freelancerIds: Doc<"users">["_id"][] = (
      project.matchedFreelancerId
        ? [project.matchedFreelancerId]
        : project.matchedFreelancerIds ?? project.selectedFreelancerId
          ? [project.selectedFreelancerId]
          : project.selectedFreelancerIds ?? []
    ).filter((id): id is Doc<"users">["_id"] => id != null);
    if (freelancerIds.length === 0) return { released: 0 };

    // Only release when freelancer has signed - upfront goes to wallet only after contract is signed
    const signatures = project.freelancerContractSignatures ?? [];
    const allFreelancersSigned =
      freelancerIds.every((fid) => signatures.some((s) => s.freelancerId === fid));
    if (!allFreelancersSigned) return { released: 0 };

    const hasPayment = (project.escrowedAmount ?? 0) > 0;
    if (!hasPayment) return { released: 0 };

    const cycles = await ctx.db
      .query("monthlyBillingCycles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const cyclesByMonth = cycles.sort((a, b) => a.monthIndex - b.monthIndex);
    const toRelease = cyclesByMonth
      .filter((c) => c.status === "pending")
      .slice(0, fundUpfront);

    if (toRelease.length === 0) return { released: 0 };

    const amountPerMonthCents = toRelease[0]?.amountCents ?? 0;
    const breakdown = project.teamBudgetBreakdown;
    let shareCentsByFreelancer: number[];

    if (breakdown && Object.keys(breakdown).length > 0 && freelancerIds.length > 1) {
      const acceptedMatches = await ctx.db
        .query("matches")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();
      const acceptedByFreelancer = new Map(
        acceptedMatches
          .filter((m) => m.status === "accepted" && freelancerIds.includes(m.freelancerId))
          .map((m) => [m.freelancerId, m])
      );
      const equalShare = Math.floor(amountPerMonthCents / freelancerIds.length);
      shareCentsByFreelancer = freelancerIds.map((fid) => {
        const match = acceptedByFreelancer.get(fid);
        const role = match?.teamRole;
        const roleAmount = role && breakdown[role] != null ? breakdown[role] : equalShare;
        return Math.max(0, roleAmount);
      });
      const totalAllocated = shareCentsByFreelancer.reduce((a, b) => a + b, 0);
      const remainder = amountPerMonthCents - totalAllocated;
      if (remainder !== 0 && shareCentsByFreelancer.length > 0) {
        shareCentsByFreelancer[0] += remainder;
      }
    } else {
      const amountPerFreelancerCents = Math.floor(amountPerMonthCents / freelancerIds.length);
      const remainder = amountPerMonthCents - amountPerFreelancerCents * freelancerIds.length;
      shareCentsByFreelancer = freelancerIds.map((_, i) =>
        amountPerFreelancerCents + (i === 0 ? remainder : 0)
      );
    }

    const now = Date.now();
    let totalReleasedCents = 0;

    for (const cycle of toRelease) {
      for (let j = 0; j < freelancerIds.length; j++) {
        const fid = freelancerIds[j];
        const shareCents = shareCentsByFreelancer[j] ?? 0;
        if (shareCents <= 0) continue;

        const monthLabel = new Date(cycle.monthStartDate).toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        await creditWalletInline(ctx, {
          userId: fid,
          amountCents: shareCents,
          currency: cycle.currency,
          description: `Upfront release: ${project.intakeForm.title} - ${monthLabel}`,
          projectId: cycle.projectId,
          monthlyCycleId: cycle._id,
        });
        await ctx.scheduler.runAfter(0, internalAny.payments.mutations.createPayment, {
          projectId: cycle.projectId,
          monthlyCycleId: cycle._id,
          type: "monthly_release",
          amount: shareCents / 100,
          currency: cycle.currency,
          platformFee: 0,
          netAmount: shareCents / 100,
          userId: project.clientId,
          recipientId: fid,
          status: "succeeded",
        });
      }
      totalReleasedCents += cycle.amountCents;
      await ctx.db.patch(cycle._id, {
        status: "approved",
        approvedBy: project.clientId,
        approvedAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(args.projectId, {
      escrowedAmount: Math.max(0, project.escrowedAmount - totalReleasedCents / 100),
      updatedAt: now,
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    const monthLabel = toRelease.length === 1
      ? new Date(toRelease[0].monthStartDate).toLocaleString("default", { month: "short", year: "numeric" })
      : `${toRelease.length} months`;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: freelancerIds,
      title: "Upfront payment released",
      message: `${monthLabel} for ${project.intakeForm.title} has been released to your wallet.`,
      type: "payment",
      data: { projectId: args.projectId },
    });

    return { released: toRelease.length };
  },
});

/**
 * Internal: release ALL pending monthly cycles to freelancer wallets.
 * Called when project is marked completed - settles all remaining payments.
 */
export const releaseAllPendingCyclesForProjectInternal = internalMutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return { released: 0 };

    const freelancerIds: Doc<"users">["_id"][] = (
      project.matchedFreelancerId
        ? [project.matchedFreelancerId]
        : project.matchedFreelancerIds ?? []
    ).filter((id): id is Doc<"users">["_id"] => id != null);
    if (freelancerIds.length === 0) return { released: 0 };

    const cycles = await ctx.db
      .query("monthlyBillingCycles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const toRelease = cycles
      .filter((c) => c.status === "pending")
      .sort((a, b) => a.monthIndex - b.monthIndex);

    if (toRelease.length === 0) return { released: 0 };

    const breakdown = project.teamBudgetBreakdown;
    const now = Date.now();
    let totalReleasedCents = 0;

    for (const cycle of toRelease) {
      let shareCentsByFreelancer: number[];

      if (breakdown && Object.keys(breakdown).length > 0 && freelancerIds.length > 1) {
        const acceptedMatches = await ctx.db
          .query("matches")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
          .collect();
        const acceptedByFreelancer = new Map(
          acceptedMatches
            .filter((m) => m.status === "accepted" && freelancerIds.includes(m.freelancerId))
            .map((m) => [m.freelancerId, m])
        );
        const equalShare = Math.floor(cycle.amountCents / freelancerIds.length);
        shareCentsByFreelancer = freelancerIds.map((fid) => {
          const match = acceptedByFreelancer.get(fid);
          const role = match?.teamRole;
          const roleAmount = role && breakdown[role] != null ? breakdown[role] : equalShare;
          return Math.max(0, roleAmount);
        });
        const totalAllocated = shareCentsByFreelancer.reduce((a, b) => a + b, 0);
        const remainder = cycle.amountCents - totalAllocated;
        if (remainder !== 0 && shareCentsByFreelancer.length > 0) {
          shareCentsByFreelancer[0] += remainder;
        }
      } else {
        const amountPerFreelancerCents = Math.floor(cycle.amountCents / freelancerIds.length);
        const remainder = cycle.amountCents - amountPerFreelancerCents * freelancerIds.length;
        shareCentsByFreelancer = freelancerIds.map((_, i) =>
          amountPerFreelancerCents + (i === 0 ? remainder : 0)
        );
      }

      for (let j = 0; j < freelancerIds.length; j++) {
        const fid = freelancerIds[j];
        const shareCents = shareCentsByFreelancer[j] ?? 0;
        if (shareCents <= 0) continue;

        const monthLabel = new Date(cycle.monthStartDate).toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        await creditWalletInline(ctx, {
          userId: fid,
          amountCents: shareCents,
          currency: cycle.currency,
          description: `Project completion: ${project.intakeForm.title} - ${monthLabel}`,
          projectId: cycle.projectId,
          monthlyCycleId: cycle._id,
        });
        await ctx.scheduler.runAfter(0, internalAny.payments.mutations.createPayment, {
          projectId: cycle.projectId,
          monthlyCycleId: cycle._id,
          type: "monthly_release",
          amount: shareCents / 100,
          currency: cycle.currency,
          platformFee: 0,
          netAmount: shareCents / 100,
          userId: project.clientId,
          recipientId: fid,
          status: "succeeded",
        });
      }

      totalReleasedCents += cycle.amountCents;
      await ctx.db.patch(cycle._id, {
        status: "approved",
        approvedBy: project.clientId,
        approvedAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(args.projectId, {
      escrowedAmount: Math.max(0, project.escrowedAmount - totalReleasedCents / 100),
      updatedAt: now,
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    const monthLabel = toRelease.length === 1
      ? new Date(toRelease[0].monthStartDate).toLocaleString("default", { month: "short", year: "numeric" })
      : `${toRelease.length} months`;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: freelancerIds,
      title: "Remaining payments released",
      message: `${monthLabel} for ${project.intakeForm.title} has been released to your wallet (project completed).`,
      type: "payment",
      data: { projectId: args.projectId },
    });

    return { released: toRelease.length };
  },
});
