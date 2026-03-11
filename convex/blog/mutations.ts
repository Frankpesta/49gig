import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function requireAdminOrModerator(ctx: any, userId?: Doc<"users">["_id"]) {
  const user = userId
    ? await ctx.db.get(userId)
    : await getCurrentUser(ctx);
  if (!user || ((user as Doc<"users">).role !== "admin" && (user as Doc<"users">).role !== "moderator"))
    throw new Error("Only admins and moderators can manage blog posts");
  return user as Doc<"users">;
}

/**
 * Create blog post (admin/moderator)
 */
export const create = mutation({
  args: {
    userId: v.optional(v.id("users")),
    title: v.string(),
    slug: v.optional(v.string()),
    excerpt: v.string(),
    content: v.string(),
    bannerImageId: v.optional(v.id("_storage")),
    status: v.union(v.literal("draft"), v.literal("published")),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAdminOrModerator(ctx, args.userId);
    const slug = args.slug?.trim() ? slugify(args.slug) : slugify(args.title);
    const existing = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) throw new Error("A post with this slug already exists");
    const now = Date.now();
    const publishedAt = args.status === "published" ? now : undefined;
    return await ctx.db.insert("blogPosts", {
      title: args.title,
      slug,
      excerpt: args.excerpt,
      content: args.content,
      bannerImageId: args.bannerImageId,
      authorId: user._id,
      status: args.status,
      publishedAt,
      metaTitle: args.metaTitle,
      metaDescription: args.metaDescription,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update blog post (admin/moderator)
 */
export const update = mutation({
  args: {
    userId: v.optional(v.id("users")),
    postId: v.id("blogPosts"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    bannerImageId: v.optional(v.id("_storage")),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdminOrModerator(ctx, args.userId);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    const now = Date.now();
    const updates: Partial<Doc<"blogPosts">> = {
      updatedAt: now,
    };
    if (args.title !== undefined) updates.title = args.title;
    if (args.slug !== undefined) {
      const newSlug = args.slug.trim() ? slugify(args.slug) : slugify(post.title);
      const existing = await ctx.db
        .query("blogPosts")
        .withIndex("by_slug", (q) => q.eq("slug", newSlug))
        .first();
      if (existing && existing._id !== args.postId)
        throw new Error("A post with this slug already exists");
      updates.slug = newSlug;
    }
    if (args.excerpt !== undefined) updates.excerpt = args.excerpt;
    if (args.content !== undefined) updates.content = args.content;
    if (args.bannerImageId !== undefined) updates.bannerImageId = args.bannerImageId;
    if (args.metaTitle !== undefined) updates.metaTitle = args.metaTitle;
    if (args.metaDescription !== undefined) updates.metaDescription = args.metaDescription;
    if (args.status !== undefined) {
      updates.status = args.status;
      if (args.status === "published" && !post.publishedAt)
        updates.publishedAt = now;
    }
    await ctx.db.patch(args.postId, updates);
    return args.postId;
  },
});

/**
 * Delete blog post (admin/moderator). Also remove comments and likes.
 */
export const remove = mutation({
  args: {
    userId: v.optional(v.id("users")),
    postId: v.id("blogPosts"),
  },
  handler: async (ctx, args) => {
    await requireAdminOrModerator(ctx, args.userId);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    const comments = await ctx.db
      .query("blogComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const c of comments) await ctx.db.delete(c._id);
    const likes = await ctx.db
      .query("blogPostLikes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const l of likes) await ctx.db.delete(l._id);
    await ctx.db.delete(args.postId);
    return { success: true };
  },
});

/**
 * Add comment (anyone: logged-in or anonymous with name/email)
 */
export const createComment = mutation({
  args: {
    postId: v.id("blogPosts"),
    parentId: v.optional(v.id("blogComments")),
    userId: v.optional(v.id("users")),
    authorName: v.optional(v.string()),
    authorEmail: v.optional(v.string()),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post || post.status !== "published") throw new Error("Post not found");
    if (!args.content?.trim()) throw new Error("Comment content is required");
    if (!args.userId && !args.authorName?.trim())
      throw new Error("Please provide your name or sign in");
    const now = Date.now();
    return await ctx.db.insert("blogComments", {
      postId: args.postId,
      parentId: args.parentId,
      authorId: args.userId,
      authorName: args.authorName?.trim() || undefined,
      authorEmail: args.authorEmail?.trim() || undefined,
      content: args.content.trim(),
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update own comment (author or admin/moderator)
 */
export const updateComment = mutation({
  args: {
    commentId: v.id("blogComments"),
    userId: v.optional(v.id("users")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    const user = args.userId ? await ctx.db.get(args.userId) : await getCurrentUser(ctx);
    const isAuthor = comment.authorId && user && comment.authorId === user._id;
    const isStaff = user && ((user as Doc<"users">).role === "admin" || (user as Doc<"users">).role === "moderator");
    if (!isAuthor && !isStaff) throw new Error("Not authorized to edit this comment");
    if (!args.content?.trim()) throw new Error("Content is required");
    await ctx.db.patch(args.commentId, {
      content: args.content.trim(),
      updatedAt: Date.now(),
    });
    return args.commentId;
  },
});

/**
 * Delete comment (author or admin/moderator)
 */
export const deleteComment = mutation({
  args: {
    commentId: v.id("blogComments"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    const user = args.userId ? await ctx.db.get(args.userId) : await getCurrentUser(ctx);
    const isAuthor = comment.authorId && user && comment.authorId === user._id;
    const isStaff = user && ((user as Doc<"users">).role === "admin" || (user as Doc<"users">).role === "moderator");
    if (!isAuthor && !isStaff) throw new Error("Not authorized to delete this comment");
    // Delete replies first
    const replies = await ctx.db
      .query("blogComments")
      .withIndex("by_parent", (q) => q.eq("parentId", args.commentId))
      .collect();
    for (const r of replies) await ctx.db.delete(r._id);
    await ctx.db.delete(args.commentId);
    return { success: true };
  },
});

/**
 * Toggle love (logged-in only, tracked). Returns new count and whether user liked.
 */
export const toggleLike = mutation({
  args: {
    postId: v.id("blogPosts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post || post.status !== "published") throw new Error("Post not found");
    const user = await ctx.db.get(args.userId);
    if (!user || (user as Doc<"users">).status !== "active")
      throw new Error("You must be signed in to like");
    const existing = await ctx.db
      .query("blogPostLikes")
      .withIndex("by_post_user", (q) =>
        q.eq("postId", args.postId).eq("userId", args.userId)
      )
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.delete(existing._id);
      const remaining = await ctx.db
        .query("blogPostLikes")
        .withIndex("by_post", (q) => q.eq("postId", args.postId))
        .collect();
      return { count: remaining.length, userLiked: false };
    }
    await ctx.db.insert("blogPostLikes", {
      postId: args.postId,
      userId: args.userId,
      createdAt: now,
    });
    const all = await ctx.db
      .query("blogPostLikes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    return { count: all.length, userLiked: true };
  },
});

/**
 * Generate upload URL for blog images (banner / inline). Admin/moderator only.
 */
export const generateUploadUrl = mutation({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    await requireAdminOrModerator(ctx, args.userId);
    return await ctx.storage.generateUploadUrl();
  },
});
