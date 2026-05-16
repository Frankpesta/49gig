import type { Metadata } from "next";
import { Libre_Baskerville, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/convex-provider";
import { QueryProvider } from "@/lib/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { GtmHeadScript } from "@/components/analytics/gtm-head-script";
import { Toaster } from "sonner";
import { absoluteUrl, getCanonicalSiteUrl } from "@/lib/seo/site-url";
import { SITE_TWITTER_CREATOR, SITE_TWITTER_SITE } from "@/lib/seo/social";

// Plus Jakarta Sans - Lively, modern, vibrant dashboard font (reference design)
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  preload: true,
});

/** Editorial serif for marketing hero (Andela-style headlines) */
const heroSerif = Libre_Baskerville({
  variable: "--font-hero-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
  preload: true,
});

const canonicalOrigin = getCanonicalSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(canonicalOrigin),
  title: {
    default: "49GIG — High-trust freelance marketplace",
    template: "%s · 49GIG",
  },
  description:
    "Hire verified African tech talent for software engineering, UX/UI design, AI, DevOps & cloud — with milestone delivery, escrow-backed payments & transparent pricing.",
  applicationName: "49GIG",
  authors: [{ name: "49GIG", url: canonicalOrigin }],
  creator: "49GIG",
  publisher: "49GIG",
  category: "business",
  formatDetection: { telephone: false, email: false, address: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: canonicalOrigin,
    siteName: "49GIG",
    title: "49GIG — High-trust freelance marketplace",
    description:
      "Vetted freelancers for engineering, design, AI, data & infrastructure. Hire fast with escrow, milestones & secure payouts.",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "49GIG freelance marketplace branding",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: SITE_TWITTER_CREATOR,
    site: SITE_TWITTER_SITE,
    title: "49GIG — Hire world-class African tech talent",
    description:
      "Curated freelancers for AI, engineering, UX, DevOps, data & QA — escrow milestones & secure payouts.",
    images: [absoluteUrl("/opengraph-image")],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

// Viewport configuration for optimal rendering
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07122B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external image CDNs for faster image loading */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${plusJakarta.variable} ${heroSerif.variable} font-sans antialiased bg-background text-foreground`}
      >
        <GtmHeadScript />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <ConvexClientProvider>
              {children}
              <AnalyticsProvider />
              <Toaster richColors position="top-right" />
            </ConvexClientProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
