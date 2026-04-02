import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compress responses with gzip
  compress: true,

  // Remove X-Powered-By header
  poweredByHeader: false,

  images: {
    // Serve modern formats (WebP/AVIF) automatically
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        // Convex file storage URLs
        protocol: "https",
        hostname: "*.convex.cloud",
        pathname: "/**",
      },
    ],
    // Minimise image CDN round-trips
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // React strict mode helps catch performance issues during development
  reactStrictMode: true,

  // Tree-shake heavy icon / date packages aggressively
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@radix-ui/react-icons",
    ],
  },

  // Cache-control headers for static assets
  async headers() {
    return [
      {
        source: "/:path*\\.(ico|png|jpg|jpeg|gif|svg|webp|avif|woff|woff2|ttf|otf)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Marketing pages: allow CDN to cache; revalidate every 60 s
        source: "/(|hire-talent|for-clients|about|how-it-works|why-49gig|for-freelancers|use-cases|hire-team|talent-categories|pricing|legal/:path*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=3600",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
