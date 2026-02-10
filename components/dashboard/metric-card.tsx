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
        "group relative overflow-hidden border transition-all duration-500 hover:shadow-lg md:hover:shadow-2xl hover:shadow-primary/10 md:hover:-translate-y-1",
        styles.card,
        className
      )}
    >
      <CardContent className="p-3.5 sm:p-4 md:p-6 space-y-3.5 md:space-y-5">
        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
            <div
              className={cn(
                "relative flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-all duration-300 group-hover:scale-110",
                styles.iconBg
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 rounded-lg sm:rounded-xl opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60",
                  styles.glow
                )}
              />
              <Icon
                className={cn(
                  "h-5 w-5 sm:h-6 sm:w-6 relative z-10 transition-all duration-300 group-hover:scale-110",
                  styles.icon,
                  iconClassName
                )}
              />
            </div>
            <div className="flex-1 min-w-0 pt-0.5 space-y-0.5 sm:space-y-1">
              <p className="text-xs sm:text-sm font-semibold text-muted-foreground leading-tight truncate">
                {title}
              </p>
              {subtitle && (
                <p className="text-xs text-muted-foreground/80 leading-tight truncate">
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

        <div className="space-y-0.5 sm:space-y-1">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
              {value}
            </p>
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold whitespace-nowrap flex-shrink-0",
                  trend.isPositive
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                )}
              >
                <span>{trend.isPositive ? "↑" : "↓"}</span>
                {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground/80 leading-relaxed line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {progress && (
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="truncate">{progress.label || "Progress"}</span>
              <span className="flex-shrink-0 ml-2">{Math.round(progress.value)}%</span>
            </div>
            <div className="h-1.5 sm:h-2 w-full rounded-full bg-muted/40 overflow-hidden">
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

        {children && <div className="pt-1.5 sm:pt-2">{children}</div>}

        {footnote && (
          <p className="text-xs text-muted-foreground/70 line-clamp-2">{footnote}</p>
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
