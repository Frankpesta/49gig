import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | 49GIG",
  description:
    "Insights, updates, and stories from the 49GIG team and our community. High-trust freelance marketplace for African talent.",
  openGraph: {
    title: "Blog | 49GIG",
    description:
      "Insights, updates, and stories from the 49GIG team and our community.",
    type: "website",
  },
  alternates: {
    canonical:
      typeof process.env.NEXT_PUBLIC_BASE_URL === "string"
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/blog`
        : undefined,
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
