"use client";

import { isRecaptchaConfigured } from "@/lib/recaptcha-client";
import { cn } from "@/lib/utils";

/** Google-required disclosure when reCAPTCHA v3 is configured. */
export function RecaptchaNotice({ className }: { className?: string }) {
  if (!isRecaptchaConfigured()) {
    return null;
  }
  return (
    <p className={cn("text-xs text-muted-foreground leading-relaxed", className)}>
      This site is protected by reCAPTCHA and the Google{" "}
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-foreground"
      >
        Privacy Policy
      </a>{" "}
      and{" "}
      <a
        href="https://policies.google.com/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-foreground"
      >
        Terms of Service
      </a>{" "}
      apply.
    </p>
  );
}
