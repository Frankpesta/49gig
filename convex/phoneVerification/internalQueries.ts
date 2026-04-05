import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

/** Validates session + freelancer role for Twilio Verify actions (session-token auth). */
export const assertFreelancerPhoneVerificationSession = internalQuery({
  args: {
    userId: v.id("users"),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session?.isActive || session.expiresAt < now || session.revokedAt) {
      return false;
    }
    if (session.userId !== args.userId) return false;
    const user = await ctx.db.get(args.userId);
    if (!user || user.status !== "active" || user.role !== "freelancer") {
      return false;
    }
    return true;
  },
});
