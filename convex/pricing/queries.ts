import { query } from "../_generated/server";
import { v } from "convex/values";

export type BaseRatesByCategory = Record<
  string,
  { junior: number; mid: number; senior: number; expert: number }
>;

/** Default base hourly rates (USD) per experience level – used when no config is set or category is missing */
export const DEFAULT_BASE_HOURLY: BaseRatesByCategory[string] = {
  junior: 25,
  mid: 45,
  senior: 75,
  expert: 120,
};

/** Default rates per talent category – used to seed or when config is empty */
export const DEFAULT_RATES_BY_CATEGORY: BaseRatesByCategory = {
  "Software Development": { junior: 30, mid: 55, senior: 90, expert: 140 },
  "UI/UX and Product Design": { junior: 25, mid: 45, senior: 75, expert: 115 },
  "Data Analytics": { junior: 28, mid: 50, senior: 85, expert: 130 },
  "DevOps and Cloud Engineering": { junior: 32, mid: 58, senior: 95, expert: 145 },
  "Cyber Security and IT Infrastructure": { junior: 35, mid: 60, senior: 100, expert: 155 },
  "AI, Machine Learning and Blockchain": { junior: 38, mid: 65, senior: 110, expert: 170 },
  "Quality Assurance and Testing": { junior: 24, mid: 42, senior: 70, expert: 108 },
};

/**
 * Get platform pricing config (base rates per talent category).
 * Public read so project create can use it. Returns defaults for missing categories.
 */
export const getPricingConfig = query({
  args: {},
  handler: async (ctx): Promise<BaseRatesByCategory> => {
    const doc = await ctx.db
      .query("pricingConfig")
      .withIndex("by_key", (q) => q.eq("key", "baseRates"))
      .first();

    if (!doc || !doc.ratesByCategory || Object.keys(doc.ratesByCategory).length === 0) {
      return DEFAULT_RATES_BY_CATEGORY;
    }

    // Merge with defaults so any new category has fallback
    const merged: BaseRatesByCategory = { ...DEFAULT_RATES_BY_CATEGORY };
    for (const [cat, rates] of Object.entries(doc.ratesByCategory)) {
      if (
        rates &&
        typeof rates.junior === "number" &&
        typeof rates.mid === "number" &&
        typeof rates.senior === "number" &&
        typeof rates.expert === "number"
      ) {
        merged[cat] = rates as BaseRatesByCategory[string];
      }
    }
    return merged;
  },
});
