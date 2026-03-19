import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/convex-provider";
import { QueryProvider } from "@/lib/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { GtmHeadScript } from "@/components/analytics/gtm-head-script";
import { Toaster } from "sonner";

// Plus Jakarta Sans - Lively, modern, vibrant dashboard font (reference design)
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  preload: true,
});

export const metadata: Metadata = {
  title: "49GIG — High-Trust Freelance Marketplace",
  description: "A curated freelance marketplace inspired by Andela",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} font-sans antialiased bg-background text-foreground`}
      >
        <GtmHeadScript />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
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
