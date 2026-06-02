import type { MetadataRoute } from "next";
import { getCanonicalSiteUrl } from "@/lib/seo/site-url";

export default function manifest(): MetadataRoute.Manifest {
  const base = getCanonicalSiteUrl();

  return {
    name: "49GIG — Freelance Platform",
    short_name: "49GIG",
    description:
      "Hire verified African tech professionals across engineering, AI, DevOps, data, cloud, and design.",
    start_url: `${base}/`,
    display: "standalone",
    background_color: "#07122b",
    theme_color: "#07122b",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
