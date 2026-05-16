import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo/site-url";
import { SITE_TWITTER_CREATOR, SITE_TWITTER_SITE } from "@/lib/seo/social";

const OG_DEFAULT = absoluteUrl("/opengraph-image");

/**
 * Canonical marketing route metadata using an absolute HTML title so the root template is not duplicated.
 */
export function buildMarketingRouteMetadata(opts: {
  absoluteTitle: string;
  description: string;
  path: string;
}): Metadata {
  const canonical = absoluteUrl(opts.path);
  const ogAlt = opts.absoluteTitle.slice(0, 120);

  return {
    title: { absolute: opts.absoluteTitle },
    description: opts.description,
    alternates: { canonical },
    openGraph: {
      title: opts.absoluteTitle,
      description: opts.description,
      url: canonical,
      siteName: "49GIG",
      locale: "en_US",
      type: "website",
      images: [{ url: OG_DEFAULT, width: 1200, height: 630, alt: ogAlt }],
    },
    twitter: {
      card: "summary_large_image",
      creator: SITE_TWITTER_CREATOR,
      site: SITE_TWITTER_SITE,
      title: opts.absoluteTitle,
      description: opts.description,
      images: [OG_DEFAULT],
    },
  };
}
