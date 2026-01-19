"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Upload,
  FileText,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";

export default function MilestoneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const projectId = params.projectId as string;
  const milestoneId = params.milestoneId as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [deliverables, setDeliverables] = useState<
    Array<{ name: string; url: string }>
  >([{ name: "", url: "" }]);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: "",
    message: "",
  });

  const milestone = useQuery(
    (api as any)["projects/queries"].getMilestoneById,
    isAuthenticated && user?._id && milestoneId
      ? { milestoneId: milestoneId as any, userId: user._id }
      : "skip"
  );

  const project = useQuery(
    (api as any)["projects/queries"].getProject,
    isAuthenticated && user?._id && projectId
      ? { projectId: projectId as any, userId: user._id }
      : "skip"
  );

  const submitMilestone = useMutation(
    (api as any)["milestones/mutations"].submitMilestone
  );
  const approveMilestone = useMutation(
    (api as any)["milestones/mutations"].approveMilestone
  );
  const rejectMilestone = useMutation(
    (api as any)["milestones/mutations"].rejectMilestone
  );
  const startMilestone = useMutation(
    (api as any)["milestones/mutations"].startMilestone
  );

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  if (milestone === undefined || project === undefined) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!milestone || !project) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Milestone not found</p>
      </div>
    );
  }

  const isFreelancer = user.role === "freelancer" && project.matchedFreelancerId === user._id;
  const isClient = user.role === "client" && project.clientId === user._id;
  const isAdmin = user.role === "admin";

  const canStart = isFreelancer && milestone.status === "pending";
  const canSubmit = isFreelancer && milestone.status === "in_progress";
  const canApprove = (isClient || isAdmin) && milestone.status === "submitted";
  const canReject = (isClient || isAdmin) && milestone.status === "submitted";

  const addDeliverable = () => {
    setDeliverables([...deliverables, { name: "", url: "" }]);
  };

  const removeDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const updateDeliverable = (index: number, field: "name" | "url", value: string) => {
    const updated = [...deliverables];
    updated[index] = { ...updated[index], [field]: value };
    setDeliverables(updated);
  };

  const handleSubmit = async () => {
    if (!user?._id) return;

    const validDeliverables = deliverables.filter(
      (d) => d.name.trim() && d.url.trim()
    );

    if (validDeliverables.length === 0) {
      setErrorDialog({
        open: true,
        title: "Validation Error",
        message: "Please add at least one deliverable",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitMilestone({
        milestoneId: milestoneId as any,
        deliverables: validDeliverables,
        userId: user._id,
      });
      router.refresh();
      toast.success("Milestone submitted successfully");
    } catch (error) {
      console.error("Failed to submit milestone:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to submit milestone";
      setErrorDialog({
        open: true,
        title: "Submission Failed",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!user?._id) return;

    setIsApproving(true);
    try {
      await approveMilestone({
        milestoneId: milestoneId as any,
        userId: user._id,
      });
      router.refresh();
      toast.success("Milestone approved successfully");
    } catch (error) {
      console.error("Failed to approve milestone:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to approve milestone";
      setErrorDialog({
        open: true,
        title: "Approval Failed",
        message: errorMessage,
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!user?._id || !rejectionReason.trim()) return;

    setIsRejecting(true);
    try {
      await rejectMilestone({
        milestoneId: milestoneId as any,
        reason: rejectionReason,
        userId: user._id,
      });
      router.refresh();
      toast.success("Milestone rejected");
    } catch (error) {
      console.error("Failed to reject milestone:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to reject milestone";
      setErrorDialog({
        open: true,
        title: "Rejection Failed",
        message: errorMessage,
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleStart = async () => {
    if (!user?._id) return;

    try {
      await startMilestone({
        milestoneId: milestoneId as any,
        userId: user._id,
      });
      router.refresh();
      toast.success("Milestone started successfully");
    } catch (error) {
      console.error("Failed to start milestone:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to start milestone";
      setErrorDialog({
        open: true,
        title: "Start Failed",
        message: errorMessage,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/projects/${projectId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-heading font-bold">{milestone.title}</h1>
          </div>
          <p className="text-muted-foreground">{milestone.description}</p>
        </div>
        <Badge
          variant={
            milestone.status === "approved" || milestone.status === "paid"
              ? "default"
              : milestone.status === "rejected" || milestone.status === "disputed"
              ? "destructive"
              : "secondary"
          }
        >
          {milestone.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Milestone Details */}
          <Card>
            <CardHeader>
              <CardTitle>Milestone Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Amount:</span>
                <span>${milestone.amount.toFixed(2)} {milestone.currency.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Due Date:</span>
                <span>{new Date(milestone.dueDate).toLocaleDateString()}</span>
                {milestone.dueDate < Date.now() && milestone.status !== "completed" && (
                  <Badge variant="destructive" className="ml-2">
                    Overdue
                  </Badge>
                )}
              </div>
              {milestone.submittedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Submitted:</span>
                  <span>{formatDistanceToNow(new Date(milestone.submittedAt), { addSuffix: true })}</span>
                </div>
              )}
              {milestone.approvedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Approved:</span>
                  <span>{formatDistanceToNow(new Date(milestone.approvedAt), { addSuffix: true })}</span>
                </div>
              )}
              {milestone.autoReleaseAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Auto-release:</span>
                  <span>{formatDistanceToNow(new Date(milestone.autoReleaseAt), { addSuffix: true })}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deliverables */}
          {milestone.deliverables && milestone.deliverables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Submitted Deliverables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {milestone.deliverables?.map((deliverable: { name: string; fileId?: string; url?: string; submittedAt: number }, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded border">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{deliverable.name}</span>
                      {deliverable.url && (
                        <a
                          href={deliverable.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rejection Reason */}
          {milestone.status === "rejected" && milestone.rejectionReason && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Rejection Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{milestone.rejectionReason}</p>
              </CardContent>
            </Card>
          )}

          {/* Freelancer Actions */}
          {isFreelancer && (
            <>
              {canStart && (
                <Card>
                  <CardHeader>
                    <CardTitle>Start Milestone</CardTitle>
                    <CardDescription>Begin working on this milestone</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleStart} className="w-full">
                      Start Milestone
                    </Button>
                  </CardContent>
                </Card>
              )}

              {canSubmit && (
                <Card>
                  <CardHeader>
                    <CardTitle>Submit Deliverables</CardTitle>
                    <CardDescription>Submit your completed work for review</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {deliverables.map((deliverable: { name: string; url: string }, index: number) => (
                      <div key={index} className="space-y-2 p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <Label>Deliverable {index + 1}</Label>
                          {deliverables.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDeliverable(index)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Input
                          placeholder="Deliverable name"
                          value={deliverable.name}
                          onChange={(e) => updateDeliverable(index, "name", e.target.value)}
                        />
                        <Input
                          placeholder="URL or file link"
                          value={deliverable.url}
                          onChange={(e) => updateDeliverable(index, "url", e.target.value)}
                        />
                      </div>
                    ))}
                    <Button variant="outline" onClick={addDeliverable} className="w-full">
                      <Upload className="mr-2 h-4 w-4" />
                      Add Deliverable
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit for Review"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Client Actions */}
          {(isClient || isAdmin) && (
            <>
              {canApprove && (
                <Card>
                  <CardHeader>
                    <CardTitle>Approve Milestone</CardTitle>
                    <CardDescription>
                      Approve this milestone. Payment will be released automatically after 48 hours.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={handleApprove}
                      disabled={isApproving}
                      className="w-full"
                    >
                      {isApproving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve Milestone
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {canReject && (
                <Card>
                  <CardHeader>
                    <CardTitle>Reject Milestone</CardTitle>
                    <CardDescription>
                      Reject this milestone if it doesn't meet requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={4}
                    />
                    <Button
                      onClick={handleReject}
                      disabled={isRejecting || !rejectionReason.trim()}
                      variant="destructive"
                      className="w-full"
                    >
                      {isRejecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject Milestone
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/dashboard/projects/${projectId}`}
                className="text-primary hover:underline"
              >
                {project.intakeForm.title}
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error Dialog */}
      <AlertDialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {errorDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {errorDialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialog({ open: false, title: "", message: "" })}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


