import { query } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";

/**
 * Helper function to get current user in queries
 * Supports both Convex Auth and session token authentication via userId
 */
async function getCurrentUserInQuery(
  ctx: any,
  userId?: string
): Promise<Doc<"users"> | null> {
  if (userId) {
    const user = await ctx.db.get(userId as any as Doc<"users">["_id"]);
    if (!user) {
      return null;
    }
    const userDoc = user as Doc<"users">;
    if (userDoc.status !== "active") {
      return null;
    }
    return userDoc;
  }
  return null;
}

/**
 * Get all transactions for the current user
 * - Clients see payments for their projects
 * - Freelancers see payouts for their projects
 * - Admins/Moderators see all transactions
 */
export const getTransactions = query({
  args: {
    type: v.optional(
      v.union(
        v.literal("pre_funding"),
        v.literal("milestone_release"),
        v.literal("refund"),
        v.literal("platform_fee"),
        v.literal("payout")
      )
    ),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("succeeded"),
        v.literal("failed"),
        v.literal("refunded"),
        v.literal("cancelled")
      )
    ),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    let payments;

    if (user.role === "admin" || user.role === "moderator") {
      // Admins and moderators see all transactions
      payments = await ctx.db
        .query("payments")
        .order("desc")
        .collect();
    } else if (user.role === "client") {
      // Clients see payments for their projects
      const userProjects = await ctx.db
        .query("projects")
        .withIndex("by_client", (q) => q.eq("clientId", user._id))
        .collect();

      const projectIds = userProjects.map((p) => p._id);
      
      if (projectIds.length === 0) {
        return [];
      }

      // Get all payments for user's projects
      // We need to query each project separately since we can't filter by array
      const allPayments: any[] = [];
      for (const projectId of projectIds) {
        const projectPayments = await ctx.db
          .query("payments")
          .withIndex("by_project", (q) => q.eq("projectId", projectId))
          .collect();
        allPayments.push(...projectPayments);
      }

      payments = allPayments;
    } else if (user.role === "freelancer") {
      // Freelancers see payouts for their projects
      const userProjects = await ctx.db
        .query("projects")
        .withIndex("by_freelancer", (q) => q.eq("matchedFreelancerId", user._id))
        .collect();

      const projectIds = userProjects.map((p) => p._id);
      
      if (projectIds.length === 0) {
        return [];
      }

      // Get milestone releases and payouts for freelancer's projects
      const allPayments: any[] = [];
      for (const projectId of projectIds) {
        const projectPayments = await ctx.db
          .query("payments")
          .withIndex("by_project", (q) => q.eq("projectId", projectId))
          .collect();
        
        // Filter for milestone releases and payouts
        const filteredPayments = projectPayments.filter(
          (p) => p.type === "milestone_release" || p.type === "payout"
        );
        allPayments.push(...filteredPayments);
      }

      payments = allPayments;
    } else {
      return [];
    }

    // Apply filters
    if (args.type) {
      payments = payments.filter((p) => p.type === args.type);
    }

    if (args.status) {
      payments = payments.filter((p) => p.status === args.status);
    }

    // Sort by creation date (newest first)
    payments.sort((a, b) => b.createdAt - a.createdAt);

    // Enrich with project and milestone info
    const enrichedTransactions = await Promise.all(
      payments.map(async (payment) => {
        const project = await ctx.db.get(payment.projectId) as Doc<"projects"> | null;
        const milestone = payment.milestoneId
          ? (await ctx.db.get(payment.milestoneId) as Doc<"milestones"> | null)
          : null;

        return {
          ...payment,
          project: project
            ? {
                _id: project._id,
                title: project.intakeForm?.title || "Untitled Project",
                clientId: project.clientId,
              }
            : null,
          milestone: milestone
            ? {
                _id: milestone._id,
                title: milestone.title,
              }
            : null,
        };
      })
    );

    return enrichedTransactions;
  },
});

/**
 * Get a single transaction by ID
 */
export const getTransaction = query({
  args: {
    transactionId: v.id("payments"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const payment = await ctx.db.get(args.transactionId);
    if (!payment) {
      return null;
    }

    // Get project to check authorization
    const project = await ctx.db.get(payment.projectId);
    if (!project) {
      return null;
    }

    // Authorization checks
    const isAdmin = user.role === "admin";
    const isModerator = user.role === "moderator";
    const isClient = project.clientId === user._id;
    const isFreelancer =
      project.matchedFreelancerId === user._id &&
      (payment.type === "milestone_release" || payment.type === "payout");

    if (!isAdmin && !isModerator && !isClient && !isFreelancer) {
      return null; // Not authorized
    }

    // Get milestone if applicable
    const milestone = payment.milestoneId
      ? await ctx.db.get(payment.milestoneId)
      : null;

    // Get project client
    const client = await ctx.db.get(project.clientId);

    // Get freelancer if applicable
    const freelancer = project.matchedFreelancerId
      ? await ctx.db.get(project.matchedFreelancerId)
      : null;

    return {
      ...payment,
      project: {
        _id: project._id,
        title: project.intakeForm.title,
        description: project.intakeForm.description,
        clientId: project.clientId,
        client: client
          ? {
              _id: client._id,
              name: client.name,
              email: client.email,
            }
          : null,
        freelancer: freelancer
          ? {
              _id: freelancer._id,
              name: freelancer.name,
              email: freelancer.email,
            }
          : null,
      },
      milestone: milestone
        ? {
            _id: milestone._id,
            title: milestone.title,
            description: milestone.description,
            amount: milestone.amount,
          }
        : null,
    };
  },
});

/**
 * Get transaction statistics for the current user
 * This is computed on the frontend from getTransactions results
 */

