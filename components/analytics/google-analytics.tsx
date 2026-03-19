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
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (consent !== "granted") return;

    const measurementId = getGaMeasurementId();
    if (!measurementId) return;

    const sendPageView = () => {
      if (typeof window === "undefined" || !window.gtag) return;
      const url = window.location.href;
      window.gtag("event", "page_view", {
        page_path: pathname,
        page_location: url,
        page_title: document.title,
      });
      lastPathRef.current = pathname;
    };

    const initGtag = () => {
      if (typeof window === "undefined") return;

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      }
      window.gtag = gtag as NonNullable<typeof window.gtag>;
      gtag("js", new Date());

      const isDebug = window.location.search.includes("debug_mode=true");
      window.gtag("config", measurementId, {
        send_page_view: false,
        anonymize_ip: true,
        cookie_flags: "SameSite=None;Secure",
        ...(isDebug && { debug_mode: true }),
      });

      initialized.current = true;
      sendPageView();
    };

    if (!initialized.current) {
      const script = document.createElement("script");
      script.src = `${GA_SCRIPT_URL}?id=${measurementId}`;
      script.async = true;
      script.onload = initGtag;
      document.head.appendChild(script);
    }
  }, [consent, pathname]);

  useEffect(() => {
    if (consent !== "granted") return;
    const measurementId = getGaMeasurementId();
    if (!measurementId || !window.gtag || !initialized.current) return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;
    const url = typeof window !== "undefined" ? window.location.href : "";
    window.gtag("event", "page_view", {
      page_path: pathname,
      page_location: url,
      page_title: document.title,
    });
  }, [consent, pathname]);

  return null;
}
