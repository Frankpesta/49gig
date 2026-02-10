"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Video, ChevronDown, Loader2, ShieldCheck, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PLATFORM_CATEGORIES } from "@/lib/platform-skills";

const PAGE_SIZE = 5;
const TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let h = 8; h <= 20; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
    slots.push(`${h.toString().padStart(2, "0")}:30`);
  }
  return slots;
})();

function isValidConvexId(
  id: string | string[] | undefined
): id is Id<"projects"> {
  if (typeof id !== "string") return false;
  return /^[a-zA-Z][a-zA-Z0-9]*$/.test(id);
}

const EXPERIENCE_LABELS: Record<string, string> = {
  junior: "Junior",
  mid: "Mid-Level",
  senior: "Senior",
  expert: "Expert",
};

function getPrimaryRoleLabel(techField?: string, primaryRole?: string): string {
  if (primaryRole) return primaryRole;
  if (!techField) return "—";
  const cat = PLATFORM_CATEGORIES.find((c) => c.id === techField);
  return cat?.label ?? techField.replace(/_/g, " ");
}

type FreelancerPublicProfile = {
  displayName: string;
  profile?: {
    skills?: string[];
    availability?: string;
    imageUrl?: string;
    country?: string;
    timezone?: string;
    techField?: string;
    experienceLevel?: string;
    hourlyRate?: number;
    primaryRole?: string;
    weeklyHours?: number;
    portfolioUrl?: string;
    languagesWritten?: string[];
    bio?: string;
  };
  resumeBio?: string;
  verificationStatus?: string;
  vettingScore: number;
  vettingStatus: string | null;
  averageRating: number;
  reviewCount: number;
};

function FreelancerProfileContent({
  profile: data,
  onProceed,
  onClose,
  isTeam,
}: {
  profile: FreelancerPublicProfile;
  onProceed: () => void;
  onClose: () => void;
  isTeam: boolean;
}) {
  const p = data.profile;
  const primaryRole = getPrimaryRoleLabel(p?.techField, p?.primaryRole);
  const skillLevel = p?.experienceLevel ? (EXPERIENCE_LABELS[p.experienceLevel] ?? p.experienceLevel) : null;

  return (
    <>
      <DialogHeader className="space-y-4 pb-4 border-b border-border/60">
        <div className="flex gap-4">
          <Avatar className="h-20 w-20 shrink-0 rounded-full border-2 border-primary/20">
            <AvatarImage src={p?.imageUrl} alt={data.displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {data.displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-xl">{data.displayName}</DialogTitle>
            <p className="text-muted-foreground mt-0.5">{primaryRole}</p>
            {(p?.country || p?.timezone) && (
              <p className="text-sm text-muted-foreground mt-1">
                {[p.country, p.timezone].filter(Boolean).join(" · ")}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {skillLevel && (
                <Badge variant="outline">{skillLevel}</Badge>
              )}
              <Badge className="gap-1 bg-primary/15 text-primary border-0">
                <ShieldCheck className="h-3.5 w-3.5" />
                {data.vettingScore}% Vetted
              </Badge>
              {data.vettingStatus === "approved" && (
                <Badge variant="secondary">Fully vetted by 49GIG</Badge>
              )}
            </div>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {(data.resumeBio || p?.bio) && (
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</h3>
            <p className="text-sm leading-relaxed">{data.resumeBio || p?.bio}</p>
          </section>
        )}

        {p?.skills && p.skills.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Core skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {p.skills.slice(0, 8).map((s) => (
                <Badge key={s} variant="outline" className="font-normal">{s}</Badge>
              ))}
              {p.skills.length > 8 && (
                <Badge variant="outline">+{p.skills.length - 8}</Badge>
              )}
            </div>
          </section>
        )}

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {p?.availability && (
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Availability</p>
              <p className="text-sm font-medium mt-0.5 capitalize">{p.availability.replace("_", " ")}</p>
            </div>
          )}
          {p?.weeklyHours != null && (
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Weekly capacity</p>
              <p className="text-sm font-medium mt-0.5">{p.weeklyHours} hrs/week</p>
            </div>
          )}
          {p?.hourlyRate != null && (
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hourly rate</p>
              <p className="text-sm font-medium mt-0.5 text-primary">${p.hourlyRate}/hr</p>
            </div>
          )}
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rating</p>
            <p className="text-sm font-medium mt-0.5">
              {data.reviewCount > 0 ? (
                <>{data.averageRating}/5 · {data.reviewCount} completed project{data.reviewCount !== 1 ? "s" : ""}</>
              ) : (
                "No reviews yet"
              )}
            </p>
          </div>
        </section>

        {p?.portfolioUrl && (
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Portfolio</h3>
            <a
              href={p.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View portfolio →
            </a>
          </section>
        )}

        {p?.languagesWritten && p.languagesWritten.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Languages</h3>
            <p className="text-sm">{p.languagesWritten.join(", ")}</p>
          </section>
        )}

        <p className="text-xs text-muted-foreground rounded-lg bg-muted/30 p-3">
          Includes 49GIG vetting, escrow, and support. No interviews required — talent is pre-vetted.
        </p>
      </div>

      <DialogFooter className="flex-col gap-2 sm:flex-row pt-4 border-t border-border/60">
        <Button variant="outline" className="w-full sm:w-auto" onClick={onClose}>
          See alternatives
        </Button>
        <Button className="w-full sm:w-auto" onClick={onProceed}>
          Proceed with this talent
        </Button>
      </DialogFooter>
    </>
  );
}

type EnrichedMatch = {
  _id: Id<"matches">;
  projectId: Id<"projects">;
  freelancerId: Id<"users">;
  score: number;
  confidence: string;
  teamRole?: string;
  explanation: string;
  status: string;
  vettingScore?: number;
  vettingStatus?: string | null;
  freelancer: {
    _id: Id<"users">;
    displayName: string;
    profile?: {
      skills?: string[];
      availability?: string;
      imageUrl?: string;
      country?: string;
      timezone?: string;
      techField?: string;
      experienceLevel?: string;
      hourlyRate?: number;
      primaryRole?: string;
      weeklyHours?: number;
    };
    resumeBio?: string;
    verificationStatus?: string;
  } | null;
};

function MatchCard({
  match,
  rank,
  isSelected,
  onSelect,
  onViewProfile,
  isTeam,
}: {
  match: EnrichedMatch;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
  onViewProfile: () => void;
  isTeam?: boolean;
}) {
  const f = match.freelancer;
  const vettingScore = match.vettingScore ?? 0;
  const isVetted = match.vettingStatus === "approved";
  const primaryRole = getPrimaryRoleLabel(f?.profile?.techField, f?.profile?.primaryRole);
  const skillLevel = f?.profile?.experienceLevel
    ? EXPERIENCE_LABELS[f.profile.experienceLevel] ?? f.profile.experienceLevel
    : null;

  return (
    <Card
      className={`transition-all hover:shadow-md rounded-xl border-border/60 overflow-hidden ${isSelected ? "ring-2 ring-primary border-primary/50 shadow-sm" : ""}`}
    >
      <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="flex gap-3">
          <Avatar className="h-12 w-12 shrink-0 rounded-full border-2 border-border/60">
            <AvatarImage src={f?.profile?.imageUrl} alt={f?.displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {f?.displayName?.slice(0, 2).toUpperCase() ?? rank.toString()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <CardTitle className="text-base sm:text-lg truncate">{f?.displayName ?? "—"}</CardTitle>
              {isTeam && match.teamRole && (
                <Badge variant="secondary" className="text-xs">{match.teamRole}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{primaryRole}</p>
            {(f?.profile?.country || f?.profile?.timezone) && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {[f?.profile?.country, f?.profile?.timezone].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {rank}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {skillLevel && (
            <Badge variant="outline" className="text-xs font-medium">
              {skillLevel}
            </Badge>
          )}
          <Badge className="gap-1 bg-primary/15 text-primary border-0 text-xs font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            {vettingScore}% Vetted
          </Badge>
          {isVetted && (
            <Badge variant="secondary" className="text-xs">Fully vetted by 49GIG</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 sm:px-6 sm:pb-6">
        {f?.profile?.skills && f.profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {f.profile.skills.slice(0, 6).map((s) => (
              <Badge key={s} variant="outline" className="text-xs font-normal">
                {s}
              </Badge>
            ))}
            {(f.profile.skills.length ?? 0) > 6 && (
              <Badge variant="outline" className="text-xs font-normal">
                +{f.profile.skills.length - 6}
              </Badge>
            )}
          </div>
        )}
        {f?.profile?.hourlyRate != null && (
          <p className="text-sm font-semibold text-primary">
            ${f.profile.hourlyRate}/hr
          </p>
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={onViewProfile}>
            <User className="mr-1.5 h-4 w-4" />
            View profile
          </Button>
          <Button
            size="sm"
            className="flex-1 rounded-lg"
            onClick={onSelect}
            variant={isSelected ? "secondary" : "default"}
          >
            {isSelected ? "Selected" : "Select"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectMatchesPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const projectId = isValidConvexId(params.projectId)
    ? (params.projectId as Id<"projects">)
    : null;

  const project = useQuery(
    (api as any)["projects/queries"].getProject,
    user?._id && projectId ? { projectId, userId: user._id } : "skip"
  );
  const matches = useQuery(
    (api as any)["matching/queries"].getMatches,
    user?._id && projectId ? { projectId, userId: user._id, status: "pending" } : "skip"
  );
  const publicProfile = useQuery(
    (api as any)["matching/queries"].getFreelancerPublicProfile,
    projectId && user?._id && viewingFreelancerId
      ? { projectId, freelancerId: viewingFreelancerId, userId: user._id }
      : "skip"
  );

  const generateMatchesForDraft = useAction(
    (api as any)["matching/actions"].generateMatchesForDraft
  );
  const setSelectedFreelancer = useMutation(
    (api as any)["projects/mutations"].setSelectedFreelancer
  );
  const setSelectedFreelancers = useMutation(
    (api as any)["projects/mutations"].setSelectedFreelancers
  );
  const scheduleOneOnOneSession = useAction(
    (api as any)["scheduledCalls/actions"].scheduleOneOnOneSession
  );

  const [matchingRunning, setMatchingRunning] = useState(false);
  const matchingAttemptedRef = useRef(false);
  const [singleVisibleCount, setSingleVisibleCount] = useState(PAGE_SIZE);
  const [selectedSingleId, setSelectedSingleId] = useState<Id<"users"> | null>(
    null
  );
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<Id<"users">>>(
    new Set()
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTimeSlot, setScheduleTimeSlot] = useState<string>("09:00");
  const [scheduling, setScheduling] = useState(false);
  const [viewingFreelancerId, setViewingFreelancerId] = useState<Id<"users"> | null>(null);

  const isTeam = project?.intakeForm?.hireType === "team";
  const pendingMatches = (matches ?? []).filter(
    (m: EnrichedMatch) => m.status === "pending"
  );

  // Group by teamRole for team projects
  const matchesByRole = isTeam
    ? (() => {
        const map = new Map<string, EnrichedMatch[]>();
        for (const m of pendingMatches) {
          const role = (m as EnrichedMatch).teamRole ?? "General";
          if (!map.has(role)) map.set(role, []);
          map.get(role)!.push(m as EnrichedMatch);
        }
        return Array.from(map.entries());
      })()
    : [];

  const singleList = !isTeam ? pendingMatches.slice(0, singleVisibleCount) : [];
  const hasMoreSingle =
    !isTeam && pendingMatches.length > singleVisibleCount;

  // Reset "attempted" when project changes so a new project can trigger matching
  useEffect(() => {
    matchingAttemptedRef.current = false;
  }, [projectId]);

  // Run matching once when project is draft and no matches; do not retry on failure
  useEffect(() => {
    if (
      !projectId ||
      !user?._id ||
      matchingRunning ||
      !project ||
      (project.status !== "draft" && project.status !== "pending_funding")
    )
      return;
    // Wait for matches query to resolve; undefined = still loading
    if (matches === undefined) return;
    if (matches.length > 0) return; // already have matches
    if (matchingAttemptedRef.current) return; // already attempted (success or failure), avoid infinite retry
    matchingAttemptedRef.current = true;
    setMatchingRunning(true);
    generateMatchesForDraft({ projectId })
      .then(() => setMatchingRunning(false))
      .catch(() => {
        setMatchingRunning(false);
        toast.error("Matching failed. Try refreshing.");
      });
  }, [
    projectId,
    user?._id,
    project?.status,
    matches?.length,
    matchingRunning,
    generateMatchesForDraft,
  ]);

  const handleSelectSingle = useCallback(
    (freelancerId: Id<"users">) => {
      setSelectedSingleId(freelancerId);
      setDialogOpen(true);
    },
    []
  );

  const handleSelectTeam = useCallback((freelancerId: Id<"users">) => {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(freelancerId)) next.delete(freelancerId);
      else next.add(freelancerId);
      return next;
    });
  }, []);

  const handleConfirmTeamSelection = useCallback(() => {
    if (selectedTeamIds.size === 0) {
      toast.error("Select at least one freelancer.");
      return;
    }
    setDialogOpen(true);
  }, [selectedTeamIds.size]);

  const handleSkipSession = useCallback(async () => {
    if (!projectId || !user?._id) return;
    setDialogOpen(false);
    try {
      if (isTeam) {
        await setSelectedFreelancers({
          projectId,
          freelancerIds: Array.from(selectedTeamIds),
          userId: user._id,
        });
      } else if (selectedSingleId) {
        await setSelectedFreelancer({
          projectId,
          freelancerId: selectedSingleId,
          userId: user._id,
        });
      }
      router.push(`/dashboard/projects/${projectId}/payment`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save selection");
    }
  }, [
    projectId,
    user?._id,
    isTeam,
    selectedSingleId,
    selectedTeamIds,
    setSelectedFreelancer,
    setSelectedFreelancers,
    router,
  ]);

  const handleScheduleSession = useCallback(() => {
    setDialogOpen(false);
    setScheduleDialogOpen(true);
  }, []);

  const handleConfirmSchedule = useCallback(async () => {
    if (!projectId || !user?._id || !scheduleDate) {
      toast.error("Please pick a date and time.");
      return;
    }
    const [hours, minutes] = scheduleTimeSlot.split(":").map(Number);
    const start = new Date(scheduleDate);
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);

    setScheduling(true);
    try {
      const freelancerIds = isTeam
        ? Array.from(selectedTeamIds)
        : selectedSingleId
          ? [selectedSingleId]
          : [];
      if (freelancerIds.length === 0) {
        toast.error("No freelancer selected.");
        setScheduling(false);
        return;
      }
      await scheduleOneOnOneSession({
        projectId,
        freelancerIds,
        startTime: start.getTime(),
        endTime: end.getTime(),
        title: `49GIG: ${project?.intakeForm?.title ?? "Session"}`,
        userId: user._id,
      });
      setScheduleDialogOpen(false);
      toast.success("Session scheduled. Check your email for the Meet link.");
      if (isTeam) {
        await setSelectedFreelancers({
          projectId,
          freelancerIds,
          userId: user._id,
        });
      } else {
        await setSelectedFreelancer({
          projectId,
          freelancerId: freelancerIds[0],
          userId: user._id,
        });
      }
      router.push(`/dashboard/projects/${projectId}/payment`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to schedule");
    } finally {
      setScheduling(false);
    }
  }, [
    projectId,
    user?._id,
    scheduleDate,
    scheduleTimeSlot,
    isTeam,
    selectedSingleId,
    selectedTeamIds,
    project?.intakeForm?.title,
    scheduleOneOnOneSession,
    setSelectedFreelancer,
    setSelectedFreelancers,
    router,
  ]);

  if (!user) return null;
  if (!projectId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invalid project</CardTitle>
            <CardDescription>
              This project could not be found.
            </CardDescription>
          </CardHeader>
          <Link href="/dashboard/projects">
            <Button variant="outline">Back to projects</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (project === undefined || matches === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (
    project.status !== "draft" &&
    project.status !== "pending_funding"
  ) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">
          This project is no longer in the matching phase.
        </p>
        <Link href={`/dashboard/projects/${projectId}`}>
          <Button variant="outline">View project</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-start gap-3 sm:gap-4 min-w-0">
        <Link href={`/dashboard/projects/${projectId}`} className="shrink-0">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl">Matched freelancers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isTeam
              ? "Select one or more freelancers per role, then proceed."
              : "We've matched you with top talent. Select one to continue."}
          </p>
        </div>
      </div>

      {matchingRunning && (
        <Card className="rounded-xl border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-6 px-4 sm:px-6">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
            <span className="text-sm sm:text-base">Matching you with freelancers...</span>
          </CardContent>
        </Card>
      )}

      {!matchingRunning && pendingMatches.length === 0 && (
        <Card className="rounded-xl border-border/60">
          <CardContent className="py-12 px-4 text-center text-muted-foreground text-sm sm:text-base">
            No matches yet. Try again in a moment or contact support.
          </CardContent>
        </Card>
      )}

      {!isTeam && singleList.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {singleList.map((m: EnrichedMatch, i: number) => (
              <MatchCard
                key={m._id}
                match={m}
                rank={i + 1}
                isSelected={selectedSingleId === m.freelancerId}
                onSelect={() => handleSelectSingle(m.freelancerId)}
                onViewProfile={() => setViewingFreelancerId(m.freelancerId)}
              />
            ))}
          </div>
          {hasMoreSingle && (
            <Button
              variant="outline"
              className="w-full rounded-lg"
              onClick={() =>
                setSingleVisibleCount((c) => Math.min(c + PAGE_SIZE, pendingMatches.length))
              }
            >
              <ChevronDown className="mr-2 h-4 w-4" />
              Load more ({pendingMatches.length - singleVisibleCount} more)
            </Button>
          )}
        </div>
      )}

      {isTeam && matchesByRole.length > 0 && (
        <div className="space-y-6 sm:space-y-8">
          {matchesByRole.map(([role, roleMatches]) => (
            <div key={role} className="space-y-4">
              <h2 className="text-base font-semibold sm:text-lg">{role}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(roleMatches as EnrichedMatch[]).slice(0, 5).map((m, i) => (
                  <MatchCard
                    key={m._id}
                    match={m}
                    rank={i + 1}
                    isSelected={selectedTeamIds.has(m.freelancerId)}
                    onSelect={() => handleSelectTeam(m.freelancerId)}
                    onViewProfile={() => setViewingFreelancerId(m.freelancerId)}
                    isTeam
                  />
                ))}
              </div>
            </div>
          ))}
          <Button
            onClick={handleConfirmTeamSelection}
            disabled={selectedTeamIds.size === 0}
            className="w-full sm:w-auto rounded-lg"
          >
            Confirm selection ({selectedTeamIds.size}) & continue
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>One-on-one session (optional)</DialogTitle>
            <DialogDescription>
              We have carefully vetted our freelancers. If you’d like, you can
              schedule a live one-on-one session with your matched freelancer
              via Google Meet before proceeding to payment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleSkipSession}>
              Skip session
            </Button>
            <Button onClick={handleScheduleSession}>
              <Video className="mr-2 h-4 w-4" />
              Schedule one-on-one session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pick date & time</DialogTitle>
            <DialogDescription>
              Choose when you’d like to meet. We’ll create a Google Meet and
              email the link to you and the freelancer(s).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Date</label>
              <DatePicker
                date={scheduleDate}
                onDateChange={setScheduleDate}
                minDate={new Date()}
                placeholder="Select date"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Time</label>
              <Select
                value={scheduleTimeSlot}
                onValueChange={setScheduleTimeSlot}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setScheduleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmSchedule} disabled={scheduling}>
              {scheduling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Schedule & continue to payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full freelancer profile modal (View profile) */}
      <Dialog open={!!viewingFreelancerId} onOpenChange={(open) => !open && setViewingFreelancerId(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {publicProfile === undefined ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : publicProfile === null ? (
            <p className="py-6 text-center text-muted-foreground">Unable to load profile.</p>
          ) : (
            <FreelancerProfileContent
              profile={publicProfile}
              onProceed={() => {
                if (!viewingFreelancerId) return;
                setViewingFreelancerId(null);
                if (isTeam) {
                  handleSelectTeam(viewingFreelancerId);
                } else {
                  handleSelectSingle(viewingFreelancerId);
                }
              }}
              onClose={() => setViewingFreelancerId(null)}
              isTeam={!!isTeam}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
