import { absoluteUrl, getCanonicalSiteUrl } from "@/lib/seo/site-url";

type Author = { name?: string; imageUrl?: string | null } | null | undefined;

type BlogArticleJsonLdProps = {
  slug: string;
  title: string;
  excerpt?: string | null;
  bannerUrl?: string | null;
  publishedAt?: number | null;
  updatedAt?: number;
  author?: Author;
};

export function BlogArticleJsonLd({
  slug,
  title,
  excerpt,
  bannerUrl,
  publishedAt,
  updatedAt,
  author,
}: BlogArticleJsonLdProps) {
  const baseUrl = getCanonicalSiteUrl();
  const pageUrl = absoluteUrl(`/blog/${slug}`);
  const imageUrls = bannerUrl ? [absoluteUrl(bannerUrl)] : undefined;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: title,
      description: excerpt ?? undefined,
      ...(imageUrls?.length ? { primaryImageOfPage: { "@id": `${pageUrl}#banner` } } : {}),
      isPartOf: { "@id": `${baseUrl}/#website` },
    },
  ];

  if (imageUrls?.length) {
    graph.push({
      "@type": "ImageObject",
      "@id": `${pageUrl}#banner`,
      url: imageUrls[0],
      caption: title,
    });
  }

  graph.push({
    "@type": "Article",
    "@id": `${pageUrl}#article`,
    mainEntityOfPage: { "@id": `${pageUrl}#webpage` },
    headline: title,
    description: excerpt ?? undefined,
    inLanguage: "en-US",
    ...(imageUrls ? { image: imageUrls } : {}),
    datePublished:
      publishedAt != null ? new Date(publishedAt).toISOString() : undefined,
    dateModified:
      updatedAt != null ? new Date(updatedAt).toISOString() : undefined,
    ...(author?.name
      ? {
          author: {
            "@type": "Person",
            name: author.name,
            ...(author.imageUrl ? { image: absoluteUrl(author.imageUrl) } : {}),
          },
        }
      : {}),
    publisher: {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: "49GIG",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/favicon.ico"),
      },
    },
  });

  const payload = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload),
      }}
    />
  );
}
