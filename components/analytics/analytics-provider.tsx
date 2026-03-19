"use client";

import { useState, useEffect, useCallback } from "react";
import { ConsentBanner } from "./consent-banner";
import { GoogleTagManager } from "./google-tag-manager";
import { getStoredConsent, pushConsentUpdate } from "@/lib/analytics";

const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

export function AnalyticsProvider() {
  const [consent, setConsent] = useState<"granted" | "denied" | null>(null);

  useEffect(() => {
    setConsent(getStoredConsent());
  }, []);

  const handleConsentChange = useCallback((status: "granted" | "denied" | null) => {
    setConsent(status);
    if (status !== null) {
      pushConsentUpdate(status === "granted");
    }
  }, []);

  // Sync consent_update when we have stored consent on load (e.g. returning user)
  useEffect(() => {
    if (consent && gtmId) {
      pushConsentUpdate(consent === "granted");
    }
  }, [consent, gtmId]);

  if (!gtmId) return <ConsentBanner onConsentChange={handleConsentChange} />;

  return (
    <>
      <GoogleTagManager consent={consent} gtmId={gtmId} />
      <ConsentBanner onConsentChange={handleConsentChange} />
    </>
  );
}
