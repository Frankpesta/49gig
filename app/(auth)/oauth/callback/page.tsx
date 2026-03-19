"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getUserFriendlyError } from "@/lib/error-handling";
import { useSessionRotation } from "@/hooks/use-session";
import { useAnalytics } from "@/hooks/use-analytics";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const handleCallback = useAction((api as any)["auth/oauth"].handleGoogleCallback);
  const { setRefreshToken } = useSessionRotation();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(`OAuth error: ${errorParam}`);
      setIsLoading(false);
      return;
    }

    if (!code || !state) {
      setError("Missing OAuth code or state");
      setIsLoading(false);
      return;
    }

    const processCallback = async () => {
      try {
        const result = await handleCallback({
          code,
          state,
        });

        if (result.success) {
          trackEvent(result.isNewUser ? "sign_up" : "login", { method: "google" });
          // If role selection is needed, redirect to role selection page
          if (result.needsRoleSelection && result.oauthData) {
            // Store OAuth data in sessionStorage for role selection page
            sessionStorage.setItem("oauth_signup_data", JSON.stringify(result.oauthData));
            router.replace("/oauth/select-role");
            return;
          }

          // Store refresh token for automatic rotation
          if (result.refreshToken) {
            setRefreshToken(result.refreshToken);
          }

          // Store session token
          if (result.sessionToken) {
            localStorage.setItem("sessionToken", result.sessionToken);
          }

          // If new user needs onboarding, redirect to onboarding page
          if (result.needsOnboarding) {
            if (result.userRole === "freelancer") {
              router.replace("/onboarding/freelancer");
            } else {
              router.replace("/onboarding/client");
            }
            return;
          }

          // CRITICAL: Check user role and redirect accordingly
          if (result.userRole === "freelancer") {
            // Fully vetted freelancers go straight to dashboard
            if (result.isFullyVetted) {
              router.replace("/dashboard");
              return;
            }
            // Non-fully-vetted freelancers: resume-upload (will redirect to verification if resume already processed)
            localStorage.setItem("pending_resume_upload", "freelancer");
            router.replace("/resume-upload");
          } else {
            // Redirect clients and others to dashboard
            if (result.isNewUser) {
              router.push("/dashboard?welcome=true");
            } else {
              router.push("/dashboard");
            }
          }
        }
      } catch (err: any) {
        setError(getUserFriendlyError(err) || "Failed to complete OAuth login");
        setIsLoading(false);
      }
    };

    processCallback();
  }, [searchParams, handleCallback, setRefreshToken, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-12">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-heading font-bold tracking-tight text-foreground">
              Authentication error
            </h1>
            <p className="text-lg text-muted-foreground">
              There was an error completing your login
            </p>
          </div>
          <Card className="shadow-medium border-border/50">
            <CardHeader className="space-y-2 px-8 pt-8 pb-6">
              <CardTitle className="text-2xl font-heading font-semibold">
                OAuth Error
              </CardTitle>
              <CardDescription>
                There was an error completing your login
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-8 pb-8 pt-0">
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
                {error}
              </div>
              <Button
                onClick={() => router.push("/login")}
                className="w-full h-11 text-base font-medium"
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading</p>
          </div>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}

