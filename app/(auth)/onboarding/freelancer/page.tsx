"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getUserFriendlyError } from "@/lib/error-handling";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/logo";
import { toast } from "sonner";
import {
  PLATFORM_ROLES,
  PROGRAMMING_LANGUAGES,
  PROGRAMMING_LANGUAGE_OTHER,
  buildLanguagesWrittenFromSelection,
  initialLanguagesFormFromProfile,
  getSkillsForRole,
} from "@/lib/platform-skills";
import {
  requiresBehanceUrl,
  requiresGithubUrl,
  requiresProfessionalLink,
} from "@/lib/freelancer-profile-links";
import { CountrySelector } from "@/components/ui/country-selector";
import { getCountryByCode, splitE164ToCountryAndNational } from "@/lib/countries";

const EXPERIENCE_LEVELS = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-Level" },
  { value: "senior", label: "Senior" },
  { value: "expert", label: "Expert" },
] as const;

// Map legacy signup techField values to current platform category ids
const LEGACY_TECH_FIELD_TO_CATEGORY: Record<string, string> = {
  development: "software_development",
  data_science: "data_analytics",
  design: "ui_ux_design",
  technical_writing: "qa_testing",
  marketing: "software_development",
  other: "software_development",
  ai_ml_blockchain: "machine_learning", // Legacy: map to Machine Learning
};

export default function FreelancerOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    techField: "",
    experienceLevel: "",
    skills: [] as string[],
    languagesWritten: [] as string[],
    country: "",
    timezone: "",
    phoneCountryCode: "",
    phoneNumber: "",
    address: "",
    githubUrl: "",
    behanceUrl: "",
    linkedinUrl: "",
    portfolioUrl: "",
    otherLanguagesDetail: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const updateProfile = useMutation(
    (api as any)["users/mutations"].updateProfile
  );

  useEffect(() => {
    // Pre-fill with existing profile data if available
    if (user?.profile) {
      // Widen to string so we can compare legacy techField values with platform category ids
      const rawTech: string = user.profile.techField ?? "";
      const techField =
        rawTech && PLATFORM_ROLES.some((r) => r.id === rawTech)
          ? rawTech
          : LEGACY_TECH_FIELD_TO_CATEGORY[rawTech] ?? rawTech;
      const rawPhone = String((user.profile as any).phoneNumber || "").trim();
      const e164 = splitE164ToCountryAndNational(rawPhone);
      const langInit = initialLanguagesFormFromProfile(user.profile.languagesWritten);
      setFormData({
        techField,
        experienceLevel: user.profile.experienceLevel || "",
        skills: user.profile.skills || [],
        languagesWritten: [
          ...langInit.checklistSelections,
          ...(langInit.otherSelected ? [PROGRAMMING_LANGUAGE_OTHER] : []),
        ],
        otherLanguagesDetail: langInit.otherDetail,
        country: user.profile.country || "",
        timezone: user.profile.timezone || "",
        phoneCountryCode: e164?.countryCode ?? "",
        phoneNumber: e164?.nationalDigits ?? rawPhone.replace(/\D/g, ""),
        address: (user.profile as any).address || "",
        githubUrl: user.profile.githubUrl || "",
        behanceUrl: user.profile.behanceUrl || "",
        linkedinUrl: user.profile.linkedinUrl || "",
        portfolioUrl: user.profile.portfolioUrl || "",
      });
    }
  }, [user]);

  const roleSkills = formData.techField ? getSkillsForRole(formData.techField) : [];

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const handleToggleLanguage = (language: string) => {
    if (formData.languagesWritten.includes(language)) {
      setFormData({
        ...formData,
        languagesWritten: formData.languagesWritten.filter(
          (l) => l !== language
        ),
        ...(language === PROGRAMMING_LANGUAGE_OTHER
          ? { otherLanguagesDetail: "" }
          : {}),
      });
    } else {
      setFormData({
        ...formData,
        languagesWritten: [...formData.languagesWritten, language],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.phoneCountryCode.trim()) {
      setError("Select the country code for your phone number");
      return;
    }
    const nationalDigits = formData.phoneNumber.replace(/\D/g, "");
    if (!nationalDigits) {
      setError("Phone number is required");
      return;
    }
    const phoneCountry = getCountryByCode(formData.phoneCountryCode);
    if (!phoneCountry) {
      setError("Invalid country calling code");
      return;
    }
    const fullPhoneE164 = `${phoneCountry.phoneCode}${nationalDigits}`;

    if (!formData.address.trim()) {
      setError("Address is required");
      return;
    }

    if (!formData.techField) {
      setError("Please select a tech field");
      return;
    }

    if (!formData.experienceLevel) {
      setError("Please select your experience level");
      return;
    }

    if (formData.skills.length === 0) {
      setError("Please add at least one skill");
      return;
    }

    const checklistOnly = formData.languagesWritten.filter(
      (l) => l !== PROGRAMMING_LANGUAGE_OTHER
    );
    const otherSelected = formData.languagesWritten.includes(
      PROGRAMMING_LANGUAGE_OTHER
    );
    const builtLanguages = buildLanguagesWrittenFromSelection(
      checklistOnly,
      otherSelected,
      formData.otherLanguagesDetail
    );
    if (builtLanguages.error) {
      setError(builtLanguages.error);
      return;
    }

    // Software Development requires at least one programming language (for skill test).
    if (
      formData.techField === "software_development" &&
      builtLanguages.languages.length === 0
    ) {
      setError(
        "Software Development requires at least one programming language. Select from the list and/or list languages under Other."
      );
      return;
    }

    const tf = formData.techField || undefined;
    if (requiresGithubUrl(tf) && !formData.githubUrl.trim()) {
      setError("GitHub profile URL is required for your category.");
      return;
    }
    if (requiresBehanceUrl(tf) && !formData.behanceUrl.trim()) {
      setError("Behance profile URL is required for design roles.");
      return;
    }
    if (
      requiresProfessionalLink(tf) &&
      !formData.linkedinUrl.trim() &&
      !formData.portfolioUrl.trim()
    ) {
      setError("Add a LinkedIn URL or a portfolio / website URL for your category.");
      return;
    }

    setIsLoading(true);

    try {
      const sessionToken = typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null;
      await updateProfile({
        profile: {
          phoneNumber: fullPhoneE164,
          address: formData.address.trim(),
          techField: formData.techField as any,
          experienceLevel: formData.experienceLevel as any,
          skills: formData.skills,
          languagesWritten: builtLanguages.languages,
          ...(formData.country && { country: formData.country }),
          ...(formData.timezone && { timezone: formData.timezone }),
          githubUrl: formData.githubUrl.trim() || undefined,
          behanceUrl: formData.behanceUrl.trim() || undefined,
          linkedinUrl: formData.linkedinUrl.trim() || undefined,
          portfolioUrl: formData.portfolioUrl.trim() || undefined,
        },
        sessionToken: sessionToken || undefined,
      });

      toast.success("Profile updated successfully");
      router.push("/resume-upload");
    } catch (err: any) {
      setError(getUserFriendlyError(err) || "Failed to update profile");
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

  const techField = formData.techField || undefined;
  const githubRequired = requiresGithubUrl(techField);
  const behanceRequired = requiresBehanceUrl(techField);
  const professionalLinkRequired = requiresProfessionalLink(techField);
  const selectedPhoneCountry = formData.phoneCountryCode
    ? getCountryByCode(formData.phoneCountryCode)
    : null;

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
              Please provide your professional information to continue
            </p>
          </div>

          <Card className="shadow-2xl border-border/50 bg-background/80 backdrop-blur-xl">
            <CardHeader className="space-y-2 px-8 pt-8 pb-6">
              <CardTitle className="text-2xl font-heading font-semibold">
                Professional Information
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

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium">
                    Phone number <span className="text-destructive">*</span>
                    {selectedPhoneCountry && (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        ({selectedPhoneCountry.phoneCode})
                      </span>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Choose your country code, then enter your number without the leading zero.
                  </p>
                  <div className="flex gap-2">
                    <div className="w-[min(100%,10rem)] shrink-0">
                      <CountrySelector
                        value={formData.phoneCountryCode}
                        onValueChange={(value) =>
                          setFormData({ ...formData, phoneCountryCode: value })
                        }
                        disabled={isLoading}
                        className="h-11 w-full"
                      />
                    </div>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder="e.g. 8000000000"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phoneNumber: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      required
                      disabled={isLoading || !formData.phoneCountryCode}
                      className="h-11 flex-1 min-w-0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium">
                    Country (optional)
                  </Label>
                  <Input
                    id="country"
                    placeholder="e.g. Nigeria, Kenya"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="e.g. 12 Victoria Island, Lagos, Nigeria"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="techField" className="text-sm font-medium">
                    What role do you work in?
                  </Label>
                  <Select
                    value={formData.techField}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        techField: value,
                        experienceLevel: "",
                        skills: [],
                      });
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select your role (e.g. Software Developer)" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORM_ROLES.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.techField && (
                  <div className="space-y-3">
                    <Label
                      htmlFor="experienceLevel"
                      className="text-sm font-medium"
                    >
                      Experience Level
                    </Label>
                    <Select
                      value={formData.experienceLevel}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          experienceLevel: value,
                        })
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-11">
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
                {formData.techField && (
                  <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
                    <div>
                      <p className="text-sm font-medium">Professional links</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Same rules as your dashboard profile. Clients use these to verify your background.
                      </p>
                    </div>
                    {githubRequired && (
                      <div className="space-y-2">
                        <Label htmlFor="githubUrl" className="text-sm font-medium">
                          GitHub profile URL <span className="text-destructive">*</span>
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Link on github.com (your profile or organization).
                        </p>
                        <Input
                          id="githubUrl"
                          type="url"
                          inputMode="url"
                          placeholder="https://github.com/yourusername"
                          value={formData.githubUrl}
                          onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                          disabled={isLoading}
                          className="h-11"
                          required
                        />
                      </div>
                    )}
                    {behanceRequired && (
                      <div className="space-y-2">
                        <Label htmlFor="behanceUrl" className="text-sm font-medium">
                          Behance profile URL <span className="text-destructive">*</span>
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Your portfolio on behance.net.
                        </p>
                        <Input
                          id="behanceUrl"
                          type="url"
                          inputMode="url"
                          placeholder="https://www.behance.net/yourprofile"
                          value={formData.behanceUrl}
                          onChange={(e) => setFormData({ ...formData, behanceUrl: e.target.value })}
                          disabled={isLoading}
                          className="h-11"
                          required
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="linkedinUrl" className="text-sm font-medium">
                        LinkedIn URL
                        {professionalLinkRequired && (
                          <span className="text-muted-foreground font-normal text-xs">
                            {" "}
                            (required if no portfolio below)
                          </span>
                        )}
                      </Label>
                      <Input
                        id="linkedinUrl"
                        type="url"
                        inputMode="url"
                        placeholder="https://www.linkedin.com/in/yourprofile"
                        value={formData.linkedinUrl}
                        onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="portfolioUrl" className="text-sm font-medium">
                        Portfolio / website URL
                        {professionalLinkRequired && (
                          <span className="text-muted-foreground font-normal text-xs">
                            {" "}
                            (required if no LinkedIn above)
                          </span>
                        )}
                      </Label>
                      <Input
                        id="portfolioUrl"
                        type="url"
                        inputMode="url"
                        placeholder="https://your-site.com"
                        value={formData.portfolioUrl}
                        onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-sm font-medium">
                    Time zone (optional)
                  </Label>
                  <Input
                    id="timezone"
                    placeholder="e.g. WAT, EAT, UTC+1"
                    value={formData.timezone}
                    onChange={(e) =>
                      setFormData({ ...formData, timezone: e.target.value })
                    }
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="skills" className="text-sm font-medium">
                    Skills for your role
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Select the skills you have. Used for matching and verification.
                  </p>
                  {formData.techField && roleSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {roleSkills.map((skill) => (
                        <Button
                          key={skill}
                          type="button"
                          variant={formData.skills.includes(skill) ? "default" : "outline"}
                          size="sm"
                          className="rounded-full"
                          onClick={() => {
                            if (formData.skills.includes(skill)) {
                              handleRemoveSkill(skill);
                            } else {
                              setFormData({
                                ...formData,
                                skills: [...formData.skills, skill],
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
                      onChange={(e) => setSkillInput(e.target.value)}
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
                      className="h-11"
                    >
                      Add
                    </Button>
                  </div>
                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.skills.map((skill) => (
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
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Programming Languages
                    {formData.techField === "software_development" && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {formData.techField === "software_development"
                      ? "Required for Software Development. Select at least one language (used for skill test and matching)."
                      : "Select languages you work with (used for matching and verification)."}
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                    {PROGRAMMING_LANGUAGES.map((language) => (
                      <label
                        key={language}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.languagesWritten.includes(
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
                  {formData.languagesWritten.includes(
                    PROGRAMMING_LANGUAGE_OTHER
                  ) && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="other-languages-detail"
                        className="text-sm font-medium"
                      >
                        Languages you use{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        List every language we should assess (comma or newline
                        separated). Skill tests use your profile languages,
                        including these.
                      </p>
                      <Textarea
                        id="other-languages-detail"
                        value={formData.otherLanguagesDetail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            otherLanguagesDetail: e.target.value,
                          })
                        }
                        disabled={isLoading}
                        placeholder="e.g. Dart, Elixir, Lua"
                        className="min-h-[88px] resize-y"
                      />
                    </div>
                  )}
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
