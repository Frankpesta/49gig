"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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
import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { getUserFriendlyError } from "@/lib/error-handling";
import { useAuth } from "@/hooks/use-auth";
import { DatePicker } from "@/components/ui/date-picker";
import {
  calculateProjectBudget,
  formatBudget,
  computeTeamBudgetBreakdown,
  type ExperienceLevel,
  type ProjectType,
  type HireType,
  type TeamSize,
} from "@/lib/budget-calculator";
import {
  PLATFORM_ROLES,
  getSkillsForRole,
  getCategoryLabelForRole,
  getRoleIdForSkill,
  isCategoryLabel,
  isLegacyCategoryLabel,
} from "@/lib/platform-skills";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

const PROJECT_DURATIONS = [
  { value: "3", label: "3 months" },
  { value: "6", label: "6 months" },
  { value: "12+", label: "1 year +" },
] as const;

type ProjectDuration = (typeof PROJECT_DURATIONS)[number]["value"];

const DURATION_DAYS: Record<ProjectDuration, number> = {
  "3": 90,
  "6": 180,
  "12+": 365,
};

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
  { value: "not_sure", label: "Not sure" },
] as const;

const ROLE_TYPES = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
] as const;

type RoleType = (typeof ROLE_TYPES)[number]["value"];

function roleTypeToProjectType(_: RoleType): ProjectType {
  return "ongoing";
}

function getPrimaryCategory(selectedRoles: string[]): string {
  if (selectedRoles.length === 0) return "Software Development";
  return getCategoryLabelForRole(selectedRoles[0]);
}

function parseLocalDateString(value: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return null;
  return date;
}

function formatDateForInput(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const projectId = params.projectId as Id<"projects">;

  const project = useQuery(
    (api as any)["projects/queries"].getProject,
    user?._id && projectId ? { projectId, userId: user._id } : "skip"
  );
  const updateProject = useMutation(
    (api as any)["projects/mutations"].updateProject
  );
  const platformFeePct = useQuery(
    (api as any)["platformSettings/queries"].getPlatformFeePercentage
  );
  const pricingConfig = useQuery(api.pricing.queries.getPricingConfig);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    hireType: HireType;
    teamSize?: TeamSize;
    title: string;
    selectedRoles: string[];
    roleSkills: Record<string, string[]>;
    roleType: RoleType;
    description: string;
    projectDuration: ProjectDuration;
    experienceLevel: ExperienceLevel;
    startDate: string;
    specialRequirements: string;
    fundUpfrontMonths: number;
  } | null>(null);

  useEffect(() => {
    if (!project || formData !== null) return;
    if (project.status !== "draft" && project.status !== "pending_funding") return;
    const intake = project.intakeForm;
    const startDate = intake.startDate ? formatDateForInput(intake.startDate) : "";
    const rawSkills = intake.requiredSkills ?? [];

    let selectedRoles: string[] = [];
    let roleSkills: Record<string, string[]> = {};

    if (rawSkills.length > 0) {
      const allCategoryLabels = rawSkills.every((s: string) => isCategoryLabel(s) || isLegacyCategoryLabel(s));
      if (allCategoryLabels) {
        const expanded: string[] = [];
        for (const c of rawSkills) {
          if (isLegacyCategoryLabel(c)) {
            expanded.push("ai", "machine_learning", "blockchain");
          } else {
            const role = PLATFORM_ROLES.find((r) => r.categoryLabel === c)?.id;
            if (role) expanded.push(role);
          }
        }
        selectedRoles = [...new Set(expanded)];
        for (const roleId of selectedRoles) {
          const skills = getSkillsForRole(roleId);
          if (skills.length > 0) roleSkills[roleId] = [skills[0]];
        }
      } else {
        for (const skill of rawSkills) {
          const roleId = getRoleIdForSkill(skill);
          if (roleId) {
            if (!roleSkills[roleId]) roleSkills[roleId] = [];
            roleSkills[roleId].push(skill);
          }
        }
        selectedRoles = [...new Set(Object.keys(roleSkills))];
      }
    }

    setFormData({
      hireType: (intake.hireType as HireType) || "single",
      teamSize: intake.teamSize as TeamSize | undefined,
      title: intake.title || "",
      selectedRoles,
      roleSkills,
      roleType: (intake.roleType as RoleType) || "full_time",
      description: intake.description || "",
      projectDuration: (intake.projectDuration as ProjectDuration) || "3",
      experienceLevel: (intake.experienceLevel as ExperienceLevel) || "mid",
      startDate,
      specialRequirements: intake.specialRequirements || "",
      fundUpfrontMonths: Math.max(1, project.fundUpfrontMonths ?? 1),
    });
  }, [project, formData]);

  const derivedEndDate = useMemo(() => {
    if (!formData?.startDate || !formData?.projectDuration) return null;
    const start = parseLocalDateString(formData.startDate);
    if (!start) return null;
    const days = DURATION_DAYS[formData.projectDuration];
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    return end;
  }, [formData?.startDate, formData?.projectDuration]);

  const projectType = formData ? roleTypeToProjectType(formData.roleType) : "ongoing";

  const budgetCalculation = useMemo(() => {
    if (!formData?.selectedRoles?.length || !formData?.startDate || !derivedEndDate || !formData?.experienceLevel) return null;
    try {
      const startDate = parseLocalDateString(formData.startDate);
      if (!startDate || isNaN(startDate.getTime())) return null;
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
        selectedSkillNames: Object.values(formData.roleSkills).flat(),
      });
      const discount = DURATION_DISCOUNT[formData.projectDuration];
      return { ...calc, estimatedBudget: Math.round(calc.estimatedBudget * discount) };
    } catch {
      return null;
    }
  }, [formData, derivedEndDate, projectType, pricingConfig]);

  const handleSubmit = async () => {
    if (!formData || !project || !user) return;
    setError(null);
    const startDate = parseLocalDateString(formData.startDate);
    if (!startDate || !derivedEndDate || !budgetCalculation) {
      setError("Please fill all required fields and check dates.");
      return;
    }

    setIsSubmitting(true);
    try {
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

      await updateProject({
        projectId,
        userId: user._id,
        fundUpfrontMonths: 0,
        totalAmount,
        platformFee,
        teamBudgetBreakdown,
        intakeForm: {
          hireType: formData.hireType,
          teamSize: formData.teamSize,
          title: formData.title,
          description: formData.description,
          startDate: startDate.getTime(),
          endDate: derivedEndDate.getTime(),
          projectType,
          talentCategory: getPrimaryCategory(formData.selectedRoles) as any,
          experienceLevel: formData.experienceLevel,
          requiredSkills: Object.values(formData.roleSkills).flat(),
          budget: budgetCalculation.estimatedBudget,
          specialRequirements: formData.specialRequirements || undefined,
          roleTitle: formData.title.trim() || undefined,
          projectDuration: formData.projectDuration,
          roleType: formData.roleType,
          timeline: formData.projectDuration === "12+" ? "1 year +" : `${formData.projectDuration} months`,
          category: getPrimaryCategory(formData.selectedRoles),
          estimatedBudget: budgetCalculation.estimatedBudget,
        },
      });
      toast.success("Hire updated.");
      router.push(`/dashboard/projects/${projectId}`);
    } catch (err) {
      setError(getUserFriendlyError(err) || "Failed to update");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRole = (roleId: string) => {
    if (!formData) return;
    const alreadySelected = formData.selectedRoles.includes(roleId);
    if (alreadySelected) {
      const newRoles = formData.selectedRoles.filter((r) => r !== roleId);
      const newRoleSkills = { ...formData.roleSkills };
      delete newRoleSkills[roleId];
      setFormData({ ...formData, selectedRoles: newRoles, roleSkills: newRoleSkills });
    } else {
      if (formData.hireType === "single" && formData.selectedRoles.length >= 1) {
        const prevRole = formData.selectedRoles[0];
        const newRoleSkills = { ...formData.roleSkills };
        delete newRoleSkills[prevRole];
        setFormData({ ...formData, selectedRoles: [roleId], roleSkills: newRoleSkills });
      } else {
        setFormData({ ...formData, selectedRoles: [...formData.selectedRoles, roleId] });
      }
    }
  };

  const toggleRoleSkill = (roleId: string, skill: string) => {
    if (!formData) return;
    const current = formData.roleSkills[roleId] ?? [];
    const updated = current.includes(skill)
      ? current.filter((s) => s !== skill)
      : [...current, skill];
    setFormData({
      ...formData,
      roleSkills: { ...formData.roleSkills, [roleId]: updated },
    });
  };

  if (!user) return null;
  if (project === undefined || formData === null) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!project) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Not found</CardTitle>
            <CardDescription>This hire could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/projects">Back to hires</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (project.status !== "draft" && project.status !== "pending_funding") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Cannot edit</CardTitle>
            <CardDescription>
              This hire can only be edited when it is in draft or pending funding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={`/dashboard/projects/${projectId}`}>Back to hire</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const durMonths = formData.projectDuration === "12+" ? 12 : parseInt(formData.projectDuration || "3", 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit hire</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Update your hire details before proceeding to matches.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3">
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Role requirements</CardTitle>
          <CardDescription>Update role title, description, duration, and skills.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Project title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Build a modern e-commerce website"
              className="mt-2"
            />
          </div>
          <div>
            <Label>Role requirements / Job details</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the role and requirements..."
              rows={4}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Duration</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PROJECT_DURATIONS.map((d) => (
                <Button
                  key={d.value}
                  type="button"
                  variant={formData.projectDuration === d.value ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, projectDuration: d.value as ProjectDuration })}
                >
                  {d.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label>Experience level</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {EXPERIENCE_LEVELS.map((l) => (
                <Button
                  key={l.value}
                  type="button"
                  variant={formData.experienceLevel === l.value ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, experienceLevel: l.value as ExperienceLevel })}
                >
                  {l.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label>Roles needed</Label>
            <p className="text-xs text-muted-foreground mt-1">
              {formData.hireType === "single" ? "Select the role you need." : "Select roles for your team, then choose skills for each."}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PLATFORM_ROLES.map((role) => (
                <Button
                  key={role.id}
                  type="button"
                  variant={formData.selectedRoles.includes(role.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleRole(role.id)}
                >
                  {role.label}
                </Button>
              ))}
            </div>
          </div>
          {formData.selectedRoles.length > 0 && (
            <div className="space-y-4">
              <Label>Skills per role</Label>
              {formData.selectedRoles.map((roleId) => {
                const role = PLATFORM_ROLES.find((r) => r.id === roleId);
                if (!role) return null;
                const skills = getSkillsForRole(roleId);
                const selectedSkills = formData.roleSkills[roleId] ?? [];
                return (
                  <div key={roleId} className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
                    <p className="font-medium text-sm">{role.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Button
                          key={skill}
                          type="button"
                          variant={selectedSkills.includes(skill) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleRoleSkill(roleId, skill)}
                        >
                          {skill}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div>
            <Label>Start date</Label>
            <DatePicker
              date={formData.startDate ? parseLocalDateString(formData.startDate) ?? undefined : undefined}
              onDateChange={(date) => {
                if (!date) return setFormData({ ...formData, startDate: "" });
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, "0");
                const d = String(date.getDate()).padStart(2, "0");
                setFormData({ ...formData, startDate: `${y}-${m}-${d}` });
              }}
              placeholder="Select start date"
              minDate={new Date()}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Special requirements (optional)</Label>
            <Textarea
              value={formData.specialRequirements}
              onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
              placeholder="e.g. time zone, tools..."
              rows={4}
              className="mt-2"
            />
          </div>

          {!formData?.selectedRoles?.length ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-5">
              <p className="text-sm text-muted-foreground">
                Select roles above to see the estimated price. Base rates vary by role.
              </p>
            </div>
          ) : budgetCalculation ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium text-muted-foreground">Estimated total</span>
                <span className="text-2xl font-bold">{formatBudget(budgetCalculation.estimatedBudget)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                You can fund all months upfront or pay one month at a time. All funds are held in escrow by 49GIG and released to the freelancer monthly after you approve each month. If no action is taken within 0–72 hours, the monthly salary is automatically released.
              </p>
            </div>
          ) : null}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !budgetCalculation ||
                formData.selectedRoles.length === 0 ||
                formData.selectedRoles.some((r) => (formData.roleSkills[r]?.length ?? 0) === 0)
              }
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/projects/${projectId}`}>Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
