"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { useAuthStore } from "@/stores/authStore";
import { useSessionRotation } from "@/hooks/use-session";
import { useOAuth } from "@/hooks/use-oauth";
import { AuthTwoColumnLayout } from "@/components/auth/auth-two-column-layout";
import { loginFeatures } from "@/components/auth/auth-icons";

const authCardClass =
  "rounded-xl border border-border/60 bg-card shadow-lg";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorTokenId, setTwoFactorTokenId] = useState<string | null>(null);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const signin = useMutation(
    (api as any)["auth/mutations"].signin
  );
  const verifyTwoFactorSignin = useMutation(
    (api as any)["auth/mutations"].verifyTwoFactorSignin
  );
  const { setUser } = useAuthStore();
  const { setRefreshToken } = useSessionRotation();
  const { signInWithGoogle } = useOAuth();

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
            router.replace("/verification");
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
          router.replace("/verification");
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
      leftDescription="Connect with vetted freelancers and trusted clients in a high-trust marketplace."
      features={loginFeatures}
      badge="Trusted access to the 49GIG network"
      heading="Sign in"
      subline="Enter your credentials to access your account."
    >
      <Card className={authCardClass}>
        <form onSubmit={handleSubmit}>
          <CardHeader className="space-y-1 px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
            <CardTitle className="text-xl font-semibold">Sign In</CardTitle>
            <CardDescription>Email and password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-6 sm:px-8 pb-6 pt-0">
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {!requiresTwoFactor ? (
              <>
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11 rounded-lg"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="twoFactorCode" className="text-sm font-medium">
                  Verification code
                </Label>
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
                <p className="text-xs text-muted-foreground">
                  We sent a verification code to your email.
                </p>
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-11 rounded-lg text-sm font-medium"
              disabled={isLoading}
            >
              {isLoading
                ? requiresTwoFactor
                  ? "Verifying..."
                  : "Signing in..."
                : requiresTwoFactor
                  ? "Verify & sign in"
                  : "Sign in"}
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col gap-5 border-t border-border/60 px-6 sm:px-8 py-6">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-lg text-sm font-medium border-border/80"
              disabled={isLoading}
              onClick={() => signInWithGoogle(undefined)}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthTwoColumnLayout>
  );
}
