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
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";
import { Handshake, CheckCircle2, XCircle, Loader2, Clock, DollarSign, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

type MatchRequest = {
  _id: string;
  projectTitle?: string | null;
  projectDescription?: string | null;
  clientName?: string | null;
  projectDuration?: string | null;
  totalAmount?: number | null;
  score: number;
  confidence: "low" | "medium" | "high";
};

const CONFIDENCE_STYLES = {
  low: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  high: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
};

export default function MatchRequestsPage() {
  const { user, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const focusMatchId = searchParams.get("matchId");

  const [declineMatchId, setDeclineMatchId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [responding, setResponding] = useState<string | null>(null);

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

  const handleAccept = async (matchId: string) => {
    setResponding(matchId);
    try {
      await respond({ matchId: matchId as Id<"matches">, response: "accepted", userId: user._id });
      toast.success("You've accepted! Contract generation is in progress.");
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
              className="rounded-xl overflow-hidden border-primary/20 shadow-sm scroll-mt-24"
            >
              <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
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
                    Match score: {match.score}/100
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    className="flex-1 gap-1.5"
                    onClick={() => handleAccept(match._id)}
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Decline dialog */}
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
