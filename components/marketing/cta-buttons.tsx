"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sizeClass =
  "h-11 rounded-full px-5 text-sm font-semibold transition-all duration-200 sm:h-12 sm:px-7 sm:text-base";
const primaryClass =
  "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md";
const secondaryClass =
  "border border-primary/30 bg-background/80 text-foreground hover:bg-primary/5 hover:border-primary";

interface CTAButtonProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  size?: "default" | "sm" | "lg";
}

export function CTAButton({
  href,
  children,
  variant = "primary",
  className,
  size = "lg",
}: CTAButtonProps) {
  return (
    <Button
      asChild
      size={size}
      variant={variant === "primary" ? "default" : "outline"}
      className={cn(
        sizeClass,
        variant === "primary" && primaryClass,
        variant === "secondary" && secondaryClass,
        className
      )}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}
