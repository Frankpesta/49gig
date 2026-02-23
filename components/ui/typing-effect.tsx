"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TypingEffectProps {
  words: string[];
  className?: string;
  cursorClassName?: string;
}

export function TypingEffect({
  words,
  className,
  cursorClassName,
}: TypingEffectProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentWord = words[currentWordIndex];
    let timeout: NodeJS.Timeout;

    if (isPaused) {
      timeout = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, 2000);
    } else if (isDeleting) {
      if (currentText.length > 0) {
        timeout = setTimeout(() => {
          setCurrentText(currentText.slice(0, -1));
        }, 50);
      } else {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }
    } else {
      if (currentText.length < currentWord.length) {
        timeout = setTimeout(() => {
          setCurrentText(currentWord.slice(0, currentText.length + 1));
        }, 100);
      } else {
        setIsPaused(true);
      }
    }

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, isPaused, currentWordIndex, words]);

  const longestWordLength = words.reduce((max, word) => Math.max(max, word.length), 0);

  return (
    <span
      className={cn("inline-flex items-baseline", className)}
      style={{
        width: `${longestWordLength + 1}ch`,
        minWidth: `${longestWordLength + 1}ch`,
        contain: "layout",
        overflow: "hidden",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
      }}
    >
      <span className="inline-block shrink-0 whitespace-nowrap align-baseline">{currentText}</span>
      <span
        className={cn("inline-block shrink-0 align-baseline h-5 w-0.5 animate-caret-blink bg-current", cursorClassName)}
      />
    </span>
  );
}

