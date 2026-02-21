"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type StatusTone = "success" | "warning" | "danger" | "neutral" | "info";

interface DashboardStatusBadgeProps {
  label: string;
  tone?: StatusTone;
  className?: string;
  icon?: ReactNode;
}

const toneClassMap: Record<StatusTone, string> = {
  success: "border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-300",
  warning: "border-yellow-500/25 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  danger: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300",
  neutral: "border-border/60 bg-muted/60 text-muted-foreground",
  info: "border-primary/25 bg-primary/10 text-primary",
};

export function DashboardStatusBadge({
  label,
  tone = "neutral",
  className,
  icon,
}: DashboardStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", toneClassMap[tone], className)}
    >
      {icon}
      {label}
    </Badge>
  );
}
