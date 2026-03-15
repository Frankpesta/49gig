"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
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
  Plus,
  FolderKanban,
  Clock,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSearchParams } from "next/navigation";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";
import { useState } from "react";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const [deleteId, setDeleteId] = useState<Id<"projects"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteDraftProject = useMutation(
    (api as any)["projects/mutations"].deleteDraftProject
  );

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
  const canDeleteDraft = (p: Doc<"projects">) =>
    p.status === "draft" && (isClient ? p.clientId === user._id : user.role === "admin");

  const handleDeleteDraft = async () => {
    if (!deleteId || !user?._id) return;
    setDeleteId(null);
    setIsDeleting(true);
    try {
      await deleteDraftProject({ projectId: deleteId, userId: user._id });
      toast.success("Hire deleted");
      router.refresh();
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Failed to delete hire");
    } finally {
      setIsDeleting(false);
    }
  };

  const mapStatusTone = (status: string) => {
    if (status === "completed" || status === "matched" || status === "funded") return "success";
    if (status === "cancelled" || status === "disputed") return "danger";
    if (status === "matching" || status === "pending_funding" || status === "in_progress") return "warning";
    return "neutral";
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title={isClient ? "Hired Talents" : "Hires"}
        icon={FolderKanban}
        description={
          isClient
            ? "Manage your hires and track their progress."
            : "View your hires and track progress."
        }
        actions={
          isClient ? (
            <Button asChild className="rounded-xl">
              <Link href="/dashboard/projects/create">
                <Plus className="mr-2 h-4 w-4" />
                Hire Talents
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
            className="rounded-lg"
          >
            <Link href="/dashboard/projects">All</Link>
          </Button>
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              asChild
              className="rounded-lg"
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
            <Card key={i} className="rounded-xl overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <DashboardEmptyState
          icon={FolderKanban}
          iconTone="muted"
          title={isClient ? "No hires found" : "No hires yet"}
          description={
            isClient
              ? "Get started by hiring your first talent."
              : "When a client selects you, the hire will appear here."
          }
          action={
            isClient ? (
              <Button asChild className="rounded-xl">
                <Link href="/dashboard/projects/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Hire Talents
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
              <Card key={project._id} className="rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200">
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
                      <span>
                        $
                        {isClient
                          ? project.totalAmount.toLocaleString()
                          : ((project.totalAmount * (100 - (project.platformFee ?? 25))) / 100).toLocaleString()}
                      </span>
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

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-xl" asChild>
                      <Link href={`/dashboard/projects/${project._id}`}>
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    {canDeleteDraft(project) && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl"
                        onClick={() => setDeleteId(project._id)}
                        title="Delete hire"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && !isDeleting && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this hire?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the hire and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteDraft} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

