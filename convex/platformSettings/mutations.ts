import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";

/**
 * Set platform fee percentage (admin only).
 * Default 25%. Valid range 0–100.
 */
export const setPlatformFeePercentage = mutation({
  args: {
    percentage: v.number(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }
    if (user.role !== "admin") {
      throw new Error("Only admins can update platform fee");
    }

    const pct = args.percentage;
    if (pct < 0 || pct > 100) {
      throw new Error("Platform fee must be between 0 and 100");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "platformFeePercentage"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: pct,
        updatedAt: now,
        updatedBy: user._id,
      });
    } else {
      await ctx.db.insert("platformSettings", {
        key: "platformFeePercentage",
        value: pct,
        updatedAt: now,
        updatedBy: user._id,
      });
    }

    return { success: true, percentage: pct };
  },
});

/**
 * Set referral bonus percentage (admin only). % of first successful pre-funding net (after platform fee).
 * Default 4%. Valid range 0–100.
 */
export const setReferralBonusPercentage = mutation({
  args: {
    percentage: v.number(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }
    if (user.role !== "admin") {
      throw new Error("Only admins can update referral bonus percentage");
    }

    const pct = args.percentage;
    if (pct < 0 || pct > 100) {
      throw new Error("Referral bonus must be between 0 and 100");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "referralBonusPercentage"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: pct,
        updatedAt: now,
        updatedBy: user._id,
      });
    } else {
      await ctx.db.insert("platformSettings", {
        key: "referralBonusPercentage",
        value: pct,
        updatedAt: now,
        updatedBy: user._id,
      });
    }

    return { success: true, percentage: pct };
  },
});
