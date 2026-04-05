import type { Doc } from "./_generated/dataModel";

/** Client charges where we record the platform's dollar cut on the payment row. */
const FEE_ON_CHARGE_TYPES = new Set<
  Doc<"payments">["type"]
>(["pre_funding", "top_up", "milestone_release"]);

/**
 * Gross platform fee (USD) recognized when a charge succeeds.
 * Monthly cycle payouts use `monthly_release` with platformFee 0 — fee was taken at funding/top-up.
 */
export function platformFeeRecognizedOnPayment(p: Doc<"payments">): number {
  if (p.status !== "succeeded") return 0;
  if (p.type === "platform_fee") return Math.max(0, p.amount);
  if (FEE_ON_CHARGE_TYPES.has(p.type)) return Math.max(0, p.platformFee ?? 0);
  return 0;
}

/**
 * Estimated platform fee reversed on a gross client refund, using the hire's fee percent.
 * Refund rows use status `refunded` (see `refundPaymentIntent`).
 */
export function estimatedPlatformFeeClawbackOnRefund(
  p: Doc<"payments">,
  projectPlatformFeePercent: number
): number {
  if (p.type !== "refund" || p.status !== "refunded") return 0;
  const pct = Math.max(0, Math.min(100, projectPlatformFeePercent));
  return Math.max(0, p.amount * (pct / 100));
}
