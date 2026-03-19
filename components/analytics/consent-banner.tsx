"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Cookie, ChevronDown } from "lucide-react";
import {
  getStoredConsent,
  setStoredConsent,
  type ConsentStatus,
} from "@/lib/analytics";

interface ConsentBannerProps {
  onConsentChange?: (status: ConsentStatus) => void;
}

export function ConsentBanner({ onConsentChange }: ConsentBannerProps) {
  const [mounted, setMounted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stored = mounted ? getStoredConsent() : null;

  const handleChoice = (status: ConsentStatus) => {
    if (status) {
      setStoredConsent(status);
      onConsentChange?.(status);
    }
  };

  if (!mounted || stored !== null) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] animate-in slide-in-from-bottom duration-300"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="mx-auto max-w-4xl px-4 pb-4 pt-2">
        <div className="rounded-xl border border-border bg-card shadow-lg shadow-black/10">
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Cookie className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground">
                  We value your privacy
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  We use analytics to improve 49GIG and understand how you use our
                  platform. No tracking runs until you consent. You can change
                  your mind anytime in{" "}
                  <Link
                    href="/legal/cookie-policy"
                    className="underline hover:text-foreground"
                  >
                    Cookie settings
                  </Link>
                  .
                </p>
                {showDetails && (
                  <div className="mt-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">What we track when you accept:</p>
                    <ul className="mt-1 list-inside list-disc space-y-0.5">
                      <li>Page views and navigation</li>
                      <li>Sign-ups, logins, and key actions</li>
                      <li>Aggregated usage patterns (no personal data sold)</li>
                    </ul>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {showDetails ? "Hide details" : "Learn more"}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${showDetails ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleChoice("granted")}
                className="font-medium"
              >
                Accept analytics
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleChoice("denied")}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
