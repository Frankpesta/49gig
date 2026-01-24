"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AuthTwoColumnLayout } from "@/components/auth/auth-two-column-layout";
import { loginFeatures } from "@/components/auth/auth-icons";

const authCardClass =
  "rounded-xl border border-border/60 bg-card shadow-lg";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const verifyEmail = useMutation(
    (api as any)["auth/mutations"].verifyEmail
  );
  const resendVerification = useMutation(
    (api as any)["auth/mutations"].resendEmailVerification
  );

  const userProfile = useQuery(
    api.users.queries.getCurrentUserProfile,
    success ? {} : "skip"
  );

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
      handleVerify(tokenParam);
    }
    if (typeof window !== "undefined") {
      setSessionToken(localStorage.getItem("sessionToken"));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!success || !userProfile) return;

    const isFreelancer = userProfile.role === "freelancer";
    const hasPendingFlag =
      typeof window !== "undefined" &&
      localStorage.getItem("pending_resume_upload");

    if (isFreelancer || hasPendingFlag) {
      if (typeof window !== "undefined" && isFreelancer) {
        localStorage.setItem("pending_resume_upload", "freelancer");
      }
      setTimeout(() => router.replace("/resume-upload"), 1200);
    } else {
      setTimeout(() => router.push("/dashboard"), 1200);
    }
  }, [success, userProfile, router]);

  const handleVerify = async (verifyToken: string) => {
    setIsLoading(true);
    setError("");
    try {
      const result = await verifyEmail({ token: verifyToken });
      if (result.success) setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to verify email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError("");
    try {
      await resendVerification({ sessionToken: sessionToken || undefined });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  if (success && !token) {
    return (
      <AuthTwoColumnLayout
        leftTitle="Email verification"
        leftDescription="We&apos;ve sent a new verification link to your inbox. Check your email to continue."
        features={loginFeatures}
        heading="Verification sent"
        subline="Check your inbox for the verification email."
      >
        <Card className={authCardClass}>
          <CardHeader className="space-y-2 px-4 pt-6 pb-4 sm:px-6 lg:px-8 sm:pt-8 sm:pb-6">
            <CardTitle className="text-xl font-semibold sm:text-2xl">
              Email sent
            </CardTitle>
            <CardDescription>
              We&apos;ve sent a new verification email. Please check your inbox.
            </CardDescription>
          </CardHeader>
          <CardFooter className="px-4 pb-6 pt-0 sm:px-6 lg:px-8 sm:pb-8">
            <Link href="/login" className="w-full">
              <Button
                variant="outline"
                className="w-full h-11 rounded-lg text-base font-medium border-2"
              >
                Back to Sign In
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </AuthTwoColumnLayout>
    );
  }

  if (success && token) {
    return (
      <AuthTwoColumnLayout
        leftTitle="Email verified"
        leftDescription="Your email has been verified successfully. You&apos;re all set to use 49GIG."
        features={loginFeatures}
        heading="Verification complete"
        subline="Your email has been verified successfully."
      >
        <Card className={authCardClass}>
          <CardHeader className="space-y-2 px-4 pt-6 pb-4 sm:px-6 lg:px-8 sm:pt-8 sm:pb-6">
            <CardTitle className="text-xl font-semibold sm:text-2xl">
              All set
            </CardTitle>
            <CardDescription>
              Redirecting you to the next step…
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 lg:px-8 sm:pb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Redirecting to dashboard…
            </p>
          </CardContent>
          <CardFooter className="px-4 pb-6 sm:px-6 lg:px-8 sm:pb-8 border-t pt-6">
            <Link href="/dashboard" className="w-full">
              <Button className="w-full h-11 rounded-lg text-base font-medium">
                Go to Dashboard
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </AuthTwoColumnLayout>
    );
  }

  return (
    <AuthTwoColumnLayout
      leftTitle="Verify your email"
      leftDescription="Enter the verification token we sent to your email to complete sign-up."
      features={loginFeatures}
      heading="Verify your email"
      subline="Enter the verification token from your email."
    >
      <Card className={authCardClass}>
        <CardHeader className="space-y-2 px-4 pt-6 pb-4 sm:px-6 lg:px-8 sm:pt-8 sm:pb-6">
          <CardTitle className="text-xl font-semibold sm:text-2xl">
            Email verification
          </CardTitle>
          <CardDescription>
            Enter the verification token sent to your email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-4 pb-6 pt-0 sm:px-6 lg:px-8 sm:pb-8">
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive sm:p-4">
              {error}
            </div>
          )}
          <div className="space-y-3">
            <Label htmlFor="token" className="text-sm font-medium">
              Verification token
            </Label>
            <Input
              id="token"
              type="text"
              placeholder="Enter verification token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isLoading}
              className="h-11 rounded-lg"
            />
          </div>
          <Button
            onClick={() => handleVerify(token)}
            className="w-full h-11 rounded-lg text-base font-medium"
            disabled={isLoading || !token}
          >
            {isLoading ? "Verifying…" : "Verify email"}
          </Button>
          <div className="relative pt-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-4 text-xs font-medium uppercase text-muted-foreground">
                Or
              </span>
            </div>
          </div>
          <Button
            onClick={handleResend}
            variant="outline"
            className="w-full h-11 rounded-lg border-2 text-base font-medium"
            disabled={isResending}
          >
            {isResending ? "Sending…" : "Resend verification email"}
          </Button>
        </CardContent>
        <CardFooter className="border-t px-4 pb-6 pt-6 sm:px-6 lg:px-8 sm:pb-8">
          <Link
            href="/login"
            className="w-full text-center text-sm font-semibold text-primary hover:underline"
          >
            Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    </AuthTwoColumnLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthTwoColumnLayout
          leftTitle="Verify your email"
          leftDescription="Enter the verification token we sent to your email."
          features={loginFeatures}
          heading="Loading…"
          subline="Please wait."
        >
          <Card className={authCardClass}>
            <CardContent className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </CardContent>
          </Card>
        </AuthTwoColumnLayout>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
