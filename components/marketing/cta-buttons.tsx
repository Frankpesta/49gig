"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sizeClass = "h-12 px-8 rounded-lg text-base font-semibold";
const secondaryClass =
  "border-2 border-primary/30 hover:bg-primary/5 hover:border-primary";

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
        variant === "secondary" && secondaryClass,
        className
      )}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}
