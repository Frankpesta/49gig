"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePusherNotifications } from "@/hooks/use-pusher-notifications";

export function NotificationListener() {
  const [refreshKey, setRefreshKey] = useState(0);
  useQuery(api.notifications.queries.getMyNotifications, {
    limit: 20,
    refreshKey,
  });

  usePusherNotifications({
    onNotification: () => {
      setRefreshKey((prev) => prev + 1);
    },
  });

  return null;
}
