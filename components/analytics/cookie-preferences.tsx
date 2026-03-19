"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getStoredConsent, setStoredConsent } from "@/lib/analytics";

export function CookiePreferences() {
  const [consent, setConsent] = useState<"granted" | "denied" | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setConsent(getStoredConsent());
  }, []);

  const handleAccept = () => {
    setStoredConsent("granted");
    setConsent("granted");
    window.location.reload();
  };

  const handleReject = () => {
    setStoredConsent("denied");
    setConsent("denied");
    window.location.reload();
  };

  if (!mounted) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
      <h3 className="font-medium text-foreground">Analytics consent</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {consent === "granted"
          ? "You have accepted analytics. We use this to improve 49GIG."
          : consent === "denied"
            ? "You have rejected analytics. No tracking is active."
            : "You have not yet made a choice. Use the banner or the buttons below."}
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant={consent === "granted" ? "default" : "outline"} onClick={handleAccept}>
          Accept analytics
        </Button>
        <Button size="sm" variant={consent === "denied" ? "default" : "outline"} onClick={handleReject}>
          Reject analytics
        </Button>
      </div>
    </div>
  );
}
