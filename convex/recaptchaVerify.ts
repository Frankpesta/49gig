/**
 * Google reCAPTCHA v3 (or v2) siteverify. Used from Convex actions before accepting public form posts.
 *
 * Set `RECAPTCHA_SECRET_KEY` in the Convex dashboard. Optional: `RECAPTCHA_MIN_SCORE` (default 0.5) for v3.
 * When the secret is unset, verification is skipped (local dev only — set secrets in production).
 */

const SITE_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

type SiteVerifyResponse = {
  success?: boolean;
  score?: number;
  action?: string;
  "error-codes"?: string[];
};

export async function assertRecaptchaToken(
  token: string | undefined,
  options?: { expectedAction?: string; minScore?: number }
): Promise<void> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret?.trim()) {
    console.warn(
      "[recaptcha] RECAPTCHA_SECRET_KEY is not set — skipping verification (set in Convex for production)"
    );
    return;
  }

  const trimmed = token?.trim();
  if (!trimmed) {
    throw new Error("Security check failed. Please refresh the page and try again.");
  }

  const res = await fetch(SITE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: trimmed }),
  });

  const data = (await res.json()) as SiteVerifyResponse;

  if (!data.success) {
    const codes = data["error-codes"]?.join(", ") ?? "unknown";
    console.warn("[recaptcha] siteverify failed:", codes);
    throw new Error("Security check failed. Please try again.");
  }

  const minScore = Number(process.env.RECAPTCHA_MIN_SCORE ?? "0.5");
  if (typeof data.score === "number" && data.score < minScore) {
    console.warn("[recaptcha] score too low:", data.score);
    throw new Error("Security check failed. Please try again.");
  }

  const expectedAction = options?.expectedAction;
  if (expectedAction && data.action && data.action !== expectedAction) {
    console.warn("[recaptcha] action mismatch:", data.action, "expected", expectedAction);
    throw new Error("Security check failed. Please try again.");
  }
}
