"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ChatEvidenceSelector } from "@/components/disputes/chat-evidence-selector";

export default function NewDisputePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const projectId = searchParams.get("projectId");
  const milestoneId = searchParams.get("milestoneId");

  const [formData, setFormData] = useState({
    projectId: projectId || "",
    milestoneId: milestoneId || "",
    type: "" as
      | "milestone_quality"
      | "payment"
      | "communication"
      | "freelancer_replacement"
      | "",
    reason: "",
    description: "",
  });
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const project = useQuery(
    (api as any)["projects/queries"].getProject,
    formData.projectId && isAuthenticated && user?._id
      ? { projectId: formData.projectId as any, userId: user._id }
      : "skip"
  );

  const milestones = useQuery(
    (api as any)["projects/queries"].getProjectMilestones,
    formData.projectId && isAuthenticated && user?._id
      ? { projectId: formData.projectId as any, userId: user._id }
      : "skip"
  );

  const initiateDispute = useMutation(api.disputes.mutations.initiateDispute);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.projectId || !formData.type || !formData.reason || !formData.description) {
      setError("Please fill in all required fields");
      return;
    }

    if (!user?._id) {
      setError("Not authenticated");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare evidence from selected messages
      const evidence = selectedMessages.map((msgId: string) => ({
        type: "message" as const,
        messageId: msgId as any,
        description: "Chat message evidence",
      }));

      const disputeId = await initiateDispute({
        projectId: formData.projectId as any,
        milestoneId: formData.milestoneId ? (formData.milestoneId as any) : undefined,
        type: formData.type as any,
        reason: formData.reason,
        description: formData.description,
        evidence: evidence.length > 0 ? evidence : undefined,
        userId: user._id,
      });

      router.push(`/dashboard/disputes/${disputeId}`);
    } catch (err: any) {
      setError(err.message || "Failed to initiate dispute");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  if (user.role !== "client" && user.role !== "freelancer") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Only clients and freelancers can initiate disputes
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/disputes">Back to Disputes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/disputes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Initiate Dispute</h1>
          <p className="text-muted-foreground mt-1">
            File a dispute for a project or milestone
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dispute Details</CardTitle>
          <CardDescription>
            Provide details about the issue you're disputing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="projectId">Project ID *</Label>
              <Input
                id="projectId"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                placeholder="Enter project ID"
                required
                disabled={!!projectId}
              />
              {project && (
                <p className="text-sm text-muted-foreground">
                  Project: {project.intakeForm?.title || "Untitled"}
                </p>
              )}
            </div>

            {milestones && milestones.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="milestoneId">Milestone (Optional)</Label>
                <Select
                  value={formData.milestoneId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, milestoneId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select milestone (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (Project-level dispute)</SelectItem>
                    {milestones.map((milestone: Doc<"milestones">) => (
                      <SelectItem key={milestone._id} value={milestone._id}>
                        {milestone.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="type">Dispute Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as any })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dispute type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="milestone_quality">
                    Milestone Quality
                  </SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="freelancer_replacement">
                    Freelancer Replacement
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Brief reason for dispute"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Provide detailed description of the issue..."
                rows={6}
                required
              />
            </div>

            {formData.projectId && project && user?._id && (
              <div className="space-y-2">
                <Label>Evidence from Chat</Label>
                <ChatEvidenceSelector
                  projectId={formData.projectId as any}
                  userId={user._id}
                  selectedMessages={selectedMessages as any}
                  onSelectionChange={(ids) => setSelectedMessages(ids as string[])}
                />
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Submitting..." : "Initiate Dispute"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/disputes">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

