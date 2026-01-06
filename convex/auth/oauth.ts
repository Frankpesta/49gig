import { action, mutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Google OAuth Configuration
 * These should be set as environment variables in Convex dashboard
 */
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "";

/**
 * Generate Google OAuth authorization URL
 */
export const getGoogleAuthUrl = action({
  args: {
    state: v.optional(v.string()), // CSRF protection
    role: v.optional(v.union(v.literal("client"), v.literal("freelancer"))),
  },
  handler: async (ctx, args) => {
    const state = args.state || `state_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const role = args.role || "client";

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
      state: `${state}:${role}`, // Include role in state for signup flow
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return {
      authUrl,
      state,
    };
  },
});

/**
 * Exchange OAuth code for access token and get user info
 */
export const handleGoogleCallback = action({
  args: {
    code: v.string(),
    state: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    needsRoleSelection?: boolean;
    oauthData?: {
      email: string;
      name: string;
      googleId: string;
      picture?: string;
      emailVerified: boolean;
    };
    userId: any;
    sessionToken: string;
    refreshToken: string;
    expiresAt: number;
    isNewUser: boolean;
    userRole: "client" | "freelancer" | "admin" | "moderator";
  }> => {
    // Parse state to get role (if signup) and CSRF token
    const [csrfToken, role] = args.state.split(":");
    const userRole = (role === "client" || role === "freelancer") ? role : "client";

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: args.code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // Get user info from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      throw new Error("Failed to get user info from Google");
    }

    const googleUser = await userInfoResponse.json();

    // Check if user exists first
    const existingUser = await ctx.runMutation(
      (internal as any)["auth/oauth"].checkUserExists,
      {
        email: googleUser.email,
      }
    );

    // If user doesn't exist and no role provided, return needsRoleSelection flag
    if (!existingUser && !role) {
      return {
        success: true,
        needsRoleSelection: true,
        oauthData: {
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split("@")[0],
          googleId: googleUser.id,
          picture: googleUser.picture,
          emailVerified: googleUser.verified_email || false,
        },
        userId: null,
        sessionToken: "",
        refreshToken: "",
        expiresAt: 0,
        isNewUser: true,
        userRole: "client" as const,
      };
    }

    // Create or update user via internal mutation
    const userId: any = await ctx.runMutation(
      (internal as any)["auth/oauth"].createOrUpdateUser,
      {
      email: googleUser.email,
      name: googleUser.name || googleUser.email.split("@")[0],
      googleId: googleUser.id,
      picture: googleUser.picture,
      emailVerified: googleUser.verified_email || false,
      role: existingUser 
        ? (existingUser.role === "client" || existingUser.role === "freelancer" 
            ? existingUser.role 
            : "client")
        : userRole,
    });

    // Create session
    const session: any = await ctx.runMutation(
      (internal as any)["auth/oauth"].createOAuthSession,
      {
      userId,
    });

    // Create audit log
    await ctx.runMutation(
      (internal as any)["auth/oauth"].logOAuthLogin,
      {
      userId,
      provider: "google",
      email: googleUser.email,
    });

    // Get user role - use internal mutation to get user from database
    const userRoleFromDb = await ctx.runMutation(
      (internal as any)["auth/oauth"].getUserRole,
      { userId }
    );

    return {
      success: true,
      needsRoleSelection: false,
      userId,
      sessionToken: session.sessionToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      isNewUser: session.isNewUser,
      userRole: userRoleFromDb || userRole,
    };
  },
});

/**
 * Internal mutation to create or update user from OAuth
 */
export const createOrUpdateUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    googleId: v.string(),
    picture: v.optional(v.string()),
    emailVerified: v.boolean(),
    role: v.union(v.literal("client"), v.literal("freelancer")),
  },
  handler: async (ctx, args) => {
    // Check if user exists by email
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    const now = Date.now();

    if (existingUser) {
      // User exists - link OAuth account
      // Check if already using Google auth
      if (existingUser.authProvider === "google") {
        // Update last login
        await ctx.db.patch(existingUser._id, {
          lastLoginAt: now,
          updatedAt: now,
        });
        return existingUser._id;
      }

      // Link Google account to existing email/password account
      await ctx.db.patch(existingUser._id, {
        authProvider: "google", // Switch to Google auth
        emailVerified: args.emailVerified || existingUser.emailVerified,
        lastLoginAt: now,
        updatedAt: now,
      });

      // Create audit log for account linking
      await ctx.db.insert("auditLogs", {
        action: "oauth_account_linked",
        actionType: "auth",
        actorId: existingUser._id,
        actorRole: existingUser.role,
        targetType: "user",
        targetId: existingUser._id,
        details: {
          email: args.email,
          provider: "google",
          previousProvider: existingUser.authProvider,
        },
        createdAt: now,
      });

      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      emailVerified: args.emailVerified,
      name: args.name,
      authProvider: "google",
      role: args.role,
      status: "active",
      profile: args.picture
        ? {
            // Store profile picture URL if available
            portfolioUrl: args.picture,
          }
        : undefined,
      createdAt: now,
      updatedAt: now,
    });

    // Create audit log for new user signup
    await ctx.db.insert("auditLogs", {
      action: "user_signup_oauth",
      actionType: "auth",
      actorId: userId,
      actorRole: args.role,
      targetType: "user",
      targetId: userId,
      details: {
        email: args.email,
        provider: "google",
      },
      createdAt: now,
    });

    return userId;
  },
});

/**
 * Internal mutation to check if user exists by email
 */
export const checkUserExists = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    return user ? { _id: user._id, role: user.role } : null;
  },
});

/**
 * Internal mutation to get user role by userId
 */
export const getUserRole = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.role || null;
  },
});

/**
 * Complete OAuth signup with selected role
 */
export const completeOAuthSignup = action({
  args: {
    oauthData: v.object({
      email: v.string(),
      name: v.string(),
      googleId: v.string(),
      picture: v.optional(v.string()),
      emailVerified: v.boolean(),
    }),
    role: v.union(v.literal("client"), v.literal("freelancer")),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    userId: any;
    sessionToken: string;
    refreshToken: string;
    expiresAt: number;
    isNewUser: boolean;
    userRole: "client" | "freelancer";
  }> => {
    // Check if user was created in the meantime
    const existingUser = await ctx.runMutation(
      (internal as any)["auth/oauth"].checkUserExists,
      {
        email: args.oauthData.email,
      }
    );

    if (existingUser) {
      // User already exists, create session and return
      const session: any = await ctx.runMutation(
        (internal as any)["auth/oauth"].createOAuthSession,
        {
          userId: existingUser._id,
        }
      );

      return {
        success: true,
        userId: existingUser._id,
        sessionToken: session.sessionToken,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt,
        isNewUser: false,
        userRole: (existingUser.role === "client" || existingUser.role === "freelancer" 
          ? existingUser.role 
          : "client") as "client" | "freelancer",
      };
    }

    // Create new user with selected role
    const userId: any = await ctx.runMutation(
      (internal as any)["auth/oauth"].createOrUpdateUser,
      {
        email: args.oauthData.email,
        name: args.oauthData.name,
        googleId: args.oauthData.googleId,
        picture: args.oauthData.picture,
        emailVerified: args.oauthData.emailVerified,
        role: args.role,
      }
    );

    // Create session
    const session: any = await ctx.runMutation(
      (internal as any)["auth/oauth"].createOAuthSession,
      {
        userId,
      }
    );

    // Create audit log
    await ctx.runMutation(
      (internal as any)["auth/oauth"].logOAuthLogin,
      {
        userId,
        provider: "google",
        email: args.oauthData.email,
      }
    );

    return {
      success: true,
      userId,
      sessionToken: session.sessionToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
      isNewUser: true,
      userRole: args.role,
    };
  },
});

/**
 * Internal mutation to create session for OAuth user
 */
export const createOAuthSession = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const sessionToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const refreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
    const REFRESH_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

    const sessionId = await ctx.db.insert("sessions", {
      userId: args.userId,
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

    // Check if this is a new user (created in last 5 seconds)
    const isNewUser = user.createdAt > now - 5000;

    return {
      sessionId,
      sessionToken,
      refreshToken,
      expiresAt: now + SESSION_DURATION_MS,
      isNewUser,
    };
  },
});

/**
 * Internal mutation to log OAuth login
 */
export const logOAuthLogin = mutation({
  args: {
    userId: v.id("users"),
    provider: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return;
    }

    await ctx.db.insert("auditLogs", {
      action: "login_success_oauth",
      actionType: "auth",
      actorId: args.userId,
      actorRole: user.role,
      targetType: "user",
      targetId: args.userId,
      details: {
        email: args.email,
        provider: args.provider,
      },
      createdAt: Date.now(),
    });
  },
});
