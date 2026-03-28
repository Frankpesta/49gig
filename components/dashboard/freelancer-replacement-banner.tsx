"use client";

import Link from "next/link";
import { ArrowRight, RefreshCw, Shield, Sparkles, UserSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type Props = {
  projectId: Id<"projects">;
  /** When true, primary CTA scrolls / focuses matches on same page */
  compact?: boolean;
  title?: string;
  className?: string;
};

const steps = [
  {
    icon: UserSearch,
    title: "Review candidates",
    body: "We’ve generated fresh matches that fit your hire. Compare profiles and scores.",
  },
  {
    icon: Shield,
    title: "Select & sign",
    body: "Choose your replacement and complete the contract — the same escrow protects the hire.",
  },
  {
    icon: Sparkles,
    title: "Resume work",
    body: "Once signed, monthly billing continues as before with your new freelancer.",
  },
];

export function FreelancerReplacementBanner({
  projectId,
  compact,
  title = "Freelancer replacement",
  className,
}: Props) {
  const matchesHref = `/dashboard/projects/${projectId}/matches`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-amber-500/25 bg-linear-to-br from-amber-500/8 via-background to-violet-500/6 shadow-sm",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-start md:justify-between md:gap-8">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              <RefreshCw className="h-3 w-3" aria-hidden />
              Action required
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {title}
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              A dispute was resolved in favor of assigning a new freelancer. Your funds stay in escrow;
              pick a replacement to get the hire moving again.
            </p>
          </div>

          {!compact && (
            <ol className="mt-4 grid gap-3 sm:grid-cols-3">
              {steps.map((step, i) => (
                <li
                  key={step.title}
                  className="flex gap-3 rounded-xl border border-border/60 bg-background/60 p-3 backdrop-blur-sm"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      Step {i + 1}
                    </p>
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
          {compact ? (
            <Button asChild className="rounded-xl shadow-sm">
              <Link href={`${matchesHref}#replacement-matches-anchor`}>
                View matches
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="rounded-xl shadow-sm">
              <Link href={matchesHref}>
                Choose replacement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild className="rounded-xl border-border/80 bg-background/80">
            <Link href={`/dashboard/projects/${projectId}`}>Hire overview</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
