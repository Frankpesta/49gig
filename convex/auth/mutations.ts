import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { checkRateLimit, clearRateLimit } from "./rateLimit";
import { hashPassword, verifyPassword } from "./password";

/**
 * Sign up with email and password
 * Creates a new user account
 */
export const signup = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    role: v.union(
      v.literal("client"),
      v.literal("freelancer")
    ),
  },
  handler: async (ctx, args) => {
    // Rate limiting: 5 signups per hour per email
    if (checkRateLimit(`signup:${args.email}`, 5, 3600000)) {
      throw new Error("Too many signup attempts. Please try again later.");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Validate password strength
    if (args.password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    // Hash password using bcrypt (synchronous)
    const passwordHash = hashPassword(args.password);

    // Create user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      emailVerified: false,
      name: args.name,
      authProvider: "email",
      passwordHash: passwordHash,
      role: args.role,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "user_signup",
      actionType: "auth",
      actorId: userId,
      actorRole: args.role,
      targetType: "user",
      targetId: userId,
      details: {
        email: args.email,
        role: args.role,
      },
      createdAt: Date.now(),
    });

    // Clear rate limit on successful signup
    clearRateLimit(`signup:${args.email}`);

    // TODO: Send email verification
    // For now, return success
    return {
      success: true,
      userId,
      emailVerificationRequired: true,
    };
  },
});

/**
 * Sign in with email and password
 * Note: This is a simplified version. In production, use Convex Auth or proper JWT
 */
export const signin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Rate limiting: 5 login attempts per 15 minutes per email
    const rateLimitKey = `login:${args.email}`;
    if (checkRateLimit(rateLimitKey, 5, 900000)) {
      throw new Error("Too many login attempts. Please try again in 15 minutes.");
    }

    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (user.status !== "active") {
      throw new Error("Account is not active");
    }

    // Verify password using bcrypt
    if (!user.passwordHash) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = verifyPassword(args.password, user.passwordHash);
    if (!isPasswordValid) {
      // Create audit log for failed login attempt
      await ctx.db.insert("auditLogs", {
        action: "login_failed",
        actionType: "auth",
        actorId: user._id,
        actorRole: user.role,
        targetType: "user",
        targetId: user._id,
        details: {
          email: args.email,
          reason: "invalid_password",
        },
        createdAt: Date.now(),
      });
      throw new Error("Invalid email or password");
    }

    // Update last login
    const now = Date.now();
    await ctx.db.patch(user._id, {
      lastLoginAt: now,
      updatedAt: now,
    });

    // Create session using internal mutation
    // Note: In production, you'd call the createSession mutation
    // For now, we'll create it directly here
    const sessionToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const refreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
    const REFRESH_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    const sessionId = await ctx.db.insert("sessions", {
      userId: user._id,
      sessionToken,
      refreshToken,
      expiresAt: now + SESSION_DURATION_MS,
      refreshExpiresAt: now + REFRESH_DURATION_MS,
      lastRotatedAt: now,
      rotationCount: 0,
      ipAddress: undefined,
      userAgent: undefined,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    
    const session = {
      sessionId,
      sessionToken,
      refreshToken,
      expiresAt: now + SESSION_DURATION_MS,
    };

    // Create audit log for successful login
    await ctx.db.insert("auditLogs", {
      action: "login_success",
      actionType: "auth",
      actorId: user._id,
      actorRole: user.role,
      targetType: "user",
      targetId: user._id,
      details: {
        email: args.email,
        sessionId: session.sessionId,
      },
      createdAt: now,
    });

    // Clear rate limit on successful login
    clearRateLimit(rateLimitKey);

    return {
      success: true,
      userId: user._id,
      sessionToken: session.sessionToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      userRole: user.role,
    };
  },
});

/**
 * Request password reset
 */
export const requestPasswordReset = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      // Don't reveal if user exists for security
      return { success: true };
    }

    // Generate reset token (in production, use secure token generation)
    const resetToken = `reset_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Store reset token (you might want a separate table for this)
    // For now, we'll add it to user (in production, use a separate table)
    await ctx.db.patch(user._id, {
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "password_reset_requested",
      actionType: "auth",
      actorId: user._id,
      actorRole: user.role,
      targetType: "user",
      targetId: user._id,
      details: {
        email: args.email,
      },
      createdAt: Date.now(),
    });

    // TODO: Send password reset email with token
    // For now, return success (in production, don't return token to client)
    return {
      success: true,
      // In production, don't return token - send via email
      resetToken: resetToken, // Remove in production
    };
  },
});

/**
 * Reset password with token
 */
export const resetPassword = mutation({
  args: {
    email: v.string(),
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("Invalid reset token");
    }

    // Validate password strength
    if (args.newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    // TODO: Verify reset token and expiry
    // For now, accept any token (in production, verify properly)

    // Hash new password using bcrypt (synchronous)
    const passwordHash = hashPassword(args.newPassword);

    // Update password
    await ctx.db.patch(user._id, {
      passwordHash: passwordHash,
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "password_reset_completed",
      actionType: "auth",
      actorId: user._id,
      actorRole: user.role,
      targetType: "user",
      targetId: user._id,
      details: {
        email: args.email,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Verify email address
 */
export const verifyEmail = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    if (!identity.email) {
      throw new Error("Email not found in identity");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // TODO: Verify email token
    // For now, just mark as verified
    await ctx.db.patch(user._id, {
      emailVerified: true,
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "email_verified",
      actionType: "auth",
      actorId: user._id,
      actorRole: user.role,
      targetType: "user",
      targetId: user._id,
      details: {
        email: user.email,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Resend email verification
 */
export const resendEmailVerification = mutation({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    if (!identity.email) {
      throw new Error("Email not found in identity");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.emailVerified) {
      throw new Error("Email already verified");
    }

    // TODO: Send verification email
    return { success: true };
  },
});

