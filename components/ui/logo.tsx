"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState, startTransition } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function Logo({ className, width = 120, height = 40, priority = false }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    startTransition(() => {
      setMounted(true);
    });
  }, []);

  // Show placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div
        className={cn("flex items-center", className)}
        style={{ width, height }}
        aria-label="49GIG Logo"
      />
    );
  }

  // Use dark logo when theme is dark, light logo otherwise
  // Default to light logo if theme is not yet resolved
  const logoSrc = resolvedTheme === "dark" ? "/logo-dark.png" : "/logo-light.png";

  return (
    <Image
      key={resolvedTheme} // Force re-render when theme changes
      src={logoSrc}
      alt="49GIG Logo"
      width={width}
      height={height}
      className={cn("object-contain", className)}
      priority={priority}
    />
  );
}

