import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

/** Action helpers: resolve the active Convex Auth user row by JWT email. */
export const getActiveUserByEmailInternal = internalQuery({
  args: {
    email: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      email: v.string(),
      emailVerified: v.boolean(),
      name: v.string(),
      role: v.union(
        v.literal("client"),
        v.literal("freelancer"),
        v.literal("moderator"),
        v.literal("admin")
      ),
      status: v.union(
        v.literal("active"),
        v.literal("suspended"),
        v.literal("deleted")
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.trim()))
      .first();
    if (!user || user.status !== "active") {
      return null;
    }
    return {
      _id: user._id,
      email: user.email,
      emailVerified: user.emailVerified,
      name: user.name,
      role: user.role,
      status: user.status,
    };
  },
});

/** Session-token clients pass `viewerUserId` into actions; resolve the active row by id (same shape as email lookup). */
export const getActiveUserByIdInternal = internalQuery({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      email: v.string(),
      emailVerified: v.boolean(),
      name: v.string(),
      role: v.union(
        v.literal("client"),
        v.literal("freelancer"),
        v.literal("moderator"),
        v.literal("admin")
      ),
      status: v.union(
        v.literal("active"),
        v.literal("suspended"),
        v.literal("deleted")
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.status !== "active") {
      return null;
    }
    return {
      _id: user._id,
      email: user.email,
      emailVerified: user.emailVerified,
      name: user.name,
      role: user.role,
      status: user.status,
    };
  },
});
