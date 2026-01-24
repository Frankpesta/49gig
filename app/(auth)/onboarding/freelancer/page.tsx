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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/logo";
import { toast } from "sonner";

const TECH_FIELDS = [
  { value: "development", label: "Software Development" },
  { value: "data_science", label: "Data Science" },
  { value: "technical_writing", label: "Technical Writing" },
  { value: "design", label: "Design" },
  { value: "other", label: "Other" },
] as const;

const EXPERIENCE_LEVELS = {
  development: [
    { value: "junior", label: "Junior Developer" },
    { value: "mid", label: "Mid-Level Developer" },
    { value: "senior", label: "Senior Developer" },
    { value: "expert", label: "Expert/Lead Developer" },
  ],
  data_science: [
    { value: "junior", label: "Junior Data Scientist" },
    { value: "mid", label: "Mid-Level Data Scientist" },
    { value: "senior", label: "Senior Data Scientist" },
    { value: "expert", label: "Expert Data Scientist" },
  ],
  technical_writing: [
    { value: "junior", label: "Junior Technical Writer" },
    { value: "mid", label: "Mid-Level Technical Writer" },
    { value: "senior", label: "Senior Technical Writer" },
    { value: "expert", label: "Expert Technical Writer" },
  ],
  design: [
    { value: "junior", label: "Junior Designer" },
    { value: "mid", label: "Mid-Level Designer" },
    { value: "senior", label: "Senior Designer" },
    { value: "expert", label: "Expert Designer" },
  ],
  marketing: [
    { value: "junior", label: "Junior Marketer" },
    { value: "mid", label: "Mid-Level Marketer" },
    { value: "senior", label: "Senior Marketer" },
    { value: "expert", label: "Expert Marketer" },
  ],
  other: [
    { value: "junior", label: "Junior" },
    { value: "mid", label: "Mid-Level" },
    { value: "senior", label: "Senior" },
    { value: "expert", label: "Expert" },
  ],
};

const PROGRAMMING_LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "C#",
  "Go",
  "Rust",
  "PHP",
  "Ruby",
  "Swift",
  "Kotlin",
  "Scala",
  "R",
  "MATLAB",
  "SQL",
  "HTML/CSS",
  "Other",
];

export default function FreelancerOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    techField: "",
    experienceLevel: "",
    skills: [] as string[],
    languagesWritten: [] as string[],
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
      setFormData({
        techField: user.profile.techField || "",
        experienceLevel: user.profile.experienceLevel || "",
        skills: user.profile.skills || [],
        languagesWritten: user.profile.languagesWritten || [],
      });
    }
  }, [user]);

  const availableExperienceLevels =
    formData.techField && formData.techField in EXPERIENCE_LEVELS
      ? EXPERIENCE_LEVELS[
          formData.techField as keyof typeof EXPERIENCE_LEVELS
        ]
      : [];

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

    if (!formData.experienceLevel) {
      setError("Please select your experience level");
      return;
    }

    if (formData.skills.length === 0) {
      setError("Please add at least one skill");
      return;
    }

    setIsLoading(true);

    try {
      const sessionToken = typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null;
      await updateProfile({
        profile: {
          techField: formData.techField as any,
          experienceLevel: formData.experienceLevel as any,
          skills: formData.skills,
          languagesWritten: formData.languagesWritten,
        },
        sessionToken: sessionToken || undefined,
      });

      toast.success("Profile updated successfully");
      router.push("/resume-upload");
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

                <div className="space-y-3">
                  <Label htmlFor="techField" className="text-sm font-medium">
                    Tech Field
                  </Label>
                  <Select
                    value={formData.techField}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        techField: value,
                        experienceLevel: "", // Reset experience level when field changes
                      });
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select your tech field" />
                    </SelectTrigger>
                    <SelectContent>
                      {TECH_FIELDS.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
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
                        {availableExperienceLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-3">
                  <Label htmlFor="skills" className="text-sm font-medium">
                    Tech Skills
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="skills"
                      type="text"
                      placeholder="e.g., React, Node.js, Python"
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
                    Programming Languages Written
                  </Label>
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
