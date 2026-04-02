"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FolderKanban,
  User,
  Shield,
  Briefcase,
  Calendar,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { format } from "date-fns";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_funding: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  funded: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  matching: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
  matched: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400",
  in_progress: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  completed: "bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  disputed: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
};

export default function UserProjectsPage() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const params = useParams();
  const userId = params.userId as string;

  const profileData = useQuery(
    api.users.queries.getUserProfileForAdmin,
    isAuthenticated && currentUser?._id && (currentUser.role === "admin" || currentUser.role === "moderator")
      ? { targetUserId: userId as Id<"users">, adminUserId: currentUser._id }
      : "skip"
  );

  const projects = useQuery(
    api.projects.queries.getProjectsForUser,
    isAuthenticated && currentUser?._id && (currentUser.role === "admin" || currentUser.role === "moderator")
      ? { targetUserId: userId as Id<"users">, adminUserId: currentUser._id }
      : "skip"
  );

  if (!isAuthenticated || !currentUser) {
    return <DashboardEmptyState icon={User} title="Please log in" iconTone="muted" />;
  }

  if (currentUser.role !== "admin" && currentUser.role !== "moderator") {
    return (
      <DashboardEmptyState
        icon={Shield}
        iconTone="muted"
        title="Access restricted"
        description="Only admins and moderators can view user projects."
        action={<Button asChild><Link href="/dashboard/users">Back to Users</Link></Button>}
      />
    );
  }

  if (profileData === undefined || projects === undefined) {
    return <DashboardLoadingState label="Loading projects" />;
  }

  if (!profileData) {
    return (
      <DashboardEmptyState
        icon={User}
        iconTone="muted"
        title="User not found"
        action={<Button asChild><Link href="/dashboard/users">Back to Users</Link></Button>}
      />
    );
  }

  const userName = profileData.name ?? "this user";

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href={`/dashboard/users/${userId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <DashboardPageHeader
          title={`${userName}'s Projects`}
          description={`All projects associated with ${profileData.email} — as client or freelancer`}
          icon={FolderKanban}
          className="flex-1"
        />
      </div>

      {!projects || projects.length === 0 ? (
        <DashboardEmptyState
          icon={FolderKanban}
          iconTone="muted"
          title="No projects found"
          description={`${userName} has no projects as a client or freelancer yet.`}
        />
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FolderKanban className="h-4 w-4" />
            <span>{projects.length} project{projects.length !== 1 ? "s" : ""} found</span>
          </div>

          <div className="space-y-4">
            {(projects as any[]).map((project) => (
              <Card key={project._id} className="rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <CardTitle className="text-base leading-snug truncate">
                        {project.intakeForm?.title ?? "Untitled Project"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.intakeForm?.description ?? "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        className={`capitalize text-xs ${STATUS_COLORS[project.status] ?? "bg-muted text-muted-foreground"}`}
                        variant="outline"
                      >
                        {project.status.replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {(project as any).userRole === "client" ? "as Client" : "as Freelancer"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Category</p>
                      <p className="font-medium truncate">{project.intakeForm?.talentCategory ?? "—"}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Type</p>
                      <p className="font-medium capitalize">{project.intakeForm?.hireType ?? "—"}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> Budget
                      </p>
                      <p className="font-medium">
                        {project.totalBudgetCents != null
                          ? `$${(project.totalBudgetCents / 100).toLocaleString()}`
                          : "—"}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Created
                      </p>
                      <p className="font-medium">{format(project.createdAt, "MMM d, yyyy")}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/40">
                    {(project as any).client && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span>Client: <span className="text-foreground font-medium">{(project as any).client.name}</span></span>
                      </div>
                    )}
                    {(project as any).freelancer && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5 shrink-0" />
                        <span>Freelancer: <span className="text-foreground font-medium">{(project as any).freelancer.name}</span></span>
                      </div>
                    )}
                    <div className="ml-auto">
                      <Button size="sm" variant="outline" className="gap-1.5 h-8" asChild>
                        <Link href={`/dashboard/projects/${project._id}`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Project
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
