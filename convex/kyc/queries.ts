import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";

/**
 * Get KYC status and submission for current freelancer (or by userId for session auth)
 */
export const getKycForFreelancer = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let user = args.userId
      ? await ctx.db.get(args.userId)
      : await getCurrentUser(ctx);
    if (!user || (user as Doc<"users">).role !== "freelancer" || (user as Doc<"users">).status !== "active")
      return null;
    const u = user as Doc<"users">;
    const submission = await ctx.db
      .query("kycSubmissions")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", u._id))
      .first();
    const idFrontUrl =
      submission?.idFrontFileId && !submission.documentsDeletedAt
        ? await ctx.storage.getUrl(submission.idFrontFileId)
        : null;
    const idBackUrl =
      submission?.idBackFileId && !submission.documentsDeletedAt
        ? await ctx.storage.getUrl(submission.idBackFileId)
        : null;
    const addressUrl =
      submission?.addressDocFileId && !submission.documentsDeletedAt
        ? await ctx.storage.getUrl(submission.addressDocFileId)
        : null;
    return {
      kycStatus: u.kycStatus ?? "not_submitted",
      kycApprovedAt: u.kycApprovedAt,
      submission: submission
        ? {
            ...submission,
            idFrontUrl,
            idBackUrl,
            addressUrl,
          }
        : null,
    };
  },
});

/**
 * List pending KYC submissions for admin/moderator review
 */
export const getPendingKycSubmissions = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await getCurrentUser(ctx);
    if (!user || ((user as Doc<"users">).role !== "admin" && (user as Doc<"users">).role !== "moderator"))
      return [];
    const list = await ctx.db
      .query("kycSubmissions")
      .withIndex("by_status", (q) => q.eq("status", "pending_review"))
      .collect();
    const enriched = await Promise.all(
      list.map(async (s) => {
        const freelancer = await ctx.db.get(s.freelancerId);
        const idFrontUrl = !s.documentsDeletedAt ? await ctx.storage.getUrl(s.idFrontFileId) : null;
        const idBackUrl = !s.documentsDeletedAt ? await ctx.storage.getUrl(s.idBackFileId) : null;
        const addressUrl = !s.documentsDeletedAt ? await ctx.storage.getUrl(s.addressDocFileId) : null;
        return {
          ...s,
          freelancerName: freelancer?.name ?? null,
          freelancerEmail: freelancer?.email ?? null,
          idFrontUrl,
          idBackUrl,
          addressUrl,
        };
      })
    );
    return enriched;
  },
});

/**
 * Get one KYC submission by freelancer ID (admin/moderator)
 */
export const getKycByFreelancerId = query({
  args: {
    freelancerId: v.id("users"),
    reviewerUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const reviewer = args.reviewerUserId
      ? await ctx.db.get(args.reviewerUserId)
      : await getCurrentUser(ctx);
    if (!reviewer || ((reviewer as Doc<"users">).role !== "admin" && (reviewer as Doc<"users">).role !== "moderator"))
      return null;
    const submission = await ctx.db
      .query("kycSubmissions")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .first();
    if (!submission) return null;
    const freelancer = await ctx.db.get(args.freelancerId);
    const idFrontUrl = !submission.documentsDeletedAt ? await ctx.storage.getUrl(submission.idFrontFileId) : null;
    const idBackUrl = !submission.documentsDeletedAt ? await ctx.storage.getUrl(submission.idBackFileId) : null;
    const addressUrl = !submission.documentsDeletedAt ? await ctx.storage.getUrl(submission.addressDocFileId) : null;
    return {
      ...submission,
      freelancerName: freelancer?.name ?? null,
      freelancerEmail: freelancer?.email ?? null,
      idFrontUrl,
      idBackUrl,
      addressUrl,
    };
  },
});
