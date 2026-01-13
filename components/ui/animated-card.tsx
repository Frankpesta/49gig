"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  variant?: "default" | "gradient" | "glass";
}

export function AnimatedCard({
  children,
  className,
  hover = true,
  delay = 0,
  variant = "default",
}: AnimatedCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const baseClasses = "transition-all duration-300 ease-out";

  const variantClasses = {
    default: "border border-border/50 hover:border-primary/50 hover:shadow-xl",
    gradient: "border border-primary/20 hover:border-primary/50 hover:shadow-2xl bg-gradient-to-br from-background to-primary/5",
    glass: "border border-border/20 bg-background/80 backdrop-blur-sm hover:bg-background/90 hover:shadow-lg",
  };

  const hoverClasses = hover
    ? "hover:-translate-y-1 hover:shadow-2xl hover:scale-[1.02]"
    : "";

  return (
    <Card
      className={cn(
        baseClasses,
        variantClasses[variant],
        hoverClasses,
        "group relative overflow-hidden",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle gradient overlay on hover */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-primary/0 to-secondary/0 transition-opacity duration-300",
        isHovered && "from-primary/5 to-secondary/5"
      )} />

      {/* Animated border */}
      <div className={cn(
        "absolute inset-0 rounded-lg transition-opacity duration-300",
        "bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20",
        "opacity-0 group-hover:opacity-100",
        "p-[1px]"
      )}>
        <div className="w-full h-full bg-background rounded-lg" />
      </div>

      <CardContent className="relative z-10 p-6">
        {children}
      </CardContent>
    </Card>
  );
}