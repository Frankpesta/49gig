"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StatItem {
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface InteractiveStatsProps {
  stats: StatItem[];
  className?: string;
  variant?: "default" | "card" | "minimal";
}

export function InteractiveStats({
  stats,
  className,
  variant = "default",
}: InteractiveStatsProps) {
  const [animatedValues, setAnimatedValues] = useState<number[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById("stats-section");
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible) {
      const timers = stats.map((stat, index) => {
        // Extract numeric value from stat.value (handle formats like "10,000+", "95%")
        const numericValue = parseFloat(stat.value.replace(/[^\d.]/g, "")) || 0;
        const isPercentage = stat.value.includes("%");
        const hasPlus = stat.value.includes("+");

        return setTimeout(() => {
          setAnimatedValues(prev => {
            const newValues = [...prev];
            newValues[index] = numericValue;
            return newValues;
          });
        }, index * 200);
      });

      return () => timers.forEach(clearTimeout);
    }
  }, [isVisible, stats]);

  const formatValue = (value: number, original: string) => {
    const isPercentage = original.includes("%");
    const hasPlus = original.includes("+");
    const hasComma = original.includes(",");

    let formatted = value.toString();

    if (hasComma && value >= 1000) {
      formatted = value.toLocaleString();
    }

    if (isPercentage) formatted += "%";
    if (hasPlus) formatted += "+";

    return formatted;
  };

  const variantClasses = {
    default: "text-center",
    card: "grid gap-6 sm:grid-cols-2 lg:grid-cols-4",
    minimal: "flex flex-wrap justify-center gap-8",
  };

  const statItemClasses = {
    default: "space-y-2",
    card: "rounded-lg border border-border/50 bg-background/50 p-6 text-center backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg",
    minimal: "text-center",
  };

  return (
    <div id="stats-section" className={cn(variantClasses[variant], className)}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const animatedValue = animatedValues[index] || 0;
        const displayValue = isVisible ? formatValue(animatedValue, stat.value) : "0";

        return (
          <div key={index} className={statItemClasses[variant]}>
            {Icon && (
              <div className="flex justify-center mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <div className={cn(
                "font-bold transition-all duration-1000 ease-out",
                variant === "default" ? "text-3xl lg:text-4xl text-foreground" : "text-2xl lg:text-3xl text-primary"
              )}>
                {stat.prefix && <span className="text-muted-foreground">{stat.prefix}</span>}
                <span className={cn(
                  "tabular-nums",
                  isVisible && "animate-in fade-in-50"
                )}>
                  {displayValue}
                </span>
                {stat.suffix && <span className="text-muted-foreground">{stat.suffix}</span>}
              </div>
              <div className={cn(
                "transition-colors duration-300",
                variant === "default" ? "text-sm text-muted-foreground" : "text-sm text-muted-foreground"
              )}>
                {stat.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}