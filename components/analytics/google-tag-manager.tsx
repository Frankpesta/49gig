"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

interface GoogleTagManagerProps {
  gtmId: string;
}

/**
 * GTM loads from root layout (gtm-head-script.tsx) with Consent Mode v2.
 * This component pushes page_view on every route change (for ALL visitors,
 * regardless of the cookie banner choice — analytics_storage is granted by
 * default) and renders the noscript fallback.
 */
export function GoogleTagManager({ gtmId }: GoogleTagManagerProps) {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!gtmId || typeof window === "undefined") return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "page_view",
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [gtmId, pathname]);

  if (!gtmId) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
