"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
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
  icon: Icon,
  trend,
  variant = "default",
  className,
  iconClassName,
  children,
}: MetricCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5",
        styles.card,
        className
      )}
    >
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                styles.iconBg
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  styles.icon,
                  iconClassName
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground leading-tight">
                {title}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline gap-2.5">
            <p className="text-2xl font-bold tracking-tight text-foreground">
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
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {children && <div className="pt-2">{children}</div>}

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
