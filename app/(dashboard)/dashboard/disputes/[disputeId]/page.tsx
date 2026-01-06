"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  FileText,
  MessageSquare,
  DollarSign,
  ArrowLeft,
  Plus,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AddEvidenceDialog } from "./add-evidence-dialog";
import { Doc, Id } from "@/convex/_generated/dataModel";

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const disputeId = params.disputeId as string;

  const [isAddingEvidence, setIsAddingEvidence] = useState(false);
  const addEvidenceMutation = useMutation(api.disputes.mutations.addEvidence);

  const dispute = useQuery(
    api.disputes.queries.getDispute,
    isAuthenticated && user?._id && disputeId
      ? { disputeId: disputeId as any, userId: user._id }
      : "skip"
  );

  const project = useQuery(
    (api as any)["projects/queries"].getProject,
    dispute && isAuthenticated && user?._id
      ? { projectId: dispute.projectId, userId: user._id }
      : "skip"
  );

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  if (dispute === undefined || project === undefined) {
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      open: "destructive",
      under_review: "secondary",
      resolved: "default",
      escalated: "destructive",
      closed: "outline",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      milestone_quality: "Milestone Quality",
      payment: "Payment",
      communication: "Communication",
      freelancer_replacement: "Freelancer Replacement",
    };
    return labels[type] || type;
  };

  const canAddEvidence =
    (user.role === "client" || user.role === "freelancer") &&
    (dispute.status === "open" || dispute.status === "under_review");

  const isModerator = user.role === "moderator" || user.role === "admin";
  const canResolve = isModerator && dispute.status !== "resolved" && dispute.status !== "closed";

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/disputes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Dispute Details</h1>
          <p className="text-muted-foreground mt-1">
            Dispute ID: {dispute._id.slice(-12)}
          </p>
        </div>
        {getStatusBadge(dispute.status)}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Information */}
          <Card>
            <CardHeader>
              <CardTitle>Dispute Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <p className="mt-1">{getTypeLabel(dispute.type)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reason</label>
                <p className="mt-1">{dispute.reason}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1 whitespace-pre-wrap">{dispute.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Initiator</label>
                <p className="mt-1 capitalize">{dispute.initiatorRole}</p>
              </div>
              {dispute.milestoneId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Milestone
                  </label>
                  <p className="mt-1">
                    <Link
                      href={`/dashboard/projects/${dispute.projectId}?milestone=${dispute.milestoneId}`}
                      className="text-primary hover:underline"
                    >
                      View Milestone
                    </Link>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evidence */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Evidence</CardTitle>
                {canAddEvidence && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingEvidence(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Evidence
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
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {dispute.evidence.length === 0 ? (
                <p className="text-muted-foreground text-sm">No evidence submitted yet</p>
              ) : (
                <div className="space-y-3">
                  {dispute.evidence.map((evidence: { type: "message" | "file" | "milestone_deliverable"; messageId?: Id<"messages">; fileId?: Id<"_storage">; milestoneId?: Id<"milestones">; description?: string }, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg border"
                    >
                      {evidence.type === "message" && (
                        <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                      )}
                      {evidence.type === "file" && (
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                      )}
                      {evidence.type === "milestone_deliverable" && (
                        <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize">
                          {evidence.type.replace("_", " ")}
                        </p>
                        {evidence.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {evidence.description}
                          </p>
                        )}
                        {evidence.messageId && (
                          <Link
                            href={`/dashboard/chat?message=${evidence.messageId}`}
                            className="text-xs text-primary hover:underline mt-1 block"
                          >
                            View Message
                          </Link>
                        )}
                        {evidence.fileId && (
                          <a
                            href="#"
                            className="text-xs text-primary hover:underline mt-1 block"
                          >
                            Download File
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolution (if resolved) */}
          {dispute.resolution && (
            <Card>
              <CardHeader>
                <CardTitle>Resolution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Decision</label>
                  <p className="mt-1 capitalize">
                    {dispute.resolution.decision.replace("_", " ")}
                  </p>
                </div>
                {dispute.resolution.resolutionAmount && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Resolution Amount
                    </label>
                    <p className="mt-1">
                      ${(dispute.resolution.resolutionAmount / 100).toFixed(2)}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="mt-1 whitespace-pre-wrap">{dispute.resolution.notes}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Resolved At</label>
                  <p className="mt-1">
                    {new Date(dispute.resolution.resolvedAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle>Project</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/dashboard/projects/${dispute.projectId}`}
                className="text-primary hover:underline font-medium"
              >
                View Project
              </Link>
              {project && (
                <p className="text-sm text-muted-foreground mt-2">
                  {project.intakeForm?.title || "Untitled Project"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Financial Info */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount Locked</span>
                  <span className="font-medium">
                    ${(dispute.lockedAmount / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions (Moderator/Admin) */}
          {canResolve && (
            <Card>
              <CardHeader>
                <CardTitle>Moderator Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" asChild>
                  <Link href={`/dashboard/disputes/${disputeId}/resolve`}>
                    Resolve Dispute
                  </Link>
                </Button>
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
        </div>
      </div>
    </div>
  );
}

