import { action } from "../_generated/server";
import type { ActionCtx } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import * as flutterwave from "../payments/flutterwave";
/* eslint-disable @typescript-eslint/no-require-imports */
const internalAny: any = require("../_generated/api").internal;

async function adminApproveFreelancerBankWithdrawalHandler(
  ctx: ActionCtx,
  args: { requestId: Id<"walletBankWithdrawalRequests"> }
): Promise<{ success: true; transferRef: string; paymentId: Id<"payments"> }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.email) {
    throw new Error("Only admins can approve withdrawals");
  }
  const admin = await ctx.runQuery(
    internalAny.auth.actionQueries.getActiveUserByEmailInternal,
    { email: identity.email }
  );
  if (!admin || admin.status !== "active" || admin.role !== "admin") {
    throw new Error("Only admins can approve withdrawals");
  }

  const request = await ctx.runQuery(
    internalAny.walletWithdrawals.queries.getWithdrawalRequestInternal,
    { requestId: args.requestId }
  );

  if (!request) {
    throw new Error("Withdrawal request not found");
  }
  if (request.status !== "pending") {
    throw new Error("Only pending withdrawal requests can be approved");
  }

  const freelancer = await ctx.runQuery(internalAny.payments.queries.verifyUser, {
    userId: request.userId,
  });

  if (!freelancer || freelancer.role !== "freelancer") {
    await ctx.runMutation(
      internalAny.walletWithdrawals.mutations.patchWalletWithdrawalRequest,
      {
        requestId: args.requestId,
        status: "failed",
        errorMessage:
          "User is not an active freelancer or account could not be verified.",
        processedBy: admin._id,
        processedAt: Date.now(),
        updatedAt: Date.now(),
      }
    );
    throw new Error("Freelancer account could not be verified");
  }

  const freelancerDoc = freelancer as typeof freelancer & {
    flutterwavePayoutBankCode?: string;
    flutterwavePayoutAccountNumber?: string;
    flutterwaveSubaccountId?: string;
  };

  if (
    !freelancerDoc.flutterwavePayoutBankCode ||
    !freelancerDoc.flutterwavePayoutAccountNumber
  ) {
    await ctx.runMutation(
      internalAny.walletWithdrawals.mutations.patchWalletWithdrawalRequest,
      {
        requestId: args.requestId,
        status: "failed",
        errorMessage: "Freelancer has no payout bank on file.",
        processedBy: admin._id,
        processedAt: Date.now(),
        updatedAt: Date.now(),
      }
    );
    throw new Error("Freelancer has no payout bank on file");
  }

  const wallet = await ctx.runQuery(
    internalAny.wallets.queries.getWalletByUserIdInternal,
    { userId: request.userId }
  );

  if (!wallet || wallet.balanceCents < request.amountCents) {
    await ctx.runMutation(
      internalAny.walletWithdrawals.mutations.patchWalletWithdrawalRequest,
      {
        requestId: args.requestId,
        status: "failed",
        errorMessage: "Insufficient wallet balance at approval time.",
        processedBy: admin._id,
        processedAt: Date.now(),
        updatedAt: Date.now(),
      }
    );
    throw new Error("Insufficient wallet balance when approving this request");
  }

  const now = Date.now();
  await ctx.runMutation(
    internalAny.walletWithdrawals.mutations.patchWalletWithdrawalRequest,
    {
      requestId: args.requestId,
      status: "processing",
      processedBy: admin._id,
      processedAt: now,
      updatedAt: now,
    }
  );

  const amountDollars = request.amountCents / 100;
  const transferRef = `49gig-wallet-${request.userId}-${Date.now()}`;

  try {
    const transferData = await flutterwave.createTransfer({
      account_bank: freelancerDoc.flutterwavePayoutBankCode,
      account_number: freelancerDoc.flutterwavePayoutAccountNumber,
      amount: amountDollars,
      narration: `49GIG wallet withdrawal`,
      currency: "USD",
      reference: transferRef,
      beneficiary_name: freelancer.name,
    });

    await ctx.runMutation(internalAny.wallets.mutations.debitWallet, {
      userId: request.userId,
      amountCents: request.amountCents,
      currency: "usd",
      description: `Withdrawal to bank`,
      flutterwaveTransferId: transferRef,
    });

    const paymentId = await ctx.runMutation(
      internalAny.payments.mutations.createPayment,
      {
        type: "payout",
        amount: amountDollars,
        currency: "usd",
        platformFee: 0,
        netAmount: amountDollars,
        flutterwaveTransferId: transferRef,
        flutterwaveSubaccountId: freelancerDoc.flutterwaveSubaccountId,
        userId: request.userId,
        recipientId: request.userId,
        status:
          transferData.data.status === "NEW" ? "processing" : "succeeded",
      }
    );

    await ctx.runMutation(
      internalAny.walletWithdrawals.mutations.patchWalletWithdrawalRequest,
      {
        requestId: args.requestId,
        status: "completed",
        paymentId,
        flutterwaveTransferRef: transferRef,
        processedBy: admin._id,
        processedAt: Date.now(),
        updatedAt: Date.now(),
      }
    );

    return {
      success: true as const,
      transferRef,
      paymentId,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Transfer or settlement failed";
    await ctx.runMutation(
      internalAny.walletWithdrawals.mutations.patchWalletWithdrawalRequest,
      {
        requestId: args.requestId,
        status: "failed",
        errorMessage: message,
        processedBy: admin._id,
        processedAt: Date.now(),
        updatedAt: Date.now(),
      }
    );
    throw err instanceof Error ? err : new Error(message);
  }
}

/**
 * Admin settles an approved freelancer wallet withdrawal via Flutterwave Transfer.
 */
export const adminApproveFreelancerBankWithdrawal = action({
  args: {
    requestId: v.id("walletBankWithdrawalRequests"),
  },
  returns: v.object({
    success: v.literal(true),
    transferRef: v.string(),
    paymentId: v.id("payments"),
  }),
  handler: adminApproveFreelancerBankWithdrawalHandler,
});
