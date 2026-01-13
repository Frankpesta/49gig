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
import { Logo } from "@/components/ui/logo";

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
      <div className="flex min-h-screen">
        {/* Left Column - Branding */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-between bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12">
          <div className="space-y-8">
            <Logo width={140} height={45} priority />
          </div>
          <div className="text-sm text-muted-foreground">
            © 2025 49GIG. All rights reserved.
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center pb-8">
              <Logo width={120} height={38} priority />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Check your email
              </h1>
              <p className="text-muted-foreground">
                We've sent a password reset link
              </p>
            </div>
            <Card className="shadow-2xl border-border/50 bg-background/80 backdrop-blur-xl">
            <CardHeader className="space-y-2 px-8 pt-8 pb-6">
              <CardTitle className="text-2xl font-heading font-semibold">
                Email Sent
              </CardTitle>
              <CardDescription>
                We've sent a password reset link to {email}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 pt-0">
              <p className="text-sm text-muted-foreground leading-relaxed">
                If an account exists with this email, you'll receive instructions
                to reset your password. Please check your spam folder if you don't
                see it.
              </p>
            </CardContent>
            <CardFooter className="px-8 pb-8">
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

  return (
    <div className="flex min-h-screen">
      {/* Left Column - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-between bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12">
        <div className="space-y-8">
          <Logo width={140} height={45} priority />
        </div>
        <div className="text-sm text-muted-foreground">
          © 2025 49GIG. All rights reserved.
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center pb-8">
            <Logo width={120} height={38} priority />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Reset your password
            </h1>
            <p className="text-muted-foreground">
              Enter your email to receive a reset link
            </p>
          </div>
          <Card className="shadow-2xl border-border/50 bg-background/80 backdrop-blur-xl">
          <CardHeader className="space-y-2 px-8 pt-8 pb-6">
            <CardTitle className="text-2xl font-heading font-semibold">
              Forgot Password
            </CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 px-8 pb-8 pt-0">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-3">
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
                  className="h-11"
                />
              </div>
              <div className="pt-2">
                <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>
            </CardContent>
          </form>
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

