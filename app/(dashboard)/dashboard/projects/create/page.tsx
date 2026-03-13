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
import { ArrowRight, ArrowLeft, Info } from "lucide-react";
import { getUserFriendlyError } from "@/lib/error-handling";
import { useAuth } from "@/hooks/use-auth";
import { DatePicker } from "@/components/ui/date-picker";
import {
  calculateProjectBudget,
  formatBudget,
  computeTeamBudgetBreakdown,
  getSoftwareDevRoleDisplayName,
  type ExperienceLevel,
  type ProjectType,
  type HireType,
  type TeamSize,
} from "@/lib/budget-calculator";
import {
  PLATFORM_ROLES,
  getSkillsForRole,
  getCategoryLabelForRole,
  SOFTWARE_DEV_FIELDS,
  getSoftwareDevFieldSkills,
  getSoftwareDevFieldLabel,
} from "@/lib/platform-skills";
import { toast } from "sonner";

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

/** Duration discount: 3% for 3 months, 5% for 6+ months */
const DURATION_DISCOUNT: Record<ProjectDuration, number> = {
  "3": 0.97,
  "6": 0.95,
  "12+": 0.95,
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

// Primary category from first selected role (for schema)
function getPrimaryCategory(selectedRoles: string[]): string {
  if (selectedRoles.length === 0) return "Software Development";
  return getCategoryLabelForRole(selectedRoles[0]);
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
  const platformFeePct = useQuery(
    (api as any)["platformSettings/queries"].getPlatformFeePercentage
  );
  const pricingConfig = useQuery(api.pricing.queries.getPricingConfig);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state: roles first, then skills per role
  const [formData, setFormData] = useState({
    hireType: "single" as HireType,
    teamSize: undefined as TeamSize | undefined,
    title: "",
    selectedRoles: [] as string[], // Role ids (e.g. software_development)
    roleSkills: {} as Record<string, string[]>, // roleId -> selected skills
    softwareDevFields: [] as string[],           // selected sub-fields when software_dev is chosen
    roleType: "full_time" as RoleType,
    description: "",
    projectDuration: "3" as ProjectDuration,
    experienceLevel: "mid" as ExperienceLevel,
    startDate: "",
    specialRequirements: "",
    monthsToFund: 1, // Number of months to pay for now (must be at least 1)
  });

  // Derive endDate from startDate + projectDuration (use local date to match calendar)
  const derivedEndDate = useMemo(() => {
    if (!formData.startDate || !formData.projectDuration) return null;
    const start = parseLocalDateString(formData.startDate);
    if (!start || isNaN(start.getTime())) return null;
    const days = DURATION_DAYS[formData.projectDuration as ProjectDuration];
    if (days == null || days <= 0) return null;
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    return isNaN(end.getTime()) ? null : end;
  }, [formData.startDate, formData.projectDuration]);

  const projectType = roleTypeToProjectType(formData.roleType);

  // Must be declared before budgetCalculation useMemo to avoid TDZ ReferenceError
  const allRequiredSkills = Object.values(formData.roleSkills).flat();

  // Calculate budget based on form data
  const budgetCalculation = useMemo(() => {
    if (
      !formData.startDate ||
      !formData.projectDuration ||
      !derivedEndDate ||
      !formData.experienceLevel
    ) {
      return null;
    }

    try {
      if (formData.selectedRoles.length === 0) return null;

      const startDate = parseLocalDateString(formData.startDate);
      if (!startDate || isNaN(startDate.getTime())) {
        return null;
      }
      if (isNaN(derivedEndDate.getTime()) || derivedEndDate.getTime() < startDate.getTime()) {
        return null;
      }

      const categoriesForBudget = formData.selectedRoles.map((r) => getCategoryLabelForRole(r));
      const calc = calculateProjectBudget({
        hireType: formData.hireType,
        teamSize: formData.teamSize,
        experienceLevel: formData.experienceLevel,
        projectType,
        startDate,
        endDate: derivedEndDate,
        talentCategory: getPrimaryCategory(formData.selectedRoles),
        baseRatesByCategory: pricingConfig ?? undefined,
        roleType: formData.roleType,
        skillsRequired: categoriesForBudget,
        selectedSkillNames: allRequiredSkills,
      });
      const discount = DURATION_DISCOUNT[formData.projectDuration as ProjectDuration] ?? 1;
      const discountedBudget = Math.round(calc.estimatedBudget * discount);
      if (!Number.isFinite(discountedBudget) || discountedBudget <= 0) return null;
      return { ...calc, estimatedBudget: discountedBudget };
    } catch (err) {
      if (process.env.NODE_ENV !== "production") console.error("[budgetCalculation]", err);
      return null;
    }
  }, [
    formData.hireType,
    formData.teamSize,
    formData.startDate,
    formData.projectDuration,
    derivedEndDate,
    formData.experienceLevel,
    formData.roleType,
    formData.selectedRoles,
    formData.roleSkills,
    pricingConfig,
  ]);

  const toggleRole = (roleId: string) => {
    const isSingle = formData.hireType === "single";
    const alreadySelected = formData.selectedRoles.includes(roleId);
    if (alreadySelected) {
      const newRoles = formData.selectedRoles.filter((r) => r !== roleId);
      const newRoleSkills = { ...formData.roleSkills };
      delete newRoleSkills[roleId];
      setFormData({
        ...formData,
        selectedRoles: newRoles,
        roleSkills: newRoleSkills,
        softwareDevFields: roleId === "software_development" ? [] : formData.softwareDevFields,
      });
    } else {
      if (isSingle && formData.selectedRoles.length >= 1) {
        const prevRole = formData.selectedRoles[0];
        const newRoleSkills = { ...formData.roleSkills };
        delete newRoleSkills[prevRole];
        setFormData({
          ...formData,
          selectedRoles: [roleId],
          roleSkills: newRoleSkills,
          softwareDevFields: roleId === "software_development" ? formData.softwareDevFields : [],
        });
      } else {
        setFormData({ ...formData, selectedRoles: [...formData.selectedRoles, roleId] });
      }
    }
  };

  const toggleSoftwareDevField = (fieldId: string) => {
    const isSingle = formData.hireType === "single";
    const alreadySelected = formData.softwareDevFields.includes(fieldId);
    let newFields: string[];
    if (alreadySelected) {
      newFields = formData.softwareDevFields.filter((f) => f !== fieldId);
    } else if (isSingle) {
      // Single hire: only one sub-field at a time
      newFields = [fieldId];
    } else {
      newFields = [...formData.softwareDevFields, fieldId];
    }
    // When sub-fields change, reset skills for software_development so stale skills are cleared
    const newRoleSkills = { ...formData.roleSkills, software_development: [] };
    setFormData({ ...formData, softwareDevFields: newFields, roleSkills: newRoleSkills });
  };

  const toggleRoleSkill = (roleId: string, skill: string) => {
    const current = formData.roleSkills[roleId] ?? [];
    const updated = current.includes(skill)
      ? current.filter((s) => s !== skill)
      : [...current, skill];
    setFormData({
      ...formData,
      roleSkills: { ...formData.roleSkills, [roleId]: updated },
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
        setError("Project title is required");
        return;
      }
      if (formData.selectedRoles.length === 0) {
        setError("Please select at least one role");
        return;
      }
      // Require at least one sub-field when Software Developer is selected
      if (formData.selectedRoles.includes("software_development") && formData.softwareDevFields.length === 0) {
        setError("Please select a specialisation for the Software Developer role (e.g. Backend, Frontend)");
        return;
      }
      const hasSkillsForAllRoles = formData.selectedRoles.every(
        (r) => (formData.roleSkills[r]?.length ?? 0) > 0
      );
      if (!hasSkillsForAllRoles) {
        setError("Please select at least one skill for each role");
        return;
      }
      if (!formData.startDate) {
        setError("Start date is required");
        return;
      }
      if (!formData.projectDuration) {
        setError("Please select hire duration");
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

    try {
      const startDate = parseLocalDateString(formData.startDate);
      if (!startDate || !derivedEndDate) {
        setError("Invalid start date or duration.");
        setIsSubmitting(false);
        return;
      }
      const endDate = derivedEndDate;

      const totalAmount = budgetCalculation.estimatedBudget;
      const platformFee = platformFeePct ?? 25;

      const durationMonths = formData.projectDuration === "12+" ? 12 : parseInt(formData.projectDuration || "3", 10);
      const teamBudgetBreakdown =
        formData.hireType === "team" &&
        budgetCalculation.breakdown?.teamMembers &&
        budgetCalculation.breakdown.teamMembers.length > 0
          ? computeTeamBudgetBreakdown(
              budgetCalculation.breakdown.teamMembers,
              totalAmount,
              platformFee,
              durationMonths
            )
          : undefined;

      const projectId = await createProject({
        fundUpfrontMonths: Math.max(1, formData.monthsToFund),
        teamBudgetBreakdown,
        intakeForm: {
          hireType: formData.hireType,
          teamSize: formData.teamSize,
          title: formData.title,
          description: formData.description,
          startDate: startDate.getTime(),
          endDate: endDate.getTime(),
          projectType,
          talentCategory: getPrimaryCategory(formData.selectedRoles) as any,
          experienceLevel: formData.experienceLevel,
          requiredSkills: allRequiredSkills,
          softwareDevFields: formData.softwareDevFields.length > 0 ? formData.softwareDevFields : undefined,
          budget: totalAmount,
          specialRequirements: formData.specialRequirements || undefined,
          roleTitle: formData.title.trim() || undefined,
          projectDuration: formData.projectDuration,
          roleType: formData.roleType,
          timeline:
            formData.projectDuration === "12+"
              ? "1 year +"
              : `${formData.projectDuration} months`,
          category: getPrimaryCategory(formData.selectedRoles),
          estimatedBudget: totalAmount,
        },
        totalAmount,
        platformFee,
        currency: "usd",
        ...(user?._id ? { userId: user._id } : {}),
      });

      toast.success("Hire created! Select your freelancer to continue.");
      router.push(`/dashboard/projects/${projectId}/matches`);
    } catch (err: any) {
      setError(getUserFriendlyError(err) || "Failed to create hire");
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
              Only clients can create hires.
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
          Hire Talents
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
              {step === 2 && "Role requirements"}
              {step === 3 && "Budget & review"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {step === 1 && "Choose a single talent or a team for this hire."}
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
                    onClick={() => {
                      const isSwitchingToSingle = formData.hireType !== "single";
                      const newData = { ...formData, hireType: "single" as HireType, teamSize: undefined as TeamSize | undefined };
                      if (isSwitchingToSingle && formData.selectedRoles.length > 1) {
                        const keepRole = formData.selectedRoles[0];
                        newData.selectedRoles = [keepRole];
                        newData.roleSkills = formData.roleSkills[keepRole] ? { [keepRole]: formData.roleSkills[keepRole] } : {};
                      }
                      setFormData(newData);
                    }}
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

          {/* Step 2: Role Requirements */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Project title</Label>
                <p className="mt-1 text-sm text-muted-foreground">e.g. Build a modern e-commerce website, Mobile app for inventory management</p>
                <Input
                  id="title"
                  placeholder="e.g., Build a modern e-commerce website, Mobile app for inventory management"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-3 h-11 rounded-lg border-border/60"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Roles needed</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formData.hireType === "single"
                    ? "Select the role you need (e.g. Software Developer)."
                    : "Select the roles for your team. Then choose specific skills for each."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PLATFORM_ROLES.map((role) => {
                    const isSelected = formData.selectedRoles.includes(role.id);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleRole(role.id)}
                        className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 bg-muted/30 hover:border-primary/40"
                        }`}
                      >
                        {role.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Software Developer sub-field picker */}
              {formData.selectedRoles.includes("software_development") && (
                <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3">
                  <div>
                    <p className="font-medium text-foreground">Software Developer — specialisation</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formData.hireType === "team"
                        ? "Select one or more specialisations needed for your team."
                        : "Select the type of developer you need."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SOFTWARE_DEV_FIELDS.map((field) => {
                      const isSelected = formData.softwareDevFields.includes(field.id);
                      return (
                        <button
                          key={field.id}
                          type="button"
                          onClick={() => toggleSoftwareDevField(field.id)}
                          className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/60 bg-background hover:border-primary/40"
                          }`}
                        >
                          {field.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {formData.selectedRoles.length > 0 && (
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Skills per role</Label>
                  <p className="text-sm text-muted-foreground">Select the specific skills you need for each role.</p>
                  {formData.selectedRoles.map((roleId) => {
                    const role = PLATFORM_ROLES.find((r) => r.id === roleId);
                    if (!role) return null;
                    // For software_dev: show skills from selected sub-fields; require sub-field first
                    const isSoftwareDev = roleId === "software_development";
                    if (isSoftwareDev && formData.softwareDevFields.length === 0) return null;
                    const skills = isSoftwareDev
                      ? getSoftwareDevFieldSkills(formData.softwareDevFields)
                      : getSkillsForRole(roleId);
                    const selectedSkills = formData.roleSkills[roleId] ?? [];
                    const displayLabel = isSoftwareDev && formData.softwareDevFields.length > 0
                      ? formData.softwareDevFields.map(getSoftwareDevFieldLabel).join(" / ")
                      : role.label;
                    return (
                      <div key={roleId} className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2">
                        <p className="font-medium text-foreground">{displayLabel}</p>
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill) => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => toggleRoleSkill(roleId, skill)}
                              className={`rounded-lg border-2 px-3 py-1.5 text-sm transition-all ${
                                selectedSkills.includes(skill)
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border/60 bg-background hover:border-primary/40"
                              }`}
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

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
                <Label htmlFor="description" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Role Requirements / Job Details (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe role requirements, responsibilities, and any constraints..."
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-3 rounded-lg border-border/60"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Duration</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select the minimum duration for this hire. Longer engagements may receive a reduced monthly rate automatically, rewarding extended commitments.
                </p>
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
                    if (!date || isNaN(date.getTime())) {
                      setFormData((prev) => ({ ...prev, startDate: "" }));
                      return;
                    }
                    const y = date.getFullYear();
                    const m = date.getMonth() + 1;
                    const d = date.getDate();
                    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return;
                    const yyyy = String(y);
                    const mm = String(m).padStart(2, "0");
                    const dd = String(d).padStart(2, "0");
                    setFormData((prev) => ({ ...prev, startDate: `${yyyy}-${mm}-${dd}` }));
                  }}
                  placeholder="Select start date"
                  minDate={new Date()}
                  className="mt-3"
                />
              </div>

              {/* Budget Preview - only shown when roles are selected (price depends on categories) */}
              {formData.selectedRoles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-5">
                  <p className="text-sm text-muted-foreground">
                    Select roles above to see the estimated price. Base rates vary by role.
                  </p>
                </div>
              ) : !formData.startDate || !formData.projectDuration ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-5">
                  <p className="text-sm text-muted-foreground">
                    Select a start date and duration above to see your estimated budget.
                  </p>
                </div>
              ) : budgetCalculation ? (
                <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Estimated total</span>
                    <span className="text-xl font-bold text-primary tabular-nums">
                      {formatBudget(budgetCalculation.estimatedBudget)}
                    </span>
                  </div>
                  {formData.hireType === "team" && budgetCalculation.breakdown?.teamMembers && budgetCalculation.breakdown.teamMembers.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly breakdown per role</p>
                      <div className="space-y-2 rounded-lg border border-border/40 bg-background/50 p-3">
                        {budgetCalculation.breakdown.teamMembers.map((m) => (
                          <div key={`${m.role}-${m.category}`} className="flex justify-between text-sm">
                            <span className="text-foreground">
                              {m.count}× {m.roleDisplayName} ({m.category})
                            </span>
                            <span className="font-medium tabular-nums">
                              {formatBudget(m.monthlyPerPerson)}/mo each
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formData.roleType === "part_time" ? "Part-time (20 hrs/week) rates." : "Full-time (40 hrs/week) rates."}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Total you pay for this hire. {formData.projectDuration === "3" && "3% discount applied for 3-month commitment."}
                    {formData.projectDuration === "6" && "5% discount applied for 6-month commitment."}
                    {formData.projectDuration === "12+" && "5% discount applied for 12+ month commitment."}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-200">
                  Unable to calculate budget. Please ensure you have selected a valid start date and duration, then try again.
                </div>
              )}
            </div>
          )}

          {/* Step 3: Budget / Review */}
          {step === 3 && (
            <div className="space-y-8">
              <div>
                <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Payment</Label>
                {budgetCalculation ? (
                  <div className="mt-3 space-y-4">
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total amount</span>
                        <span className="text-2xl font-bold text-primary tabular-nums">
                          {formatBudget(budgetCalculation.estimatedBudget)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        This is the total you pay for this hire.
                      </p>
                    </div>
                    {formData.hireType === "team" && budgetCalculation.breakdown?.teamMembers && budgetCalculation.breakdown.teamMembers.length > 0 && (
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-3">
                        <div className="font-medium text-foreground">Monthly earnings per team member</div>
                        <p className="text-xs text-muted-foreground">
                          Each role uses category-specific rates. {formData.roleType === "part_time" ? "Part-time (20 hrs/week)." : "Full-time (40 hrs/week)."}
                        </p>
                        <div className="space-y-2">
                          {budgetCalculation.breakdown.teamMembers.map((m) => (
                            <div key={`${m.role}-${m.category}`} className="flex items-center justify-between rounded-lg border border-border/40 bg-background/50 px-4 py-3">
                              <div>
                                <span className="font-medium text-foreground">{m.roleDisplayName}</span>
                                <span className="text-muted-foreground"> — {m.category}</span>
                                <span className="ml-2 text-xs text-muted-foreground">({m.count} {m.count === 1 ? "person" : "people"})</span>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold tabular-nums">{formatBudget(m.monthlyPerPerson)}/mo</div>
                                <div className="text-xs text-muted-foreground">
                                  ${m.hourlyRate}/hr × {m.hoursPerMonth} hrs
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-5 space-y-3">
                      <div className="font-medium text-foreground">Months to fund</div>
                      <p className="text-sm text-muted-foreground">
                        You can choose the total engagement duration (e.g., 3 months) and fund all months upfront, or pay one month at a time. All funds are securely held in escrow by 49GIG and released to the freelancer or team monthly as salary. At the end of each month, you review and approve the work before the salary is released. If no action is taken within 0–72 hours, the monthly salary will be automatically released. This ensures flexibility, transparency, and protection for both parties. You pay upfront and we hold in escrow.
                      </p>
                      <Select
                        value={String(formData.monthsToFund)}
                        onValueChange={(v) => setFormData({ ...formData, monthsToFund: parseInt(v, 10) })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select months" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: formData.projectDuration === "12+" ? 12 : parseInt(formData.projectDuration || "3", 10) }, (_, i) => i + 1).map((n) => {
                            const durMonths = formData.projectDuration === "12+" ? 12 : parseInt(formData.projectDuration || "3", 10);
                            const perMonth = budgetCalculation.estimatedBudget / durMonths;
                            return (
                              <SelectItem key={n} value={String(n)}>
                                {n} month{n > 1 ? "s" : ""} — {formatBudget(perMonth * n)}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        The amount for the selected months will be held in escrow. Funds are released to the freelancer(s) each month after you approve that month&apos;s work (or automatically after the review window).
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-200">
                    Unable to calculate budget. Please ensure you have selected a valid start date and duration, then try again.
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
            {isSubmitting ? "Creating..." : "Hire Talents"}
          </Button>
        )}
      </div>
    </div>
  );
}
