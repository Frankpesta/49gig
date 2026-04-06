"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Persistent reminder in the top bar when the freelancer account cannot be matched yet.
 */
export function FreelancerMatchingStatusChip() {
  const user = useAuthStore((s) => s.user);
  const readiness = useQuery(
    api.users.queries.getMyFreelancerMatchingReadiness,
    user?._id && user.role === "freelancer" ? { userId: user._id } : "skip"
  ) as
    | { issues: { id: string; title: string; description: string; href: string }[] }
    | undefined;

  if (!user || user.role !== "freelancer") return null;
  if (readiness === undefined || readiness.issues.length === 0) return null;

  const first = readiness.issues[0]!;
  const more = readiness.issues.length - 1;
  const tip = [
    `${first.title}: ${first.description}`,
    more > 0 ? `+${more} more item(s) to fix (see dashboard).` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      href={first.href}
      title={tip}
      className={cn(
        "hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-500/35",
        "bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:text-amber-100",
        "hover:bg-amber-500/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
      )}
    >
      <span className="relative flex h-2 w-2" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
      </span>
      <AlertTriangle className="h-3.5 w-3.5 opacity-90 shrink-0" aria-hidden />
      <span className="max-w-[10rem] truncate">Matching blocked</span>
    </Link>
  );
}
