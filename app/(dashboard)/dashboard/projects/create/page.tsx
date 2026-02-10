"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { DatePicker } from "@/components/ui/date-picker";
import {
  calculateProjectBudget,
  formatBudget,
  type ExperienceLevel,
  type ProjectType,
  type HireType,
  type TeamSize,
} from "@/lib/budget-calculator";
import {
  calculatePayment,
  type PaymentBreakdown,
} from "@/lib/payment-calculator";
import { PaymentBreakdownDisplay } from "@/components/payments/payment-breakdown";

const PROJECT_DURATIONS = [
  { value: "1-3", label: "1–3 months" },
  { value: "3-6", label: "3–6 months" },
  { value: "6+", label: "6+ months" },
] as const;

export type ProjectDuration = (typeof PROJECT_DURATIONS)[number]["value"];

const DURATION_DAYS: Record<ProjectDuration, number> = {
  "1-3": 60,
  "3-6": 135,
  "6+": 270,
};

const EXPERIENCE_LEVELS = [
  { value: "junior", label: "Junior (1–3 years)" },
  { value: "mid", label: "Mid-level (3–5 years)" },
  { value: "senior", label: "Senior (5+ years)" },
] as const;

const TEAM_SIZES = [
  { value: "2-3", label: "2–3" },
  { value: "4-6", label: "4–6" },
  { value: "7+", label: "7+" },
  { value: "not_sure", label: "Not sure (let 49GIG recommend)" },
] as const;

const ROLE_TYPES = [
  { value: "full_time", label: "Full-Time" },
  { value: "part_time", label: "Part-Time" },
  { value: "contract", label: "Contract / Freelance" },
] as const;

export type RoleType = (typeof ROLE_TYPES)[number]["value"];

// Derive projectType from roleType for backend (Contract → one_time, Full/Part → ongoing)
function roleTypeToProjectType(roleType: RoleType): ProjectType {
  return roleType === "contract" ? "one_time" : "ongoing";
}

// Skills Required - select all that apply (per image)
const SKILLS_REQUIRED_OPTIONS = [
  "Software Development",
  "UI/UX Design",
  "Data & Analytics",
  "DevOps",
  "AI/ML",
  "Blockchain",
  "Cybersecurity",
  "QA & Testing",
] as const;

// Map selected skill to talentCategory for schema (one of 3)
function skillsToTalentCategory(skills: string[]): string {
  if (skills.some((s) => s === "UI/UX Design")) return "UI/UX & Product Design";
  if (skills.some((s) => s === "Data & Analytics")) return "Data & Analytics";
  return "Software Development";
}

export default function CreateProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const createProject = useMutation(
    (api as any)["projects/mutations"].createProject
  );
  const pricingConfig = useQuery(api.pricing.queries.getPricingConfig);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    // Section 1: Hire Type
    hireType: "single" as HireType,
    teamSize: undefined as TeamSize | undefined,
    // Section 2: Project Requirements (per image)
    title: "",
    skillsRequired: [] as string[],
    roleType: "contract" as RoleType,
    description: "",
    projectDuration: "1-3" as ProjectDuration,
    deliverablesText: "",
    budgetOverride: "" as string,
    experienceLevel: "mid" as ExperienceLevel,
    startDate: "",
    // Notes
    specialRequirements: "",
  });

  // Derive endDate from startDate + projectDuration
  const derivedEndDate = useMemo(() => {
    if (!formData.startDate || !formData.projectDuration) return null;
    const start = new Date(formData.startDate);
    if (isNaN(start.getTime())) return null;
    const days = DURATION_DAYS[formData.projectDuration];
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    return end;
  }, [formData.startDate, formData.projectDuration]);

  const projectType = roleTypeToProjectType(formData.roleType);

  // Calculate budget based on form data
  const budgetCalculation = useMemo(() => {
    if (
      !formData.startDate ||
      !derivedEndDate ||
      !formData.experienceLevel
    ) {
      return null;
    }

    try {
      const startDate = new Date(formData.startDate);

      if (isNaN(startDate.getTime())) {
        return null;
      }

      const talentCategory = skillsToTalentCategory(formData.skillsRequired);
      const calc = calculateProjectBudget({
        hireType: formData.hireType,
        teamSize: formData.teamSize,
        experienceLevel: formData.experienceLevel,
        projectType,
        startDate,
        endDate: derivedEndDate,
        talentCategory,
        baseRatesByCategory: pricingConfig ?? undefined,
      });
      const override = formData.budgetOverride ? parseFloat(formData.budgetOverride) : undefined;
      if (override != null && !isNaN(override) && override > 0) {
        return { ...calc, estimatedBudget: override };
      }
      return calc;
    } catch (err) {
      return null;
    }
  }, [
    formData.hireType,
    formData.teamSize,
    formData.startDate,
    derivedEndDate,
    formData.experienceLevel,
    formData.roleType,
    formData.budgetOverride,
    formData.skillsRequired,
    pricingConfig,
  ]);

  // Calculate payment breakdown
  const paymentBreakdown = useMemo<PaymentBreakdown | null>(() => {
    if (!budgetCalculation || !derivedEndDate) return null;

    try {
      const startDate = new Date(formData.startDate);
      const deliverables = formData.deliverablesText
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      return calculatePayment({
        totalAmount: budgetCalculation.estimatedBudget,
        projectType,
        hireType: formData.hireType,
        experienceLevel: formData.experienceLevel,
        startDate,
        endDate: derivedEndDate,
        deliverables: deliverables.length > 0 ? deliverables : undefined,
        estimatedHours: budgetCalculation.breakdown.totalHours,
      });
    } catch (err) {
      return null;
    }
  }, [budgetCalculation, formData, derivedEndDate]);


  const toggleSkill = (skill: string) => {
    setFormData({
      ...formData,
      skillsRequired: formData.skillsRequired.includes(skill)
        ? formData.skillsRequired.filter((s) => s !== skill)
        : [...formData.skillsRequired, skill],
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
      // Validate Section 2: Project Requirements
      if (!formData.title.trim()) {
        setError("Project title / role is required");
        return;
      }
      if (!formData.skillsRequired.length) {
        setError("Please select at least one skill");
        return;
      }
      if (!formData.description.trim()) {
        setError("Project scope / description is required");
        return;
      }
      if (!formData.startDate) {
        setError("Start date is required");
        return;
      }
      if (!formData.projectDuration) {
        setError("Please select project duration");
        return;
      }
      const startDate = new Date(formData.startDate);
      if (isNaN(startDate.getTime())) {
        setError("Invalid start date format");
        return;
      }
    } else if (step === 3) {
      if (!budgetCalculation) {
        setError("Unable to calculate budget. Please check your inputs.");
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

    if (!paymentBreakdown) {
      setError("Unable to calculate payment breakdown");
      return;
    }

    try {
      const startDate = new Date(formData.startDate);
      const endDate = derivedEndDate!;

      // Use payment breakdown for platform fee
      const totalAmount = paymentBreakdown.totalAmount;
      const platformFee = paymentBreakdown.platformFeePercentage;

      const deliverables = formData.deliverablesText
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const projectId = await createProject({
        intakeForm: {
          hireType: formData.hireType,
          teamSize: formData.teamSize,
          title: formData.title,
          description: formData.description,
          startDate: startDate.getTime(),
          endDate: endDate.getTime(),
          projectType,
          talentCategory: skillsToTalentCategory(formData.skillsRequired),
          experienceLevel: formData.experienceLevel,
          requiredSkills: formData.skillsRequired,
          budget: totalAmount,
          specialRequirements: formData.specialRequirements || undefined,
          roleTitle: formData.title.trim() || undefined,
          projectDuration: formData.projectDuration,
          roleType: formData.roleType,
          timeline: `${formData.projectDuration} months`,
          category: skillsToTalentCategory(formData.skillsRequired),
          estimatedBudget: totalAmount,
          deliverables: deliverables.length > 0 ? deliverables : undefined,
        },
        totalAmount,
        platformFee,
        currency: "usd",
        ...(user?._id ? { userId: user._id } : {}),
      });

      // Redirect to matches page so client can select freelancer(s), then payment
      router.push(`/dashboard/projects/${projectId}/matches`);
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
        {[1, 2, 3].map((s) => (
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
            {s < 3 && (
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
            {step === 1 && "Step 1: Hire Type"}
            {step === 2 && "Step 2: Project Requirements"}
            {step === 3 && "Step 3: Budget / Review"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "What would you like to hire?"}
            {step === 2 && "Define your project requirements"}
            {step === 3 && "Review budget and confirm"}
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

          {/* Step 2: Project Requirements (per image) */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-base font-semibold">
                  Project Title
                </Label>
                <p className="text-sm text-muted-foreground">
                  A clear, descriptive title for your project (e.g., what you&apos;re building or the outcome you need).
                </p>
                <Input
                  id="title"
                  placeholder="e.g., Build a modern e-commerce website, Mobile app for inventory management, CRM integration with Salesforce"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="h-11"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Skills Required (select all that apply)
                </Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {SKILLS_REQUIRED_OPTIONS.map((skill) => (
                    <label
                      key={skill}
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.skillsRequired.includes(skill)}
                        onChange={() => toggleSkill(skill)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium">{skill}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Role Type
                </Label>
                <div className="space-y-3">
                  {ROLE_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="roleType"
                        value={type.value}
                        checked={formData.roleType === type.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            roleType: e.target.value as RoleType,
                          })
                        }
                        className="h-4 w-4 text-primary border-border focus:ring-primary"
                      />
                      <span className="text-sm font-medium">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-base font-semibold">
                  Project Scope / Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project scope and details..."
                  rows={5}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Project Duration
                </Label>
                <div className="space-y-3">
                  {PROJECT_DURATIONS.map((d) => (
                    <label
                      key={d.value}
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="projectDuration"
                        value={d.value}
                        checked={formData.projectDuration === d.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            projectDuration: e.target.value as ProjectDuration,
                          })
                        }
                        className="h-4 w-4 text-primary border-border focus:ring-primary"
                      />
                      <span className="text-sm font-medium">{d.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="deliverablesText" className="text-base font-semibold">
                  Deliverables Expected
                </Label>
                <p className="text-sm text-muted-foreground">
                  List the main phases or outcomes you expect. These become payment milestones. Use clear, outcome-based descriptions.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Examples: Design mockups, Backend API, Frontend build, Testing &amp; QA, Deployment</li>
                  <li>One per line, or comma-separated (2–5 milestones recommended)</li>
                  <li>Leave empty and we&apos;ll generate milestones from your project description</li>
                </ul>
                <Textarea
                  id="deliverablesText"
                  placeholder={"e.g., Design mockups\nBackend API\nFrontend & integration\nTesting & handoff"}
                  rows={4}
                  value={formData.deliverablesText}
                  onChange={(e) =>
                    setFormData({ ...formData, deliverablesText: e.target.value })
                  }
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="budgetOverride" className="text-base font-semibold">
                  Budget (Optional)
                </Label>
                <Input
                  id="budgetOverride"
                  type="number"
                  placeholder="e.g., 5000"
                  value={formData.budgetOverride}
                  onChange={(e) =>
                    setFormData({ ...formData, budgetOverride: e.target.value })
                  }
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use our estimated budget based on duration and experience level.
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Preferred Experience Level
                </Label>
                <div className="space-y-3">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <label
                      key={level.value}
                      className="flex items-center space-x-3 cursor-pointer"
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
                        className="h-4 w-4 text-primary border-border focus:ring-primary"
                      />
                      <span className="text-sm font-medium">{level.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="startDate" className="text-base font-semibold">
                  Start Date
                </Label>
                <DatePicker
                  id="startDate"
                  date={
                    formData.startDate
                      ? new Date(formData.startDate)
                      : undefined
                  }
                  onDateChange={(date) =>
                    setFormData({
                      ...formData,
                      startDate: date ? date.toISOString().split("T")[0] : "",
                    })
                  }
                  placeholder="Select start date"
                  minDate={new Date()}
                />
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
                      Service fee (25%): includes vetting, escrow, contracts, replacements, support —{" "}
                      {formatBudget(
                        budgetCalculation.estimatedBudget * 0.25
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Budget / Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  10. Payment breakdown:
                </Label>
                {paymentBreakdown ? (
                  <PaymentBreakdownDisplay breakdown={paymentBreakdown} />
                ) : budgetCalculation ? (
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
                        <span className="text-muted-foreground">Service fee (25%): vetting, escrow, contracts, support</span>
                        <div className="font-semibold">
                          {formatBudget(budgetCalculation.estimatedBudget * 0.25)}
                        </div>
                      </div>
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
        {step < 3 ? (
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
