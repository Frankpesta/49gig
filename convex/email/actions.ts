"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import React from "react";
import { sendEmail } from "./send";
import { AdminBroadcastEmail } from "../../emails/templates";

const internalAny: any = require("../_generated/api").internal;

function getAppUrl() {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://49gig.com"
  );
}

function getLogoUrl(appUrl: string) {
  return `${appUrl}/logo-light.png`;
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Send broadcast email from admin/moderator dashboard.
 * Recipient types: all, clients, freelancers, or individual (by userId).
 */
export const sendAdminBroadcastEmail = action({
  args: {
    adminUserId: v.id("users"),
    recipientType: v.union(
      v.literal("all"),
      v.literal("clients"),
      v.literal("freelancers"),
      v.literal("individual")
    ),
    recipientUserId: v.optional(v.id("users")),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify admin/moderator
    const adminUser = await ctx.runQuery(
      internalAny.users.queries.getUserByIdInternal,
      { userId: args.adminUserId }
    );
    if (
      !adminUser ||
      (adminUser.role !== "admin" && adminUser.role !== "moderator")
    ) {
      throw new Error("Only admins and moderators can send broadcast emails");
    }

    const appUrl = getAppUrl();
    const logoUrl = getLogoUrl(appUrl);
    const date = formatDate();

    let recipients: { email: string }[] = [];

    if (args.recipientType === "individual") {
      if (!args.recipientUserId) {
        throw new Error("recipientUserId required for individual emails");
      }
      const recipient = await ctx.runQuery(
        internalAny.users.queries.getUserByIdInternal,
        { userId: args.recipientUserId }
      );
      if (!recipient?.email) {
        throw new Error("Recipient not found or has no email");
      }
      recipients = [{ email: recipient.email }];
    } else {
      const list = await ctx.runQuery(
        internalAny.users.queries.getEmailsForAdminBroadcastInternal,
        { recipientType: args.recipientType }
      );
      recipients = list.map((r: { email: string }) => ({ email: r.email }));
    }

    if (recipients.length === 0) {
      return { sent: 0, message: "No recipients found" };
    }

    const emails = recipients.map((r) => r.email).filter(Boolean);
    if (emails.length === 0) {
      return { sent: 0, message: "No valid email addresses" };
    }

    // Resend allows up to 100 recipients per request for batch
    const BATCH_SIZE = 50;
    let sent = 0;
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      await sendEmail({
        to: batch,
        subject: args.subject,
        react: React.createElement(AdminBroadcastEmail, {
          subject: args.subject,
          body: args.body,
          appUrl,
          logoUrl,
          date,
        }),
      });
      sent += batch.length;
    }

    return { sent, message: `Email sent to ${sent} recipient(s)` };
  },
});
