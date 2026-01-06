import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";

/**
 * Get audit logs (admin only)
 */
export const getAuditLogs = query({
  args: {
    actionType: v.optional(
      v.union(
        v.literal("auth"),
        v.literal("payment"),
        v.literal("dispute"),
        v.literal("admin"),
        v.literal("system")
      )
    ),
    actorId: v.optional(v.id("users")),
    targetType: v.optional(v.string()),
    limit: v.optional(v.number()),
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
    } else {
      user = await getCurrentUser(ctx);
    }

    if (!user) {
      return [];
    }

    // Only admin can view audit logs
    if (user.role !== "admin") {
      return [];
    }

    // Build query - use index if available, otherwise filter
    let logs;
    
    if (args.actorId) {
      // Use actor index
      const query = ctx.db
        .query("auditLogs")
        .withIndex("by_actor", (q) => q.eq("actorId", args.actorId!));
      
      // Apply additional filters
      let filteredQuery: any = query;
      if (args.actionType) {
        filteredQuery = filteredQuery.filter((q: any) => 
          q.eq(q.field("actionType"), args.actionType!)
        );
      }
      if (args.targetType) {
        filteredQuery = filteredQuery.filter((q: any) => 
          q.eq(q.field("targetType"), args.targetType!)
        );
      }
      
      logs = await filteredQuery.order("desc").take(args.limit || 100);
    } else if (args.targetType) {
      // Use target index
      const query = ctx.db
        .query("auditLogs")
        .withIndex("by_target", (q) =>
          q.eq("targetType", args.targetType!)
        );
      
      // Apply additional filters
      let filteredQuery: any = query;
      if (args.actionType) {
        filteredQuery = filteredQuery.filter((q: any) => 
          q.eq(q.field("actionType"), args.actionType!)
        );
      }
      
      logs = await filteredQuery.order("desc").take(args.limit || 100);
    } else {
      // No index, use full table scan with filters
      let query = ctx.db.query("auditLogs");
      
      if (args.actionType) {
        query = query.filter((q) => q.eq(q.field("actionType"), args.actionType!));
      }
      
      logs = await query.order("desc").take(args.limit || 100);
    }

    // Enrich with actor info
    const enrichedLogs = await Promise.all(
      logs.map(async (log: Doc<"auditLogs">) => {
        const actorDoc = await ctx.db.get(log.actorId);
        const actor = actorDoc as Doc<"users"> | null;
        return {
          ...log,
          actor: actor && actor.status === "active"
            ? {
                _id: actor._id,
                name: actor.name,
                email: actor.email,
                role: actor.role,
              }
            : null,
        };
      })
    );

    return enrichedLogs;
  },
});

/**
 * Get audit logs for a specific target (admin only)
 */
export const getAuditLogsByTarget = query({
  args: {
    targetType: v.string(),
    targetId: v.string(),
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
    } else {
      user = await getCurrentUser(ctx);
    }

    if (!user) {
      return [];
    }

    // Only admin can view audit logs
    if (user.role !== "admin") {
      return [];
    }

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_target", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId)
      )
      .order("desc")
      .collect();

    // Enrich with actor info
    const enrichedLogs = await Promise.all(
      logs.map(async (log: Doc<"auditLogs">) => {
        const actorDoc = await ctx.db.get(log.actorId);
        const actor = actorDoc as Doc<"users"> | null;
        return {
          ...log,
          actor: actor && actor.status === "active"
            ? {
                _id: actor._id,
                name: actor.name,
                email: actor.email,
                role: actor.role,
              }
            : null,
        };
      })
    );

    return enrichedLogs;
  },
});

