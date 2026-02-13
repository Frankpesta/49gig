"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import React from "react";
import { sendEmail } from "../email/send";
import {
  VerificationEmail,
  VerificationCodeEmail,
  PasswordResetEmail,
  WelcomeEmail,
  TwoFactorCodeEmail,
} from "../../emails/templates";

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
 * OAuth sign-in handler (deprecated - use auth/oauth functions instead)
 * Kept for backwards compatibility
 */
export const oauthSignIn = action({
  args: {
    provider: v.union(v.literal("google")),
    code: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    // Deprecated: kept for backwards compatibility; please use /oauth callback flow
    console.warn("oauthSignIn action is deprecated; use /oauth/callback flow instead.");
    return { success: false, message: "Deprecated OAuth handler. Use /oauth/callback." };
  },
});

/**
 * Send email verification (6-digit code for manual signups)
 */
export const sendVerificationEmail = action({
  args: {
    userId: v.id("users"),
    email: v.string(),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    token: v.optional(v.string()),
    verifyUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const appUrl = getAppUrl();
    const logoUrl = getLogoUrl(appUrl);
    const date = formatDate();

    if (args.code) {
      await sendEmail({
        to: args.email,
        subject: "Your 49GIG verification code",
        react: React.createElement(VerificationCodeEmail, {
          name: args.name || "there",
          code: args.code,
          appUrl,
          logoUrl,
          date,
        }),
      });
    } else if (args.token) {
      const verifyUrl =
        args.verifyUrl || `${appUrl}/verify-email?token=${encodeURIComponent(args.token)}`;
      await sendEmail({
        to: args.email,
        subject: "Verify your email",
        react: React.createElement(VerificationEmail, {
          name: args.name || "there",
          verifyUrl,
          appUrl,
          logoUrl,
          date,
        }),
      });
    } else {
      throw new Error("Either code or token must be provided");
    }

    return { success: true };
  },
});

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = action({
  args: {
    email: v.string(),
    resetToken: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const appUrl = getAppUrl();
    const logoUrl = getLogoUrl(appUrl);
    const date = formatDate();
    const resetUrl = `${appUrl}/reset-password?email=${encodeURIComponent(
      args.email
    )}&token=${encodeURIComponent(args.resetToken)}`;

    await sendEmail({
      to: args.email,
      subject: "Reset your password",
      react: React.createElement(PasswordResetEmail, {
        name: args.name || "there",
        resetUrl,
        appUrl,
        logoUrl,
        date,
      }),
    });

    return { success: true };
  },
});

export const sendWelcomeEmail = action({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(v.literal("client"), v.literal("freelancer")),
  },
  handler: async (ctx, args) => {
    const appUrl = getAppUrl();
    const logoUrl = getLogoUrl(appUrl);
    const date = formatDate();

    await sendEmail({
      to: args.email,
      subject: "Welcome to 49GIG",
      react: React.createElement(WelcomeEmail, {
        name: args.name || "there",
        role: args.role,
        appUrl,
        logoUrl,
        date,
      }),
    });

    return { success: true };
  },
});

export const sendTwoFactorCodeEmail = action({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    code: v.string(),
    purpose: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const appUrl = getAppUrl();
    const logoUrl = getLogoUrl(appUrl);
    const date = formatDate();

    await sendEmail({
      to: args.email,
      subject: "Your 49GIG verification code",
      react: React.createElement(TwoFactorCodeEmail, {
        name: args.name || "there",
        code: args.code,
        purpose: args.purpose || "sign in",
        appUrl,
        logoUrl,
        date,
      }),
    });

    return { success: true };
  },
});
