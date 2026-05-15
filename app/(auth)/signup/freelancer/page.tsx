"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignupDraftStore } from "@/stores/signupDraftStore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAction } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { executeRecaptcha, isRecaptchaConfigured } from "@/lib/recaptcha-client";
import { RecaptchaNotice } from "@/components/auth/recaptcha-notice";
import { AuthTwoColumnLayout } from "@/components/auth/auth-two-column-layout";
import {
  PLATFORM_CATEGORIES,
  SKILLS_FOR_MCQ_CODING,
  SOFTWARE_DEV_FIELDS,
  PROGRAMMING_LANGUAGE_OTHER,
  buildLanguagesWrittenFromSelection,
  getSkillsForCategory,
  getSoftwareDevFieldSkills,
} from "@/lib/platform-skills";
import { getUserFriendlyError } from "@/lib/error-handling";
import { useAnalytics } from "@/hooks/use-analytics";
import { CountrySelector } from "@/components/ui/country-selector";
import { getCountryByCode } from "@/lib/countries";
import { Eye, EyeOff } from "lucide-react";
import type { User } from "@/stores/authStore";

type FreelancerSignupTechField = NonNullable<
  NonNullable<User["profile"]>["techField"]
>;
type FreelancerSignupExperienceLevel = NonNullable<
  NonNullable<User["profile"]>["experienceLevel"]
>;

type SignupWithRecaptchaArgs = {
  recaptchaToken: string;
  email: string;
  password: string;
  name: string;
  role: "client" | "freelancer";
  profile?: {
    techField?: FreelancerSignupTechField;
    experienceLevel?: FreelancerSignupExperienceLevel;
    skills?: string[];
    softwareDevFields?: string[];
    languagesWritten?: string[];
    phoneNumber?: string;
  };
};

type SignupWithRecaptchaResult = {
  success: boolean;
  sessionToken?: string;
  emailVerificationRequired?: boolean;
};

const EXPERIENCE_LEVELS = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-Level" },
  { value: "senior", label: "Senior" },
  { value: "expert", label: "Expert" },
] as const;

export default function FreelancerSignupPage() {
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const freelancerDraft = useSignupDraftStore((s) => s.freelancer);
  const setFreelancerDraft = useSignupDraftStore((s) => s.setFreelancerDraft);
  const resetFreelancerDraft = useSignupDraftStore((s) => s.resetFreelancerDraft);
  const skillInput = useSignupDraftStore((s) => s.freelancerSkillInput);
  const setFreelancerSkillInput = useSignupDraftStore((s) => s.setFreelancerSkillInput);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const signupWithRecaptcha = useAction(
    makeFunctionReference<
      "action",
      SignupWithRecaptchaArgs,
      SignupWithRecaptchaResult
    >("auth/actions:signupWithRecaptcha")
  );
  const categorySkills =
    freelancerDraft.techField === "software_development"
      ? freelancerDraft.softwareDevField
        ? getSoftwareDevFieldSkills([freelancerDraft.softwareDevField])
        : []
      : freelancerDraft.techField
        ? getSkillsForCategory(freelancerDraft.techField)
        : [];

  const handleAddSkill = () => {
    if (
      skillInput.trim() &&
      !freelancerDraft.skills.includes(skillInput.trim())
    ) {
      setFreelancerDraft({
        skills: [...freelancerDraft.skills, skillInput.trim()],
      });
      setFreelancerSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFreelancerDraft({
      skills: freelancerDraft.skills.filter((s) => s !== skill),
    });
  };

  const handleToggleLanguage = (language: string) => {
    if (freelancerDraft.languagesWritten.includes(language)) {
      setFreelancerDraft({
        languagesWritten: freelancerDraft.languagesWritten.filter(
          (l) => l !== language
        ),
        ...(language === PROGRAMMING_LANGUAGE_OTHER
          ? { otherLanguagesDetail: "" }
          : {}),
      });
    } else {
      setFreelancerDraft({
        languagesWritten: [...freelancerDraft.languagesWritten, language],
      });
    }
  };

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

    if (!freelancerDraft.techField) {
      setError("Please select a tech field");
      return;
    }

    if (
      freelancerDraft.techField === "software_development" &&
      !freelancerDraft.softwareDevField
    ) {
      setError("Please select your software development focus (e.g. frontend, backend)");
      return;
    }

    if (!freelancerDraft.experienceLevel) {
      setError("Please select your experience level");
      return;
    }

    if (freelancerDraft.skills.length === 0) {
      setError("Please add at least one skill");
      return;
    }

    if (!isRecaptchaConfigured()) {
      setError("Sign up is temporarily unavailable. Please try again later.");
      return;
    }

    const checklistOnly = freelancerDraft.languagesWritten.filter(
      (l) => l !== PROGRAMMING_LANGUAGE_OTHER
    );
    const otherOn = freelancerDraft.languagesWritten.includes(
      PROGRAMMING_LANGUAGE_OTHER
    );
    const builtLanguages = buildLanguagesWrittenFromSelection(
      checklistOnly,
      otherOn,
      freelancerDraft.otherLanguagesDetail
    );
    if (builtLanguages.error) {
      setError(builtLanguages.error);
      return;
    }
    if (
      freelancerDraft.techField === "software_development" &&
      builtLanguages.languages.length === 0
    ) {
      setError(
        "Software Development requires at least one programming language. Select from the list and/or list languages under Other."
      );
      return;
    }

    const nationalDigits = freelancerDraft.phoneNational.replace(/\D/g, "");
    let signupPhoneE164: string | undefined;
    if (nationalDigits) {
      if (!freelancerDraft.phoneCountryCode) {
        setError("Select your phone country code, or leave the phone field empty.");
        return;
      }
      const pc = getCountryByCode(freelancerDraft.phoneCountryCode);
      if (!pc) {
        setError("Invalid phone country code.");
        return;
      }
      signupPhoneE164 = `${pc.phoneCode}${nationalDigits}`;
    } else if (freelancerDraft.phoneCountryCode) {
      setError("Enter your phone number after the country code, or clear the country selector.");
      return;
    }

    setIsLoading(true);

    try {
      const recaptchaToken = await executeRecaptcha("signup");
      const result = await signupWithRecaptcha({
        recaptchaToken,
        email: freelancerDraft.email,
        password,
        name: freelancerDraft.name,
        role: "freelancer",
        profile: {
          techField: freelancerDraft.techField as FreelancerSignupTechField,
          experienceLevel:
            freelancerDraft.experienceLevel as FreelancerSignupExperienceLevel,
          skills: freelancerDraft.skills,
          softwareDevFields:
            freelancerDraft.techField === "software_development" &&
            freelancerDraft.softwareDevField
              ? [freelancerDraft.softwareDevField]
              : undefined,
          languagesWritten: builtLanguages.languages,
          ...(signupPhoneE164 ? { phoneNumber: signupPhoneE164 } : {}),
        },
      });

      if (result.success) {
        trackEvent("sign_up", { method: "email", role: "freelancer" });
        resetFreelancerDraft();
        setPassword("");
        setConfirmPassword("");
        localStorage.setItem("pending_resume_upload", "freelancer");
        if (result.sessionToken) {
          localStorage.setItem("sessionToken", result.sessionToken);
        }
        if (result.emailVerificationRequired) {
          sessionStorage.setItem("pending_verify_email", freelancerDraft.email);
          router.push("/verify-email");
        } else {
          router.replace("/resume-upload");
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
        { label: "Complete your profile", active: false },
      ]}
      badge="Freelancer signup"
      heading="Sign up account"
      subline="Enter your personal data to create your account."
    >
      <form onSubmit={handleSubmit} className="w-full space-y-5">
        {/* Google OAuth disabled for all roles
        <div className="space-y-1.5">(... Continue with Google ...)</div>
        <div className="relative">(... Or divider ...)</div>
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
            value={freelancerDraft.name}
            onChange={(e) => setFreelancerDraft({ name: e.target.value })}
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
            value={freelancerDraft.email}
            onChange={(e) => setFreelancerDraft({ email: e.target.value })}
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

        <div className="space-y-0.5">
          <Label htmlFor="freelancer-phone-national" className="text-sm font-medium">
            Phone <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <p className="text-xs text-muted-foreground">
            Country code and local number. You can add or edit this when you complete your profile.
          </p>
          <div className="flex gap-2">
            <div className="w-[min(100%,10rem)] shrink-0">
              <CountrySelector
                value={freelancerDraft.phoneCountryCode}
                onValueChange={(value) => setFreelancerDraft({ phoneCountryCode: value })}
                disabled={isLoading}
                className="h-11 w-full"
              />
            </div>
            <Input
              id="freelancer-phone-national"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="Local number"
              value={freelancerDraft.phoneNational}
              onChange={(e) =>
                setFreelancerDraft({
                  phoneNational: e.target.value.replace(/\D/g, ""),
                })
              }
              disabled={isLoading || !freelancerDraft.phoneCountryCode}
              className="h-11 flex-1 min-w-0 rounded-lg"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border/60">
                    <h3 className="text-sm font-semibold text-foreground">
                      Professional information
                    </h3>
                    <div className="space-y-0.5">
                      <Label htmlFor="techField" className="text-sm font-medium">
                        Tech Field
                      </Label>
                      <Select
                        value={freelancerDraft.techField}
                        onValueChange={(value) => {
                          setFreelancerDraft({
                            techField: value,
                            softwareDevField: "",
                            experienceLevel: "",
                            skills: [],
                          });
                        }}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-11 rounded-lg">
                          <SelectValue placeholder="Select your tech category" />
                        </SelectTrigger>
                        <SelectContent>
                          {PLATFORM_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {freelancerDraft.techField === "software_development" && (
                      <div className="space-y-0.5">
                        <Label htmlFor="softwareDevField" className="text-sm font-medium">
                          Software focus
                        </Label>
                        <Select
                          value={freelancerDraft.softwareDevField || "__none__"}
                          onValueChange={(value) =>
                            setFreelancerDraft({
                              softwareDevField: value === "__none__" ? "" : value,
                              skills: [],
                            })
                          }
                          disabled={isLoading}
                        >
                          <SelectTrigger id="softwareDevField" className="h-11 rounded-lg">
                            <SelectValue placeholder="e.g. Frontend, Full-stack…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Choose…</SelectItem>
                            {SOFTWARE_DEV_FIELDS.map((f) => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {freelancerDraft.techField && (
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="experienceLevel"
                          className="text-sm font-medium"
                        >
                          Experience Level
                        </Label>
                        <Select
                          value={freelancerDraft.experienceLevel}
                          onValueChange={(value) =>
                            setFreelancerDraft({ experienceLevel: value })
                          }
                          disabled={isLoading}
                        >
                          <SelectTrigger className="h-11 rounded-lg">
                            <SelectValue placeholder="Select your experience level" />
                          </SelectTrigger>
                          <SelectContent>
                            {EXPERIENCE_LEVELS.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <Label htmlFor="skills" className="text-sm font-medium">
                        Tech Skills
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Skills for your category (used for verification):
                      </p>
                      {freelancerDraft.techField && (
                        <div className="flex flex-wrap gap-2">
                          {categorySkills.map((skill) => (
                            <Button
                              key={skill}
                              type="button"
                              variant={freelancerDraft.skills.includes(skill) ? "default" : "outline"}
                              size="sm"
                              className="rounded-full"
                              onClick={() => {
                                if (freelancerDraft.skills.includes(skill)) {
                                  handleRemoveSkill(skill);
                                } else {
                                  setFreelancerDraft({
                                    skills: [...freelancerDraft.skills, skill],
                                  });
                                }
                              }}
                              disabled={isLoading}
                            >
                              {skill}
                            </Button>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input
                          id="skills"
                          type="text"
                          placeholder="Add more skills..."
                          value={skillInput}
                          onChange={(e) => setFreelancerSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddSkill();
                            }
                          }}
                          disabled={isLoading}
                          className="h-11 flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddSkill}
                          disabled={isLoading || !skillInput.trim()}
                          className="h-11 rounded-lg"
                        >
                          Add
                        </Button>
                      </div>
                      {freelancerDraft.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {freelancerDraft.skills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => handleRemoveSkill(skill)}
                                className="hover:text-destructive"
                                disabled={isLoading}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">
                        Programming Languages Written
                      </Label>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                        {[...SKILLS_FOR_MCQ_CODING, "R", "Swift", "Kotlin", "Scala", "MATLAB", "HTML/CSS", PROGRAMMING_LANGUAGE_OTHER].map((language) => (
                          <label
                            key={language}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={freelancerDraft.languagesWritten.includes(
                                language
                              )}
                              onChange={() => handleToggleLanguage(language)}
                              disabled={isLoading}
                              className="w-4 h-4 text-primary border-border focus:ring-primary focus:ring-2 cursor-pointer"
                            />
                            <span className="text-sm">{language}</span>
                          </label>
                        ))}
                      </div>
                      {freelancerDraft.languagesWritten.includes(
                        PROGRAMMING_LANGUAGE_OTHER
                      ) && (
                        <div className="space-y-2 mt-2">
                          <Label
                            htmlFor="signup-other-languages"
                            className="text-sm font-medium"
                          >
                            Languages you use{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Comma or newline separated. Used for verification and
                            skill tests.
                          </p>
                          <Textarea
                            id="signup-other-languages"
                            value={freelancerDraft.otherLanguagesDetail}
                            onChange={(e) =>
                              setFreelancerDraft({ otherLanguagesDetail: e.target.value })
                            }
                            disabled={isLoading}
                            placeholder="e.g. Dart, Elixir, Perl"
                            className="min-h-[88px] resize-y rounded-lg"
                          />
                        </div>
                      )}
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
          <Link href="/login?intent=freelancer" className="font-semibold text-primary hover:underline">Login</Link>
        </p>
      </form>
    </AuthTwoColumnLayout>
  );
}
