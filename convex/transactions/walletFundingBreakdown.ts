import { Doc } from "../_generated/dataModel";

export type WalletFundingBreakdown = {
  /** Total client gross for the hire funding row when known */
  fundingGrossAmount: number;
  /** Portion debited from in-platform (referral / hiring) wallet */
  walletAppliedDollars: number;
  /** Portion charged via Flutterwave checkout (`payment.amount`) */
  gatewayChargedDollars: number;
  isFullWalletFunding: boolean;
  isPartialWalletFunding: boolean;
  isGatewayOnly: boolean;
  /** One-line copy for admin tables */
  summary: string;
};

type PaymentFundingFields = Pick<
  Doc<"payments">,
  "type" | "amount" | "fundingGrossAmount" | "clientWalletCreditApplied" | "webhookEventId"
>;

function fmtUsd(n: number): string {
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Explains how initial hire funding or a top-up was paid: wallet-only, split, or gateway-only.
 * Only applies to `pre_funding` and `top_up` rows that have a non-zero wallet and/or gateway amount.
 */
export function walletFundingBreakdown(
  payment: PaymentFundingFields
): WalletFundingBreakdown | null {
  if (payment.type !== "pre_funding" && payment.type !== "top_up") {
    return null;
  }

  const wallet = Math.max(0, payment.clientWalletCreditApplied ?? 0);
  const gateway = Math.max(0, payment.amount ?? 0);

  if (wallet === 0 && gateway === 0) {
    return null;
  }

  const inferredGross =
    payment.fundingGrossAmount != null && Number.isFinite(payment.fundingGrossAmount)
      ? payment.fundingGrossAmount
      : wallet + gateway;

  const isFullWalletFunding =
    wallet > 0 &&
    (gateway < 1e-9 || payment.webhookEventId === "wallet-only");

  const isPartialWalletFunding = wallet > 0 && gateway >= 1e-9;
  const isGatewayOnly = wallet < 1e-9 && gateway > 0;

  let summary: string;
  if (isFullWalletFunding) {
    summary = `Fully from wallet · Gross ${fmtUsd(inferredGross)}`;
  } else if (isPartialWalletFunding) {
    summary = `Wallet ${fmtUsd(wallet)} + checkout ${fmtUsd(gateway)} · Gross ${fmtUsd(inferredGross)}`;
  } else {
    summary = `Checkout only · ${fmtUsd(gateway)}`;
  }

  return {
    fundingGrossAmount: inferredGross,
    walletAppliedDollars: wallet,
    gatewayChargedDollars: gateway,
    isFullWalletFunding,
    isPartialWalletFunding,
    isGatewayOnly,
    summary,
  };
}
