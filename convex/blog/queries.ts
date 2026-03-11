import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";

/**
 * List published blog posts for marketing (newest first)
 */
export const listPublished = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 24, 50);
    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_published", (q) => q.eq("status", "published"))
      .order("desc")
      .take(limit + 1);
    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1]?._id : null;
    const withBanner = await Promise.all(
      items.map(async (p) => {
        const bannerUrl = p.bannerImageId ? await ctx.storage.getUrl(p.bannerImageId) : null;
        const author = p.authorId ? await ctx.db.get(p.authorId) : null;
        return {
          ...p,
          bannerUrl,
          authorName: author?.name ?? null,
        };
      })
    );
    return {
      posts: withBanner,
      nextCursor: nextCursor ?? undefined,
      hasMore,
    };
  },
});

/**
 * Get a single published post by slug (public)
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!post || post.status !== "published") return null;
    const author = post.authorId ? await ctx.db.get(post.authorId) : null;
    const bannerUrl = post.bannerImageId
      ? await ctx.storage.getUrl(post.bannerImageId)
      : null;
    return {
      ...post,
      author: author
        ? { _id: author._id, name: author.name, imageUrl: (author as any).profile?.imageUrl }
        : null,
      bannerUrl,
    };
  },
});

/**
 * List all posts for admin/moderator (including drafts)
 */
export const listAllForAdmin = query({
  args: {
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await getCurrentUser(ctx);
    if (!user || ((user as Doc<"users">).role !== "admin" && (user as Doc<"users">).role !== "moderator"))
      return [];
    const limit = Math.min(args.limit ?? 50, 100);
    return await ctx.db
      .query("blogPosts")
      .withIndex("by_created")
      .order("desc")
      .take(limit);
  },
});

/**
 * Get single post by id for edit (admin/moderator)
 */
export const getByIdForEdit = query({
  args: {
    postId: v.id("blogPosts"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await getCurrentUser(ctx);
    if (!user || ((user as Doc<"users">).role !== "admin" && (user as Doc<"users">).role !== "moderator"))
      return null;
    const post = await ctx.db.get(args.postId);
    if (!post) return null;
    const bannerUrl = post.bannerImageId
      ? await ctx.storage.getUrl(post.bannerImageId)
      : null;
    return { ...post, bannerUrl };
  },
});

/**
 * Get all comments for a post (flat list; build nested tree on client using parentId)
 */
export const getCommentsForPost = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("blogComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .order("asc")
      .collect();
    const authorIds = [...new Set(comments.map((c) => c.authorId).filter(Boolean))] as Doc<"users">["_id"][];
    const authors = new Map<string, { name: string; imageUrl?: string }>();
    for (const id of authorIds) {
      const u = await ctx.db.get(id);
      if (u)
        authors.set(id, {
          name: u.name,
          imageUrl: (u as any).profile?.imageUrl,
        });
    }
    return comments.map((c) => ({
      ...c,
      authorDisplayName: c.authorId ? authors.get(c.authorId)?.name : c.authorName ?? "Anonymous",
    }));
  },
});

/**
 * Get public URL for a storage file (for editor image preview / rendered content)
 */
export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * All published post slugs (for sitemap / SEO)
 */
export const getAllPublishedSlugs = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("blogPosts")
      .withIndex("by_published", (q) => q.eq("status", "published"))
      .order("desc")
      .collect();
    return posts.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt }));
  },
});

/**
 * Get like count and whether current user liked (for public post page)
 */
export const getLikeCountAndUserLiked = query({
  args: {
    postId: v.id("blogPosts"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("blogPostLikes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    const count = likes.length;
    const userLiked =
      args.userId != null
        ? likes.some((l) => l.userId === args.userId)
        : false;
    return { count, userLiked };
  },
});
