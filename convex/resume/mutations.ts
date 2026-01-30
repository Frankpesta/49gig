import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { api, internal } from "../_generated/api";
import type { FunctionReference } from "convex/server";

const notificationsApi = require("../_generated/api") as {
  api: {
    notifications: { actions: { sendSystemNotification: unknown } };
  };
};

const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6;

/**
 * Complete resume upload: store file reference, set status, and build a basic bio.
 * Later we can trigger a richer parsing/LLM step here.
 * Supports both Convex Auth and session token authentication.
 */
export const completeResumeUpload = mutation({
  args: {
    fileId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resumeActions: any = require("../_generated/api").internal.resume.actions;
    const authQueries: any = require("../_generated/api").api.auth?.queries || require("../_generated/api").api["auth/queries"];
    let user = null;

    // Try Convex Auth first
    user = await getCurrentUser(ctx);
    
    // If no Convex Auth user and session token provided, verify session token
    if (!user && args.sessionToken) {
            user = await ctx.runQuery(authQueries.verifySession, { sessionToken: args.sessionToken });
    }

    if (!user) {
      throw new Error("Unauthorized");
    }
    if (user.role !== "freelancer") {
      throw new Error("Only freelancers can upload resumes");
    }

    // Enforce cooldown only after a successful extraction (processed). If extraction failed, allow re-upload.
    const now = Date.now();
    if (user.resumeStatus !== "failed") {
      if (
        user.resumeCanReuploadAt &&
        now < user.resumeCanReuploadAt
      ) {
        const waitDays = Math.ceil((user.resumeCanReuploadAt - now) / (1000 * 60 * 60 * 24));
        throw new Error(`Reupload not allowed yet. Try again in ~${waitDays} day(s).`);
      }
    }

    // Confirm storage URL exists
    const resumeUrl = await ctx.storage.getUrl(args.fileId);
    if (!resumeUrl) {
      throw new Error("Failed to read uploaded file");
    }

    await ctx.db.patch(user._id, {
      resumeFileId: args.fileId,
      resumeUrl: undefined, // do not persist public URL; generate per-request
      resumeUploadedAt: now,
      resumeStatus: "uploaded",
      resumeBio: undefined,
      resumeParsedData: {
        fileName: args.fileName,
        fileSize: args.fileSize,
        mimeType: args.mimeType,
        uploadedAt: now,
      },
      // Do not set resumeCanReuploadAt here — only set when extraction succeeds (in applyParsedResumeData)
    });

    const sendSystemNotification =
      notificationsApi.api.notifications.actions
        .sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [user._id],
      title: "Resume uploaded",
      message: "We received your resume and started processing it.",
      type: "resume",
      data: { userId: user._id },
    });

    // Kick off parsing asynchronously (LLM / parser hook)
    await ctx.scheduler.runAfter(
      0,
      resumeActions.parseResumeAndBuildBio,
      {
        userId: user._id,
        fileId: args.fileId,
      }
    );

    return { success: true, resumeStatus: "uploaded" as const };
  },
});

/**
 * Internal: mark resume as processing when parsing begins.
 */
export const setResumeProcessing = mutation({
  args: {
    userId: v.id("users"),
    fileId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      resumeStatus: "processing",
      resumeFileId: args.fileId,
    });
  },
});

/**
 * Internal: apply parsed data and final status.
 */
export const applyParsedResumeData = mutation({
  args: {
    userId: v.id("users"),
    resumeBio: v.string(),
    resumeParsedData: v.any(),
    resumeStatus: v.union(v.literal("processed"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.userId, {
      resumeBio: args.resumeBio,
      resumeParsedData: {
        ...args.resumeParsedData,
        error: args.error,
      },
      resumeStatus: args.resumeStatus,
      // Only set re-upload cooldown when extraction succeeded; failed users can re-upload until success
      ...(args.resumeStatus === "processed" && { resumeCanReuploadAt: now + SIX_MONTHS_MS }),
    });

    const sendSystemNotification =
      notificationsApi.api.notifications.actions
        .sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [args.userId],
      title: args.resumeStatus === "processed" ? "Resume processed" : "Resume failed",
      message:
        args.resumeStatus === "processed"
          ? "Your resume is ready. Review your executive summary."
          : "We couldn’t process your resume. Please try again.",
      type: "resume",
      data: { userId: args.userId },
    });
  },
});

