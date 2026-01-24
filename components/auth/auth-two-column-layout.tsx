"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

export interface AuthFeature {
  icon: ReactNode;
  title: string;
  description: string;
}

interface AuthTwoColumnLayoutProps {
  /** Left panel: headline */
  leftTitle: string;
  /** Left panel: subline */
  leftDescription: string;
  /** Left panel: feature list (icon, title, description) */
  features?: AuthFeature[];
  /** Right panel: optional badge above heading */
  badge?: string;
  /** Right panel: main heading */
  heading: string;
  /** Right panel: subline below heading */
  subline?: string;
  /** Right panel: form or content */
  children: ReactNode;
  /** Optional: show logo on mobile (default true) */
  showMobileLogo?: boolean;
  /** Optional: custom class for left column */
  leftClassName?: string;
  /** Optional: custom class for right column */
  rightClassName?: string;
}

export function AuthTwoColumnLayout({
  leftTitle,
  leftDescription,
  features = [],
  badge,
  heading,
  subline,
  children,
  showMobileLogo = true,
  leftClassName,
  rightClassName,
}: AuthTwoColumnLayoutProps) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Subtle ambient gradient – no heavy blurs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-0 top-0 w-[min(60%,480px)] h-full bg-gradient-to-r from-primary/[0.03] to-transparent" />
        <div className="absolute right-0 bottom-0 w-[min(50%,400px)] h-[60%] bg-gradient-to-t from-muted/30 to-transparent" />
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-2">
        {/* Left column – branding (hidden on mobile) */}
        <div
          className={cn(
            "hidden lg:flex lg:flex-col lg:justify-between",
            "bg-muted/30 border-r border-border/50",
            "px-10 xl:px-14 py-12",
            leftClassName
          )}
        >
          <div className="flex flex-col gap-16">
            <Link href="/" className="inline-flex" aria-label="49GIG Home">
              <Logo width={140} height={44} priority />
            </Link>

            <div className="max-w-[380px] space-y-6">
              <div className="space-y-3">
                <h2 className="text-2xl xl:text-3xl font-semibold tracking-tight text-foreground">
                  {leftTitle}
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {leftDescription}
                </p>
              </div>

              {features.length > 0 && (
                <ul className="space-y-5 pt-2">
                  {features.map((f, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {f.icon}
                      </span>
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-foreground">
                          {f.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {f.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            © {new Date().getFullYear()} 49GIG. All rights reserved.
          </p>
        </div>

        {/* Right column – form */}
        <div
          className={cn(
            "flex min-h-0 flex-col justify-center overflow-y-auto",
            "px-4 sm:px-6 lg:px-10 xl:px-14 py-8 sm:py-10 lg:py-12",
            rightClassName
          )}
        >
          <div className="mx-auto w-full max-w-[400px] space-y-8">
            {showMobileLogo && (
              <div className="lg:hidden flex justify-center pb-4">
                <Link href="/" aria-label="49GIG Home">
                  <Logo width={120} height={38} priority />
                </Link>
              </div>
            )}

            <header className="space-y-3">
              {badge && (
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {badge}
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                {heading}
              </h1>
              {subline && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {subline}
                </p>
              )}
            </header>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
