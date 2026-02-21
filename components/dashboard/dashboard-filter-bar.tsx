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
        "rounded-2xl border border-border/60 bg-linear-to-r from-card via-card to-primary/5 p-4 shadow-sm backdrop-blur-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
