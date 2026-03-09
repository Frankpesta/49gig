"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
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
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  getRoleIdForSkill,
  getRoleLabel,
  getRoleLabelFromCategoryLabel,
  isCategoryLabel,
  isLegacyCategoryLabel,
} from "@/lib/platform-skills";

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

/** Derive role labels from requiredSkills (skills map to roles; legacy may have category labels) */
function getRoleLabelsFromProject(intakeForm: {
  requiredSkills?: string[];
  talentCategory?: string;
  category?: string;
}): string[] {
  const skills = intakeForm.requiredSkills ?? [];
  const roleLabels = new Set<string>();

  for (const item of skills) {
    const roleId = getRoleIdForSkill(item);
    if (roleId) {
      roleLabels.add(getRoleLabel(roleId));
    } else if (isLegacyCategoryLabel(item)) {
      roleLabels.add("AI Engineer");
      roleLabels.add("Machine Learning Engineer");
      roleLabels.add("Blockchain Developer");
    } else if (isCategoryLabel(item)) {
      roleLabels.add(getRoleLabelFromCategoryLabel(item));
    }
  }

  if (roleLabels.size === 0 && (intakeForm.talentCategory || intakeForm.category)) {
    const cat = intakeForm.talentCategory || intakeForm.category || "";
    roleLabels.add(getRoleLabelFromCategoryLabel(cat));
  }
  return [...roleLabels];
}

/** Filter to only actual skills (exclude category labels) */
function getActualSkills(requiredSkills: string[]): string[] {
  return requiredSkills.filter(
    (s) => !isCategoryLabel(s) && !isLegacyCategoryLabel(s)
  );
}

// Helper function to validate Convex ID format
function isValidConvexId(id: string | string[] | undefined): id is Id<"projects"> {
  if (typeof id !== "string") return false;
  if (id.length === 0 || id.length > 100) return false;
  // Convex IDs are base62 encoded strings, starting with a letter
  // and containing alphanumeric characters
  return /^[a-zA-Z][a-zA-Z0-9]*$/.test(id);
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const projectIdParam = params.projectId;
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

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
  const ensureMonthlyCycles = useMutation(
    api.monthlyBillingCycles.mutations.ensureMonthlyCycles
  );
  const [approvingCycleId, setApprovingCycleId] = useState<Id<"monthlyBillingCycles"> | null>(null);
  const [isCreatingCycles, setIsCreatingCycles] = useState(false);

  const project = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api as any)["projects/queries"].getProject,
    user?._id && projectId ? { projectId, userId: user._id } : "skip"
  );

  const monthlyCycles = useQuery(
    api.monthlyBillingCycles.queries.getCyclesByProjectId,
    projectId ? { projectId } : "skip"
  );

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
              <Link href="/dashboard/projects">Back to Projects</Link>
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
            <h3 className="mb-2 text-lg font-semibold">Project not found</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              The project you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button asChild>
              <Link href="/dashboard/projects">Back to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;
  const isClient = user.role === "client" && project.clientId === user._id;
  const isMatchedFreelancer =
    project.matchedFreelancerId === user._id ||
    (project.matchedFreelancerIds && project.matchedFreelancerIds.includes(user._id));
  const canChat =
    (project.matchedFreelancerId || (project.matchedFreelancerIds?.length ?? 0) > 0) &&
    (project.clientId === user._id || isMatchedFreelancer);

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

  if (needContractSign && projectId && user._id) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold">Sign the contract</h1>
            <p className="text-sm text-muted-foreground">
              Read and sign the project agreement to continue. Your signature will be added and a copy sent to your email.
            </p>
          </div>
        </div>
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
      toast.success("Project marked as completed");
      router.refresh();
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Failed to complete project");
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-heading font-bold">
              {project.intakeForm.title}
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant={statusConfig.variant}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {statusConfig.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        {isClient && (
          <div className="flex gap-2">
            {needContractSignPrePayment && (
              <Button asChild>
                <Link href={`/dashboard/projects/${project._id}/contract`}>
                  <FileSignature className="mr-2 h-4 w-4" />
                  Sign Contract
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
              <Button variant="outline" asChild>
                <Link href={`/dashboard/projects/${project._id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>

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
                  {isClient
                    ? "Approve each month to release funds to the freelancer's wallet. They withdraw to their bank when ready."
                    : isMatchedFreelancer
                      ? "Funds are released to your wallet when the client approves each month. Withdraw to your bank account from the Wallet page."
                      : "Payment cycles for this project. Funds go to freelancer wallets; they withdraw to their bank accounts."}
                </CardDescription>
                {isClient && (
                  <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm">
                    <div className="font-medium text-foreground mb-2">Expected hours per engagement</div>
                    <div className="grid gap-2 sm:grid-cols-2 text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">Part-Time</span>
                        <ul className="mt-0.5 list-disc list-inside space-y-0.5">
                          <li>20 hours per week</li>
                          <li>~80 hours per month</li>
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Full-Time</span>
                        <ul className="mt-0.5 list-disc list-inside space-y-0.5">
                          <li>40 hours per week</li>
                          <li>~160 hours per month</li>
                        </ul>
                      </div>
                    </div>
                    {project.intakeForm.roleType && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        This project: <span className="font-medium text-foreground">
                          {project.intakeForm.roleType === "full_time" ? "Full-Time" : "Part-Time"}
                        </span>
                        {" "}({project.intakeForm.roleType === "full_time" ? "40 hrs/week, ~160 hrs/month" : "20 hrs/week, ~80 hrs/month"})
                      </p>
                    )}
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
                        {isClient && project?.fundUpfrontMonths ? ` (${project.fundUpfrontMonths} upfront)` : ""}
                      </p>
                    );
                  })()}
                  {monthlyCycles.map((cycle: { _id: Id<"monthlyBillingCycles">; monthIndex: number; monthStartDate: number; amountCents: number; currency: string; status: string }) => {
                    const monthLabel = new Date(cycle.monthStartDate).toLocaleString("default", { month: "long", year: "numeric" });
                    const isPending = cycle.status === "pending";
                    const statusLabel = isClient
                      ? (cycle.status === "pending" ? "Awaiting your approval" : cycle.status === "approved" ? "Approved" : cycle.status === "disputed" ? "Disputed" : cycle.status)
                      : (cycle.status === "pending" ? "Awaiting client approval" : cycle.status === "approved" ? "Approved, funds released" : cycle.status === "disputed" ? "Disputed" : cycle.status);
                    const durMonths = project?.intakeForm?.projectDuration ? (project.intakeForm.projectDuration === "12+" ? 12 : parseInt(project.intakeForm.projectDuration, 10) || 1) : monthlyCycles.length || 1;
                    const displayAmount = isClient ? (project ? project.totalAmount / durMonths : cycle.amountCents / 100) : cycle.amountCents / 100;
                    return (
                      <div key={cycle._id} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <div className="font-medium">Month {cycle.monthIndex}: {monthLabel}</div>
                          <div className="text-sm text-muted-foreground">
                            ${typeof displayAmount === "number" ? displayAmount.toFixed(2) : (cycle.amountCents / 100).toFixed(2)} {cycle.currency.toUpperCase()} • {statusLabel}
                          </div>
                        </div>
                        {(isClient || user?.role === "admin") && isPending && (
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
                            disabled={approvingCycleId === cycle._id}
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
                  {(project.status === "in_progress" || project.status === "matched") && (isClient || user?.role === "admin") && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isCreatingCycles}
                      onClick={async () => {
                        if (!projectId) return;
                        setIsCreatingCycles(true);
                        try {
                          await ensureMonthlyCycles({ projectId, userId: user._id });
                          toast.success("Monthly cycles created. The page will update shortly.");
                        } catch (e) {
                          toast.error(getUserFriendlyError(e) || "Failed to create cycles");
                        } finally {
                          setIsCreatingCycles(false);
                        }
                      }}
                    >
                      {isCreatingCycles ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Create monthly cycles
                    </Button>
                  )}
                </div>
                )}
                {(isClient || user?.role === "admin") && monthlyCycles && monthlyCycles.length > 0 && (
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
                    const roleLabels = getRoleLabelsFromProject(project.intakeForm);
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
                <div className="text-lg font-semibold">
                  {isClient
                    ? `$${project.totalAmount.toLocaleString()}`
                    : `$${((project.totalAmount * (100 - (project.platformFee ?? 25))) / 100).toLocaleString()}`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isClient ? "Total amount for this hire" : "Your share for this engagement"}
                </div>
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
              {project.freelancer && (
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
              )}
              {canChat && (
                <>
                  <Separator />
                  {projectChat ? (
                    <Button asChild className="w-full">
                      <Link href={`/dashboard/chat/${projectChat._id}`}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        {isClient ? "Chat with freelancer" : "Chat with client"}
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

