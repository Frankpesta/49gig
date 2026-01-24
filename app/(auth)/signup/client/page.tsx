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
import { AuthTwoColumnLayout } from "@/components/auth/auth-two-column-layout";
import { clientSignupFeatures } from "@/components/auth/auth-icons";
import { CountrySelector } from "@/components/ui/country-selector";
import { getCountryByCode } from "@/lib/countries";

const authCardClass =
  "rounded-xl border border-border/60 bg-card shadow-lg";

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
    <AuthTwoColumnLayout
      leftTitle="Hire top talent"
      leftDescription="Connect with verified freelancers and build your team on 49GIG."
      features={clientSignupFeatures}
      badge="Client signup"
      heading="Create your account"
      subline="Get started by creating a client account."
    >
      <Card className={authCardClass}>
              <CardHeader className="space-y-1 px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
                <CardTitle className="text-xl font-semibold">Sign up as client</CardTitle>
                <CardDescription>Enter your information to create your account</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5 px-6 sm:px-8 pb-6 pt-0">
                  {error && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">
                      Personal information
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
                        className="h-11 rounded-lg"
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
                        className="h-11 rounded-lg"
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
                        className="h-11 rounded-lg"
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
                        className="h-11 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border/60">
                    <h3 className="text-sm font-semibold text-foreground">
                      Company & contact
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
                        className="h-11 rounded-lg"
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
                        className="h-11 rounded-lg"
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
                          className="h-11 flex-1 rounded-lg"
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
                        className="h-11 rounded-lg"
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

                  <div className="pt-1">
                    <Button
                      type="submit"
                      className="w-full h-11 rounded-lg text-sm font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  </div>
                </CardContent>
              </form>
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
                  <Link href="/login" className="font-semibold text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </Card>
    </AuthTwoColumnLayout>
  );
}
