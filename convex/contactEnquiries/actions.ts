// @ts-nocheck
"use node";

import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { sendEmail } from "../email/send";
import React from "react";
import { assertRecaptchaToken } from "../recaptchaVerify";

/**
 * Submit contact enquiry from public form. Inserts to DB and notifies admins.
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

    const admins = await ctx.runQuery(
      internal.users.queries.getModeratorsAndAdminsInternal,
      {}
    );
    if (admins && admins.length > 0) {
      const adminEmails = admins.map((a: { email: string }) => a.email);
      const appUrl =
        process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://49gig.com";
      const dashboardUrl = `${appUrl}/dashboard/enquiries`;

      await sendEmail({
        to: adminEmails,
        subject: `[49GIG] New contact enquiry: ${args.subject}`,
        react: React.createElement(
          "div",
          { style: { fontFamily: "sans-serif", padding: "24px", maxWidth: "600px" } },
          React.createElement("h2", { style: { marginBottom: "16px" } }, "New Contact Enquiry"),
          React.createElement("p", null, `From: ${args.name} <${args.email}>`),
          React.createElement("p", null, `Category: ${args.category}`),
          React.createElement("p", null, `Subject: ${args.subject}`),
          React.createElement("p", {
            style: { marginTop: "16px", whiteSpace: "pre-wrap" },
          }, args.message),
          React.createElement("a", {
            href: dashboardUrl,
            style: {
              display: "inline-block",
              marginTop: "24px",
              padding: "12px 24px",
              backgroundColor: "#2563eb",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
            },
          }, "View & Reply in Dashboard")
        ),
      });
    }

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

    await sendEmail({
      to: enquiry.email,
      subject: `Re: ${enquiry.subject} – 49GIG Support`,
      replyTo: replier?.email,
      react: React.createElement(
        "div",
        { style: { fontFamily: "sans-serif", padding: "24px", maxWidth: "600px" } },
        React.createElement("p", null, `Hi ${enquiry.name},`),
        React.createElement("p", { style: { marginTop: "16px", whiteSpace: "pre-wrap" } }, enquiry.replyMessage),
        replier
          ? React.createElement(
              "p",
              { style: { marginTop: "16px", color: "#6b7280", fontSize: "14px" } },
              `You can reply directly to this email to continue the conversation with ${replier.name} (${replier.email}).`
            )
          : null,
        React.createElement("p", { style: { marginTop: "24px", color: "#6b7280", fontSize: "14px" } },
          `You can also submit a new enquiry at ${appUrl}/contact.`
        ),
        React.createElement("p", { style: { marginTop: "16px" } }, "Best regards,"),
        React.createElement("p", null, "The 49GIG Team")
      ),
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

    await sendEmail({
      to: moderator.email,
      subject: `[49GIG] Contact enquiry assigned to you: ${enquiry.subject}`,
      react: React.createElement(
        "div",
        { style: { fontFamily: "sans-serif", padding: "24px", maxWidth: "600px" } },
        React.createElement("p", null, `Hi ${moderator.name},`),
        React.createElement(
          "p",
          { style: { marginTop: "16px" } },
          "An admin has assigned a contact enquiry to you."
        ),
        React.createElement("p", { style: { marginTop: "12px" } }, React.createElement("strong", null, "From: "), `${enquiry.name} <${enquiry.email}>`),
        React.createElement("p", null, React.createElement("strong", null, "Subject: "), enquiry.subject),
        React.createElement("p", {
          style: { marginTop: "16px", whiteSpace: "pre-wrap" },
        }, enquiry.message),
        React.createElement("a", {
          href: dashboardUrl,
          style: {
            display: "inline-block",
            marginTop: "24px",
            padding: "12px 24px",
            backgroundColor: "#2563eb",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
          },
        }, "Open enquiries in dashboard")
      ),
    });
  },
});
