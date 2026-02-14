import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeClasses = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-10 w-10 border-[3px]",
};

export function LoadingSpinner({ className, size = "md", label }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={cn(
          "animate-spin rounded-full border-primary border-t-transparent",
          sizeClasses[size],
          className
        )}
      />
      {label && (
        <p className="text-sm text-muted-foreground">{label}</p>
      )}
    </div>
  );
}
