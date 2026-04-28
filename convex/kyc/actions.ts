"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import React from "react";
import { sendEmail } from "../email/send";
import { SystemNoticeEmail } from "../../emails/templates";

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
 * Send KYC rejected email (reason + ask to resubmit)
 */
export const sendKycRejectedEmail = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
    step: v.union(v.literal("id"), v.literal("address")),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const stepLabel = args.step === "id" ? "ID verification" : "address verification";
    const appUrl = getAppUrl();
    await sendEmail({
      to: args.email,
      subject: "49GIG KYC – Action required",
      react: React.createElement(SystemNoticeEmail, {
        name: args.name,
        appUrl,
        logoUrl: getLogoUrl(appUrl),
        date: formatDate(),
        heroLabel: "KYC Update",
        headline: "KYC action required",
        details: [{ label: "Reason", value: args.reason }],
        bodyText: `Your ${stepLabel} could not be approved. Please review the reason and resubmit clear images or PDFs from your verification page.`,
        ctaHref: `${appUrl}/onboarding/verification`,
        ctaLabel: "Continue verification",
      }),
    });
    return { sent: true };
  },
});

/**
 * Send KYC approved email (congratulatory)
 */
export const sendKycApprovedEmail = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const appUrl = getAppUrl();
    await sendEmail({
      to: args.email,
      subject: "49GIG KYC approved – You’re all set",
      react: React.createElement(SystemNoticeEmail, {
        name: args.name,
        appUrl,
        logoUrl: getLogoUrl(appUrl),
        date: formatDate(),
        heroLabel: "KYC Approved",
        headline: "Your KYC has been approved",
        bodyText:
          "Congratulations. Your identity and address verification have been approved. You now have full platform access and can be matched with client projects.",
        ctaHref: `${appUrl}/dashboard`,
        ctaLabel: "Open dashboard",
      }),
    });
    return { sent: true };
  },
});

/**
 * Send account removed email (after 2 rejections)
 */
export const sendKycAccountRemovedEmail = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const appUrl = getAppUrl();
    await sendEmail({
      to: args.email,
      subject: "49GIG account update",
      react: React.createElement(SystemNoticeEmail, {
        name: args.name,
        appUrl,
        logoUrl: getLogoUrl(appUrl),
        date: formatDate(),
        heroLabel: "Account Update",
        headline: "Your account has been removed",
        details: [{ label: "Reason", value: args.reason }],
        bodyText:
          "After repeated unsuccessful KYC attempts, your account has been removed from the platform. If you believe this is an error, please contact support.",
        ctaHref: `${appUrl}/contact`,
        ctaLabel: "Contact support",
      }),
    });
    return { sent: true };
  },
});
