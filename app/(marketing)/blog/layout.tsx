import type { Metadata } from "next";
import { getCanonicalSiteUrl, absoluteUrl } from "@/lib/seo/site-url";
import { SITE_TWITTER_CREATOR, SITE_TWITTER_SITE } from "@/lib/seo/social";

const origin = getCanonicalSiteUrl();

export const metadata: Metadata = {
  title: "Blog | 49GIG",
  description:
    "Insights, updates, and stories from the 49GIG team and our community — a high-trust freelance platform connecting global teams with verified African tech talent.",
  openGraph: {
    title: "Blog | 49GIG",
    description:
      "Insights, updates, and stories from the 49GIG team and community of clients and freelancers.",
    type: "website",
    url: `${origin}/blog`,
    siteName: "49GIG",
    locale: "en_US",
    images: [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630, alt: "49GIG Blog" }],
  },
  twitter: {
    card: "summary_large_image",
    creator: SITE_TWITTER_CREATOR,
    site: SITE_TWITTER_SITE,
    title: "Blog | 49GIG",
    description:
      "Insights, updates, and stories from the 49GIG team and our community.",
    images: [absoluteUrl("/opengraph-image")],
  },
  alternates: {
    canonical: `${origin}/blog`,
    types: {
      "application/rss+xml": `${origin}/rss.xml`,
    },
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
