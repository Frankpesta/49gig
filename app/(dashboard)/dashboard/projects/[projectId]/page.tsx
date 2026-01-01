"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
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
  LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Id } from "@/convex/_generated/dataModel";

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

export default function ProjectDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const projectId = params.projectId as Id<"projects">;

  const project = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api as any)["projects/queries"].getProject,
    user?._id ? { projectId, userId: user._id } : "skip"
  );

  const milestones = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api as any)["projects/queries"].getProjectMilestones,
    user?._id ? { projectId, userId: user._id } : "skip"
  );

  if (!user) {
    return null;
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
              The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
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

          {/* Deliverables */}
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

          {/* Milestones */}
          {milestones && milestones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Milestones</CardTitle>
                <CardDescription>
                  {milestones.length} milestone{milestones.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {milestones.map((milestone: { _id: Id<"milestones">; title: string; description: string; status: string; amount: number; dueDate: number }, index: number) => (
                    <div
                      key={milestone._id}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              Milestone {index + 1}: {milestone.title}
                            </span>
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
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                  Platform fee: {project.platformFee}%
                </div>
              </div>
              <Separator />
              <div>
                <div className="text-sm font-medium">Timeline</div>
                <div className="text-sm text-muted-foreground">
                  {project.intakeForm.timeline}
                </div>
              </div>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

