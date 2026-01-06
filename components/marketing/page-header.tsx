"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: {
    icon?: LucideIcon;
    text: string;
  };
  gradient?: boolean;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  gradient = true,
  children,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "relative w-full overflow-hidden border-b border-border/50",
        gradient
          ? "bg-gradient-to-b from-muted/50 via-background to-background"
          : "bg-background",
        className
      )}
    >
      {/* Decorative Elements */}
      <div className="absolute inset-0 -z-10">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Gradient orbs */}
        <div className="absolute right-0 top-0 h-[400px] w-[400px] -translate-y-1/2 translate-x-1/3 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] translate-y-1/2 -translate-x-1/3 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="text-center space-y-6">
          {/* Badge */}
          {badge && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm">
                {badge.icon && <badge.icon className="h-4 w-4 text-primary" />}
                <span>{badge.text}</span>
              </div>
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-foreground">
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p className="mx-auto max-w-3xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}

          {/* Children (CTAs, additional content) */}
          {children && <div className="pt-4">{children}</div>}
        </div>
      </div>
    </section>
  );
}

