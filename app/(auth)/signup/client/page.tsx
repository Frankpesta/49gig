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
import { useOAuth } from "@/hooks/use-oauth";
import { AuthMobileLogo } from "@/components/auth/auth-branding";
import { Logo } from "@/components/ui/logo";
import { CountrySelector } from "@/components/ui/country-selector";
import { countries, getCountryByCode } from "@/lib/countries";

export default function ClientSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    workEmail: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    phoneNumber: "",
    companyWebsite: "",
    country: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const signup = useMutation(
    (api as any)["auth/mutations"].signup
  );
  const { signInWithGoogle } = useOAuth();

  const selectedCountry = formData.country
    ? getCountryByCode(formData.country)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!formData.companyName) {
      setError("Company name is required");
      return;
    }

    if (!formData.country) {
      setError("Country is required");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: "client",
        profile: {
          companyName: formData.companyName,
          workEmail: formData.workEmail || formData.email,
          phoneNumber: formData.phoneNumber
            ? `${selectedCountry?.phoneCode || ""}${formData.phoneNumber}`
            : undefined,
          companyWebsite: formData.companyWebsite || undefined,
          country: formData.country,
        },
      });

      if (result.success) {
        if (result.emailVerificationRequired) {
          router.push("/verify-email");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
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
                Hire top talent
              </h2>
              <p className="text-lg text-muted-foreground">
                Connect with verified freelancers and build your team on 49GIG.
              </p>
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
                Client signup
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Create your account
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Get started by creating a client account
              </p>
            </div>

            {/* Card */}
            <Card className="shadow-2xl border-border/50 bg-background/80 backdrop-blur-xl">
              <CardHeader className="space-y-2 px-8 pt-8 pb-6">
                <CardTitle className="text-2xl font-heading font-semibold">
                  Sign Up as Client
                </CardTitle>
                <CardDescription>
                  Enter your information to create your account
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 px-8 pb-8 pt-0">
                  {error && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  {/* Section 1: Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">
                      Section 1: Personal Information
                    </h3>
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
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
                      <Label
                        htmlFor="confirmPassword"
                        className="text-sm font-medium"
                      >
                        Confirm Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        required
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                  </div>

                  {/* Section 2: Company & Contact Information */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-semibold text-foreground">
                      Section 2: Company & Contact Information
                    </h3>
                    <div className="space-y-3">
                      <Label
                        htmlFor="companyName"
                        className="text-sm font-medium"
                      >
                        Company / Organization Name
                      </Label>
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="Acme Inc."
                        value={formData.companyName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            companyName: e.target.value,
                          })
                        }
                        required
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="workEmail" className="text-sm font-medium">
                        Work Email Address
                      </Label>
                      <Input
                        id="workEmail"
                        type="email"
                        placeholder="work@company.com"
                        value={formData.workEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            workEmail: e.target.value,
                          })
                        }
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="phoneNumber"
                        className="text-sm font-medium"
                      >
                        Phone Number {selectedCountry && `(${selectedCountry.phoneCode})`}
                      </Label>
                      <div className="flex gap-2">
                        <div className="w-[140px]">
                          <CountrySelector
                            value={formData.country}
                            onValueChange={(value) =>
                              setFormData({ ...formData, country: value })
                            }
                            disabled={isLoading}
                            className="w-full"
                          />
                        </div>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          placeholder="1234567890"
                          value={formData.phoneNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              phoneNumber: e.target.value.replace(/\D/g, ""),
                            })
                          }
                          disabled={isLoading || !formData.country}
                          className="h-11 flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="companyWebsite"
                        className="text-sm font-medium"
                      >
                        Company Website (optional)
                      </Label>
                      <Input
                        id="companyWebsite"
                        type="url"
                        placeholder="https://company.com"
                        value={formData.companyWebsite}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            companyWebsite: e.target.value,
                          })
                        }
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="country" className="text-sm font-medium">
                        Country / Region
                      </Label>
                      <CountrySelector
                        value={formData.country}
                        onValueChange={(value) =>
                          setFormData({ ...formData, country: value })
                        }
                        disabled={isLoading}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full h-11 text-base font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  </div>
                </CardContent>
              </form>
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
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 text-base font-medium border-2"
                  disabled={isLoading}
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
                  Sign up with Google
                </Button>
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
