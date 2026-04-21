import { MutationCtx, QueryCtx } from "./_generated/server";

type DbCtx = QueryCtx | MutationCtx;

const PLATFORM_FEE_KEY = "platformFeePercentage" as const;

/** Align with `platformSettings/queries` — used when `project.platformFee` is unset. */
export const DEFAULT_PLATFORM_FEE_PERCENT = 25;

/**
 * Global default platform fee from admin settings (fallback 25%).
 */
export async function getDefaultPlatformFeePercent(ctx: DbCtx): Promise<number> {
  const doc = await ctx.db
    .query("platformSettings")
    .withIndex("by_key", (q) => q.eq("key", PLATFORM_FEE_KEY))
    .first();
  if (doc && typeof doc.value === "number") {
    const pct = doc.value;
    if (pct >= 0 && pct <= 100) return pct;
  }
  return DEFAULT_PLATFORM_FEE_PERCENT;
}

export async function effectivePlatformFeePercentForProject(
  ctx: DbCtx,
  projectPlatformFee: number | undefined
): Promise<number> {
  const fallback = await getDefaultPlatformFeePercent(ctx);
  return projectPlatformFee ?? fallback;
}
