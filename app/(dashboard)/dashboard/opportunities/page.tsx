"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Briefcase, TrendingUp, Clock, MapPin, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Doc, Id } from "@/convex/_generated/dataModel";

export default function OpportunitiesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const matches = useQuery(
    api.matching.queries.getFreelancerMatches,
    isAuthenticated && user?._id && user?.role === "freelancer"
      ? { freelancerId: user._id, userId: user._id, status: "pending" }
      : "skip"
  );

  const acceptMatch = useMutation(api.matching.mutations.acceptMatch);
  const rejectMatch = useMutation(api.matching.mutations.rejectMatch);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  if (user.role !== "freelancer") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">This page is only available for freelancers</p>
      </div>
    );
  }

  if (matches === undefined) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold">Opportunities</h1>
          <p className="text-muted-foreground">
            View and accept project matches tailored to your skills.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No opportunities yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              We're working on finding the perfect projects for you. Check back soon!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold">Opportunities</h1>
        <p className="text-muted-foreground">
          View and accept project matches tailored to your skills.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {matches.map((match: Doc<"matches"> & { project: { _id: Id<"projects">; intakeForm?: { title?: string; description?: string }; status: string; totalAmount: number; currency: string } | null }) => (
          <Card key={match._id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">
                    {match.project?.intakeForm?.title || "Untitled Project"}
                  </CardTitle>
                  <CardDescription>
                    {match.project?.intakeForm?.description?.substring(0, 100)}...
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    match.confidence === "high"
                      ? "default"
                      : match.confidence === "medium"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {match.score.toFixed(0)}% Match
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Match Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Match Score:</span>
                  <span>{match.score.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {match.expiresAt
                      ? `Expires ${formatDistanceToNow(new Date(match.expiresAt), { addSuffix: true })}`
                      : "No expiration"}
                  </span>
                </div>
              </div>

              {/* Scoring Breakdown */}
              <div className="space-y-2 rounded-lg border p-3 bg-muted/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Match Breakdown
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Skills:</span>{" "}
                    <span className="font-medium">
                      {match.scoringBreakdown.skillOverlap.toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vetting:</span>{" "}
                    <span className="font-medium">
                      {match.scoringBreakdown.vettingScore.toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ratings:</span>{" "}
                    <span className="font-medium">
                      {match.scoringBreakdown.ratings.toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Availability:</span>{" "}
                    <span className="font-medium">
                      {match.scoringBreakdown.availability.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <p className="text-sm text-muted-foreground">{match.explanation}</p>

              {/* Project Details */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-semibold">
                    ${match.project?.totalAmount?.toFixed(2) || "0.00"}{" "}
                    {match.project?.currency?.toUpperCase() || "USD"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (match.project?._id) {
                      router.push(`/dashboard/projects/${match.project._id}`);
                    }
                  }}
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await rejectMatch({
                        matchId: match._id,
                        userId: user._id,
                      });
                    } catch (error) {
                      console.error("Failed to reject match:", error);
                    }
                  }}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await acceptMatch({
                        matchId: match._id,
                        userId: user._id,
                      });
                      if (match.project?._id) {
                        router.push(`/dashboard/projects/${match.project._id}`);
                      }
                    } catch (error) {
                      console.error("Failed to accept match:", error);
                    }
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Accept
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

