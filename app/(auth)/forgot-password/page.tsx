"use client";

import { useState } from "react";
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
import { AuthTwoColumnLayout } from "@/components/auth/auth-two-column-layout";

const authCardClass =
  "rounded-xl border border-border/60 bg-card shadow-lg";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const requestPasswordReset = useMutation(
    (api as any)["auth/mutations"].requestPasswordReset
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await requestPasswordReset({ email });

      if (result.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to request password reset");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthTwoColumnLayout
        leftTitle="Reset your password"
        leftDescription="We'll send you a secure link to create a new password. Keep it safe."
        badge="Email sent"
        heading="Check your email"
        subline={`We've sent a password reset link to ${email}`}
      >
        <Card className={authCardClass}>
          <CardHeader className="space-y-1 px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
            <CardTitle className="text-xl font-semibold">Email sent</CardTitle>
            <CardDescription>
              If an account exists with this email, you&apos;ll receive instructions to
              reset your password. Check your spam folder if you don&apos;t see it.
            </CardDescription>
          </CardHeader>
          <CardFooter className="border-t border-border/60 px-6 sm:px-8 py-6">
            <Link href="/login" className="w-full">
              <Button
                variant="outline"
                className="w-full h-11 rounded-lg text-sm font-medium border-border/80"
              >
                Back to sign in
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </AuthTwoColumnLayout>
    );
  }

  return (
    <AuthTwoColumnLayout
      leftTitle="Reset your password"
      leftDescription="We'll send you a secure link to create a new password. Keep it safe."
      heading="Reset your password"
      subline="Enter your email to receive a reset link."
    >
      <Card className={authCardClass}>
        <form onSubmit={handleSubmit}>
          <CardHeader className="space-y-1 px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
            <CardTitle className="text-xl font-semibold">Forgot password</CardTitle>
            <CardDescription>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-6 sm:px-8 pb-6 pt-0">
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 rounded-lg"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-lg text-sm font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Sending…" : "Send reset link"}
            </Button>
          </CardContent>
        </form>
        <CardFooter className="border-t border-border/60 px-6 sm:px-8 py-6">
          <Link
            href="/login"
            className="text-center text-sm font-semibold text-primary hover:underline w-full block"
          >
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </AuthTwoColumnLayout>
  );
}
