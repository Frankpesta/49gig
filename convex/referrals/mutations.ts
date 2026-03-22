import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { ensureUserReferralCode } from "./helpers";

/** Assign a share code if missing (idempotent). */
export const ensureMyReferralCode = mutation({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await getCurrentUser(ctx);
    if (!user || user.status !== "active") {
      throw new Error("Not authenticated");
    }
    const code = await ensureUserReferralCode(ctx, user._id);
    return { referralCode: code };
  },
});
