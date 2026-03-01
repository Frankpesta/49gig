"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSessionRotation } from "@/hooks/use-session";
import { useOAuth } from "@/hooks/use-oauth";
import { AuthTwoColumnLayout } from "@/components/auth/auth-two-column-layout";
import { loginFeatures } from "@/components/auth/auth-icons";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorTokenId, setTwoFactorTokenId] = useState<string | null>(null);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const signin = useMutation((api as any)["auth/mutations"].signin);
  const verifyTwoFactorSignin = useMutation((api as any)["auth/mutations"].verifyTwoFactorSignin);
  const { setRefreshToken } = useSessionRotation();
  const { signInWithGoogle, isGoogleLoading } = useOAuth();

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (requiresTwoFactor && twoFactorTokenId) {
        const result = await verifyTwoFactorSignin({
          tokenId: twoFactorTokenId,
          code: twoFactorCode,
        });

        if (result.success && result.refreshToken) {
          setRefreshToken(result.refreshToken);
          if (result.sessionToken) {
            localStorage.setItem("sessionToken", result.sessionToken);
          }
          await new Promise((resolve) => setTimeout(resolve, 50));

          if (result.userRole === "freelancer") {
            router.replace((result as { isFullyVetted?: boolean }).isFullyVetted ? "/dashboard" : "/verification");
          } else {
            router.push("/dashboard");
          }
        }
        return;
      }

      const result = await signin({
        email,
        password,
      });

      if (result.requiresEmailVerification && result.email) {
        sessionStorage.setItem("pending_verify_email", result.email);
        router.replace("/verify-email");
        return;
      }

      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setTwoFactorTokenId(result.twoFactorTokenId);
        setError("");
        return;
      }

      if (result.success && result.refreshToken) {
        setRefreshToken(result.refreshToken);
        if (result.sessionToken) {
          localStorage.setItem("sessionToken", result.sessionToken);
        }
        await new Promise((resolve) => setTimeout(resolve, 50));

        if (result.userRole === "freelancer") {
          router.replace((result as { isFullyVetted?: boolean }).isFullyVetted ? "/dashboard" : "/verification");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sign in";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthTwoColumnLayout
      leftTitle="Welcome back to 49GIG"
      leftDescription="Continue your journey connecting with vetted freelancers and trusted clients across the globe."
      features={loginFeatures}
      badge="Secure access to your 49GIG workspace"
      heading="Sign in to your account"
      subline="Enter your credentials to access your dashboard."
    >
      <form onSubmit={handleSubmit} className="w-full space-y-5">
        {!requiresTwoFactor && (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-lg text-sm font-medium border-border/60 bg-muted/30 hover:bg-muted/50"
              disabled={isLoading || isGoogleLoading}
              onClick={() => signInWithGoogle(undefined)}
            >
              {isGoogleLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Redirecting...
                </span>
              ) : (
                <>
                  <svg className="mr-2.5 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground font-medium">Or</span>
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!requiresTwoFactor ? (
          <>
            <div className="space-y-0.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="eg. you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 rounded-lg"
              />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 rounded-lg pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
            </div>
          </>
        ) : (
          <div className="space-y-0.5">
            <Label htmlFor="twoFactorCode" className="text-sm font-medium">Verification code</Label>
            <Input
              id="twoFactorCode"
              type="text"
              placeholder="Enter the 6-digit code"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              required
              disabled={isLoading}
              className="h-11 rounded-lg"
            />
            <p className="text-xs text-muted-foreground">We sent a 6-digit code to your email.</p>
          </div>
        )}

        <Button type="submit" className="w-full h-11 rounded-lg text-sm font-semibold" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {requiresTwoFactor ? "Verifying..." : "Signing in..."}
            </span>
          ) : requiresTwoFactor ? "Verify & sign in" : "Sign in"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">Create account</Link>
        </p>
      </form>
    </AuthTwoColumnLayout>
  );
}
