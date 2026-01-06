"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BackgroundBeamsProps {
  className?: string;
  particleCount?: number;
}

export function BackgroundBeams({
  className,
  particleCount = 20,
}: BackgroundBeamsProps) {
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
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2,
    }));
    setParticles(newParticles);
  }, [particleCount]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute h-px w-32 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            rotate: Math.random() * 360,
          }}
          animate={{
            y: [0, -100, -200],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

