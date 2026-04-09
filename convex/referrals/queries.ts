import { query, type QueryCtx } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import type { Doc } from "../_generated/dataModel";

async function viewerUser(
  ctx: QueryCtx,
  userId?: Doc<"users">["_id"]
): Promise<Doc<"users"> | null> {
  if (userId) {
    const u = await ctx.db.get(userId);
    if (!u || u.status !== "active") return null;
    return u as Doc<"users">;
  }
  const u = await getCurrentUser(ctx);
  if (!u || (u as Doc<"users">).status !== "active") return null;
  return u as Doc<"users">;
}

/** Get all pending/processing payout requests / history (admin only). */
export const getClientPayoutRequests = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("rejected"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") return [];

    const requests = args.status
      ? await ctx.db
          .query("clientReferralPayoutRequests")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .take(200)
      : await ctx.db
          .query("clientReferralPayoutRequests")
          .order("desc")
          .take(200);

    // Attach user name/email for display
    const enriched = await Promise.all(
      requests.map(async (r) => {
        const client = await ctx.db.get(r.userId);
        return {
          ...r,
          clientName: client?.name ?? "Unknown",
          clientEmail: client?.email ?? "",
        };
      })
    );
    return enriched;
  },
});

/** Get the current user's own payout requests. */
export const getMyPayoutRequests = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const userDoc = await viewerUser(ctx, args.userId);
    if (!userDoc || userDoc.role !== "client") return [];

    return await ctx.db
      .query("clientReferralPayoutRequests")
      .withIndex("by_user", (q) => q.eq("userId", userDoc._id))
      .order("desc")
      .take(20);
  },
});

/** Referral link stats for the signed-in user (any role can refer). */
export const getMyReferralSummary = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const userDoc = await viewerUser(ctx, args.userId);
    if (!userDoc) return null;

    const referrer = userDoc.referredByUserId
      ? await ctx.db.get(userDoc.referredByUserId)
      : null;

    const asReferrer = await ctx.db
      .query("referralAccruals")
      .withIndex("by_referrer", (q) => q.eq("referrerId", userDoc._id))
      .collect();

    const credited = asReferrer.filter((a) => a.status === "credited").length;
    const pending = asReferrer.filter(
      (a) =>
        a.status === "awaiting_first_monthly_approval" ||
        a.status === "awaiting_in_progress" ||
        a.status === "awaiting_eligibility_period"
    ).length;

    return {
      referralCode: userDoc.referralCode ?? null,
      referredByName: referrer?.name,
      rewardsCreditedCount: credited,
      rewardsPendingCount: pending,
    };
  },
});
