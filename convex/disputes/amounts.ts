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

/**
 * Client-favor refund: use stored dispute locked gross (snapshot), never above what escrow can represent,
 * and for partial disputes never above the disputed slice’s gross equivalent.
 */
export function clientRefundGrossAndNetEscrowRemoval(opts: {
  lockedSnapshotGrossUsd: number;
  escrowNetUsdNow: number;
  platformFeePercentEffective: number;
  /** Partial team: max freelancer-net USD attributable to disputed members (current escrow slice). */
  disputedEscrowNetUsdMax?: number;
}): {
  appliedRefundGrossUsd: number;
  netRemovalFromEscrowUsd: number;
  cappedVsSnapshot: boolean;
} {
  const fee = opts.platformFeePercentEffective;
  const snapshot = Math.max(0, opts.lockedSnapshotGrossUsd);
  const escrowNet = Math.max(0, opts.escrowNetUsdNow);
  const maxGrossFromFullPool = escrowNetToClientLockedGross(escrowNet, fee);
  let capGross = maxGrossFromFullPool;
  if (
    opts.disputedEscrowNetUsdMax != null &&
    Number.isFinite(opts.disputedEscrowNetUsdMax)
  ) {
    const sliceNet = Math.max(0, opts.disputedEscrowNetUsdMax);
    const maxGrossFromSlice = escrowNetToClientLockedGross(sliceNet, fee);
    capGross = Math.min(maxGrossFromFullPool, maxGrossFromSlice);
  }
  const appliedRefundGrossUsd =
    Math.round(Math.min(snapshot, capGross) * 100) / 100;
  const cappedVsSnapshot =
    Math.round(appliedRefundGrossUsd * 100) < Math.round(snapshot * 100);
  const netRemovalFromEscrowUsd = clientLockedGrossToFreelancerEscrowPool(
    appliedRefundGrossUsd,
    fee
  );
  return { appliedRefundGrossUsd, netRemovalFromEscrowUsd, cappedVsSnapshot };
}
