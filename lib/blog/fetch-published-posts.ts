/**
 * Isolated from the listing page so Next's typecheck does not hit "excessively deep"
 * instantiation on the generated Convex api + fetchQuery combo (mirrors lib/sitemap-convex-blog.ts).
 */
// @ts-nocheck
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export type BlogListingEntry = {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt?: number;
  bannerUrl: string | null;
  authorName: string | null;
};

export async function fetchPublishedBlogPosts(limit = 24): Promise<BlogListingEntry[]> {
  const result = await fetchQuery(api.blog.queries.listPublished, { limit });
  return (result?.posts ?? []) as BlogListingEntry[];
}
