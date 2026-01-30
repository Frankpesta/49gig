import { mutation, MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";

async function getCurrentUserInMutation(
  ctx: MutationCtx,
  userId?: string
): Promise<Doc<"users"> | null> {
  if (userId) {
    const user = await ctx.db.get(userId as Doc<"users">["_id"]);
    if (!user || (user as Doc<"users">).status !== "active") return null;
    return user as Doc<"users">;
  }
  const user = await getCurrentUser(ctx);
  if (!user || user.status !== "active") return null;
  return user;
}

/**
 * Client submits a rating (1-5) and optional comment for the freelancer on a project.
 * One review per project; updating overwrites.
 */
export const submitFreelancerRating = mutation({
  args: {
    projectId: v.id("projects"),
    rating: v.number(), // 1-5
    comment: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) throw new Error("Not authenticated");

    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.clientId !== user._id && user.role !== "admin") {
      throw new Error("Only the project client can submit a rating");
    }
    if (!project.matchedFreelancerId) throw new Error("Project has no matched freelancer");

    // Only allow rating when project is in_progress (at least one milestone done) or completed
    if (project.status !== "in_progress" && project.status !== "completed") {
      throw new Error("You can rate the freelancer once the project is in progress or completed");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        rating: args.rating,
        comment: args.comment ?? existing.comment,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("reviews", {
      projectId: args.projectId,
      clientId: user._id,
      freelancerId: project.matchedFreelancerId,
      rating: args.rating,
      comment: args.comment,
      createdAt: now,
      updatedAt: now,
    });
  },
});
