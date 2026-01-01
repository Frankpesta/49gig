"use client";

import { useState, useEffect } from "react";
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    token: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const resetPassword = useMutation(
    (api as any)["auth/mutations"].resetPassword
  );

  useEffect(() => {
    const email = searchParams.get("email");
    const token = searchParams.get("token");
    if (email && token) {
      setFormData({ ...formData, email, token });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!formData.token || !formData.email) {
      setError("Invalid reset link");
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword({
        email: formData.email,
        token: formData.token,
        newPassword: formData.newPassword,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen">
        <AuthBranding />
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-md space-y-8">
            <AuthMobileLogo />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Password reset
              </h1>
              <p className="text-muted-foreground">
                Your password has been reset successfully
              </p>
            </div>
            <Card className="shadow-medium border-border/50">
            <CardHeader className="space-y-2 px-8 pt-8 pb-6">
              <CardTitle className="text-2xl font-heading font-semibold">
                Success
              </CardTitle>
              <CardDescription>
                Your password has been reset successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 pt-0">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Redirecting to sign in page...
              </p>
            </CardContent>
            <CardFooter className="px-8 pb-8">
              <Link href="/login" className="w-full">
                <Button className="w-full h-11 text-base font-medium">
                  Go to Sign In
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
              Set new password
            </h1>
            <p className="text-muted-foreground">
              Enter your new password below
            </p>
          </div>
          <Card className="shadow-medium border-border/50">
          <CardHeader className="space-y-2 px-8 pt-8 pb-6">
            <CardTitle className="text-2xl font-heading font-semibold">
              Reset Password
            </CardTitle>
            <CardDescription>
              Enter your new password below
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
                <Label htmlFor="newPassword" className="text-sm font-medium">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  required
                  disabled={isLoading}
                  minLength={8}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground pt-1">
                  Must be at least 8 characters
                </p>
              </div>
              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              <div className="pt-2">
                <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Reset Password"}
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

