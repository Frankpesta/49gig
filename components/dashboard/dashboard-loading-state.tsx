"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLoadingStateProps {
  label?: string;
  className?: string;
}

export function DashboardLoadingState({
  label = "Loading...",
  className,
}: DashboardLoadingStateProps) {
  return (
    <div className={cn("flex min-h-[260px] items-center justify-center rounded-2xl border border-border/60 bg-card/70", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        {label}
      </div>
    </div>
  );
}
