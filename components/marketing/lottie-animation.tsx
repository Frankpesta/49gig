"use client";

import * as React from "react";
import { useRef } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { cn } from "@/lib/utils";

interface LottieAnimationProps {
  animationData?: unknown;
  animationUrl?: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}

export function LottieAnimation({
  animationData,
  animationUrl,
  className,
  loop = true,
  autoplay = true,
}: LottieAnimationProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  // For URL-based animations, fetch the JSON
  const [urlAnimationData, setUrlAnimationData] = React.useState<unknown>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (animationUrl && !animationData) {
      setIsLoading(true);
      fetch(animationUrl)
        .then((res) => res.json())
        .then((data) => {
          setUrlAnimationData(data);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [animationUrl, animationData]);

  // If no animation data or URL is provided, show a placeholder
  if (!animationData && !animationUrl && !urlAnimationData) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-gradient-to-br from-primary/5 to-primary/10",
          className
        )}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-24 w-24 animate-pulse rounded-full bg-primary/20" />
          <p className="text-xs text-foreground/60">Animation placeholder</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-gradient-to-br from-primary/5 to-primary/10",
          className
        )}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-24 w-24 animate-pulse rounded-full bg-primary/20" />
          <p className="text-xs text-foreground/60">Loading animation...</p>
        </div>
      </div>
    );
  }

  const finalAnimationData = animationData || urlAnimationData;

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Lottie
        lottieRef={lottieRef}
        animationData={finalAnimationData}
        loop={loop}
        autoplay={autoplay}
        className="h-full w-full"
      />
    </div>
  );
}

