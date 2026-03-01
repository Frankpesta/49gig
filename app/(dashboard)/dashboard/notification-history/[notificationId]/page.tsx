"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Bell, Trash2, AlertCircle, ExternalLink } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect } from "react";
import { toast } from "sonner";

export default function NotificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const notificationId = params.notificationId as Id<"notifications">;

  const notification = useQuery(
    api.notifications.queries.getNotificationById,
    user?._id ? { notificationId, userId: user._id } : "skip"
  );

  const markRead = useMutation(api.notifications.mutations.markNotificationRead);
  const deleteNotification = useMutation(api.notifications.mutations.deleteNotification);

  useEffect(() => {
    if (notification && !notification.readAt && user?._id) {
      markRead({
        notificationId,
        userId: user._id,
      }).catch(() => {});
    }
  }, [notification, notificationId, user?._id, markRead]);

  const handleDelete = async () => {
    if (!user?._id) return;
    try {
      await deleteNotification({
        notificationId,
        userId: user._id,
      });
      toast.success("Notification deleted");
      router.push("/dashboard/notification-history");
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  if (!user) {
    return null;
  }

  if (notification === undefined) {
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

  if (notification === null) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">Notification not found</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              This notification may have been deleted or you don&apos;t have access to it.
            </p>
            <Button asChild>
              <Link href="/dashboard/notification-history">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to notifications
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="rounded-lg">
            <Link href="/dashboard/notification-history">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Notification Details
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {new Date(notification.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          className="rounded-lg text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      <Card className="rounded-xl overflow-hidden border-border/60">
        <CardHeader className="bg-linear-to-r from-primary/5 via-transparent to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {notification.title}
          </CardTitle>
          <CardDescription>
            {notification.type ? `Type: ${notification.type}` : "Notification"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-foreground whitespace-pre-wrap">{notification.message}</p>
          </div>

          {/* Action buttons for known notification types */}
          {notification.data &&
            typeof notification.data === "object" &&
            "projectId" in notification.data &&
            typeof (notification.data as { projectId?: string }).projectId === "string" && (
              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild>
                  <Link
                    href={`/dashboard/projects/${(notification.data as { projectId: string }).projectId}/matches`}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View project matches
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link
                    href={`/dashboard/projects/${(notification.data as { projectId: string }).projectId}`}
                    className="gap-2"
                  >
                    View project
                  </Link>
                </Button>
              </div>
            )}

          {/* Raw data only when we have extra fields beyond projectId/matchId */}
          {notification.data &&
            (() => {
              const d = notification.data as Record<string, unknown>;
              const keys = Object.keys(d);
              const hasProject = keys.includes("projectId");
              const hasMatch = keys.includes("matchId");
              const hasOther = keys.some((k) => !["projectId", "matchId"].includes(k));
              if (hasOther || (keys.length > 2)) {
                return (
                  <div className="mt-6 rounded-lg border border-border/60 bg-muted/20 p-4">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Reference IDs
                    </div>
                    <div className="text-sm space-y-1 font-mono">
                      {hasProject && (
                        <div>
                          Project: <span className="text-muted-foreground">{String(d.projectId)}</span>
                        </div>
                      )}
                      {hasMatch && (
                        <div>
                          Match: <span className="text-muted-foreground">{String(d.matchId)}</span>
                        </div>
                      )}
                      {hasOther &&
                        keys
                          .filter((k) => !["projectId", "matchId"].includes(k))
                          .map((k) => (
                            <div key={k}>
                              {k}: <span className="text-muted-foreground">{JSON.stringify(d[k])}</span>
                            </div>
                          ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
        </CardContent>
      </Card>
    </div>
  );
}
