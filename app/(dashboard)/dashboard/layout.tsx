import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

/** Private app shell segments live under `/dashboard/*` — suppress public indexing regardless of ancestor client layout. */
export default function DashboardSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
