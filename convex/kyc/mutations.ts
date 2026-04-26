import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc, Id } from "../_generated/dataModel";
import {
  weightedVerificationOverall,
} from "../vetting/scoring";
import { hardDeleteUserAccount } from "../users/hardDeleteUser";

const internalAny = require("../_generated/api").internal as any;

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

async function requireFreelancer(ctx: any, userId?: Id<"users">) {
  const user = userId ? await ctx.db.get(userId) : await getCurrentUser(ctx);
  if (!user || (user as Doc<"users">).role !== "freelancer" || (user as Doc<"users">).status !== "active")
    throw new Error("Only active freelancers can submit KYC");
  return user as Doc<"users">;
}

async function requireAdmin(ctx: any, userId?: Id<"users">) {
  const user = userId ? await ctx.db.get(userId) : await getCurrentUser(ctx);
  if (!user || (user as Doc<"users">).role !== "admin")
    throw new Error("Only admins can review KYC");
  return user as Doc<"users">;
}

/**
 * Generate upload URL for KYC documents (max 5MB per file)
 */
export const generateUploadUrl = mutation({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    await requireFreelancer(ctx, args.userId);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Submit or resubmit KYC documents
 */
export const submitKyc = mutation({
  args: {
    userId: v.optional(v.id("users")),
    idType: v.union(
      v.literal("nin"),
      v.literal("international_passport"),
      v.literal("voters_card"),
      v.literal("other")
    ),
    idOtherLabel: v.optional(v.string()),
    idFrontFileId: v.id("_storage"),
    idBackFileId: v.optional(v.id("_storage")),
    addressDocFileId: v.id("_storage"),
    addressDocType: v.union(
      v.literal("utility_bill"),
      v.literal("bank_statement"),
      v.literal("tenancy_agreement")
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireFreelancer(ctx, args.userId);
    const now = Date.now();

    if (args.idType === "other" && !args.idBackFileId) {
      throw new Error("For “other” ID types, upload both front and back.");
    }

    const vetting = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .first();
    if (!vetting) {
      throw new Error("Complete your verification tests before submitting KYC.");
    }
    const weighted = weightedVerificationOverall(vetting);
    if (weighted == null || weighted < 50) {
      throw new Error(
        "Your weighted test score must be at least 50% before you can submit KYC. Finish English (including writing) and skills first."
      );
    }

    const existing = await ctx.db
      .query("kycSubmissions")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
      .first();

    const payload = {
      freelancerId: user._id,
      idType: args.idType,
      idOtherLabel: args.idOtherLabel,
      idFrontFileId: args.idFrontFileId,
      idBackFileId: (args.idBackFileId ?? args.idFrontFileId) as Id<"_storage">,
      addressDocFileId: args.addressDocFileId,
      addressDocType: args.addressDocType,
      status: "pending_review" as const,
      idRejectionCount: existing?.idRejectionCount ?? 0,
      addressRejectionCount: existing?.addressRejectionCount ?? 0,
      submittedAt: now,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
    } else {
      await ctx.db.insert("kycSubmissions", payload);
    }

    await ctx.db.patch(user._id, {
      kycStatus: "pending_review",
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Admin: Approve KYC
 */
export const approveKyc = mutation({
  args: {
    freelancerId: v.id("users"),
    reviewerUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.reviewerUserId);
    const submission = await ctx.db
      .query("kycSubmissions")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .first();
    if (!submission || submission.status !== "pending_review")
      throw new Error("KYC submission not found or not pending review");

    const now = Date.now();
    const reviewer = await requireAdmin(ctx, args.reviewerUserId);

    await ctx.db.patch(submission._id, {
      status: "approved",
      reviewedBy: reviewer._id,
      reviewedAt: now,
      updatedAt: now,
    });

    const vetting = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .first();

    const patchUser: Record<string, unknown> = {
      kycStatus: "approved",
      kycApprovedAt: now,
      updatedAt: now,
    };
    if (vetting?.status === "approved") {
      patchUser.verificationStatus = "approved";
      patchUser.verificationCompletedAt = now;
    }
    await ctx.db.patch(args.freelancerId, patchUser as any);

    const freelancer = await ctx.db.get(args.freelancerId);
    await ctx.scheduler.runAfter(0, internalAny.kyc.actions.sendKycApprovedEmail, {
      email: freelancer?.email ?? "",
      name: freelancer?.name ?? "there",
    });

    // Trigger auto-assignment: check if any funded projects are waiting for a freelancer
    await ctx.scheduler.runAfter(
      5000, // small delay so KYC state is fully committed
      internalAny.matching.autoAssign.checkAndAutoAssignForFreelancer,
      { freelancerId: args.freelancerId }
    );

    return { success: true };
  },
});

/**
 * Admin: one-click approve freelancer signup (vetting pending_admin + KYC pending_review).
 */
export const approveFreelancerSignup = mutation({
  args: {
    freelancerId: v.id("users"),
    reviewerUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.reviewerUserId);
    const freelancer = await ctx.db.get(args.freelancerId);
    if (!freelancer || freelancer.role !== "freelancer" || freelancer.status !== "active") {
      throw new Error("Freelancer not found");
    }
    const vetting = await ctx.db
      .query("vettingResults")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .first();
    if (!vetting || vetting.status !== "pending_admin") {
      throw new Error("Tests are not in pending admin review");
    }
    const kyc = await ctx.db
      .query("kycSubmissions")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .first();
    if (!kyc || kyc.status !== "pending_review") {
      throw new Error("KYC is not pending review");
    }
    const now = Date.now();
    const reviewer = await requireAdmin(ctx, args.reviewerUserId);
    await ctx.db.patch(vetting._id, {
      status: "approved",
      reviewedBy: reviewer._id,
      reviewedAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(kyc._id, {
      status: "approved",
      reviewedBy: reviewer._id,
      reviewedAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(args.freelancerId, {
      verificationStatus: "approved",
      verificationCompletedAt: now,
      kycStatus: "approved",
      kycApprovedAt: now,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(0, internalAny.kyc.actions.sendKycApprovedEmail, {
      email: freelancer.email ?? "",
      name: freelancer.name ?? "there",
    });
    await ctx.scheduler.runAfter(
      5000,
      internalAny.matching.autoAssign.checkAndAutoAssignForFreelancer,
      { freelancerId: args.freelancerId }
    );
    await ctx.db.insert("auditLogs", {
      action: "freelancer_signup_approved",
      actionType: "admin",
      actorId: reviewer._id,
      actorRole: "admin",
      targetType: "user",
      targetId: args.freelancerId,
      details: {},
      createdAt: now,
    });
    return { success: true };
  },
});

/** Predefined rejection reasons for dropdown */
export const KYC_REJECTION_REASONS = {
  id: [
    "Document is blurry or unreadable",
    "Document is expired",
    "Wrong document type submitted",
    "Front and back do not match",
    "Name does not match account",
    "Other",
  ],
  address: [
    "Document is older than 3 months",
    "Document is blurry or unreadable",
    "Address does not match account",
    "Wrong document type",
    "Other",
  ],
} as const;

/**
 * Admin: Reject KYC (ID step or Address step)
 */
export const rejectKyc = mutation({
  args: {
    freelancerId: v.id("users"),
    step: v.union(v.literal("id"), v.literal("address")),
    reason: v.string(),
    reviewerUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.reviewerUserId);
    const submission = await ctx.db
      .query("kycSubmissions")
      .withIndex("by_freelancer", (q) => q.eq("freelancerId", args.freelancerId))
      .first();
    if (!submission || submission.status !== "pending_review")
      throw new Error("KYC submission not found or not pending review");

    const now = Date.now();
    const reviewer = await requireAdmin(ctx, args.reviewerUserId);

    const isIdStep = args.step === "id";
    const newIdCount = isIdStep ? submission.idRejectionCount + 1 : submission.idRejectionCount;
    const newAddressCount = !isIdStep ? submission.addressRejectionCount + 1 : submission.addressRejectionCount;

    await ctx.db.patch(submission._id, {
      status: isIdStep ? "id_rejected" : "address_rejected",
      idRejectionCount: newIdCount,
      addressRejectionCount: newAddressCount,
      idRejectionReason: isIdStep ? args.reason : submission.idRejectionReason,
      addressRejectionReason: !isIdStep ? args.reason : submission.addressRejectionReason,
      reviewedBy: reviewer._id,
      reviewedAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.freelancerId, {
      kycStatus: isIdStep ? "id_rejected" : "address_rejected",
      updatedAt: now,
    });

    const freelancer = await ctx.db.get(args.freelancerId);
    const email = freelancer?.email ?? "";
    const name = freelancer?.name ?? "there";

    if (newIdCount >= 2 || newAddressCount >= 2) {
      await ctx.scheduler.runAfter(0, internalAny.kyc.actions.sendKycAccountRemovedEmail, {
        email,
        name,
        reason: args.reason,
      });
      try {
        await hardDeleteUserAccount(ctx, {
          targetUserId: args.freelancerId,
          auditActorId: args.freelancerId,
          auditActorRole: "system",
          auditActionType: "system",
          reason: "kyc_rejected_max_attempts",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await ctx.db.patch(args.freelancerId, {
          status: "deleted",
          updatedAt: Date.now(),
        });
        await ctx.runMutation(internalAny.auth.sessions.revokeAllSessionsForUserInternal, {
          userId: args.freelancerId,
          reason: "kyc_rejected_max_attempts",
        });
        await ctx.db.insert("auditLogs", {
          action: "kyc_removal_hard_delete_blocked",
          actionType: "system",
          actorId: args.freelancerId,
          actorRole: "freelancer",
          targetType: "user",
          targetId: args.freelancerId as string,
          details: { reason: args.reason, error: message },
          createdAt: Date.now(),
        });
      }
    } else {
      await ctx.scheduler.runAfter(0, internalAny.kyc.actions.sendKycRejectedEmail, {
        email,
        name,
        step: args.step,
        reason: args.reason,
      });
    }

    return { success: true, accountDeleted: newIdCount >= 2 || newAddressCount >= 2 };
  },
});
