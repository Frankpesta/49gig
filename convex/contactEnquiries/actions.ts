// @ts-nocheck
"use node";

import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { sendEmail } from "../email/send";
import React from "react";
import { assertRecaptchaToken } from "../recaptchaVerify";
import { SystemNoticeEmail } from "../../emails/templates";

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const CONTACT_ENQUIRY_INBOX = "support@49gig.com";

/**
 * Submit contact enquiry from public form. Inserts to DB and notifies support.
 */
export const submitContactEnquiry = action({
  args: {
    recaptchaToken: v.string(),
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    category: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await assertRecaptchaToken(args.recaptchaToken, { expectedAction: "contact" });

    const { recaptchaToken: _t, ...enquiry } = args;
    const enquiryId = await ctx.runMutation(
      internal.contactEnquiries.internalMutations.createContactEnquiryInternal,
      enquiry
    );

    const appUrl =
      process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://49gig.com";
    const dashboardUrl = `${appUrl}/dashboard/enquiries`;
    const date = formatDate();

    await sendEmail({
      to: CONTACT_ENQUIRY_INBOX,
      subject: `[49GIG] New contact enquiry: ${args.subject}`,
      react: React.createElement(SystemNoticeEmail, {
        name: "team",
        appUrl,
        logoUrl: `${appUrl}/logo-light.png`,
        date,
        heroLabel: "Contact Enquiry",
        headline: "New contact enquiry",
        details: [
          { label: "From", value: `${args.name} <${args.email}>` },
          { label: "Category", value: args.category },
          { label: "Subject", value: args.subject },
        ],
        bodyText: args.message,
        ctaHref: dashboardUrl,
        ctaLabel: "View and reply",
      }),
    });

    return enquiryId;
  },
});

/**
 * Send reply email to enquirer. Call after replyToContactEnquiry mutation.
 */
export const sendContactEnquiryReplyEmail = action({
  args: {
    enquiryId: v.id("contactEnquiries"),
  },
  handler: async (ctx, args) => {
    const enquiry = await ctx.runQuery(
      internal.contactEnquiries.queries.getEnquiryByIdInternal,
      { enquiryId: args.enquiryId }
    );
    if (!enquiry || !enquiry.replyMessage) return;

    let replier: { name: string; email: string } | null = null;
    if (enquiry.repliedBy) {
      replier = await ctx.runQuery(internal.users.queries.getUserByIdInternal, {
        userId: enquiry.repliedBy,
      });
    }

    const appUrl =
      process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://49gig.com";
    const date = formatDate();

    await sendEmail({
      to: enquiry.email,
      subject: `Re: ${enquiry.subject} – 49GIG Support`,
      replyTo: replier?.email,
      react: React.createElement(SystemNoticeEmail, {
        name: enquiry.name,
        appUrl,
        logoUrl: `${appUrl}/logo-light.png`,
        date,
        heroLabel: "Support Reply",
        headline: "Support replied to your enquiry",
        bodyText: `${enquiry.replyMessage}${
          replier
            ? `\n\nYou can reply directly to this email to continue the conversation with ${replier.name} (${replier.email}).`
            : ""
        }\n\nBest regards,\nThe 49GIG Team`,
        ctaHref: `${appUrl}/contact`,
        ctaLabel: "Contact support",
      }),
    });
  },
});

/**
 * Notify assigned moderator by email (scheduled from assignContactEnquiryToModerator).
 */
export const sendContactEnquiryAssignmentEmailInternal = internalAction({
  args: {
    enquiryId: v.id("contactEnquiries"),
  },
  handler: async (ctx, args) => {
    const enquiry = await ctx.runQuery(
      internal.contactEnquiries.queries.getEnquiryByIdInternal,
      { enquiryId: args.enquiryId }
    );
    if (!enquiry?.assignedModeratorId) return;

    const moderator = await ctx.runQuery(internal.users.queries.getUserByIdInternal, {
      userId: enquiry.assignedModeratorId,
    });
    if (!moderator?.email) return;

    const appUrl =
      process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://49gig.com";
    const dashboardUrl = `${appUrl}/dashboard/enquiries`;
    const date = formatDate();

    await sendEmail({
      to: moderator.email,
      subject: `[49GIG] Contact enquiry assigned to you: ${enquiry.subject}`,
      react: React.createElement(SystemNoticeEmail, {
        name: moderator.name,
        appUrl,
        logoUrl: `${appUrl}/logo-light.png`,
        date,
        heroLabel: "Contact Enquiry",
        headline: "A contact enquiry was assigned to you",
        details: [
          { label: "From", value: `${enquiry.name} <${enquiry.email}>` },
          { label: "Subject", value: enquiry.subject },
        ],
        bodyText: `An admin assigned this contact enquiry to you.\n\n${enquiry.message}`,
        ctaHref: dashboardUrl,
        ctaLabel: "Open enquiries",
      }),
    });
  },
});
