/**
 * Google reCAPTCHA v3 in the browser. Requires NEXT_PUBLIC_RECAPTCHA_SITE_KEY.
 * @see https://developers.google.com/recaptcha/docs/v3
 */

const SCRIPT_ID = "google-recaptcha-v3";

let scriptPromise: Promise<void> | null = null;

function getSiteKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  return key?.trim() || undefined;
}

function ensureScriptLoaded(): Promise<void> {
  const siteKey = getSiteKey();
  if (!siteKey) {
    return Promise.reject(new Error("reCAPTCHA is not configured"));
  }

  if (typeof window === "undefined") {
    return Promise.reject(new Error("reCAPTCHA can only run in the browser"));
  }

  if (window.grecaptcha?.execute) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing?.src?.includes(siteKey)) {
      const deadline = Date.now() + 15000;
      const t = setInterval(() => {
        if (window.grecaptcha?.execute) {
          clearInterval(t);
          resolve();
        } else if (Date.now() > deadline) {
          clearInterval(t);
          reject(new Error("reCAPTCHA load timeout"));
        }
      }, 50);
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load reCAPTCHA"));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Returns a token for the given action (v3). Pass this to Convex actions that call assertRecaptchaToken.
 */
export async function executeRecaptcha(action: string): Promise<string> {
  const siteKey = getSiteKey();
  if (!siteKey) {
    throw new Error("This form is temporarily unavailable. Please try again later.");
  }

  await ensureScriptLoaded();

  return new Promise((resolve, reject) => {
    window.grecaptcha!.ready(() => {
      window
        .grecaptcha!.execute(siteKey, { action })
        .then(resolve)
        .catch(() => reject(new Error("Security check failed. Please try again.")));
    });
  });
}

export function isRecaptchaConfigured(): boolean {
  return Boolean(getSiteKey());
}

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}
