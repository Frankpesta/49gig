"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SparklesProps {
  className?: string;
  particleCount?: number;
  particleColor?: string;
}

export function Sparkles({
  className,
  particleCount = 20,
  particleColor = "rgb(59, 130, 246)",
}: SparklesProps) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    delay: number;
    duration: number;
  }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
    }));
    setParticles(newParticles);
  }, [particleCount]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute h-1 w-1 rounded-full"
          style={{
            backgroundColor: particleColor,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, -60],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

