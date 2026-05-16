/**
 * Isolated from app/sitemap.ts so Next's typecheck does not hit "excessively deep"
 * instantiation on the generated Convex api + fetchQuery combo.
 */
// @ts-nocheck
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export type BlogSitemapEntry = {
  slug: string;
  updatedAt: number;
  bannerUrl: string | null;
};

export async function fetchPublishedBlogSlugs(): Promise<BlogSitemapEntry[]> {
  return (await fetchQuery(api.blog.queries.getAllPublishedSlugs, {})) as BlogSitemapEntry[];
}
