import { action } from "../_generated/server";
import { v } from "convex/values";

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
 * Send email verification email
 * This would typically call an email service
 */
export const sendVerificationEmail = action({
  args: {
    userId: v.id("users"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // Generate verification token
    // Send email with verification link
    // Store token in database

    console.log(`Would send verification email to ${args.email}`);
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
  },
  handler: async (ctx, args) => {
    // TODO: Integrate with email service
    // Send email with reset link containing token

    console.log(`Would send password reset email to ${args.email}`);
    return { success: true };
  },
});

