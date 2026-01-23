"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/logo";
import { CountrySelector } from "@/components/ui/country-selector";
import { getCountryByCode } from "@/lib/countries";
import { toast } from "sonner";

export default function ClientOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    companyName: "",
    workEmail: "",
    phoneNumber: "",
    companyWebsite: "",
    country: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const updateProfile = useMutation(
    (api as any)["users/mutations"].updateProfile
  );

  useEffect(() => {
    // Pre-fill with existing profile data if available
    if (user?.profile) {
      setFormData({
        companyName: user.profile.companyName || "",
        workEmail: user.profile.workEmail || user.email || "",
        phoneNumber: user.profile.phoneNumber || "",
        companyWebsite: user.profile.companyWebsite || "",
        country: user.profile.country || "",
      });
    } else {
      // Pre-fill work email with user email
      setFormData((prev) => ({
        ...prev,
        workEmail: user?.email || "",
      }));
    }
  }, [user]);

  const selectedCountry = formData.country
    ? getCountryByCode(formData.country)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
      await updateProfile({
        profile: {
          companyName: formData.companyName,
          workEmail: formData.workEmail || user?.email,
          phoneNumber: formData.phoneNumber
            ? `${selectedCountry?.phoneCode || ""}${formData.phoneNumber}`
            : undefined,
          companyWebsite: formData.companyWebsite || undefined,
          country: formData.country,
        },
      });

      toast.success("Profile updated successfully");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-background via-primary/5 to-background">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-12 top-8 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 bottom-10 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md space-y-10">
          <div className="flex justify-center">
            <Logo width={140} height={45} priority />
          </div>

          <div className="space-y-3 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Complete your profile
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Please provide your company information to continue
            </p>
          </div>

          <Card className="shadow-2xl border-border/50 bg-background/80 backdrop-blur-xl">
            <CardHeader className="space-y-2 px-8 pt-8 pb-6">
              <CardTitle className="text-2xl font-heading font-semibold">
                Company & Contact Information
              </CardTitle>
              <CardDescription>
                Complete your profile to get started
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

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Continue"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
