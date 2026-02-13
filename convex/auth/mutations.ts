import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { checkRateLimit, clearRateLimit } from "./rateLimit";
import { hashPassword, verifyPassword } from "./password";
import type { FunctionReference } from "convex/server";
import { Doc } from "../_generated/dataModel";

const api = require("../_generated/api") as {
  api: {
    auth: {
      actions: {
        sendTwoFactorCodeEmail: unknown;
        sendVerificationEmail: unknown;
        sendPasswordResetEmail: unknown;
      };
    };
    notifications: { actions: { sendSystemNotification: unknown } };
  };
};

const authActions = (api.api as unknown as Record<string, unknown>)[
  "auth/actions"
] as Record<string, unknown>;
const sendTwoFactorCodeEmailRef = authActions[
  "sendTwoFactorCodeEmail"
] as unknown as FunctionReference<"action">;
const sendVerificationEmailRef = authActions[
  "sendVerificationEmail"
] as unknown as FunctionReference<"action">;
const sendPasswordResetEmailRef = authActions[
  "sendPasswordResetEmail"
] as unknown as FunctionReference<"action">;

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const REFRESH_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const TWO_FACTOR_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const TWO_FACTOR_MAX_ATTEMPTS = 5;
const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function generateToken(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function generateTwoFactorCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createSessionForUser(ctx: any, userId: Doc<"users">["_id"]) {
  const now = Date.now();
  const sessionToken = generateToken("token");
  const refreshToken = generateToken("refresh");

  const sessionId = await ctx.db.insert("sessions", {
    userId,
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

  return {
    sessionId,
    sessionToken,
    refreshToken,
    expiresAt: now + SESSION_DURATION_MS,
  };
}

async function createTwoFactorToken(
  ctx: any,
  userId: Doc<"users">["_id"],
  purpose: "signin" | "enable" | "disable"
) {
  const code = generateTwoFactorCode();
  const now = Date.now();
  const tokenId = await ctx.db.insert("twoFactorTokens", {
    userId,
    code,
    purpose,
    expiresAt: now + TWO_FACTOR_EXPIRY_MS,
    attempts: 0,
    createdAt: now,
  });

  return { tokenId, code };
}

async function getActiveUserById(
  ctx: any,
  userId?: Doc<"users">["_id"]
): Promise<Doc<"users"> | null> {
  if (!userId) return null;
  const user = await ctx.db.get(userId);
  if (!user) return null;
  const userDoc = user as Doc<"users">;
  if (userDoc.status !== "active") return null;
  return userDoc;
}

async function getUserBySessionToken(ctx: any, sessionToken: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("sessionToken", sessionToken))
    .first();
  if (!session || !session.isActive || session.expiresAt < Date.now()) {
    throw new Error("Session invalid or expired");
  }
  const user = await ctx.db.get(session.userId);
  if (!user || user.status !== "active") {
    throw new Error("User not found");
  }
  return { session, user: user as Doc<"users"> };
}

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
    profile: v.optional(
      v.object({
        // Client profile fields
        companyName: v.optional(v.string()),
        workEmail: v.optional(v.string()),
        phoneNumber: v.optional(v.string()),
        companyWebsite: v.optional(v.string()),
        country: v.optional(v.string()),
        // Freelancer profile fields
        techField: v.optional(
          v.union(
            v.literal("development"),
            v.literal("data_science"),
            v.literal("technical_writing"),
            v.literal("design"),
            v.literal("other"),
            v.literal("software_development"),
            v.literal("ui_ux_design"),
            v.literal("data_analytics"),
            v.literal("devops_cloud"),
            v.literal("cybersecurity_it"),
            v.literal("ai_ml_blockchain"),
            v.literal("qa_testing")
          )
        ),
        experienceLevel: v.optional(
          v.union(
            v.literal("junior"),
            v.literal("mid"),
            v.literal("senior"),
            v.literal("expert")
          )
        ),
        skills: v.optional(v.array(v.string())),
        languagesWritten: v.optional(v.array(v.string())),
      })
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
      twoFactorEnabled: false,
      twoFactorMethod: undefined,
      notificationPreferences: {
        email: true,
        push: true,
        inApp: true,
      },
      role: args.role,
      status: "active",
      profile: args.profile || undefined,
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

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [userId],
      title: "Welcome to 49GIG",
      message: "Your account is ready. Complete your setup to get started.",
      type: "account",
      data: { userId },
    });
    // Clear rate limit on successful signup
    clearRateLimit(`signup:${args.email}`);

    const now = Date.now();
    const verificationCode = generateTwoFactorCode();
    await ctx.db.insert("emailVerificationTokens", {
      userId,
      token: verificationCode,
      expiresAt: now + EMAIL_VERIFICATION_EXPIRY_MS,
      createdAt: now,
    });
    await ctx.scheduler.runAfter(0, sendVerificationEmailRef, {
      userId,
      email: args.email,
      name: args.name,
      code: verificationCode,
    });

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
      if (user.status === "deleted") {
        throw new Error("This account has been removed. If you believe this is an error, please contact support.");
      }
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

    if (user.twoFactorEnabled) {
      const sendTwoFactorCodeEmail = sendTwoFactorCodeEmailRef;
      const { tokenId, code } = await createTwoFactorToken(
        ctx,
        user._id,
        "signin"
      );

      await ctx.scheduler.runAfter(0, sendTwoFactorCodeEmail, {
        email: user.email,
        name: user.name,
        code,
        purpose: "sign in",
      });

      return {
        success: true,
        requiresTwoFactor: true,
        twoFactorTokenId: tokenId,
      };
    }

    const session = await createSessionForUser(ctx, user._id);

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
    const now = Date.now();
    const resetToken = generateToken("reset");
    const resetTokenExpiry = now + PASSWORD_RESET_EXPIRY_MS;

    const existingTokens = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const token of existingTokens) {
      if (!token.usedAt) {
        await ctx.db.patch(token._id, { usedAt: now });
      }
    }

    await ctx.db.insert("passwordResetTokens", {
      userId: user._id,
      token: resetToken,
      expiresAt: resetTokenExpiry,
      createdAt: now,
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

    await ctx.scheduler.runAfter(0, sendPasswordResetEmailRef, {
      email: user.email,
      resetToken,
      name: user.name,
    });

    return { success: true };
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

    const tokenDoc = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!tokenDoc || tokenDoc.userId !== user._id) {
      throw new Error("Invalid reset token");
    }
    if (tokenDoc.usedAt) {
      throw new Error("Reset token already used");
    }
    if (tokenDoc.expiresAt < Date.now()) {
      throw new Error("Reset token expired");
    }

    // Hash new password using bcrypt (synchronous)
    const passwordHash = hashPassword(args.newPassword);

    // Update password
    await ctx.db.patch(user._id, {
      passwordHash: passwordHash,
      updatedAt: Date.now(),
    });
    await ctx.db.patch(tokenDoc._id, {
      usedAt: Date.now(),
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
 * Verify email address (6-digit code)
 */
export const verifyEmail = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const code = args.code.trim();
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      throw new Error("Invalid verification code");
    }
    const tokenDoc = await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_token", (q) => q.eq("token", code))
      .first();
    if (!tokenDoc) {
      throw new Error("Invalid verification code");
    }
    if (tokenDoc.usedAt) {
      throw new Error("Verification code already used");
    }
    if (tokenDoc.expiresAt < Date.now()) {
      throw new Error("Verification code expired. Please request a new one.");
    }

    const user = await ctx.db.get(tokenDoc.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.emailVerified) {
      await ctx.db.patch(user._id, {
        emailVerified: true,
        updatedAt: Date.now(),
      });
    }
    await ctx.db.patch(tokenDoc._id, {
      usedAt: Date.now(),
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
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let user: Doc<"users"> | null = null;
    if (identity?.email) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
    } else if (args.sessionToken) {
      const sessionData = await getUserBySessionToken(ctx, args.sessionToken);
      user = sessionData.user;
    }

    if (!user) {
      throw new Error("User not found");
    }

    if (user.emailVerified) {
      throw new Error("Email already verified");
    }

    const now = Date.now();
    const existingTokens = await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const token of existingTokens) {
      if (!token.usedAt) {
        await ctx.db.patch(token._id, { usedAt: now });
      }
    }

    const verificationCode = generateTwoFactorCode();
    await ctx.db.insert("emailVerificationTokens", {
      userId: user._id,
      token: verificationCode,
      expiresAt: now + EMAIL_VERIFICATION_EXPIRY_MS,
      createdAt: now,
    });
    await ctx.scheduler.runAfter(0, sendVerificationEmailRef, {
      userId: user._id,
      email: user.email,
      name: user.name,
      code: verificationCode,
    });

    return { success: true };
  },
});

/**
 * Change password (email auth only)
 */
export const changePassword = mutation({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getActiveUserById(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    if (user.authProvider !== "email" || !user.passwordHash) {
      throw new Error("Password change is only available for email accounts");
    }

    if (args.newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    const isValid = verifyPassword(args.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error("Current password is incorrect");
    }

    const passwordHash = hashPassword(args.newPassword);
    await ctx.db.patch(user._id, {
      passwordHash,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      action: "password_changed",
      actionType: "auth",
      actorId: user._id,
      actorRole: user.role,
      targetType: "user",
      targetId: user._id,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Two-factor: request enable
 */
export const requestTwoFactorEnable = mutation({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await getActiveUserById(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    if (user.twoFactorEnabled) {
      throw new Error("Two-factor authentication is already enabled");
    }

    const sendTwoFactorCodeEmail = sendTwoFactorCodeEmailRef;
    const { tokenId, code } = await createTwoFactorToken(
      ctx,
      user._id,
      "enable"
    );

    await ctx.scheduler.runAfter(0, sendTwoFactorCodeEmail, {
      email: user.email,
      name: user.name,
      code,
      purpose: "enable two-factor authentication",
    });

    return { success: true, twoFactorTokenId: tokenId };
  },
});

export const confirmTwoFactorEnable = mutation({
  args: {
    tokenId: v.id("twoFactorTokens"),
    code: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getActiveUserById(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const token = await ctx.db.get(args.tokenId);
    if (!token || token.userId !== user._id || token.purpose !== "enable") {
      throw new Error("Invalid verification code");
    }

    if (token.usedAt || token.expiresAt < Date.now()) {
      throw new Error("Verification code expired");
    }

    if (token.code !== args.code) {
      const attempts = token.attempts + 1;
      await ctx.db.patch(args.tokenId, { attempts });
      if (attempts >= TWO_FACTOR_MAX_ATTEMPTS) {
        await ctx.db.patch(args.tokenId, { usedAt: Date.now() });
      }
      throw new Error("Invalid verification code");
    }

    await ctx.db.patch(args.tokenId, { usedAt: Date.now() });
    await ctx.db.patch(user._id, {
      twoFactorEnabled: true,
      twoFactorMethod: "email",
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      action: "two_factor_enabled",
      actionType: "auth",
      actorId: user._id,
      actorRole: user.role,
      targetType: "user",
      targetId: user._id,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Two-factor: request disable
 */
export const requestTwoFactorDisable = mutation({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await getActiveUserById(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    if (!user.twoFactorEnabled) {
      throw new Error("Two-factor authentication is not enabled");
    }

    const sendTwoFactorCodeEmail = sendTwoFactorCodeEmailRef;
    const { tokenId, code } = await createTwoFactorToken(
      ctx,
      user._id,
      "disable"
    );

    await ctx.scheduler.runAfter(0, sendTwoFactorCodeEmail, {
      email: user.email,
      name: user.name,
      code,
      purpose: "disable two-factor authentication",
    });

    return { success: true, twoFactorTokenId: tokenId };
  },
});

export const confirmTwoFactorDisable = mutation({
  args: {
    tokenId: v.id("twoFactorTokens"),
    code: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getActiveUserById(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const token = await ctx.db.get(args.tokenId);
    if (!token || token.userId !== user._id || token.purpose !== "disable") {
      throw new Error("Invalid verification code");
    }

    if (token.usedAt || token.expiresAt < Date.now()) {
      throw new Error("Verification code expired");
    }

    if (token.code !== args.code) {
      const attempts = token.attempts + 1;
      await ctx.db.patch(args.tokenId, { attempts });
      if (attempts >= TWO_FACTOR_MAX_ATTEMPTS) {
        await ctx.db.patch(args.tokenId, { usedAt: Date.now() });
      }
      throw new Error("Invalid verification code");
    }

    await ctx.db.patch(args.tokenId, { usedAt: Date.now() });
    await ctx.db.patch(user._id, {
      twoFactorEnabled: false,
      twoFactorMethod: undefined,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      action: "two_factor_disabled",
      actionType: "auth",
      actorId: user._id,
      actorRole: user.role,
      targetType: "user",
      targetId: user._id,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Verify two-factor code and create session
 */
export const verifyTwoFactorSignin = mutation({
  args: {
    tokenId: v.id("twoFactorTokens"),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const token = await ctx.db.get(args.tokenId);
    if (!token || token.purpose !== "signin") {
      throw new Error("Invalid verification code");
    }

    if (token.usedAt || token.expiresAt < Date.now()) {
      throw new Error("Verification code expired");
    }

    if (token.code !== args.code) {
      const attempts = token.attempts + 1;
      await ctx.db.patch(args.tokenId, { attempts });
      if (attempts >= TWO_FACTOR_MAX_ATTEMPTS) {
        await ctx.db.patch(args.tokenId, { usedAt: Date.now() });
      }
      throw new Error("Invalid verification code");
    }

    const user = await ctx.db.get(token.userId);
    if (!user || user.status !== "active") {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.tokenId, { usedAt: Date.now() });
    const session = await createSessionForUser(ctx, user._id);

    await ctx.db.insert("auditLogs", {
      action: "login_success",
      actionType: "auth",
      actorId: user._id,
      actorRole: user.role,
      targetType: "user",
      targetId: user._id,
      details: {
        email: user.email,
        sessionId: session.sessionId,
      },
      createdAt: Date.now(),
    });

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
 * Revoke a specific session by ID
 */
export const revokeSessionById = mutation({
  args: {
    sessionToken: v.string(),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const { user } = await getUserBySessionToken(ctx, args.sessionToken);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Session not found");
    }

    await ctx.db.patch(session._id, {
      isActive: false,
      revokedAt: Date.now(),
      revokedReason: "user_logout",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Revoke all other sessions
 */
export const revokeOtherSessions = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, session } = await getUserBySessionToken(ctx, args.sessionToken);
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    const now = Date.now();
    for (const s of sessions) {
      if (s._id === session._id) continue;
      if (!s.isActive) continue;
      await ctx.db.patch(s._id, {
        isActive: false,
        revokedAt: now,
        revokedReason: "user_logout_other_sessions",
        updatedAt: now,
      });
    }

    return { success: true };
  },
});
