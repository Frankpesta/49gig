"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Complex Bento Grid - editorial-style asymmetric layouts
 * Varied card sizes: hero (2x2), tall (1x2), wide (2x1), square (1x1)
 * Uses dense flow + varied row heights for organic, magazine-style feel
 */

export interface BentoGridProps {
  className?: string;
  children?: ReactNode;
  /** 2 | 3 columns on lg - 3 gives the editorial bento feel */
  columns?: 2 | 3 | 4;
  /** "complex" = varied row heights + dense flow for editorial feel */
  variant?: "default" | "complex";
  autoRows?: boolean;
}

export const BentoGrid = ({
  className,
  children,
  columns = 3,
  variant = "complex",
  autoRows,
}: BentoGridProps) => {
  const isComplex = variant === "complex";

  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-3 p-4",
        "md:grid-cols-2 md:gap-4 md:p-6",
        "lg:gap-4",
        columns === 2 && "lg:grid-cols-2",
        columns === 3 && "lg:grid-cols-3",
        columns === 4 && "lg:grid-cols-3",
        // Complex: denser rows + dense flow for editorial bento feel
        isComplex && [
          "lg:auto-rows-[minmax(180px,1fr)]",
          "lg:grid-flow-dense",
        ],
        !isComplex && "grid-auto-rows-[minmax(200px,1fr)]",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  children,
  size = "default",
}: {
  className?: string;
  title?: string | ReactNode;
  description?: string | ReactNode;
  header?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  size?: "large" | "tall" | "medium" | "small" | "default";
}) => {
  const paddingClass =
    size === "large"
      ? "p-6 md:p-8 lg:p-10"
      : size === "tall"
        ? "p-5 md:p-6 lg:p-8"
        : size === "medium"
          ? "p-5 md:p-6"
          : "p-4 md:p-5";

  return (
    <div
      className={cn(
        "group/bento flex min-h-0 flex-col justify-between rounded-2xl border border-border/50 bg-card shadow-sm transition duration-200",
        "hover:border-primary/30 hover:shadow-xl dark:border-white/20",
        paddingClass,
        className
      )}
    >
      {children ? (
        children
      ) : (
        <>
          {header}
          <div className="transition duration-200 group-hover/bento:translate-x-1">
            {icon}
            <div className="mt-2 font-sans font-bold text-foreground">{title}</div>
            <div className="mt-2 font-sans text-sm font-normal text-muted-foreground">
              {description}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/** BentoCard - supports colSpan, rowSpan, and optional explicit grid placement */
export interface BentoCardProps {
  children: ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3;
  rowSpan?: 1 | 2 | 3;
  /** Explicit placement for complex layouts - e.g. { col: 1, row: 1 } */
  placement?: { col: number; row: number };
}

export function BentoCard({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
  placement,
}: BentoCardProps) {
  const spanClass = cn(
    "col-span-1 row-span-1",
    colSpan === 2 && "md:col-span-2",
    colSpan === 3 && "lg:col-span-3",
    rowSpan === 2 && "md:row-span-2",
    rowSpan === 3 && "md:row-span-3"
  );

  const size =
    colSpan >= 2 && rowSpan >= 2
      ? "large"
      : rowSpan >= 2 && colSpan === 1
        ? "tall"
        : colSpan >= 2 || rowSpan >= 2
          ? "medium"
          : "small";

  const paddingClass =
    size === "large"
      ? "p-6 md:p-8 lg:p-10"
      : size === "tall"
        ? "p-5 md:p-6 lg:p-8"
        : size === "medium"
          ? "p-5 md:p-6"
          : "p-4 md:p-5";

  // Placement only on lg+ to avoid breaking 1-col mobile layout
  const placementStyle = placement
    ? ({
        "--bento-col": `${placement.col} / span ${colSpan}`,
        "--bento-row": `${placement.row} / span ${rowSpan}`,
      } as React.CSSProperties)
    : undefined;

  return (
    <div
      className={cn(
        "group/bento flex min-h-0 flex-col justify-between rounded-2xl border border-border/50 bg-card shadow-sm transition duration-200",
        "hover:border-primary/30 hover:shadow-xl dark:border-white/20",
        paddingClass,
        spanClass,
        placement && "lg:![grid-column:var(--bento-col)] lg:![grid-row:var(--bento-row)]",
        className
      )}
      style={placementStyle}
    >
      {children}
    </div>
  );
}
