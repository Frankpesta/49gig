import { v } from "convex/values";
import { mutation, MutationCtx } from "../_generated/server";
import { getCurrentUser } from "../auth";
import { Doc, Id } from "../_generated/dataModel";
import type { FunctionReference } from "convex/server";

const api = require("../_generated/api") as {
  api: {
    notifications: { actions: { sendSystemNotification: unknown } };
  };
};

async function getCurrentUserInMutation(
  ctx: MutationCtx,
  userId?: string
): Promise<Doc<"users"> | null> {
  if (userId) {
    const user = await ctx.db.get(userId as Doc<"users">["_id"]);
    if (!user || user.status !== "active") return null;
    return user;
  }
  const user = await getCurrentUser(ctx);
  if (!user || user.status !== "active") return null;
  return user;
}

/**
 * Create a contact enquiry from the public contact form.
 * No auth required - anyone can submit.
 */
export const createContactEnquiry = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    category: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("contactEnquiries", {
      name: args.name,
      email: args.email,
      subject: args.subject,
      category: args.category,
      message: args.message,
      status: "new",
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

/**
 * Reply to a contact enquiry. Admin/moderator only.
 * Sends email to the enquirer via action.
 */
export const replyToContactEnquiry = mutation({
  args: {
    enquiryId: v.id("contactEnquiries"),
    replyMessage: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      throw new Error("Only admins and moderators can reply to contact enquiries.");
    }

    const enquiry = await ctx.db.get(args.enquiryId);
    if (!enquiry) {
      throw new Error("Enquiry not found.");
    }

    const now = Date.now();
    await ctx.db.patch(args.enquiryId, {
      status: "replied",
      replyMessage: args.replyMessage,
      repliedAt: now,
      repliedBy: user._id,
      updatedAt: now,
    });

    return { success: true, enquiryEmail: enquiry.email };
  },
});

/**
 * Assign a contact enquiry to a moderator. Admin only.
 * The moderator is notified by email (scheduled action).
 */
export const assignContactEnquiryToModerator = mutation({
  args: {
    enquiryId: v.id("contactEnquiries"),
    moderatorId: v.id("users"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can assign enquiries to moderators.");
    }

    const enquiry = await ctx.db.get(args.enquiryId);
    if (!enquiry) {
      throw new Error("Enquiry not found.");
    }

    const moderator = await ctx.db.get(args.moderatorId);
    if (!moderator || moderator.status !== "active" || moderator.role !== "moderator") {
      throw new Error("Assignee must be an active moderator.");
    }

    const now = Date.now();
    await ctx.db.patch(args.enquiryId, {
      assignedModeratorId: args.moderatorId,
      assignedAt: now,
      updatedAt: now,
    });

    const { internal: internalApi } = require("../_generated/api") as {
      internal: {
        contactEnquiries: {
          actions: { sendContactEnquiryAssignmentEmailInternal: unknown };
        };
      };
    };
    await (
      ctx.scheduler.runAfter as (
        delayMs: number,
        fn: unknown,
        fnArgs: { enquiryId: Id<"contactEnquiries"> }
      ) => Promise<unknown>
    )(0, internalApi.contactEnquiries.actions.sendContactEnquiryAssignmentEmailInternal, {
      enquiryId: args.enquiryId,
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [args.moderatorId],
      title: "Enquiry assigned",
      message: `A contact enquiry was assigned to you: "${enquiry.subject}".`,
      type: "support",
      data: { enquiryId: args.enquiryId },
    });

    return { success: true };
  },
});

/**
 * Hard-delete a contact enquiry. Admin/moderator only.
 */
export const deleteContactEnquiry = mutation({
  args: {
    enquiryId: v.id("contactEnquiries"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      throw new Error("Only admins and moderators can delete enquiries.");
    }
    const enquiry = await ctx.db.get(args.enquiryId);
    if (!enquiry) throw new Error("Enquiry not found.");
    await ctx.db.delete(args.enquiryId);
    return { success: true };
  },
});
