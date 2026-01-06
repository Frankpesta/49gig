"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GradientTextProps {
  text: string;
  className?: string;
  gradient?: string;
  animate?: boolean;
}

export function GradientText({
  text,
  className,
  gradient = "from-primary via-blue-500 to-purple-500",
  animate = true,
}: GradientTextProps) {
  const content = (
    <span
      className={cn(
        "bg-gradient-to-r bg-clip-text text-transparent",
        gradient,
        className
      )}
    >
      {text}
    </span>
  );

  if (!animate) {
    return content;
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "bg-gradient-to-r bg-clip-text text-transparent",
        gradient,
        className
      )}
    >
      {text}
    </motion.span>
  );
}

