import type { Doc } from "@/convex/_generated/dataModel";

/**
 * Deep link for in-app notifications (bell, history list, toasts).
 */
export function notificationDetailHref(
  notification: Pick<Doc<"notifications">, "type" | "data">,
  userRole: string | undefined
): string {
  const data = notification.data;
  const d =
    data && typeof data === "object"
      ? (data as Record<string, unknown>)
      : null;
  if (
    d &&
    typeof d.openPath === "string" &&
    d.openPath.startsWith("/dashboard/")
  ) {
    return d.openPath;
  }
  const projectId = d && typeof d.projectId === "string" ? d.projectId : null;
  const matchId = d && typeof d.matchId === "string" ? d.matchId : null;

  if (
    userRole === "freelancer" &&
    notification.type === "match" &&
    matchId
  ) {
    return `/dashboard/match-requests?matchId=${encodeURIComponent(matchId)}`;
  }
  if (
    userRole === "client" &&
    notification.type === "match" &&
    projectId
  ) {
    return `/dashboard/projects/${projectId}/matches`;
  }
  return "";
}
