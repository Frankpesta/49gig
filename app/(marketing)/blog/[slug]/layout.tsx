import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "https://49gig.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await fetchQuery((api as any).blog.queries.getBySlug, { slug });
    if (!post) {
      return { title: "Post not found | 49GIG Blog" };
    }
    const title = post.metaTitle || post.title;
    const description = post.metaDescription || post.excerpt || undefined;
    const ogImage = post.bannerUrl ?? undefined;
    return {
      title: `${title} | 49GIG Blog`,
      description,
      openGraph: {
        title,
        description,
        url: `${baseUrl}/blog/${slug}`,
        siteName: "49GIG",
        images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: post.title }] : undefined,
        locale: "en_US",
        type: "article",
        publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ogImage ? [ogImage] : undefined,
      },
      alternates: { canonical: `${baseUrl}/blog/${slug}` },
    };
  } catch {
    return { title: "Blog | 49GIG" };
  }
}

export default function BlogPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
