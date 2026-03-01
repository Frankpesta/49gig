"use client";

import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconTone = "primary" | "muted" | "success" | "warning" | "danger";

const iconToneClasses: Record<IconTone, string> = {
  primary: "bg-primary/15 text-primary",
  muted: "bg-muted/60 text-muted-foreground",
  success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  danger: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
};

interface DashboardEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  iconTone?: IconTone;
  className?: string;
}

export function DashboardEmptyState({
  icon: Icon,
  title,
  description,
  action,
  iconTone = "primary",
  className,
}: DashboardEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card px-6 py-12 text-center shadow-sm",
        "bg-linear-to-br from-card via-card to-secondary/[0.04]",
        className
      )}
    >
      <div
        className={cn(
          "mb-4 flex h-16 w-16 items-center justify-center rounded-2xl",
          iconToneClasses[iconTone]
        )}
      >
        <Icon className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-bold text-foreground sm:text-lg">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
