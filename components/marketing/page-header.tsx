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
        "w-full border-b border-border/50 bg-background",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="max-w-3xl space-y-4">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav
              className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs sm:text-sm text-muted-foreground"
              aria-label="Breadcrumb"
            >
              <Link
                href="/"
                className="flex items-center gap-1.5 rounded py-0.5 transition-colors hover:text-foreground"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </Link>
              {breadcrumbs.map((item, index) => (
                <span key={index} className="flex items-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="flex items-center gap-1.5 rounded py-0.5 transition-colors hover:text-foreground"
                    >
                      {item.icon && <item.icon className="h-3.5 w-3.5" />}
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      {item.icon && <item.icon className="h-3.5 w-3.5" />}
                      <span>{item.label}</span>
                    </span>
                  )}
                </span>
              ))}
            </nav>
          )}

          {badge && (
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {badge.icon && <badge.icon className="h-3.5 w-3.5" />}
              <span>{badge.text}</span>
            </div>
          )}

          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
            {title}
          </h1>

          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl sm:text-base">
              {description}
            </p>
          )}

          {children && <div className="pt-2">{children}</div>}
        </div>
      </div>
    </header>
  );
}
