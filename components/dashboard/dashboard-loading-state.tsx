"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLoadingStateProps {
  label?: string;
  className?: string;
}

export function DashboardLoadingState({
  label = "Loading",
  className,
}: DashboardLoadingStateProps) {
  return (
    <div className={cn("flex min-h-[260px] items-center justify-center rounded-xl border border-border/60 bg-card", className)}>
      <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        {label}
      </div>
    </div>
  );
}
