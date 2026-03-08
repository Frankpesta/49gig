"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FlipWordsProps {
  words: string[];
  duration?: number;
  className?: string;
}

/**
 * Flips through words with a crossfade. Uses fixed-width container
 * so no layout shift occurs (fixes iPhone page shake).
 */
export function FlipWords({
  words,
  duration = 2500,
  className,
}: FlipWordsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, duration);
    return () => clearInterval(interval);
  }, [words.length, duration]);

  const longestWordLength = words.reduce((max, word) => Math.max(max, word.length), 0);
  const containerWidth = longestWordLength + 2; // +2 for comfortable spacing so all words show fully

  return (
    <span
      className={cn("inline-block align-baseline leading-normal", className)}
      style={{
        width: `${containerWidth}ch`,
        minWidth: `${containerWidth}ch`,
        contain: "layout",
        overflow: "visible",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="inline-block whitespace-nowrap"
        >
          {words[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
