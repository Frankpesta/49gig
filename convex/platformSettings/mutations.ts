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
 * Set referral bonus percentage (admin only). % of first successful pre-funding net.
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

/**
 * Enable/disable automatic matching globally (admin only).
 * When disabled, no automatic match generation runs and admins manually match all hires.
 */
export const setAutomaticMatchingEnabled = mutation({
  args: {
    enabled: v.boolean(),
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
      throw new Error("Only admins can change automatic matching");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "automaticMatchingEnabled"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.enabled,
        updatedAt: now,
        updatedBy: user._id,
      });
    } else {
      await ctx.db.insert("platformSettings", {
        key: "automaticMatchingEnabled",
        value: args.enabled,
        updatedAt: now,
        updatedBy: user._id,
      });
    }

    return { success: true, enabled: args.enabled };
  },
});

/**
 * Set the signup-time cutover after which new freelancers skip the English test
 * entirely (skills-only scoring). Admin only. Freelancers whose vettingResults row
 * already exists are never affected — the flag is computed once, at
 * initializeVerification time, from the cutover value in effect at that moment.
 */
export const setEnglishTestCutoverAt = mutation({
  args: {
    cutoverAt: v.number(),
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
      throw new Error("Only admins can change the English test cutover");
    }
    if (!Number.isFinite(args.cutoverAt) || args.cutoverAt < 0) {
      throw new Error("Cutover timestamp must be a valid time.");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "englishTestCutoverAt"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.cutoverAt,
        updatedAt: now,
        updatedBy: user._id,
      });
    } else {
      await ctx.db.insert("platformSettings", {
        key: "englishTestCutoverAt",
        value: args.cutoverAt,
        updatedAt: now,
        updatedBy: user._id,
      });
    }

    return { success: true, cutoverAt: args.cutoverAt };
  },
});

/**
 * Clear the English test cutover, restoring "English required for everyone."
 * Admin only. Does not affect freelancers whose vettingResults row already exists.
 */
export const disableEnglishTestCutover = mutation({
  args: {
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
      throw new Error("Only admins can change the English test cutover");
    }

    const existing = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", "englishTestCutoverAt"))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { success: true };
  },
});
