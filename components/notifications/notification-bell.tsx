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
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function NotificationBell() {
  const { user } = useAuth();
  const inAppEnabled = user?.notificationPreferences?.inApp ?? true;
  const [refreshKey, setRefreshKey] = useState(0);
  const notifications = useQuery(
    api.notifications.queries.getMyNotifications,
    inAppEnabled && user?._id
      ? {
          limit: 20,
          refreshKey,
          userId: user._id,
        }
      : "skip"
  );
  const markNotificationRead = useMutation(api.notifications.mutations.markNotificationRead);
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
    await markAllRead(user?._id ? { userId: user._id } : {});
  };

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
        className="w-[360px] max-w-[90vw] p-0"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            Notifications
          </DropdownMenuLabel>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            className="h-7 px-2 text-xs"
          >
            <CheckCheck className="mr-1 h-3.5 w-3.5" />
            Mark all read
          </Button>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[360px] overflow-auto">
          {!inAppEnabled ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              In-app notifications are disabled.
            </div>
          ) : (notifications || []).length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              You’re all caught up.
            </div>
          ) : (
            (notifications || []).map((notification: Doc<"notifications">) => (
              <DropdownMenuItem
                key={notification._id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 px-4 py-3",
                  !notification.readAt && "bg-muted/40"
                )}
                onClick={() =>
                  markNotificationRead({
                    notificationId: notification._id,
                    ...(user?._id ? { userId: user._id } : {}),
                  })
                }
              >
                <div className="mt-0.5 h-2 w-2 rounded-full bg-primary opacity-80" />
                <div className="flex-1 space-y-1">
                  <div className="text-sm font-medium">{notification.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {notification.message}
                  </div>
                  <div className="text-[11px] text-muted-foreground/70">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
