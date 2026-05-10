import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import type { Doc } from "../_generated/dataModel";

const requestRowValidator = v.object({
  _id: v.id("walletBankWithdrawalRequests"),
  _creationTime: v.number(),
  userId: v.id("users"),
  amountCents: v.number(),
  currency: v.string(),
  status: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("rejected"),
    v.literal("failed")
  ),
  adminNote: v.optional(v.string()),
  processedBy: v.optional(v.id("users")),
  processedAt: v.optional(v.number()),
  paymentId: v.optional(v.id("payments")),
  flutterwaveTransferRef: v.optional(v.string()),
  errorMessage: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const enrichedValidator = v.object({
  _id: v.id("walletBankWithdrawalRequests"),
  _creationTime: v.number(),
  userId: v.id("users"),
  amountCents: v.number(),
  currency: v.string(),
  status: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("rejected"),
    v.literal("failed")
  ),
  adminNote: v.optional(v.string()),
  processedBy: v.optional(v.id("users")),
  processedAt: v.optional(v.number()),
  paymentId: v.optional(v.id("payments")),
  flutterwaveTransferRef: v.optional(v.string()),
  errorMessage: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  freelancerName: v.string(),
  freelancerEmail: v.string(),
});

/** Admin list of freelancer bank withdrawal requests (newest first). */
export const getWalletWithdrawalRequests = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("rejected"),
        v.literal("failed")
      )
    ),
    limit: v.optional(v.number()),
  },
  returns: v.array(enrichedValidator),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") {
      return [];
    }

    const take = Math.min(Math.max(args.limit ?? 150, 1), 250);
    let rows: Doc<"walletBankWithdrawalRequests">[];
    if (args.status !== undefined) {
      rows = await ctx.db
        .query("walletBankWithdrawalRequests")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(take);
    } else {
      rows = await ctx.db
        .query("walletBankWithdrawalRequests")
        .order("desc")
        .take(take);
    }

    const enriched = await Promise.all(
      rows.map(async (r) => {
        const freelancer = await ctx.db.get(r.userId);
        return {
          ...r,
          freelancerName: freelancer?.name ?? "Unknown",
          freelancerEmail: freelancer?.email ?? "",
        };
      })
    );
    return enriched;
  },
});

/** Action/mutation helpers: fetch a withdrawal request doc. */
export const getWithdrawalRequestInternal = internalQuery({
  args: { requestId: v.id("walletBankWithdrawalRequests") },
  returns: v.union(
    requestRowValidator,
    v.null()
  ),
  handler: async (ctx, args) => {
    return (await ctx.db.get(args.requestId)) ?? null;
  },
});

/** Current freelancer's recent bank withdrawal requests. */
export const getMyWalletWithdrawalRequests = query({
  args: {},
  returns: v.array(requestRowValidator),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "freelancer") {
      return [];
    }

    return await ctx.db
      .query("walletBankWithdrawalRequests")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);
  },
});
