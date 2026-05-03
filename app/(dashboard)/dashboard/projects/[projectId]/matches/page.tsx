"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { ArrowLeft, Video, Loader2, ShieldCheck, User, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";
import { useAnalytics } from "@/hooks/use-analytics";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PLATFORM_CATEGORIES } from "@/lib/platform-skills";
import { getRoleLabelsForProjectIntake } from "@/lib/team-slots";
import { FreelancerReplacementBanner } from "@/components/dashboard/freelancer-replacement-banner";

/** Max candidates per role / single hire in the client carousel (matches engine persists at most this many). */
const MATCH_CAROUSEL_CAP = 10;
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
    primaryRole?: string;
    weeklyHours?: number;
    languagesWritten?: string[];
    bio?: string;
  };
  resumeBio?: string;
  verificationStatus?: string;
  vettingScore: number;
  vettingStatus: string | null;
};

type FreelancerPublicProfileArgs = {
  projectId: Id<"projects">;
  freelancerId: Id<"users">;
  userId: Id<"users">;
};

const getFreelancerPublicProfileRef = makeFunctionReference<
  "query",
  FreelancerPublicProfileArgs,
  FreelancerPublicProfile | null
>("matching/queries:getFreelancerPublicProfile");

function FreelancerProfileContent({
  profile: data,
  onProceed,
  onClose,
  isTeam,
  freezeSelection,
}: {
  profile: FreelancerPublicProfile;
  onProceed: () => void;
  onClose: () => void;
  isTeam: boolean;
  /** When true, only close — client has already locked a choice before funding. */
  freezeSelection?: boolean;
}) {
  const p = data.profile;
  const primaryRole = getPrimaryRoleLabel(p?.techField, p?.primaryRole);
  const skillLevel = p?.experienceLevel ? (EXPERIENCE_LABELS[p.experienceLevel] ?? p.experienceLevel) : null;

  return (
    <>
      <DialogHeader className="space-y-4 pb-4 border-b border-border/60 text-left sm:text-left">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Avatar className="h-20 w-20 shrink-0 rounded-full border-2 border-primary/20">
            <AvatarImage src={p?.imageUrl} alt={data.displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {data.displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 w-full flex-1 text-center sm:text-left">
            <DialogTitle className="text-lg sm:text-xl leading-snug wrap-break-word text-pretty pr-1">
              {data.displayName}
            </DialogTitle>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base wrap-break-word">{primaryRole}</p>
            {(p?.country || p?.timezone) && (
              <p className="text-sm text-muted-foreground mt-1 wrap-break-word">
                {[p.country, p.timezone].filter(Boolean).join(" · ")}
              </p>
            )}
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {skillLevel && (
                <Badge variant="outline">{skillLevel}</Badge>
              )}
              {data.vettingStatus === "approved" && (
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Fully vetted by 49GIG
                </Badge>
              )}
            </div>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {(data.resumeBio || p?.bio) && (
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</h3>
            <p className="wrap-break-word text-sm leading-relaxed text-pretty">{data.resumeBio || p?.bio}</p>
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

        {(p?.availability || p?.weeklyHours != null) && (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:justify-end sm:gap-2">
        {freezeSelection ? (
          <Button
            className="min-h-11 w-full touch-manipulation sm:min-h-10 sm:w-auto"
            onClick={onClose}
          >
            Close
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              className="min-h-11 w-full touch-manipulation sm:min-h-10 sm:w-auto"
              onClick={onClose}
            >
              See alternatives
            </Button>
            <Button
              className="min-h-11 w-full touch-manipulation sm:min-h-10 sm:w-auto"
              onClick={onProceed}
            >
              Proceed with this talent
            </Button>
          </>
        )}
      </div>
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
  selectionLocked,
  continuePaymentHref,
  primaryCtaLabel,
}: {
  match: EnrichedMatch;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
  onViewProfile: () => void;
  isTeam?: boolean;
  /** Pre-funding: choice is saved — show continue to payment instead of changing selection. */
  selectionLocked?: boolean;
  continuePaymentHref?: string;
  /** Override the main card button label (e.g. matching carousel). */
  primaryCtaLabel?: string;
}) {
  const f = match.freelancer;
  const isVetted = match.vettingStatus === "approved";
  const primaryRole = getPrimaryRoleLabel(f?.profile?.techField, f?.profile?.primaryRole);
  const skillLevel = f?.profile?.experienceLevel
    ? EXPERIENCE_LABELS[f.profile.experienceLevel] ?? f.profile.experienceLevel
    : null;

  return (
    <Card
      className={`w-full max-w-full overflow-hidden rounded-xl border-border/60 transition-all hover:shadow-md supports-[hover:hover]:hover:shadow-md ${isSelected ? "ring-2 ring-primary border-primary/50 shadow-sm" : ""}`}
    >
      <CardHeader className="pb-2 px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="flex gap-3">
          <Avatar className="h-12 w-12 shrink-0 rounded-full border-2 border-border/60 sm:h-14 sm:w-14">
            <AvatarImage src={f?.profile?.imageUrl} alt={f?.displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {f?.displayName?.slice(0, 2).toUpperCase() ?? rank.toString()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
              <CardTitle className="text-base leading-snug sm:text-lg wrap-break-word text-pretty">
                {f?.displayName ?? "—"}
              </CardTitle>
              {isTeam && match.teamRole && (
                <Badge
                  variant="secondary"
                  className="max-w-full shrink-0 whitespace-normal text-left text-xs leading-snug wrap-break-word"
                >
                  {match.teamRole}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 wrap-break-word text-sm text-muted-foreground text-pretty">{primaryRole}</p>
            {(f?.profile?.country || f?.profile?.timezone) && (
              <p className="mt-0.5 wrap-break-word text-xs text-muted-foreground">
                {[f?.profile?.country, f?.profile?.timezone].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground tabular-nums sm:h-8 sm:w-8">
            {rank}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {skillLevel && (
            <Badge variant="outline" className="text-xs font-medium">
              {skillLevel}
            </Badge>
          )}
          {isVetted && (
            <Badge variant="secondary" className="max-w-full whitespace-normal text-xs leading-snug">
              Fully vetted by 49GIG
            </Badge>
          )}
          {f?.profile?.availability === "busy" && (
            <Badge variant="outline" className="max-w-full whitespace-normal text-xs font-normal leading-snug">
              On another hire — still matchable
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="min-h-0">
          {f?.profile?.skills && f.profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {f.profile.skills.slice(0, 6).map((s) => (
                <Badge key={s} variant="outline" className="wrap-break-word text-xs font-normal">
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
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button
            variant="outline"
            className="min-h-11 w-full touch-manipulation sm:min-h-10 sm:flex-1 rounded-lg text-sm"
            onClick={onViewProfile}
          >
            <User className="mr-2 h-4 w-4 shrink-0" />
            View profile
          </Button>
          {selectionLocked && continuePaymentHref ? (
            <Button
              className="min-h-11 w-full touch-manipulation sm:min-h-10 sm:flex-1 rounded-lg text-sm"
              asChild
            >
              <Link href={continuePaymentHref}>Continue to payment</Link>
            </Button>
          ) : (
            <Button
              className="min-h-11 w-full touch-manipulation sm:min-h-10 sm:flex-1 rounded-lg text-sm"
              onClick={onSelect}
              variant={isSelected ? "secondary" : "default"}
            >
              {primaryCtaLabel
                ? primaryCtaLabel
                : isSelected
                  ? "Selected"
                  : "Select"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LockedSelectionProfileCard({
  projectId,
  freelancerId,
  userId,
  rank,
  teamRole,
  onViewProfile,
  continuePaymentHref,
}: {
  projectId: Id<"projects">;
  freelancerId: Id<"users">;
  userId: Id<"users">;
  rank: number;
  teamRole?: string;
  onViewProfile: () => void;
  continuePaymentHref: string;
}) {
  const profile = useQuery(getFreelancerPublicProfileRef, {
    projectId,
    freelancerId,
    userId,
  });
  if (profile === undefined) {
    return <Skeleton className="h-64 rounded-xl" />;
  }
  if (profile === null) {
    return (
      <Card className="rounded-xl border-border/60">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Selected freelancer profile could not be loaded. You can still continue to payment from your hire.
        </CardContent>
      </Card>
    );
  }
  const syntheticMatch: EnrichedMatch = {
    _id: `orphan-${freelancerId}` as Id<"matches">,
    projectId,
    freelancerId,
    score: 0,
    confidence: "high",
    teamRole,
    explanation: "",
    status: "pending",
    vettingScore: profile.vettingScore,
    vettingStatus: profile.vettingStatus,
    freelancer: {
      _id: freelancerId,
      displayName: profile.displayName,
      profile: profile.profile,
      resumeBio: profile.resumeBio,
      verificationStatus: profile.verificationStatus,
    },
  };
  return (
    <MatchCard
      match={syntheticMatch}
      rank={rank}
      isSelected={true}
      onSelect={() => {}}
      onViewProfile={onViewProfile}
      isTeam={!!teamRole}
      selectionLocked
      continuePaymentHref={continuePaymentHref}
    />
  );
}

export default function ProjectMatchesPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const isClient = user?.role === "client";
  const { trackEvent } = useAnalytics();
  const projectId = isValidConvexId(params.projectId)
    ? (params.projectId as Id<"projects">)
    : null;

  const project = useQuery(
    (api as any)["projects/queries"].getProject,
    user?._id && projectId ? { projectId, userId: user._id } : "skip"
  );
  const matches = useQuery(
    (api as any)["matching/queries"].getMatches,
    user?._id && projectId ? { projectId, userId: user._id } : "skip"
  );
  const [viewingFreelancerId, setViewingFreelancerId] = useState<Id<"users"> | null>(null);
  const publicProfile = useQuery(
    getFreelancerPublicProfileRef,
    projectId && user?._id && viewingFreelancerId
      ? { projectId, freelancerId: viewingFreelancerId, userId: user._id }
      : "skip"
  ) as FreelancerPublicProfile | null | undefined;

  const generateMatchesForDraft = useAction(
    (api as any)["matching/actions"].generateMatchesForDraft
  );
  const generateMatches = useAction((api as any)["matching/actions"].generateMatches);
  const generateTeamMatches = useAction(
    (api as any)["matching/actions"].generateTeamMatches
  );
  const setSelectedFreelancer = useMutation(
    (api as any)["projects/mutations"].setSelectedFreelancer
  );
  const setSelectedFreelancers = useMutation(
    (api as any)["projects/mutations"].setSelectedFreelancers
  );
  const confirmRemainingTeamSelections = useMutation(
    (api as any)["projects/mutations"].confirmRemainingTeamSelections
  );
  const scheduleOneOnOneSession = useAction(
    (api as any)["scheduledCalls/actions"].scheduleOneOnOneSession
  );

  const [matchingRunning, setMatchingRunning] = useState(false);
  const matchingAttemptedRef = useRef(false);
  const replacementGenAttemptedRef = useRef(false);
  const [matchingAvailability, setMatchingAvailability] = useState<{
    atRequestedLevel: number;
    hasLowerLevelWithExactSkills: boolean;
  } | null>(null);
  const [lowerLevelMatchingRunning, setLowerLevelMatchingRunning] = useState(false);
  const [selectedSingleId, setSelectedSingleId] = useState<Id<"users"> | null>(
    null
  );
  /** Team hires: chosen freelancer per seat label (e.g. "Frontend Developer #1"). */
  const [roleSelections, setRoleSelections] = useState<
    Partial<Record<string, Id<"users">>>
  >({});
  const [singleCarouselIndex, setSingleCarouselIndex] = useState(0);
  const [singlePoolExhausted, setSinglePoolExhausted] = useState(false);
  const [roleCarouselIndex, setRoleCarouselIndex] = useState<
    Record<string, number>
  >({});
  const [rolePoolExhausted, setRolePoolExhausted] = useState<
    Record<string, boolean>
  >({});
  const [viewingTeamRoleLabel, setViewingTeamRoleLabel] = useState<string | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTimeSlot, setScheduleTimeSlot] = useState<string>("09:00");
  const [scheduling, setScheduling] = useState(false);

  const isTeam = project?.intakeForm?.hireType === "team";
  const isFreelancerReplacementFlow = Boolean(project?.replacementMatchingAt);

  const preFundingSelectedIds: Id<"users">[] =
    project && (project.status === "draft" || project.status === "pending_funding")
      ? isTeam
        ? [...(project.selectedFreelancerIds ?? [])]
        : project.selectedFreelancerId
          ? [project.selectedFreelancerId]
          : []
      : [];

  const hasPreFundingSelection =
    Boolean(isClient && preFundingSelectedIds.length > 0);

  const matchesList = (matches ?? []) as EnrichedMatch[];

  const pendingMatches = matchesList.filter((m) => m.status === "pending");

  const lockedSelectionMatches =
    hasPreFundingSelection
      ? matchesList.filter(
          (m) =>
            preFundingSelectedIds.includes(m.freelancerId) &&
            (m.status === "pending" || m.status === "accepted")
        )
      : [];

  const orphanedPreFundingSelectionIds = hasPreFundingSelection
    ? preFundingSelectedIds.filter(
        (id) => !lockedSelectionMatches.some((m) => m.freelancerId === id)
      )
    : [];

  const continuePaymentHref =
    projectId ? `/dashboard/projects/${projectId}/payment` : "#";

  // Group by teamRole for team projects; also get all expected roles for "no availability" display
  const matchesByRoleMap = isTeam && project
    ? (() => {
        const map = new Map<string, EnrichedMatch[]>();
        for (const m of pendingMatches) {
          const role = (m as EnrichedMatch).teamRole ?? "General";
          if (!map.has(role)) map.set(role, []);
          map.get(role)!.push(m as EnrichedMatch);
        }
        return map;
      })()
    : new Map<string, EnrichedMatch[]>();
  /** Seats still filled by retained team members (no pending carousel for that role). */
  const acceptedMatchesByRole = useMemo(() => {
    const map = new Map<string, EnrichedMatch[]>();
    if (!isTeam) return map;
    for (const m of matchesList) {
      if (m.status !== "accepted" || !m.teamRole) continue;
      if (!map.has(m.teamRole)) map.set(m.teamRole, []);
      map.get(m.teamRole)!.push(m as EnrichedMatch);
    }
    return map;
  }, [isTeam, matchesList]);
  const allRoleLabels = isTeam && project
    ? getRoleLabelsForProjectIntake(project.intakeForm)
    : [];

  const sortedSinglePool = useMemo(() => {
    return [...pendingMatches]
      .sort((a, b) => b.score - a.score)
      .slice(0, MATCH_CAROUSEL_CAP);
  }, [pendingMatches]);

  const rolesWithPendingMatches = useMemo(() => {
    if (!isTeam || allRoleLabels.length === 0) return [];
    return allRoleLabels.filter(
      (r) => (matchesByRoleMap.get(r) ?? []).length > 0
    );
  }, [isTeam, allRoleLabels, matchesByRoleMap]);

  /** Seats the engine could not staff yet — client can still proceed with other roles. */
  const rolesWithNoMatches = useMemo(() => {
    if (!isTeam || allRoleLabels.length === 0) return [];
    return allRoleLabels.filter((r) => {
      const pendingForRole = (matchesByRoleMap.get(r) ?? []).length;
      if (pendingForRole > 0) return false;
      const hasAcceptedSeat = matchesList.some(
        (m) => m.status === "accepted" && m.teamRole === r
      );
      if (hasAcceptedSeat) return false;
      return true;
    });
  }, [isTeam, allRoleLabels, matchesByRoleMap, matchesList]);

  const sortedTeamPools = useMemo(() => {
    const map = new Map<string, EnrichedMatch[]>();
    if (!isTeam) return map;
    for (const role of allRoleLabels) {
      const raw = matchesByRoleMap.get(role) ?? [];
      // Hide freelancers already chosen for *other* seats so the same person can't
      // be suggested twice for a multi-seat role (e.g. two UI Designer seats).
      const usedElsewhere = new Set(
        Object.entries(roleSelections)
          .filter(([otherRole, fid]) => otherRole !== role && fid != null)
          .map(([, fid]) => String(fid))
      );
      const filtered = raw.filter((m) => !usedElsewhere.has(String(m.freelancerId)));
      map.set(
        role,
        [...filtered].sort((a, b) => b.score - a.score).slice(0, MATCH_CAROUSEL_CAP)
      );
    }
    return map;
  }, [isTeam, allRoleLabels, matchesByRoleMap, roleSelections]);

  // If a selection in another seat shrinks this seat's pool past the current
  // carousel index, snap back to the first available suggestion so the seat
  // doesn't render an empty slot.
  useEffect(() => {
    if (!isTeam) return;
    setRoleCarouselIndex((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const role of allRoleLabels) {
        const poolLen = (sortedTeamPools.get(role) ?? []).length;
        const idx = next[role] ?? 0;
        if (poolLen === 0) continue;
        if (idx >= poolLen) {
          next[role] = 0;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setRolePoolExhausted((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const role of allRoleLabels) {
        const poolLen = (sortedTeamPools.get(role) ?? []).length;
        if (poolLen > 0 && next[role]) {
          next[role] = false;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [isTeam, allRoleLabels, sortedTeamPools]);

  const pendingMatchSig = useMemo(
    () => pendingMatches.map((m) => m._id).join(","),
    [pendingMatches]
  );

  useEffect(() => {
    setSingleCarouselIndex(0);
    setSinglePoolExhausted(false);
    setRoleCarouselIndex({});
    setRolePoolExhausted({});
    setRoleSelections({});
  }, [projectId, pendingMatchSig]);

  const isFundedMatchingContinuation =
    project?.status === "matching" &&
    user?.role === "client" &&
    (project.pendingTeamMemberSlots ?? 0) > 0;

  const selectedTeamFreelancerIds = useMemo(
    () =>
      Object.values(roleSelections).filter(
        (id): id is Id<"users"> => id != null
      ),
    [roleSelections]
  );

  /**
   * Roles that still need matches for the policy note.
   * After funding a partial team, only rolesAwaitingMatch counts — filled roles have
   * zero pending matches too and must not trigger the note.
   */
  const rolesForAvailabilityNote =
    isTeam && allRoleLabels.length > 0
      ? isFundedMatchingContinuation
        ? project.rolesAwaitingMatch ?? []
        : project.rolesAwaitingMatch && project.rolesAwaitingMatch.length > 0
          ? project.rolesAwaitingMatch
          : allRoleLabels
      : [];
  const hasUnavailableTeamRole =
    isTeam &&
    !matchingRunning &&
    rolesForAvailabilityNote.length > 0 &&
    rolesForAvailabilityNote.some((role: string) => {
      const n = matchesByRoleMap.get(role) ?? [];
      if (n.length > 0) return false;
      const hasAcceptedSeat = matchesList.some(
        (m) => m.status === "accepted" && m.teamRole === role
      );
      return !hasAcceptedSeat;
    });
  const hasUnavailableSingleSlot =
    !isTeam && !matchingRunning && pendingMatches.length === 0;
  const showMatchingPolicyNote =
    !hasPreFundingSelection && (hasUnavailableTeamRole || hasUnavailableSingleSlot);

  // Reset "attempted" and availability when project changes so a new project can trigger matching
  useEffect(() => {
    matchingAttemptedRef.current = false;
    replacementGenAttemptedRef.current = false;
    setMatchingAvailability(null);
  }, [projectId, project?.replacementMatchingAt]);

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
    if (
      project.selectedFreelancerId ||
      (project.selectedFreelancerIds && project.selectedFreelancerIds.length > 0)
    ) {
      return;
    }
    // Wait for matches query to resolve; undefined = still loading
    if (matches === undefined) return;
    if (matches.length > 0) return; // already have matches
    if (matchingAttemptedRef.current) return; // already attempted (success or failure), avoid infinite retry
    matchingAttemptedRef.current = true;
    setMatchingRunning(true);
    generateMatchesForDraft({ projectId })
      .then((result) => {
        setMatchingRunning(false);
        if (result?.availability) setMatchingAvailability(result.availability);
      })
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

  // Post–dispute replacement: funded hire back in matching — generate fresh candidates once.
  useEffect(() => {
    if (!projectId || !user?._id || matchingRunning || !project) return;
    if (!project.replacementMatchingAt) return;
    if (project.status !== "matching") return;
    if (matches === undefined) return;
    if (matches.length > 0) return;
    if (replacementGenAttemptedRef.current) return;

    replacementGenAttemptedRef.current = true;
    setMatchingRunning(true);
    const isTeam = project.intakeForm?.hireType === "team";
    const run = isTeam
      ? generateTeamMatches({ projectId })
      : generateMatches({ projectId });
    run
      .then(() => {
        setMatchingRunning(false);
        toast.success(
          isTeam ? "Replacement team suggestions are ready." : "Replacement matches are ready."
        );
      })
      .catch(() => {
        replacementGenAttemptedRef.current = false;
        setMatchingRunning(false);
        toast.error("Couldn’t generate replacement matches. Try refreshing the page.");
      });
  }, [
    projectId,
    user?._id,
    project?.replacementMatchingAt,
    project?.status,
    project?.intakeForm?.hireType,
    matches,
    matchingRunning,
    generateMatches,
    generateTeamMatches,
  ]);

  const handleRetryReplacementMatches = useCallback(async () => {
    if (!projectId || !project?.replacementMatchingAt) return;
    setMatchingRunning(true);
    try {
      const isTeam = project.intakeForm?.hireType === "team";
      if (isTeam) {
        await generateTeamMatches({ projectId });
      } else {
        await generateMatches({ projectId });
      }
      toast.success("Suggestions updated.");
    } catch {
      toast.error("Couldn’t refresh matches. Try again shortly.");
    } finally {
      setMatchingRunning(false);
    }
  }, [
    projectId,
    project?.replacementMatchingAt,
    project?.intakeForm?.hireType,
    generateMatches,
    generateTeamMatches,
  ]);

  const handleShowLowerLevelMatches = useCallback(async () => {
    if (!projectId) return;
    setLowerLevelMatchingRunning(true);
    try {
      const result = await generateMatchesForDraft({
        projectId,
        allowLowerExperience: true,
      });
      if (result?.availability) {
        setMatchingAvailability(result.availability);
      } else {
        setMatchingAvailability(null);
      }
      toast.success("Showing lower-level matches where available.");
    } catch {
      toast.error("Couldn’t load lower-level matches. Try again shortly.");
    } finally {
      setLowerLevelMatchingRunning(false);
    }
  }, [projectId, generateMatchesForDraft]);

  const handleSelectSingle = useCallback(
    (freelancerId: Id<"users">) => {
      setSelectedSingleId(freelancerId);
      setDialogOpen(true);
    },
    []
  );

  const advanceSingleCarousel = useCallback(() => {
    if (singleCarouselIndex >= sortedSinglePool.length - 1) {
      setSinglePoolExhausted(true);
      return;
    }
    setSingleCarouselIndex((i) => i + 1);
  }, [singleCarouselIndex, sortedSinglePool.length]);

  const goBackSingleCarousel = useCallback(() => {
    setSingleCarouselIndex((i) => Math.max(0, i - 1));
    setSinglePoolExhausted(false);
  }, []);

  const restartSingleCarousel = useCallback(() => {
    setSingleCarouselIndex(0);
    setSinglePoolExhausted(false);
  }, []);

  const advanceRoleCarousel = useCallback(
    (roleLabel: string) => {
      const pool = sortedTeamPools.get(roleLabel) ?? [];
      const idx = roleCarouselIndex[roleLabel] ?? 0;
      if (idx >= pool.length - 1) {
        setRolePoolExhausted((ex) => ({ ...ex, [roleLabel]: true }));
        return;
      }
      setRoleCarouselIndex((prev) => ({
        ...prev,
        [roleLabel]: idx + 1,
      }));
    },
    [sortedTeamPools, roleCarouselIndex]
  );

  const goBackRoleCarousel = useCallback((roleLabel: string) => {
    setRoleCarouselIndex((prev) => ({
      ...prev,
      [roleLabel]: Math.max(0, (prev[roleLabel] ?? 0) - 1),
    }));
    setRolePoolExhausted((ex) => ({ ...ex, [roleLabel]: false }));
  }, []);

  const restartRoleCarousel = useCallback((roleLabel: string) => {
    setRoleCarouselIndex((p) => ({ ...p, [roleLabel]: 0 }));
    setRolePoolExhausted((ex) => ({ ...ex, [roleLabel]: false }));
  }, []);

  const clearRoleSelection = useCallback((roleLabel: string) => {
    setRoleSelections((prev) => {
      const next = { ...prev };
      delete next[roleLabel];
      return next;
    });
    restartRoleCarousel(roleLabel);
  }, [restartRoleCarousel]);

  const pickTeamSeat = useCallback(
    (roleLabel: string, freelancerId: Id<"users">) => {
      const idUsedElsewhere = Object.entries(roleSelections).some(
        ([key, id]) => key !== roleLabel && id === freelancerId
      );
      if (idUsedElsewhere) {
        toast.error("Each seat must be a different freelancer.");
        return;
      }
      if (isFundedMatchingContinuation) {
        const cap = project?.pendingTeamMemberSlots ?? 0;
        const wouldBe = { ...roleSelections, [roleLabel]: freelancerId };
        const count = Object.values(wouldBe).filter(Boolean).length;
        if (cap > 0 && count > cap) {
          toast.error(`You can select at most ${cap} team member(s) for this step.`);
          return;
        }
      }
      setRoleSelections((prev) => ({ ...prev, [roleLabel]: freelancerId }));
      toast.success(`Saved for ${roleLabel}.`);
    },
    [
      isFundedMatchingContinuation,
      project?.pendingTeamMemberSlots,
      roleSelections,
    ]
  );

  const handleConfirmTeamSelection = useCallback(() => {
    if (!isTeam) return;
    if (isFundedMatchingContinuation) {
      const ids = selectedTeamFreelancerIds;
      if (ids.length === 0) {
        toast.error("Select at least one freelancer to add to your team.");
        return;
      }
      const cap = project?.pendingTeamMemberSlots ?? 0;
      if (cap > 0 && ids.length > cap) {
        toast.error(`You can add at most ${cap} more team member(s) for this step.`);
        return;
      }
      if (new Set(ids).size !== ids.length) {
        toast.error("Each seat must be a different freelancer.");
        return;
      }
    } else {
      const missing = rolesWithPendingMatches.filter((r) => !roleSelections[r]);
      if (missing.length > 0) {
        toast.error(
          `Choose talent for each seat that has suggestions (${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "…" : ""}).`
        );
        return;
      }
      const ids = rolesWithPendingMatches.map(
        (r) => roleSelections[r]!
      );
      if (new Set(ids).size !== ids.length) {
        toast.error("Each seat must be a different freelancer.");
        return;
      }
    }
    setDialogOpen(true);
  }, [
    isTeam,
    isFundedMatchingContinuation,
    selectedTeamFreelancerIds,
    project?.pendingTeamMemberSlots,
    rolesWithPendingMatches,
    roleSelections,
  ]);

  const teamFreelancerIdsForSubmit = useMemo((): Id<"users">[] => {
    if (!isTeam) return [];
    if (isFundedMatchingContinuation) return selectedTeamFreelancerIds;
    return rolesWithPendingMatches
      .map((r) => roleSelections[r])
      .filter((id): id is Id<"users"> => id != null);
  }, [
    isTeam,
    isFundedMatchingContinuation,
    selectedTeamFreelancerIds,
    rolesWithPendingMatches,
    roleSelections,
  ]);

  const handleSkipSession = useCallback(async () => {
    if (!projectId || !user?._id) return;
    setDialogOpen(false);
    try {
      if (project?.status === "matching" && isTeam) {
        const ids = teamFreelancerIdsForSubmit;
        if (ids.length === 0) {
          toast.error("Select at least one freelancer.");
          return;
        }
        await confirmRemainingTeamSelections({
          projectId,
          freelancerIds: ids,
          userId: user._id,
        });
        trackEvent("accept_match", {
          project_id: projectId,
          freelancer_count: ids.length,
        });
        toast.success("Team updated.");
        router.push(`/dashboard/projects/${projectId}`);
        return;
      }
      if (isTeam) {
        await setSelectedFreelancers({
          projectId,
          freelancerIds: teamFreelancerIdsForSubmit,
          userId: user._id,
        });
      } else if (selectedSingleId) {
        await setSelectedFreelancer({
          projectId,
          freelancerId: selectedSingleId,
          userId: user._id,
        });
      }
      trackEvent("accept_match", {
        project_id: projectId,
        freelancer_count: isTeam ? teamFreelancerIdsForSubmit.length : 1,
      });
      router.push(`/dashboard/projects/${projectId}/contract`);
    } catch (e) {
      toast.error(getUserFriendlyError(e) || "Failed to save selection");
    }
  }, [
    projectId,
    user?._id,
    isTeam,
    selectedSingleId,
    teamFreelancerIdsForSubmit,
    project?.status,
    setSelectedFreelancer,
    setSelectedFreelancers,
    confirmRemainingTeamSelections,
    router,
    trackEvent,
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
        ? teamFreelancerIdsForSubmit
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
      trackEvent("schedule_session", { project_id: projectId, freelancer_count: freelancerIds.length });
      setScheduleDialogOpen(false);
      toast.success("Session scheduled. Check your email for the Meet link.");
      if (project?.status === "matching" && isTeam) {
        await confirmRemainingTeamSelections({
          projectId,
          freelancerIds,
          userId: user._id,
        });
        trackEvent("accept_match", { project_id: projectId, freelancer_count: freelancerIds.length });
        toast.success("Team updated.");
        router.push(`/dashboard/projects/${projectId}`);
        return;
      }
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
      trackEvent("accept_match", { project_id: projectId, freelancer_count: freelancerIds.length });
      router.push(`/dashboard/projects/${projectId}/contract`);
    } catch (e) {
      toast.error(getUserFriendlyError(e) || "Failed to schedule");
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
    teamFreelancerIdsForSubmit,
    project?.intakeForm?.title,
    project?.status,
    scheduleOneOnOneSession,
    setSelectedFreelancer,
    setSelectedFreelancers,
    confirmRemainingTeamSelections,
    router,
    trackEvent,
  ]);

  if (!user) return null;
  if (!projectId) {
    return (
      <div className="flex min-h-[400px] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{isClient ? "Invalid hire" : "Invalid project"}</CardTitle>
            <CardDescription>
              {isClient ? "This hire could not be found." : "This project could not be found."}
            </CardDescription>
          </CardHeader>
          <Link href="/dashboard/projects">
            <Button variant="outline">Back to hires</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (project === undefined || matches === undefined) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const clientCanViewMatches =
    isClient &&
    (project.status === "draft" ||
      project.status === "pending_funding" ||
      project.status === "funded" ||
      project.status === "matching");

  const freelancerHasPendingSuggestion =
    !isClient &&
    user.role === "freelancer" &&
    (matches ?? []).some(
      (m: EnrichedMatch) =>
        m.freelancerId === user._id && m.status === "pending"
    );

  const canUseMatchesPage =
    isFundedMatchingContinuation ||
    clientCanViewMatches ||
    freelancerHasPendingSuggestion;

  if (!canUseMatchesPage) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
        <p className="text-pretty text-muted-foreground">
          {isClient ? "This hire is no longer in the matching phase." : "This project is no longer in the matching phase."}
        </p>
        <Link href={`/dashboard/projects/${projectId}`}>
          <Button variant="outline">{isClient ? "View hire" : "View project"}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-10 sm:space-y-8 sm:px-6 lg:px-8">
      {isClient && isFreelancerReplacementFlow && projectId && (
        <FreelancerReplacementBanner
          projectId={projectId}
          className="scroll-mt-6"
        />
      )}

      <div
        id="replacement-matches-anchor"
        className="flex min-w-0 items-start gap-3 scroll-mt-24 sm:gap-4"
      >
        <Link href={`/dashboard/projects/${projectId}`} className="shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 touch-manipulation sm:h-10 sm:w-10"
            aria-label="Back to hire"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-pretty text-xl font-bold tracking-tight sm:text-2xl">
            {hasPreFundingSelection
              ? "Your selected talent"
              : isFreelancerReplacementFlow
                ? "Select a replacement"
                : isFundedMatchingContinuation
                  ? "Complete your team"
                  : "Matched freelancers"}
          </h1>
          <p className="mt-1 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground sm:mt-1.5 sm:text-[0.9375rem]">
            {hasPreFundingSelection
              ? project.clientContractSignedAt
                ? "You’ve signed the agreement with your choice below. When you’re ready, continue to payment to fund the hire — your selection stays on file."
                : "You’ve already chosen who to hire below. Continue to payment when you’re ready, or open your hire to review the contract."
              : isFreelancerReplacementFlow
                ? isTeam
                  ? "Replace only the open role(s) below. Team members you did not dispute stay on this hire. Your escrow is unchanged — you’ll sign an updated contract after selection."
                  : "Pick a new freelancer for this hire. Funds stay in escrow until you approve monthly payouts as usual."
                : isFundedMatchingContinuation
                  ? `Choose up to ${project.pendingTeamMemberSlots} more team member(s). We show one strong suggestion per seat at a time—you can cycle through up to ${MATCH_CAROUSEL_CAP} per seat.`
                  : isTeam
                    ? `For each seat we show one top match at a time (up to ${MATCH_CAROUSEL_CAP} per role). Confirm everyone, then continue.`
                    : `We ranked up to ${MATCH_CAROUSEL_CAP} strong matches—review the top pick first, or explore the shortlist before you continue.`}
          </p>
        </div>
      </div>

      {hasPreFundingSelection && projectId && user?._id && (
        <div className="space-y-4">
          <Card className="rounded-xl border-primary/25 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Who you’re hiring</CardTitle>
              <CardDescription>
                These are the freelancer(s) you selected. You won’t be asked to run matching again for this hire until
                payment completes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lockedSelectionMatches.map((m, i) => (
                  <MatchCard
                    key={m._id}
                    match={m}
                    rank={i + 1}
                    isSelected={true}
                    onSelect={() => {}}
                    onViewProfile={() => setViewingFreelancerId(m.freelancerId)}
                    isTeam={isTeam}
                    selectionLocked
                    continuePaymentHref={continuePaymentHref}
                  />
                ))}
                {orphanedPreFundingSelectionIds.map((fid, i) => (
                  <LockedSelectionProfileCard
                    key={fid}
                    projectId={projectId}
                    freelancerId={fid}
                    userId={user._id}
                    rank={lockedSelectionMatches.length + i + 1}
                    teamRole={undefined}
                    onViewProfile={() => setViewingFreelancerId(fid)}
                    continuePaymentHref={continuePaymentHref}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button asChild className="min-h-11 w-full touch-manipulation rounded-lg sm:w-auto sm:min-h-10">
                  <Link href={continuePaymentHref}>Continue to payment</Link>
                </Button>
                <Button variant="outline" asChild className="min-h-11 w-full touch-manipulation rounded-lg sm:w-auto sm:min-h-10">
                  <Link href={`/dashboard/projects/${projectId}/contract`}>View contract</Link>
                </Button>
                <Button variant="outline" asChild className="min-h-11 w-full touch-manipulation rounded-lg sm:w-auto sm:min-h-10">
                  <Link href={`/dashboard/projects/${projectId}`}>Back to hire</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showMatchingPolicyNote && (
        <Card className="rounded-xl border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4 px-4 sm:px-6 text-sm text-foreground/90 space-y-3">
            <p className="font-medium text-foreground">Open role(s)</p>
            <p className="text-muted-foreground leading-relaxed">
              We keep matching for up to <strong>48 hours</strong> and email you when there are people to
              review. If we can&apos;t staff the remaining role(s) in that window, you get a{" "}
              <strong>full refund</strong>.
            </p>
            {isFreelancerReplacementFlow && (
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 w-full touch-manipulation gap-2 rounded-lg sm:w-auto sm:min-h-10"
                onClick={() => void handleRetryReplacementMatches()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh replacement matches
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!hasPreFundingSelection &&
        isTeam &&
        rolesWithPendingMatches.length > 0 &&
        rolesWithNoMatches.length > 0 &&
        !isFundedMatchingContinuation && (
          <Card className="rounded-xl border-sky-500/30 bg-sky-500/5">
            <CardContent className="py-4 px-4 sm:px-6 text-sm space-y-2">
              <p className="font-medium text-foreground">
                You can move forward with the roles we already found
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Choose talent for each seat below that has suggestions. We&apos;re still looking for:{" "}
                <span className="font-medium text-foreground">
                  {rolesWithNoMatches.slice(0, 4).join(", ")}
                  {rolesWithNoMatches.length > 4 ? "…" : ""}
                </span>
                . After you continue, we&apos;ll keep matching those seats and notify you when new people are
                available.
              </p>
            </CardContent>
          </Card>
        )}

      {matchingRunning && !hasPreFundingSelection && (
        <Card className="rounded-xl border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-6 px-4 sm:px-6">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
            <span className="text-sm sm:text-base">Matching you with freelancers...</span>
          </CardContent>
        </Card>
      )}

      {!matchingRunning &&
        pendingMatches.length === 0 &&
        isFreelancerReplacementFlow &&
        (!isTeam || allRoleLabels.length === 0) && (
          <Card className="rounded-xl border-violet-500/25 bg-violet-500/4">
            <CardContent className="py-10 px-4 sm:px-8 text-center space-y-4">
              <p className="font-medium text-foreground text-base sm:text-lg">
                No replacement suggestions yet
              </p>
              <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                We couldn’t line up candidates automatically, or they&apos;re still loading. Refresh to run
                matching again — your hire stays protected in escrow.
              </p>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full touch-manipulation gap-2 rounded-xl sm:w-auto sm:min-h-10"
                onClick={() => void handleRetryReplacementMatches()}
              >
                <RefreshCw className="h-4 w-4 shrink-0" />
                Run matching again
              </Button>
            </CardContent>
          </Card>
        )}

      {!matchingRunning &&
        pendingMatches.length === 0 &&
        !(isTeam && allRoleLabels.length > 0) &&
        !isFreelancerReplacementFlow &&
        !hasPreFundingSelection && (
        <Card className="rounded-xl border-border/60">
          <CardContent className="py-12 px-4 sm:px-8 text-center space-y-4">
            {matchingAvailability ? (
              <>
                <p className="font-medium text-foreground text-base sm:text-lg">
                  No freelancers at your selected experience level right now.
                </p>
                <div className="text-muted-foreground text-sm sm:text-base space-y-2 max-w-lg mx-auto">
                  {matchingAvailability.hasLowerLevelWithExactSkills ? (
                    <>
                      <p>
                        We only show freelancers with the right role, tech stack, and a strong skill overlap.
                      </p>
                      <p>
                        We found lower-level freelancers with matching role and skills. You can review them if you want to widen this hire.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => void handleShowLowerLevelMatches()}
                        disabled={lowerLevelMatchingRunning}
                      >
                        {lowerLevelMatchingRunning ? "Loading..." : "Show lower-level matches"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <p>We&apos;ll match you with qualified talent once it becomes available at your selected role, skills, and level.</p>
                      <p>You&apos;ll be notified as soon as we have suitable matches ready for review.</p>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="font-medium text-foreground text-base sm:text-lg">
                  Thank you for submitting your hire request!
                </p>
                <div className="text-muted-foreground text-sm sm:text-base space-y-2 max-w-lg mx-auto">
                  <p>We&apos;re currently matching your role with the most qualified freelancers.</p>
                  <p>This may take a short moment as we ensure you get the best fit for your hire.</p>
                  <p>Matches usually appear within 24 hours.</p>
                  <p>You&apos;ll be notified as soon as we have suitable matches ready for review.</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {!hasPreFundingSelection && !isTeam && sortedSinglePool.length > 0 && !singlePoolExhausted && (
        <div className="mx-auto w-full max-w-xl space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Suggestion{" "}
              <span className="font-medium text-foreground">
                {singleCarouselIndex + 1}
              </span>{" "}
              of {sortedSinglePool.length}
            </p>
            {matchingRunning && (
              <span className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Updating matches…
              </span>
            )}
          </div>
          {(() => {
            const m = sortedSinglePool[singleCarouselIndex]!;
            return (
              <>
                <MatchCard
                  key={m._id}
                  match={m}
                  rank={singleCarouselIndex + 1}
                  isSelected={selectedSingleId === m.freelancerId}
                  onSelect={() => handleSelectSingle(m.freelancerId)}
                  onViewProfile={() => setViewingFreelancerId(m.freelancerId)}
                  primaryCtaLabel="Proceed with this talent"
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:max-w-md">
                  {singleCarouselIndex > 0 && (
                    <Button
                      variant="ghost"
                      className="min-h-11 w-full touch-manipulation rounded-lg sm:min-h-10 sm:flex-1"
                      onClick={goBackSingleCarousel}
                    >
                      ← Previous suggestion
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="min-h-11 w-full touch-manipulation rounded-lg sm:min-h-10 sm:flex-1"
                    onClick={advanceSingleCarousel}
                    disabled={singleCarouselIndex >= sortedSinglePool.length - 1}
                  >
                    Select another talent
                  </Button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {!hasPreFundingSelection && !isTeam && singlePoolExhausted && sortedSinglePool.length > 0 && (
        <Card className="rounded-xl border-amber-500/35 bg-amber-500/5">
          <CardContent className="py-8 px-4 sm:px-6 space-y-4 text-center">
            <p className="font-medium text-foreground">
              You&apos;ve reviewed everyone in this shortlist
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              We showed up to {MATCH_CAROUSEL_CAP} ranked matches for this hire. If none feel right, you can
              start again from the top suggestion, edit your hire (skills or experience level), or contact
              support—we&apos;re happy to help.
            </p>
            <div className="mx-auto flex max-w-md flex-col gap-2 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center">
              <Button variant="outline" className="min-h-11 w-full touch-manipulation rounded-lg sm:w-auto sm:min-h-10" onClick={restartSingleCarousel}>
                Back to top suggestion
              </Button>
              {projectId && (
                <Button variant="outline" className="min-h-11 w-full touch-manipulation rounded-lg sm:w-auto sm:min-h-10" asChild>
                  <Link href={`/dashboard/projects/${projectId}/edit`}>Edit hire</Link>
                </Button>
              )}
              <Button variant="outline" className="min-h-11 w-full touch-manipulation rounded-lg sm:w-auto sm:min-h-10" asChild>
                <Link href="/contact">Contact support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!hasPreFundingSelection && isTeam && allRoleLabels.length > 0 && (
        <div className="space-y-8 sm:space-y-10">
          {allRoleLabels.map((roleLabel) => {
            const roleMatches = matchesByRoleMap.get(roleLabel) ?? [];
            const pool = sortedTeamPools.get(roleLabel) ?? [];
            const idx = roleCarouselIndex[roleLabel] ?? 0;
            const exhausted = rolePoolExhausted[roleLabel] ?? false;
            const chosenId = roleSelections[roleLabel];
            const chosenMatch = chosenId
              ? pool.find((x) => x.freelancerId === chosenId) ??
                roleMatches.find((x) => x.freelancerId === chosenId)
              : undefined;
            const current = pool[idx];
            const retainedForRole = acceptedMatchesByRole.get(roleLabel) ?? [];

            return (
              <div key={roleLabel} className="mx-auto w-full max-w-xl space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <h2 className="text-base font-semibold leading-snug wrap-break-word text-pretty sm:text-lg">
                    {roleLabel}
                  </h2>
                  {chosenId && (
                    <Badge
                      variant="secondary"
                      className="w-full max-w-full whitespace-normal text-left text-xs leading-snug sm:w-fit sm:shrink-0"
                    >
                      Seat filled — you can change this before continuing
                    </Badge>
                  )}
                </div>

                {retainedForRole.length > 0 && roleMatches.length === 0 ? (
                  <Card className="rounded-xl border-border/60 bg-muted/15">
                    <CardContent className="space-y-3 py-5 px-4 sm:px-6">
                      <p className="text-sm font-medium text-foreground">
                        Current team member (not part of this dispute)
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        This seat stays filled. You only need to choose replacements for open roles below.
                      </p>
                      {retainedForRole.map((m) => (
                        <MatchCard
                          key={m._id}
                          match={m}
                          rank={1}
                          isSelected={true}
                          onSelect={() => {}}
                          onViewProfile={() => setViewingFreelancerId(m.freelancerId)}
                          isTeam
                          primaryCtaLabel="On your team"
                        />
                      ))}
                    </CardContent>
                  </Card>
                ) : roleMatches.length === 0 ? (
                  <Card className="rounded-xl border-dashed border-border/60 bg-muted/20">
                    <CardContent className="py-8 px-4 sm:px-6 text-center">
                      <p className="font-medium text-muted-foreground">
                        No available freelancers for this role at your selected experience level.
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {matchingAvailability?.hasLowerLevelWithExactSkills
                          ? "We have lower-level talent with matching role and skills. You can review them if you want to widen this hire."
                          : "We'll match you with qualified talent once it becomes available. You can proceed with your other selections or check back later."}
                      </p>
                      {matchingAvailability?.hasLowerLevelWithExactSkills && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => void handleShowLowerLevelMatches()}
                          disabled={lowerLevelMatchingRunning}
                        >
                          {lowerLevelMatchingRunning ? "Loading..." : "Show lower-level matches"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : chosenId && chosenMatch ? (
                  <div className="space-y-3">
                    <MatchCard
                      match={chosenMatch}
                      rank={idx + 1}
                      isSelected
                      onSelect={() => {}}
                      onViewProfile={() => {
                        setViewingTeamRoleLabel(roleLabel);
                        setViewingFreelancerId(chosenId);
                      }}
                      isTeam
                    />
                    <Button
                      variant="outline"
                      className="min-h-11 w-full touch-manipulation rounded-lg sm:w-auto sm:min-h-10"
                      onClick={() => clearRoleSelection(roleLabel)}
                    >
                      Change selection for this seat
                    </Button>
                  </div>
                ) : exhausted && pool.length > 0 ? (
                  <Card className="rounded-xl border-amber-500/35 bg-amber-500/5">
                    <CardContent className="py-8 px-4 sm:px-6 space-y-4 text-center">
                      <p className="font-medium text-foreground">
                        You&apos;ve seen all suggestions for {roleLabel}
                      </p>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                        We can show up to {MATCH_CAROUSEL_CAP} ranked freelancers per seat. Try starting again from the top,
                        adjust your hire, or reach out—we&apos;ll help you staff this role.
                      </p>
                      <div className="mx-auto flex max-w-md flex-col gap-2 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center">
                        <Button
                          variant="outline"
                          className="min-h-11 w-full touch-manipulation rounded-lg sm:w-auto sm:min-h-10"
                          onClick={() => restartRoleCarousel(roleLabel)}
                        >
                          Back to top suggestion
                        </Button>
                        {projectId && (
                          <Button variant="outline" className="min-h-11 w-full touch-manipulation rounded-lg sm:w-auto sm:min-h-10" asChild>
                            <Link href={`/dashboard/projects/${projectId}/edit`}>Edit hire</Link>
                          </Button>
                        )}
                        <Button variant="outline" className="min-h-11 w-full touch-manipulation rounded-lg sm:w-auto sm:min-h-10" asChild>
                          <Link href="/contact">Contact support</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : roleMatches.length > 0 && pool.length === 0 ? (
                  <Card className="rounded-xl border-amber-500/35 bg-amber-500/5">
                    <CardContent className="py-8 px-4 sm:px-6 space-y-3 text-center">
                      <p className="font-medium text-foreground">
                        All available candidates are already chosen for other seats
                      </p>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Free up a freelancer by changing another seat&apos;s selection, or check back later as
                        more matches become available.
                      </p>
                    </CardContent>
                  </Card>
                ) : current ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Suggestion{" "}
                      <span className="font-medium text-foreground">{idx + 1}</span> of{" "}
                      {pool.length}
                    </p>
                    <MatchCard
                      key={current._id}
                      match={current}
                      rank={idx + 1}
                      isSelected={roleSelections[roleLabel] === current.freelancerId}
                      onSelect={() => pickTeamSeat(roleLabel, current.freelancerId)}
                      onViewProfile={() => {
                        setViewingTeamRoleLabel(roleLabel);
                        setViewingFreelancerId(current.freelancerId);
                      }}
                      isTeam
                      primaryCtaLabel="Proceed with this talent"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row sm:max-w-md">
                      {idx > 0 && (
                        <Button
                          variant="ghost"
                          className="min-h-11 w-full touch-manipulation rounded-lg sm:min-h-10 sm:flex-1"
                          onClick={() => goBackRoleCarousel(roleLabel)}
                        >
                          ← Previous suggestion
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="min-h-11 w-full touch-manipulation rounded-lg sm:min-h-10 sm:flex-1"
                        onClick={() => advanceRoleCarousel(roleLabel)}
                        disabled={idx >= pool.length - 1}
                      >
                        Select another talent
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
          <Button
            onClick={handleConfirmTeamSelection}
            disabled={
              isFundedMatchingContinuation
                ? selectedTeamFreelancerIds.length === 0
                : rolesWithPendingMatches.length === 0 ||
                  !rolesWithPendingMatches.every((r) => roleSelections[r])
            }
            className="mx-auto block min-h-11 w-full max-w-xl touch-manipulation rounded-lg sm:min-h-10 lg:max-w-md"
          >
            {isFundedMatchingContinuation
              ? `Continue with ${selectedTeamFreelancerIds.length} selected`
              : rolesWithNoMatches.length > 0
                ? `Continue with ${rolesWithPendingMatches.length} filled seat(s)`
                : `Confirm all ${rolesWithPendingMatches.length} seat(s) & continue`}
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="left-4 top-4 max-h-[min(90dvh,calc(100dvh-2rem))] w-[calc(100vw-2rem)] max-w-lg translate-x-0 translate-y-0 gap-4 overflow-y-auto rounded-xl p-4 sm:left-[50%] sm:top-[50%] sm:max-h-[min(90dvh,40rem)] sm:w-full sm:translate-x-[-50%] sm:translate-y-[-50%] sm:p-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="pr-8 text-lg leading-snug sm:text-xl">
              One-on-one session (optional)
            </DialogTitle>
            <DialogDescription className="text-pretty text-sm leading-relaxed">
              We have carefully vetted our freelancers. If you’d like, you can
              schedule a live one-on-one session with your matched freelancer
              via Google Meet before proceeding to payment.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-2">
            <Button variant="outline" className="min-h-11 w-full touch-manipulation sm:min-h-10 sm:w-auto" onClick={handleSkipSession}>
              Skip session
            </Button>
            <Button className="min-h-11 w-full touch-manipulation sm:min-h-10 sm:w-auto" onClick={handleScheduleSession}>
              <Video className="mr-2 h-4 w-4 shrink-0" />
              Schedule one-on-one session
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="left-4 top-4 max-h-[min(90dvh,calc(100dvh-2rem))] w-[calc(100vw-2rem)] max-w-lg translate-x-0 translate-y-0 gap-4 overflow-y-auto rounded-xl p-4 sm:left-[50%] sm:top-[50%] sm:max-h-[min(90dvh,40rem)] sm:w-full sm:translate-x-[-50%] sm:translate-y-[-50%] sm:p-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="pr-8 text-lg leading-snug sm:text-xl">Pick date & time</DialogTitle>
            <DialogDescription className="text-pretty text-sm leading-relaxed">
              Choose when you’d like to meet. We’ll create a Google Meet and
              email the link to you and the freelancer(s).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:py-4">
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
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-2">
            <Button
              variant="outline"
              className="min-h-11 w-full touch-manipulation sm:min-h-10 sm:w-auto"
              onClick={() => setScheduleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button className="min-h-11 w-full touch-manipulation sm:min-h-10 sm:w-auto" onClick={handleConfirmSchedule} disabled={scheduling}>
              {scheduling ? (
                <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
              ) : null}
              Schedule & continue to payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full freelancer profile modal (View profile) */}
      <Dialog
        open={!!viewingFreelancerId}
        onOpenChange={(open) => {
          if (!open) {
            setViewingFreelancerId(null);
            setViewingTeamRoleLabel(null);
          }
        }}
      >
        <DialogContent className="left-4 top-4 max-h-[min(90dvh,calc(100dvh-2rem))] w-[calc(100vw-2rem)] max-w-2xl translate-x-0 translate-y-0 gap-0 overflow-x-hidden overflow-y-auto rounded-xl p-4 pt-14 sm:left-[50%] sm:top-[50%] sm:max-h-[min(90dvh,56rem)] sm:w-full sm:translate-x-[-50%] sm:translate-y-[-50%] sm:p-6 sm:pt-6">
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
                const fid = viewingFreelancerId;
                const roleLabel = viewingTeamRoleLabel;
                setViewingFreelancerId(null);
                setViewingTeamRoleLabel(null);
                if (isTeam && roleLabel) {
                  pickTeamSeat(roleLabel, fid);
                } else {
                  handleSelectSingle(fid);
                }
              }}
              onClose={() => {
                setViewingFreelancerId(null);
                setViewingTeamRoleLabel(null);
              }}
              isTeam={!!isTeam}
              freezeSelection={hasPreFundingSelection}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
