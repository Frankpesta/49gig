"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface FlipWordsProps {
  words: string[];
  duration?: number;
  className?: string;
}

/**
 * Flips through words with a CSS crossfade — no framer-motion dependency.
 * Uses fixed-width container so no layout shift occurs.
 */
export function FlipWords({
  words,
  duration = 2500,
  className,
}: FlipWordsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setVisible(true);
      }, 220);
    }, duration);
    return () => clearInterval(interval);
  }, [words.length, duration]);

  const longestWordLength = words.reduce((max, word) => Math.max(max, word.length), 0);
  const containerWidth = longestWordLength + 2;

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
      <span
        className="inline-block whitespace-nowrap transition-opacity duration-200 ease-out"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {words[currentIndex]}
      </span>
    </span>
  );
}
