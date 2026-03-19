/**
 * Google Analytics 4 - Consent-first implementation
 * No tracking occurs until user explicitly consents.
 */

export const CONSENT_STORAGE_KEY = "ga_consent";

export type ConsentStatus = "granted" | "denied" | null;

/** Get stored consent from localStorage (client-side only) */
export function getStoredConsent(): ConsentStatus {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === "granted" || stored === "denied") return stored;
    return null;
  } catch {
    return null;
  }
}

/** Persist consent choice */
export function setStoredConsent(status: ConsentStatus): void {
  if (typeof window === "undefined") return;
  try {
    if (status) {
      localStorage.setItem(CONSENT_STORAGE_KEY, status);
    } else {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

/** GA4 Measurement ID - set via NEXT_PUBLIC_GA_MEASUREMENT_ID */
export function getGaMeasurementId(): string | null {
  if (typeof window === "undefined") return null;
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || null;
}

/** Check if GA is configured and consented */
export function canTrack(): boolean {
  return getStoredConsent() === "granted" && !!getGaMeasurementId();
}

/** Declare gtag on window for TypeScript */
declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "js",
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}
