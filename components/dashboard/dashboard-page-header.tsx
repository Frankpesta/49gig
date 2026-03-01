"use client";

import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeaderTone = "default" | "primary" | "muted";

interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: LucideIcon;
  iconTone?: HeaderTone;
  className?: string;
}

const iconColorClasses: Record<HeaderTone, string> = {
  default: "text-primary",
  primary: "text-primary",
  muted: "text-muted-foreground",
};

export function DashboardPageHeader({
  title,
  description,
  actions,
  icon: Icon,
  iconTone = "default",
  className,
}: DashboardPageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-4 border-b border-border/40",
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              iconColorClasses[iconTone]
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.5} />
          </div>
        )}
        <div className="space-y-0.5 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-muted-foreground max-w-2xl mt-0.5">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
