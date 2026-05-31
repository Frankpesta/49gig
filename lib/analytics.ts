/**
 * Google Tag Manager - Consent Mode v2 implementation
 * GTM loads with default consent denied; tags fire only after consent_update.
 * GTM manages GA4, Meta Pixel, Google Ads, etc. from the GTM dashboard.
 */

export const CONSENT_STORAGE_KEY = "ga_consent";

/**
 * Conversion events we push to dataLayer. Use these in GTM triggers.
 * GA4 / Meta mapping:
 * - sign_up → CompleteRegistration
 * - purchase, add_payment → Purchase
 * - generate_lead → Lead
 * - begin_checkout → InitiateCheckout
 * - sign_contract → AddPaymentInfo (or custom)
 */
export const CONVERSION_EVENTS = {
  SIGN_UP: "sign_up",
  PURCHASE: "purchase",
  ADD_PAYMENT: "add_payment",
  GENERATE_LEAD: "generate_lead",
  BEGIN_CHECKOUT: "begin_checkout",
  SIGN_CONTRACT: "sign_contract",
} as const;

/**
 * - `granted` — "Allow all" (analytics + advertising consent mode signals on).
 * - `denied` — "Necessary ones" (non-essential / analytics storage off until user allows all).
 */
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

/** GTM Container ID - set via NEXT_PUBLIC_GTM_ID */
export function getGtmId(): string | null {
  if (typeof window === "undefined") return null;
  return process.env.NEXT_PUBLIC_GTM_ID || null;
}

/**
 * Whether we can push analytics events. Analytics is on for every visitor
 * (analytics_storage is granted by default), so we only require GTM to be
 * configured — the banner choice does NOT gate measurement.
 */
export function canTrack(): boolean {
  return !!getGtmId();
}

/**
 * Push Google Consent Mode v2 consent_update to dataLayer.
 *
 * Analytics is always granted (we measure every visitor). The banner choice
 * only governs ADVERTISING signals: "Allow all" grants them, "Necessary ones"
 * keeps them denied.
 *
 * @param granted - `true` after "Allow all"; `false` after "Necessary ones".
 */
export function pushConsentUpdate(granted: boolean): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  const adValue = granted ? "granted" : "denied";
  // Consent Mode commands MUST be sent as a gtag `arguments` object, NOT a
  // plain array. GTM ignores `dataLayer.push(["consent","update",...])`.
  function gtag(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    (window.dataLayer as unknown[]).push(arguments);
  }
  gtag("consent", "update", {
    ad_storage: adValue,
    ad_user_data: adValue,
    ad_personalization: adValue,
    analytics_storage: "granted",
  });
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
