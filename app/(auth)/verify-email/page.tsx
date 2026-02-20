"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AuthTwoColumnLayout } from "@/components/auth/auth-two-column-layout";
import { loginFeatures } from "@/components/auth/auth-icons";
import { REGEXP_ONLY_DIGITS } from "input-otp";

const authCardClass =
  "rounded-xl border border-border/60 bg-card shadow-lg";

function VerifyEmailContent() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
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
    if (typeof window !== "undefined") {
      setSessionToken(localStorage.getItem("sessionToken"));
      setPendingEmail(sessionStorage.getItem("pending_verify_email"));
    }
  }, []);

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

  const handleVerify = async (verifyCode: string) => {
    if (verifyCode.length !== 6) return;
    if (isLoading || success) return; // Prevent double-submit
    setIsLoading(true);
    setError("");
    try {
      const result = await verifyEmail({ code: verifyCode });
      if (result.success) {
      setSuccess(true);
      sessionStorage.removeItem("pending_verify_email");
    }
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to verify email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError("");
    setResendSuccess(false);
    try {
      await resendVerification({
        sessionToken: sessionToken || undefined,
        email: !sessionToken && pendingEmail ? pendingEmail : undefined,
      });
      setResendSuccess(true);
      setCode("");
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  const handleCodeComplete = (value: string) => {
    if (value.length === 6) {
      handleVerify(value);
    }
  };

  if (success) {
    return (
      <AuthTwoColumnLayout
        leftTitle="Email verified"
        leftDescription="Your email has been verified successfully. You're all set to use 49GIG."
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
      leftDescription="We sent a 6-digit verification code to your inbox. Enter it below to complete sign-up."
      features={loginFeatures}
      heading="Verify your email"
      subline="Enter the 6-digit code from your email."
    >
      <Card className={authCardClass}>
        <CardHeader className="space-y-2 px-4 pt-6 pb-4 sm:px-6 lg:px-8 sm:pt-8 sm:pb-6">
          <CardTitle className="text-xl font-semibold sm:text-2xl">
            Email verification
          </CardTitle>
          <CardDescription>
            Enter the 6-digit code we sent to your email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-4 pb-6 pt-0 sm:px-6 lg:px-8 sm:pb-8">
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive sm:p-4">
              {error}
            </div>
          )}
          {resendSuccess && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground sm:p-4">
              We've sent a new verification code. Check your inbox.
            </div>
          )}
          <div className="space-y-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                value={code}
                onChange={setCode}
                onComplete={handleCodeComplete}
                disabled={isLoading}
              >
                <InputOTPGroup className="flex-nowrap justify-center gap-1 sm:gap-2">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button
              onClick={() => handleVerify(code)}
              className="w-full h-11 rounded-lg text-base font-medium"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? "Verifying…" : "Verify email"}
            </Button>
          </div>
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
            {isResending ? "Sending…" : "Resend verification code"}
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
          leftDescription="We sent a 6-digit verification code to your inbox."
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
