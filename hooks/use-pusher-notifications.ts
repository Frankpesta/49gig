import { useEffect } from "react";
import Pusher from "pusher-js";
import { useAuth } from "@/hooks/use-auth";

interface UsePusherNotificationsOptions {
  enabled?: boolean;
  onNotification?: (payload: {
    title: string;
    message: string;
    type: string;
    data?: Record<string, unknown>;
    createdAt: number;
  }) => void;
}

export function usePusherNotifications({
  enabled = true,
  onNotification,
}: UsePusherNotificationsOptions = {}) {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!enabled || !isAuthenticated || !user?._id) return;

    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    const pusher = new Pusher(key, {
      cluster,
    });

    const channel = pusher.subscribe(`user-${user._id}`);
    channel.bind("notification:new", (payload: any) => {
      if (!payload) return;
      onNotification?.({
        title: payload.title,
        message: payload.message,
        type: payload.type,
        data: payload.data,
        createdAt: payload.createdAt,
      });
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [enabled, isAuthenticated, user?._id, onNotification]);
}
