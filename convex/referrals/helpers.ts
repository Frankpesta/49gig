import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

const REFERRAL_CODE_REGEX = /^[A-Z0-9]{6,12}$/;
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function normalizeReferralCode(raw: string | undefined): string | undefined {
  const t = raw?.trim().toUpperCase();
  if (!t || !REFERRAL_CODE_REGEX.test(t)) return undefined;
  return t;
}

export function randomReferralCode(length = 8): string {
  let s = "";
  for (let i = 0; i < length; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]!;
  }
  return s;
}

/**
 * First-touch: only for new clients; immutable once set on the user row.
 */
export async function applyReferralAttributionForNewUser(
  ctx: MutationCtx,
  opts: {
    newUserId: Id<"users">;
    role: "client" | "freelancer";
    referralCode?: string;
  }
): Promise<void> {
  if (opts.role !== "client") return;
  const code = normalizeReferralCode(opts.referralCode);
  if (!code) return;

  const newUser = await ctx.db.get(opts.newUserId);
  if (!newUser || newUser.referredByUserId) return;

  const referrer = await ctx.db
    .query("users")
    .withIndex("by_referral_code", (q) => q.eq("referralCode", code))
    .first();

  if (!referrer || referrer._id === opts.newUserId) return;
  if (referrer.status !== "active") return;

  const now = Date.now();
  await ctx.db.patch(opts.newUserId, {
    referredByUserId: referrer._id,
    referralAttributedAt: now,
    updatedAt: now,
  });
}

export async function ensureUserReferralCode(
  ctx: MutationCtx,
  userId: Id<"users">
): Promise<string> {
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");
  if (user.referralCode) return user.referralCode;

  for (let attempt = 0; attempt < 24; attempt++) {
    const code = randomReferralCode(8);
    const clash = await ctx.db
      .query("users")
      .withIndex("by_referral_code", (q) => q.eq("referralCode", code))
      .first();
    if (!clash) {
      const now = Date.now();
      await ctx.db.patch(userId, { referralCode: code, updatedAt: now });
      return code;
    }
  }
  throw new Error("Could not assign referral code");
}
