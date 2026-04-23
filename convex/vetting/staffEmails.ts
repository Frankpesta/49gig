"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { sendEmail } from "../email/send";
import React from "react";
import {
  VerificationIncompleteReminderEmail,
  VerificationTerminatedEmail,
} from "../../emails/templates";

export const sendVerificationTerminatedEmailInternal = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (_ctx, args) => {
    const appUrl =
      process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://49gig.com";
    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!args.email) return { sent: false };
    await sendEmail({
      to: args.email,
      subject: "[49GIG] Freelancer application update",
      react: React.createElement(VerificationTerminatedEmail, {
        name: args.name,
        appUrl,
        date,
      }),
    });
    return { sent: true };
  },
});

export const sendVerificationIncompleteReminderInternal = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (_ctx, args) => {
    const appUrl =
      process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://49gig.com";
    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!args.email) return { sent: false };
    await sendEmail({
      to: args.email,
      subject: "[49GIG] Reminder: complete your freelancer verification",
      react: React.createElement(VerificationIncompleteReminderEmail, {
        name: args.name,
        appUrl,
        date,
      }),
    });
    return { sent: true };
  },
});
