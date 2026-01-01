"use client";

import { useState } from "react";
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
    budget: "",
    timeline: "",
    deliverables: [] as string[],
    additionalRequirements: "",
  });

  const [newSkill, setNewSkill] = useState("");
  const [newDeliverable, setNewDeliverable] = useState("");

  const handleNext = () => {
    if (step === 1) {
      if (!formData.title || !formData.description || !formData.category) {
        setError("Please fill in all required fields");
        return;
      }
    } else if (step === 2) {
      if (
        formData.requiredSkills.length === 0 ||
        !formData.budget ||
        !formData.timeline
      ) {
        setError("Please fill in all required fields");
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
      const budget = parseFloat(formData.budget);
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
          timeline: formData.timeline,
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
            </div>
          )}

          {/* Step 2: Skills & Budget */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Required Skills *</Label>
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
                  {COMMON_SKILLS.map((skill) => (
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
                <Label htmlFor="budget">Budget (USD) *</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="1000.00"
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Platform fee: 10% (${(parseFloat(formData.budget) * 0.1 || 0).toFixed(2)})
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeline">Timeline *</Label>
                <Input
                  id="timeline"
                  placeholder="e.g., 2 weeks, 1 month, 3 months"
                  value={formData.timeline}
                  onChange={(e) =>
                    setFormData({ ...formData, timeline: e.target.value })
                  }
                />
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

