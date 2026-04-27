"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getUserFriendlyError } from "@/lib/error-handling";
import Link from "next/link";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

type ResolveDecision = "client_favor" | "freelancer_favor" | "partial" | "replacement";

export default function ResolveDisputePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const disputeId = params.disputeId as string;

  const [formData, setFormData] = useState({
    decision: "" as ResolveDecision | "",
    resolutionAmount: "",
    notes: "",
    clientMessage: "",
    freelancerMessage: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispute = useQuery(
    api.disputes.queries.getDispute,
    isAuthenticated && user?._id && disputeId
      ? { disputeId: disputeId as Id<"disputes">, userId: user._id }
      : "skip"
  );

  const resolveDispute = useMutation(api.disputes.mutations.resolveDispute);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.decision || !formData.notes) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.decision === "partial" && !formData.resolutionAmount) {
      setError("Resolution amount is required for partial decisions");
      return;
    }

    if (!user?._id) {
      setError("Not authenticated");
      return;
    }

    setIsSubmitting(true);

    try {
      await resolveDispute({
        disputeId: disputeId as Id<"disputes">,
        decision: formData.decision as ResolveDecision,
        resolutionAmount: formData.resolutionAmount
          ? parseFloat(formData.resolutionAmount) * 100
          : undefined,
        notes: formData.notes,
        clientMessage: formData.clientMessage.trim() || undefined,
        freelancerMessage: formData.freelancerMessage.trim() || undefined,
        userId: user._id,
      });

      router.push(`/dashboard/disputes/${disputeId}`);
    } catch (err: unknown) {
      setError(getUserFriendlyError(err) || "Failed to resolve dispute");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  if (user.role !== "moderator" && user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Only moderators and admins can resolve disputes
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/disputes">Back to Disputes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (dispute === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (dispute === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Dispute not found</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/disputes">Back to Disputes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (
    dispute.status === "resolved" ||
    dispute.status === "closed" ||
    dispute.status === "cancelled"
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {dispute.status === "cancelled"
                ? "This dispute was cancelled and cannot be resolved here."
                : "This dispute is already resolved"}
            </p>
            <Button asChild className="mt-4">
              <Link href={`/dashboard/disputes/${disputeId}`}>View Dispute</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/disputes/${disputeId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resolve Dispute</h1>
          <p className="text-muted-foreground mt-1">
            Make a decision and resolve this dispute
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resolution Details</CardTitle>
          <CardDescription>
            Review the dispute and provide your resolution decision
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="decision">Decision *</Label>
              <Select
                value={formData.decision}
                onValueChange={(value) =>
                  setFormData({ ...formData, decision: value as ResolveDecision })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resolution decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_favor">In Favor of Client</SelectItem>
                  <SelectItem value="freelancer_favor">In Favor of Freelancer</SelectItem>
                  <SelectItem value="partial">Partial Resolution</SelectItem>
                  <SelectItem value="replacement">Freelancer Replacement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.decision === "replacement" && (
              <Alert className="border-violet-500/35 bg-violet-500/[0.06]">
                <Info className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <AlertTitle className="text-violet-950 dark:text-violet-100">
                  Freelancer replacement
                </AlertTitle>
                <AlertDescription className="text-sm leading-relaxed text-muted-foreground">
                  The assigned freelancer(s) will be removed from this hire, past match records cleared,
                  monthly billing cycles reset for a fresh schedule after you match again, and the contract
                  will be regenerated for signatures. The client must pick a replacement;{" "}
                  <strong className="text-foreground font-medium">escrow is not refunded</strong> by this
                  decision.
                </AlertDescription>
              </Alert>
            )}

            {formData.decision === "partial" && (
              <div className="space-y-2">
                <Label htmlFor="resolutionAmount">
                  Resolution Amount (USD) *
                </Label>
                <Input
                  id="resolutionAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.resolutionAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, resolutionAmount: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Amount credited to the freelancer&apos;s wallet (USD). The rest of current escrow is credited to the client&apos;s in-platform balance. Unreleased monthly cycles are cancelled after this split.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Internal Resolution Notes *</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Full explanation of your decision (staff use, included in dispute record)..."
                rows={6}
                required
              />
              <p className="text-sm text-muted-foreground">
                This is your full internal ruling. It is included in the dispute record and visible to the winning party.
              </p>
            </div>

            <div className="rounded-lg border border-border/60 p-4 space-y-4">
              <p className="text-sm font-medium">Personalized party messages <span className="text-muted-foreground font-normal">(optional — auto-generated if left blank)</span></p>
              <div className="space-y-2">
                <Label htmlFor="clientMessage">Message to client</Label>
                <Textarea
                  id="clientMessage"
                  value={formData.clientMessage}
                  onChange={(e) =>
                    setFormData({ ...formData, clientMessage: e.target.value })
                  }
                  placeholder="Leave blank to auto-generate based on the decision…"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freelancerMessage">Message to freelancer</Label>
                <Textarea
                  id="freelancerMessage"
                  value={formData.freelancerMessage}
                  onChange={(e) =>
                    setFormData({ ...formData, freelancerMessage: e.target.value })
                  }
                  placeholder="Leave blank to auto-generate based on the decision…"
                  rows={3}
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm font-medium">Dispute Summary</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Type:</span>{" "}
                  {dispute.type.replace("_", " ")}
                </div>
                <div>
                  <span className="text-muted-foreground">Locked amount:</span>{" "}
                  ${Number(dispute.lockedAmount ?? 0).toFixed(2)}
                </div>
                <div>
                  <span className="text-muted-foreground">Initiator:</span>{" "}
                  {dispute.initiatorRole}
                </div>
                <div>
                  <span className="text-muted-foreground">Evidence Items:</span>{" "}
                  {dispute.evidence.length}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Resolving..." : "Resolve Dispute"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/dashboard/disputes/${disputeId}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

