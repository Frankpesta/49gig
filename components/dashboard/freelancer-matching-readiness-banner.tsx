"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { AlertCircle, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MatchingReadinessIssue } from "@/lib/freelancer-matching-readiness";

type FreelancerMatchingReadinessBannerProps = {
  className?: string;
  /**
   * When defined (including `[]`), skips the internal Convex query.
   * Parent can load issues once and pass them here.
   */
  issuesOverride?: MatchingReadinessIssue[] | undefined;
};

export function FreelancerMatchingReadinessBanner({
  className,
  issuesOverride,
}: FreelancerMatchingReadinessBannerProps) {
  const { user } = useAuth();
  const useInternal = issuesOverride === undefined;
  const readiness = useQuery(
    api.users.queries.getMyFreelancerMatchingReadiness,
    useInternal && user?._id && user.role === "freelancer"
      ? { userId: user._id }
      : "skip"
  );

  if (!user || user.role !== "freelancer") return null;

  const issues = useInternal ? readiness?.issues : issuesOverride;
  if (useInternal && readiness === undefined) return null;

  if (!issues?.length) return null;

  const primary = issues[0]!;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-amber-500/25 bg-linear-to-br from-amber-500/[0.08] via-background to-orange-500/[0.06] shadow-sm",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-orange-400/10 blur-2xl" />

      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
                <ShieldAlert className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-foreground tracking-tight">
                  You&apos;re not eligible for client matching yet
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {primary.description}
                </p>
                {issues.length > 1 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    {issues.length - 1} more item{issues.length > 2 ? "s" : ""} to fix after this one.
                  </p>
                )}
              </div>
            </div>
            <Button
              asChild
              size="sm"
              className="shrink-0 rounded-xl gap-1.5 shadow-sm sm:self-center"
            >
              <Link href={primary.href}>
                {primary.actionLabel}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
          </div>

          {issues.length > 1 && (
            <ul className="mt-4 space-y-2 border-t border-border/50 pt-4">
              {issues.slice(1).map((issue) => (
                <li key={issue.id} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" aria-hidden />
                  <span className="text-muted-foreground min-w-0">
                    <span className="font-medium text-foreground">{issue.title}</span>
                    {" — "}
                    <Link
                      href={issue.href}
                      className="text-primary underline-offset-4 hover:underline font-medium"
                    >
                      {issue.actionLabel}
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-600/80 dark:text-amber-400/80" aria-hidden />
            <span>
              Once everything here is complete, you can appear when clients search for talent that fits your profile and skills.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
