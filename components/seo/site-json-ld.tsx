import { getCanonicalSiteUrl, absoluteUrl } from "@/lib/seo/site-url";
import { SITE_X_PROFILE_URL } from "@/lib/seo/social";

export function SiteOrganizationJsonLd() {
  const baseUrl = getCanonicalSiteUrl();

  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: "49GIG",
        url: baseUrl,
        sameAs: [SITE_X_PROFILE_URL],
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl("/favicon.ico"),
        },
        slogan:
          "World-class African talent — vetted freelancers for software, design, AI, data, DevOps, and cloud.",
        description:
          "49GIG is a curated marketplace connecting businesses with verified African tech professionals.",
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: "49GIG",
        inLanguage: "en-US",
        publisher: { "@id": `${baseUrl}/#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
