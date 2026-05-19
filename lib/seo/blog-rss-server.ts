/**
 * Isolated from app/rss.xml/route.ts so Next's typecheck does not hit "excessively deep"
 * instantiation on the generated Convex api + fetchQuery combo.
 */
// @ts-nocheck
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export type BlogRssPost = {
  slug: string;
  title: string;
  excerpt?: string;
  publishedAt: number;
  updatedAt?: number;
  bannerUrl?: string | null;
};

export async function fetchPublishedBlogPostsForRss(
  limit = 50,
): Promise<BlogRssPost[]> {
  const data = await fetchQuery(api.blog.queries.listPublished, { limit });
  const posts = (data as { posts?: BlogRssPost[] })?.posts ?? [];
  return posts.filter(
    (p): p is BlogRssPost =>
      Boolean(p.slug && p.title && p.publishedAt != null),
  );
}
