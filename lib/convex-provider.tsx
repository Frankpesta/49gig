"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

function convexDeploymentUrl(): string {
  const u = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (u) return u;
  // Next may evaluate this module during static generation when env is not injected.
  // Runtime still requires a real deployment URL in production.
  return "https://build-placeholder.convex.cloud";
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => new ConvexReactClient(convexDeploymentUrl()), []);
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

