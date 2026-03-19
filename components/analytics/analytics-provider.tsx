"use client";

import { useState, useEffect, useCallback } from "react";
import { ConsentBanner } from "./consent-banner";
import { GoogleAnalytics } from "./google-analytics";
import { getStoredConsent } from "@/lib/analytics";

const hasGaId = !!(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);

export function AnalyticsProvider() {
  const [consent, setConsent] = useState<"granted" | "denied" | null>(null);

  useEffect(() => {
    setConsent(getStoredConsent());
  }, []);

  const handleConsentChange = useCallback((status: "granted" | "denied" | null) => {
    setConsent(status);
  }, []);

  if (!hasGaId) return null;

  return (
    <>
      <GoogleAnalytics consent={consent} />
      <ConsentBanner onConsentChange={handleConsentChange} />
    </>
  );
}
