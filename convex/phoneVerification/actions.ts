"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";

// Convex TS2589: typed `internal` import blows TS instantiation depth in "use node" actions.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const internalLoose = require("../_generated/api").internal as {
  phoneVerification: { internalQueries: { assertFreelancerPhoneVerificationSession: unknown } };
  users: { mutations: { setFreelancerVerifiedPhoneInternal: unknown } };
};

const E164_RE = /^\+[1-9]\d{6,14}$/;

async function twilioVerifyFormPost(
  serviceSid: string,
  path: string,
  body: Record<string, string>
): Promise<Record<string, unknown>> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error(
      "Phone verification is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in the Convex environment."
    );
  }
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const url = `https://verify.twilio.com/v2/Services/${serviceSid}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      typeof json.message === "string"
        ? json.message
        : typeof json.error_message === "string"
          ? json.error_message
          : res.statusText;
    throw new Error(msg || "SMS verification request failed");
  }
  return json;
}

function getVerifyServiceSid(): string {
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!serviceSid?.trim()) {
    throw new Error(
      "Set TWILIO_VERIFY_SERVICE_SID in the Convex environment (Twilio Console → Verify → Services)."
    );
  }
  return serviceSid.trim();
}

/**
 * Send an SMS verification code via Twilio Verify (works for any sign-in method once a session exists).
 */
export const startPhoneVerification = action({
  args: {
    userId: v.id("users"),
    sessionToken: v.string(),
    phoneE164: v.string(),
  },
  handler: async (ctx, args) => {
    const allowed = (await ctx.runQuery(
      internalLoose.phoneVerification.internalQueries.assertFreelancerPhoneVerificationSession as any,
      {
        userId: args.userId,
        sessionToken: args.sessionToken,
      }
    )) as boolean;
    if (!allowed) {
      throw new Error("Not authorized. Sign in again and ensure you are on a freelancer account.");
    }

    const trimmed = args.phoneE164.trim();
    if (!E164_RE.test(trimmed)) {
      throw new Error(
        "Use international format with country code, e.g. +2348012345678 (no spaces)."
      );
    }

    const serviceSid = getVerifyServiceSid();
    await twilioVerifyFormPost(serviceSid, "/Verifications", {
      To: trimmed,
      Channel: "sms",
    });

    return { success: true as const };
  },
});

/**
 * Confirm the SMS code and store verified phone on the user.
 */
export const confirmPhoneVerificationCode = action({
  args: {
    userId: v.id("users"),
    sessionToken: v.string(),
    phoneE164: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const allowed = (await ctx.runQuery(
      internalLoose.phoneVerification.internalQueries.assertFreelancerPhoneVerificationSession as any,
      {
        userId: args.userId,
        sessionToken: args.sessionToken,
      }
    )) as boolean;
    if (!allowed) {
      throw new Error("Not authorized. Sign in again and ensure you are on a freelancer account.");
    }

    const trimmed = args.phoneE164.trim();
    if (!E164_RE.test(trimmed)) {
      throw new Error("Invalid phone number format.");
    }

    const code = args.code.replace(/\s/g, "");
    if (!/^\d{4,10}$/.test(code)) {
      throw new Error("Enter the verification code from your SMS.");
    }

    const serviceSid = getVerifyServiceSid();
    const result = await twilioVerifyFormPost(serviceSid, "/VerificationCheck", {
      To: trimmed,
      Code: code,
    });

    const status = String(result.status ?? "");
    if (status !== "approved") {
      throw new Error("Invalid or expired code. Request a new code and try again.");
    }

    await ctx.runMutation(
      internalLoose.users.mutations.setFreelancerVerifiedPhoneInternal as any,
      {
        userId: args.userId,
        phoneE164: trimmed,
      }
    );

    return { success: true as const };
  },
});
