"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
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
import { Badge } from "@/components/ui/badge";
import { X, Plus, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const PROJECT_CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "Design",
  "Writing",
  "Marketing",
  "Data Science",
  "DevOps",
  "Other",
];

const COMMON_SKILLS = [
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "Python",
  "JavaScript",
  "UI/UX Design",
  "Graphic Design",
  "Content Writing",
  "SEO",
  "Marketing",
  "Data Analysis",
  "Machine Learning",
  "DevOps",
  "AWS",
  "Docker",
  "Kubernetes",
];

const TEAM_STACK_OPTIONS = Array.from(
  new Set([
    "React",
    "Node.js",
    "Python",
    "Java",
    "PHP",
    "Go",
    "Rust",
    "Mobile Dev",
    "UI Design",
    "UX Research",
    "Prototyping",
    "Figma",
    "Adobe XD",
    "Brand Design",
    "SQL",
    "Tableau",
    "Power BI",
    "Machine Learning",
    "Statistics",
    "SEO",
    "PPC",
    "Social Media",
    "Content Marketing",
    "Email Marketing",
    "Analytics",
    "Copywriting",
    "Blog Writing",
    "Technical Writing",
    "SEO Content",
    "Creative Writing",
    "Agile",
    "Scrum",
    "Product Strategy",
    "Project Planning",
    "Team Leadership",
    "DevOps",
    "AWS",
    "Docker",
    "Kubernetes",
  ])
);

const INDIVIDUAL_PRICING = {
  starter: 25,
  professional: 50,
  enterprise: 100,
} as const;

const TEAM_PRICING_TIERS = [
  { tier: "startup", min: 3, max: 5, monthly: 2500 },
  { tier: "growth", min: 6, max: 8, monthly: 5000 },
  { tier: "enterprise", min: 9, max: 999, monthly: null },
] as const;

const DEFAULT_HOURS_PER_WEEK = 40;

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
    title: "",
    description: "",
    category: "",
    requiredSkills: [] as string[],
    engagementType: "individual" as "individual" | "team",
    durationValue: "4",
    durationUnit: "week" as "week" | "month" | "year",
    hoursPerWeek: DEFAULT_HOURS_PER_WEEK,
    pricingPlan: "professional" as "starter" | "professional" | "enterprise",
    teamSize: "3",
    teamPricingTier: "startup" as "startup" | "growth" | "enterprise" | "custom",
    budget: "",
    timeline: "",
    deliverables: [] as string[],
    additionalRequirements: "",
  });

  const [newSkill, setNewSkill] = useState("");
  const [newDeliverable, setNewDeliverable] = useState("");

  const durationValueNumber = useMemo(() => {
    const value = parseInt(formData.durationValue, 10);
    return Number.isNaN(value) ? 0 : value;
  }, [formData.durationValue]);

  const durationWeeks = useMemo(() => {
    if (durationValueNumber <= 0) return 0;
    if (formData.durationUnit === "week") return durationValueNumber;
    if (formData.durationUnit === "month") return durationValueNumber * 4;
    return durationValueNumber * 52;
  }, [durationValueNumber, formData.durationUnit]);

  const durationMonths = useMemo(() => {
    if (durationValueNumber <= 0) return 0;
    if (formData.durationUnit === "month") return durationValueNumber;
    if (formData.durationUnit === "week") return durationValueNumber / 4;
    return durationValueNumber * 12;
  }, [durationValueNumber, formData.durationUnit]);

  const timelineLabel = useMemo(() => {
    if (!durationValueNumber) return "";
    const unitLabel = formData.durationUnit;
    return `${durationValueNumber} ${unitLabel}${durationValueNumber === 1 ? "" : "s"}`;
  }, [durationValueNumber, formData.durationUnit]);

  const derivedTeamTier = useMemo(() => {
    if (formData.engagementType !== "team") return undefined;
    const teamSize = parseInt(formData.teamSize, 10);
    if (Number.isNaN(teamSize) || teamSize < 3) return undefined;
    const tier = TEAM_PRICING_TIERS.find(
      (t) => teamSize >= t.min && teamSize <= t.max
    );
    return tier?.tier ?? "custom";
  }, [formData.engagementType, formData.teamSize]);

  const calculatedBudget = useMemo(() => {
    if (formData.engagementType === "individual") {
      if (!durationWeeks || !formData.pricingPlan) return 0;
      const hourlyRate = INDIVIDUAL_PRICING[formData.pricingPlan];
      return Math.round(hourlyRate * formData.hoursPerWeek * durationWeeks);
    }

    const teamSize = parseInt(formData.teamSize, 10);
    if (Number.isNaN(teamSize) || teamSize < 3) return 0;
    const tier = TEAM_PRICING_TIERS.find(
      (t) => teamSize >= t.min && teamSize <= t.max
    );
    if (!tier || !tier.monthly) return 0;
    return Math.round(tier.monthly * durationMonths);
  }, [
    formData.engagementType,
    formData.pricingPlan,
    formData.hoursPerWeek,
    formData.teamSize,
    durationWeeks,
    durationMonths,
  ]);

  const estimatedHours = useMemo(() => {
    if (formData.engagementType !== "individual") return undefined;
    if (!durationWeeks) return undefined;
    return formData.hoursPerWeek * durationWeeks;
  }, [formData.engagementType, formData.hoursPerWeek, durationWeeks]);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.title || !formData.description || !formData.category) {
        setError("Please fill in all required fields");
        return;
      }
    } else if (step === 2) {
      if (formData.requiredSkills.length === 0) {
        setError("Please select required skills or stack");
        return;
      }
      if (!formData.durationValue) {
        setError("Please set the project duration");
        return;
      }
      if (formData.engagementType === "team") {
        const teamSize = parseInt(formData.teamSize, 10);
        if (Number.isNaN(teamSize) || teamSize < 3) {
          setError("Team size must be at least 3 members");
          return;
        }
      }
      if (!calculatedBudget) {
        setError("Unable to calculate pricing. Please review your selections.");
        return;
      }
      if (formData.engagementType === "team" && derivedTeamTier === "enterprise") {
        setError("Enterprise team pricing is custom. Please contact sales.");
        return;
      }
    }
    setError(null);
    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

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

  const handleAddDeliverable = () => {
    if (
      newDeliverable.trim() &&
      !formData.deliverables.includes(newDeliverable.trim())
    ) {
      setFormData({
        ...formData,
        deliverables: [...formData.deliverables, newDeliverable.trim()],
      });
      setNewDeliverable("");
    }
  };

  const handleRemoveDeliverable = (deliverable: string) => {
    setFormData({
      ...formData,
      deliverables: formData.deliverables.filter((d) => d !== deliverable),
    });
  };

  const handleSubmit = async () => {
    if (formData.deliverables.length === 0) {
      setError("Please add at least one deliverable");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const budget = calculatedBudget;
      if (isNaN(budget) || budget <= 0) {
        throw new Error("Invalid budget amount");
      }

      // Platform fee is 10% (can be made configurable later)
      const platformFee = 10;
      const totalAmount = budget;

      const projectId = await createProject({
        intakeForm: {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          requiredSkills: formData.requiredSkills,
          budget: totalAmount,
          timeline: timelineLabel,
          engagementType: formData.engagementType,
          durationValue: parseInt(formData.durationValue, 10),
          durationUnit: formData.durationUnit,
          hoursPerWeek: formData.engagementType === "individual" ? formData.hoursPerWeek : undefined,
          pricingPlan: formData.engagementType === "individual" ? formData.pricingPlan : undefined,
          teamSize: formData.engagementType === "team" ? parseInt(formData.teamSize, 10) : undefined,
          teamPricingTier: formData.engagementType === "team" ? derivedTeamTier : undefined,
          estimatedHours,
          estimatedBudget: totalAmount,
          deliverables: formData.deliverables,
          additionalRequirements: formData.additionalRequirements || undefined,
        },
        totalAmount,
        platformFee,
        currency: "usd",
        ...(user?._id ? { userId: user._id } : {}),
      });

      // Redirect to payment page - project is only created after payment
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
            {step === 1 && "Project Details"}
            {step === 2 && "Skills & Budget"}
            {step === 3 && "Deliverables"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Tell us about your project"}
            {step === 2 && "Specify required skills and budget"}
            {step === 3 && "Define what you expect to receive"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Project Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Build a modern e-commerce website"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
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

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Engagement Type *</Label>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant={formData.engagementType === "individual" ? "default" : "outline"}
                    onClick={() =>
                      setFormData({ ...formData, engagementType: "individual" })
                    }
                  >
                    Individual Talent
                  </Button>
                  <Button
                    type="button"
                    variant={formData.engagementType === "team" ? "default" : "outline"}
                    onClick={() =>
                      setFormData({ ...formData, engagementType: "team" })
                    }
                  >
                    Dedicated Team
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Choose whether you want an individual freelancer or a full team.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Skills & Budget */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>
                  {formData.engagementType === "team"
                    ? "Team Stack Requirements *"
                    : "Required Skills *"}
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
                  />
                  <Button type="button" onClick={handleAddSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.engagementType === "team"
                    ? TEAM_STACK_OPTIONS
                    : COMMON_SKILLS
                  ).map((skill) => (
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

              <div className="space-y-2">
                <Label>Duration *</Label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g., 4"
                    value={formData.durationValue}
                    onChange={(e) =>
                      setFormData({ ...formData, durationValue: e.target.value })
                    }
                  />
                  <Select
                    value={formData.durationUnit}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        durationUnit: value as "week" | "month" | "year",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Weeks</SelectItem>
                      <SelectItem value="month">Months</SelectItem>
                      <SelectItem value="year">Years</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center rounded-md border px-3 text-sm text-muted-foreground">
                    {timelineLabel || "Timeline"}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Duration can be weeks, months, or years. Use internationally accepted work hours.
                </p>
              </div>

              {formData.engagementType === "individual" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Pricing Plan *</Label>
                    <Select
                      value={formData.pricingPlan}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          pricingPlan: value as "starter" | "professional" | "enterprise",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter ($25/hr)</SelectItem>
                        <SelectItem value="professional">Professional ($50/hr)</SelectItem>
                        <SelectItem value="enterprise">Enterprise ($100/hr)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Pricing matches the marketing page hourly rates.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Work Hours Per Week</Label>
                    <Select
                      value={String(formData.hoursPerWeek)}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          hoursPerWeek: parseInt(value, 10),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select hours" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20 hours/week</SelectItem>
                        <SelectItem value="30">30 hours/week</SelectItem>
                        <SelectItem value="40">40 hours/week (standard)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {formData.engagementType === "team" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamSize">Team Size *</Label>
                    <Input
                      id="teamSize"
                      type="number"
                      min="3"
                      placeholder="e.g., 5"
                      value={formData.teamSize}
                      onChange={(e) =>
                        setFormData({ ...formData, teamSize: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Team pricing is based on number of members from the marketing team plans.
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Estimated Budget</span>
                  <span className="text-lg font-bold">
                    {calculatedBudget
                      ? `$${calculatedBudget.toLocaleString()}`
                      : "Custom pricing"}
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Platform fee: 10% (${(calculatedBudget * 0.1 || 0).toFixed(2)})
                </div>
                {estimatedHours && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Estimated hours: {estimatedHours}
                  </div>
                )}
                {formData.engagementType === "team" && derivedTeamTier && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Team tier: {derivedTeamTier}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Deliverables */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Deliverables *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a deliverable"
                    value={newDeliverable}
                    onChange={(e) => setNewDeliverable(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDeliverable();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddDeliverable}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.deliverables.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {formData.deliverables.map((deliverable, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md border p-2"
                      >
                        <span>{deliverable}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDeliverable(deliverable)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalRequirements">
                  Additional Requirements (Optional)
                </Label>
                <Textarea
                  id="additionalRequirements"
                  placeholder="Any additional requirements or notes..."
                  rows={4}
                  value={formData.additionalRequirements}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      additionalRequirements: e.target.value,
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
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Project"}
          </Button>
        )}
      </div>
    </div>
  );
}

