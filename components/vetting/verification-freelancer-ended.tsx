"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, XCircle } from "lucide-react";

type Props = {
  /** Seconds before auto-redirect to home */
  redirectSeconds?: number;
  /**
   * `failed_or_removed` — verification data missing while still signed in (typical after final test fail + account removal).
   * `session_revoked` — auth dropped after we know the user was signed in (session invalidated).
   */
  variant?: "failed_or_removed" | "session_revoked";
};

const COPY = {
  failed_or_removed: {
    title: "Verification did not pass",
    description: (
      <>
        If this was your <strong>second attempt</strong> on the English or skill test and your score was still below
        our minimum, your application is closed for this cycle and your account session may have ended.
      </>
    ),
  },
  session_revoked: {
    title: "Verification session ended",
    description: (
      <>
        Your tests did not meet our minimum requirements after your allowed attempts, or your application was closed
        for this cycle. Your session has been ended.
      </>
    ),
  },
} as const;

/**
 * Shown when freelancer verification can no longer continue (final test fail, account removed,
 * session revoked). Replaces endless spinners and vague "Unable to load" copy.
 */
export function VerificationFreelancerEndedCard({
  redirectSeconds = 10,
  variant = "failed_or_removed",
}: Props) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(redirectSeconds);
  const didRedirect = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      setRemaining((s) => {
        const next = s - 1;
        if (next <= 0 && !didRedirect.current) {
          didRedirect.current = true;
          router.replace("/");
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [router]);

  const { title, description } = COPY[variant];

  return (
    <div className="mx-auto max-w-lg py-8 px-4">
      <Card className="rounded-2xl border-destructive/30 bg-destructive/5 shadow-sm">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-center text-xl">{title}</CardTitle>
          <CardDescription className="text-center text-base leading-relaxed">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pb-2">
          <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-background/80 p-4">
            <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              We sent you an email with a short explanation. Please check your inbox and spam folder.
            </p>
          </div>
          <div className="rounded-xl border border-destructive/25 bg-background/80 p-4 text-center space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Returning to home</p>
            <p className="font-mono text-3xl font-semibold tabular-nums text-destructive">{Math.max(0, remaining)}s</p>
          </div>
          <Button variant="outline" className="w-full rounded-xl" type="button" onClick={() => router.replace("/")}>
            Go to home now
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>{" "}
            only if you still have an active account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
