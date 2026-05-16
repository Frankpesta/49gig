/**
 * Single source of truth for canonical origin (HTTPS, no trailing slash).
 * Use for metadataBase, JSON-LD, RSS, OG absolute URLs.
 */
export function getCanonicalSiteUrl(): string {
  const explicit =
    typeof process.env.NEXT_PUBLIC_SITE_URL === "string"
      ? process.env.NEXT_PUBLIC_SITE_URL.trim()
      : "";
  const altBase =
    typeof process.env.NEXT_PUBLIC_BASE_URL === "string"
      ? process.env.NEXT_PUBLIC_BASE_URL.trim()
      : "";
  const resolved =
    explicit ||
    altBase ||
    (process.env.VERCEL_ENV === "production"
      ? "https://49gig.com"
      : process.env.VERCEL_URL?.trim().length
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

  const trimmed = resolved.replace(/\/+$/, "");
  // Local dev stays on http; staging/production canonicalize to https.
  if (trimmed.startsWith("http://localhost") || trimmed.startsWith("http://127.0.0.1")) {
    return trimmed;
  }
  if (/^http:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }
  return trimmed;
}

export function absoluteUrl(pathOrUrl: string): string {
  const base = getCanonicalSiteUrl();
  if (!pathOrUrl) return base;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    try {
      return new URL(pathOrUrl).href;
    } catch {
      return pathOrUrl;
    }
  }
  const suffix = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  try {
    return new URL(suffix, `${base}/`).href;
  } catch {
    return `${base}${suffix}`;
  }
}
