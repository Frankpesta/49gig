"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LucideIcon, ChevronRight, Home } from "lucide-react";
import { SectionTransition } from "@/components/ui/section-transition";

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
    <section className={cn("relative w-full py-20 sm:py-28 lg:py-36 overflow-hidden bg-gradient-to-br from-background via-muted/5 to-background border-b border-border/20", className)}>
      {/* Clean Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-secondary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">

          {/* Clean Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex justify-center mb-8" aria-label="Breadcrumb">
              <div className="flex items-center gap-1 px-6 py-3 bg-background/80 backdrop-blur-sm rounded-full border border-border/30 shadow-sm">
                <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
                {breadcrumbs.map((item, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.label}</span>
                      </Link>
                    ) : (
                      <span className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground">
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.label}</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </nav>
          )}

          {/* Clean Badge */}
          {badge && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/5 border border-primary/20 rounded-full text-sm font-medium text-primary">
                {badge.icon && <badge.icon className="h-4 w-4" />}
                <span>{badge.text}</span>
              </div>
            </div>
          )}

          {/* Clean Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground leading-tight">
            {title}
          </h1>

          {/* Clean Description */}
          {description && (
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              {description}
            </p>
          )}

          {/* Content */}
          {children && (
            <div className="pt-8">
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

