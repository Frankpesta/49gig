import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";

/**
 * Public-facing resume info for a freelancer (bio + resume link).
 * Allowed:
 *  - the freelancer themselves
 *  - admins/moderators
 *  - clients (e.g., for matched views) — broader check can be tightened later.
 */
export const getFreelancerResume = query({
  args: { freelancerId: v.id("users") },
  handler: async (ctx, args) => {
    const requester = await getCurrentUser(ctx);
    if (!requester) {
      return null;
    }

    const freelancer = await ctx.db.get(args.freelancerId);
    if (!freelancer || freelancer.role !== "freelancer") {
      return null;
    }

    const isSelf = requester._id === freelancer._id;
    const isAdmin = requester.role === "admin" || requester.role === "moderator";
    const isClient = requester.role === "client";

    let clientHasMatch = false;
    if (isClient) {
      const matchedProject = await ctx.db
        .query("projects")
        .withIndex("by_freelancer", (q) => q.eq("matchedFreelancerId", freelancer._id))
        .filter((q) => q.eq(q.field("clientId"), requester._id))
        .first();
      clientHasMatch = !!matchedProject;
    }

    if (!isSelf && !isAdmin && !clientHasMatch) {
      return null;
    }

    const resumeUrl = freelancer.resumeFileId
      ? await ctx.storage.getUrl(freelancer.resumeFileId)
      : undefined;

    const base = {
      freelancerId: freelancer._id,
      resumeStatus: freelancer.resumeStatus ?? "not_uploaded",
      resumeBio: freelancer.resumeBio,
      resumeUploadedAt: freelancer.resumeUploadedAt,
      resumeCanReuploadAt: freelancer.resumeCanReuploadAt,
    };

    if (isAdmin || isSelf) {
      return {
        ...base,
        resumeUrl,
        resumeParsedData: freelancer.resumeParsedData,
        resumeFileId: freelancer.resumeFileId,
      };
    }

    // Matched clients: only see bio + resume link when processed
    return {
      ...base,
      resumeUrl: freelancer.resumeStatus === "processed" ? resumeUrl : undefined,
      resumeParsedData: undefined,
      resumeFileId: undefined,
    };
  },
});

/**
 * Get a user by session token (for actions needing session auth).
 * Returns the user without sensitive fields.
 */
export const getUserBySessionToken = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      return null;
    }

    if (session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.status !== "active") {
      return null;
    }

    const { passwordHash, ...userWithoutPassword } = user as Doc<"users">;
    return userWithoutPassword;
  },
});
