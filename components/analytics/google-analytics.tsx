"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getGaMeasurementId } from "@/lib/analytics";

const GA_SCRIPT_URL = "https://www.googletagmanager.com/gtag/js";

interface GoogleAnalyticsProps {
  consent: "granted" | "denied" | null;
}

export function GoogleAnalytics({ consent }: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const initialized = useRef(false);

  useEffect(() => {
    if (consent !== "granted") return;

    const measurementId = getGaMeasurementId();
    if (!measurementId) return;

    const initGtag = () => {
      if (typeof window === "undefined") return;

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      }
      window.gtag = gtag as NonNullable<typeof window.gtag>;
      gtag("js", new Date());

      window.gtag("config", measurementId, {
        send_page_view: false,
        anonymize_ip: true,
        cookie_flags: "SameSite=None;Secure",
      });

      initialized.current = true;
    };

    if (!initialized.current) {
      const script = document.createElement("script");
      script.src = `${GA_SCRIPT_URL}?id=${measurementId}`;
      script.async = true;
      script.onload = initGtag;
      document.head.appendChild(script);
    }
  }, [consent]);

  useEffect(() => {
    if (consent !== "granted") return;

    const measurementId = getGaMeasurementId();
    if (!measurementId || !window.gtag) return;

    const url = typeof window !== "undefined" ? window.location.href : "";
    window.gtag("event", "page_view", {
      page_path: pathname,
      page_location: url,
      page_title: document.title,
    });
  }, [consent, pathname]);

  return null;
}
