"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getStoredConsent, setStoredConsent, pushConsentUpdate } from "@/lib/analytics";

export function CookiePreferences() {
  const [consent, setConsent] = useState<"granted" | "denied" | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setConsent(getStoredConsent());
  }, []);

  const handleAllowAll = () => {
    setStoredConsent("granted");
    setConsent("granted");
    pushConsentUpdate(true);
    window.location.reload();
  };

  const handleNecessaryOnes = () => {
    setStoredConsent("denied");
    setConsent("denied");
    pushConsentUpdate(false);
    window.location.reload();
  };

  if (!mounted) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
      <h3 className="font-medium text-foreground">Cookie preferences</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {consent === "granted"
          ? "You chose Allow all—analytics and related tags may run to help us improve 49GIG."
          : consent === "denied"
            ? "You chose Necessary ones—we use essential cookies only; optional analytics stay off."
            : "Choose Allow all (analytics included) or Necessary ones (essential cookies only). You can also use the banner on any page."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant={consent === "granted" ? "default" : "outline"} onClick={handleAllowAll}>
          Allow all
        </Button>
        <Button size="sm" variant={consent === "denied" ? "default" : "outline"} onClick={handleNecessaryOnes}>
          Necessary ones
        </Button>
      </div>
    </div>
  );
}
