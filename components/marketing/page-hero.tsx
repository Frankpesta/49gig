"use client";

import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight, Home, LucideIcon } from "lucide-react";

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
        "relative isolate overflow-hidden border-b border-border/40 bg-black",
        className
      )}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={imageAlt ?? title}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900" />
      )}

      <div className="absolute inset-0 bg-linear-to-b from-black/50 via-black/55 to-black/95" />
      <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/40 to-black/20" />
      <div className="absolute inset-0 bg-linear-to-tr from-primary/20 via-transparent to-secondary/20" />

      <div className="relative mx-auto flex min-h-[68svh] max-w-7xl items-end px-4 pb-10 pt-24 sm:min-h-[74svh] sm:px-6 sm:pb-14 sm:pt-28 lg:min-h-[80svh] lg:px-8 lg:pb-16 lg:pt-32">
        <div className="w-full max-w-4xl rounded-2xl border border-white/25 bg-black/35 p-5 shadow-2xl backdrop-blur-md sm:p-7 lg:p-9">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav
              className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-white/80 sm:text-sm"
              aria-label="Breadcrumb"
            >
              <Link href="/" className="inline-flex items-center gap-1 hover:text-white">
                <Home className="h-3.5 w-3.5" />
                Home
              </Link>
              {breadcrumbs.map((item, idx) => (
                <span key={`${item.label}-${idx}`} className="inline-flex items-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5 text-white/60" />
                  {item.href ? (
                    <Link href={item.href} className="inline-flex items-center gap-1 hover:text-white">
                      {item.icon && <item.icon className="h-3.5 w-3.5" />}
                      {item.label}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-white">
                      {item.icon && <item.icon className="h-3.5 w-3.5" />}
                      {item.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          )}

          {badge && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white sm:text-[11px]">
              {badge.icon && <badge.icon className="h-3.5 w-3.5" />}
              <span>{badge.text}</span>
            </div>
          )}

          <h1 className="text-3xl font-bold leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/90 sm:text-lg lg:text-xl">
              {description}
            </p>
          )}
          {actions && (
            <div className="mt-5 flex flex-nowrap gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden *:h-10 *:px-4 *:text-sm [&>*_svg]:h-4 [&>*_svg]:w-4 sm:gap-3 sm:*:h-11 sm:*:px-5 sm:*:text-base sm:[&>*_svg]:h-5 sm:[&>*_svg]:w-5">
              {actions}
            </div>
          )}
          {rightContent && <div className="pt-4">{rightContent}</div>}
        </div>
      </div>
    </section>
  );
}
