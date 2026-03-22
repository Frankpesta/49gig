import { query, internalQuery } from "../_generated/server";

const DEFAULT_PLATFORM_FEE = 25;

/**
 * Get platform fee percentage (company share).
 * Used when project.platformFee is not set. Default 25%.
 */
export const getPlatformFeePercentage = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    const doc = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "platformFeePercentage"))
      .first();

    if (!doc || typeof doc.value !== "number") {
      return DEFAULT_PLATFORM_FEE;
    }
    const pct = doc.value;
    return pct >= 0 && pct <= 100 ? pct : DEFAULT_PLATFORM_FEE;
  },
});

/** Internal: for use in actions/mutations */
export const getPlatformFeePercentageInternal = internalQuery({
  args: {},
  handler: async (ctx): Promise<number> => {
    const doc = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "platformFeePercentage"))
      .first();

    if (!doc || typeof doc.value !== "number") {
      return DEFAULT_PLATFORM_FEE;
    }
    const pct = doc.value;
    return pct >= 0 && pct <= 100 ? pct : DEFAULT_PLATFORM_FEE;
  },
});

const DEFAULT_REFERRAL_BONUS_PERCENT = 4;

/** Referrer reward as % of first funding net (after platform fee). Default 4%. */
export const getReferralBonusPercentage = query({
  args: {},
  handler: async (ctx): Promise<number> => {
    const doc = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "referralBonusPercentage"))
      .first();

    if (!doc || typeof doc.value !== "number") {
      return DEFAULT_REFERRAL_BONUS_PERCENT;
    }
    const pct = doc.value;
    return pct >= 0 && pct <= 100 ? pct : DEFAULT_REFERRAL_BONUS_PERCENT;
  },
});

export const getReferralBonusPercentageInternal = internalQuery({
  args: {},
  handler: async (ctx): Promise<number> => {
    const doc = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "referralBonusPercentage"))
      .first();

    if (!doc || typeof doc.value !== "number") {
      return DEFAULT_REFERRAL_BONUS_PERCENT;
    }
    const pct = doc.value;
    return pct >= 0 && pct <= 100 ? pct : DEFAULT_REFERRAL_BONUS_PERCENT;
  },
});
