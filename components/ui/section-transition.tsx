"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionTransitionProps {
  children: ReactNode;
  className?: string;
  variant?: "fade" | "slide" | "scale" | "stagger";
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
}

export function SectionTransition({
  children,
  className,
  variant = "fade",
  direction = "up",
  delay = 0,
}: SectionTransitionProps) {
  const baseClasses = "transition-all duration-700 ease-out";

  const variantClasses = {
    fade: "opacity-0 animate-in fade-in-50",
    slide: cn(
      "opacity-0 animate-in",
      {
        "slide-in-from-bottom": direction === "up",
        "slide-in-from-top": direction === "down",
        "slide-in-from-left": direction === "right",
        "slide-in-from-right": direction === "left",
      }
    ),
    scale: "opacity-0 animate-in fade-in-50 scale-95 hover:scale-100",
    stagger: "opacity-0 animate-in fade-in-50",
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      {children}
    </div>
  );
}

// Staggered container for multiple children
interface StaggeredContainerProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
  variant?: "fade" | "slide" | "scale";
}

export function StaggeredContainer({
  children,
  className,
  staggerDelay = 150,
  variant = "fade",
}: StaggeredContainerProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <SectionTransition
          key={index}
          variant={variant}
          delay={index * staggerDelay}
        >
          {child}
        </SectionTransition>
      ))}
    </div>
  );
}