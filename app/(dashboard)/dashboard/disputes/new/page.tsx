"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, type Id } from "@/convex/_generated/dataModel";
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
import { ArrowLeft, AlertCircle, UploadCloud, X, Loader2, FileText } from "lucide-react";
import { getUserFriendlyError } from "@/lib/error-handling";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ChatEvidenceSelector } from "@/components/disputes/chat-evidence-selector";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { DISPUTE_REASON_POLICIES, getDisputeReasonPolicy } from "@/lib/dispute-flow";

export default function NewDisputePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const projectId = searchParams.get("projectId");

  const [formData, setFormData] = useState({
    projectId: projectId || "",
    monthlyCycleId: "" as string,
    type: "" as
      | "deliverable_quality"
      | "payment"
      | "communication"
      | "freelancer_replacement"
      | "client_deliverable_quality"
      | "client_timeline_scope"
      | "client_payment_billing"
      | "client_communication_conduct"
      | "client_request_replacement"
      | "freelancer_payment_issue"
      | "freelancer_scope_requirements"
      | "freelancer_communication"
      | "freelancer_platform_policy"
      | "",
    reason: "",
    description: "",
  });
  // For team hires: which specific freelancers are being disputed ("all" = entire team)
  const [disputeScope, setDisputeScope] = useState<"all" | "partial">("all");
  const [disputedFreelancerIds, setDisputedFreelancerIds] = useState<string[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{ storageId: string; name: string; size: number }[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disputeClockMs, setDisputeClockMs] = useState(() => Date.now());
  const selectedPolicy = formData.type ? getDisputeReasonPolicy(formData.type) : null;
  const availableReasonPolicies = DISPUTE_REASON_POLICIES.filter(
    (policy) => policy.openedBy === user?.role || policy.openedBy === "both"
  );
  useEffect(() => {
    const id = window.setInterval(() => setDisputeClockMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const allProjects = useQuery(
    (api as any)["projects/queries"].getProjects,
    isAuthenticated && user?._id ? { userId: user._id } : "skip"
  );

  const disputableProjects = (allProjects ?? []).filter(
    (p: { status: string }) =>
      p.status === "matched" || p.status === "in_progress" || p.status === "completed"
  );

  const project = useQuery(
    (api as any)["projects/queries"].getProject,
    formData.projectId && isAuthenticated && user?._id
      ? { projectId: formData.projectId as any, userId: user._id }
      : "skip"
  );

  const monthlyCycles = useQuery(
    (api as any)["monthlyBillingCycles/queries"].getCyclesByProjectId,
    formData.projectId && isAuthenticated && user?._id
      ? { projectId: formData.projectId as any, userId: user._id }
      : "skip"
  );

  const projectTeamMembers = useQuery(
    api.projects.queries.getProjectTeamMembers,
    formData.projectId && isAuthenticated && user?._id && user.role === "client"
      ? { projectId: formData.projectId as any, userId: user._id }
      : "skip"
  );

  const pendingCycles = (monthlyCycles ?? []).filter(
    (c: Doc<"monthlyBillingCycles">) =>
      c.status === "pending" && c.monthEndDate <= disputeClockMs
  );

  useEffect(() => {
    if (!formData.monthlyCycleId || !monthlyCycles) return;
    const selected = monthlyCycles.find(
      (c: Doc<"monthlyBillingCycles">) => c._id === formData.monthlyCycleId
    );
    if (
      !selected ||
      selected.status !== "pending" ||
      selected.monthEndDate > disputeClockMs
    ) {
      setFormData((f) => ({ ...f, monthlyCycleId: "" }));
    }
  }, [monthlyCycles, formData.monthlyCycleId, disputeClockMs]);

  useEffect(() => {
    if (!project || !user?._id || user.role !== "client") return;
    const ids: string[] = (project as any).matchedFreelancerIds ?? [];
    if (ids.length === 0) return;
    setDisputeScope("partial");
    setDisputedFreelancerIds([]);
  }, [project?._id, user?._id, user?.role]);

  const initiateDispute = useMutation(api.disputes.mutations.initiateDispute);
  const generateUploadUrl = useMutation(api.disputes.mutations.generateDisputeUploadUrl);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !user?._id) return;
    setIsUploadingFile(true);
    try {
      for (const file of files) {
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 20MB limit`);
          continue;
        }
        const url = await generateUploadUrl({ userId: user._id });
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!res.ok) { toast.error(`Failed to upload ${file.name}`); continue; }
        const { storageId } = await res.json();
        setUploadedFiles((prev) => [...prev, { storageId, name: file.name, size: file.size }]);
      }
      toast.success("File(s) uploaded successfully");
    } catch {
      toast.error("File upload failed");
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.projectId || !formData.type || !formData.reason || !formData.description) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate partial team selection
    const isTeamProject = ((project as any)?.matchedFreelancerIds?.length ?? 0) > 0;
    if (user?.role === "client" && isTeamProject && disputeScope === "partial" && disputedFreelancerIds.length === 0) {
      setError("Please select at least one team member to dispute.");
      return;
    }

    if (!user?._id) {
      setError("Not authenticated");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare evidence from selected messages and uploaded files
      const evidence = [
        ...selectedMessages.map((msgId: string) => ({
          type: "message" as const,
          messageId: msgId as any,
          description: "Chat message evidence",
        })),
        ...uploadedFiles.map((f) => ({
          type: "file" as const,
          fileId: f.storageId as any,
          description: f.name,
        })),
      ];

      const isTeamProject = ((project as any)?.matchedFreelancerIds?.length ?? 0) > 0;
      const partialIds: Id<"users">[] | undefined =
        user.role === "client" &&
        isTeamProject &&
        disputeScope === "partial" &&
        disputedFreelancerIds.length > 0
          ? (disputedFreelancerIds as Id<"users">[])
          : undefined;

      const disputeId = await initiateDispute({
        projectId: formData.projectId as any,
        monthlyCycleId: formData.monthlyCycleId || undefined,
        type: formData.type as any,
        reason: formData.reason,
        description: formData.description,
        evidence: evidence.length > 0 ? evidence : undefined,
        ...(user.role === "client" ? { disputedFreelancerIds: partialIds } : {}),
        userId: user._id,
      });

      router.push(`/dashboard/disputes/${disputeId}`);
    } catch (err: any) {
      setError(getUserFriendlyError(err) || "Failed to initiate dispute");
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
          <h1 className="text-3xl font-bold tracking-tight">Escalate to a dispute</h1>
          <p className="text-muted-foreground mt-1">
            Try to resolve issues in the project chat first. Open a dispute when you need 49GIG staff to step in.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open a dispute</CardTitle>
          <CardDescription>
            Tell us which hire is affected, why you&apos;re escalating, and attach any evidence you already have.
            Staff will review and may ask for more.
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

            <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 text-sm sm:grid-cols-3">
              {[
                ["1", "Select hire"],
                ["2", "Describe the issue"],
                ["3", "Attach evidence"],
              ].map(([step, label]) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {step}
                  </span>
                  <span className="font-medium">{label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              {disputableProjects.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                  No active hires to dispute. You can only open a dispute for a hire you're working on (matched, in progress, or completed).
                </div>
              ) : (
                <Select
                  value={formData.projectId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, projectId: value, monthlyCycleId: "" })
                  }
                  required
                  disabled={!!projectId}
                >
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Select the project this dispute is about" />
                  </SelectTrigger>
                  <SelectContent>
                    {disputableProjects.map((p: { _id: string; intakeForm?: { title?: string }; status: string }) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.intakeForm?.title || "Untitled"} ({p.status.replace("_", " ")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {project && formData.projectId && (
                <p className="text-sm text-muted-foreground">
                  {project.intakeForm?.title || "Untitled"}
                </p>
              )}
            </div>

            {/* Freelancer vs client only (team hires): no other freelancers as parties */}
            {formData.projectId &&
              user?.role === "freelancer" &&
              ((project as { matchedFreelancerIds?: string[] })?.matchedFreelancerIds?.length ?? 0) > 1 && (
                <div className="rounded-lg border border-border/60 bg-muted/15 px-4 py-3 text-sm text-muted-foreground leading-relaxed">
                  <p className="font-medium text-foreground">You and the client</p>
                  <p className="mt-1">
                    This dispute is between you and the client only. Only <strong className="text-foreground">your</strong>{" "}
                    portion of pay for this billing period or hire is in scope. Teammates are not part of this case.
                  </p>
                </div>
              )}

            {/* Team member selection: clients only */}
            {user?.role === "client" && formData.projectId && (projectTeamMembers?.length ?? 0) > 0 && (
              <div className="space-y-3">
                <Label>Team members in scope *</Label>
                <p className="text-xs text-muted-foreground">
                  This is a team hire. Dispute the entire team or only the people you select. Funds and enforcement follow
                  the scope you choose.
                </p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="disputeScope"
                      value="all"
                      checked={disputeScope === "all"}
                      onChange={() => {
                        setDisputeScope("all");
                        setDisputedFreelancerIds([]);
                      }}
                      className="accent-primary"
                    />
                    <span className="text-sm font-medium">Entire team</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="disputeScope"
                      value="partial"
                      checked={disputeScope === "partial"}
                      onChange={() => setDisputeScope("partial")}
                      className="accent-primary"
                    />
                    <span className="text-sm font-medium">Specific member(s)</span>
                  </label>
                </div>
                {disputeScope === "all" && (
                  <p className="text-xs text-muted-foreground">
                    If the dispute is resolved in your favor, every matched team member may be removed and you&apos;ll
                    replace the full team.
                  </p>
                )}
                {disputeScope === "partial" && (
                  <p className="text-xs text-muted-foreground">
                    Only the people you select can be removed if the dispute is resolved in your favor; everyone else
                    stays on the hire.
                  </p>
                )}
                {disputeScope === "partial" && (
                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
                    {(projectTeamMembers as { _id: string; name: string; role: string }[]).map((member) => (
                      <label key={member._id} className="flex items-center gap-3 cursor-pointer py-1">
                        <Checkbox
                          checked={disputedFreelancerIds.includes(member._id)}
                          onCheckedChange={(checked) => {
                            setDisputedFreelancerIds((prev) =>
                              checked
                                ? [...prev, member._id]
                                : prev.filter((id) => id !== member._id)
                            );
                          }}
                        />
                        <span className="text-sm font-medium">{member.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                      </label>
                    ))}
                    {disputedFreelancerIds.length === 0 && (
                      <p className="text-xs text-destructive mt-1">Select at least one team member to dispute.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {formData.projectId && pendingCycles.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="monthlyCycle">Monthly Payment (optional)</Label>
                <Select
                  value={formData.monthlyCycleId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, monthlyCycleId: value })
                  }
                >
                  <SelectTrigger id="monthlyCycle">
                    <SelectValue placeholder="Select a monthly payment to dispute (or leave blank for project-level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Project-level dispute</SelectItem>
                    {pendingCycles.map((c: { _id: string; monthIndex: number; monthStartDate: number; amountCents: number }) => (
                      <SelectItem key={c._id} value={c._id}>
                        Month {c.monthIndex} ({new Date(c.monthStartDate).toLocaleString("default", { month: "short", year: "numeric" })}) – ${(c.amountCents / 100).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only billing months that have ended appear here. Select a specific month to dispute, or leave blank for a project-level dispute.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="type">Dispute Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    type: value as any,
                    reason: getDisputeReasonPolicy(value).label,
                  })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dispute type" />
                </SelectTrigger>
                <SelectContent>
                  {availableReasonPolicies.map((policy) => (
                    <SelectItem key={policy.id} value={policy.id}>
                      {policy.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPolicy && (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{selectedPolicy.summary}</p>
                  <p className="mt-1">
                    Staff will review your evidence and may ask for more details before resolving.
                  </p>
                </div>
              )}
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

            {selectedPolicy && (
              <div className="space-y-3 rounded-xl border border-border/60 bg-muted/10 p-4">
                <div>
                  <Label>Helpful evidence to attach</Label>
                  <p className="text-xs text-muted-foreground">
                    Add as much as you have now. Staff can request anything else they need after the dispute is opened.
                  </p>
                </div>
                <div className="space-y-2">
                  {selectedPolicy.requiredEvidence.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border/50 bg-background/70 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                          {item.owner === "both" ? "Both parties" : item.owner}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.projectId && project && user?._id && (
              <div className="space-y-2">
                <Label>Evidence from Chat</Label>
                <ChatEvidenceSelector
                  projectId={formData.projectId as Id<"projects">}
                  userId={user._id}
                  selectedMessages={selectedMessages as Id<"messages">[]}
                  onSelectionChange={(ids) => setSelectedMessages(ids as string[])}
                  teamDisputeMode={
                    user.role === "client" &&
                    ((project as { matchedFreelancerIds?: string[] }).matchedFreelancerIds
                      ?.length ?? 0) > 0
                      ? {
                          isTeamHire: true,
                          scope: disputeScope,
                          disputedFreelancerIds: disputedFreelancerIds as Id<"users">[],
                        }
                      : undefined
                  }
                />
              </div>
            )}

            {/* Supporting file uploads */}
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5">
                Supporting Files <span className="text-muted-foreground font-normal text-xs">(optional · max 20 MB each)</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Upload documents, screenshots, or other files that support your claim. These will be visible to the assigned moderator and the other party.
              </p>
              <div
                className="rounded-xl border-2 border-dashed border-border/60 bg-muted/10 px-6 py-5 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const dt = new DataTransfer();
                  Array.from(e.dataTransfer.files).forEach((f) => dt.items.add(f));
                  if (fileInputRef.current) {
                    fileInputRef.current.files = dt.files;
                    fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
                  }
                }}
              >
                {isUploadingFile ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                  </div>
                ) : (
                  <>
                    <UploadCloud className="mx-auto h-6 w-6 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">Click or drag files here to upload</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">PDF, images, documents accepted</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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

