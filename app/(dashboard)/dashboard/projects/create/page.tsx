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
import { TALENT_CATEGORY_LABELS } from "@/lib/platform-skills";

const PROJECT_DURATIONS = [
  { value: "3", label: "3 months" },
  { value: "6", label: "6 months" },
  { value: "12+", label: "1 year +" },
] as const;

export type ProjectDuration = (typeof PROJECT_DURATIONS)[number]["value"];

const DURATION_DAYS: Record<ProjectDuration, number> = {
  "3": 90,
  "6": 180,
  "12+": 365,
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
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
] as const;

export type RoleType = (typeof ROLE_TYPES)[number]["value"];

// Both full time and part time map to ongoing project type
function roleTypeToProjectType(_roleType: RoleType): ProjectType {
  return "ongoing";
}

// Map selected skills to talentCategory for schema (primary = first selected)
function skillsToTalentCategory(skills: string[]): (typeof TALENT_CATEGORY_LABELS)[number] {
  const first = skills[0];
  if (first && TALENT_CATEGORY_LABELS.includes(first as any)) return first as (typeof TALENT_CATEGORY_LABELS)[number];
  return "Software Development";
}

// Parse "YYYY-MM-DD" as local date (avoids calendar off-by-one from UTC)
function parseLocalDateString(value: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return null;
  return date;
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
    roleType: "full_time" as RoleType,
    description: "",
    projectDuration: "3" as ProjectDuration,
    deliverablesText: "",
    budgetOverride: "" as string,
    experienceLevel: "mid" as ExperienceLevel,
    startDate: "",
    // Notes
    specialRequirements: "",
  });

  // Derive endDate from startDate + projectDuration (use local date to match calendar)
  const derivedEndDate = useMemo(() => {
    if (!formData.startDate || !formData.projectDuration) return null;
    const start = parseLocalDateString(formData.startDate);
    if (!start) return null;
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
      const startDate = parseLocalDateString(formData.startDate);
      if (!startDate || isNaN(startDate.getTime())) {
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
      const startDate = parseLocalDateString(formData.startDate);
      if (!startDate) return null;
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
      const startDate = parseLocalDateString(formData.startDate);
      if (!startDate || isNaN(startDate.getTime())) {
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
      const startDate = parseLocalDateString(formData.startDate);
      if (!startDate || !derivedEndDate) {
        setError("Invalid start date or duration.");
        setIsSubmitting(false);
        return;
      }
      const endDate = derivedEndDate;

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
          timeline:
            formData.projectDuration === "12+"
              ? "1 year +"
              : `${formData.projectDuration} months`,
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

  const stepsConfig = [
    { num: 1, title: "Hire type", desc: "Single or team" },
    { num: 2, title: "Requirements", desc: "Scope & details" },
    { num: 3, title: "Budget", desc: "Review & confirm" },
  ];

  return (
    <div className="min-h-[80vh] rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      {/* Header with gradient accent */}
      <div className="border-b border-border/60 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 px-6 py-8">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground">
          Create new project
        </h1>
        <p className="mt-1.5 text-sm sm:text-base text-muted-foreground max-w-xl">
          Fill out the steps below and we’ll match you with vetted freelancers.
        </p>

        {/* Progress stepper */}
        <div className="mt-8 flex items-center gap-0">
          {stepsConfig.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    step === s.num
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : step > s.num
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/80 text-muted-foreground"
                  }`}
                >
                  {step > s.num ? "✓" : s.num}
                </div>
                <span className={`hidden sm:inline text-sm font-medium ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.title}
                </span>
              </div>
              {i < stepsConfig.length - 1 && (
                <div className={`mx-2 sm:mx-4 h-0.5 flex-1 rounded-full transition-colors ${step > s.num ? "bg-primary" : "bg-muted/60"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-6 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3">
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      <div className="px-6 py-8 sm:px-8 sm:py-10">
        <Card className="border-border/60 shadow-none bg-transparent">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">
              {step === 1 && "What would you like to hire?"}
              {step === 2 && "Project requirements"}
              {step === 3 && "Budget & review"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {step === 1 && "Choose a single talent or a team for this project."}
              {step === 2 && "Define the role, scope, duration, and skills."}
              {step === 3 && "Confirm the budget and add any final notes."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
          {/* Step 1: Hire Type */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Hire type</Label>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        hireType: "single",
                        teamSize: undefined,
                      })
                    }
                    className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                      formData.hireType === "single"
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border/60 bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-lg">👤</div>
                    <div>
                      <p className="font-semibold text-foreground">Single talent</p>
                      <p className="text-xs text-muted-foreground">One vetted freelancer</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, hireType: "team" })}
                    className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                      formData.hireType === "team"
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border/60 bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-lg">👥</div>
                    <div>
                      <p className="font-semibold text-foreground">Team</p>
                      <p className="text-xs text-muted-foreground">Multiple freelancers</p>
                    </div>
                  </button>
                </div>
              </div>

              {formData.hireType === "team" && (
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <Label className="text-sm font-medium">Team size</Label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {TEAM_SIZES.map((size) => (
                      <button
                        key={size.value}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, teamSize: size.value as TeamSize })
                        }
                        className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                          formData.teamSize === size.value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border/60 bg-background hover:border-primary/50"
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Project Requirements */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Project title</Label>
                <p className="mt-1 text-sm text-muted-foreground">A clear title for the role or outcome (e.g. Build an e‑commerce site, Mobile app for inventory).</p>
                <Input
                  id="title"
                  placeholder="e.g., Build a modern e-commerce website, Mobile app for inventory management"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-3 h-11 rounded-lg border-border/60"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Skills required</Label>
                <p className="mt-1 text-sm text-muted-foreground">Select all that apply.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TALENT_CATEGORY_LABELS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                        formData.skillsRequired.includes(skill)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 bg-muted/30 hover:border-primary/40"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Role type</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ROLE_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, roleType: type.value as RoleType })}
                      className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                        formData.roleType === type.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/60 bg-muted/30 hover:border-primary/50"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Project scope / description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe scope, deliverables, and any constraints..."
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-3 rounded-lg border-border/60"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Project duration</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PROJECT_DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, projectDuration: d.value as ProjectDuration })}
                      className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                        formData.projectDuration === d.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/60 bg-muted/30 hover:border-primary/50"
                      }`}
                    >
                      {d.label}
                    </button>
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

              <div>
                <Label htmlFor="budgetOverride" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Budget (optional)</Label>
                <p className="mt-1 text-sm text-muted-foreground">Leave empty to use our estimate from duration and experience.</p>
                <Input
                  id="budgetOverride"
                  type="number"
                  placeholder="e.g., 5000"
                  value={formData.budgetOverride}
                  onChange={(e) => setFormData({ ...formData, budgetOverride: e.target.value })}
                  className="mt-3 h-11 rounded-lg border-border/60"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Preferred experience level</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, experienceLevel: level.value as ExperienceLevel })}
                      className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                        formData.experienceLevel === level.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/60 bg-muted/30 hover:border-primary/50"
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="startDate" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Start date</Label>
                <DatePicker
                  id="startDate"
                  date={formData.startDate ? parseLocalDateString(formData.startDate) ?? undefined : undefined}
                  onDateChange={(date) => {
                    if (!date) {
                      setFormData({ ...formData, startDate: "" });
                      return;
                    }
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, "0");
                    const d = String(date.getDate()).padStart(2, "0");
                    setFormData({ ...formData, startDate: `${y}-${m}-${d}` });
                  }}
                  placeholder="Select start date"
                  minDate={new Date()}
                  className="mt-3"
                />
              </div>

              {/* Budget Preview */}
              {budgetCalculation && (
                <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Estimated budget</span>
                    <span className="text-xl font-bold text-primary tabular-nums">
                      {formatBudget(budgetCalculation.estimatedBudget)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total you pay. Includes 25% service fee (vetting, escrow, contracts, support). Talent receives 75%.
                  </p>
                  <div className="text-xs text-muted-foreground space-y-2 pt-2 border-t border-border/40">
                    <div className="font-medium text-foreground/80">How we calculated it</div>
                    <div>
                      Base rate: {formatBudget(budgetCalculation.breakdown.baseRate)}
                      {budgetCalculation.breakdown.totalHours != null && (
                        <span>/hr × {budgetCalculation.breakdown.totalHours} hrs</span>
                      )}
                      {budgetCalculation.breakdown.totalDays != null && (
                        <span>/day × {budgetCalculation.breakdown.totalDays} days</span>
                      )}
                      {budgetCalculation.breakdown.monthlyRate != null && (
                        <span>/mo (ongoing)</span>
                      )}
                    </div>
                    <div>
                      Timeline factor: {(budgetCalculation.breakdown.timelineMultiplier * 100).toFixed(0)}%
                      {budgetCalculation.breakdown.timelineMultiplier < 1 && " (discount for longer timeline)"}
                    </div>
                    <div>
                      Project type factor: {(budgetCalculation.breakdown.projectTypeMultiplier * 100).toFixed(0)}%
                      {budgetCalculation.breakdown.projectTypeMultiplier < 1 && " (e.g. ongoing discount)"}
                    </div>
                    {budgetCalculation.breakdown.teamMultiplier != null && (
                      <div>Team size: {budgetCalculation.breakdown.teamMultiplier} equivalent members</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Budget / Review */}
          {step === 3 && (
            <div className="space-y-8">
              <div>
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Payment breakdown</Label>
                {paymentBreakdown ? (
                  <div className="mt-3">
                    <PaymentBreakdownDisplay breakdown={paymentBreakdown} />
                  </div>
                ) : budgetCalculation ? (
                  <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total project budget</span>
                      <span className="text-2xl font-bold text-primary tabular-nums">
                        {formatBudget(budgetCalculation.estimatedBudget)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You pay this total. 25% is the platform service fee; 75% goes to talent.
                    </p>
                    <div className="grid grid-cols-1 gap-4 pt-3 border-t border-border/40 text-sm sm:grid-cols-2">
                      <div className="rounded-lg border border-border/60 bg-background/50 p-3 sm:border-0 sm:bg-transparent sm:p-0">
                        <span className="text-muted-foreground">Service fee (25%)</span>
                        <div className="font-semibold tabular-nums">
                          {formatBudget(budgetCalculation.estimatedBudget * 0.25)}
                        </div>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-background/50 p-3 sm:border-0 sm:bg-transparent sm:p-0">
                        <span className="text-muted-foreground">Talent receives (75%)</span>
                        <div className="font-semibold tabular-nums">
                          {formatBudget(budgetCalculation.estimatedBudget * 0.75)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    Unable to calculate budget. Please check your project dates.
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="specialRequirements" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Special requirements or notes (optional)</Label>
                <Textarea
                  id="specialRequirements"
                  name="specialRequirements"
                  autoComplete="off"
                  placeholder="e.g. time zone, tools, or extra instructions"
                  rows={4}
                  value={formData.specialRequirements}
                  onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                  className="mt-3 rounded-lg border-border/60 min-h-[6rem]"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

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
