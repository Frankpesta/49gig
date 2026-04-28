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
  XCircle,
  Paperclip,
  Send,
  Loader2,
  Download,
  Image as ImageIcon,
  User,
  Users,
  Calendar,
  Hash,
  Briefcase,
  Scale,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { AddEvidenceDialog } from "./add-evidence-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DISPUTE_STAGE_ORDER,
  disputeStageIndex,
  disputeStatusLabel,
  getDisputeReasonPolicy,
} from "@/lib/dispute-flow";

type DisputeEvidenceItem = Doc<"disputes">["evidence"][number] & { fileUrl?: string | null };

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
  const [disputeChatText, setDisputeChatText] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Array<{ fileId: Id<"_storage">; fileName: string; fileSize: number; mimeType: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendDisputeChatMessage = useMutation(api.disputes.mutations.sendDisputeChatMessage);
  const generateUploadUrl = useMutation(api.disputes.mutations.generateDisputeUploadUrl);
  const cancelDisputeMutation = useMutation(api.disputes.mutations.cancelDispute);
  const requestPlatformIntervention = useMutation(api.disputes.mutations.requestPlatformIntervention);
  const raiseDisputeObjection = useMutation(api.disputes.mutations.raiseDisputeObjection);
  const enforceDisputeJudgment = useMutation(api.disputes.mutations.enforceDisputeJudgment);
  const reviewDisputeEvidence = useMutation(api.disputes.mutations.reviewDisputeEvidence);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [interventionDialogOpen, setInterventionDialogOpen] = useState(false);
  const [interventionReason, setInterventionReason] = useState("");
  const [isRequestingIntervention, setIsRequestingIntervention] = useState(false);
  const [objectionDialogOpen, setObjectionDialogOpen] = useState(false);
  const [objectionReason, setObjectionReason] = useState("");
  const [isObjecting, setIsObjecting] = useState(false);

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

  const disputeMessages = useQuery(
    api.disputes.queries.listDisputeMessages,
    dispute && user?._id
      ? { disputeId: dispute._id, userId: user._id }
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

  const assignModeratorMutation = useMutation(api.disputes.mutations.assignModerator);
  const moderatorsForAssign = useQuery(
    api.users.queries.getAllUsersAdmin,
    user?.role === "admin" && user?._id && dispute
      ? { role: "moderator", status: "active", userId: user._id }
      : "skip"
  );
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignModeratorPick, setAssignModeratorPick] = useState<string>("");

  // Must be declared before any early returns — Rules of Hooks
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [disputeMessages]);

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
    "negotiation",
    "platform_intervention_requested",
    "awaiting_party_evidence",
    "under_review",
    "judgment_issued",
    "objection_window",
    "appeal_review",
    "enforcing_resolution",
    "escalated",
  ]);
  const isActiveDispute = activeDisputeStatuses.has(dispute.status);
  const canCancel = dispute.initiatorId === user._id && isActiveDispute;
  const policy = getDisputeReasonPolicy(dispute.type);
  const stageProgress = disputeStageIndex(dispute.stage ?? dispute.status);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      open: "destructive",
      negotiation: "secondary",
      platform_intervention_requested: "secondary",
      awaiting_party_evidence: "secondary",
      under_review: "secondary",
      judgment_issued: "secondary",
      objection_window: "destructive",
      appeal_review: "secondary",
      enforcing_resolution: "secondary",
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
    (dispute.status === "open" || dispute.status === "negotiation" || dispute.status === "awaiting_party_evidence") &&
    !dispute.assignedModeratorId;
  const canAdminPickModerator = user.role === "admin" && canClaimOrAssignDispute;
  const canModeratorSelfAssign = user.role === "moderator" && canClaimOrAssignDispute;
  const canResolve =
    isModerator &&
    isActiveDispute;
  const canRequestIntervention =
    (user.role === "client" || user.role === "freelancer") &&
    (dispute.status === "negotiation" || dispute.status === "open");
  const canObject =
    (user.role === "client" || user.role === "freelancer") &&
    dispute.status === "objection_window";
  const canEnforceJudgment = isModerator && dispute.status === "objection_window";

  const canPostInDisputeChat =
    (user.role === "client" || user.role === "freelancer" || isModerator) &&
    isActiveDispute;

  const handleSendDisputeChat = async () => {
    if (!user?._id || (!disputeChatText.trim() && pendingFiles.length === 0)) return;
    setSendingChat(true);
    try {
      await sendDisputeChatMessage({
        disputeId: dispute._id,
        body: disputeChatText.trim(),
        userId: user._id,
        attachments: pendingFiles.length > 0 ? pendingFiles : undefined,
      });
      setDisputeChatText("");
      setPendingFiles([]);
    } catch (e) {
      toast.error(getUserFriendlyError(e) || "Could not send message");
    } finally {
      setSendingChat(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendDisputeChat();
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

  const handleRequestIntervention = async () => {
    if (!user?._id || !interventionReason.trim()) return;
    setIsRequestingIntervention(true);
    try {
      await requestPlatformIntervention({
        disputeId: dispute._id,
        reason: interventionReason.trim(),
        userId: user._id,
      });
      toast.success("Platform intervention requested.");
      setInterventionDialogOpen(false);
      setInterventionReason("");
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Could not request intervention.");
    } finally {
      setIsRequestingIntervention(false);
    }
  };

  const handleRaiseObjection = async () => {
    if (!user?._id || !objectionReason.trim()) return;
    setIsObjecting(true);
    try {
      await raiseDisputeObjection({
        disputeId: dispute._id,
        reason: objectionReason.trim(),
        userId: user._id,
      });
      toast.success("Objection submitted for review.");
      setObjectionDialogOpen(false);
      setObjectionReason("");
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Could not submit objection.");
    } finally {
      setIsObjecting(false);
    }
  };

  const handleEnforceJudgment = async () => {
    if (!user?._id) return;
    try {
      await enforceDisputeJudgment({
        disputeId: dispute._id,
        notes: "Judgment enforced by staff.",
        userId: user._id,
      });
      toast.success("Judgment enforced.");
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Could not enforce judgment.");
    }
  };

  const handleReviewEvidence = async (
    evidenceId: Id<"disputeEvidence">,
    status: "accepted" | "rejected"
  ) => {
    if (!user?._id) return;
    try {
      await reviewDisputeEvidence({
        evidenceId,
        status,
        reviewNotes: status === "accepted" ? "Accepted for review." : "Rejected as not relevant.",
        userId: user._id,
      });
      toast.success(`Evidence ${status}.`);
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Could not review evidence.");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !user?._id) return;
    setIsUploading(true);
    try {
      const uploaded: typeof pendingFiles = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 20MB limit`);
          continue;
        }
        const uploadUrl = await generateUploadUrl({ userId: user._id });
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!res.ok) throw new Error("Upload failed");
        const { storageId } = await res.json();
        uploaded.push({ fileId: storageId, fileName: file.name, fileSize: file.size, mimeType: file.type });
      }
      setPendingFiles((prev) => [...prev, ...uploaded]);
    } catch {
      toast.error("File upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
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
                  Current stage, deadlines, evidence expectations, and the professional review trail.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
                <div className="grid gap-2 sm:grid-cols-5">
                  {DISPUTE_STAGE_ORDER.slice(0, 9).map((stage, index) => (
                    <div
                      key={stage}
                      className={`rounded-xl border px-3 py-2 text-xs ${
                        index <= stageProgress
                          ? "border-primary/30 bg-primary/6 text-foreground"
                          : "border-border/50 bg-muted/10 text-muted-foreground"
                      }`}
                    >
                      <p className="font-medium">{disputeStatusLabel(stage)}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <DetailField label="Track">
                    <span className="capitalize">{dispute.track ?? (policy.fastTrackEligible ? "fast track" : "normal")}</span>
                  </DetailField>
                  <DetailField label="Current deadline">
                    {dispute.stageDeadlineAt ? new Date(dispute.stageDeadlineAt).toLocaleString() : "No active deadline"}
                  </DetailField>
                  <DetailField label="Policy">
                    {dispute.policyReasonLabel ?? policy.label}
                  </DetailField>
                </div>

                {(dispute.requiredEvidenceChecklist?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Evidence checklist</p>
                    <div className="grid gap-2">
                      {dispute.requiredEvidenceChecklist!.map((item) => (
                        <div key={item.id} className="rounded-lg border border-border/50 bg-muted/10 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium">{item.label}</p>
                            <Badge variant={item.satisfiedAt ? "default" : "outline"}>
                              {item.satisfiedAt ? "Submitted" : item.owner === "both" ? "Both parties" : item.owner}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

          {/* Dispute discussion chat */}
          <Card className="flex min-h-[min(28rem,70dvh)] flex-col overflow-hidden rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="shrink-0 space-y-1 border-b border-border/50 bg-muted/15 px-4 py-4 sm:px-6 sm:py-5">
              <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight sm:text-lg">
                <MessageSquare className="h-5 w-5 shrink-0 text-primary" />
                Dispute chat
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Exchange messages and share documents with the other party. 49GIG staff review the full thread.
              </CardDescription>
            </CardHeader>

            {/* Messages */}
            <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:p-4 max-h-[min(24rem,45dvh)] sm:max-h-[min(26rem,50dvh)]">
              {disputeMessages === undefined ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Loading messages…</p>
              ) : disputeMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No messages yet. Start the discussion.</p>
                </div>
              ) : (
                <>
                  {disputeMessages.map((m: {
                    _id: string;
                    authorId: Id<"users">;
                    authorName?: string;
                    authorRole: string;
                    body: string;
                    createdAt: number;
                    attachments?: Array<{ fileId: Id<"_storage">; fileName: string; fileSize: number; mimeType: string; url?: string }>;
                  }) => {
                    const isMine = m.authorId === user._id;
                    const isSystem = m.authorRole === "system";
                    const isStaffMsg = m.authorRole === "admin" || m.authorRole === "moderator";
                    return (
                      <div
                        key={m._id}
                        className={`flex ${isMine ? "justify-end" : isSystem ? "justify-center" : "justify-start"}`}
                      >
                        {isSystem ? (
                          <div className="max-w-[80%] rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-center text-xs text-foreground">
                            {m.body}
                          </div>
                        ) : (
                          <div className={`max-w-[75%] space-y-1 ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                            <div className={`text-[11px] font-medium px-1 ${isMine ? "text-right text-primary" : "text-muted-foreground"}`}>
                              {m.authorName ?? m.authorRole}{isStaffMsg ? " (Staff)" : ""} · {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                                isMine
                                  ? "bg-primary text-primary-foreground rounded-br-sm"
                                  : isStaffMsg
                                    ? "bg-violet-500/10 border border-violet-400/30 text-foreground rounded-bl-sm"
                                    : "bg-card border border-border/60 text-foreground rounded-bl-sm"
                              }`}
                            >
                              {m.body && m.body !== "📎 Attachment" && (
                                <p className="whitespace-pre-wrap">{m.body}</p>
                              )}
                              {m.attachments && m.attachments.length > 0 && (
                                <div className={`space-y-2 ${m.body && m.body !== "📎 Attachment" ? "mt-2 pt-2 border-t border-current/20" : ""}`}>
                                  {m.attachments.map((att, i) => {
                                    const isImage = att.mimeType.startsWith("image/");
                                    return (
                                      <div key={i} className="flex items-center gap-2">
                                        {isImage ? <ImageIcon className="h-4 w-4 shrink-0 opacity-80" /> : <FileText className="h-4 w-4 shrink-0 opacity-80" />}
                                        <span className="text-xs truncate flex-1 opacity-90">{att.fileName}</span>
                                        {att.url && (
                                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="shrink-0 opacity-80 hover:opacity-100">
                                            <Download className="h-3.5 w-3.5" />
                                          </a>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </CardContent>

            {/* Composer */}
            {canPostInDisputeChat && (
              <div className="shrink-0 space-y-2 border-t border-border/50 bg-muted/10 p-3 sm:p-4">
                {/* Pending files preview */}
                {pendingFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-0.5">
                    {pendingFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-2 py-1 text-xs">
                        <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="max-w-[min(12rem,55vw)] truncate">{f.fileName}</span>
                        <button type="button" className="ml-1 text-muted-foreground hover:text-destructive" onClick={() => setPendingFiles((p) => p.filter((_, j) => j !== i))}>
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.zip,.ppt,.pptx"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <div className="flex min-w-0 flex-1 items-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || sendingChat}
                      title="Attach file or document"
                    >
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                    </Button>
                    <Textarea
                      placeholder="Type a message… (Shift+Enter for new line)"
                      value={disputeChatText}
                      onChange={(e) => setDisputeChatText(e.target.value)}
                      onKeyDown={handleChatKeyDown}
                      rows={2}
                      disabled={sendingChat}
                      className="min-h-11 max-h-32 flex-1 resize-none rounded-2xl border-border/80 bg-background px-4 py-2.5 text-sm leading-relaxed sm:min-h-10 sm:py-2.5"
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    className="h-10 w-10 shrink-0 self-end rounded-full sm:self-auto"
                    onClick={handleSendDisputeChat}
                    disabled={sendingChat || isUploading || (!disputeChatText.trim() && pendingFiles.length === 0)}
                    aria-label="Send"
                  >
                    {sendingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground px-0.5 sm:px-1">
                  Images, PDFs, documents up to 20MB. Enter to send · Shift+Enter for new line.
                </p>
              </div>
            )}
          </Card>

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
              {Array.isArray(dispute.structuredEvidence) && dispute.structuredEvidence.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Structured evidence review</p>
                  {dispute.structuredEvidence.map((evidence: {
                    _id: Id<"disputeEvidence">;
                    title: string;
                    description?: string;
                    evidenceType: string;
                    status: "submitted" | "accepted" | "rejected";
                    fileUrl?: string | null;
                    url?: string;
                  }) => (
                    <div key={evidence._id} className="rounded-xl border border-border/50 bg-muted/10 p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold">{evidence.title}</p>
                            <Badge variant={evidence.status === "accepted" ? "default" : evidence.status === "rejected" ? "destructive" : "outline"}>
                              {evidence.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground capitalize">
                            {evidence.evidenceType.replace(/_/g, " ")}
                          </p>
                          {evidence.description && (
                            <p className="mt-2 text-sm text-muted-foreground">{evidence.description}</p>
                          )}
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
                        {isModerator && evidence.status === "submitted" && (
                          <div className="flex shrink-0 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleReviewEvidence(evidence._id, "accepted")}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleReviewEvidence(evidence._id, "rejected")}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {dispute.evidence.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/10 py-10 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No evidence submitted yet.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {dispute.evidence.map((evidence: DisputeEvidenceItem, idx: number) => (
                    <li
                      key={idx}
                      className="flex gap-3 rounded-xl border border-border/50 bg-muted/10 p-3 transition-colors hover:bg-muted/20 sm:p-4"
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background">
                        {evidence.type === "message" && <MessageSquare className="h-4 w-4 text-primary" />}
                        {evidence.type === "file" && <FileText className="h-4 w-4 text-primary" />}
                        {evidence.type === "milestone_deliverable" && <DollarSign className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold capitalize tracking-tight">
                          {evidence.type.replace(/_/g, " ")}
                        </p>
                        {evidence.description && (
                          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{evidence.description}</p>
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
              )}
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
                      The hire returned to matching so the client can choose a replacement. Escrow was not
                      refunded; prior freelancers were removed from the hire.
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

          {(canRequestIntervention || canObject) && (
            <Card className="overflow-hidden rounded-2xl border-primary/25 shadow-sm">
              <CardHeader className="border-b border-border/50 bg-primary/4 px-4 py-4 sm:px-6 sm:py-5">
                <CardTitle className="text-base font-semibold sm:text-lg">Party actions</CardTitle>
                <CardDescription>Use these only when the current stage requires escalation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 px-4 py-4 sm:px-6 sm:py-5">
                {canRequestIntervention && (
                  <Button className="w-full" onClick={() => setInterventionDialogOpen(true)}>
                    Request 49GIG intervention
                  </Button>
                )}
                {canObject && (
                  <Button variant="outline" className="w-full" onClick={() => setObjectionDialogOpen(true)}>
                    Object to judgment
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions (Moderator/Admin) */}
          {canResolve && (
            <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/15 px-4 py-4 sm:px-6 sm:py-5">
                <CardTitle className="text-base font-semibold sm:text-lg">Moderator actions</CardTitle>
                <CardDescription>Review evidence, issue judgment, or enforce after objection window</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 px-4 py-4 sm:px-6 sm:py-5">
                <Button className="w-full" asChild>
                  <Link href={`/dashboard/disputes/${disputeId}/resolve`}>
                    Issue judgment
                  </Link>
                </Button>
                {canEnforceJudgment && (
                  <Button variant="secondary" className="w-full" onClick={handleEnforceJudgment}>
                    Enforce judgment now
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
        open={interventionDialogOpen}
        onOpenChange={(open) => {
          setInterventionDialogOpen(open);
          if (!open) setInterventionReason("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request 49GIG intervention</DialogTitle>
            <DialogDescription>
              Move this case from direct negotiation into a formal evidence window for platform review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="intervention-reason">Why should the platform intervene?</Label>
            <Textarea
              id="intervention-reason"
              value={interventionReason}
              onChange={(e) => setInterventionReason(e.target.value)}
              rows={4}
              placeholder="Explain what you tried to resolve directly and what still needs review."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInterventionDialogOpen(false)}>
              Not now
            </Button>
            <Button
              onClick={() => void handleRequestIntervention()}
              disabled={isRequestingIntervention || !interventionReason.trim()}
            >
              {isRequestingIntervention ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Request intervention
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={objectionDialogOpen}
        onOpenChange={(open) => {
          setObjectionDialogOpen(open);
          if (!open) setObjectionReason("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Object to judgment</DialogTitle>
            <DialogDescription>
              Submit a focused objection if the judgment missed material evidence or contains a clear error.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="objection-reason">Objection reason</Label>
            <Textarea
              id="objection-reason"
              value={objectionReason}
              onChange={(e) => setObjectionReason(e.target.value)}
              rows={4}
              placeholder="State the specific error and refer to the evidence already in the case."
            />
            <p className="text-xs text-muted-foreground">
              Objections are reviewed by staff before a final settlement is enforced.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setObjectionDialogOpen(false)}>
              Not now
            </Button>
            <Button
              onClick={() => void handleRaiseObjection()}
              disabled={isObjecting || !objectionReason.trim()}
            >
              {isObjecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit objection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

