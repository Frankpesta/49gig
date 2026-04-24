"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  DollarSign,
  Clock,
  User,
  UserSearch,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FolderKanban,
  Calendar,
  Edit,
  MessageCircle,
  Star,
  FileSignature,
  LucideIcon,
  Loader2,
  Trash2,
  Ban,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";
import { useAnalytics } from "@/hooks/use-analytics";
import { DEFAULT_PLATFORM_FEE_PERCENT } from "@/lib/platform-fee";
import { getDurationMonths } from "@/lib/project-duration";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectContractView } from "@/components/contracts/project-contract-view";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  getRoleIdForSkill,
  getRoleLabel,
  getRoleLabelFromCategoryLabel,
  humanizeTeamRoleKey,
  isCategoryLabel,
  isLegacyCategoryLabel,
} from "@/lib/platform-skills";
import { getRoleLabelsForProjectIntake } from "@/lib/team-slots";
import { freelancerEngagementNetTotalUsd } from "@/lib/project-freelancer-earnings";
import { FreelancerReplacementBanner } from "@/components/dashboard/freelancer-replacement-banner";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: LucideIcon }
> = {
  draft: { label: "Draft", variant: "outline", icon: FolderKanban },
  pending_funding: {
    label: "Pending Funding",
    variant: "secondary",
    icon: Clock,
  },
  funded: { label: "Funded", variant: "default", icon: CheckCircle2 },
  matching: { label: "Matching", variant: "secondary", icon: Clock },
  awaiting_freelancer: {
    label: "Awaiting freelancer",
    variant: "secondary",
    icon: Clock,
  },
  matched: { label: "Matched", variant: "default", icon: CheckCircle2 },
  in_progress: { label: "In Progress", variant: "default", icon: Clock },
  completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
  disputed: { label: "Disputed", variant: "destructive", icon: AlertCircle },
};

/** Format exact duration from start/end timestamps */
function formatExactDuration(startMs: number, endMs: number): string {
  const diffMs = endMs - startMs;
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays >= 365) {
    const years = Math.floor(diffDays / 365);
    return years === 1 ? "1 year" : `${years} years`;
  }
  if (diffDays >= 30) {
    const months = Math.round(diffDays / 30);
    return months === 1 ? "1 month" : `${months} months`;
  }
  return diffDays === 1 ? "1 day" : `${diffDays} days`;
}

/** Filter to only actual skills (exclude category labels) */
function getActualSkills(requiredSkills: string[]): string[] {
  return requiredSkills.filter(
    (s) => !isCategoryLabel(s) && !isLegacyCategoryLabel(s)
  );
}

/** Row shape from `getTeamHireEscrowBudgetBreakdown` (client project sidebar). */
type TeamEscrowBudgetRow = {
  freelancerId: Id<"users">;
  name: string;
  teamRole: string | undefined;
  netInEscrow: number;
  grossToClient: number;
};

// Helper function to validate Convex ID format
function isValidConvexId(id: string | string[] | undefined): id is Id<"projects"> {
  if (typeof id !== "string") return false;
  if (id.length === 0 || id.length > 100) return false;
  // Convex IDs are base62 encoded strings, starting with a letter
  // and containing alphanumeric characters
  return /^[a-zA-Z][a-zA-Z0-9]*$/.test(id);
}

/** Updates every minute so approval UI matches server rule: approve only after monthEndDate. */
function useBillingPeriodClockMs() {
  const [clockMs, setClockMs] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setClockMs(Date.now());
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return clockMs;
}

function isBillingPeriodMature(monthEndDate: number, clockMs: number) {
  return monthEndDate <= clockMs;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cycleDeepLinkId = searchParams.get("cycle");
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const projectIdParam = params.projectId;
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAdminDeleteDialog, setShowAdminDeleteDialog] = useState(false);
  const [isAdminDeleting, setIsAdminDeleting] = useState(false);
  const [showAdminCancelDialog, setShowAdminCancelDialog] = useState(false);
  const [isAdminCancelling, setIsAdminCancelling] = useState(false);

  // Validate the projectId from URL params
  const isValidId = isValidConvexId(projectIdParam);
  const projectId = isValidId ? (projectIdParam as Id<"projects">) : null;

  const projectChat = useQuery(
    api.chat.queries.getProjectChat,
    user?._id && projectId ? { projectId, userId: user._id } : "skip"
  );

  const createProjectChat = useMutation(api.chat.mutations.createProjectChat);
  const approveMonthlyCycle = useMutation(
    api.monthlyBillingCycles.mutations.approveMonthlyCycle
  );
  const [approvingCycleId, setApprovingCycleId] = useState<Id<"monthlyBillingCycles"> | null>(null);
  const billingPeriodClockMs = useBillingPeriodClockMs();

  const project = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api as any)["projects/queries"].getProject,
    user?._id && projectId ? { projectId, userId: user._id } : "skip"
  );

  const teamHireIsClientOrStaff =
    !!user &&
    !!project &&
    project.intakeForm.hireType === "team" &&
    (user._id === project.clientId ||
      user.role === "admin" ||
      user.role === "moderator");
  const teamEscrowBudget = useQuery(
    (api as any)["projects/queries"].getTeamHireEscrowBudgetBreakdown,
    user?._id && projectId && teamHireIsClientOrStaff
      ? { projectId: String(projectId), userId: user._id }
      : "skip"
  );

  const monthlyCycles = useQuery(
    api.monthlyBillingCycles.queries.getCyclesByProjectId,
    projectId ? { projectId } : "skip"
  );

  const moneyAudit = useQuery(
    (api as any)["projects/queries"].getProjectMoneyAuditForAdmin,
    user?.role === "admin" && user?._id && projectId
      ? { projectId, userId: user._id }
      : "skip"
  );

  useEffect(() => {
    if (!cycleDeepLinkId || !monthlyCycles?.length) return;
    const el = document.getElementById(`monthly-cycle-${cycleDeepLinkId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [cycleDeepLinkId, monthlyCycles]);

  const openDisputes = useQuery(
    (api as any)["disputes/queries"].getOpenDisputesForProject,
    projectId ? { projectId } : "skip"
  );
  const hasOpenDispute = (openDisputes?.length ?? 0) > 0;

  const existingReview = useQuery(
    (api as any)["reviews/queries"].getReviewByProject,
    projectId && user?._id ? { projectId, userId: user._id } : "skip"
  );
  const submitFreelancerRating = useMutation(
    (api as any)["reviews/mutations"].submitFreelancerRating
  );
  const updateProjectStatus = useMutation(
    (api as any)["projects/mutations"].updateProjectStatus
  );
  const deleteDraftProject = useMutation(
    (api as any)["projects/mutations"].deleteDraftProject
  );
  const adminDeleteProjectMutation = useMutation(
    (api as any)["projects/mutations"].adminDeleteProject
  );
  const pendingFreelancerMatches = useQuery(
    (api as any).matching.queries.getPendingFreelancerMatches,
    user?.role === "freelancer" && user?._id ? { userId: user._id } : "skip"
  );
  const respondToMatchAsFreelancer = useMutation(
    (api as any).matching.mutations.respondToMatchAsFreelancer
  );

  const [declineMatchId, setDeclineMatchId] = useState<Id<"matches"> | null>(null);
  const [declineMatchReason, setDeclineMatchReason] = useState("");
  const [respondingMatchId, setRespondingMatchId] = useState<Id<"matches"> | null>(null);

  // Prefill rating form when existing review loads
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setRatingComment(existingReview.comment ?? "");
    }
  }, [existingReview?._id, existingReview?.rating, existingReview?.comment]);

  if (!user) {
    return null;
  }

  // Handle invalid project ID
  if (!isValidId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">Invalid Project ID</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              The project ID in the URL is not valid. Please check the URL and try again.
            </p>
            <Button asChild>
              <Link href="/dashboard/projects">Back to hires</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (project === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">Hire not found</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              The hire you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button asChild>
              <Link href="/dashboard/projects">Back to hires</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayStatus =
    user.role === "freelancer" &&
    (project as { freelancerHireDisplayStatus?: string }).freelancerHireDisplayStatus
      ? (project as { freelancerHireDisplayStatus: string }).freelancerHireDisplayStatus
      : project.status;
  const statusConfig = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;
  const openDisputeOnHire = (project as { openDisputeOnHire?: boolean }).openDisputeOnHire ?? false;
  const viewerIsDisputePartyOnHire =
    (project as { viewerIsDisputePartyOnHire?: boolean }).viewerIsDisputePartyOnHire ?? false;
  const isAdmin = user.role === "admin";
  const isStaff = user.role === "admin" || user.role === "moderator";
  const isClient = user.role === "client" && project.clientId === user._id;
  const pendingMatchesCount =
    (project as { pendingMatchesCount?: number }).pendingMatchesCount ?? 0;
  const showClientViewMatches =
    isClient &&
    pendingMatchesCount > 0 &&
    project.clientNotifiedOfAvailableMatchesAt != null;
  const matchingInProgressForClient =
    isClient &&
    (project.awaitingMatch === true ||
      (project.pendingTeamMemberSlots != null && project.pendingTeamMemberSlots > 0) ||
      (project.rolesAwaitingMatch != null && project.rolesAwaitingMatch.length > 0));
  const isFreelancerReplacementMatching =
    isClient &&
    project.status === "matching" &&
    project.replacementMatchingAt != null;
  const isMatchedFreelancer =
    project.matchedFreelancerId === user._id ||
    (project.matchedFreelancerIds && project.matchedFreelancerIds.includes(user._id));
  const hasMatchedFreelancers =
    !!project.matchedFreelancerId || (project.matchedFreelancerIds?.length ?? 0) > 0;
  const canChat =
    hasMatchedFreelancers && (project.clientId === user._id || isMatchedFreelancer);
  const canStaffOpenProjectChat = isStaff && hasMatchedFreelancers;
  const showProjectChat = canChat || canStaffOpenProjectChat;

  const hasSelected =
    project.selectedFreelancerId ||
    (project.selectedFreelancerIds && project.selectedFreelancerIds.length > 0);
  const needContractSign =
    (project.status === "matched" || project.status === "in_progress") &&
    (isClient
      ? !project.clientContractSignedAt
      : isMatchedFreelancer &&
        !project.freelancerContractSignatures?.some((s: { freelancerId: Id<"users"> }) => s.freelancerId === user._id));
  const needContractSignPrePayment =
    isClient &&
    hasSelected &&
    !project.clientContractSignedAt &&
    (project.status === "draft" || project.status === "pending_funding");

  const terminalOrDispute = ["completed", "cancelled", "disputed"].includes(displayStatus);
  const confirmedTeamMembers =
    (
      project as {
        confirmedTeamMembers?: Array<{
          _id: Id<"users">;
          name: string;
          teamRole?: string;
        }>;
      }
    ).confirmedTeamMembers ?? [];
  const isTeamHire = project.intakeForm.hireType === "team";
  const viewerMatchTeamRole = (
    project as { viewerMatchTeamRole?: string }
  ).viewerMatchTeamRole;
  const freelancerNetEngagementTotalUsd =
    user.role === "freelancer" && !isStaff
      ? freelancerEngagementNetTotalUsd(
          {
            totalAmount: project.totalAmount,
            platformFee: project.platformFee,
            teamBudgetBreakdown: project.teamBudgetBreakdown,
            intakeForm: project.intakeForm,
            matchedFreelancerIds: project.matchedFreelancerIds as
              | string[]
              | undefined,
            matchedFreelancerId: project.matchedFreelancerId as
              | string
              | undefined,
          },
          viewerMatchTeamRole
        )
      : null;
  const teamSeatTotal =
    project.intakeForm.teamMemberCount ??
    project.intakeForm.teamSlots?.filter((s: { roleId: string }) => s.roleId)?.length ??
    (confirmedTeamMembers.length > 0
      ? confirmedTeamMembers.length + (project.pendingTeamMemberSlots ?? 0)
      : undefined);
  const postFundingSelection = !["draft", "pending_funding"].includes(project.status);
  const showClientMatchesHeaderButton =
    showClientViewMatches ||
    isFreelancerReplacementMatching ||
    (isClient && project.status === "matching" && postFundingSelection);
  const clientWaitingFreelancerMatchAcceptance =
    isClient &&
    !isFreelancerReplacementMatching &&
    !terminalOrDispute &&
    hasSelected &&
    !hasMatchedFreelancers &&
    postFundingSelection &&
    (project.status === "awaiting_freelancer" ||
      project.status === "matching" ||
      project.status === "funded");

  const matchedFreelancerIdsForPendingSigs = project.matchedFreelancerId
    ? [project.matchedFreelancerId]
    : project.matchedFreelancerIds ?? [];
  const hasPendingFreelancerContractSignature =
    matchedFreelancerIdsForPendingSigs.length > 0 &&
    matchedFreelancerIdsForPendingSigs.some(
      (fid: Id<"users">) =>
        !project.freelancerContractSignatures?.some(
          (s: { freelancerId: Id<"users"> }) => s.freelancerId === fid
        )
    );
  const clientWaitingFreelancerContractSignature =
    isClient &&
    !terminalOrDispute &&
    (project.status === "matched" || project.status === "in_progress") &&
    !!project.clientContractSignedAt &&
    hasPendingFreelancerContractSignature;

  const clientContractSignShowsFreelancerNextStep =
    isClient &&
    (project.status === "matched" || project.status === "in_progress") &&
    hasPendingFreelancerContractSignature &&
    !project.clientContractSignedAt;

  if (needContractSign && projectId && user._id && !isStaff) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link href="/dashboard/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-heading font-bold sm:text-2xl">Sign the contract</h1>
            <p className="text-sm text-muted-foreground">
              Read and sign the project agreement to continue. Your signature will be added and a copy sent to your email.
            </p>
          </div>
        </div>
        {clientContractSignShowsFreelancerNextStep && (
          <Alert className="border-sky-500/40 bg-sky-500/8 dark:bg-sky-950/25">
            <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <AlertTitle className="text-sky-900 dark:text-sky-100">
              Then your freelancer signs
            </AlertTitle>
            <AlertDescription className="text-sky-900/85 dark:text-sky-100/90">
              After you sign below, your selected freelancer will be asked to sign the same agreement. Work can move forward once both signatures are in place.
            </AlertDescription>
          </Alert>
        )}
        <ProjectContractView projectId={projectId} userId={user._id} />
      </div>
    );
  }

  const handleOpenChat = async () => {
    if (!projectId || !user?._id) return;
    setIsOpeningChat(true);
    try {
      const chatId = await createProjectChat({ projectId, userId: user._id });
      router.push(`/dashboard/chat/${chatId}`);
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Could not open chat");
    } finally {
      setIsOpeningChat(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!projectId || !user?._id || rating < 1 || rating > 5) return;
    setIsSubmittingRating(true);
    try {
      await submitFreelancerRating({
        projectId,
        rating,
        comment: ratingComment.trim() || undefined,
        userId: user._id,
      });
      toast.success(existingReview ? "Rating updated" : "Rating submitted");
      router.refresh();
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Failed to submit rating");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleCompleteProject = async () => {
    if (!projectId || !user?._id) return;
    setShowCompleteDialog(false);
    setIsCompleting(true);
    try {
      await updateProjectStatus({
        projectId,
        status: "completed",
        userId: user._id,
      });
      trackEvent("complete_project", { project_id: projectId });
      toast.success("Project marked as completed");
      router.refresh();
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Failed to complete project");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!projectId || !user?._id) return;
    setShowDeleteDialog(false);
    setIsDeleting(true);
    try {
      await deleteDraftProject({ projectId, userId: user._id });
      toast.success("Hire deleted");
      router.push("/dashboard/projects");
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Failed to delete hire");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAdminDeleteProject = async () => {
    if (!projectId || !user?._id || user.role !== "admin") return;
    setShowAdminDeleteDialog(false);
    setIsAdminDeleting(true);
    try {
      await adminDeleteProjectMutation({ projectId, userId: user._id });
      toast.success("Hire permanently removed");
      router.push("/dashboard/projects");
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Could not delete hire");
    } finally {
      setIsAdminDeleting(false);
    }
  };

  const handleAdminCancelProject = async () => {
    if (!projectId || !user?._id || user.role !== "admin") return;
    setShowAdminCancelDialog(false);
    setIsAdminCancelling(true);
    try {
      await updateProjectStatus({
        projectId,
        status: "cancelled",
        userId: user._id,
      });
      toast.success(
        "Hire cancelled. Pending dispute refunds and remaining escrow were credited to the client wallet where applicable; open billing cycles were cancelled."
      );
      router.refresh();
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Could not cancel hire");
    } finally {
      setIsAdminCancelling(false);
    }
  };

  const pendingMatchForThisProject =
    user.role === "freelancer" && projectId && Array.isArray(pendingFreelancerMatches)
      ? pendingFreelancerMatches.find(
          (m: { projectId: Id<"projects"> }) => m.projectId === projectId
        )
      : undefined;

  const handleAcceptPendingMatch = async (matchId: Id<"matches">) => {
    if (!user?._id || !projectId) return;
    setRespondingMatchId(matchId);
    try {
      const result = await respondToMatchAsFreelancer({
        matchId,
        response: "accepted",
        userId: user._id,
      });
      if (result?.contractFlowStarted && result.projectId) {
        toast.success("You've accepted. Opening the contract to sign.");
        router.push(`/dashboard/projects/${result.projectId}/contract`);
      } else {
        toast.success(
          "You've accepted. We'll notify you when the full team is ready to sign."
        );
      }
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Failed to accept");
    } finally {
      setRespondingMatchId(null);
    }
  };

  const handleDeclinePendingMatch = async () => {
    if (!user?._id || !declineMatchId) return;
    setRespondingMatchId(declineMatchId);
    try {
      await respondToMatchAsFreelancer({
        matchId: declineMatchId,
        response: "rejected",
        rejectionReason: declineMatchReason.trim() || undefined,
        userId: user._id,
      });
      toast.success("You've declined this opportunity.");
      setDeclineMatchId(null);
      setDeclineMatchReason("");
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Failed to decline");
    } finally {
      setRespondingMatchId(null);
    }
  };

  return (
    <div className="space-y-6">
      {isFreelancerReplacementMatching && projectId && (
        <FreelancerReplacementBanner
          projectId={projectId}
          compact
          className="animate-in fade-in slide-in-from-top-2 duration-500"
        />
      )}

      {pendingMatchForThisProject && (
        <Alert className="animate-in fade-in slide-in-from-top-2 duration-500 border-primary/35 bg-primary/5">
          <User className="h-4 w-4 text-primary" />
          <AlertTitle className="text-foreground">You&apos;ve been selected for this hire</AlertTitle>
          <AlertDescription className="text-muted-foreground space-y-4">
            <p>
              The client chose you for this project. Accept to move forward with contract preparation, or decline if
              you can&apos;t take it on.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                className="gap-1.5"
                onClick={() => handleAcceptPendingMatch(pendingMatchForThisProject._id)}
                disabled={respondingMatchId === pendingMatchForThisProject._id}
              >
                {respondingMatchId === pendingMatchForThisProject._id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Accept
              </Button>
              <Button
                variant="outline"
                className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5"
                onClick={() => setDeclineMatchId(pendingMatchForThisProject._id)}
                disabled={respondingMatchId === pendingMatchForThisProject._id}
              >
                <XCircle className="h-4 w-4" />
                Decline
              </Button>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                <Link href={`/dashboard/match-requests?matchId=${pendingMatchForThisProject._id}`}>
                  Open match requests
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Dialog
        open={!!declineMatchId}
        onOpenChange={(open) => {
          if (!open) {
            setDeclineMatchId(null);
            setDeclineMatchReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Decline this opportunity?</DialogTitle>
            <DialogDescription>
              The client will be notified and can select another freelancer. You can optionally provide a reason.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Optional: brief reason for declining..."
            value={declineMatchReason}
            onChange={(e) => setDeclineMatchReason(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeclineMatchId(null);
                setDeclineMatchReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeclinePendingMatch}
              disabled={!!respondingMatchId}
            >
              {respondingMatchId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Yes, decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {clientWaitingFreelancerMatchAcceptance && (
        <Alert className="animate-in fade-in slide-in-from-top-2 duration-500 border-amber-500/45 bg-amber-500/10 dark:bg-amber-950/30">
          <Clock className="h-4 w-4 text-amber-700 dark:text-amber-400" />
          <AlertTitle className="text-amber-950 dark:text-amber-100">
            Waiting for freelancer approval
          </AlertTitle>
          <AlertDescription className="text-amber-950/90 dark:text-amber-50/90">
            <p>
              Your selected talent has been notified and must accept this hire before the contract can be prepared and
              signed. You don’t need to do anything else until they confirm.
            </p>
            {matchingInProgressForClient &&
              (project.pendingTeamMemberSlots ?? 0) > 0 &&
              project.status === "matching" && (
                <p className="mt-2">
                  If you&apos;re building a team, you can add remaining roles from{" "}
                  <Link
                    href={`/dashboard/projects/${projectId}/matches`}
                    className="font-medium text-amber-950 underline underline-offset-2 hover:no-underline dark:text-amber-100"
                  >
                    Matches
                  </Link>{" "}
                  once current selections are confirmed.
                </p>
              )}
          </AlertDescription>
        </Alert>
      )}

      {isTeamHire &&
        user.role === "freelancer" &&
        isMatchedFreelancer &&
        !terminalOrDispute &&
        project.status !== "matched" &&
        project.status !== "in_progress" && (
          <Alert className="animate-in fade-in slide-in-from-top-2 duration-500 border-emerald-500/40 bg-emerald-500/8 dark:bg-emerald-950/25">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <AlertTitle className="text-emerald-900 dark:text-emerald-100">
              You&apos;re on the team
            </AlertTitle>
            <AlertDescription className="text-emerald-900/85 dark:text-emerald-100/90">
              You&apos;ve accepted this hire. We&apos;re still waiting for other team members to confirm before this
              project moves to matched status and contracts go out.
            </AlertDescription>
          </Alert>
        )}

      {clientWaitingFreelancerContractSignature && (
        <Alert className="animate-in fade-in slide-in-from-top-2 duration-500 border-sky-500/40 bg-sky-500/8 dark:bg-sky-950/25">
          <FileSignature className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <AlertTitle className="text-sky-900 dark:text-sky-100">
            Waiting for freelancer to sign the agreement
          </AlertTitle>
          <AlertDescription className="text-sky-900/85 dark:text-sky-100/90">
            You&apos;ve signed the contract. Your freelancer still needs to sign before the hire is fully executed and
            work can proceed under the agreement.
          </AlertDescription>
        </Alert>
      )}

      {isAdmin && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-destructive">Admin</CardTitle>
            <CardDescription>
              Cancel marks the hire cancelled (USD only). Pending dispute refund rows are completed into the
              client&apos;s wallet; remaining escrow is credited the same way; pending/disputed monthly cycles are
              cancelled. Matched freelancers get an in-app notification and email. Permanent delete is separate.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {project.status !== "cancelled" && project.status !== "completed" && (
              <>
                <Button
                  variant="outline"
                  className="min-h-11 w-full touch-manipulation border-destructive/50 sm:w-auto"
                  onClick={() => setShowAdminCancelDialog(true)}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Cancel hire (admin)
                </Button>
                <AlertDialog open={showAdminCancelDialog} onOpenChange={setShowAdminCancelDialog}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel this hire as admin?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The hire will be marked cancelled. Pending dispute refunds and remaining escrow (if any) are
                        credited to the client&apos;s wallet. Non-approved monthly cycles on this hire are cancelled.
                        The client and matched freelancers are notified.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isAdminCancelling}>Close</AlertDialogCancel>
                      <Button
                        variant="destructive"
                        onClick={handleAdminCancelProject}
                        disabled={isAdminCancelling}
                      >
                        {isAdminCancelling ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Ban className="mr-2 h-4 w-4" />
                        )}
                        {isAdminCancelling ? "Cancelling…" : "Confirm cancel"}
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            <Button
              variant="destructive"
              className="min-h-11 w-full touch-manipulation sm:w-auto"
              onClick={() => setShowAdminDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete hire (admin)
            </Button>
            <AlertDialog open={showAdminDeleteDialog} onOpenChange={setShowAdminDeleteDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this hire as admin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes the hire and related matches, chats, billing cycles, milestones, resolved
                    disputes, and reviews. Payment history rows stay for audit but are detached from this hire. You
                    cannot do this while escrow remains, while a dispute is open, or while payments or refunds are still
                    in flight.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isAdminDeleting}>Cancel</AlertDialogCancel>
                  <Button variant="destructive" onClick={handleAdminDeleteProject} disabled={isAdminDeleting}>
                    {isAdminDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    {isAdminDeleting ? "Deleting…" : "Delete permanently"}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {moneyAudit && (
              <div className="mt-4 w-full rounded-md border border-border bg-card/80 p-3 text-sm">
                <p className="font-medium text-foreground">Money audit (read-only)</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                  <li>
                    Escrow: {moneyAudit.currency.toUpperCase()}{" "}
                    {(moneyAudit.escrowedAmount as number).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </li>
                  <li>
                    Client pending dispute refunds: USD{" "}
                    {(moneyAudit.pendingRefundCents / 100).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </li>
                  <li>
                    Client completed dispute refunds (this hire): USD{" "}
                    {(moneyAudit.completedRefundCents / 100).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </li>
                  <li>Monthly cycles: {moneyAudit.cycles.length} row(s) — see list below.</li>
                </ul>
                <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-muted-foreground">
                  {moneyAudit.cycles.map(
                    (c: { _id: string; monthIndex: number; status: string; amountCents: number }) => (
                      <li key={c._id}>
                        Month {c.monthIndex}: {c.status} — {(c.amountCents / 100).toFixed(2)}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link href="/dashboard/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-heading font-bold break-words sm:text-2xl md:text-3xl">
              {project.intakeForm.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusConfig.variant}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {statusConfig.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
            {user.role === "freelancer" &&
              openDisputeOnHire &&
              !viewerIsDisputePartyOnHire && (
                <p className="mt-3 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                  A dispute is open on this hire involving other team members. You are not part of that dispute; you can keep working. Only affected parties can access the dispute thread.
                </p>
              )}
          </div>
        </div>
        {isClient && (
          <div className="flex flex-wrap gap-2 sm:shrink-0">
            {needContractSignPrePayment && (
              <Button asChild>
                <Link href={`/dashboard/projects/${project._id}/contract`}>
                  <FileSignature className="mr-2 h-4 w-4" />
                  Sign Contract
                </Link>
              </Button>
            )}
            {showClientMatchesHeaderButton && (
              <Button asChild className={isFreelancerReplacementMatching ? "shadow-md" : undefined}>
                <Link href={`/dashboard/projects/${project._id}/matches`}>
                  <UserSearch className="mr-2 h-4 w-4" />
                  {isFreelancerReplacementMatching
                    ? "Choose replacement"
                    : project.pendingTeamMemberSlots != null && project.pendingTeamMemberSlots > 0
                      ? "Review & complete team"
                      : "View matches"}
                </Link>
              </Button>
            )}
            {(project.status === "draft" || project.status === "pending_funding") && !needContractSignPrePayment && (
              <Button asChild>
                <Link href={`/dashboard/projects/${project._id}/payment`}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  {project.status === "draft" ? "Fund Project" : "Complete Payment"}
                </Link>
              </Button>
            )}
            {project.status === "in_progress" && (
              <>
                <Button
                  onClick={() => setShowCompleteDialog(true)}
                  disabled={isCompleting || hasOpenDispute}
                  variant="default"
                  title={hasOpenDispute ? "Resolve the dispute before completing" : undefined}
                >
                  {isCompleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Complete Project
                </Button>
                {hasOpenDispute && (
                  <span className="text-xs text-muted-foreground self-center">
                    Resolve the dispute first
                  </span>
                )}
                <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Complete project?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Marking this project as completed will close it and release all remaining payments to the freelancer&apos;s wallet. Make sure all work is done. You can still rate the freelancer after completion.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isCompleting}>Cancel</AlertDialogCancel>
                      <Button onClick={handleCompleteProject} disabled={isCompleting || hasOpenDispute}>
                        {isCompleting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {isCompleting ? "Completing…" : "Complete project"}
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            {project.status === "draft" && (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/projects/${project._id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this hire?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the hire and all associated data. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteDraft}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        {isDeleting ? "Deleting…" : "Delete"}
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        )}
        {isStaff && (
          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border/80 bg-muted/30 px-4 py-3 text-sm sm:max-w-md">
            <p className="font-medium text-foreground">Staff overview</p>
            <p className="text-muted-foreground">
              Funding, monthly approvals, and completing this hire are client actions. Use the links below for support and disputes.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/disputes">Disputes queue</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/users">Users</Link>
              </Button>
              {hasOpenDispute && openDisputes?.[0] && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/disputes/${openDisputes[0]._id}`}>This hire&apos;s dispute</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {matchingInProgressForClient && (
        <Card
          className={
            project.status === "draft"
              ? "rounded-xl border-amber-500/50 bg-amber-500/5 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/25"
              : "rounded-xl border-amber-500/40 bg-amber-500/5"
          }
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {project.status === "draft" ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-600" aria-hidden />
              ) : (
                <Clock className="h-4 w-4 text-amber-600" aria-hidden />
              )}
              Matching in progress
            </CardTitle>
            <CardDescription>
              {project.status === "matching" && (project.pendingTeamMemberSlots ?? 0) > 0
                ? `We’re still confirming ${project.pendingTeamMemberSlots} more team member(s). You’ll get an email when there are people to review.`
                : project.awaitingMatch
                  ? project.status === "draft"
                    ? showClientViewMatches
                      ? "You have vetted suggestions ready—use View matches above to review and continue."
                      : "We’re lining up vetted talent for your hire. You’ll get an email when there are people to review."
                    : showClientViewMatches
                      ? "You have suggestions ready to review—use View matches above to continue."
                      : "We’re finding the right freelancer(s) for this hire. You’ll get an email when suggestions are ready to review."
                  : "Some roles are still being staffed. We’ll email you when there’s an update."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {project.intakeForm.description}
              </p>
            </CardContent>
          </Card>

          {/* Deliverables (project phases / milestones) */}
          {project.intakeForm.deliverables && project.intakeForm.deliverables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Deliverables</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {project.intakeForm.deliverables.map((deliverable: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{deliverable}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Monthly Billing / Payments - visible to all (client, freelancer, admin, moderator) */}
          <Card id="monthly-billing">
              <CardHeader>
                <CardTitle>
                  {isClient ? "Monthly Billing" : isMatchedFreelancer ? "Monthly Payments" : "Monthly Billing Cycles"}
                </CardTitle>
                <CardDescription>
                  {isStaff
                    ? "Read-only: the hiring client approves each month to release escrow. Staff cannot approve or fund on their behalf."
                    : isClient
                      ? "Approve each month after that billing period ends to release funds to the freelancer's wallet. They withdraw to their bank when ready."
                      : isMatchedFreelancer
                        ? "Funds are released to your wallet when the client approves each month. Withdraw to your bank account from the Wallet page."
                        : "Payment cycles for this project. Funds go to freelancer wallets; they withdraw to their bank accounts."}
                </CardDescription>
                {isClient && (
                  <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm">
                    <div className="font-medium text-foreground mb-2">Expected hours per engagement</div>
                    <div className="text-muted-foreground">
                      {(project.intakeForm.roleType ?? "full_time") === "full_time" ? (
                        <>
                          <span className="font-medium text-foreground">Full-Time</span>
                          <ul className="mt-0.5 list-disc list-inside space-y-0.5">
                            <li>40 hours per week</li>
                            <li>~160 hours per month</li>
                          </ul>
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-foreground">Part-Time</span>
                          <ul className="mt-0.5 list-disc list-inside space-y-0.5">
                            <li>20 hours per week</li>
                            <li>~80 hours per month</li>
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {monthlyCycles && monthlyCycles.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    const approvedCount = monthlyCycles.filter((c: { status: string }) => c.status === "approved").length;
                    const totalCount = monthlyCycles.length;
                    return (
                      <p className="text-sm text-muted-foreground">
                        {approvedCount} of {totalCount} month{totalCount !== 1 ? "s" : ""} released
                        {isClient && project?.fundUpfrontMonths ? ` (${project.fundUpfrontMonths} month${project.fundUpfrontMonths > 1 ? "s" : ""} funded)` : ""}
                      </p>
                    );
                  })()}
                  {monthlyCycles.map((cycle: { _id: Id<"monthlyBillingCycles">; monthIndex: number; monthStartDate: number; monthEndDate: number; amountCents: number; currency: string; status: string }) => {
                    const monthLabel = new Date(cycle.monthStartDate).toLocaleString("default", { month: "long", year: "numeric" });
                    const isPending = cycle.status === "pending";
                    const matured = isBillingPeriodMature(cycle.monthEndDate, billingPeriodClockMs);
                    const periodEndShort = new Date(cycle.monthEndDate).toLocaleDateString("en-US", {
                      dateStyle: "medium",
                    });
                    const statusLabel = isClient
                      ? cycle.status === "pending"
                        ? matured
                          ? "Awaiting your approval"
                          : `Period in progress — approve after ${periodEndShort}`
                        : cycle.status === "approved"
                          ? "Approved"
                          : cycle.status === "disputed"
                            ? "Disputed"
                            : cycle.status === "cancelled"
                              ? "Cancelled"
                              : cycle.status
                      : cycle.status === "pending"
                        ? matured
                          ? "Awaiting client approval"
                          : "Billing period in progress"
                        : cycle.status === "approved"
                          ? "Approved, funds released"
                          : cycle.status === "disputed"
                            ? "Disputed"
                            : cycle.status === "cancelled"
                              ? "Cancelled"
                              : cycle.status;
                    const durMonths = getDurationMonths(project?.intakeForm?.projectDuration) || monthlyCycles.length || 1;
                    const displayAmount =
                      isClient && project
                        ? project.totalAmount / durMonths
                        : cycle.amountCents / 100;
                    return (
                      <div
                        key={cycle._id}
                        id={`monthly-cycle-${cycle._id}`}
                        className={`flex items-center justify-between rounded-lg border p-4 transition-shadow ${
                          cycleDeepLinkId === cycle._id
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : ""
                        }`}
                      >
                        <div>
                          <div className="font-medium">Month {cycle.monthIndex}: {monthLabel}</div>
                          <div className="text-sm text-muted-foreground">
                            ${typeof displayAmount === "number" ? displayAmount.toFixed(2) : (cycle.amountCents / 100).toFixed(2)} {cycle.currency.toUpperCase()} • {statusLabel}
                          </div>
                        </div>
                        {isClient && isPending && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              setApprovingCycleId(cycle._id);
                              try {
                                await approveMonthlyCycle({ monthlyCycleId: cycle._id });
                                toast.success("Month approved");
                              } catch (e) {
                                toast.error(getUserFriendlyError(e) || "Approval failed");
                              } finally {
                                setApprovingCycleId(null);
                              }
                            }}
                            disabled={!matured || approvingCycleId === cycle._id}
                            title={
                              matured
                                ? undefined
                                : `Approve becomes available after the billing period ends (${periodEndShort}).`
                            }
                          >
                            {approvingCycleId === cycle._id ? "Approving…" : "Approve"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
                ) : (
                <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
                  <Calendar className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    {isClient ? "No billing cycles yet" : "No payment cycles yet"}
                  </p>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                    {isClient
                      ? "Monthly billing cycles are created automatically when the project is in progress. You'll approve each month to release payment to the freelancer."
                      : "Monthly billing cycles will appear here once the project is in progress. You'll get paid each month after the client approves."}
                  </p>
                </div>
                )}
                {isClient && monthlyCycles && monthlyCycles.length > 0 && (
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href="/dashboard/monthly-approvals">View all pending approvals</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

          {/* Additional Requirements */}
          {project.intakeForm.additionalRequirements && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {project.intakeForm.additionalRequirements}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium">Roles</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(() => {
                    const roleLabels = getRoleLabelsForProjectIntake(project.intakeForm);
                    return roleLabels.length > 0 ? (
                      roleLabels.map((role) => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {project.intakeForm.category || project.intakeForm.talentCategory || "—"}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <Separator />
              <div>
                <div className="text-sm font-medium">Budget</div>
                {isTeamHire && (isClient || isStaff) ? (
                  teamEscrowBudget === undefined ? (
                    <Skeleton className="h-8 w-36 mt-1" />
                  ) : teamEscrowBudget == null ? (
                    <p className="text-xs text-muted-foreground mt-1">Budget details unavailable.</p>
                  ) : (
                    <>
                      <div className="text-lg font-semibold mt-0.5">
                        $
                        {teamEscrowBudget.totalGross.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Total gross (funded in escrow, incl. {teamEscrowBudget.platformFeePercent}%
                        platform fee)
                      </p>
                      {teamEscrowBudget.rows.length > 0 && (
                        <ul className="mt-3 space-y-3 border-t border-border pt-3">
                          {teamEscrowBudget.rows.map((row: TeamEscrowBudgetRow) => (
                            <li key={String(row.freelancerId)} className="text-xs space-y-0.5">
                              <div className="font-medium text-foreground">
                                {row.name}
                                {row.teamRole ? (
                                  <span className="text-muted-foreground font-normal">
                                    {" "}
                                    · {humanizeTeamRoleKey(row.teamRole)}
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-muted-foreground">
                                Net (to freelancer):{" "}
                                <span className="text-foreground">
                                  $
                                  {row.netInEscrow.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                              <div className="text-muted-foreground">
                                Gross (from you):{" "}
                                <span className="text-foreground">
                                  $
                                  {row.grossToClient.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )
                ) : (
                  <>
                    <div className="text-lg font-semibold mt-0.5">
                      {isClient || isStaff
                        ? `$${project.totalAmount.toLocaleString()}`
                        : freelancerNetEngagementTotalUsd != null
                          ? `$${freelancerNetEngagementTotalUsd.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : `$${((project.totalAmount * (100 - (project.platformFee ?? DEFAULT_PLATFORM_FEE_PERCENT))) / 100).toLocaleString()}`}
                    </div>
                    {(isClient || isStaff) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {isClient ? "Total amount for this hire" : "Hire total (staff view)"}
                      </div>
                    )}
                  </>
                )}
              </div>
              <Separator />
              <div>
                <div className="text-sm font-medium">Duration</div>
                <div className="text-sm text-muted-foreground">
                  {project.intakeForm.startDate && project.intakeForm.endDate
                    ? formatExactDuration(project.intakeForm.startDate, project.intakeForm.endDate)
                    : project.intakeForm.timeline || "—"}
                </div>
              </div>
              {(() => {
                const actualSkills = getActualSkills(project.intakeForm.requiredSkills ?? []);
                return actualSkills.length > 0 ? (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm font-medium mb-2">Required Skills</div>
                      <div className="flex flex-wrap gap-1">
                        {actualSkills.map((skill: string) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null;
              })()}
            </CardContent>
          </Card>

          {/* Team */}
          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.client && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4" />
                    Client
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {project.client.name}
                  </div>
                </div>
              )}
              {isTeamHire && confirmedTeamMembers.length > 0 ? (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4" />
                      {isMatchedFreelancer && !isClient && !isStaff
                        ? "You"
                        : confirmedTeamMembers.length === 1
                          ? "Freelancer"
                          : "Team"}
                    </div>
                    {(!isMatchedFreelancer || isClient || isStaff) &&
                      teamSeatTotal != null &&
                      teamSeatTotal > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {confirmedTeamMembers.length} of {teamSeatTotal} seat
                          {teamSeatTotal === 1 ? "" : "s"} confirmed
                        </p>
                      )}
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {(() => {
                        const list =
                          isMatchedFreelancer && !isClient && !isStaff
                            ? confirmedTeamMembers.filter((m) => m._id === user._id)
                            : confirmedTeamMembers;
                        if (list.length === 0 && isMatchedFreelancer && !isClient && !isStaff) {
                          return (
                            <li>
                              <span className="font-medium text-foreground">
                                {user.name ?? "You"}
                              </span>
                            </li>
                          );
                        }
                        return list.map((member) => (
                          <li key={member._id}>
                            <span className="font-medium text-foreground">{member.name}</span>
                            {member.teamRole ? (
                              <span className="text-muted-foreground">
                                {" "}
                                · {humanizeTeamRoleKey(member.teamRole)}
                              </span>
                            ) : null}
                          </li>
                        ));
                      })()}
                    </ul>
                  </div>
                </>
              ) : project.freelancer ? (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4" />
                      Freelancer
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {project.freelancer.name}
                    </div>
                  </div>
                </>
              ) : null}
              {showProjectChat && (
                <>
                  <Separator />
                  {projectChat ? (
                    <Button asChild className="w-full">
                      <Link href={`/dashboard/chat/${projectChat._id}`}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        {isStaff
                          ? "View project chat"
                          : isClient
                            ? "Chat with freelancer"
                            : "Chat with client"}
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={handleOpenChat}
                      disabled={isOpeningChat}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {isOpeningChat
                        ? "Opening..."
                        : isStaff
                          ? "Open project chat"
                          : isClient
                            ? "Chat with freelancer"
                            : "Chat with client"}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Rate freelancer (client only, when project has a matched freelancer) */}
          {isClient &&
            project.matchedFreelancerId &&
            (project.status === "matched" ||
              project.status === "in_progress" ||
              project.status === "completed") && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Rate freelancer
                  </CardTitle>
                  <CardDescription>
                    {existingReview
                      ? "You can update your rating below. It feeds into your Satisfaction metric on the dashboard."
                      : "Your rating helps other clients and improves your Satisfaction metric."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {existingReview && (
                    <p className="text-sm text-muted-foreground">
                      Current: {existingReview.rating}/5 stars
                      {existingReview.comment && ` — "${existingReview.comment}"`}
                    </p>
                  )}
                  <div>
                    <Label className="text-sm">Rating (1–5 stars)</Label>
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRating(s)}
                          className="p-1 rounded hover:bg-muted transition-colors"
                          aria-label={`${s} stars`}
                        >
                          <Star
                            className={`h-8 w-8 ${
                              rating >= s
                                ? "fill-amber-400 text-amber-500"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="rating-comment" className="text-sm">
                      Comment (optional)
                    </Label>
                    <Textarea
                      id="rating-comment"
                      placeholder="How was working with this freelancer?"
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      rows={3}
                      className="mt-2"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleSubmitRating}
                    disabled={isSubmittingRating || rating < 1}
                  >
                    {isSubmittingRating
                      ? "Saving..."
                      : existingReview
                        ? "Update rating"
                        : "Submit rating"}
                  </Button>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}

