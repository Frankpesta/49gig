"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GradientHeroProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "primary" | "secondary" | "dual";
  overlay?: boolean;
  pattern?: boolean;
}

export function GradientHero({
  children,
  className,
  variant = "default",
  overlay = false,
  pattern = false,
}: GradientHeroProps) {
  const variantClasses = {
    default: "bg-gradient-to-br from-background via-muted/50 to-background",
    primary: "bg-gradient-to-br from-primary/10 via-primary/5 to-background",
    secondary: "bg-gradient-to-br from-secondary/10 via-secondary/5 to-background",
    dual: "bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10",
  };

  return (
    <section className={cn(
      "relative w-full overflow-hidden",
      variantClasses[variant],
      className
    )}>
      {/* Background Pattern */}
      {pattern && (
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
      )}

      {/* Gradient Orbs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/3 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] translate-y-1/2 -translate-x-1/3 rounded-full bg-secondary/10 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-primary/5 blur-3xl animate-pulse" style={{ animationDelay: "4s" }} />
      </div>

      {/* Overlay */}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent" />
      )}

      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}