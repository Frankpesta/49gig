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
import { useOAuth } from "@/hooks/use-oauth";
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
  const { signInWithGoogle, isGoogleLoading } = useOAuth();

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
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 rounded-lg text-sm font-medium border-border/60 bg-muted/30 hover:bg-muted/50"
          disabled={isLoading || isGoogleLoading}
          onClick={() => signInWithGoogle("client")}
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
