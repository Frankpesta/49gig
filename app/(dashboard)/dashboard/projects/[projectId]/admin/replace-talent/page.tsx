"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  ShieldCheck,
  UserSearch,
} from "lucide-react";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";
import {
  humanizeTeamRoleKey,
  PLATFORM_CATEGORIES,
} from "@/lib/platform-skills";

const EXPERIENCE_LABELS: Record<string, string> = {
  junior: "Junior",
  mid: "Mid-Level",
  senior: "Senior",
  expert: "Expert",
};

function techFieldLabel(techField?: string): string {
  if (!techField) return "—";
  const cat = PLATFORM_CATEGORIES.find((c) => c.id === techField);
  return cat?.label ?? techField.replace(/_/g, " ");
}

type ScoringBreakdown = {
  skillOverlap: number;
  vettingScore: number;
  ratings: number;
  availability: number;
  pastPerformance: number;
  timezoneCompatibility: number;
};

type ReplacementCandidate = {
  _id: Id<"users">;
  name: string;
  email: string;
  primaryRole?: string;
  experienceLevel?: string;
  skills: string[];
  skillOverlap: number;
  score: number;
  confidence: "low" | "medium" | "high";
  explanation: string;
  scoringBreakdown: ScoringBreakdown;
  techField?: string;
  softwareDevFields?: string[];
  bio?: string;
  resumeBio?: string;
  timezone?: string;
  country?: string;
  availability?: string;
  weeklyHours?: number;
  languagesWritten?: string[];
  imageUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  behanceUrl?: string;
  linkedinUrl?: string;
  resumeUrl?: string;
  verificationStatus?: string;
  kycStatus?: string;
  vettingOverallScore?: number;
  vettingStatus?: string;
};

type ReplacementResponse = {
  candidates: ReplacementCandidate[];
  hasMore: boolean;
  replacingSeatLabel?: string;
};

function isValidConvexProjectId(id: string | string[] | undefined): id is Id<"projects"> {
  if (typeof id !== "string") return false;
  if (id.length === 0 || id.length > 100) return false;
  return /^[a-zA-Z][a-zA-Z0-9]*$/.test(id);
}

export default function AdminReplaceTalentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isInitializing } = useAuth();
  const projectIdParam = params.projectId;
  const projectId = isValidConvexProjectId(projectIdParam)
    ? (projectIdParam as Id<"projects">)
    : null;

  const [oldFreelancerId, setOldFreelancerId] = useState("");
  const [newFreelancerId, setNewFreelancerId] = useState("");
  const [replaceReason, setReplaceReason] = useState("");
  const [listLimit, setListLimit] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerFreelancerId, setDrawerFreelancerId] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  const project = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- projects path not in narrow generated surface
    (api as any)["projects/queries"].getProject,
    user?._id && projectId ? { projectId, userId: user._id } : "skip"
  );

  const replacementData = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api as any)["projects/queries"].getAdminReplacementCandidates,
    user?.role === "admin" && user?._id && projectId && oldFreelancerId
      ? {
          projectId,
          userId: user._id,
          oldFreelancerId: oldFreelancerId as Id<"users">,
          limit: listLimit,
        }
      : "skip"
  );

  const adminReplaceFreelancer = useMutation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api as any)["projects/mutations"].adminReplaceFreelancer
  );

  const assignedFreelancers = useMemo((): Array<{
    _id: Id<"users">;
    name: string;
    teamRole?: string;
  }> => {
    if (!project) return [];
    const confirmed =
      (
        project as {
          confirmedTeamMembers?: Array<{ _id: Id<"users">; name: string; teamRole?: string }>;
        }
      ).confirmedTeamMembers ?? [];
    if (confirmed.length > 0) return confirmed;
    const f = project.freelancer;
    return f ? [{ _id: f._id, name: f.name }] : [];
  }, [project]);

  const qpOld = searchParams.get("oldFreelancerId");

  useEffect(() => {
    if (qpOld && assignedFreelancers.some((f) => String(f._id) === qpOld)) {
      setOldFreelancerId(qpOld);
    }
  }, [qpOld, assignedFreelancers]);

  useEffect(() => {
    if (oldFreelancerId || assignedFreelancers.length !== 1) return;
    setOldFreelancerId(String(assignedFreelancers[0]!._id));
  }, [assignedFreelancers, oldFreelancerId]);

  const resetNewSelection = useCallback(() => {
    setNewFreelancerId("");
    setDrawerFreelancerId(null);
    setDrawerOpen(false);
  }, []);

  useEffect(() => {
    if (!oldFreelancerId) return;
    setListLimit(10);
    resetNewSelection();
  }, [oldFreelancerId, resetNewSelection]);

  const candidates = (replacementData as ReplacementResponse | undefined)?.candidates ?? [];
  const hasMore = (replacementData as ReplacementResponse | undefined)?.hasMore ?? false;
  const replacingSeatLabel = (replacementData as ReplacementResponse | undefined)?.replacingSeatLabel;

  const drawerCandidate = useMemo(
    () =>
      drawerFreelancerId
        ? candidates.find((c) => String(c._id) === drawerFreelancerId) ?? null
        : null,
    [candidates, drawerFreelancerId]
  );

  const handleReplace = async () => {
    if (!projectId || !user?._id || user.role !== "admin") return;
    if (!oldFreelancerId || !newFreelancerId) {
      toast.error("Select the current freelancer and replacement.");
      return;
    }
    if (!replaceReason.trim()) {
      toast.error("Enter a replacement reason.");
      return;
    }
    setIsReplacing(true);
    try {
      await adminReplaceFreelancer({
        projectId,
        userId: user._id,
        oldFreelancerId: oldFreelancerId as Id<"users">,
        replacementFreelancerId: newFreelancerId as Id<"users">,
        reason: replaceReason.trim(),
      });
      toast.success("Talent replaced and assigned immediately");
      router.push(`/dashboard/projects/${projectId}`);
      router.refresh();
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Could not replace talent");
    } finally {
      setIsReplacing(false);
    }
  };

  if (isInitializing || !user) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted-foreground">You don&apos;t have access to this page.</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <p className="text-sm text-destructive">Invalid project link.</p>
      </div>
    );
  }

  if (project === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <p className="text-sm text-muted-foreground">Project not found.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/dashboard/projects">Back to projects</Link>
        </Button>
      </div>
    );
  }

  const canReplace =
    project.status === "matched" || project.status === "in_progress";

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 pb-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link href={`/dashboard/projects/${projectId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to hire
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/40">
              <UserSearch className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle>Replace assigned talent</CardTitle>
              <CardDescription>
                The selected freelancer is removed immediately, their future release is paused, and the replacement
                is assigned now. Rankings use the same composite match score as automated matching.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!canReplace ? (
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Replacement is only available when the hire is matched or in progress.
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="old-seat">Current freelancer</Label>
            <select
              id="old-seat"
              value={oldFreelancerId}
              onChange={(e) => {
                setOldFreelancerId(e.target.value);
              }}
              className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select freelancer to replace</option>
              {assignedFreelancers.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                  {f.teamRole ? ` — ${f.teamRole}` : ""}
                </option>
              ))}
            </select>
            {replacingSeatLabel ? (
              <p className="text-xs text-muted-foreground">
                Matching scoped to seat: <span className="font-medium text-foreground">{replacingSeatLabel}</span>
              </p>
            ) : null}
          </div>

          {!oldFreelancerId ? (
            <p className="text-sm text-muted-foreground">
              Choose who is being replaced to load ranked candidates.
            </p>
          ) : replacementData === undefined ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              Loading candidates…
            </div>
          ) : candidates.length === 0 ? (
            <p className="text-sm text-amber-700 dark:text-amber-400">
              No eligible replacements match this hire&apos;s filters. Use{" "}
              <Link href="/dashboard/admin/manual-match" className="font-medium underline">
                manual match
              </Link>{" "}
              if you need to assign someone outside this pool.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border/80">
              {candidates.map((c) => (
                <li key={c._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{c.name}</p>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {Math.round(c.score)} match
                      </Badge>
                      <Badge variant="outline" className="text-xs font-normal capitalize">
                        {c.confidence}
                      </Badge>
                    </div>
                    <p className="break-all text-xs text-muted-foreground">{c.email}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.explanation}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDrawerFreelancerId(String(c._id));
                        setDrawerOpen(true);
                      }}
                    >
                      See more
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={newFreelancerId === String(c._id) ? "default" : "secondary"}
                      onClick={() => setNewFreelancerId(String(c._id))}
                    >
                      {newFreelancerId === String(c._id) ? "Selected" : "Select"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {oldFreelancerId && hasMore ? (
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setListLimit((n) => Math.min(n + 10, 100))}
            >
              Load more
            </Button>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="replace-reason">Reason</Label>
            <Textarea
              id="replace-reason"
              value={replaceReason}
              onChange={(e) => setReplaceReason(e.target.value)}
              placeholder="Explain why this replacement is being made"
              className="min-h-24"
            />
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
            <Button
              type="button"
              onClick={() => void handleReplace()}
              disabled={isReplacing || !canReplace || !oldFreelancerId || !newFreelancerId}
            >
              {isReplacing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Replace now
            </Button>
          </div>
        </CardContent>
      </Card>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="right"
          className="flex h-[100dvh] w-full max-w-full flex-col gap-0 overflow-y-auto border-l p-0 sm:h-full sm:max-w-md"
        >
          {drawerCandidate ? (
            <>
              <SheetHeader className="border-border/80 border-b p-4 text-left">
                <SheetTitle className="pr-8">{drawerCandidate.name}</SheetTitle>
                <SheetDescription className="break-all">{drawerCandidate.email}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 p-4">
                <div className="flex gap-3">
                  <Avatar className="h-14 w-14 border border-border/60">
                    <AvatarImage src={drawerCandidate.imageUrl} alt={drawerCandidate.name} />
                    <AvatarFallback>{drawerCandidate.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-xs font-normal">
                        Score {Math.round(drawerCandidate.score)} · {drawerCandidate.confidence}
                      </Badge>
                      {drawerCandidate.primaryRole && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {drawerCandidate.primaryRole}
                        </Badge>
                      )}
                      {drawerCandidate.experienceLevel && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {EXPERIENCE_LABELS[drawerCandidate.experienceLevel] ?? drawerCandidate.experienceLevel}
                        </Badge>
                      )}
                      {typeof drawerCandidate.vettingOverallScore === "number" && (
                        <Badge variant="outline" className="text-xs font-normal">
                          Vetting {Math.round(drawerCandidate.vettingOverallScore)}
                        </Badge>
                      )}
                      {drawerCandidate.verificationStatus === "approved" && (
                        <Badge variant="secondary" className="gap-0.5 text-xs font-normal">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{drawerCandidate.explanation}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
                  <p className="font-medium text-foreground">Score breakdown</p>
                  <ul className="mt-2 grid gap-1 text-muted-foreground sm:grid-cols-2">
                    <li>Skills {Math.round(drawerCandidate.scoringBreakdown.skillOverlap)}%</li>
                    <li>Vetting {Math.round(drawerCandidate.scoringBreakdown.vettingScore)}</li>
                    <li>Ratings {Math.round(drawerCandidate.scoringBreakdown.ratings)}</li>
                    <li>Availability {Math.round(drawerCandidate.scoringBreakdown.availability)}</li>
                    <li>Past performance {Math.round(drawerCandidate.scoringBreakdown.pastPerformance)}</li>
                    <li>Timezone {Math.round(drawerCandidate.scoringBreakdown.timezoneCompatibility)}</li>
                  </ul>
                </div>

                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <p>
                    <span className="font-medium text-foreground">Category: </span>
                    {techFieldLabel(drawerCandidate.techField)}
                  </p>
                  {drawerCandidate.softwareDevFields && drawerCandidate.softwareDevFields.length > 0 && (
                    <p>
                      <span className="font-medium text-foreground">Sub-field: </span>
                      {drawerCandidate.softwareDevFields.map((k) => humanizeTeamRoleKey(k)).join(", ")}
                    </p>
                  )}
                  {[drawerCandidate.country, drawerCandidate.timezone].filter(Boolean).length > 0 && (
                    <p className="sm:col-span-2">
                      <span className="font-medium text-foreground">Location / TZ: </span>
                      {[drawerCandidate.country, drawerCandidate.timezone].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {drawerCandidate.availability && (
                    <p>
                      <span className="font-medium text-foreground">Availability: </span>
                      {drawerCandidate.availability.replace(/_/g, " ")}
                    </p>
                  )}
                  {typeof drawerCandidate.weeklyHours === "number" && (
                    <p>
                      <span className="font-medium text-foreground">Weekly hours: </span>
                      {drawerCandidate.weeklyHours}
                    </p>
                  )}
                </div>

                {(drawerCandidate.bio || drawerCandidate.resumeBio) && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-foreground">Bio</p>
                    <p className="max-h-40 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                      {(drawerCandidate.bio || drawerCandidate.resumeBio || "").trim()}
                    </p>
                  </div>
                )}

                {drawerCandidate.skills.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-foreground">Skills</p>
                    <div className="flex max-h-28 flex-wrap gap-1 overflow-y-auto rounded-md border border-border/50 p-2">
                      {drawerCandidate.skills.map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px] font-normal">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/users/${drawerCandidate._id}`} target="_blank" rel="noopener noreferrer">
                      Full profile
                      <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setNewFreelancerId(String(drawerCandidate._id));
                      setDrawerOpen(false);
                    }}
                  >
                    Use as replacement
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
