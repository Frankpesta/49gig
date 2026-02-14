"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { sendEmail } from "../email/send";
import React from "react";

const internal = require("../_generated/api").internal;

/**
 * Submit contact enquiry from public form. Inserts to DB and notifies admins.
 */
export const submitContactEnquiry = action({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    category: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const enquiryId = await ctx.runMutation(
      internal.contactEnquiries.internalMutations.createContactEnquiryInternal,
      args
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

    await sendEmail({
      to: enquiry.email,
      subject: `Re: ${enquiry.subject} – 49GIG Support`,
      react: React.createElement(
        "div",
        { style: { fontFamily: "sans-serif", padding: "24px", maxWidth: "600px" } },
        React.createElement("p", null, `Hi ${enquiry.name},`),
        React.createElement("p", { style: { marginTop: "16px", whiteSpace: "pre-wrap" } }, enquiry.replyMessage),
        React.createElement("p", { style: { marginTop: "24px", color: "#6b7280", fontSize: "14px" } },
          "If you have further questions, please reply to this email or submit a new enquiry at 49gig.com/contact."
        ),
        React.createElement("p", { style: { marginTop: "16px" } }, "Best regards,"),
        React.createElement("p", null, "The 49GIG Team")
      ),
    });
  },
});
