"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  calculateProjectBudget,
  formatBudget,
  type ExperienceLevel,
  type ProjectType,
  type HireType,
  type TeamSize,
} from "@/lib/budget-calculator";

const TALENT_CATEGORIES = [
  "Software Development",
  "UI/UX & Product Design",
  "Data & Analytics",
] as const;

const EXPERIENCE_LEVELS = [
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-level" },
  { value: "senior", label: "Senior" },
  { value: "expert", label: "Expert" },
] as const;

const TEAM_SIZES = [
  { value: "2-3", label: "2–3" },
  { value: "4-6", label: "4–6" },
  { value: "7+", label: "7+" },
  { value: "not_sure", label: "Not sure (let 49GIG recommend)" },
] as const;

const PROJECT_TYPES = [
  { value: "one_time", label: "One-time / clearly defined → Milestone-based" },
  { value: "ongoing", label: "Ongoing / long-term → Hourly / monthly" },
  { value: "not_sure", label: "Not sure (let 49GIG decide)" },
] as const;

const COMMON_SKILLS_BY_CATEGORY: Record<string, string[]> = {
  "Software Development": [
    "React",
    "Next.js",
    "TypeScript",
    "Node.js",
    "Python",
    "Java",
    "C++",
    "Go",
    "Rust",
    "PHP",
    "Ruby",
    "Swift",
    "Kotlin",
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "GCP",
  ],
  "UI/UX & Product Design": [
    "Figma",
    "Adobe XD",
    "Sketch",
    "InVision",
    "Prototyping",
    "User Research",
    "Wireframing",
    "Visual Design",
    "Design Systems",
    "Framer",
  ],
  "Data & Analytics": [
    "Python",
    "R",
    "SQL",
    "Tableau",
    "Power BI",
    "Excel",
    "Machine Learning",
    "Data Visualization",
    "Statistics",
    "Pandas",
    "NumPy",
  ],
};

export default function CreateProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const createProject = useMutation(
    (api as any)["projects/mutations"].createProject
  );

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    // Section 1: Hire Type
    hireType: "single" as HireType,
    teamSize: undefined as TeamSize | undefined,
    // Section 2: Project Overview
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    timelineFlexible: false,
    projectType: "one_time" as ProjectType,
    // Section 3: Talent Requirements
    talentCategory: "" as string,
    experienceLevel: "mid" as ExperienceLevel,
    requiredSkills: [] as string[],
    // Section 4: Budget / Notes
    specialRequirements: "",
  });

  const [newSkill, setNewSkill] = useState("");

  // Calculate budget based on form data
  const budgetCalculation = useMemo(() => {
    if (
      !formData.startDate ||
      !formData.endDate ||
      !formData.experienceLevel ||
      !formData.projectType
    ) {
      return null;
    }

    try {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return null;
      }

      if (endDate <= startDate) {
        return null;
      }

      return calculateProjectBudget({
        hireType: formData.hireType,
        teamSize: formData.teamSize,
        experienceLevel: formData.experienceLevel,
        projectType: formData.projectType,
        startDate,
        endDate,
        timelineFlexible: formData.timelineFlexible,
      });
    } catch (err) {
      return null;
    }
  }, [
    formData.hireType,
    formData.teamSize,
    formData.startDate,
    formData.endDate,
    formData.experienceLevel,
    formData.projectType,
    formData.timelineFlexible,
  ]);

  const availableSkills = useMemo(() => {
    if (!formData.talentCategory) return [];
    return COMMON_SKILLS_BY_CATEGORY[formData.talentCategory] || [];
  }, [formData.talentCategory]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.requiredSkills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        requiredSkills: [...formData.requiredSkills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      requiredSkills: formData.requiredSkills.filter((s) => s !== skill),
    });
  };

  const handleNext = () => {
    setError(null);

    if (step === 1) {
      // Validate Section 1: Hire Type
      if (!formData.hireType) {
        setError("Please select hire type");
        return;
      }
      if (formData.hireType === "team" && !formData.teamSize) {
        setError("Please select team size");
        return;
      }
    } else if (step === 2) {
      // Validate Section 2: Project Overview
      if (!formData.title.trim()) {
        setError("Project title is required");
        return;
      }
      if (!formData.description.trim()) {
        setError("Project description is required");
        return;
      }
      if (!formData.startDate) {
        setError("Start date is required");
        return;
      }
      if (!formData.endDate) {
        setError("End date is required");
        return;
      }
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        setError("Invalid date format");
        return;
      }
      if (endDate <= startDate) {
        setError("End date must be after start date");
        return;
      }
      if (!formData.projectType) {
        setError("Please select project type");
        return;
      }
    } else if (step === 3) {
      // Validate Section 3: Talent Requirements
      if (!formData.talentCategory) {
        setError("Please select a talent category");
        return;
      }
      if (!formData.experienceLevel) {
        setError("Please select experience level");
        return;
      }
      if (!budgetCalculation) {
        setError("Unable to calculate budget. Please check your dates.");
        return;
      }
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!budgetCalculation) {
      setError("Unable to calculate budget. Please check your dates.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      // Platform fee is 10%
      const platformFee = 10;
      const totalAmount = budgetCalculation.estimatedBudget;

      const projectId = await createProject({
        intakeForm: {
          hireType: formData.hireType,
          teamSize: formData.teamSize,
          title: formData.title,
          description: formData.description,
          startDate: startDate.getTime(),
          endDate: endDate.getTime(),
          timelineFlexible: formData.timelineFlexible,
          projectType: formData.projectType,
          talentCategory: formData.talentCategory,
          experienceLevel: formData.experienceLevel,
          requiredSkills: formData.requiredSkills,
          budget: totalAmount,
          specialRequirements: formData.specialRequirements || undefined,
          // Legacy fields for backward compatibility
          timeline: `${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`,
          category: formData.talentCategory,
          estimatedBudget: totalAmount,
        },
        totalAmount,
        platformFee,
        currency: "usd",
        ...(user?._id ? { userId: user._id } : {}),
      });

      // Redirect to payment page
      router.push(`/dashboard/projects/${projectId}/payment`);
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== "client") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Only clients can create projects.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold">Create New Project</h1>
        <p className="text-muted-foreground">
          Fill out the form below to create your project and get matched with
          vetted freelancers.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                s === step
                  ? "border-primary bg-primary text-primary-foreground"
                  : s < step
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted text-muted-foreground"
              }`}
            >
              {s}
            </div>
            {s < 4 && (
              <div
                className={`h-1 w-16 ${
                  s < step ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "Section 1: Hire Type"}
            {step === 2 && "Section 2: Project Overview"}
            {step === 3 && "Section 3: Talent Requirements"}
            {step === 4 && "Section 4: Budget / Notes"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "What would you like to hire?"}
            {step === 2 && "Tell us about your project"}
            {step === 3 && "Specify talent requirements"}
            {step === 4 && "Review budget and add notes"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Hire Type */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  1. What would you like to hire?
                </Label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="hireType"
                      value="single"
                      checked={formData.hireType === "single"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hireType: e.target.value as HireType,
                          teamSize: undefined,
                        })
                      }
                      className="w-4 h-4 text-primary border-border focus:ring-primary focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-foreground group-hover:text-primary">
                      A single talent
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="hireType"
                      value="team"
                      checked={formData.hireType === "team"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hireType: e.target.value as HireType,
                        })
                      }
                      className="w-4 h-4 text-primary border-border focus:ring-primary focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-foreground group-hover:text-primary">
                      A team
                    </span>
                  </label>
                </div>
              </div>

              {formData.hireType === "team" && (
                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-base font-semibold">
                    2. If a team, how many people do you need?
                  </Label>
                  <div className="space-y-3">
                    {TEAM_SIZES.map((size) => (
                      <label
                        key={size.value}
                        className="flex items-center space-x-3 cursor-pointer group"
                      >
                        <input
                          type="radio"
                          name="teamSize"
                          value={size.value}
                          checked={formData.teamSize === size.value}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              teamSize: e.target.value as TeamSize,
                            })
                          }
                          className="w-4 h-4 text-primary border-border focus:ring-primary focus:ring-2 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-foreground group-hover:text-primary">
                          {size.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Project Overview */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-base font-semibold">
                  3. Project title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Build a modern e-commerce website"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="h-11"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-base font-semibold">
                  4. Brief description of your project and expected outcome
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project in detail..."
                  rows={6}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  5. Project timeline:
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      min={formData.startDate}
                      className="h-11"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="timelineFlexible"
                    checked={formData.timelineFlexible}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        timelineFlexible: checked === true,
                      })
                    }
                  />
                  <Label
                    htmlFor="timelineFlexible"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Timeline flexible
                  </Label>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  6. Project type:
                </Label>
                <div className="space-y-3">
                  {PROJECT_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className="flex items-center space-x-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="projectType"
                        value={type.value}
                        checked={formData.projectType === type.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            projectType: e.target.value as ProjectType,
                          })
                        }
                        className="w-4 h-4 text-primary border-border focus:ring-primary focus:ring-2 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-foreground group-hover:text-primary">
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Talent Requirements */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  7. Which talent category do you need?
                </Label>
                <Select
                  value={formData.talentCategory}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      talentCategory: value,
                      requiredSkills: [], // Reset skills when category changes
                    })
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select talent category" />
                  </SelectTrigger>
                  <SelectContent>
                    {TALENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  8. Required level of experience:
                </Label>
                <div className="space-y-3">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <label
                      key={level.value}
                      className="flex items-center space-x-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="experienceLevel"
                        value={level.value}
                        checked={formData.experienceLevel === level.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            experienceLevel: e.target.value as ExperienceLevel,
                          })
                        }
                        className="w-4 h-4 text-primary border-border focus:ring-primary focus:ring-2 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-foreground group-hover:text-primary">
                        {level.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  9. Key skills or tools required (optional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className="h-11 flex-1"
                  />
                  <Button type="button" onClick={handleAddSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {availableSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {availableSkills.map((skill) => (
                      <Badge
                        key={skill}
                        variant={
                          formData.requiredSkills.includes(skill)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => {
                          if (formData.requiredSkills.includes(skill)) {
                            handleRemoveSkill(skill);
                          } else {
                            setFormData({
                              ...formData,
                              requiredSkills: [
                                ...formData.requiredSkills,
                                skill,
                              ],
                            });
                          }
                        }}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
                {formData.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {formData.requiredSkills.map((skill) => (
                      <Badge key={skill} variant="default">
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 rounded-full hover:bg-primary/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Budget Preview */}
              {budgetCalculation && (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Estimated Budget</span>
                    <span className="text-lg font-bold">
                      {formatBudget(budgetCalculation.estimatedBudget)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      Base rate: {formatBudget(budgetCalculation.breakdown.baseRate)}
                      {budgetCalculation.breakdown.totalHours && (
                        <span> × {budgetCalculation.breakdown.totalHours} hours</span>
                      )}
                      {budgetCalculation.breakdown.totalDays && (
                        <span> × {budgetCalculation.breakdown.totalDays} days</span>
                      )}
                    </div>
                    <div>
                      Timeline multiplier:{" "}
                      {(budgetCalculation.breakdown.timelineMultiplier * 100).toFixed(0)}%
                    </div>
                    <div>
                      Project type multiplier:{" "}
                      {(budgetCalculation.breakdown.projectTypeMultiplier * 100).toFixed(0)}%
                    </div>
                    {budgetCalculation.breakdown.teamMultiplier && (
                      <div>
                        Team size: {budgetCalculation.breakdown.teamMultiplier} members
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      Platform fee (10%):{" "}
                      {formatBudget(
                        budgetCalculation.estimatedBudget * 0.1
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Budget / Notes */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  10. Estimated budget range:
                </Label>
                {budgetCalculation ? (
                  <div className="rounded-lg border bg-primary/5 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">
                        Total Project Budget
                      </span>
                      <span className="text-3xl font-bold text-primary">
                        {formatBudget(budgetCalculation.estimatedBudget)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Base amount:</span>
                        <div className="font-semibold">
                          {formatBudget(
                            budgetCalculation.estimatedBudget /
                              budgetCalculation.breakdown.timelineMultiplier /
                              budgetCalculation.breakdown.projectTypeMultiplier
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Platform fee (10%):</span>
                        <div className="font-semibold">
                          {formatBudget(budgetCalculation.estimatedBudget * 0.1)}
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
                      <p>
                        <strong>Experience Level:</strong> {formData.experienceLevel.charAt(0).toUpperCase() + formData.experienceLevel.slice(1)}
                      </p>
                      <p>
                        <strong>Project Type:</strong>{" "}
                        {formData.projectType === "one_time"
                          ? "One-time / Milestone-based"
                          : formData.projectType === "ongoing"
                          ? "Ongoing / Hourly-Monthly"
                          : "Let 49GIG decide"}
                      </p>
                      {formData.timelineFlexible && (
                        <p>
                          <strong>Timeline:</strong> Flexible (10% discount applied)
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                    Unable to calculate budget. Please check your project dates.
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="specialRequirements" className="text-base font-semibold">
                  11. Any special requirements or notes? (optional)
                </Label>
                <Textarea
                  id="specialRequirements"
                  placeholder="Any additional requirements or notes..."
                  rows={4}
                  value={formData.specialRequirements}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      specialRequirements: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1 || isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {step < 4 ? (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting || !budgetCalculation}>
            {isSubmitting ? "Creating..." : "Create Project"}
          </Button>
        )}
      </div>
    </div>
  );
}
