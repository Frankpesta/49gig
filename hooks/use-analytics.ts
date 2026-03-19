"use client";

import { useCallback } from "react";
import { canTrack, getGaMeasurementId } from "@/lib/analytics";

/**
 * Track custom events. Only sends when user has consented and GA is configured.
 */
export function useAnalytics() {
  const trackEvent = useCallback(
    (eventName: string, params?: Record<string, unknown>) => {
      if (!canTrack() || typeof window === "undefined" || !window.gtag) {
        return;
      }
      const measurementId = getGaMeasurementId();
      if (!measurementId) return;

      window.gtag("event", eventName, params);
    },
    []
  );

  return { trackEvent };
}
