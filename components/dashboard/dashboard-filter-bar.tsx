"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardFilterBarProps {
  children: ReactNode;
  className?: string;
}

export function DashboardFilterBar({ children, className }: DashboardFilterBarProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card p-4 shadow-sm",
        "bg-linear-to-r from-card via-card to-primary/[0.03]",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">{children}</div>
    </div>
  );
}
