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
    <header
      className={cn(
        "w-full border-b border-border/40 bg-gradient-to-b from-background via-background to-muted/20",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl space-y-6">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav
              className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-muted-foreground"
              aria-label="Breadcrumb"
            >
              <Link
                href="/"
                className="flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:text-foreground hover:bg-muted/50"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </Link>
              {breadcrumbs.map((item, index) => (
                <span key={index} className="flex items-center gap-2">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:text-foreground hover:bg-muted/50"
                    >
                      {item.icon && <item.icon className="h-3.5 w-3.5" />}
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1.5 font-medium text-foreground px-1.5 py-1">
                      {item.icon && <item.icon className="h-3.5 w-3.5" />}
                      <span>{item.label}</span>
                    </span>
                  )}
                </span>
              ))}
            </nav>
          )}

          {badge && (
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary">
              {badge.icon && <badge.icon className="h-3.5 w-3.5" />}
              <span>{badge.text}</span>
            </div>
          )}

          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-foreground leading-tight">
              {title}
            </h1>

            {description && (
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
                {description}
              </p>
            )}
          </div>

          {children && <div className="pt-6">{children}</div>}
        </div>
      </div>
    </header>
  );
}
