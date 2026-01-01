"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  FolderKanban,
  Clock,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSearchParams } from "next/navigation";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }
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

// Valid project statuses
const VALID_PROJECT_STATUSES = [
  "draft",
  "pending_funding",
  "funded",
  "matching",
  "matched",
  "in_progress",
  "completed",
  "cancelled",
  "disputed",
] as const;

export default function ProjectsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  
  // Validate status filter - only use if it's a valid project status
  const statusFilter = statusParam && VALID_PROJECT_STATUSES.includes(statusParam as any)
    ? statusParam
    : undefined;

  const projects = useQuery(
    (api as any)["projects/queries"].getProjects,
    user?._id
      ? {
          ...(statusFilter ? { status: statusFilter } : {}),
          userId: user._id,
        }
      : "skip"
  );

  if (!user) {
    return null;
  }

  const isClient = user.role === "client";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold">Projects</h1>
          <p className="text-muted-foreground">
            {isClient
              ? "Manage your projects and track their progress"
              : "View projects you're working on"}
          </p>
        </div>
        {isClient && (
          <Button asChild>
            <Link href="/dashboard/projects/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Link>
          </Button>
        )}
      </div>

      {/* Status Filters */}
      {isClient && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!statusFilter ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href="/dashboard/projects">All</Link>
          </Button>
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={`/dashboard/projects?status=${status}`}>
                {config.label}
              </Link>
            </Button>
          ))}
        </div>
      )}

      {/* Projects List */}
      {projects === undefined ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No projects found</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              {isClient
                ? "Get started by creating your first project"
                : "No projects matched to you yet"}
            </p>
            {isClient && (
              <Button asChild>
                <Link href="/dashboard/projects/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => {
            const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={project._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-2">{project.intakeForm.title}</CardTitle>
                    <Badge variant={statusConfig.variant}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {project.intakeForm.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>${project.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{project.intakeForm.timeline}</span>
                    </div>
                  </div>

                  {project.intakeForm.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.intakeForm.requiredSkills.slice(0, 3).map((skill: string) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {project.intakeForm.requiredSkills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.intakeForm.requiredSkills.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/dashboard/projects/${project._id}`}>
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

