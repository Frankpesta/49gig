import { query, internalQuery } from "../_generated/server";
import { DEFAULT_PLATFORM_FEE_PERCENT as DEFAULT_PLATFORM_FEE } from "../platformFeeResolve";

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

/** Referrer reward as % of first funding net. Default 4%. */
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

/** Default ON: automatic matching runs unless an admin explicitly turns it off. */
const DEFAULT_AUTOMATIC_MATCHING_ENABLED = true;

/**
 * Whether automatic matching is enabled. When false, admins must manually match all hires.
 */
export const getAutomaticMatchingEnabled = query({
  args: {},
  handler: async (ctx): Promise<boolean> => {
    const doc = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "automaticMatchingEnabled"))
      .first();

    if (!doc || typeof doc.value !== "boolean") {
      return DEFAULT_AUTOMATIC_MATCHING_ENABLED;
    }
    return doc.value;
  },
});

/** Internal: for use in actions/mutations gating automatic match generation. */
export const getAutomaticMatchingEnabledInternal = internalQuery({
  args: {},
  handler: async (ctx): Promise<boolean> => {
    const doc = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "automaticMatchingEnabled"))
      .first();

    if (!doc || typeof doc.value !== "boolean") {
      return DEFAULT_AUTOMATIC_MATCHING_ENABLED;
    }
    return doc.value;
  },
});
