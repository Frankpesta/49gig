"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSignupDraftStore } from "@/stores/signupDraftStore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { executeRecaptcha, isRecaptchaConfigured } from "@/lib/recaptcha-client";
import { RecaptchaNotice } from "@/components/auth/recaptcha-notice";
import { AuthTwoColumnLayout } from "@/components/auth/auth-two-column-layout";
import { CountrySelector } from "@/components/ui/country-selector";
import { getCountryByCode } from "@/lib/countries";
import { getUserFriendlyError } from "@/lib/error-handling";
import { useAnalytics } from "@/hooks/use-analytics";
import { Eye, EyeOff } from "lucide-react";

export default function ClientSignupPage() {
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const clientDraft = useSignupDraftStore((s) => s.client);
  const setClientDraft = useSignupDraftStore((s) => s.setClientDraft);
  const resetClientDraft = useSignupDraftStore((s) => s.resetClientDraft);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const signupWithRecaptcha = useAction(api.auth.actions.signupWithRecaptcha);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref")?.trim().toUpperCase();
    if (ref && /^[A-Z0-9]{6,12}$/.test(ref)) {
      sessionStorage.setItem("49gig_ref", ref);
    }
  }, []);

  const selectedCountry = clientDraft.country
    ? getCountryByCode(clientDraft.country)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!clientDraft.companyName) {
      setError("Company name is required");
      return;
    }

    if (!clientDraft.country) {
      setError("Country is required");
      return;
    }

    if (!isRecaptchaConfigured()) {
      setError("Sign up is temporarily unavailable. Please try again later.");
      return;
    }

    setIsLoading(true);

    try {
      const refFromUrl = new URLSearchParams(window.location.search).get("ref")?.trim();
      const refStored = sessionStorage.getItem("49gig_ref");
      const referralCode = refFromUrl || refStored || undefined;

      const recaptchaToken = await executeRecaptcha("signup");
      const result = await signupWithRecaptcha({
        recaptchaToken,
        email: clientDraft.email,
        password,
        name: clientDraft.name,
        role: "client",
        referralCode,
        profile: {
          companyName: clientDraft.companyName,
          workEmail: clientDraft.workEmail || clientDraft.email,
          phoneNumber: clientDraft.phoneNumber
            ? `${selectedCountry?.phoneCode || ""}${clientDraft.phoneNumber}`
            : undefined,
          companyWebsite: clientDraft.companyWebsite || undefined,
          country: clientDraft.country,
        },
      });

      if (result.success) {
        trackEvent("sign_up", { method: "email", role: "client" });
        resetClientDraft();
        setPassword("");
        setConfirmPassword("");
        if (result.emailVerificationRequired) {
          if (result.sessionToken) {
            localStorage.setItem("sessionToken", result.sessionToken);
          }
          sessionStorage.setItem("pending_verify_email", clientDraft.email);
          router.push("/verify-email");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: unknown) {
      setError(getUserFriendlyError(err) || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthTwoColumnLayout
      leftTitle="Get Started With Us"
      leftDescription="Complete these easy steps to register your account."
      steps={[
        { label: "Choose your role", active: false },
        { label: "Create your account", active: true },
        { label: "Start hiring talent", active: false },
      ]}
      badge="Client signup"
      heading="Sign up account"
      subline="Enter your personal data to create your account."
    >
      <form onSubmit={handleSubmit} className="w-full space-y-5">
        {/* Google OAuth disabled for all roles — restore when re-enabled
        <Button type="button" ...>Continue with Google</Button>
        <div className="relative">... Or ...</div>
        */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-0.5">
          <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="eg. John Doe"
            value={clientDraft.name}
            onChange={(e) => setClientDraft({ name: e.target.value })}
            required
            disabled={isLoading}
            className="h-11 rounded-lg"
          />
        </div>

        <div className="space-y-0.5">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="eg. john@example.com"
            value={clientDraft.email}
            onChange={(e) => setClientDraft({ email: e.target.value })}
            required
            disabled={isLoading}
            className="h-11 rounded-lg"
          />
        </div>

        <div className="space-y-0.5">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={8}
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

        <div className="space-y-0.5">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              className="h-11 rounded-lg pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border/60">
          <h3 className="text-sm font-semibold text-foreground">Company & contact</h3>
          <div className="space-y-0.5">
            <Label htmlFor="companyName" className="text-sm font-medium">Company / Organization Name</Label>
            <Input
              id="companyName"
              type="text"
              placeholder="eg. Acme Inc."
              value={clientDraft.companyName}
              onChange={(e) => setClientDraft({ companyName: e.target.value })}
              required
              disabled={isLoading}
              className="h-11 rounded-lg"
            />
          </div>
          <div className="space-y-0.5">
            <Label htmlFor="country" className="text-sm font-medium">Country / Region</Label>
            <CountrySelector
              value={clientDraft.country}
              onValueChange={(value) => setClientDraft({ country: value })}
              disabled={isLoading}
              className="w-full"
            />
          </div>
          <div className="space-y-0.5">
            <Label htmlFor="workEmail" className="text-sm font-medium">Work Email (optional)</Label>
            <Input
              id="workEmail"
              type="email"
              placeholder="eg. work@company.com"
              value={clientDraft.workEmail}
              onChange={(e) => setClientDraft({ workEmail: e.target.value })}
              disabled={isLoading}
              className="h-11 rounded-lg"
            />
          </div>
          <div className="space-y-0.5">
            <Label htmlFor="phoneNumber" className="text-sm font-medium">
              Phone Number (optional)
            </Label>
            <div className="flex gap-2">
              <div className="flex h-11 w-[90px] items-center justify-center rounded-lg border border-input bg-muted/40 text-sm text-muted-foreground">
                {selectedCountry?.phoneCode || "+—"}
              </div>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="eg. 1234567890"
                value={clientDraft.phoneNumber}
                onChange={(e) =>
                  setClientDraft({ phoneNumber: e.target.value.replace(/\D/g, "") })
                }
                disabled={isLoading || !clientDraft.country}
                className="h-11 flex-1 rounded-lg"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Dial code is derived from your country. You can verify this number later in your profile.
            </p>
          </div>
          <div className="space-y-0.5">
            <Label htmlFor="companyWebsite" className="text-sm font-medium">Company Website (optional)</Label>
            <Input
              id="companyWebsite"
              type="url"
              placeholder="eg. https://company.com"
              value={clientDraft.companyWebsite}
              onChange={(e) => setClientDraft({ companyWebsite: e.target.value })}
              disabled={isLoading}
              className="h-11 rounded-lg"
            />
          </div>
        </div>

        <RecaptchaNotice />

        <Button
          type="submit"
          className="w-full h-11 rounded-lg text-sm font-semibold disabled:opacity-90"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Creating account...
            </span>
          ) : (
            "Sign Up"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">Login</Link>
        </p>
      </form>
    </AuthTwoColumnLayout>
  );
}
