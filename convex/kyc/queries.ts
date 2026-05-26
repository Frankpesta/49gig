import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";
import { weightedVerificationOverall } from "../vetting/scoring";
import { isInOneStepSignupApprovalQueue } from "../../lib/freelancer-matching-readiness";

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
 * List pending KYC submissions for admin review
 */
export const getPendingKycSubmissions = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await getCurrentUser(ctx);
    if (!user || (user as Doc<"users">).role !== "admin") return [];
    const list = await ctx.db
      .query("kycSubmissions")
      .withIndex("by_status", (q) => q.eq("status", "pending_review"))
      .collect();
    const enriched = await Promise.all(
      list.map(async (s) => {
        const freelancer = await ctx.db.get(s.freelancerId);
        const idFrontUrl = !s.documentsDeletedAt ? await ctx.storage.getUrl(s.idFrontFileId) : null;
        const idBackUrl =
          !s.documentsDeletedAt && s.idBackFileId
            ? await ctx.storage.getUrl(s.idBackFileId)
            : null;
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
 * Get one KYC submission by freelancer ID (admin)
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
    if (!reviewer || (reviewer as Doc<"users">).role !== "admin") return null;
    const submission = await ctx.db
      .query("kycSubmissions")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .first();
    if (!submission) return null;
    const freelancer = await ctx.db.get(args.freelancerId);
    const idFrontUrl = !submission.documentsDeletedAt ? await ctx.storage.getUrl(submission.idFrontFileId) : null;
    const idBackUrl =
      !submission.documentsDeletedAt && submission.idBackFileId
        ? await ctx.storage.getUrl(submission.idBackFileId)
        : null;
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

/** Admin: freelancers with tests submitted (pending_admin) + KYC pending + not yet fully approved. */
export const getPendingSignupApprovals = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = args.userId ? await ctx.db.get(args.userId) : await getCurrentUser(ctx);
    if (!user || (user as Doc<"users">).role !== "admin") return [];

    const kycRows = await ctx.db
      .query("kycSubmissions")
      .withIndex("by_status", (q) => q.eq("status", "pending_review"))
      .collect();

    const out: Array<{
      freelancerId: Doc<"users">["_id"];
      name: string | undefined;
      email: string | undefined;
      overallScore: number;
      vettingStatus: string;
      kycSubmittedAt: number;
    }> = [];

    for (const k of kycRows) {
      const f = await ctx.db.get(k.freelancerId);
      if (!f) continue;

      const vetting = await ctx.db
        .query("vettingResults")
        .withIndex("by_freelancer", (q) => q.eq("freelancerId", k.freelancerId))
        .first();
      if (!isInOneStepSignupApprovalQueue(f, vetting, k) || !vetting) continue;

      const w = weightedVerificationOverall(vetting) ?? vetting.overallScore ?? 0;
      out.push({
        freelancerId: k.freelancerId,
        name: f.name,
        email: f.email,
        overallScore: w,
        vettingStatus: vetting.status,
        kycSubmittedAt: k.submittedAt,
      });
    }

    return out.sort((a, b) => b.kycSubmittedAt - a.kycSubmittedAt);
  },
});

/** Admin: full detail for signup approval drawer. */
export const getSignupApprovalDetail = query({
  args: {
    freelancerId: v.id("users"),
    reviewerUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const reviewer = args.reviewerUserId
      ? await ctx.db.get(args.reviewerUserId)
      : await getCurrentUser(ctx);
    if (!reviewer || (reviewer as Doc<"users">).role !== "admin") return null;

    const f = await ctx.db.get(args.freelancerId);
    if (!f || f.role !== "freelancer") return null;

    const vetting = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .first();
    const kyc = await ctx.db
      .query("kycSubmissions")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .first();

    const idFrontUrl =
      kyc && !kyc.documentsDeletedAt ? await ctx.storage.getUrl(kyc.idFrontFileId) : null;
    const idBackUrl =
      kyc?.idBackFileId && !kyc.documentsDeletedAt
        ? await ctx.storage.getUrl(kyc.idBackFileId)
        : null;
    const addressUrl =
      kyc && !kyc.documentsDeletedAt ? await ctx.storage.getUrl(kyc.addressDocFileId) : null;

    return {
      freelancer: {
        _id: f._id,
        name: f.name,
        email: f.email,
        verificationStatus: f.verificationStatus,
        kycStatus: f.kycStatus,
      },
      vetting: vetting
        ? {
            overallScore: vetting.overallScore,
            status: vetting.status,
            englishProficiency: vetting.englishProficiency,
            skillAssessments: vetting.skillAssessments,
            fraudFlags: vetting.fraudFlags,
          }
        : null,
      kyc: kyc
        ? {
            ...kyc,
            idFrontUrl,
            idBackUrl,
            addressUrl,
          }
        : null,
    };
  },
});
