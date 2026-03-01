"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { Bell, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const LIST_LIMIT = 100;

export default function NotificationHistoryPage() {
  const { user, isAuthenticated } = useAuth();
  const inAppEnabled = user?.notificationPreferences?.inApp ?? true;
  const notifications = useQuery(
    api.notifications.queries.getMyNotifications,
    inAppEnabled && user?._id
      ? { limit: LIST_LIMIT, userId: user._id }
      : "skip"
  );

  if (!isAuthenticated || !user) {
    return (
      <DashboardEmptyState
        icon={Bell}
        title="Please log in"
        description="Sign in to view your notification history."
        iconTone="muted"
      />
    );
  }

  if (!inAppEnabled) {
    return (
      <DashboardEmptyState
        icon={Bell}
        title="Notifications disabled"
        description="In-app notifications are disabled in your settings."
        iconTone="muted"
      />
    );
  }

  const list = notifications ?? [];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Notification History"
        description="View all your notifications."
        icon={Bell}
      />

      <Card className="rounded-xl overflow-hidden border-border/60">
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <p className="text-sm text-muted-foreground">
            {list.length} notification{list.length !== 1 ? "s" : ""}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <div className="px-6 py-12">
              <DashboardEmptyState
                icon={Bell}
                title="No notifications yet"
                description="You're all caught up. New notifications will appear here."
                iconTone="muted"
                className="border-0 shadow-none bg-transparent"
              />
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {list.map((notification: Doc<"notifications">) => (
                <Link
                  key={notification._id}
                  href={`/dashboard/notification-history/${notification._id}`}
                  className={cn(
                    "flex items-start gap-4 px-6 py-4 transition-colors hover:bg-muted/40",
                    !notification.readAt && "bg-muted/20"
                  )}
                >
                  <div
                    className={cn(
                      "mt-1 h-2 w-2 shrink-0 rounded-full",
                      notification.readAt ? "bg-muted-foreground/40" : "bg-primary"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground">{notification.title}</div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
