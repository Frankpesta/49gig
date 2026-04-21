"use client";

import { useEffect, useState } from "react";
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
  PLATFORM_CATEGORIES,
  SOFTWARE_DEV_FIELDS,
  SKILLS_FOR_MCQ_CODING,
  PROGRAMMING_LANGUAGE_OTHER,
  buildLanguagesWrittenFromSelection,
  initialLanguagesFormFromProfile,
  getSkillsForCategory,
  getSoftwareDevFieldSkills,
} from "@/lib/platform-skills";
import { CountrySelector } from "@/components/ui/country-selector";
import { getCountryByCode, splitE164ToCountryAndNational } from "@/lib/countries";

const EXPERIENCE_LEVELS = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-Level" },
  { value: "senior", label: "Senior" },
  { value: "expert", label: "Expert" },
] as const;

/**
 * Legacy freelancer profiles saved under older category ids. Map them to today's
 * `PLATFORM_CATEGORIES` so the Select still resolves to a valid option.
 */
const LEGACY_TECH_FIELD_TO_CATEGORY: Record<string, string> = {
  development: "software_development",
  data_science: "data_analytics",
  design: "ui_ux_design",
  technical_writing: "qa_testing",
  marketing: "software_development",
  other: "software_development",
  ai_ml_blockchain: "machine_learning",
};

/**
 * OAuth signup completion form. Captures the same core fields as the email
 * direct-signup path so both flows end up in the same shape. Location/address,
 * timezone and professional links live on the profile page only.
 */
export default function FreelancerOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    techField: "",
    softwareDevField: "",
    experienceLevel: "",
    skills: [] as string[],
    languagesWritten: [] as string[],
    otherLanguagesDetail: "",
    phoneCountryCode: "",
    phoneNumber: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const updateProfile = useMutation(
    (api as any)["users/mutations"].updateProfile
  );

  useEffect(() => {
    if (!user?.profile) return;
    const rawTech: string = user.profile.techField ?? "";
    const techField =
      rawTech && PLATFORM_CATEGORIES.some((c) => c.id === rawTech)
        ? rawTech
        : LEGACY_TECH_FIELD_TO_CATEGORY[rawTech] ?? rawTech;
    const rawPhone = String((user.profile as { phoneNumber?: string }).phoneNumber || "").trim();
    const e164 = splitE164ToCountryAndNational(rawPhone);
    const langInit = initialLanguagesFormFromProfile(user.profile.languagesWritten);
    setFormData({
      techField,
      softwareDevField: user.profile.softwareDevFields?.[0] || "",
      experienceLevel: user.profile.experienceLevel || "",
      skills: user.profile.skills || [],
      languagesWritten: [
        ...langInit.checklistSelections,
        ...(langInit.otherSelected ? [PROGRAMMING_LANGUAGE_OTHER] : []),
      ],
      otherLanguagesDetail: langInit.otherDetail,
      phoneCountryCode: e164?.countryCode ?? "",
      phoneNumber: e164?.nationalDigits ?? rawPhone.replace(/\D/g, ""),
    });
  }, [user]);

  const categorySkills =
    formData.techField === "software_development"
      ? formData.softwareDevField
        ? getSoftwareDevFieldSkills([formData.softwareDevField])
        : []
      : formData.techField
        ? getSkillsForCategory(formData.techField)
        : [];

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData({ ...formData, skills: [...formData.skills, trimmed] });
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
        languagesWritten: formData.languagesWritten.filter((l) => l !== language),
        ...(language === PROGRAMMING_LANGUAGE_OTHER ? { otherLanguagesDetail: "" } : {}),
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

    if (!formData.techField) {
      setError("Please select a tech field");
      return;
    }
    if (
      formData.techField === "software_development" &&
      !formData.softwareDevField
    ) {
      setError("Please select your software development focus (e.g. frontend, backend)");
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
    const otherSelected = formData.languagesWritten.includes(PROGRAMMING_LANGUAGE_OTHER);
    const builtLanguages = buildLanguagesWrittenFromSelection(
      checklistOnly,
      otherSelected,
      formData.otherLanguagesDetail
    );
    if (builtLanguages.error) {
      setError(builtLanguages.error);
      return;
    }
    if (
      formData.techField === "software_development" &&
      builtLanguages.languages.length === 0
    ) {
      setError(
        "Software Development requires at least one programming language. Select from the list and/or list languages under Other."
      );
      return;
    }

    // Phone is optional here — the verified number is captured via SMS on the profile page.
    const nationalDigits = formData.phoneNumber.replace(/\D/g, "");
    let signupPhoneE164: string | undefined;
    if (nationalDigits) {
      if (!formData.phoneCountryCode) {
        setError("Select your phone country code, or leave the phone field empty.");
        return;
      }
      const pc = getCountryByCode(formData.phoneCountryCode);
      if (!pc) {
        setError("Invalid phone country code.");
        return;
      }
      signupPhoneE164 = `${pc.phoneCode}${nationalDigits}`;
    } else if (formData.phoneCountryCode) {
      setError("Enter your phone number after the country code, or clear the country selector.");
      return;
    }

    setIsLoading(true);

    try {
      const sessionToken =
        typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null;
      await updateProfile({
        profile: {
          techField: formData.techField,
          experienceLevel: formData.experienceLevel,
          skills: formData.skills,
          languagesWritten: builtLanguages.languages,
          softwareDevFields:
            formData.techField === "software_development" && formData.softwareDevField
              ? [formData.softwareDevField]
              : [],
          ...(signupPhoneE164 ? { phoneNumber: signupPhoneE164 } : {}),
        },
        sessionToken: sessionToken || undefined,
      });

      toast.success("Profile updated");
      router.push("/resume-upload");
    } catch (err) {
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
              Tell us about your work
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Just the basics — you can add a portfolio, links, timezone and more from your profile
              once you&apos;re in.
            </p>
          </div>

          <Card className="shadow-2xl border-border/50 bg-background/80 backdrop-blur-xl">
            <CardHeader className="space-y-2 px-8 pt-8 pb-6">
              <CardTitle className="text-2xl font-heading font-semibold">
                Professional basics
              </CardTitle>
              <CardDescription>
                Matches what we ask everyone at signup. Takes less than a minute.
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
                  <Label htmlFor="techField" className="text-sm font-medium">
                    Tech field
                  </Label>
                  <Select
                    value={formData.techField}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        techField: value,
                        softwareDevField: "",
                        experienceLevel: "",
                        skills: [],
                      });
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-11">
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

                {formData.techField === "software_development" && (
                  <div className="space-y-2">
                    <Label htmlFor="softwareDevField" className="text-sm font-medium">
                      Software focus
                    </Label>
                    <Select
                      value={formData.softwareDevField || "__none__"}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          softwareDevField: value === "__none__" ? "" : value,
                          skills: [],
                        })
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger id="softwareDevField" className="h-11">
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

                {formData.techField && (
                  <div className="space-y-2">
                    <Label htmlFor="experienceLevel" className="text-sm font-medium">
                      Experience level
                    </Label>
                    <Select
                      value={formData.experienceLevel}
                      onValueChange={(value) =>
                        setFormData({ ...formData, experienceLevel: value })
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

                <div className="space-y-2">
                  <Label htmlFor="skills" className="text-sm font-medium">
                    Skills
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Used for skill verification and client matching.
                  </p>
                  {formData.techField && categorySkills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {categorySkills.map((skill) => (
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

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Programming languages written
                    {formData.techField === "software_development" && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {formData.techField === "software_development"
                      ? "Required for Software Development. Select at least one — used for the coding assessment."
                      : "Languages you work with. Used for matching and verification."}
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                    {[
                      ...SKILLS_FOR_MCQ_CODING,
                      "R",
                      "Swift",
                      "Kotlin",
                      "Scala",
                      "MATLAB",
                      "HTML/CSS",
                      PROGRAMMING_LANGUAGE_OTHER,
                    ].map((language) => (
                      <label
                        key={language}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.languagesWritten.includes(language)}
                          onChange={() => handleToggleLanguage(language)}
                          disabled={isLoading}
                          className="w-4 h-4 text-primary border-border focus:ring-primary focus:ring-2 cursor-pointer"
                        />
                        <span className="text-sm">{language}</span>
                      </label>
                    ))}
                  </div>
                  {formData.languagesWritten.includes(PROGRAMMING_LANGUAGE_OTHER) && (
                    <div className="space-y-2">
                      <Label htmlFor="other-languages-detail" className="text-sm font-medium">
                        Languages you use <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Comma or newline separated. Used for verification and skill tests.
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

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium">
                    Phone <span className="text-muted-foreground font-normal">(optional)</span>
                    {selectedPhoneCountry && (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        ({selectedPhoneCountry.phoneCode})
                      </span>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    You&apos;ll SMS-verify your number from your profile later. You can skip this here.
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
                      placeholder="Local number"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phoneNumber: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      disabled={isLoading || !formData.phoneCountryCode}
                      className="h-11 flex-1 min-w-0"
                    />
                  </div>
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
