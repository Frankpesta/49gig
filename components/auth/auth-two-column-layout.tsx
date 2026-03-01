"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Lightweight fade-in for auth pages (no framer-motion dependency)
const fadeIn = "animate-in fade-in duration-300 fill-mode-both";

export interface AuthFeature {
  icon: ReactNode;
  title: string;
  description: string;
}

export interface AuthStep {
  label: string;
  active?: boolean;
}

interface AuthTwoColumnLayoutProps {
  /** Left panel: headline */
  leftTitle: string;
  /** Left panel: subline */
  leftDescription: string;
  /** Left panel: feature list (icon, title, description) – used when no steps */
  features?: AuthFeature[];
  /** Left panel: step indicators (reference style) – used for signup flows */
  steps?: AuthStep[];
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
  /** Optional: wrap form in floating card (default true) */
  cardForm?: boolean;
}

export function AuthTwoColumnLayout({
  leftTitle,
  leftDescription,
  features = [],
  steps = [],
  badge,
  heading,
  subline,
  children,
  showMobileLogo = true,
  leftClassName,
  rightClassName,
  cardForm = true,
}: AuthTwoColumnLayoutProps) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Ambient radial gradients – soft glow behind content */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -left-1/4 top-0 w-[80%] h-[80%] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute right-0 bottom-0 w-[60%] h-[70%] rounded-full bg-primary/5 blur-[80px]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full bg-muted/20 blur-[120px]" />
      </div>

      <div className={cn("relative grid min-h-screen lg:h-screen lg:grid-cols-2", fadeIn)}>
        {/* Left column – branding (hidden on mobile, fixed/no scroll, reference-style dark + gradients) */}
        <div
          className={cn(
            "hidden lg:flex lg:flex-col lg:justify-between lg:overflow-hidden lg:relative",
            "bg-muted/40 dark:bg-muted/60 border-r border-border/40",
            "px-8 xl:px-12 py-10 xl:py-12",
            leftClassName
          )}
        >
          {/* Left-side gradient orbs – prominent primary glow (reference style) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -right-1/4 top-1/4 w-[110%] h-[85%] rounded-full bg-primary/25 blur-[120px]" />
            <div className="absolute left-0 bottom-1/4 w-[80%] h-[65%] rounded-full bg-primary/15 blur-[100px]" />
          </div>

          <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-between">
            <div className="flex min-h-0 shrink flex-col gap-4 xl:gap-6 overflow-hidden">
              <Link href="/" className="inline-flex shrink-0" aria-label="49GIG Home">
                <Logo width={130} height={42} priority />
              </Link>

              <div className="min-w-0 max-w-[360px] space-y-4 xl:space-y-5 overflow-hidden">
                <h2 className="text-xl xl:text-2xl font-semibold tracking-tight text-foreground leading-tight">
                  {leftTitle}
                </h2>
                <p className="text-sm xl:text-base text-muted-foreground leading-relaxed line-clamp-3">
                  {leftDescription}
                </p>

                {steps.length > 0 ? (
                  <ul className="space-y-2 min-h-0 overflow-hidden">
                    {steps.map((s, i) => (
                      <li
                        key={i}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                          s.active
                            ? "border-primary/40 bg-primary/10 text-foreground"
                            : "border-border/40 bg-muted/20 text-muted-foreground"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                            s.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium truncate">{s.label}</span>
                      </li>
                    ))}
                  </ul>
                ) : features.length > 0 ? (
                  <ul className="space-y-3 pt-1 min-h-0 overflow-hidden">
                    {features.map((f, i) => (
                      <li key={i} className="flex min-w-0 gap-3 shrink-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/10">
                          {f.icon}
                        </span>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {f.title}
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {f.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>

          <p className="relative z-10 text-xs xl:text-sm text-muted-foreground mt-8 shrink-0">
            © {new Date().getFullYear()} 49GIG. All rights reserved.
          </p>
        </div>

        {/* Right column – form (scrolls when content overflows) */}
        <div
          className={cn(
            "flex flex-col min-h-screen lg:h-full lg:min-h-0 lg:overflow-hidden",
            "px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14",
            rightClassName
          )}
        >
          {/* Scrollable area – ensures all content is visible on desktop; natural scroll on mobile */}
          <div className="py-6 sm:py-8 md:py-10 lg:py-12 lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:overflow-x-hidden">
            <div className="flex min-h-full flex-col justify-center">
              <div className="mx-auto w-full max-w-[420px] sm:max-w-[440px]">
            {showMobileLogo && (
              <div className={cn("lg:hidden flex justify-center pb-6", fadeIn)}>
                <Link href="/" aria-label="49GIG Home">
                  <Logo width={110} height={35} priority />
                </Link>
              </div>
            )}

            {cardForm ? (
              <Card className="rounded-2xl border border-border/60 bg-card/95 shadow-xl backdrop-blur-sm overflow-hidden">
                <CardContent className="p-6 sm:p-8">
                  <header className={cn("space-y-2.5 text-left mb-6", fadeIn)} style={{ animationDelay: "50ms" }}>
                    {badge && (
                      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/10">
                        {badge}
                      </div>
                    )}
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                      {heading}
                    </h1>
                    {subline && (
                      <p className="text-sm text-muted-foreground">
                        {subline}
                      </p>
                    )}
                  </header>
                  <div className="space-y-6 text-left">
                    {children}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <header className={cn("space-y-2.5 text-left", fadeIn)} style={{ animationDelay: "50ms" }}>
                  {badge && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/10">
                      {badge}
                    </div>
                  )}
                  <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                    {heading}
                  </h1>
                  {subline && (
                    <p className="text-sm text-muted-foreground">
                      {subline}
                    </p>
                  )}
                </header>
                <div className="space-y-6 text-left">
                  {children}
                </div>
              </div>
            )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
