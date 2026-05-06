import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";
import type { FunctionReference } from "convex/server";
import type { MutationCtx } from "../_generated/server";
import { getDurationMonths } from "../../lib/project-duration";
import { assertUsdCurrency } from "../currencyPolicy";
import { teamBasisUserIdsForDispute, computeTeamPoolShareCentsByFreelancerId } from "../teamEscrowShares";
import { resolvedLockedEconomicsFreelancerNetPoolCents } from "../disputes/lockingBasis";

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

async function getActiveBillingPauseState(
  ctx: MutationCtx,
  projectId: Doc<"projects">["_id"]
) {
  const pauses = await ctx.db
    .query("projectBillingPauses")
    .withIndex("by_project_status", (q) =>
      q.eq("projectId", projectId).eq("status", "active")
    )
    .collect();
  return {
    projectPaused: pauses.some((p) => p.scope === "project"),
    pausedFreelancerIds: new Set(
      pauses
        .filter((p) => p.scope === "freelancer" && p.freelancerId)
        .map((p) => String(p.freelancerId))
    ),
  };
}

function releasedCentsMap(cycle: Doc<"monthlyBillingCycles">): Record<string, number> {
  return { ...(cycle.releasedFreelancerCents ?? {}) };
}

function allRosterSharesReleased(
  freelancerIds: Doc<"users">["_id"][],
  shareCentsByFreelancer: number[],
  released: Record<string, number>
) {
  return freelancerIds.every((fid, i) => {
    const expected = Math.max(0, shareCentsByFreelancer[i] ?? 0);
    return expected <= 0 || (released[String(fid)] ?? 0) >= expected;
  });
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

/** Roster split for a cycle (same proportional weights as escrow / disputes) — capped to current escrow. */
async function computeMonthlyCycleRosterShareCents(
  ctx: MutationCtx,
  cycle: Doc<"monthlyBillingCycles">,
  project: Doc<"projects">,
  freelancerIds: Doc<"users">["_id"][],
  opts?: {
    /** Freelancer-net pool ceiling (e.g. dispute snapshot at open). Split uses min(cycle amount, this). */
    capPoolFreelancerNetCents?: number | null;
  }
): Promise<number[]> {
  const nominal = Math.max(0, Math.round(cycle.amountCents ?? 0));
  const cap = opts?.capPoolFreelancerNetCents;
  const poolBasis =
    cap != null && Number.isFinite(cap)
      ? Math.min(nominal, Math.max(0, Math.round(cap)))
      : nominal;
  const shareMap = await computeTeamPoolShareCentsByFreelancerId(
    ctx,
    cycle.projectId,
    freelancerIds,
    project.teamBudgetBreakdown,
    poolBasis
  );
  let shares = freelancerIds.map((fid) => shareMap.get(String(fid)) ?? 0);
  const escrowCapCents = Math.round(Math.max(0, project.escrowedAmount ?? 0) * 100);
  const total = shares.reduce((a, b) => a + b, 0);
  if (total > escrowCapCents && total > 0) {
    let allocated = 0;
    shares = shares.map((s, i) => {
      if (i === shares.length - 1) {
        return Math.max(0, escrowCapCents - allocated);
      }
      const scaled = Math.floor((s * escrowCapCents) / total);
      allocated += scaled;
      return scaled;
    });
  }
  return shares;
}

type MonthlyPayoutKind =
  | "client_approve"
  | "staff_dispute_freelancer_favor"
  | "staff_override";

/**
 * Credits wallets, creates payment rows, updates cycle + escrow — shared by client approve,
 * dispute freelancer-favor enforcement, and staff override release.
 */
async function applyMonthlyCyclePayoutShared(
  ctx: MutationCtx,
  args: {
    cycle: Doc<"monthlyBillingCycles">;
    project: Doc<"projects">;
    monthlyCycleId: Doc<"monthlyBillingCycles">["_id"];
    freelancerIds: Doc<"users">["_id"][];
    shareCentsByFreelancer: number[];
    pauseState: Awaited<ReturnType<typeof getActiveBillingPauseState>>;
    /** When set (subset of roster), only those seats receive this run’s credits. */
    onlyPayFreelancerIds: Doc<"users">["_id"][] | null;
    now: number;
    /** User id stored on cycle when fully approved (client or staff actor). */
    approvedByUserId: Doc<"users">["_id"] | undefined;
    payoutKind: MonthlyPayoutKind;
    runReferralCredit: boolean;
  }
): Promise<{ totalReleasedThisRun: number }> {
  const onlySet =
    args.onlyPayFreelancerIds && args.onlyPayFreelancerIds.length > 0
      ? new Set(args.onlyPayFreelancerIds.map(String))
      : null;

  const released = releasedCentsMap(args.cycle);
  let totalReleasedThisRun = 0;
  const monthLabel = new Date(args.cycle.monthStartDate).toLocaleString("default", {
    month: "short",
    year: "numeric",
  });

  const creditDescription =
    args.payoutKind === "client_approve"
      ? `Monthly approval: ${args.project.intakeForm.title} - ${monthLabel}`
      : args.payoutKind === "staff_dispute_freelancer_favor"
        ? `Dispute resolution (freelancer favor): ${args.project.intakeForm.title} - ${monthLabel}`
        : `Staff release: ${args.project.intakeForm.title} - ${monthLabel}`;

  const paidNotifyIds: Doc<"users">["_id"][] = [];

  for (let i = 0; i < args.freelancerIds.length; i++) {
    const fid = args.freelancerIds[i];
    if (onlySet && !onlySet.has(String(fid))) continue;

    const shareCents = args.shareCentsByFreelancer[i] ?? 0;
    if (shareCents <= 0) continue;
    if (args.pauseState.pausedFreelancerIds.has(String(fid))) continue;
    const alreadyReleased = released[String(fid)] ?? 0;
    const remainingCents = Math.max(0, shareCents - alreadyReleased);
    if (remainingCents <= 0) continue;

    await creditWalletInline(ctx, {
      userId: fid,
      amountCents: remainingCents,
      currency: args.cycle.currency,
      description: creditDescription,
      projectId: args.cycle.projectId,
      monthlyCycleId: args.monthlyCycleId,
    });
    released[String(fid)] = alreadyReleased + remainingCents;
    totalReleasedThisRun += remainingCents;
    paidNotifyIds.push(fid);
  }

  if (totalReleasedThisRun <= 0) {
    throw new Error("No releasable payment remains. It may be paused by an admin.");
  }

  for (let i = 0; i < args.freelancerIds.length; i++) {
    const fid = args.freelancerIds[i];
    if (onlySet && !onlySet.has(String(fid))) continue;

    const shareCents = args.shareCentsByFreelancer[i] ?? 0;
    if (shareCents <= 0) continue;
    if (args.pauseState.pausedFreelancerIds.has(String(fid))) continue;
    const amountAlreadyRecorded = (args.cycle.releasedFreelancerCents ?? {})[String(fid)] ?? 0;
    const paymentCents = Math.max(0, (released[String(fid)] ?? 0) - amountAlreadyRecorded);
    if (paymentCents <= 0) continue;

    await ctx.scheduler.runAfter(0, internalAny.payments.mutations.createPayment, {
      projectId: args.cycle.projectId,
      monthlyCycleId: args.monthlyCycleId,
      type: "monthly_release",
      amount: paymentCents / 100,
      currency: args.cycle.currency,
      platformFee: 0,
      netAmount: paymentCents / 100,
      userId: args.project.clientId,
      recipientId: fid,
      status: "succeeded",
    });
  }

  const fullyReleased = allRosterSharesReleased(
    args.freelancerIds,
    args.shareCentsByFreelancer,
    released
  );

  await ctx.db.patch(args.monthlyCycleId, {
    status: fullyReleased ? "approved" : "pending",
    approvedBy: fullyReleased ? args.approvedByUserId : undefined,
    approvedAt: fullyReleased ? args.now : undefined,
    releasedFreelancerCents: released,
    updatedAt: args.now,
  });

  await ctx.db.patch(args.cycle.projectId, {
    escrowedAmount: Math.max(0, args.project.escrowedAmount - totalReleasedThisRun / 100),
    updatedAt: args.now,
  });

  const sendSystemNotification =
    api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
      "action",
      "internal"
    >;

  if (args.payoutKind === "client_approve") {
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: args.freelancerIds.filter(
        (f) => !args.pauseState.pausedFreelancerIds.has(String(f))
      ),
      title: "Monthly payment approved",
      message: `Client approved ${monthLabel} payment for ${args.project.intakeForm.title}. Funds have been added to your wallet.`,
      type: "payment",
      data: { projectId: args.cycle.projectId, monthlyCycleId: args.monthlyCycleId },
    });
  } else {
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: paidNotifyIds.filter(
        (f) => !args.pauseState.pausedFreelancerIds.has(String(f))
      ),
      title:
        args.payoutKind === "staff_dispute_freelancer_favor"
          ? "Payment released after dispute"
          : "Monthly payment released by staff",
      message:
        args.payoutKind === "staff_dispute_freelancer_favor"
          ? `Your ${monthLabel} payment for ${args.project.intakeForm.title} was released after a dispute judgment in your favor. Funds were added to your wallet.`
          : `Staff released your ${monthLabel} payment for ${args.project.intakeForm.title}. Funds were added to your wallet.`,
      type: "payment",
      data: { projectId: args.cycle.projectId, monthlyCycleId: args.monthlyCycleId },
    });
  }

  if (args.runReferralCredit) {
    await ctx.runMutation(
      internalAny.referrals.internalMutations.creditReferralOnFirstMonthlyApproval,
      { projectId: args.cycle.projectId }
    );
  }

  return { totalReleasedThisRun };
}

function disputeBlocksStaffMonthlyCycleOverride(d: Doc<"disputes">): boolean {
  return (
    d.status !== "resolved" &&
    d.status !== "closed" &&
    d.status !== "cancelled"
  );
}

async function assertNoBlockingDisputeOnMonthlyCycle(
  ctx: MutationCtx,
  monthlyCycleId: Doc<"monthlyBillingCycles">["_id"],
  projectId: Doc<"projects">["_id"]
) {
  const related = await ctx.db
    .query("disputes")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();
  for (const d of related) {
    if (String(d.monthlyCycleId) !== String(monthlyCycleId)) continue;
    if (disputeBlocksStaffMonthlyCycleOverride(d)) {
      throw new Error(
        "This billing month has an open dispute. Record a judgment and run dispute enforcement, or withdraw the dispute, before using staff release."
      );
    }
  }
}

async function cancelPendingAndDisputedMonthlyCycles(
  ctx: MutationCtx,
  projectId: Doc<"projects">["_id"]
) {
  const cycles = await ctx.db
    .query("monthlyBillingCycles")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();
  const now = Date.now();
  for (const c of cycles) {
    if (c.status === "pending" || c.status === "disputed") {
      await ctx.db.patch(c._id, {
        status: "cancelled",
        disputeId: undefined,
        updatedAt: now,
      });
    }
  }
}

/** Credit the client's in-platform wallet and reduce project escrow (cents). */
export const creditClientWalletFromEscrowInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
    amountCents: v.number(),
    currency: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.amountCents <= 0) return { credited: 0 };
    assertUsdCurrency(args.currency, "creditClientWalletFromEscrowInternal");
    const project = await ctx.db.get(args.projectId);
    if (!project) return { credited: 0 };
    const maxCents = Math.round(Math.max(0, project.escrowedAmount ?? 0) * 100);
    const cents = Math.min(args.amountCents, maxCents);
    if (cents <= 0) return { credited: 0 };
    await creditWalletInline(ctx, {
      userId: project.clientId,
      amountCents: cents,
      currency: args.currency,
      description: args.description,
      projectId: args.projectId,
    });
    await ctx.db.patch(args.projectId, {
      escrowedAmount: Math.max(0, (project.escrowedAmount ?? 0) - cents / 100),
      updatedAt: Date.now(),
    });
    return { credited: cents };
  },
});

/**
 * Client wins dispute: credit all remaining escrow to client wallet, zero escrow,
 * cancel unreleased monthly cycles (pending/disputed).
 */
export const finalizeClientWinsDisputeInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
    disputeId: v.id("disputes"),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return { success: false };

    const escrowCents = Math.round(Math.max(0, project.escrowedAmount ?? 0) * 100);
    if (escrowCents > 0) {
      await creditWalletInline(ctx, {
        userId: project.clientId,
        amountCents: escrowCents,
        currency: args.currency,
        description: `Dispute resolved in your favor — unreleased escrow credited to your balance (${project.intakeForm.title})`,
        projectId: args.projectId,
      });
    }

    await ctx.db.patch(args.projectId, {
      escrowedAmount: 0,
      updatedAt: Date.now(),
    });

    await cancelPendingAndDisputedMonthlyCycles(ctx, args.projectId);

    return { success: true };
  },
});

/** Cancel all pending/disputed cycles (e.g. after partial split that depleted escrow). */
export const cancelPendingAndDisputedCyclesInternal = internalMutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await cancelPendingAndDisputedMonthlyCycles(ctx, args.projectId);
    return { success: true };
  },
});

/** Restore a disputed monthly cycle to pending so normal approval can resume. */
export const clearMonthlyCycleDisputeInternal = internalMutation({
  args: { monthlyCycleId: v.id("monthlyBillingCycles") },
  handler: async (ctx, args) => {
    const c = await ctx.db.get(args.monthlyCycleId);
    if (!c || c.status !== "disputed") return;
    await ctx.db.patch(args.monthlyCycleId, {
      status: "pending",
      disputeId: undefined,
      updatedAt: Date.now(),
    });
  },
});

/** Cancel a specific disputed monthly cycle after client-favor/replacement outcome. */
export const cancelDisputedMonthlyCycleInternal = internalMutation({
  args: { monthlyCycleId: v.id("monthlyBillingCycles") },
  handler: async (ctx, args) => {
    const c = await ctx.db.get(args.monthlyCycleId);
    if (!c) return;
    await ctx.db.patch(args.monthlyCycleId, {
      status: "cancelled",
      disputeId: undefined,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Partial team client-favor: remove disputed members’ share from this cycle only;
 * keep the rest pending for continuing freelancers.
 */
export const applyPartialDisputeCycleReductionInternal = internalMutation({
  args: {
    monthlyCycleId: v.id("monthlyBillingCycles"),
    removeCents: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.removeCents <= 0) return { ok: true as const };
    const c = await ctx.db.get(args.monthlyCycleId);
    if (!c) return { ok: false as const };
    const now = Date.now();
    const nextAmount = c.amountCents - args.removeCents;
    if (nextAmount <= 0) {
      await ctx.db.patch(args.monthlyCycleId, {
        status: "cancelled",
        amountCents: 0,
        disputeId: undefined,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(args.monthlyCycleId, {
        amountCents: nextAmount,
        status: "pending",
        disputeId: undefined,
        updatedAt: now,
      });
    }
    return { ok: true as const };
  },
});

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
    if (!isClient) {
      throw new Error("Only the project client can approve monthly cycles");
    }

    if (project.status === "disputed") {
      throw new Error("Cannot approve a monthly payment while a dispute is open.");
    }

    if (project.status !== "in_progress") {
      throw new Error(
        "Monthly approvals are only available while the hire is in progress.",
      );
    }

    const now = Date.now();

    if (now < cycle.monthEndDate) {
      throw new Error(
        "This billing month has not ended yet. You can approve after the period ends.",
      );
    }

    // Get freelancer(s)
    const freelancerIds: Doc<"users">["_id"][] = project.matchedFreelancerId
      ? [project.matchedFreelancerId]
      : project.matchedFreelancerIds ?? [];

    if (freelancerIds.length === 0) {
      throw new Error("Project has no matched freelancer(s)");
    }

    const shareCentsByFreelancer = await computeMonthlyCycleRosterShareCents(
      ctx,
      cycle,
      project,
      freelancerIds
    );

    const pauseState = await getActiveBillingPauseState(ctx, cycle.projectId);
    if (pauseState.projectPaused) {
      throw new Error("Payment release is paused by an admin for this hire.");
    }

    await applyMonthlyCyclePayoutShared(ctx, {
      cycle,
      project,
      monthlyCycleId: args.monthlyCycleId,
      freelancerIds,
      shareCentsByFreelancer,
      pauseState,
      onlyPayFreelancerIds: null,
      now,
      approvedByUserId: (user as Doc<"users">)._id,
      payoutKind: "client_approve",
      runReferralCredit: true,
    });

    return { success: true };
  },
});

/**
 * After `freelancer_favor` judgment: pay the disputed month the same way as client approve
 * (full roster or only disputed seats on partial-team disputes). Idempotent if already approved.
 */
export const releaseMonthlyCycleAfterFreelancerFavorJudgmentInternal = internalMutation({
  args: {
    disputeId: v.id("disputes"),
    monthlyCycleId: v.id("monthlyBillingCycles"),
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute?.resolution || dispute.resolution.decision !== "freelancer_favor") {
      throw new Error("Dispute is not resolved in the freelancer's favor.");
    }
    if (String(dispute.monthlyCycleId) !== String(args.monthlyCycleId)) {
      throw new Error("Monthly cycle does not match this dispute.");
    }

    let cycle = await ctx.db.get(args.monthlyCycleId);
    if (!cycle) throw new Error("Monthly cycle not found");

    if (cycle.status === "approved") {
      return { ok: true as const, alreadyReleased: true as const };
    }

    if (cycle.status === "disputed") {
      await ctx.db.patch(args.monthlyCycleId, {
        status: "pending",
        disputeId: undefined,
        updatedAt: Date.now(),
      });
      cycle = (await ctx.db.get(args.monthlyCycleId))!;
    }

    if (cycle.status !== "pending") {
      throw new Error(
        `Cannot release funds: cycle status is ${cycle.status} (expected pending).`
      );
    }

    const project = await ctx.db.get(cycle.projectId);
    if (!project) throw new Error("Project not found");

    if (project.status === "disputed") {
      throw new Error(
        "Hire is still marked disputed at the project level. Run resume / roster enforcement so the hire is in progress before releasing funds."
      );
    }

    if (project.status !== "in_progress") {
      throw new Error("Monthly releases require the hire to be in progress.");
    }

    const now = Date.now();
    if (now < cycle.monthEndDate) {
      throw new Error(
        "This billing month has not ended yet — cannot release this cycle."
      );
    }

    const freelancerIds: Doc<"users">["_id"][] = project.matchedFreelancerId
      ? [project.matchedFreelancerId]
      : project.matchedFreelancerIds ?? [];

    if (freelancerIds.length === 0) {
      throw new Error("Project has no matched freelancer(s)");
    }

    const teamBasis = teamBasisUserIdsForDispute(dispute, project).map(String);
    const disputedRaw = dispute.disputedFreelancerIds ?? [];
    const isPartialTeam =
      teamBasis.length > 0 &&
      disputedRaw.length > 0 &&
      disputedRaw.length < teamBasis.length &&
      disputedRaw.every((id) => teamBasis.includes(String(id)));

    const onlyPay: Doc<"users">["_id"][] | null = isPartialTeam ? disputedRaw : null;

    const snapshotPoolCents = await resolvedLockedEconomicsFreelancerNetPoolCents(
      ctx,
      dispute,
      project
    );
    const shareCentsByFreelancer = await computeMonthlyCycleRosterShareCents(
      ctx,
      cycle,
      project,
      freelancerIds,
      { capPoolFreelancerNetCents: snapshotPoolCents }
    );

    const pauseState = await getActiveBillingPauseState(ctx, cycle.projectId);
    if (pauseState.projectPaused) {
      throw new Error(
        "Payment release is paused for this hire — resume billing before releasing."
      );
    }

    const approver =
      dispute.resolution.resolvedBy ??
      dispute.assignedModeratorId ??
      project.clientId;

    await applyMonthlyCyclePayoutShared(ctx, {
      cycle,
      project,
      monthlyCycleId: args.monthlyCycleId,
      freelancerIds,
      shareCentsByFreelancer,
      pauseState,
      onlyPayFreelancerIds: onlyPay,
      now,
      approvedByUserId: approver,
      payoutKind: "staff_dispute_freelancer_favor",
      runReferralCredit: false,
    });

    return { ok: true as const, alreadyReleased: false as const };
  },
});

/**
 * Staff: release a pending month when the client will not approve (no open dispute blocking this cycle).
 * Same economics as client approve; does not run referral-first-approval credit.
 */
export const staffReleaseMonthlyCyclePayment = mutation({
  args: {
    monthlyCycleId: v.id("monthlyBillingCycles"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user || (user.role !== "moderator" && user.role !== "admin")) {
      throw new Error("Only platform staff can release a month without client approval.");
    }

    const cycle = await ctx.db.get(args.monthlyCycleId);
    if (!cycle) throw new Error("Monthly cycle not found");
    if (cycle.status !== "pending") {
      throw new Error(`Cycle is not pending (status: ${cycle.status}).`);
    }

    const project = await ctx.db.get(cycle.projectId);
    if (!project) throw new Error("Project not found");

    if (project.status === "disputed") {
      throw new Error(
        "Hire is disputed at the project level. Resolve enforcement first, or use the dispute case to release funds."
      );
    }

    if (project.status !== "in_progress") {
      throw new Error("Staff release is only available while the hire is in progress.");
    }

    const now = Date.now();
    if (now < cycle.monthEndDate) {
      throw new Error("This billing month has not ended yet.");
    }

    await assertNoBlockingDisputeOnMonthlyCycle(ctx, args.monthlyCycleId, cycle.projectId);

    const freelancerIds: Doc<"users">["_id"][] = project.matchedFreelancerId
      ? [project.matchedFreelancerId]
      : project.matchedFreelancerIds ?? [];

    if (freelancerIds.length === 0) {
      throw new Error("Project has no matched freelancer(s)");
    }

    const shareCentsByFreelancer = await computeMonthlyCycleRosterShareCents(
      ctx,
      cycle,
      project,
      freelancerIds
    );

    const pauseState = await getActiveBillingPauseState(ctx, cycle.projectId);
    if (pauseState.projectPaused) {
      throw new Error("Payment release is paused for this hire.");
    }

    await applyMonthlyCyclePayoutShared(ctx, {
      cycle,
      project,
      monthlyCycleId: args.monthlyCycleId,
      freelancerIds,
      shareCentsByFreelancer,
      pauseState,
      onlyPayFreelancerIds: null,
      now,
      approvedByUserId: user._id,
      payoutKind: "staff_override",
      runReferralCredit: false,
    });

    await ctx.db.insert("auditLogs", {
      action: "staff_monthly_cycle_release",
      actionType: "admin",
      actorId: user._id,
      actorRole: user.role,
      targetType: "project",
      targetId: cycle.projectId,
      details: { monthlyCycleId: args.monthlyCycleId },
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * Ensure monthly cycles exist for a project (client). Idempotent.
 * Only allowed while the hire is `in_progress`.
 */
/**
 * Internal: record that we sent a client reminder for this cycle (cron).
 */
export const markMonthlyCycleReminderSentInternal = internalMutation({
  args: { monthlyCycleId: v.id("monthlyBillingCycles") },
  handler: async (ctx, args) => {
    const cycle = await ctx.db.get(args.monthlyCycleId);
    if (!cycle) return;
    await ctx.db.patch(args.monthlyCycleId, {
      clientApprovalReminderSentAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

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
    if (!isClient) {
      throw new Error("Only the project client can create monthly cycles");
    }

    if (project.status !== "in_progress") {
      throw new Error(
        "Monthly cycles can only be set up while the hire is in progress.",
      );
    }

    await ctx.scheduler.runAfter(0, internalAny.monthlyBillingCycles.mutations.autoCreateMonthlyCyclesInternal, {
      projectId: args.projectId,
    });

    return { success: true, message: "Monthly cycles will be created shortly" };
  },
});

/**
 * Internal: create monthly billing cycles for a project (idempotent).
 * Runs only while status is `in_progress` — scheduled when the hire enters in progress (contract signed or status update).
 */
export const autoCreateMonthlyCyclesInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return [];
    if (project.status !== "in_progress") {
      return [];
    }

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
    // Use the projectDuration string (e.g. "3", "6", "12") as the canonical number of
    // billing cycles so the count matches what was shown during project creation and on
    // the payment page. Falling back to date-arithmetic only when the field is absent.
    const durationMonths = project.intakeForm?.projectDuration
      ? Math.max(1, getDurationMonths(project.intakeForm.projectDuration))
      : Math.max(1, Math.ceil(durationMs / monthMs));

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

    // All monthly payments stay in escrow: released only at month end via client approval or auto-release (48h after month end).
    // Never release upfront to freelancer.

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
    if (project.status === "disputed") {
      return { released: false };
    }
    if (project.status !== "in_progress") {
      return { released: false };
    }

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

    const pauseState = await getActiveBillingPauseState(ctx, cycle.projectId);
    if (pauseState.projectPaused) {
      return { released: false };
    }
    const released = releasedCentsMap(cycle);

    const monthLabel = new Date(cycle.monthStartDate).toLocaleString("default", {
      month: "short",
      year: "numeric",
    });

    let totalReleasedThisRun = 0;
    const releasedFreelancerIds: Doc<"users">["_id"][] = [];
    for (let i = 0; i < freelancerIds.length; i++) {
      const fid = freelancerIds[i];
      const shareCents = shareCentsByFreelancer[i] ?? 0;
      if (shareCents <= 0) continue;
      if (pauseState.pausedFreelancerIds.has(String(fid))) continue;
      const alreadyReleased = released[String(fid)] ?? 0;
      const remainingCents = Math.max(0, shareCents - alreadyReleased);
      if (remainingCents <= 0) continue;

      await creditWalletInline(ctx, {
        userId: fid,
        amountCents: remainingCents,
        currency: cycle.currency,
        description: `Auto-release: ${project.intakeForm.title} - ${monthLabel}`,
        projectId: cycle.projectId,
        monthlyCycleId: args.monthlyCycleId,
      });
      released[String(fid)] = alreadyReleased + remainingCents;
      totalReleasedThisRun += remainingCents;
      releasedFreelancerIds.push(fid);

      await ctx.scheduler.runAfter(0, internalAny.payments.mutations.createPayment, {
        projectId: cycle.projectId,
        monthlyCycleId: args.monthlyCycleId,
        type: "monthly_release",
        amount: remainingCents / 100,
        currency: cycle.currency,
        platformFee: 0,
        netAmount: remainingCents / 100,
        userId: fid,
        status: "succeeded",
      });
    }

    if (totalReleasedThisRun <= 0) return { released: false };

    await ctx.db.patch(args.monthlyCycleId, {
      status: allRosterSharesReleased(freelancerIds, shareCentsByFreelancer, released)
        ? "approved"
        : "pending",
      approvedAt: allRosterSharesReleased(freelancerIds, shareCentsByFreelancer, released)
        ? now
        : undefined,
      releasedFreelancerCents: released,
      updatedAt: now,
    });

    await ctx.db.patch(cycle.projectId, {
      escrowedAmount: Math.max(0, project.escrowedAmount - totalReleasedThisRun / 100),
      updatedAt: now,
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: releasedFreelancerIds,
      title: "Monthly payment auto-released",
      message: `${monthLabel} payment for ${project.intakeForm.title} was automatically released. Funds have been added to your wallet.`,
      type: "payment",
      data: { projectId: cycle.projectId, monthlyCycleId: args.monthlyCycleId },
    });

    return { released: true };
  },
});

/**
 * Internal: Release dispute funds to freelancer wallet(s).
 * Used when dispute is resolved in freelancer's favor (monthly payment model).
 * Credits wallet(s) and reduces project escrow - same flow as monthly approval.
 */
export const releaseDisputeFundsToWalletInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
    disputeId: v.id("disputes"),
    amountCents: v.number(),
    currency: v.string(),
    monthlyCycleId: v.optional(v.id("monthlyBillingCycles")),
    freelancerIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return { released: false };

    const projectFreelancerIds: Doc<"users">["_id"][] = project.matchedFreelancerId
      ? [project.matchedFreelancerId]
      : project.matchedFreelancerIds ?? [];
    const requested = new Set((args.freelancerIds ?? []).map(String));
    const freelancerIds =
      requested.size > 0
        ? projectFreelancerIds.filter((id) => requested.has(String(id)))
        : projectFreelancerIds;

    if (freelancerIds.length === 0) return { released: false };

    let shareCentsByFreelancer: number[];

    if (projectFreelancerIds.length === 1 && freelancerIds.length === 1) {
      shareCentsByFreelancer = [args.amountCents];
    } else {
      const weightPool = 1_000_000;
      const weightMap = await computeTeamPoolShareCentsByFreelancerId(
        ctx,
        args.projectId,
        projectFreelancerIds,
        project.teamBudgetBreakdown,
        weightPool
      );
      let wSum = 0;
      for (const fid of freelancerIds) {
        wSum += weightMap.get(String(fid)) ?? 0;
      }
      if (wSum <= 0) {
        const per = Math.floor(args.amountCents / freelancerIds.length);
        const rem = args.amountCents - per * freelancerIds.length;
        shareCentsByFreelancer = freelancerIds.map((_, i) => per + (i === 0 ? rem : 0));
      } else {
        let allocated = 0;
        shareCentsByFreelancer = freelancerIds.map((fid, i) => {
          const w = weightMap.get(String(fid)) ?? 0;
          if (i === freelancerIds.length - 1) {
            return Math.max(0, args.amountCents - allocated);
          }
          const c = Math.floor((args.amountCents * w) / wSum);
          allocated += c;
          return c;
        });
      }
    }

    const releasedTotal = shareCentsByFreelancer.reduce((a, b) => a + b, 0);
    const escrowCapCents = Math.round(Math.max(0, project.escrowedAmount ?? 0) * 100);
    if (releasedTotal > escrowCapCents) {
      throw new Error(
        "Dispute payout exceeds available escrow — check economics snapshot and escrow balance."
      );
    }

    const now = Date.now();
    const desc = `Dispute resolution: ${project.intakeForm.title}`;

    for (let i = 0; i < freelancerIds.length; i++) {
      const fid = freelancerIds[i];
      const shareCents = shareCentsByFreelancer[i] ?? 0;
      if (shareCents <= 0) continue;

      await creditWalletInline(ctx, {
        userId: fid,
        amountCents: shareCents,
        currency: args.currency,
        description: desc,
        projectId: args.projectId,
        monthlyCycleId: args.monthlyCycleId,
      });

      await ctx.scheduler.runAfter(0, internalAny.payments.mutations.createPayment, {
        projectId: args.projectId,
        monthlyCycleId: args.monthlyCycleId,
        type: "monthly_release",
        amount: shareCents / 100,
        currency: args.currency,
        platformFee: 0,
        netAmount: shareCents / 100,
        userId: project.clientId,
        recipientId: fid,
        status: "succeeded",
      });
    }

    await ctx.db.patch(args.projectId, {
      escrowedAmount: Math.max(0, (project.escrowedAmount ?? 0) - releasedTotal / 100),
      updatedAt: now,
    });

    if (args.monthlyCycleId) {
      await ctx.db.patch(args.monthlyCycleId, {
        status: "approved",
        approvedAt: now,
        updatedAt: now,
      });
    }

    return { released: true };
  },
});

/**
 * Internal: process upfront release for existing cycles.
 * DISABLED: All monthly payments stay in escrow until month end.
 * Funds are released only via approveMonthlyCycle (client) or autoReleaseMonthlyCycleInternal (cron).
 */
export const processUpfrontReleaseForProjectInternal = internalMutation({
  args: { projectId: v.id("projects") },
  handler: async () => {
    return { released: 0 };
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

    const pauseState = await getActiveBillingPauseState(ctx, args.projectId);
    if (pauseState.projectPaused) return { released: 0 };

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

      const released = releasedCentsMap(cycle);
      let releasedThisCycle = 0;
      for (let j = 0; j < freelancerIds.length; j++) {
        const fid = freelancerIds[j];
        const shareCents = shareCentsByFreelancer[j] ?? 0;
        if (shareCents <= 0) continue;
        if (pauseState.pausedFreelancerIds.has(String(fid))) continue;
        const alreadyReleased = released[String(fid)] ?? 0;
        const remainingCents = Math.max(0, shareCents - alreadyReleased);
        if (remainingCents <= 0) continue;

        const monthLabel = new Date(cycle.monthStartDate).toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        await creditWalletInline(ctx, {
          userId: fid,
          amountCents: remainingCents,
          currency: cycle.currency,
          description: `Project completion: ${project.intakeForm.title} - ${monthLabel}`,
          projectId: cycle.projectId,
          monthlyCycleId: cycle._id,
        });
        released[String(fid)] = alreadyReleased + remainingCents;
        releasedThisCycle += remainingCents;
        await ctx.scheduler.runAfter(0, internalAny.payments.mutations.createPayment, {
          projectId: cycle.projectId,
          monthlyCycleId: cycle._id,
          type: "monthly_release",
          amount: remainingCents / 100,
          currency: cycle.currency,
          platformFee: 0,
          netAmount: remainingCents / 100,
          userId: project.clientId,
          recipientId: fid,
          status: "succeeded",
        });
      }

      if (releasedThisCycle <= 0) continue;
      totalReleasedCents += releasedThisCycle;
      await ctx.db.patch(cycle._id, {
        status: allRosterSharesReleased(freelancerIds, shareCentsByFreelancer, released)
          ? "approved"
          : "pending",
        approvedBy: allRosterSharesReleased(freelancerIds, shareCentsByFreelancer, released)
          ? project.clientId
          : undefined,
        approvedAt: allRosterSharesReleased(freelancerIds, shareCentsByFreelancer, released)
          ? now
          : undefined,
        releasedFreelancerCents: released,
        updatedAt: now,
      });
    }

    if (totalReleasedCents <= 0) return { released: 0 };

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
      userIds: freelancerIds.filter((fid) => !pauseState.pausedFreelancerIds.has(String(fid))),
      title: "Remaining payments released",
      message: `${monthLabel} for ${project.intakeForm.title} has been released to your wallet (project completed).`,
      type: "payment",
      data: { projectId: args.projectId },
    });

    return { released: toRelease.length };
  },
});
