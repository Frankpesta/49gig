"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextGenerateEffectProps {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
}

export function TextGenerateEffect({
  words,
  className,
  filter = false,
  duration = 0.5,
}: TextGenerateEffectProps) {
  const [isVisible, setIsVisible] = useState(false);
  const wordsArray = words.split(" ");

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={cn("font-bold", className)}>
      <motion.div
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        className="flex flex-wrap leading-none"
      >
        {wordsArray.map((word, idx) => {
          return (
            <motion.span
              key={`word-${idx}`}
              className="dark:text-white text-black"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                },
              }}
              transition={{
                duration: duration,
                delay: idx * 0.05,
              }}
            >
              {word}
              {idx !== wordsArray.length - 1 && "\u00A0"}
            </motion.span>
          );
        })}
      </motion.div>
    </div>
  );
}

