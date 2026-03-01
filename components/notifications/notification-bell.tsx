"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { usePusherNotifications } from "@/hooks/use-pusher-notifications";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

const BELL_LIMIT = 10;

export function NotificationBell() {
  const { user } = useAuth();
  const inAppEnabled = user?.notificationPreferences?.inApp ?? true;
  const [refreshKey, setRefreshKey] = useState(0);
  const notifications = useQuery(
    api.notifications.queries.getMyNotifications,
    inAppEnabled && user?._id
      ? {
          limit: BELL_LIMIT,
          refreshKey,
          userId: user._id,
        }
      : "skip"
  );
  const markAllRead = useMutation(api.notifications.mutations.markAllRead);

  usePusherNotifications({
    onNotification: (payload) => {
      setRefreshKey((prev) => prev + 1);
      const pushEnabled = user?.notificationPreferences?.push ?? true;
      if (pushEnabled) {
        toast(payload.title, {
          description: payload.message,
        });
      }
    },
  });

  const unreadCount = useMemo(() => {
    if (!inAppEnabled) return 0;
    return (notifications || []).filter((n: Doc<"notifications">) => !n.readAt).length;
  }, [notifications, inAppEnabled]);

  const handleMarkAllRead = async () => {
    try {
      await markAllRead(user?._id ? { userId: user._id } : {});
      setRefreshKey((prev) => prev + 1);
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const displayedNotifications = (notifications || []).slice(0, BELL_LIMIT);
  const hasMore = (notifications || []).length >= BELL_LIMIT;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-[min(360px,calc(100vw-2rem))] max-h-[min(400px,70vh)] overflow-hidden p-0"
      >
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
          <DropdownMenuLabel className="p-0 text-xs font-semibold sm:text-sm">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-6 shrink-0 px-2 text-[10px] sm:h-7 sm:text-xs"
            >
              <CheckCheck className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="scrollbar-hide max-h-[min(360px,60vh)] overflow-y-auto overscroll-contain">
          {!inAppEnabled ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              In-app notifications are disabled.
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              You’re all caught up.
            </div>
          ) : (
            displayedNotifications.map((notification: Doc<"notifications">) => (
              <DropdownMenuItem key={notification._id} asChild>
                <Link
                  href={`/dashboard/notification-history/${notification._id}`}
                  className={cn(
                    "flex cursor-pointer items-start gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3",
                    !notification.readAt && "bg-muted/40"
                  )}
                >
                <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary opacity-80 sm:h-2 sm:w-2" />
                <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                  <div className="truncate text-xs font-medium sm:text-sm">{notification.title}</div>
                  <div className="line-clamp-2 text-[11px] text-muted-foreground sm:text-xs">
                    {notification.message}
                  </div>
                  <div className="text-[11px] text-muted-foreground/70">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </div>
        {inAppEnabled && (displayedNotifications.length > 0 || hasMore) && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2 sm:px-4">
              <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
                <Link href="/dashboard/notification-history">
                  See more notifications
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
