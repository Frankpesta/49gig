"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DotPattern } from "@/components/ui/dot-pattern";
import { Camera, Mail, Pencil } from "lucide-react";
import { PLATFORM_CATEGORIES } from "@/lib/platform-skills";

interface ProfileCardProps {
  name: string;
  email: string;
  role: string;
  imageUrl?: string;
  techField?: string;
  experienceLevel?: string;
  availability?: string;
  averageRating?: number;
  reviewCount?: number;
  onPhotoChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading?: boolean;
  isEditMode?: boolean;
  onEditClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

const ROLE_LABELS: Record<string, string> = {
  client: "Client",
  freelancer: "Freelancer",
  moderator: "Moderator",
  admin: "Admin",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  junior: "Junior",
  mid: "Mid-Level",
  senior: "Senior",
  expert: "Expert",
};

function getPrimaryRoleLabel(techField?: string): string {
  if (!techField) return "";
  const cat = PLATFORM_CATEGORIES.find((c) => c.id === techField);
  return cat?.label ?? techField.replace(/_/g, " ");
}

export function ProfileCard({
  name,
  email,
  role,
  imageUrl,
  techField,
  experienceLevel,
  availability,
  averageRating,
  reviewCount,
  onPhotoChange,
  isUploading,
  isEditMode,
  onEditClick,
  children,
  className,
}: ProfileCardProps) {
  const primaryRole = getPrimaryRoleLabel(techField);
  const experienceLabel = experienceLevel ? EXPERIENCE_LABELS[experienceLevel] : null;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/20",
        className
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-primary/10" />
      <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent" />

      {/* Dot pattern overlay */}
      <DotPattern className="absolute inset-0 opacity-30 mask-[radial-gradient(ellipse_at_center,transparent_0%,black_70%)]" />

      {/* Content */}
      <div className="relative z-10 p-8 pb-6">
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-8">
          {/* Avatar with ring */}
          <div className="relative shrink-0">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-linear-to-r from-primary/40 via-primary/20 to-primary/40 opacity-60 blur-sm transition-opacity group-hover:opacity-80" />
                <Avatar className="relative h-28 w-28 rounded-full border-4 border-background shadow-xl ring-2 ring-primary/30">
                  <AvatarImage src={imageUrl} alt={name} />
                  <AvatarFallback className="bg-linear-to-br from-primary/20 to-primary/40 text-primary text-3xl font-semibold">
                    {name?.slice(0, 2).toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
              {onPhotoChange && isEditMode && (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={isUploading}
                    onChange={onPhotoChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-full border-primary/30 bg-background/80 backdrop-blur-sm hover:bg-primary/10"
                    asChild
                  >
                    <span>
                      {isUploading ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      {isUploading ? "Uploading…" : "Upload photo"}
                    </span>
                  </Button>
                </label>
              )}
              {isEditMode && onPhotoChange && (
                <p className="text-xs text-muted-foreground">JPEG or PNG, max 2MB</p>
              )}
            </div>
          </div>

          {/* Profile info */}
          <div className="mt-6 flex-1 sm:mt-0 sm:min-w-0">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge
                variant="secondary"
                className="rounded-full px-3 py-1 text-xs font-medium capitalize"
              >
                {ROLE_LABELS[role] ?? role}
              </Badge>
              {primaryRole && (
                <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                  {primaryRole}
                </Badge>
              )}
              {experienceLabel && (
                <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                  {experienceLabel}
                </Badge>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              {name || "Anonymous"}
            </h1>
            <div className="mt-2 flex flex-col items-center gap-1 sm:items-start">
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="h-4 w-4" />
                {email}
              </a>
              {averageRating !== undefined && reviewCount !== undefined && reviewCount > 0 && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {averageRating.toFixed(1)}/5
                  </span>
                  <span>{reviewCount} review{reviewCount !== 1 ? "s" : ""}</span>
                </div>
              )}
              {availability && (
                <span className="text-xs text-muted-foreground capitalize">
                  {availability.replace("_", " ")}
                </span>
              )}
            </div>
            {onEditClick && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 gap-2 rounded-lg"
                onClick={onEditClick}
              >
                <Pencil className="h-4 w-4" />
                {isEditMode ? "Cancel" : "Edit"}
              </Button>
            )}
            {isEditMode && children && (
              <div className="mt-6 w-full max-w-md self-start text-left">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
