import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";

async function getCurrentUserInQuery(ctx: any, userId?: string): Promise<Doc<"users"> | null> {
  if (userId) {
    const user = await ctx.db.get(userId as any);
    if (!user || (user as Doc<"users">).status !== "active") return null;
    return user as Doc<"users">;
  }
  const user = await getCurrentUser(ctx);
  if (!user || user.status !== "active") return null;
  return user;
}

/**
 * Get the client's review for a project (if any).
 */
export const getReviewByProject = query({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserInQuery(ctx, args.userId);
    if (!currentUser) throw new Error("Not authenticated");
    return await ctx.db
      .query("reviews")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();
  },
});
