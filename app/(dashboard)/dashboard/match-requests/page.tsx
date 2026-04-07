"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";
import { Handshake, CheckCircle2, XCircle, Loader2, Clock, DollarSign, Calendar, Briefcase, Star, Users, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

type MatchRequest = {
  _id: string;
  projectId?: string | null;
  projectTitle?: string | null;
  projectDescription?: string | null;
  clientName?: string | null;
  projectDuration?: string | null;
  totalAmount?: number | null;
  score: number;
  confidence: "low" | "medium" | "high";
  teamRole?: string | null;
  hireType?: string | null;
  experienceLevel?: string | null;
  roleType?: string | null;
  requiredSkills?: string[];
  specialRequirements?: string | null;
  startDate?: string | null;
};

const CONFIDENCE_STYLES = {
  low: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  high: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
};

export default function MatchRequestsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusMatchId = searchParams.get("matchId");

  const [declineMatchId, setDeclineMatchId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [responding, setResponding] = useState<string | null>(null);
  const [detailMatch, setDetailMatch] = useState<MatchRequest | null>(null);

  const pendingMatches = useQuery(
    (api as any).matching.queries.getPendingFreelancerMatches,
    isAuthenticated && user?._id ? { userId: user._id } : "skip"
  );

  const respond = useMutation((api as any).matching.mutations.respondToMatchAsFreelancer);
  const didScrollToMatchRef = useRef<string | null>(null);

  useEffect(() => {
    if (!focusMatchId || pendingMatches === undefined || pendingMatches.length === 0) return;
    if (!pendingMatches.some((m: MatchRequest) => m._id === focusMatchId)) return;
    if (didScrollToMatchRef.current === focusMatchId) return;
    didScrollToMatchRef.current = focusMatchId;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`freelancer-match-${focusMatchId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.classList.add("ring-2", "ring-primary", "ring-offset-2", "rounded-xl");
      window.setTimeout(() => {
        el?.classList.remove("ring-2", "ring-primary", "ring-offset-2", "rounded-xl");
      }, 2500);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [focusMatchId, pendingMatches]);

  if (!isAuthenticated || !user) {
    return <DashboardEmptyState icon={Handshake} title="Please log in" iconTone="muted" />;
  }

  if (user.role !== "freelancer") {
    return <DashboardEmptyState icon={Handshake} title="This page is for freelancers" iconTone="muted" />;
  }

  if (pendingMatches === undefined) {
    return <DashboardLoadingState label="Loading match requests" />;
  }

  const handleAccept = async (matchId: string, projectId?: string | null) => {
    setResponding(matchId);
    try {
      const result = await respond({
        matchId: matchId as Id<"matches">,
        response: "accepted",
        userId: user._id,
      });
      if (result?.contractFlowStarted && result.projectId) {
        toast.success("You've accepted. Opening the contract to sign.");
        router.push(`/dashboard/projects/${result.projectId}/contract`);
      } else {
        toast.success(
          projectId
            ? "You've accepted. Open this hire from Hires when the team is complete to sign."
            : "You've accepted. We'll notify you when it's time to sign the contract."
        );
        if (projectId) {
          router.push(`/dashboard/projects/${projectId}`);
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to accept");
    } finally {
      setResponding(null);
    }
  };

  const handleDecline = async () => {
    if (!declineMatchId) return;
    setResponding(declineMatchId);
    try {
      await respond({
        matchId: declineMatchId as Id<"matches">,
        response: "rejected",
        rejectionReason: declineReason.trim() || undefined,
        userId: user._id,
      });
      toast.success("You've declined this opportunity.");
      setDeclineMatchId(null);
      setDeclineReason("");
    } catch (e: any) {
      toast.error(e.message || "Failed to decline");
    } finally {
      setResponding(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Match Requests"
        description="Review and respond to opportunities where clients have selected you."
        icon={Handshake}
      />

      {pendingMatches.length === 0 ? (
        <DashboardEmptyState
          icon={Handshake}
          iconTone="muted"
          title="No pending match requests"
          description="You'll be notified here when a client selects you for a project."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pendingMatches.map((match: MatchRequest) => (
            <Card
              key={match._id}
              id={`freelancer-match-${match._id}`}
              className="group rounded-xl overflow-hidden border-primary/20 shadow-sm scroll-mt-24 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
              onClick={() => setDetailMatch(match)}
            >
              <div className="h-1 bg-linear-to-r from-primary to-primary/60" />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">
                    {match.projectTitle || "Untitled Project"}
                  </CardTitle>
                  <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CONFIDENCE_STYLES[match.confidence]}`}>
                    {match.confidence} match
                  </span>
                </div>
                {match.clientName && (
                  <CardDescription>Client: {match.clientName}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {match.projectDescription && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{match.projectDescription}</p>
                )}

                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" />
                    {match.totalAmount ? `$${match.totalAmount.toLocaleString()}` : "Budget TBD"}
                  </div>
                  {match.projectDuration && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {match.projectDuration} {Number(match.projectDuration) === 1 ? "month" : "months"}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Score: {match.score}/100
                  </div>
                </div>

                <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    className="flex-1 gap-1.5"
                    onClick={() => handleAccept(match._id, match.projectId ?? undefined)}
                    disabled={responding === match._id}
                  >
                    {responding === match._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5"
                    onClick={() => setDeclineMatchId(match._id)}
                    disabled={responding === match._id}
                  >
                    <XCircle className="h-4 w-4" />
                    Decline
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-3 w-3" /> Tap card to view full project details
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Project details dialog */}
      <Dialog open={!!detailMatch} onOpenChange={(open) => { if (!open) setDetailMatch(null); }}>
        <DialogContent className="flex max-h-[min(90dvh,calc(100dvh-2rem))] flex-col overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg leading-snug pr-6">
              {detailMatch?.projectTitle || "Project Details"}
            </DialogTitle>
            {detailMatch?.clientName && (
              <DialogDescription>Client: {detailMatch.clientName}</DialogDescription>
            )}
          </DialogHeader>

          <div className="flex-1 space-y-5 overflow-y-auto py-2 pr-1">
            {/* Match quality badge */}
            {detailMatch && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CONFIDENCE_STYLES[detailMatch.confidence]}`}>
                  {detailMatch.confidence} match
                </span>
                <span className="text-xs text-muted-foreground">Match score: {detailMatch.score}/100</span>
                {detailMatch.teamRole && (
                  <Badge variant="secondary" className="text-xs">{detailMatch.teamRole}</Badge>
                )}
              </div>
            )}

            {/* Description */}
            {detailMatch?.projectDescription && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">About this project</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{detailMatch.projectDescription}</p>
              </div>
            )}

            <Separator />

            {/* Key details grid */}
            <div className="grid grid-cols-2 gap-3">
              {detailMatch?.totalAmount && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                    <DollarSign className="h-3.5 w-3.5" /> Total Budget
                  </div>
                  <p className="font-semibold text-sm">${detailMatch.totalAmount.toLocaleString()}</p>
                </div>
              )}
              {detailMatch?.projectDuration && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                    <Calendar className="h-3.5 w-3.5" /> Duration
                  </div>
                  <p className="font-semibold text-sm">
                    {detailMatch.projectDuration} {Number(detailMatch.projectDuration) === 1 ? "month" : "months"}
                  </p>
                </div>
              )}
              {detailMatch?.experienceLevel && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                    <Star className="h-3.5 w-3.5" /> Level Required
                  </div>
                  <p className="font-semibold text-sm capitalize">{detailMatch.experienceLevel}</p>
                </div>
              )}
              {detailMatch?.hireType && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                    <Users className="h-3.5 w-3.5" /> Hire Type
                  </div>
                  <p className="font-semibold text-sm capitalize">{detailMatch.hireType}</p>
                </div>
              )}
              {detailMatch?.roleType && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                    <Briefcase className="h-3.5 w-3.5" /> Commitment
                  </div>
                  <p className="font-semibold text-sm capitalize">{detailMatch.roleType.replace("_", " ")}</p>
                </div>
              )}
              {detailMatch?.startDate && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                    <Calendar className="h-3.5 w-3.5" /> Start Date
                  </div>
                  <p className="font-semibold text-sm">
                    {new Date(detailMatch.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              )}
            </div>

            {/* Required skills */}
            {detailMatch?.requiredSkills && detailMatch.requiredSkills.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Skills Required</p>
                <div className="flex flex-wrap gap-1.5">
                  {detailMatch.requiredSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Special requirements */}
            {detailMatch?.specialRequirements && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Special Requirements</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{detailMatch.specialRequirements}</p>
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 border-t border-border/60 pt-4 gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5"
              onClick={() => { setDeclineMatchId(detailMatch!._id); setDetailMatch(null); }}
              disabled={responding === detailMatch?._id}
            >
              <XCircle className="h-4 w-4" />
              Decline
            </Button>
            <Button
              className="flex-1 gap-1.5"
              onClick={async () => {
                await handleAccept(detailMatch!._id, detailMatch!.projectId ?? undefined);
                setDetailMatch(null);
              }}
              disabled={responding === detailMatch?._id}
            >
              {responding === detailMatch?._id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline confirmation dialog */}
      <Dialog open={!!declineMatchId} onOpenChange={() => { setDeclineMatchId(null); setDeclineReason(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Decline this opportunity?</DialogTitle>
            <DialogDescription>
              The client will be notified and can select another freelancer. You can optionally provide a reason.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Optional: brief reason for declining..."
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeclineMatchId(null); setDeclineReason(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={!!responding}
            >
              {responding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Yes, Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
