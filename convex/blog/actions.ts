import { action } from "../_generated/server";
import { v } from "convex/values";
import { assertRecaptchaToken } from "../recaptchaVerify";

/**
 * Public blog comment (replaces direct createComment mutation for spam control).
 */
export const submitBlogComment = action({
  args: {
    recaptchaToken: v.string(),
    postId: v.id("blogPosts"),
    parentId: v.optional(v.id("blogComments")),
    userId: v.optional(v.id("users")),
    authorName: v.optional(v.string()),
    authorEmail: v.optional(v.string()),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await assertRecaptchaToken(args.recaptchaToken, { expectedAction: "blog_comment" });
    const { recaptchaToken: _t, ...rest } = args;
    const { api } = require("../_generated/api") as any;
    return await ctx.runMutation(api.blog.mutations.createComment, rest);
  },
});

/**
 * Resolve storage ID to public URL (for blog image uploads in editor)
 */
export const getStorageUrl = action({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
