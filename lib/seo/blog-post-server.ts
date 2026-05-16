import { cache } from "react";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

/** Convex public post shape from `blog.queries.getBySlug`. */
export type BlogPostPublic = Record<string, unknown> & {
  title: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  bannerUrl?: string | null;
  publishedAt?: number | null;
  updatedAt?: number;
  author?: { name?: string; imageUrl?: string | null } | null;
};

/** Dedupes Convex calls between `generateMetadata` and the `[slug]` layout JSON-LD. */
export const fetchPublishedBlogPostBySlug = cache(async (slug: string) => {
  try {
    return (await fetchQuery((api as any).blog.queries.getBySlug, {
      slug,
    })) as BlogPostPublic | null;
  } catch {
    return null;
  }
});
