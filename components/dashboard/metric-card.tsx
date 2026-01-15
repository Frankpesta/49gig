"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  subtitle?: string;
  badge?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  progress?: {
    value: number;
    label?: string;
  };
  footnote?: string;
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  className?: string;
  iconClassName?: string;
  children?: ReactNode;
}

const variantStyles = {
  default: {
    card: "border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-border transition-all",
    icon: "text-muted-foreground",
    iconBg: "bg-muted/60 backdrop-blur-sm",
    glow: "bg-muted",
  },
  primary: {
    card: "border-primary/30 bg-gradient-to-br from-primary/8 via-primary/5 to-card/50 backdrop-blur-sm hover:from-primary/12 hover:to-primary/8 hover:border-primary/40 transition-all",
    icon: "text-primary",
    iconBg: "bg-primary/15 backdrop-blur-sm",
    glow: "bg-primary",
  },
  success: {
    card: "border-green-500/30 bg-gradient-to-br from-green-500/8 via-green-500/5 to-card/50 backdrop-blur-sm hover:from-green-500/12 hover:to-green-500/8 hover:border-green-500/40 transition-all",
    icon: "text-green-600 dark:text-green-400",
    iconBg: "bg-green-500/15 backdrop-blur-sm",
    glow: "bg-green-500",
  },
  warning: {
    card: "border-yellow-500/30 bg-gradient-to-br from-yellow-500/8 via-yellow-500/5 to-card/50 backdrop-blur-sm hover:from-yellow-500/12 hover:to-yellow-500/8 hover:border-yellow-500/40 transition-all",
    icon: "text-yellow-600 dark:text-yellow-400",
    iconBg: "bg-yellow-500/15 backdrop-blur-sm",
    glow: "bg-yellow-500",
  },
  destructive: {
    card: "border-red-500/30 bg-gradient-to-br from-red-500/8 via-red-500/5 to-card/50 backdrop-blur-sm hover:from-red-500/12 hover:to-red-500/8 hover:border-red-500/40 transition-all",
    icon: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-500/15 backdrop-blur-sm",
    glow: "bg-red-500",
  },
};

export function MetricCard({
  title,
  value,
  description,
  subtitle,
  badge,
  icon: Icon,
  trend,
  progress,
  footnote,
  variant = "default",
  className,
  iconClassName,
  children,
}: MetricCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1",
        styles.card,
        className
      )}
    >
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={cn(
                "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110",
                styles.iconBg
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 rounded-xl opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60",
                  styles.glow
                )}
              />
              <Icon
                className={cn(
                  "h-6 w-6 relative z-10 transition-all duration-300 group-hover:scale-110",
                  styles.icon,
                  iconClassName
                )}
              />
            </div>
            <div className="flex-1 min-w-0 pt-0.5 space-y-1">
              <p className="text-sm font-semibold text-muted-foreground leading-tight">
                {title}
              </p>
              {subtitle && (
                <p className="text-xs text-muted-foreground/80 leading-tight">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {badge && (
            <span className="inline-flex items-center rounded-full border border-border/60 bg-background/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {badge}
            </span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline gap-2.5">
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {value}
            </p>
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                  trend.isPositive
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                )}
              >
                <span>{trend.isPositive ? "↑" : "↓"}</span>
                {Math.abs(trend.value)}%
                {trend.label ? <span className="ml-1 opacity-70">{trend.label}</span> : null}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground/80 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progress.label || "Progress"}</span>
              <span>{Math.round(progress.value)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  styles.glow
                )}
                style={{ width: `${Math.min(100, Math.max(0, progress.value))}%` }}
              />
            </div>
          </div>
        )}

        {children && <div className="pt-2">{children}</div>}

        {footnote && (
          <p className="text-xs text-muted-foreground/70">{footnote}</p>
        )}

        {/* Enhanced decorative gradient overlay */}
        <div
          className={cn(
            "absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-2xl transition-all duration-500 group-hover:opacity-30 group-hover:scale-150",
            styles.glow
          )}
        />
        <div
          className={cn(
            "absolute -left-8 -bottom-8 h-24 w-24 rounded-full opacity-0 blur-xl transition-all duration-500 group-hover:opacity-20 group-hover:scale-125",
            styles.glow
          )}
        />
      </CardContent>
    </Card>
  );
}
