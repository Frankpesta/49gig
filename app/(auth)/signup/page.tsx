"use client";

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
import { AuthTwoColumnLayout } from "@/components/auth/auth-two-column-layout";
import { signupFeatures } from "@/components/auth/auth-icons";

const authCardClass =
  "rounded-xl border border-border/60 bg-card shadow-lg";

export default function SignupPage() {
  const router = useRouter();
  const { signInWithGoogle, isGoogleLoading } = useOAuth();

  const handleRoleSelect = (role: "client" | "freelancer") => {
    router.push(`/signup/${role}`);
  };

  return (
    <AuthTwoColumnLayout
      leftTitle="Join 49GIG"
      leftDescription="Start your journey in a trusted global marketplace connecting vetted freelancers with leading companies."
      features={signupFeatures}
      badge="Create your 49GIG account"
      heading="Choose your role"
      subline="Tell us how you'd like to use 49GIG to get started."
    >
      <div className="w-full space-y-6">
        {/* Role Selection Cards */}
        <div className="space-y-3.5">
          <button
            type="button"
            onClick={() => handleRoleSelect("client")}
            className="w-full group relative overflow-hidden rounded-xl border-2 border-border/50 bg-background/50 p-5 text-left transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg active:scale-[0.99]"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-foreground">Client</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Post projects and hire vetted freelancers
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect("freelancer")}
            className="w-full group relative overflow-hidden rounded-xl border-2 border-border/50 bg-background/50 p-5 text-left transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg active:scale-[0.99]"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m0 10v-4l8 4" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-foreground">Freelancer</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Find opportunities and earn from global clients
              </p>
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/30" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-3 text-muted-foreground font-medium">
              Or sign up with
            </span>
          </div>
        </div>

        {/* Google Sign Up Option */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 rounded-lg text-sm font-semibold border-border/50 hover:bg-muted/50 transition-colors"
          disabled={isGoogleLoading}
          onClick={() => signInWithGoogle("client")}
        >
          {isGoogleLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Redirecting to Google...
            </span>
          ) : (
            <>
              <svg className="mr-2.5 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign up with Google
            </>
          )}
        </Button>

        {/* Sign In Link */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Sign in here
          </Link>
        </p>
      </div>
    </AuthTwoColumnLayout>
  );
}
