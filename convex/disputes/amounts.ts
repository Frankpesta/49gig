/**
 * Escrow holds funds net of platform fee. Gross client funding for that pool is net / (1 - fee%).
 */
export function escrowNetToClientLockedGross(
  escrowNetDollars: number,
  platformFeePercentEffective: number
): number {
  const net = Math.max(0, escrowNetDollars);
  const pct = Number.isFinite(platformFeePercentEffective) ? platformFeePercentEffective : 0;
  const clamped = Math.max(0, Math.min(99.999, pct));
  const denom = 1 - clamped / 100;
  if (denom <= 1e-12) return net;
  return net / denom;
}

/** Freelancer-facing “in escrow” amount from stored client gross locked amount. */
export function clientLockedGrossToFreelancerEscrowPool(
  lockedGrossDollars: number,
  platformFeePercentEffective: number
): number {
  const gross = Math.max(0, lockedGrossDollars);
  const platformFeeRate = Math.max(
    0,
    Math.min(
      1,
      (Number.isFinite(platformFeePercentEffective) ? platformFeePercentEffective : 0) / 100
    )
  );
  return Math.round(gross * (1 - platformFeeRate) * 100) / 100;
}
