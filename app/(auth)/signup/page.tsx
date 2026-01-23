"use client";

import { useState } from "react";
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
import { useOAuth } from "@/hooks/use-oauth";
import { AuthMobileLogo } from "@/components/auth/auth-branding";
import { Logo } from "@/components/ui/logo";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<"client" | "freelancer" | null>(null);
  const { signInWithGoogle } = useOAuth();

  const handleRoleSelect = (selectedRole: "client" | "freelancer") => {
    setRole(selectedRole);
    // Redirect to role-specific signup page
    router.push(`/signup/${selectedRole}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-background via-primary/5 to-background">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-12 top-8 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 bottom-10 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen">
        {/* Left Column - Branding */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-between bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12">
          <div className="space-y-8">
            <Logo width={140} height={45} priority />
          </div>

          <div className="space-y-6 max-w-md">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">
                Join 49GIG today
              </h2>
              <p className="text-lg text-muted-foreground">
                Start your journey in a high-trust freelance marketplace. Connect with verified talent and trusted clients.
              </p>
            </div>

            <div className="space-y-4 pt-8">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Comprehensive Verification</h3>
                  <p className="text-sm text-muted-foreground">
                    Freelancers undergo identity, skills, and English proficiency checks
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Curated Marketplace</h3>
                  <p className="text-sm text-muted-foreground">
                    No bidding wars. Smart algorithmic matching for perfect fits
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Protected Payments</h3>
                  <p className="text-sm text-muted-foreground">
                    Pre-funded projects with escrowed milestone payments
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            © 2025 49GIG. All rights reserved.
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-md space-y-10">
            <AuthMobileLogo />

            {/* Header */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Join a high-trust talent marketplace
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Create your account
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Choose how you want to use 49GIG
              </p>
            </div>

            {/* Card */}
            <Card className="shadow-2xl border-border/50 bg-background/80 backdrop-blur-xl">
              <CardHeader className="space-y-2 px-8 pt-8 pb-6">
                <CardTitle className="text-2xl font-heading font-semibold">
                  I am a
                </CardTitle>
                <CardDescription>
                  Select your role to continue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-8 pb-8 pt-0">
                <button
                  type="button"
                  onClick={() => handleRoleSelect("client")}
                  className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                    role === "client"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-foreground text-lg">
                      Client
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      I want to hire freelancers for my projects
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect("freelancer")}
                  className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                    role === "freelancer"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-foreground text-lg">
                      Freelancer
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      I want to work on projects and get paid
                    </div>
                  </div>
                </button>
              </CardContent>
              <CardFooter className="flex flex-col space-y-6 pt-8 pb-8 px-8 border-t">
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-3 text-muted-foreground font-medium">
                      Or continue with
                    </span>
                  </div>
                </div>
                <div className="w-full space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 text-base font-medium border-2"
                    onClick={() => signInWithGoogle("client")}
                  >
                    <svg
                      className="mr-2 h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Sign up as Client with Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 text-base font-medium border-2"
                    onClick={() => signInWithGoogle("freelancer")}
                  >
                    <svg
                      className="mr-2 h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Sign up as Freelancer with Google
                  </Button>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-primary hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
