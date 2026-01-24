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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOAuth } from "@/hooks/use-oauth";
import { AuthTwoColumnLayout } from "@/components/auth/auth-two-column-layout";
import { freelancerSignupFeatures } from "@/components/auth/auth-icons";

const authCardClass =
  "rounded-xl border border-border/60 bg-card shadow-lg";

const TECH_FIELDS = [
  { value: "development", label: "Software Development" },
  { value: "data_science", label: "Data Science" },
  { value: "technical_writing", label: "Technical Writing" },
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
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

export default function FreelancerSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    techField: "",
    experienceLevel: "",
    skills: [] as string[],
    languagesWritten: [] as string[],
  });
  const [skillInput, setSkillInput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const signup = useMutation(
    (api as any)["auth/mutations"].signup
  );
  const { signInWithGoogle } = useOAuth();

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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
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

    setIsLoading(true);

    try {
      const result = await signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: "freelancer",
        profile: {
          techField: formData.techField as any,
          experienceLevel: formData.experienceLevel as any,
          skills: formData.skills,
          languagesWritten: formData.languagesWritten,
        },
      });

      if (result.success) {
        // Track pending resume upload for freelancers
        localStorage.setItem("pending_resume_upload", "freelancer");

        if (result.emailVerificationRequired) {
          router.push("/verify-email");
        } else {
          router.replace("/resume-upload");
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
      leftTitle="Start your freelance journey"
      leftDescription="Join verified freelancers and get matched with quality projects."
      features={freelancerSignupFeatures}
      badge="Freelancer signup"
      heading="Create your account"
      subline="Get started by creating a freelancer account."
    >
      <Card className={authCardClass}>
        <form onSubmit={handleSubmit}>
          <CardHeader className="space-y-1 px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
            <CardTitle className="text-xl font-semibold">Sign up as freelancer</CardTitle>
            <CardDescription>Enter your information to create your account</CardDescription>
          </CardHeader>
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
                          setFormData({
                            ...formData,
                            password: e.target.value,
                          })
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
                      Professional information
                    </h3>
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
                        <SelectTrigger className="h-11 rounded-lg">
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
                          <SelectTrigger className="h-11 rounded-lg">
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
                          className="h-11 rounded-lg"
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
                  </div>

                  <div className="pt-1">
                    <Button
                      type="submit"
                      className="w-full h-11 rounded-lg text-sm font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating account..." : "Create account"}
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
                  onClick={() => signInWithGoogle("freelancer")}
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
