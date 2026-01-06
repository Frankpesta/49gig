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
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AuthBranding, AuthMobileLogo } from "@/components/auth/auth-branding";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const verifyEmail = useMutation(
    (api as any)["auth/mutations"].verifyEmail
  );
  const resendVerification = useMutation(
    (api as any)["auth/mutations"].resendEmailVerification
  );

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
      handleVerify(tokenParam);
    }
  }, [searchParams]);

  const handleVerify = async (verifyToken: string) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await verifyEmail({ token: verifyToken });

      if (result.success) {
        setSuccess(true);
        // Note: We'll redirect to dashboard, but the layout will check
        // and redirect freelancers to verification if needed
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
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
      await resendVerification({});
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  if (success && !token) {
    return (
      <div className="flex min-h-screen">
        <AuthBranding />
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-md space-y-8">
            <AuthMobileLogo />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Verification sent
              </h1>
              <p className="text-muted-foreground">
                Check your inbox for the verification email
              </p>
            </div>
            <Card className="shadow-medium border-border/50">
            <CardHeader className="space-y-2 px-8 pt-8 pb-6">
              <CardTitle className="text-2xl font-heading font-semibold">
                Email Sent
              </CardTitle>
              <CardDescription>
                We've sent a new verification email. Please check your inbox.
              </CardDescription>
            </CardHeader>
            <CardFooter className="px-8 pb-8 pt-0">
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full h-11 text-base font-medium border-2">
                  Back to Sign In
                </Button>
              </Link>
            </CardFooter>
          </Card>
          </div>
        </div>
      </div>
    );
  }

  if (success && token) {
    return (
      <div className="flex min-h-screen">
        <AuthBranding />
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-md space-y-8">
            <AuthMobileLogo />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Email verified
              </h1>
              <p className="text-muted-foreground">
                Your email has been verified successfully
              </p>
            </div>
            <Card className="shadow-medium border-border/50">
            <CardHeader className="space-y-2 px-8 pt-8 pb-6">
              <CardTitle className="text-2xl font-heading font-semibold">
                Verification Complete
              </CardTitle>
              <CardDescription>
                Your email has been verified successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 pt-0">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Redirecting to dashboard...
              </p>
            </CardContent>
            <CardFooter className="px-8 pb-8">
              <Link href="/dashboard" className="w-full">
                <Button className="w-full h-11 text-base font-medium">
                  Go to Dashboard
                </Button>
              </Link>
            </CardFooter>
          </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AuthBranding />
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md space-y-8">
          <AuthMobileLogo />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Verify your email
            </h1>
            <p className="text-muted-foreground">
              Enter the verification token from your email
            </p>
          </div>
          <Card className="shadow-medium border-border/50">
          <CardHeader className="space-y-2 px-8 pt-8 pb-6">
            <CardTitle className="text-2xl font-heading font-semibold">
              Email Verification
            </CardTitle>
            <CardDescription>
              Enter the verification token sent to your email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8 pt-0">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-3">
              <Label htmlFor="token" className="text-sm font-medium">
                Verification Token
              </Label>
              <Input
                id="token"
                type="text"
                placeholder="Enter verification token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={isLoading}
                className="h-11"
              />
            </div>
            <div className="pt-2">
              <Button
                onClick={() => handleVerify(token)}
                className="w-full h-11 text-base font-medium"
                disabled={isLoading || !token}
              >
                {isLoading ? "Verifying..." : "Verify Email"}
              </Button>
            </div>
            <div className="relative pt-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-4 text-muted-foreground font-medium">
                  Or
                </span>
              </div>
            </div>
            <Button
              onClick={handleResend}
              variant="outline"
              className="w-full h-11 text-base font-medium border-2"
              disabled={isResending}
            >
              {isResending ? "Sending..." : "Resend Verification Email"}
            </Button>
          </CardContent>
          <CardFooter className="pt-8 pb-8 px-8 border-t">
            <Link
              href="/login"
              className="text-center text-sm text-primary hover:underline font-semibold w-full"
            >
              Back to Sign In
            </Link>
          </CardFooter>
        </Card>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen">
          <AuthBranding />
          <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-md space-y-8">
              <AuthMobileLogo />
              <Card className="shadow-medium border-border/50">
                <CardContent className="px-8 py-8">
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

