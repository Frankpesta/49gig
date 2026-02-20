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
  LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ProjectContractView } from "@/components/contracts/project-contract-view";

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
  const [isCreatingMilestones, setIsCreatingMilestones] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Validate the projectId from URL params
  const isValidId = isValidConvexId(projectIdParam);
  const projectId = isValidId ? (projectIdParam as Id<"projects">) : null;

  const projectChat = useQuery(
    api.chat.queries.getProjectChat,
    user?._id && projectId ? { projectId, userId: user._id } : "skip"
  );

  const createProjectChat = useMutation(api.chat.mutations.createProjectChat);
  const autoCreateMilestones = useMutation(
    (api as any)["projects/mutations"].autoCreateMilestones
  );

  const project = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api as any)["projects/queries"].getProject,
    user?._id && projectId ? { projectId, userId: user._id } : "skip"
  );

  const milestones = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api as any)["projects/queries"].getProjectMilestones,
    user?._id && projectId ? { projectId, userId: user._id } : "skip"
  );

  const existingReview = useQuery(
    (api as any)["reviews/queries"].getReviewByProject,
    projectId && user?._id ? { projectId, userId: user._id } : "skip"
  );
  const submitFreelancerRating = useMutation(
    (api as any)["reviews/mutations"].submitFreelancerRating
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

  const needContractSign =
    (project.status === "matched" || project.status === "in_progress") &&
    (isClient
      ? !project.clientContractSignedAt
      : isMatchedFreelancer &&
        !project.freelancerContractSignatures?.some((s: { freelancerId: Id<"users"> }) => s.freelancerId === user._id));

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
      toast.error(err instanceof Error ? err.message : "Could not open chat");
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
      toast.error(err instanceof Error ? err.message : "Failed to submit rating");
    } finally {
      setIsSubmittingRating(false);
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
            {(project.status === "draft" || project.status === "pending_funding") && (
              <Button asChild>
                <Link href={`/dashboard/projects/${project._id}/payment`}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  {project.status === "draft" ? "Fund Project" : "Complete Payment"}
                </Link>
              </Button>
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

          {/* Milestones – always visible so freelancer and client can find them */}
          <Card id="milestones">
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
              <CardDescription>
                {milestones && milestones.length > 0
                  ? `${milestones.length} milestone${milestones.length !== 1 ? "s" : ""} – submit work, review, and release payment`
                  : isClient
                    ? "Milestones are created automatically after you fund the project."
                    : "Milestones will appear here once the project is funded."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {milestones && milestones.length > 0 ? (
                <div className="space-y-4">
                  {milestones.map((milestone: { _id: Id<"milestones">; title: string; description: string; status: string; amount: number; dueDate: number }, index: number) => (
                    <div
                      key={milestone._id}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/dashboard/projects/${projectId}/milestones/${milestone._id}`}
                              className="font-semibold hover:text-primary hover:underline"
                            >
                              Milestone {index + 1}: {milestone.title}
                            </Link>
                            <Badge variant="outline">
                              {milestone.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {milestone.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${milestone.amount.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {new Date(milestone.dueDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Link href={`/dashboard/projects/${projectId}/milestones/${milestone._id}`} className="shrink-0">
                          <Button variant="default" size="sm">
                            {user?.role === "freelancer" && (milestone.status === "pending" || milestone.status === "in_progress" || milestone.status === "rejected")
                              ? "Open & submit"
                              : (user?.role === "client" && milestone.status === "submitted")
                                ? "Review & approve"
                                : "View details"}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
                  <FolderKanban className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">No milestones yet</p>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                    {isClient
                      ? "Fund the project to create milestones automatically. You can then review and approve each milestone from this page."
                      : "Once the client funds the project, milestones will show here. You’ll start work, submit deliverables, and get paid per milestone."}
                  </p>
                  {isClient &&
                    projectId &&
                    user?._id &&
                    (project.status === "funded" || project.status === "matched" || project.status === "in_progress") && (
                      <Button
                        onClick={async () => {
                          setIsCreatingMilestones(true);
                          try {
                            await autoCreateMilestones({
                              projectId: projectId as Id<"projects">,
                              userId: user._id,
                            });
                            toast.success("Milestones created");
                            router.refresh();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Failed to create milestones");
                          } finally {
                            setIsCreatingMilestones(false);
                          }
                        }}
                        disabled={isCreatingMilestones}
                      >
                        {isCreatingMilestones ? "Creating…" : "Create milestones now"}
                      </Button>
                    )}
                </div>
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
                <div className="text-sm font-medium">Category</div>
                <div className="text-sm text-muted-foreground">
                  {project.intakeForm.category}
                </div>
              </div>
              <Separator />
              <div>
                <div className="text-sm font-medium">Budget</div>
                <div className="text-lg font-semibold">
                  ${project.totalAmount.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  Service fee ({project.platformFee}%): vetting, escrow, contracts, support
                </div>
              </div>
              <Separator />
              <div>
                <div className="text-sm font-medium">Timeline</div>
                <div className="text-sm text-muted-foreground">
                  {project.intakeForm.timeline}
                </div>
              </div>
              {project.intakeForm.requiredSkills && project.intakeForm.requiredSkills.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium mb-2">Required Skills</div>
                    <div className="flex flex-wrap gap-1">
                      {project.intakeForm.requiredSkills.map((skill: string) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
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

