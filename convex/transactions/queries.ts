import { query } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import { walletFundingBreakdown } from "./walletFundingBreakdown";

/**
 * Helper function to get current user in queries
 * Supports both Convex Auth and session token authentication via userId
 */
async function getCurrentUserInQuery(
  ctx: any,
  userId?: string
): Promise<Doc<"users"> | null> {
  if (userId) {
    const user = await ctx.db.get(userId as any as Doc<"users">["_id"]);
    if (!user) {
      return null;
    }
    const userDoc = user as Doc<"users">;
    if (userDoc.status !== "active") {
      return null;
    }
    return userDoc;
  }
  return null;
}

/**
 * Get all transactions for the current user
 * - Clients: project payments + their wallet ledger + referral cash-out requests (pending)
 * - Freelancers: releases/payouts for their projects + wallet ledger + bank withdrawal requests (pending)
 * - Admins/Moderators: all payments + recent global wallet ledger + withdrawal requests (pending)
 */
export const getTransactions = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    let payments: Doc<"payments">[] = [];

    if (user.role === "admin" || user.role === "moderator") {
      payments = await ctx.db.query("payments").order("desc").collect();
    } else if (user.role === "client") {
      const userProjects = await ctx.db
        .query("projects")
        .withIndex("by_client", (q) => q.eq("clientId", user._id))
        .collect();
      const projectIds = userProjects.map((p) => p._id);
      const allPayments: Doc<"payments">[] = [];
      for (const projectId of projectIds) {
        const projectPayments = await ctx.db
          .query("payments")
          .withIndex("by_project", (q) => q.eq("projectId", projectId))
          .collect();
        allPayments.push(...projectPayments);
      }
      payments = allPayments;

      const noProjectPayments = await ctx.db
        .query("payments")
        .withIndex("by_recipient", (q) => q.eq("recipientId", user._id))
        .filter((q) => q.eq(q.field("type"), "payout"))
        .collect();
      for (const p of noProjectPayments) {
        if (!p.projectId && !payments.some((x) => x._id === p._id)) {
          payments.push(p);
        }
      }
    } else if (user.role === "freelancer") {
      const allPayments: Doc<"payments">[] = [];
      const singleProjects = await ctx.db
        .query("projects")
        .withIndex("by_freelancer", (q) => q.eq("matchedFreelancerId", user._id))
        .collect();
      const allProjects = await ctx.db.query("projects").collect();
      const teamProjectIds = allProjects
        .filter((p) => p.matchedFreelancerIds?.includes(user._id))
        .map((p) => p._id);
      const projectIdsSet = new Set([
        ...singleProjects.map((p) => p._id),
        ...teamProjectIds,
      ]);

      for (const projectId of projectIdsSet) {
        const projectPayments = await ctx.db
          .query("payments")
          .withIndex("by_project", (q) => q.eq("projectId", projectId))
          .collect();
        const filteredPayments = projectPayments.filter(
          (p) =>
            p.type === "milestone_release" ||
            p.type === "monthly_release" ||
            p.type === "payout"
        );
        allPayments.push(...filteredPayments);
      }

      const byRecipient = await ctx.db
        .query("payments")
        .withIndex("by_recipient", (q) => q.eq("recipientId", user._id))
        .filter((q) =>
          q.or(
            q.eq(q.field("type"), "monthly_release"),
            q.eq(q.field("type"), "payout")
          )
        )
        .collect();
      for (const p of byRecipient) {
        if (!allPayments.some((a) => a._id === p._id)) {
          allPayments.push(p);
        }
      }

      payments = allPayments;
    } else {
      return [];
    }

    payments.sort((a, b) => b.createdAt - a.createdAt);

    /** Skip wallet ledger rows that duplicate a payment doc already in the user's feed */
    function shouldSkipWalletTransaction(
      wt: Doc<"walletTransactions">,
      payDocs: Doc<"payments">[]
    ): boolean {
      if (wt.paymentId) {
        return payDocs.some((p) => p._id === wt.paymentId);
      }
      if (
        wt.type === "credit" &&
        wt.projectId &&
        wt.monthlyCycleId &&
        !wt.category
      ) {
        return payDocs.some(
          (p) =>
            p.type === "monthly_release" &&
            p.status === "succeeded" &&
            p.projectId === wt.projectId &&
            p.monthlyCycleId === wt.monthlyCycleId &&
            p.recipientId === wt.userId &&
            Math.abs(
              Math.round((p.netAmount ?? p.amount) * 100) - wt.amountCents
            ) <= 2
        );
      }
      if (wt.type === "debit" && wt.flutterwaveTransferId) {
        return payDocs.some(
          (p) =>
            p.type === "payout" &&
            p.recipientId === wt.userId &&
            p.flutterwaveTransferId === wt.flutterwaveTransferId &&
            Math.abs(
              Math.round((p.netAmount ?? p.amount) * 100) - wt.amountCents
            ) <= 2
        );
      }
      return false;
    }

    async function enrichPayment(payment: Doc<"payments">) {
      const project = payment.projectId
        ? ((await ctx.db.get(payment.projectId)) as Doc<"projects"> | null)
        : null;
      const monthlyCycle = payment.monthlyCycleId
        ? ((await ctx.db.get(payment.monthlyCycleId)) as Doc<
            "monthlyBillingCycles"
          > | null)
        : null;
      const walletFunding = walletFundingBreakdown(payment);
      return {
        ledgerKind: "payment" as const,
        listingType: payment.type,
        ...payment,
        project: project
          ? {
              _id: project._id,
              title: project.intakeForm?.title || "Untitled Project",
              clientId: project.clientId,
            }
          : null,
        monthlyCycle: monthlyCycle
          ? {
              _id: monthlyCycle._id,
              monthIndex: monthlyCycle.monthIndex,
              monthStartDate: monthlyCycle.monthStartDate,
              monthEndDate: monthlyCycle.monthEndDate,
            }
          : null,
        walletFunding,
      };
    }

    async function enrichWalletTx(wt: Doc<"walletTransactions">) {
      const project = wt.projectId
        ? ((await ctx.db.get(wt.projectId)) as Doc<"projects"> | null)
        : null;
      const monthlyCycle = wt.monthlyCycleId
        ? ((await ctx.db.get(wt.monthlyCycleId)) as Doc<
            "monthlyBillingCycles"
          > | null)
        : null;
      const cat = wt.category ?? "none";
      const listingType = `wallet_${wt.type}_${cat}` as const;
      const amountDollars = wt.amountCents / 100;
      const signed = wt.type === "debit" ? -amountDollars : amountDollars;
      const statusMap: Record<
        string,
        | "pending"
        | "processing"
        | "succeeded"
        | "failed"
        | "refunded"
        | "cancelled"
      > = {
        completed: "succeeded",
        pending: "pending",
        failed: "failed",
      };
      return {
        ledgerKind: "wallet" as const,
        listingType,
        _id: wt._id,
        walletTransactionId: wt._id,
        type: listingType,
        amount: Math.abs(amountDollars),
        signedAmount: signed,
        currency: wt.currency,
        status: statusMap[wt.status] ?? "succeeded",
        createdAt: wt.createdAt,
        netAmount: Math.abs(amountDollars),
        walletDescription: wt.description,
        walletTxnType: wt.type,
        walletCategory: wt.category ?? null,
        project: project
          ? {
              _id: project._id,
              title: project.intakeForm?.title || "Untitled Project",
              clientId: project.clientId,
            }
          : null,
        monthlyCycle: monthlyCycle
          ? {
              _id: monthlyCycle._id,
              monthIndex: monthlyCycle.monthIndex,
              monthStartDate: monthlyCycle.monthStartDate,
              monthEndDate: monthlyCycle.monthEndDate,
            }
          : null,
        walletFunding: null as null,
      };
    }

    let walletTxnRows: Doc<"walletTransactions">[] = [];
    let withdrawalSynth: Array<Record<string, unknown>> = [];

    if (user.role === "admin" || user.role === "moderator") {
      walletTxnRows = await ctx.db
        .query("walletTransactions")
        .withIndex("by_created_at")
        .order("desc")
        .take(3000);

      const bankReqs = await ctx.db.query("walletBankWithdrawalRequests").order("desc").take(600);
      for (const r of bankReqs) {
        if (r.status === "completed") continue;
        withdrawalSynth.push({
          ledgerKind: "withdrawal_request" as const,
          listingType: "withdrawal_bank" as const,
          type: "withdrawal_bank",
          requestKind: "freelancer_bank" as const,
          requestId: r._id,
          _id: r._id,
          amount: r.amountCents / 100,
          currency: r.currency,
          status:
            r.status === "pending"
              ? ("pending" as const)
              : r.status === "processing"
                ? ("processing" as const)
                : r.status === "failed"
                  ? ("failed" as const)
                  : ("cancelled" as const),
          createdAt: r.createdAt,
          adminNote: r.adminNote ?? null,
          errorMessage: r.errorMessage ?? null,
          freelancerUserId: r.userId,
        });
      }

      const referralReqs = await ctx.db
        .query("clientReferralPayoutRequests")
        .order("desc")
        .take(600);
      for (const r of referralReqs) {
        if (r.status === "completed") continue;
        withdrawalSynth.push({
          ledgerKind: "withdrawal_request" as const,
          listingType: "withdrawal_referral_cashout" as const,
          type: "withdrawal_referral_cashout",
          requestKind: "client_referral" as const,
          requestId: r._id,
          _id: r._id,
          amount: r.amountCents / 100,
          currency: r.currency,
          status:
            r.status === "pending"
              ? ("pending" as const)
              : r.status === "processing"
                ? ("processing" as const)
                : ("cancelled" as const),
          createdAt: r.createdAt,
          adminNote: r.adminNote ?? null,
          clientUserId: r.userId,
        });
      }
    } else {
      const walletDoc = await ctx.db
        .query("wallets")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (walletDoc) {
        walletTxnRows = await ctx.db
          .query("walletTransactions")
          .withIndex("by_wallet", (q) => q.eq("walletId", walletDoc._id))
          .order("desc")
          .take(2000);
      }

      if (user.role === "freelancer") {
        const reqs = await ctx.db
          .query("walletBankWithdrawalRequests")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .order("desc")
          .take(40);
        for (const r of reqs) {
          if (r.status === "completed") continue;
          withdrawalSynth.push({
            ledgerKind: "withdrawal_request" as const,
            listingType: "withdrawal_bank" as const,
            type: "withdrawal_bank",
            requestKind: "freelancer_bank" as const,
            requestId: r._id,
            _id: r._id,
            amount: r.amountCents / 100,
            currency: r.currency,
            status:
              r.status === "pending"
                ? ("pending" as const)
                : r.status === "processing"
                  ? ("processing" as const)
                  : r.status === "failed"
                    ? ("failed" as const)
                    : ("cancelled" as const),
            createdAt: r.createdAt,
            adminNote: r.adminNote ?? null,
            errorMessage: r.errorMessage ?? null,
            freelancerUserId: r.userId,
          });
        }
      }

      if (user.role === "client") {
        const reqs = await ctx.db
          .query("clientReferralPayoutRequests")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .order("desc")
          .take(40);
        for (const r of reqs) {
          if (r.status === "completed") continue;
          withdrawalSynth.push({
            ledgerKind: "withdrawal_request" as const,
            listingType: "withdrawal_referral_cashout" as const,
            type: "withdrawal_referral_cashout",
            requestKind: "client_referral" as const,
            requestId: r._id,
            _id: r._id,
            amount: r.amountCents / 100,
            currency: r.currency,
            status:
              r.status === "pending"
                ? ("pending" as const)
                : r.status === "processing"
                  ? ("processing" as const)
                  : ("cancelled" as const),
            createdAt: r.createdAt,
            adminNote: r.adminNote ?? null,
            clientUserId: r.userId,
          });
        }
      }
    }

    const walletRowsOut: Array<Awaited<ReturnType<typeof enrichWalletTx>>> = [];
    for (const wt of walletTxnRows) {
      if (shouldSkipWalletTransaction(wt, payments)) continue;
      if (user.role === "client" && wt.userId !== user._id) continue;
      if (user.role === "freelancer" && wt.userId !== user._id) continue;
      walletRowsOut.push(await enrichWalletTx(wt));
    }

    const enrichedPayments = await Promise.all(payments.map(enrichPayment));

    const combined = [
      ...enrichedPayments,
      ...walletRowsOut,
      ...withdrawalSynth,
    ] as Array<Record<string, unknown>>;

    combined.sort(
      (a, b) =>
        (b.createdAt as number) - (a.createdAt as number)
    );

    return combined;
  },
});

/**
 * Get a single transaction by ID
 */
export const getTransaction = query({
  args: {
    transactionId: v.id("payments"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const payment = await ctx.db.get(args.transactionId);
    if (!payment) {
      return null;
    }

    const isAdmin = user.role === "admin";
    const isModerator = user.role === "moderator";

    // Wallet payout (no project) - check recipientId
    if (!payment.projectId && payment.type === "payout") {
      if (payment.recipientId === user._id || isAdmin || isModerator) {
        return {
          ...payment,
          project: null,
          monthlyCycle: null,
          walletFunding: walletFundingBreakdown(payment),
        };
      }
      return null;
    }

    const project = await ctx.db.get(payment.projectId!);
    if (!project) {
      return null;
    }

    const isClient = project.clientId === user._id;
    const freelancerOnTeam = (project.matchedFreelancerIds ?? []).some(
      (fid) => fid === user._id
    );
    const isFreelancer =
      (project.matchedFreelancerId === user._id || freelancerOnTeam) &&
      (payment.type === "milestone_release" ||
        payment.type === "monthly_release" ||
        payment.type === "payout");

    if (!isAdmin && !isModerator && !isClient && !isFreelancer) {
      return null;
    }

    // Billing period context (e.g. monthly release)
    const monthlyCycle = payment.monthlyCycleId
      ? await ctx.db.get(payment.monthlyCycleId)
      : null;

    // Get project client
    const client = await ctx.db.get(project.clientId);

    // Get freelancer if applicable
    const freelancer = project.matchedFreelancerId
      ? await ctx.db.get(project.matchedFreelancerId)
      : null;

    const walletFunding = walletFundingBreakdown(payment);

    return {
      ...payment,
      walletFunding,
      project: {
        _id: project._id,
        title: project.intakeForm.title,
        description: project.intakeForm.description,
        clientId: project.clientId,
        client: client
          ? {
              _id: client._id,
              name: client.name,
              email: client.email,
            }
          : null,
        freelancer: freelancer
          ? {
              _id: freelancer._id,
              name: freelancer.name,
              email: freelancer.email,
            }
          : null,
      },
      monthlyCycle: monthlyCycle
        ? {
            _id: monthlyCycle._id,
            monthIndex: monthlyCycle.monthIndex,
            monthStartDate: monthlyCycle.monthStartDate,
            monthEndDate: monthlyCycle.monthEndDate,
            amountCents: monthlyCycle.amountCents,
          }
        : null,
    };
  },
});

/**
 * Get transaction statistics for the current user
 * This is computed on the frontend from getTransactions results
 */

