import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";

/**
 * Get payment by project ID
 * Internal query
 */
export const getPaymentByProject = internalQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("type"), "pre_funding"))
      .order("desc")
      .first();

    return payment;
  },
});

/**
 * Get payment by Flutterwave transaction ID (tx_ref)
 * Internal query
 */
export const getPaymentByTransactionId = internalQuery({
  args: {
    transactionId: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_flutterwave_transaction", (q) =>
        q.eq("flutterwaveTransactionId", args.transactionId)
      )
      .first();

    return payment;
  },
});

/**
 * Get payment by Flutterwave transfer ID
 * Internal query
 */
export const getPaymentByTransferId = internalQuery({
  args: {
    transferId: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_flutterwave_transfer", (q) => q.eq("flutterwaveTransferId", args.transferId))
      .first();

    return payment;
  },
});

/**
 * Get payment by Flutterwave refund ID
 * Internal query
 */
export const getPaymentByRefundId = internalQuery({
  args: {
    refundId: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_flutterwave_refund", (q) => q.eq("flutterwaveRefundId", args.refundId))
      .first();

    return payment;
  },
});

/**
 * Verify user exists and is active
 * Internal query
 */
export const verifyUser = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    const userDoc = user as Doc<"users">;
    if (userDoc.status !== "active") {
      return null;
    }
    return userDoc;
  },
});

/**
 * Get project with authorization check
 * Internal query
 */
export const getProject = internalQuery({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Only client who owns the project can access
    if (project.clientId !== args.userId && user.role !== "admin") {
      return null;
    }

    return project;
  },
});

/**
 * Get payment status for a project
 * Public query
 */
export const getPaymentStatus = query({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Get user
    let user: Doc<"users"> | null = null;
    if (args.userId) {
      const userDoc = await ctx.db.get(args.userId);
      if (userDoc && (userDoc as Doc<"users">).status === "active") {
        user = userDoc as Doc<"users">;
      }
    }

    if (!user) {
      return null;
    }

    // Get project
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    // Authorization check
    if (project.clientId !== user._id && user.role !== "admin") {
      return null;
    }

    // Get payment
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("type"), "pre_funding"))
      .order("desc")
      .first();

    return {
      payment,
      projectStatus: project.status,
      isFunded: project.status === "funded",
    };
  },
});

/**
 * Get payment history for a project
 * Public query
 */
export const getPaymentHistory = query({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Get user
    let user: Doc<"users"> | null = null;
    if (args.userId) {
      const userDoc = await ctx.db.get(args.userId);
      if (userDoc && (userDoc as Doc<"users">).status === "active") {
        user = userDoc as Doc<"users">;
      }
    }

    if (!user) {
      return null;
    }

    // Get project
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    // Authorization check
    if (project.clientId !== user._id && user.role !== "admin") {
      return null;
    }

    // Get all payments for project
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();

    return payments;
  },
});

