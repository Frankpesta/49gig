import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Update user profile
 */
export const updateProfile = mutation({
  args: {
    profile: v.object({
      name: v.optional(v.string()),
      companyName: v.optional(v.string()),
      companySize: v.optional(v.string()),
      industry: v.optional(v.string()),
      bio: v.optional(v.string()),
      skills: v.optional(v.array(v.string())),
      hourlyRate: v.optional(v.number()),
      availability: v.optional(
        v.union(
          v.literal("available"),
          v.literal("busy"),
          v.literal("unavailable")
        )
      ),
      timezone: v.optional(v.string()),
      portfolioUrl: v.optional(v.string()),
    }),
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

    if (!user || user.status !== "active") {
      throw new Error("User not found or inactive");
    }

    // Update profile
    const updatedProfile = {
      ...user.profile,
      ...args.profile,
    };

    await ctx.db.patch(user._id, {
      profile: updatedProfile,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

