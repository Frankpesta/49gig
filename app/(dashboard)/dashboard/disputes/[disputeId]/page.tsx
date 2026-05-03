"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  FileText,
  MessageSquare,
  DollarSign,
  ArrowLeft,
  Plus,
  CheckCircle2,
  Loader2,
  User,
  Users,
  Calendar,
  Clock,
  Hash,
  Briefcase,
  Scale,
  ExternalLink,
  Paperclip,
  Inbox,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AddEvidenceDialog } from "./add-evidence-dialog";
import { RespondEvidenceDialog } from "./respond-evidence-dialog";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { ReactNode } from "react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { disputeStatusLabel } from "@/lib/dispute-flow";

type DisputeEvidenceItem = Doc<"disputes">["evidence"][number] & { fileUrl?: string | null };
type EvidenceRequest = {
  _id: Id<"disputeEvidenceRequests">;
  description: string;
  scope: "client" | "freelancer" | "both" | "specific";
  status: "pending" | "fulfilled" | "cancelled";
  requestedFromUserIds: Id<"users">[];
  fulfilledByUserIds?: Id<"users">[];
  createdAt: number;
  resolvedAt?: number;
};

function DetailField({
  label,
  icon,
  children,
  className,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border/50 bg-muted/15 px-4 py-3.5 transition-colors hover:bg-muted/25 ${className ?? ""}`}
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon ? <span className="text-primary/80 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span> : null}
        {label}
      </div>
      <div className="mt-2 text-sm leading-relaxed text-foreground">{children}</div>
    </div>
  );
}

export default function DisputeDetailPage() {
  const params = useParams();
  const { user, isAuthenticated } = useAuth();
  const disputeId = params.disputeId as string;

  const [isAddingEvidence, setIsAddingEvidence] = useState(false);
  const cancelDisputeMutation = useMutation(api.disputes.mutations.cancelDispute);
  const requestDisputeEvidence = useMutation(api.disputes.mutations.requestDisputeEvidence);
  const cancelDisputeEvidenceRequest = useMutation(
    api.disputes.mutations.cancelDisputeEvidenceRequest
  );

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const [evidenceRequestDialogOpen, setEvidenceRequestDialogOpen] = useState(false);
  const [evidenceRequestScope, setEvidenceRequestScope] =
    useState<"client" | "freelancer" | "both" | "specific">("both");
  const [evidenceRequestDescription, setEvidenceRequestDescription] = useState("");
  const [evidenceRequestFreelancerIds, setEvidenceRequestFreelancerIds] = useState<string[]>([]);
  const [isCreatingEvidenceRequest, setIsCreatingEvidenceRequest] = useState(false);

  const [respondingRequest, setRespondingRequest] = useState<EvidenceRequest | null>(null);

  const dispute = useQuery(
    api.disputes.queries.getDispute,
    isAuthenticated && user?._id && disputeId
      ? { disputeId: disputeId as Id<"disputes">, userId: user._id }
      : "skip"
  );

  const project = useQuery(
    api.projects.queries.getProject,
    dispute && isAuthenticated && user?._id
      ? { projectId: dispute.projectId, userId: user._id }
      : "skip"
  );

  const adminContext = useQuery(
    api.disputes.queries.getDisputeAdminContext,
    dispute &&
      user?._id &&
      (user.role === "admin" || user.role === "moderator")
      ? { disputeId: dispute._id, userId: user._id }
      : "skip"
  );

  const enforcementEvents = useQuery(
    api.disputes.queries.listDisputeEnforcementEvents,
    dispute &&
      user?._id &&
      dispute.status === "resolved" &&
      (user.role === "admin" || user.role === "moderator")
      ? { disputeId: dispute._id, userId: user._id }
      : "skip"
  );

  const assignModeratorMutation = useMutation(api.disputes.mutations.assignModerator);
  const scheduleJudgmentFunds = useMutation(api.disputes.mutations.scheduleJudgmentFundsRelease);
  const applyJudgmentRoster = useMutation(api.disputes.mutations.applyJudgmentProjectRoster);
  const enqueueReplacementCandidates = useMutation(
    api.disputes.mutations.enqueueJudgmentReplacementCandidates
  );
  const sendReplacementClientNotice = useMutation(
    api.disputes.mutations.sendJudgmentReplacementClientNotice
  );
  const resumeProjectAfterDispute = useMutation(
    api.disputes.mutations.resumeProjectAfterJudgmentDispute
  );
  const finalizeDisputeEnforcementMutation = useMutation(
    api.disputes.mutations.finalizeDisputeEnforcement
  );
  const moderatorsForAssign = useQuery(
    api.users.queries.getAllUsersAdmin,
    user?.role === "admin" && user?._id && dispute
      ? { role: "moderator", status: "active", userId: user._id }
      : "skip"
  );
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignModeratorPick, setAssignModeratorPick] = useState<string>("");
  const [finalizeEnforcementSummary, setFinalizeEnforcementSummary] = useState("");
  const [enforcementBusy, setEnforcementBusy] = useState<string | null>(null);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  if (dispute === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (dispute === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Dispute not found</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/disputes">Back to Disputes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeDisputeStatuses = new Set([
    "open",
    "under_review",
    "escalated",
    // Legacy statuses (so old rows still appear active in the UI).
    "negotiation",
    "platform_intervention_requested",
    "awaiting_party_evidence",
    "judgment_issued",
    "objection_window",
    "appeal_review",
    "enforcing_resolution",
  ]);
  const isActiveDispute = activeDisputeStatuses.has(dispute.status);
  const canCancel = dispute.initiatorId === user._id && isActiveDispute;
  const progressSteps = [
    {
      label: "Open",
      description: "Dispute submitted; staff are notified.",
      statuses: ["open", "negotiation", "platform_intervention_requested", "awaiting_party_evidence"],
    },
    {
      label: "Under review",
      description: "49GIG reviews the case and may request more evidence.",
      statuses: ["under_review", "escalated", "judgment_issued", "objection_window", "appeal_review", "enforcing_resolution"],
    },
    {
      label: "Settled",
      description: "Outcome enforced; hire status updated.",
      statuses: ["resolved", "closed", "cancelled"],
    },
  ];
  const activeProgressIndex = Math.max(
    0,
    progressSteps.findIndex((step) =>
      step.statuses.includes(dispute.stage ?? dispute.status)
    )
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      open: "destructive",
      under_review: "secondary",
      resolved: "default",
      escalated: "destructive",
      closed: "outline",
      cancelled: "outline",
    };
    return (
      <Badge variant={variants[status] || "outline"} className="font-medium tracking-tight">
        {disputeStatusLabel(status)}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      milestone_quality: "Deliverable / quality (legacy)",
      payment: "Payment (legacy)",
      communication: "Communication (legacy)",
      freelancer_replacement: "Replacement (legacy)",
      client_deliverable_quality: "Deliverable / quality (client)",
      client_timeline_scope: "Timeline / scope (client)",
      client_payment_billing: "Payment / billing (client)",
      client_communication_conduct: "Communication / conduct (client)",
      client_request_replacement: "Request replacement (client)",
      freelancer_payment_issue: "Payment issue (freelancer)",
      freelancer_scope_requirements: "Scope / requirements (freelancer)",
      freelancer_communication: "Communication (freelancer)",
      freelancer_platform_policy: "Platform / policy (freelancer)",
    };
    return labels[type] || type;
  };

  const canAddEvidence =
    (user.role === "client" || user.role === "freelancer") &&
    isActiveDispute;

  const isModerator = user.role === "moderator" || user.role === "admin";

  const canClaimOrAssignDispute =
    isModerator &&
    dispute.status === "open" &&
    !dispute.assignedModeratorId;

  const canAdminPickModerator = user.role === "admin" && canClaimOrAssignDispute;
  const canModeratorSelfAssign = user.role === "moderator" && canClaimOrAssignDispute;

  const staffCanOperateDispute =
    user.role === "admin" ||
    (user.role === "moderator" &&
      !!dispute.assignedModeratorId &&
      String(dispute.assignedModeratorId) === String(user._id));

  const canResolve =
    isModerator && staffCanOperateDispute && isActiveDispute && (user.role === "admin" || !!dispute.assignedModeratorId);

  const canRequestEvidenceFromParties =
    isModerator && isActiveDispute && staffCanOperateDispute;

  const canStaffEnforcement =
    isModerator &&
    staffCanOperateDispute &&
    dispute.status === "resolved" &&
    dispute.resolutionExecutedAt == null;

  const evidenceRequests = (dispute.evidenceRequests ?? []) as EvidenceRequest[];
  const myEvidenceRequests = evidenceRequests.filter((r) =>
    r.requestedFromUserIds.some((id) => String(id) === String(user._id))
  );
  const projectFreelancerOptions: { _id: Id<"users">; name: string }[] =
    (adminContext?.freelancers ?? []).map((f: { _id: string; name: string }) => ({
      _id: f._id as Id<"users">,
      name: f.name,
    }));

  const runEnforcementStep = async (stepKey: string, fn: () => Promise<void>) => {
    if (!user?._id) return;
    setEnforcementBusy(stepKey);
    try {
      await fn();
      toast.success("Step completed.");
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Could not complete this enforcement step.");
    } finally {
      setEnforcementBusy(null);
    }
  };

  const handleCancelDispute = async () => {
    if (!user?._id || !cancelReason.trim()) return;
    setIsCancelling(true);
    try {
      await cancelDisputeMutation({
        disputeId: dispute!._id,
        reason: cancelReason.trim(),
        userId: user._id,
      });
      toast.success("Dispute cancelled successfully.");
      setCancelDialogOpen(false);
      setCancelReason("");
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Could not cancel the dispute.");
    } finally {
      setIsCancelling(false);
    }
  };

  const resetEvidenceRequestForm = () => {
    setEvidenceRequestScope("both");
    setEvidenceRequestDescription("");
    setEvidenceRequestFreelancerIds([]);
  };

  const handleSubmitEvidenceRequest = async () => {
    if (!user?._id || !evidenceRequestDescription.trim()) return;
    if (
      evidenceRequestScope === "specific" &&
      evidenceRequestFreelancerIds.length === 0
    ) {
      toast.error("Pick at least one freelancer to ask.");
      return;
    }
    setIsCreatingEvidenceRequest(true);
    try {
      await requestDisputeEvidence({
        disputeId: dispute._id,
        scope: evidenceRequestScope,
        freelancerIds:
          evidenceRequestScope === "specific"
            ? (evidenceRequestFreelancerIds as Id<"users">[])
            : undefined,
        description: evidenceRequestDescription.trim(),
        userId: user._id,
      });
      toast.success("Evidence request sent.");
      setEvidenceRequestDialogOpen(false);
      resetEvidenceRequestForm();
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Could not send request.");
    } finally {
      setIsCreatingEvidenceRequest(false);
    }
  };

  const handleCancelEvidenceRequest = async (
    evidenceRequestId: Id<"disputeEvidenceRequests">
  ) => {
    if (!user?._id) return;
    try {
      await cancelDisputeEvidenceRequest({
        evidenceRequestId,
        userId: user._id,
      });
      toast.success("Evidence request cancelled.");
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Could not cancel request.");
    }
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-linear-to-b from-muted/30 via-background to-background pb-10 pt-4 sm:pb-12 sm:pt-6">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        {/* Hero */}
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm sm:mb-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_100%_-20%,hsl(var(--primary)/0.08),transparent_55%),radial-gradient(700px_circle_at_0%_120%,hsl(var(--violet-500)/0.06),transparent_50%)]" />
          <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
            <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
              <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl border-border/80" asChild>
                <Link href="/dashboard/disputes" aria-label="Back to disputes">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                    Dispute
                  </h1>
                  {getStatusBadge(dispute.status)}
                </div>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:text-sm">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] sm:text-xs">
                    <Hash className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{dispute._id.slice(-12)}</span>
                  </span>
                  <span className="hidden h-1 w-1 rounded-full bg-border sm:inline" aria-hidden />
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    Opened {new Date(dispute.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </span>
                </p>
                <p className="text-sm font-medium text-foreground/90 line-clamp-2 sm:line-clamp-none">
                  {getTypeLabel(dispute.type)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Main */}
          <div className="space-y-6 lg:col-span-8">
            {/* Case summary */}
            <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="space-y-1 border-b border-border/50 bg-muted/20 px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex items-center gap-2 text-primary">
                  <Scale className="h-5 w-5 shrink-0" />
                  <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">Case summary</CardTitle>
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  Category, reason, and what was reported. Staff and both parties see this context.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailField label="Dispute type" icon={<Briefcase />}>
                    {getTypeLabel(dispute.type)}
                  </DetailField>
                  <DetailField label="Reason" icon={<AlertCircle />}>
                    {dispute.reason}
                  </DetailField>
                </div>

                {"initiatorFullName" in dispute && dispute.initiatorFullName ? (
                  <div className="rounded-xl border border-primary/15 bg-primary/4 p-4 sm:p-5">
                    <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                      <Users className="h-4 w-4" />
                      Parties
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-border/50 bg-background/80 px-3 py-2.5">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Disputor</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{dispute.initiatorFullName}</p>
                        <p className="text-xs capitalize text-muted-foreground">{dispute.initiatorRole}</p>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-background/80 px-3 py-2.5">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Disputed</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {Array.isArray(dispute.disputedPartyNames) && dispute.disputedPartyNames.length > 0
                            ? dispute.disputedPartyNames.join(", ")
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <DetailField label="Full description" icon={<FileText />}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{dispute.description}</p>
                </DetailField>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailField label="Initiator" icon={<User />}>
                    {"initiatorFullName" in dispute && dispute.initiatorFullName ? (
                      <>
                        <span className="font-semibold">{dispute.initiatorFullName}</span>
                        <span className="text-muted-foreground capitalize"> · {dispute.initiatorRole}</span>
                      </>
                    ) : (
                      <span className="capitalize">{dispute.initiatorRole}</span>
                    )}
                  </DetailField>
                  {(dispute.monthlyCycleId || dispute.milestoneId) && (
                    <DetailField
                      label={dispute.monthlyCycleId ? "Monthly payment" : "Milestone"}
                      icon={<ExternalLink />}
                    >
                      <Button variant="link" className="h-auto p-0 text-sm font-semibold" asChild>
                        <Link
                          href={`/dashboard/projects/${String(dispute.projectId)}${
                            dispute.monthlyCycleId
                              ? "?cycle=" + String(dispute.monthlyCycleId)
                              : dispute.milestoneId
                                ? "?milestone=" + String(dispute.milestoneId)
                                : ""
                          }`}
                        >
                          {dispute.monthlyCycleId ? "View billing cycle on project" : "View milestone on project"}
                        </Link>
                      </Button>
                    </DetailField>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="space-y-1 border-b border-border/50 bg-muted/15 px-4 py-4 sm:px-6 sm:py-5">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <Scale className="h-5 w-5 shrink-0 text-primary" />
                  Case progress
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Disputes are an escalation. Use the project chat to communicate; staff drive the review here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    {progressSteps.map((step, index) => {
                      const isDone = index < activeProgressIndex;
                      const isActive = index === activeProgressIndex;
                      return (
                        <div key={step.label} className="relative flex flex-1 gap-3 md:block">
                          {index < progressSteps.length - 1 && (
                            <div
                              className={`absolute left-4 top-8 h-[calc(100%+1rem)] w-px md:left-[calc(50%+1rem)] md:top-4 md:h-px md:w-[calc(100%-2rem)] ${
                                isDone ? "bg-primary" : "bg-border"
                              }`}
                            />
                          )}
                          <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background md:mx-auto">
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            ) : isActive ? (
                              <Clock className="h-4 w-4 text-primary" />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                            )}
                          </div>
                          <div
                            className={`rounded-xl px-3 pb-1 md:mt-3 md:text-center ${
                              isActive
                                ? "bg-primary/6 py-2 ring-1 ring-primary/20"
                                : "py-1"
                            }`}
                          >
                            <p className="text-sm font-semibold">{step.label}</p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/4 px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">Communication stays on the project</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Continue conversations in the project chat. Use this page to track the dispute, add evidence,
                        and respond to staff requests.
                      </p>
                      <Button variant="link" className="h-auto p-0 mt-2 text-sm font-semibold" asChild>
                        <Link href={`/dashboard/projects/${String(dispute.projectId)}#chat`}>
                          Open project chat
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>

                {Array.isArray(dispute.stageEvents) && dispute.stageEvents.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Timeline</p>
                    <div className="space-y-2">
                      {dispute.stageEvents.slice(-8).reverse().map((event: { _id: string; title: string; description?: string; createdAt: number }) => (
                        <div key={event._id} className="rounded-lg border border-border/50 bg-background/70 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium">{event.title}</p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {event.description && (
                            <p className="mt-1 text-xs text-muted-foreground">{event.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Evidence requests */}
            {(isModerator || myEvidenceRequests.length > 0) && (
              <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
                <CardHeader className="space-y-3 border-b border-border/50 bg-muted/15 px-4 py-4 sm:px-6 sm:py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                        <Inbox className="h-5 w-5 shrink-0 text-primary" />
                        Evidence requests
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {isModerator
                          ? "Ask the client, freelancer(s), or specific seats to write a response or attach evidence."
                          : "49GIG staff have asked you for more details. Reply in writing — and optionally attach a file or link."}
                      </CardDescription>
                    </div>
                    {canRequestEvidenceFromParties && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => setEvidenceRequestDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Request evidence
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 px-4 py-5 sm:px-6 sm:py-6">
                  {(isModerator ? evidenceRequests : myEvidenceRequests).length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/10 py-8 text-center">
                      <Inbox className="h-7 w-7 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        {isModerator ? "No evidence requests yet." : "Nothing pending from staff."}
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {(isModerator ? evidenceRequests : myEvidenceRequests).map((req) => {
                        const scopeLabel =
                          req.scope === "client"
                            ? "Client"
                            : req.scope === "freelancer"
                              ? "Freelancer(s)"
                              : req.scope === "both"
                                ? "Client + Freelancer(s)"
                                : "Specific seats";
                        const isMine = req.requestedFromUserIds.some(
                          (id) => String(id) === String(user._id)
                        );
                        return (
                          <li
                            key={req._id}
                            className="rounded-xl border border-border/50 bg-muted/10 p-3 sm:p-4"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant={
                                      req.status === "pending"
                                        ? "destructive"
                                        : req.status === "fulfilled"
                                          ? "default"
                                          : "outline"
                                    }
                                  >
                                    {req.status}
                                  </Badge>
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {scopeLabel}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {new Date(req.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                                  {req.description}
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-wrap gap-2">
                                {!isModerator && isMine && req.status === "pending" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setRespondingRequest(req)}
                                  >
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Respond
                                  </Button>
                                )}
                                {isModerator && req.status === "pending" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void handleCancelEvidenceRequest(req._id)}
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel request
                                  </Button>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Evidence */}
          <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="space-y-3 border-b border-border/50 bg-muted/15 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                    <Paperclip className="h-5 w-5 shrink-0 text-primary" />
                    Evidence
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    Files, chat excerpts, and deliverables attached to this case.
                  </CardDescription>
                </div>
                {canAddEvidence && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setIsAddingEvidence(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add evidence
                    </Button>
                    {dispute && user?._id && (
                      <AddEvidenceDialog
                        open={isAddingEvidence}
                        onOpenChange={setIsAddingEvidence}
                        disputeId={dispute._id}
                        projectId={dispute.projectId}
                        userId={user._id}
                        onSuccess={() => {
                          // Refresh will happen automatically via useQuery
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
              {(() => {
                const structured = dispute.structuredEvidence ?? [];
                const hasStructured = structured.length > 0;
                const legacy = dispute.evidence ?? [];

                if (hasStructured) {
                  return (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold">Case evidence</p>
                      {structured.map(
                        (evidence: {
                          _id: Id<"disputeEvidence">;
                          title: string;
                          description?: string;
                          evidenceType: string;
                          messageId?: Id<"messages">;
                          fileUrl?: string | null;
                          url?: string;
                          submittedByRole?: string;
                          submitterDisplayName?: string;
                          createdAt: number;
                        }) => (
                          <div key={evidence._id} className="rounded-xl border border-border/50 bg-muted/10 p-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-baseline justify-between gap-2 gap-y-1">
                                <p className="text-sm font-semibold">{evidence.title}</p>
                                <span className="text-[11px] text-muted-foreground tabular-nums">
                                  {new Date(evidence.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                <span className="capitalize">
                                  {(evidence.submitterDisplayName ?? "Unknown").trim()}
                                </span>
                                {" · "}
                                <span className="capitalize">
                                  {(evidence.submittedByRole ?? "party").replace(/_/g, " ")}
                                </span>
                                {" · "}
                                <span className="capitalize">
                                  {evidence.evidenceType.replace(/_/g, " ")}
                                </span>
                              </p>
                              {evidence.description && (
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                  {evidence.description}
                                </p>
                              )}
                              {evidence.messageId ? (
                                <Link
                                  href={`/dashboard/chat?message=${evidence.messageId}`}
                                  className="mt-2 inline-flex text-xs font-medium text-primary hover:underline"
                                >
                                  View message
                                </Link>
                              ) : null}
                              {(evidence.fileUrl || evidence.url) && (
                                <a
                                  href={evidence.fileUrl ?? evidence.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-flex text-xs font-medium text-primary hover:underline"
                                >
                                  Open evidence
                                </a>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  );
                }

                if (legacy.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/10 py-10 text-center">
                      <FileText className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No evidence submitted yet.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">Case evidence (legacy)</p>
                    <p className="text-xs text-muted-foreground">
                      Submitted with the dispute opening by{" "}
                      <span className="font-medium text-foreground">{dispute.initiatorFullName}</span>{" "}
                      <span className="capitalize">({dispute.initiatorRole ?? "party"})</span>.
                    </p>
                    <ul className="space-y-3">
                      {legacy.map((evidence: DisputeEvidenceItem, idx: number) => (
                        <li
                          key={idx}
                          className="flex gap-3 rounded-xl border border-border/50 bg-muted/10 p-3 transition-colors hover:bg-muted/20 sm:p-4"
                        >
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background">
                            {evidence.type === "message" && (
                              <MessageSquare className="h-4 w-4 text-primary" />
                            )}
                            {evidence.type === "file" && (
                              <FileText className="h-4 w-4 text-primary" />
                            )}
                            {evidence.type === "milestone_deliverable" && (
                              <DollarSign className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold capitalize tracking-tight">
                              {evidence.type.replace(/_/g, " ")}
                            </p>
                            {evidence.description && (
                              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                {evidence.description}
                              </p>
                            )}
                            {evidence.messageId && (
                              <Link
                                href={`/dashboard/chat?message=${evidence.messageId}`}
                                className="mt-2 inline-flex text-xs font-medium text-primary hover:underline"
                              >
                                View message
                              </Link>
                            )}
                            {evidence.fileId && (
                              <a
                                href={evidence.fileUrl ?? "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`mt-2 inline-flex text-xs font-medium hover:underline ${
                                  evidence.fileUrl ? "text-primary" : "pointer-events-none text-muted-foreground"
                                }`}
                              >
                                {evidence.fileUrl ? "Download / view file" : "File (URL unavailable)"}
                              </a>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Resolution (if resolved) */}
          {dispute.resolution && (
            <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="space-y-1 border-b border-border/50 bg-muted/15 px-4 py-4 sm:px-6 sm:py-5">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  Resolution
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Staff decision, internal notes, and any messages shared with each party.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-4 py-5 sm:px-6 sm:py-6">
                <DetailField label="Decision" icon={<Scale />}>
                  <span className="capitalize">{dispute.resolution.decision.replace(/_/g, " ")}</span>
                  {dispute.resolution.decision === "replacement" && (
                    <p className="mt-3 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">
                      Replacement was recorded as the judgment outcome. Actual hire status, escrow movements, and
                      client-facing replacement steps are applied by assigned staff via enforcement actions.
                    </p>
                  )}
                </DetailField>
                {dispute.resolution.resolutionAmount != null && (
                  <DetailField label="Resolution amount" icon={<DollarSign />}>
                    ${(dispute.resolution.resolutionAmount / 100).toFixed(2)}
                  </DetailField>
                )}
                <DetailField label="Staff notes" icon={<FileText />}>
                  <p className="whitespace-pre-wrap">{dispute.resolution.notes}</p>
                </DetailField>
                {dispute.resolution.clientMessage ? (
                  <DetailField label="Message to client" icon={<User />}>
                    <p className="whitespace-pre-wrap">{dispute.resolution.clientMessage}</p>
                  </DetailField>
                ) : null}
                {dispute.resolution.freelancerMessage ? (
                  <DetailField label="Message to freelancer(s)" icon={<Users />}>
                    <p className="whitespace-pre-wrap">{dispute.resolution.freelancerMessage}</p>
                  </DetailField>
                ) : null}
                <DetailField label="Resolved at" icon={<Calendar />}>
                  {new Date(dispute.resolution.resolvedAt).toLocaleString()}
                </DetailField>
                {dispute.resolutionExecutedAt != null ? (
                  <DetailField label="Enforcement" icon={<Clock />}>
                    Finalized {new Date(dispute.resolutionExecutedAt).toLocaleString()}
                    {dispute.resolutionExecutionSummary ? (
                      <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                        {dispute.resolutionExecutionSummary}
                      </p>
                    ) : null}
                  </DetailField>
                ) : dispute.status === "resolved" ? (
                  <DetailField label="Enforcement" icon={<Clock />}>
                    Waiting for assigned staff to run manual enforcement actions.
                  </DetailField>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-4 lg:sticky lg:top-4 lg:self-start">
          {adminContext && (
            <Card className="overflow-hidden rounded-2xl border-primary/25 shadow-sm">
              <CardHeader className="border-b border-border/50 bg-primary/4 px-4 py-4 sm:px-6 sm:py-5">
                <CardTitle className="text-base font-semibold sm:text-lg">Case overview (staff)</CardTitle>
                <CardDescription>Hire, parties, and billing context</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 px-4 py-4 text-sm sm:px-6 sm:py-5">
                <div>
                  <span className="text-muted-foreground">Hire</span>
                  <p className="font-medium">{adminContext.hireTitle}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    Status: {adminContext.projectStatus.replace(/_/g, " ")}
                  </p>
                </div>
                {adminContext.client && (
                  <div>
                    <span className="text-muted-foreground">Client</span>
                    <p className="font-medium">{adminContext.client.name}</p>
                    <p className="text-xs break-all">{adminContext.client.email}</p>
                  </div>
                )}
                {adminContext.freelancers?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Freelancer(s)</span>
                    <ul className="mt-1 space-y-2">
                      {adminContext.freelancers.map((f: { _id: string; name: string; email?: string }) => (
                        <li key={f._id}>
                          <span className="font-medium">{f.name}</span>
                          {f.email && (
                            <span className="block text-xs break-all text-muted-foreground">{f.email}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {adminContext.initiator && (
                  <div>
                    <span className="text-muted-foreground">Opened by</span>
                    <p className="font-medium">
                      {adminContext.initiator.name} ({adminContext.initiator.role})
                    </p>
                  </div>
                )}
                {adminContext.monthlyCycle && (
                  <div>
                    <span className="text-muted-foreground">Monthly cycle</span>
                    <p className="font-medium">
                      Month {adminContext.monthlyCycle.monthIndex} ·{" "}
                      {(adminContext.monthlyCycle.amountCents / 100).toFixed(2)}{" "}
                      {adminContext.monthlyCycle.currency?.toUpperCase()}
                    </p>
                  </div>
                )}
                {adminContext.assignedTo && (
                  <div>
                    <span className="text-muted-foreground">Assigned</span>
                    <p className="font-medium">
                      {adminContext.assignedTo.name} ({adminContext.assignedTo.role})
                    </p>
                  </div>
                )}
                {canAdminPickModerator && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      setAssignDialogOpen(true);
                      const first = moderatorsForAssign?.[0]?._id;
                      setAssignModeratorPick(first ? String(first) : "");
                    }}
                  >
                    Assign to moderator…
                  </Button>
                )}
                {canModeratorSelfAssign && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={async () => {
                      if (!user?._id) return;
                      try {
                        await assignModeratorMutation({
                          disputeId: dispute._id,
                          moderatorId: user._id,
                          userId: user._id,
                        });
                        toast.success("Dispute assigned to you.");
                      } catch (e) {
                        toast.error(getUserFriendlyError(e) || "Could not assign");
                      }
                    }}
                  >
                    Assign to me
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Project Info */}
          <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/15 px-4 py-4 sm:px-6 sm:py-5">
              <CardTitle className="text-base font-semibold sm:text-lg">Project</CardTitle>
              <CardDescription>Hire this dispute is tied to</CardDescription>
            </CardHeader>
            <CardContent className="px-4 py-4 sm:px-6 sm:py-5">
              <Button variant="link" className="h-auto p-0 text-base font-semibold" asChild>
                <Link href={`/dashboard/projects/${String(dispute.projectId)}`}>View project</Link>
              </Button>
              {project && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {project.intakeForm?.title || "Untitled project"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Financial Info */}
          <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/15 px-4 py-4 sm:px-6 sm:py-5">
              <CardTitle className="text-base font-semibold sm:text-lg">Financial details</CardTitle>
              <CardDescription>
                Amount in scope for this dispute. The figure is shown in the form that applies to your role.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/10 px-4 py-3">
                <span className="text-sm text-muted-foreground">Locked amount</span>
                <span className="font-mono text-sm font-semibold tabular-nums">
                  ${Number(dispute.lockedAmount ?? 0).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions (Moderator/Admin) */}
          {canResolve && (
            <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/15 px-4 py-4 sm:px-6 sm:py-5">
                <CardTitle className="text-base font-semibold sm:text-lg">Moderator actions</CardTitle>
                <CardDescription>Review evidence, request more if needed, then record a judgment.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 px-4 py-4 sm:px-6 sm:py-5">
                <Button className="w-full" asChild>
                  <Link href={`/dashboard/disputes/${disputeId}/resolve`}>
                    Record judgment
                  </Link>
                </Button>
                {canRequestEvidenceFromParties && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setEvidenceRequestDialogOpen(true)}
                  >
                    Request more evidence
                  </Button>
                )}
                {user.role === "moderator" && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/dashboard/disputes/${disputeId}/escalate`}>
                      Escalate to Admin
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {canStaffEnforcement && (
            <Card className="overflow-hidden rounded-2xl border-amber-500/25 shadow-sm">
              <CardHeader className="border-b border-border/50 bg-amber-500/5 px-4 py-4 sm:px-6 sm:py-5">
                <CardTitle className="text-base font-semibold sm:text-lg">
                  Manual enforcement
                </CardTitle>
                <CardDescription>
                  Judgment recorded — escrow, roster updates, matching, and client emails are intentional,
                  ordered steps here. Funds run through the automated distribution engine for your chosen
                  decision type.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex flex-col gap-2">
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    disabled={!!enforcementBusy}
                    onClick={() =>
                      void runEnforcementStep("funds", async () => {
                        if (!user?._id || !dispute) return;
                        await scheduleJudgmentFunds({
                          disputeId: dispute._id,
                          userId: user._id,
                        });
                      })
                    }
                  >
                    {enforcementBusy === "funds" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Run fund release ({dispute.resolution?.decision?.replace(/_/g, " ") ?? "judgment"})
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    disabled={!!enforcementBusy}
                    onClick={() =>
                      void runEnforcementStep("roster", async () => {
                        if (!user?._id || !dispute) return;
                        await applyJudgmentRoster({
                          disputeId: dispute._id,
                          userId: user._id,
                        });
                      })
                    }
                  >
                    {enforcementBusy === "roster" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Apply hire roster outcome
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    disabled={
                      !!enforcementBusy ||
                      (dispute.resolution?.decision !== "client_favor" &&
                        dispute.resolution?.decision !== "replacement")
                    }
                    onClick={() =>
                      void runEnforcementStep("matches", async () => {
                        if (!user?._id || !dispute) return;
                        await enqueueReplacementCandidates({
                          disputeId: dispute._id,
                          userId: user._id,
                        });
                      })
                    }
                  >
                    {enforcementBusy === "matches" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Regenerate replacement candidates
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    disabled={
                      !!enforcementBusy ||
                      (dispute.resolution?.decision !== "client_favor" &&
                        dispute.resolution?.decision !== "replacement")
                    }
                    onClick={() =>
                      void runEnforcementStep("email", async () => {
                        if (!user?._id || !dispute) return;
                        await sendReplacementClientNotice({
                          disputeId: dispute._id,
                          userId: user._id,
                        });
                      })
                    }
                  >
                    {enforcementBusy === "email" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Email client (replacement flow)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    disabled={!!enforcementBusy}
                    onClick={() =>
                      void runEnforcementStep("resume", async () => {
                        if (!user?._id || !dispute) return;
                        await resumeProjectAfterDispute({
                          disputeId: dispute._id,
                          userId: user._id,
                        });
                      })
                    }
                  >
                    {enforcementBusy === "resume" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Resume hire (clear disputed hire status)
                  </Button>
                </div>

                <div className="space-y-2 rounded-xl border border-border/60 bg-muted/10 p-3">
                  <Label htmlFor="enforce-summary">Finalize enforcement (optional summary)</Label>
                  <Textarea
                    id="enforce-summary"
                    value={finalizeEnforcementSummary}
                    onChange={(e) => setFinalizeEnforcementSummary(e.target.value)}
                    placeholder="Internal note on what was completed"
                    rows={3}
                  />
                  <Button
                    className="w-full"
                    disabled={!!enforcementBusy}
                    onClick={() =>
                      void runEnforcementStep("finalize", async () => {
                        if (!user?._id || !dispute) return;
                        await finalizeDisputeEnforcementMutation({
                          disputeId: dispute._id,
                          summary: finalizeEnforcementSummary.trim() || undefined,
                          userId: user._id,
                        });
                        setFinalizeEnforcementSummary("");
                      })
                    }
                  >
                    {enforcementBusy === "finalize" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Mark enforcement complete
                  </Button>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    After finalizing, this case is locked against further automation steps tied to judgment
                    enforcement.
                  </p>
                </div>

                {Array.isArray(enforcementEvents) && enforcementEvents.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Event log
                    </p>
                    <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
                      {enforcementEvents.map(
                        (ev: {
                          _id: string;
                          kind: string;
                          createdAt: number;
                          actorName?: string;
                          details?: unknown;
                        }) => (
                          <li
                            key={ev._id}
                            className="rounded-lg border border-border/50 bg-background/70 px-2 py-1.5"
                          >
                            <span className="font-medium capitalize">{ev.kind.replace(/_/g, " ")}</span>
                            <span className="text-muted-foreground">
                              {" "}
                              · {ev.actorName ?? "staff"} · {new Date(ev.createdAt).toLocaleString()}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                ) : enforcementEvents !== undefined ? (
                  <p className="text-xs text-muted-foreground">No enforcement events yet.</p>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Cancel dispute (initiator only, while open/under_review) */}
          {canCancel && (
            <Card className="overflow-hidden rounded-2xl border-orange-500/30 shadow-sm">
              <CardHeader className="border-b border-orange-500/15 bg-orange-500/6 px-4 py-4 sm:px-6 sm:py-5">
                <CardTitle className="text-base font-semibold">Withdraw dispute</CardTitle>
                <CardDescription>
                  If you and the other party have resolved the issue, you can cancel this dispute.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 py-4 sm:px-6 sm:py-5">
                <Button
                  variant="outline"
                  className="w-full border-orange-500/40 text-orange-600 hover:bg-orange-500/10 hover:text-orange-700"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  Cancel this dispute
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Cancelled state info */}
          {dispute.status === "cancelled" && (
            <Card className="overflow-hidden rounded-2xl border-muted shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/20 px-4 py-4 sm:px-6 sm:py-5">
                <CardTitle className="text-base font-semibold text-muted-foreground">Dispute cancelled</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-4 py-4 text-sm sm:px-6 sm:py-5">
                <p className="text-muted-foreground">{dispute.cancellationReason}</p>
                {dispute.cancelledAt && (
                  <p className="text-xs text-muted-foreground">
                    Cancelled {new Date(dispute.cancelledAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        </div>
      </div>

      {/* Admin: assign to moderator */}
      <Dialog
        open={assignDialogOpen}
        onOpenChange={(open) => {
          setAssignDialogOpen(open);
          if (!open) setAssignModeratorPick("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign to moderator</DialogTitle>
            <DialogDescription>
              Select who should own this dispute. They receive an in-app notification.
            </DialogDescription>
          </DialogHeader>
          {moderatorsForAssign === undefined ? (
            <p className="text-sm text-muted-foreground py-4">Loading moderators…</p>
          ) : moderatorsForAssign.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No active moderators found.</p>
          ) : (
            <div className="space-y-2 py-2">
              <Label htmlFor="detail-assign-mod">Moderator</Label>
              <Select value={assignModeratorPick} onValueChange={setAssignModeratorPick}>
                <SelectTrigger id="detail-assign-mod" className="w-full">
                  <SelectValue placeholder="Select a moderator" />
                </SelectTrigger>
                <SelectContent>
                  {moderatorsForAssign.map((m: { _id: string; name: string; email: string }) => (
                    <SelectItem key={m._id} value={m._id}>
                      {m.name} ({m.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAssignDialogOpen(false);
                setAssignModeratorPick("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                !assignModeratorPick ||
                !user?._id ||
                moderatorsForAssign === undefined ||
                moderatorsForAssign.length === 0
              }
              onClick={async () => {
                if (!assignModeratorPick || !user?._id) return;
                try {
                  await assignModeratorMutation({
                    disputeId: dispute._id,
                    moderatorId: assignModeratorPick as Id<"users">,
                    userId: user._id,
                  });
                  toast.success("Dispute assigned.");
                  setAssignDialogOpen(false);
                  setAssignModeratorPick("");
                } catch (e) {
                  toast.error(getUserFriendlyError(e) || "Could not assign");
                }
              }}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={evidenceRequestDialogOpen}
        onOpenChange={(open) => {
          setEvidenceRequestDialogOpen(open);
          if (!open) resetEvidenceRequestForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request more evidence</DialogTitle>
            <DialogDescription>
              Choose who should respond and describe what you need. The selected parties will be notified
              and can reply with a written response, attach a file, or share a link directly on this page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="evidence-scope">Who should respond?</Label>
              <Select
                value={evidenceRequestScope}
                onValueChange={(value) =>
                  setEvidenceRequestScope(value as typeof evidenceRequestScope)
                }
              >
                <SelectTrigger id="evidence-scope" className="w-full">
                  <SelectValue placeholder="Select recipients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client only</SelectItem>
                  <SelectItem value="freelancer">All freelancer(s) on this hire</SelectItem>
                  <SelectItem value="both">Client and freelancer(s)</SelectItem>
                  <SelectItem value="specific">Specific freelancer(s)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {evidenceRequestScope === "specific" && (
              <div className="space-y-2">
                <Label>Pick the freelancer(s) on this hire</Label>
                {projectFreelancerOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No freelancers are currently associated with this hire.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {projectFreelancerOptions.map((f) => {
                      const checked = evidenceRequestFreelancerIds.includes(String(f._id));
                      return (
                        <label
                          key={String(f._id)}
                          className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => {
                              setEvidenceRequestFreelancerIds((prev) => {
                                const id = String(f._id);
                                if (value === true) return prev.includes(id) ? prev : [...prev, id];
                                return prev.filter((p) => p !== id);
                              });
                            }}
                          />
                          <span className="font-medium">{f.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="evidence-description">What do you need from them?</Label>
              <Textarea
                id="evidence-description"
                value={evidenceRequestDescription}
                onChange={(e) => setEvidenceRequestDescription(e.target.value)}
                rows={5}
                placeholder="e.g. Please upload screenshots of the failed deliverable and your last messages confirming scope."
              />
              <p className="text-xs text-muted-foreground">
                Be specific so the parties know exactly what to send.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEvidenceRequestDialogOpen(false);
                resetEvidenceRequestForm();
              }}
              disabled={isCreatingEvidenceRequest}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSubmitEvidenceRequest()}
              disabled={
                isCreatingEvidenceRequest ||
                !evidenceRequestDescription.trim() ||
                (evidenceRequestScope === "specific" &&
                  evidenceRequestFreelancerIds.length === 0)
              }
            >
              {isCreatingEvidenceRequest ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {user?._id && dispute && (
        <RespondEvidenceDialog
          open={!!respondingRequest}
          onOpenChange={(open) => {
            if (!open) setRespondingRequest(null);
          }}
          disputeId={dispute._id}
          evidenceRequestId={respondingRequest?._id ?? null}
          requestDescription={respondingRequest?.description ?? ""}
          userId={user._id}
        />
      )}

      {/* Cancel dispute dialog */}
      <Dialog
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          setCancelDialogOpen(open);
          if (!open) setCancelReason("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this dispute?</DialogTitle>
            <DialogDescription>
              This will withdraw the dispute and restore the project to active status.
              The other party will be notified. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="cancel-reason">Reason for cancellation <span className="text-destructive">*</span></Label>
            <Textarea
              id="cancel-reason"
              placeholder="e.g. We resolved the issue directly and no longer need the dispute."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">This reason will be shared with the other party.</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isCancelling}
            >
              Keep dispute open
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleCancelDispute()}
              disabled={isCancelling || !cancelReason.trim()}
            >
              {isCancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Cancel dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

