"use client";

import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { LucideIcon, Home, ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

interface PageHeroProps {
  title: string;
  description?: string;
  badge?: {
    icon?: LucideIcon;
    text: string;
  };
  breadcrumbs?: BreadcrumbItem[];
  /** Right column: image or custom content */
  rightContent?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  /** CTA buttons below description */
  actions?: ReactNode;
  className?: string;
}

export function PageHero({
  title,
  description,
  badge,
  breadcrumbs,
  rightContent,
  imageSrc,
  imageAlt,
  actions,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-background via-muted/10 to-background",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Left: Content */}
          <div className="space-y-6 order-2 lg:order-1">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav
                className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"
                aria-label="Breadcrumb"
              >
                <Link
                  href="/"
                  className="flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:text-foreground hover:bg-muted/50"
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
                {breadcrumbs.map((item, index) => (
                  <span key={index} className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="rounded-md px-1.5 py-1 transition-colors hover:text-foreground hover:bg-muted/50"
                      >
                        {item.icon && <item.icon className="h-4 w-4 inline mr-1.5 align-middle" />}
                        {item.label}
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground px-1.5 py-1">
                        {item.icon && <item.icon className="h-4 w-4 inline mr-1.5 align-middle" />}
                        {item.label}
                      </span>
                    )}
                  </span>
                ))}
              </nav>
            )}

            {badge && (
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-semibold text-primary">
                {badge.icon && <badge.icon className="h-4 w-4" />}
                <span>{badge.text}</span>
              </div>
            )}

            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
                {title}
              </h1>
              {description && (
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                  {description}
                </p>
              )}
              {actions && <div className="flex flex-wrap gap-3 pt-2">{actions}</div>}
            </div>
          </div>

          {/* Right: Image or custom content */}
          <div className="order-1 lg:order-2">
            {rightContent ?? (imageSrc && (
              <div className="relative aspect-[4/3] sm:aspect-square lg:aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/50 bg-muted/30 shadow-lg">
                <Image
                  src={imageSrc}
                  alt={imageAlt ?? title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
