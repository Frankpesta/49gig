"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
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
import { Doc } from "@/convex/_generated/dataModel";

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
  const mapStatusTone = (status: string) => {
    if (status === "completed" || status === "matched" || status === "funded") return "success";
    if (status === "cancelled" || status === "disputed") return "danger";
    if (status === "matching" || status === "pending_funding" || status === "in_progress") return "warning";
    return "neutral";
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Projects"
        description={
          isClient
            ? "Manage your projects and track their progress."
            : "View projects you are currently working on."
        }
        actions={
          isClient ? (
            <Button asChild>
              <Link href="/dashboard/projects/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Link>
            </Button>
          ) : null
        }
      />

      {/* Status Filters */}
      {isClient && (
        <DashboardFilterBar>
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
        </DashboardFilterBar>
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
        <DashboardEmptyState
          icon={FolderKanban}
          title="No projects found"
          description={
            isClient
              ? "Get started by creating your first project."
              : "No projects matched to you yet."
          }
          action={
            isClient ? (
              <Button asChild>
                <Link href="/dashboard/projects/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: Doc<"projects">) => {
            const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={project._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-2">{project.intakeForm.title}</CardTitle>
                    <DashboardStatusBadge
                      label={statusConfig.label}
                      tone={mapStatusTone(project.status)}
                      icon={<StatusIcon className="h-3 w-3" />}
                    />
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

                  {project.intakeForm.requiredSkills && project.intakeForm.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.intakeForm.requiredSkills.slice(0, 3).map((skill: string) => (
                        <DashboardStatusBadge key={skill} label={skill} tone="neutral" className="text-[11px]" />
                      ))}
                      {project.intakeForm.requiredSkills.length > 3 && (
                        <DashboardStatusBadge
                          label={`+${project.intakeForm.requiredSkills.length - 3}`}
                          tone="info"
                          className="text-[11px]"
                        />
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

