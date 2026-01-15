"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LucideIcon, ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: {
    icon?: LucideIcon;
    text: string;
  };
  breadcrumbs?: BreadcrumbItem[];
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  breadcrumbs,
  children,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "relative w-full border-b border-border/30 bg-background",
        className
      )}
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-primary/8 via-background to-secondary/8" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle_at_1px_1px,rgba(52,84,120,0.2)_1px,transparent_0)] [background-size:24px_24px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-18 lg:py-22">
        <div className="max-w-3xl space-y-6">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
              <Link href="/" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              {breadcrumbs.map((item, index) => (
                <div key={index} className="flex items-center gap-1">
                  <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
                  {item.href ? (
                    <Link href={item.href} className="flex items-center gap-2 hover:text-foreground transition-colors">
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <span className="flex items-center gap-2 text-foreground font-medium">
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{item.label}</span>
                    </span>
                  )}
                </div>
              ))}
            </nav>
          )}

          {badge && (
            <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {badge.icon && <badge.icon className="h-3.5 w-3.5 text-primary" />}
              <span>{badge.text}</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>

          {description && (
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}

          {children && <div className="pt-4">{children}</div>}
        </div>
      </div>
    </section>
  );
}

