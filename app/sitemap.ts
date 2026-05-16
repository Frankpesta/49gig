import type { MetadataRoute } from "next";
import { fetchPublishedBlogSlugs } from "@/lib/sitemap-convex-blog";
import { absoluteUrl, getCanonicalSiteUrl } from "@/lib/seo/site-url";

const baseUrl = getCanonicalSiteUrl();

const staticRoutes: MetadataRoute.Sitemap = [
  { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
  { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  { url: `${baseUrl}/for-clients`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${baseUrl}/for-freelancers`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${baseUrl}/hire-talent`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${baseUrl}/hire-team`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${baseUrl}/how-it-works`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  { url: `${baseUrl}/talent-categories`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  { url: `${baseUrl}/use-cases`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  { url: `${baseUrl}/why-49gig`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${baseUrl}/rss.xml`, lastModified: new Date(), changeFrequency: "daily", priority: 0.55 },
  { url: `${baseUrl}/legal/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  { url: `${baseUrl}/legal/privacy-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  { url: `${baseUrl}/legal/cookie-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  { url: `${baseUrl}/legal/refund-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  { url: `${baseUrl}/legal/code-of-conduct`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  { url: `${baseUrl}/legal/client-agreement`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  { url: `${baseUrl}/legal/freelancer-agreement`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  { url: `${baseUrl}/legal/payment-terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
];

type SitemapEntry = MetadataRoute.Sitemap[number] & {
  images?: string[];
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let entries: Array<{ slug: string; updatedAt: number; bannerUrl: string | null }> = [];
  try {
    entries = await fetchPublishedBlogSlugs();
  } catch {
    //
  }

  const blogUrls: MetadataRoute.Sitemap = entries.map((p): SitemapEntry => ({
    url: `${baseUrl}/blog/${encodeURIComponent(p.slug)}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "weekly",
    priority: 0.75,
    ...(p.bannerUrl ? { images: [absoluteUrl(p.bannerUrl)] } : {}),
  }));

  return [...staticRoutes, ...blogUrls];
}
