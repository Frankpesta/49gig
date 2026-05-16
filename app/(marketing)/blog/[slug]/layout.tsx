import type { Metadata } from "next";
import { fetchPublishedBlogPostBySlug } from "@/lib/seo/blog-post-server";
import { absoluteUrl, getCanonicalSiteUrl } from "@/lib/seo/site-url";
import { SITE_TWITTER_CREATOR, SITE_TWITTER_SITE } from "@/lib/seo/social";
import { BlogArticleJsonLd } from "@/components/seo/blog-article-json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = getCanonicalSiteUrl();

  try {
    const post = await fetchPublishedBlogPostBySlug(slug);
    if (!post) {
      return {
        title: "Post not found | 49GIG Blog",
        robots: { index: false, follow: true },
      };
    }

    const title = (post.metaTitle as string | undefined) || post.title;
    const rawDesc =
      (post.metaDescription as string | undefined) ||
      (post.excerpt as string | undefined);
    const description =
      typeof rawDesc === "string" && rawDesc.trim().length > 0 ? rawDesc : undefined;

    const ogImage =
      typeof post.bannerUrl === "string" && post.bannerUrl.trim()
        ? absoluteUrl(post.bannerUrl)
        : undefined;

    const authorName =
      post.author &&
      typeof (post.author as { name?: string }).name === "string"
        ? [(post.author as { name?: string }).name!]
        : undefined;

    return {
      title: `${title} | 49GIG Blog`,
      description,
      authors: authorName?.map((name) => ({ name })),
      openGraph: {
        title,
        description,
        url: `${baseUrl}/blog/${encodeURIComponent(slug)}`,
        siteName: "49GIG",
        images: ogImage
          ? [{ url: ogImage, width: 1200, height: 630, alt: post.title }]
          : [{ url: absoluteUrl("/opengraph-image"), width: 1200, height: 630 }],
        locale: "en_US",
        type: "article",
        modifiedTime:
          typeof post.updatedAt === "number"
            ? new Date(post.updatedAt).toISOString()
            : undefined,
        publishedTime:
          post.publishedAt != null
            ? new Date(post.publishedAt as number).toISOString()
            : undefined,
      },
      twitter: {
        card: ogImage ? "summary_large_image" : "summary_large_image",
        creator: SITE_TWITTER_CREATOR,
        site: SITE_TWITTER_SITE,
        title,
        description,
        images: ogImage ? [ogImage] : [absoluteUrl("/opengraph-image")],
      },
      alternates: { canonical: `${baseUrl}/blog/${encodeURIComponent(slug)}` },
    };
  } catch {
    return { title: "Blog | 49GIG" };
  }
}

export default async function BlogPostLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPublishedBlogPostBySlug(slug);

  return (
    <>
      {post ? (
        <BlogArticleJsonLd
          slug={slug}
          title={post.title}
          excerpt={typeof post.excerpt === "string" ? post.excerpt : undefined}
          bannerUrl={post.bannerUrl != null ? String(post.bannerUrl) : null}
          publishedAt={post.publishedAt != null ? (post.publishedAt as number) : null}
          updatedAt={typeof post.updatedAt === "number" ? post.updatedAt : undefined}
          author={post.author ?? null}
        />
      ) : null}
      {children}
    </>
  );
}
