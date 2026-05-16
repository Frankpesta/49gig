import type { Metadata } from "next";
import { buildMarketingRouteMetadata } from "@/lib/seo/marketing-page-metadata";

export const metadata: Metadata = buildMarketingRouteMetadata({
  absoluteTitle: "Contact | 49GIG",
  description:
    "Questions about hiring talent, joining as a freelancer, or platform support — reach out to the 49GIG team.",
  path: "/contact",
});

export default function ContactSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
