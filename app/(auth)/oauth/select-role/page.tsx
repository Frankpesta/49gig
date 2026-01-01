"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSessionRotation } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthBranding, AuthMobileLogo } from "@/components/auth/auth-branding";

export default function SelectRolePage() {
  const router = useRouter();
  const [role, setRole] = useState<"client" | "freelancer" | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthData, setOauthData] = useState<any>(null);
  const completeSignup = useAction((api as any)["auth/oauth"].completeOAuthSignup);
  const { setRefreshToken } = useSessionRotation();

  useEffect(() => {
    // Get OAuth data from sessionStorage
    const storedData = sessionStorage.getItem("oauth_signup_data");
    if (!storedData) {
      // No OAuth data found, redirect to signup
      router.replace("/signup");
      return;
    }

    try {
      const data = JSON.parse(storedData);
      setOauthData(data);
    } catch (err) {
      setError("Invalid signup data. Please try again.");
      router.replace("/signup");
    }
  }, [router]);

  const handleSubmit = async () => {
    if (!role || !oauthData) {
      setError("Please select a role");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await completeSignup({
        oauthData,
        role,
      });

      if (result.success) {
        // Clear OAuth data from sessionStorage
        sessionStorage.removeItem("oauth_signup_data");

        // Store refresh token for automatic rotation
        if (result.refreshToken) {
          setRefreshToken(result.refreshToken);
        }

        // Store session token
        if (result.sessionToken) {
          localStorage.setItem("sessionToken", result.sessionToken);
        }

        // CRITICAL: Check user role and redirect accordingly
        // Freelancers MUST go to verification page immediately
        if (result.userRole === "freelancer") {
          router.replace("/verification");
        } else {
          // Redirect clients to dashboard
          router.push("/dashboard?welcome=true");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to complete signup");
      setIsLoading(false);
    }
  };

  if (!oauthData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
              Choose your role
            </h1>
            <p className="text-muted-foreground">
              Select how you want to use 49GIG
            </p>
          </div>

          <Card className="shadow-medium border-border/50">
            <CardHeader className="space-y-2 px-8 pt-8 pb-6">
              <CardTitle className="text-2xl font-heading font-semibold">
                I am a
              </CardTitle>
              <CardDescription>
                Choose the role that best describes you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-8 pb-8 pt-0">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <label
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    role === "client"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="client"
                    checked={role === "client"}
                    onChange={() => setRole("client")}
                    disabled={isLoading}
                    className="mt-1 w-4 h-4 text-primary border-border focus:ring-primary focus:ring-2 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">Client</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      I want to hire freelancers for my projects
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    role === "freelancer"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="freelancer"
                    checked={role === "freelancer"}
                    onChange={() => setRole("freelancer")}
                    disabled={isLoading}
                    className="mt-1 w-4 h-4 text-primary border-border focus:ring-primary focus:ring-2 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">Freelancer</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      I want to work on projects and get paid
                    </div>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleSubmit}
                  className="w-full h-11 text-base font-medium"
                  disabled={isLoading || !role}
                >
                  {isLoading ? "Creating account..." : "Continue"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

