import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getCanonicalSiteUrl, absoluteUrl } from "@/lib/seo/site-url";

export const revalidate = 1800;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rssDate(ts: number): string {
  return new Date(ts).toUTCString();
}

export async function GET() {
  const baseUrl = getCanonicalSiteUrl();
  try {
    const data = await fetchQuery((api as any).blog.queries.listPublished, { limit: 50 });

    const items = (
      (
        data as {
          posts: Array<{
            slug?: string;
            title?: string;
            excerpt?: string;
            publishedAt?: number;
            updatedAt?: number;
            bannerUrl?: string | null;
          }>;
        }
      )?.posts ?? []
    )
      .filter((p) => p.slug && p.title && p.publishedAt)
      .map((p) => {
        const link = `${baseUrl}/blog/${encodeURIComponent(p.slug!)}`;
        const pub = rssDate(p.publishedAt!);
        const desc = esc((p.excerpt ?? "").slice(0, 500));

        let mediaXml = "";
        if (typeof p.bannerUrl === "string" && p.bannerUrl.trim()) {
          const href = absoluteUrl(p.bannerUrl);
          mediaXml = `
          <media:content url="${esc(href)}" type="image/*" />`;
        }

        return `
    <item>
      <title>${esc(p.title!)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>
      <pubDate>${pub}</pubDate>
      <description>${desc}</description>${mediaXml}
    </item>`;
      })
      .join("\n");

    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>49GIG Blog</title>
    <link>${esc(baseUrl)}/blog</link>
    <description>Stories and updates from the 49GIG high-trust freelance marketplace.</description>
    <language>en-us</language>
    <lastBuildDate>${rssDate(Date.now())}</lastBuildDate>
    <atom:link href="${esc(baseUrl)}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

    return new Response(feed, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
      },
    });
  } catch {
    const emptyFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>49GIG Blog</title><link>${esc(baseUrl)}/blog</link></channel></rss>`;
    return new Response(emptyFeed, {
      headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
    });
  }
}
