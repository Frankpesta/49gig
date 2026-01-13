"use client";

import { ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowRight } from "lucide-react";

interface HoverButtonProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg";
  showArrow?: boolean;
  arrowType?: "chevron" | "arrow";
  glow?: boolean;
  pulse?: boolean;
  href?: string;
  onClick?: () => void;
}

export const HoverButton = forwardRef<HTMLButtonElement, HoverButtonProps>(
  ({
    children,
    className,
    variant = "default",
    size = "default",
    showArrow = true,
    arrowType = "chevron",
    glow = false,
    pulse = false,
    href,
    onClick,
    ...props
  }, ref) => {
    const ArrowIcon = arrowType === "chevron" ? ChevronRight : ArrowRight;

    const buttonContent = (
      <div className="relative flex items-center gap-2">
        <span className="relative z-10">{children}</span>
        {showArrow && (
          <ArrowIcon className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        )}

        {/* Glow effect */}
        {glow && (
          <div className="absolute inset-0 rounded-md bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}

        {/* Pulse effect */}
        {pulse && (
          <div className="absolute inset-0 rounded-md bg-primary/30 animate-ping opacity-0 group-hover:opacity-75" />
        )}
      </div>
    );

    if (href) {
      return (
        <a
          href={href}
          className={cn(
            "group relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            {
              "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5": variant === "default",
              "border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
              "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
              "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
            },
            {
              "h-9 px-4 py-2": size === "sm",
              "h-10 px-8 py-2": size === "default",
              "h-12 px-8 py-3 text-base": size === "lg",
            },
            className
          )}
        >
          {buttonContent}
        </a>
      );
    }

    return (
      <Button
        ref={ref}
        className={cn(
          "group relative overflow-hidden",
          {
            "shadow-lg hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5": variant === "default",
            "hover:shadow-md": variant === "outline",
            "hover:shadow-sm": variant === "ghost",
          },
          className
        )}
        variant={variant}
        size={size}
        onClick={onClick}
        {...props}
      >
        {buttonContent}
      </Button>
    );
  }
);

HoverButton.displayName = "HoverButton";