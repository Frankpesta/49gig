"use client";

import { useCallback } from "react";
import { canTrack } from "@/lib/analytics";

/**
 * Track custom events via dataLayer. Only sends when user has consented and GTM is configured.
 * GTM picks up dataLayer events and can fire GA4, Meta Pixel, Google Ads tags based on triggers.
 */
export function useAnalytics() {
  const trackEvent = useCallback(
    (eventName: string, params?: Record<string, unknown>) => {
      if (!canTrack() || typeof window === "undefined") return;
      if (!window.dataLayer) return;

      window.dataLayer.push({
        event: eventName,
        ...params,
      });
    },
    []
  );

  return { trackEvent };
}
