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
import { ArrowLeft, Star, Video, ChevronDown, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

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

type EnrichedMatch = {
  _id: Id<"matches">;
  projectId: Id<"projects">;
  freelancerId: Id<"users">;
  score: number;
  confidence: string;
  teamRole?: string;
  explanation: string;
  status: string;
  freelancer: {
    _id: Id<"users">;
    name: string;
    email: string;
    profile?: { skills?: string[]; availability?: string };
    resumeBio?: string;
  } | null;
};

function MatchCard({
  match,
  rank,
  isSelected,
  onSelect,
  isTeam,
}: {
  match: EnrichedMatch;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
  isTeam?: boolean;
}) {
  const f = match.freelancer;
  const ratingPct = match.score;
  const stars = Math.round((ratingPct / 100) * 5) || 0;

  return (
    <Card
      className={`transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {rank}
            </span>
            <div>
              <CardTitle className="text-lg">{f?.name ?? "—"}</CardTitle>
              {isTeam && match.teamRole && (
                <Badge variant="secondary" className="mt-1">
                  {match.teamRole}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">
              {stars}/5 · {match.score}% match
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {f?.resumeBio && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {f.resumeBio}
          </p>
        )}
        {f?.profile?.skills && f.profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {f.profile.skills.slice(0, 6).map((s) => (
              <Badge key={s} variant="outline" className="text-xs">
                {s}
              </Badge>
            ))}
            {(f.profile.skills.length ?? 0) > 6 && (
              <Badge variant="outline" className="text-xs">
                +{f.profile.skills.length - 6}
              </Badge>
            )}
          </div>
        )}
        <Button
          className="w-full"
          onClick={onSelect}
          variant={isSelected ? "secondary" : "default"}
        >
          {isSelected ? "Selected" : "Select"}
        </Button>
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
    if (matches && matches.length > 0) return;
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
        });
      } else if (selectedSingleId) {
        await setSelectedFreelancer({ projectId, freelancerId: selectedSingleId });
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
        await setSelectedFreelancers({ projectId, freelancerIds });
      } else {
        await setSelectedFreelancer({ projectId, freelancerId: freelancerIds[0] });
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
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/projects/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Matched freelancers</h1>
          <p className="text-muted-foreground">
            {isTeam
              ? "Select one or more freelancers per role, then proceed."
              : "We've matched you with top talent. Select one to continue."}
          </p>
        </div>
      </div>

      {matchingRunning && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-6">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Matching you with freelancers...</span>
          </CardContent>
        </Card>
      )}

      {!matchingRunning && pendingMatches.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No matches yet. Try again in a moment or contact support.
          </CardContent>
        </Card>
      )}

      {!isTeam && singleList.length > 0 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {singleList.map((m: EnrichedMatch, i: number) => (
              <MatchCard
                key={m._id}
                match={m}
                rank={i + 1}
                isSelected={selectedSingleId === m.freelancerId}
                onSelect={() => handleSelectSingle(m.freelancerId)}
              />
            ))}
          </div>
          {hasMoreSingle && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                setSingleVisibleCount((c) => Math.min(c + PAGE_SIZE, pendingMatches.length))
              }
            >
              <ChevronDown className="mr-2 h-4 w-4" />
              Fetch more ({pendingMatches.length - singleVisibleCount} more)
            </Button>
          )}
        </div>
      )}

      {isTeam && matchesByRole.length > 0 && (
        <div className="space-y-8">
          {matchesByRole.map(([role, roleMatches]) => (
            <div key={role}>
              <h2 className="mb-4 text-lg font-semibold">{role}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(roleMatches as EnrichedMatch[]).slice(0, 5).map((m, i) => (
                  <MatchCard
                    key={m._id}
                    match={m}
                    rank={i + 1}
                    isSelected={selectedTeamIds.has(m.freelancerId)}
                    onSelect={() => handleSelectTeam(m.freelancerId)}
                    isTeam
                  />
                ))}
              </div>
            </div>
          ))}
          <Button
            onClick={handleConfirmTeamSelection}
            disabled={selectedTeamIds.size === 0}
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
    </div>
  );
}
