"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { sendEmail } from "../email/send";
import React from "react";
import {
  CodingFeedbackEmail,
  VerificationIncompleteReminderEmail,
  VerificationReminderOpportunitiesEmail,
  VerificationReminderUrgencyEmail,
  VerificationTerminatedEmail,
} from "../../emails/templates";

const codingFeedbackValidator = v.object({
  overallSummary: v.string(),
  challenges: v.array(
    v.object({
      title: v.string(),
      passedCases: v.number(),
      totalCases: v.number(),
      coaching: v.string(),
    })
  ),
});

export const sendVerificationTerminatedEmailInternal = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
    codingFeedback: v.optional(codingFeedbackValidator),
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
      subject: "[49GIG] Verification unsuccessful — application not approved",
      react: React.createElement(VerificationTerminatedEmail, {
        name: args.name,
        appUrl,
        date,
        codingFeedback: args.codingFeedback,
      }),
    });
    return { sent: true };
  },
});

/**
 * Email a freelancer their AI coaching feedback after a first-attempt skill test
 * failure (retake still available).
 */
export const sendCodingFeedbackEmailInternal = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
    overallSummary: v.string(),
    challenges: v.array(
      v.object({
        title: v.string(),
        passedCases: v.number(),
        totalCases: v.number(),
        coaching: v.string(),
      })
    ),
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
      subject: "[49GIG] Feedback on your coding test — and your retake",
      react: React.createElement(CodingFeedbackEmail, {
        name: args.name,
        appUrl,
        date,
        codingFeedback: {
          overallSummary: args.overallSummary,
          challenges: args.challenges,
        },
      }),
    });
    return { sent: true };
  },
});

const REMINDER_VARIANTS: Array<{
  subject: string;
  component: React.ComponentType<{ name?: string; appUrl: string; date: string }>;
}> = [
  {
    subject: "[49GIG] Reminder: complete your freelancer verification",
    component: VerificationIncompleteReminderEmail,
  },
  {
    subject: "[49GIG] Global clients are looking for your skills",
    component: VerificationReminderOpportunitiesEmail,
  },
  {
    subject: "[49GIG] Your profile is incomplete — don't miss out",
    component: VerificationReminderUrgencyEmail,
  },
];

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

    const variant = REMINDER_VARIANTS[Math.floor(Math.random() * REMINDER_VARIANTS.length)];
    await sendEmail({
      to: args.email,
      subject: variant.subject,
      react: React.createElement(variant.component, {
        name: args.name,
        appUrl,
        date,
      }),
    });
    return { sent: true };
  },
});
