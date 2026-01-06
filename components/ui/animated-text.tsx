"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionTemplate, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
}

export function AnimatedText({
  text,
  className,
  delay = 0,
  duration = 0.5,
}: AnimatedTextProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={isVisible ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }}
        transition={{
          duration,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {text}
      </motion.div>
    </div>
  );
}

interface AnimatedWordsProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
}

export function AnimatedWords({
  text,
  className,
  delay = 0,
  duration = 0.5,
}: AnimatedWordsProps) {
  const words = text.split(" ");
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div ref={ref} className={cn("flex flex-wrap", className)}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          initial={{ y: 100, opacity: 0 }}
          animate={isVisible ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }}
          transition={{
            duration,
            delay: delay + index * 0.05,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block"
        >
          {word}
          {index < words.length - 1 && "\u00A0"}
        </motion.span>
      ))}
    </div>
  );
}

