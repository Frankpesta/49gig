import { mutation, internalMutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import type { Id } from "../_generated/dataModel";

async function rejectIfPendingWithdrawalExists(
  ctx: MutationCtx,
  userId: Id<"users">
): Promise<void> {
  const existing = await ctx.db
    .query("walletBankWithdrawalRequests")
    .withIndex("by_user_status", (q) =>
      q.eq("userId", userId).eq("status", "pending")
    )
    .first();
  if (existing) {
    throw new Error(
      "You already have a pending bank withdrawal request. Please wait for processing."
    );
  }
}

/**
 * Freelancer submits a bank withdrawal request (admin settles via Flutterwave later).
 */
export const requestFreelancerBankWithdrawal = mutation({
  args: {
    amountCents: v.number(),
  },
  returns: v.object({
    success: v.literal(true),
    requestId: v.id("walletBankWithdrawalRequests"),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.status !== "active" || user.role !== "freelancer") {
      throw new Error("Only freelancers can request a bank withdrawal");
    }
    if (args.amountCents < 100) {
      throw new Error("Minimum withdrawal is 1.00 USD");
    }

    const userDoc = user as typeof user & {
      flutterwavePayoutBankCode?: string;
      flutterwavePayoutAccountNumber?: string;
    };

    if (
      !userDoc.flutterwavePayoutBankCode ||
      !userDoc.flutterwavePayoutAccountNumber
    ) {
      throw new Error(
        "Please set up your bank account in Settings before withdrawing."
      );
    }

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!wallet || wallet.balanceCents < args.amountCents) {
      throw new Error("Insufficient wallet balance");
    }

    await rejectIfPendingWithdrawalExists(ctx, user._id);

    const now = Date.now();
    const requestId = await ctx.db.insert("walletBankWithdrawalRequests", {
      userId: user._id,
      amountCents: args.amountCents,
      currency: (wallet.currency ?? "usd").toLowerCase(),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return { success: true as const, requestId };
  },
});

/** Admin rejects a freelancer bank withdrawal request (no debit occurred). */
export const rejectFreelancerBankWithdrawal = mutation({
  args: {
    requestId: v.id("walletBankWithdrawalRequests"),
    adminNote: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const admin = await getCurrentUser(ctx);
    if (!admin || admin.role !== "admin") {
      throw new Error("Only admins can reject withdrawals");
    }

    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("Withdrawal request not found");
    if (req.status !== "pending") {
      throw new Error("Only pending requests can be rejected");
    }

    const now = Date.now();
    await ctx.db.patch(args.requestId, {
      status: "rejected",
      adminNote: args.adminNote,
      processedBy: admin._id,
      processedAt: now,
      updatedAt: now,
    });

    return null;
  },
});

export const patchWalletWithdrawalRequest = internalMutation({
  args: {
    requestId: v.id("walletBankWithdrawalRequests"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("rejected"),
        v.literal("failed")
      )
    ),
    paymentId: v.optional(v.id("payments")),
    flutterwaveTransferRef: v.optional(v.string()),
    adminNote: v.optional(v.string()),
    processedBy: v.optional(v.id("users")),
    processedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    updatedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = { updatedAt: args.updatedAt };
    if (args.status !== undefined) patch.status = args.status;
    if (args.paymentId !== undefined) patch.paymentId = args.paymentId;
    if (args.flutterwaveTransferRef !== undefined)
      patch.flutterwaveTransferRef = args.flutterwaveTransferRef;
    if (args.adminNote !== undefined) patch.adminNote = args.adminNote;
    if (args.processedBy !== undefined) patch.processedBy = args.processedBy;
    if (args.processedAt !== undefined) patch.processedAt = args.processedAt;
    if (args.errorMessage !== undefined) {
      patch.errorMessage = args.errorMessage;
    }
    await ctx.db.patch(args.requestId, patch);

    return null;
  },
});
