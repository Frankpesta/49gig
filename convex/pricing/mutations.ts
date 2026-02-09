import { mutation, MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import type { Doc } from "../_generated/dataModel";
import {
  DEFAULT_RATES_BY_CATEGORY,
  type BaseRatesByCategory,
} from "./queries";

const ratesValidator = v.object({
  junior: v.number(),
  mid: v.number(),
  senior: v.number(),
  expert: v.number(),
});

async function getCurrentUserInMutation(
  ctx: MutationCtx,
  userId?: string
): Promise<Doc<"users"> | null> {
  if (userId) {
    const user = await ctx.db.get(userId as Doc<"users">["_id"]);
    if (!user || user.status !== "active") return null;
    return user;
  }
  const user = await getCurrentUser(ctx);
  if (!user || user.status !== "active") return null;
  return user;
}

/**
 * Set base hourly rates per talent category. Admin or moderator only.
 * Pass the full ratesByCategory map (e.g. from getPricingConfig).
 */
export const setPricingBaseRates = mutation({
  args: {
    ratesByCategory: v.record(v.string(), ratesValidator),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }
    if (user.role !== "admin" && user.role !== "moderator") {
      throw new Error("Only admins and moderators can update pricing");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("pricingConfig")
      .withIndex("by_key", (q) => q.eq("key", "baseRates"))
      .first();

    const ratesByCategory: BaseRatesByCategory = {
      ...DEFAULT_RATES_BY_CATEGORY,
      ...args.ratesByCategory,
    };

    if (existing) {
      await ctx.db.patch(existing._id, {
        ratesByCategory,
        updatedAt: now,
        updatedBy: user._id,
      });
    } else {
      await ctx.db.insert("pricingConfig", {
        key: "baseRates",
        ratesByCategory,
        updatedAt: now,
        updatedBy: user._id,
      });
    }
    return { success: true };
  },
});
