"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

/**
 * Standalone layout for freelancer verification / onboarding (no dashboard sidebar).
 * Verified freelancers are sent to the main dashboard.
 */
export default function FreelancerOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSessionToken(localStorage.getItem("sessionToken"));
    }
  }, [isAuthenticated]);

  const isVerified = useQuery(
    api.vetting.queries.isFreelancerVerified,
    isAuthenticated && user?.role === "freelancer"
      ? { sessionToken: sessionToken ?? undefined, userId: user?._id }
      : "skip"
  );

  useEffect(() => {
    if (isInitializing || !isAuthenticated) return;
    if (!user || user.role !== "freelancer") {
      router.replace("/login");
      return;
    }
    if (isVerified === undefined) return;
    if (isVerified.verified) {
      router.replace("/dashboard");
    }
  }, [isInitializing, isAuthenticated, user, isVerified, router]);

  if (isInitializing || !isAuthenticated || !user || user.role !== "freelancer") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isVerified === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isVerified.verified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />
      </div>
      <header className="relative z-10 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>49GIG</span>
            <span className="text-muted-foreground font-normal text-sm hidden sm:inline">
              Freelancer verification
            </span>
          </Link>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
            <Link href="/contact">Help</Link>
          </Button>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
