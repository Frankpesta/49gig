import { mutation, MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc, Id } from "../_generated/dataModel";

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
  return user as Doc<"users">;
}

function resolveRatedFreelancerId(
  project: Doc<"projects">,
  requestedFreelancerId?: Id<"users">
): Id<"users"> {
  const team = project.matchedFreelancerIds ?? [];
  const soloId = project.matchedFreelancerId;

  if (team.length > 0) {
    if (!requestedFreelancerId) {
      throw new Error(
        "Pick which freelancer you're rating — this hire has multiple team members."
      );
    }
    const ok = team.some((id) => String(id) === String(requestedFreelancerId));
    if (!ok) {
      throw new Error("That freelancer is not on this hire.");
    }
    return requestedFreelancerId;
  }

  const base = soloId;
  if (!base) throw new Error("Project has no matched freelancer");
  if (
    requestedFreelancerId &&
    String(requestedFreelancerId) !== String(base)
  ) {
    throw new Error("Rating target does not match the matched freelancer.");
  }
  return base;
}

/**
 * Client submits a rating (1-5) and optional comment per freelancer on a hire.
 * Team hires require `freelancerId`; solo hires omit it or pass the lone match id.
 */
export const submitFreelancerRating = mutation({
  args: {
    projectId: v.id("projects"),
    freelancerId: v.optional(v.id("users")),
    rating: v.number(),
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

    const targetFreelancerId = resolveRatedFreelancerId(
      project,
      args.freelancerId
    );

    const allowedStatuses = ["matched", "in_progress", "completed"];
    if (!allowedStatuses.includes(project.status)) {
      throw new Error(
        "You can rate freelancers once the hire has matched freelancers and is in progress or completed"
      );
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_project_freelancer", (q) =>
        q.eq("projectId", args.projectId).eq("freelancerId", targetFreelancerId)
      )
      .unique();

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
      freelancerId: targetFreelancerId,
      rating: args.rating,
      comment: args.comment,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Admin-only: remove a client rating so it no longer affects matching scores or profile aggregates.
 */
export const adminDeleteFreelancerReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    userId: v.optional(v.id("users")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== "admin") {
      throw new Error("Only admins can delete freelancer reviews.");
    }

    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found");

    await ctx.db.delete(args.reviewId);

    await ctx.db.insert("auditLogs", {
      action: "admin_freelancer_review_deleted",
      actionType: "admin",
      actorId: user._id,
      actorRole: "admin",
      targetType: "review",
      targetId: String(args.reviewId),
      details: {
        projectId: review.projectId,
        clientId: review.clientId,
        freelancerId: review.freelancerId,
        rating: review.rating,
        reason: args.reason?.trim() || undefined,
      },
      createdAt: Date.now(),
    });

    return { ok: true as const };
  },
});
