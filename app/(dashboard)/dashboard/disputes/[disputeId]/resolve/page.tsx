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

/** `projects.status` values allowed after dispute resolution (excludes `disputed`). */
type PostResolutionProjectStatus =
  | "draft"
  | "pending_funding"
  | "funded"
  | "matching"
  | "awaiting_freelancer"
  | "matched"
  | "in_progress"
  | "completed"
  | "cancelled";

const HIRE_STATUS_OPTIONS: Array<{ value: PostResolutionProjectStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "pending_funding", label: "Pending funding" },
  { value: "funded", label: "Funded" },
  { value: "matching", label: "Matching" },
  { value: "awaiting_freelancer", label: "Awaiting freelancer acceptance" },
  { value: "matched", label: "Matched" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function suggestedHireStatusForDecision(decision: ResolveDecision): PostResolutionProjectStatus {
  return decision === "client_favor" || decision === "replacement" ? "matching" : "in_progress";
}

export default function ResolveDisputePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const disputeId = params.disputeId as string;

  const [formData, setFormData] = useState({
    decision: "" as ResolveDecision | "",
    projectStatusAfterResolution: "in_progress" as PostResolutionProjectStatus,
    partialSplitMethod: "preset50" as "preset50" | "preset70" | "preset85" | "customPct" | "usd",
    partialCustomPercent: "",
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

  const project = useQuery(
    api.projects.queries.getProject,
    isAuthenticated && user?._id && dispute?.projectId
      ? { projectId: String(dispute.projectId), userId: user._id }
      : "skip"
  );

  const partialScope = useQuery(
    api.disputes.queries.getDisputePartialJudgmentScopeForStaff,
    isAuthenticated &&
      user?._id &&
      disputeId &&
      (user.role === "admin" || user.role === "moderator")
      ? { disputeId: disputeId as Id<"disputes">, userId: user._id }
      : "skip"
  );

  const resolveDispute = useMutation(api.disputes.mutations.resolveDispute);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.decision === "partial") {
      if (formData.partialSplitMethod === "customPct") {
        const p = parseInt(formData.partialCustomPercent, 10);
        if (!Number.isFinite(p) || p < 1 || p > 99) {
          setError("Enter a whole freelancer share between 1% and 99%.");
          return;
        }
      } else if (formData.partialSplitMethod === "usd") {
        const usd = parseFloat(formData.resolutionAmount);
        if (!Number.isFinite(usd) || usd <= 0) {
          setError("Enter a positive freelancer net amount (USD).");
          return;
        }
      }
    }

    if (!formData.decision || !formData.notes) {
      setError("Please fill in all required fields");
      return;
    }

    if (!user?._id) {
      setError("Not authenticated");
      return;
    }

    setIsSubmitting(true);

    try {
      let partialFreelancerSharePercent: number | undefined;
      let resolutionAmountCents: number | undefined;
      if (formData.decision === "partial") {
        if (
          formData.partialSplitMethod === "preset50" ||
          formData.partialSplitMethod === "preset70" ||
          formData.partialSplitMethod === "preset85"
        ) {
          const m: Record<string, number> = {
            preset50: 50,
            preset70: 70,
            preset85: 85,
          };
          partialFreelancerSharePercent = m[formData.partialSplitMethod];
        } else if (formData.partialSplitMethod === "customPct") {
          partialFreelancerSharePercent = parseInt(formData.partialCustomPercent, 10);
        } else {
          resolutionAmountCents = Math.round(parseFloat(formData.resolutionAmount) * 100);
        }
      }

      await resolveDispute({
        disputeId: disputeId as Id<"disputes">,
        decision: formData.decision as ResolveDecision,
        resolutionAmount: resolutionAmountCents,
        partialFreelancerSharePercent,
        notes: formData.notes,
        clientMessage: formData.clientMessage.trim() || undefined,
        freelancerMessage: formData.freelancerMessage.trim() || undefined,
        projectStatusAfterResolution: formData.projectStatusAfterResolution,
        userId: user._id,
      });

      router.push(`/dashboard/disputes/${disputeId}`);
    } catch (err: unknown) {
      setError(getUserFriendlyError(err) || "Failed to record judgment");
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
                ? "This dispute was cancelled and cannot be resolved."
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

  const staffCanJudge =
    user.role === "admin" ||
    (user.role === "moderator" &&
      !!dispute.assignedModeratorId &&
      String(dispute.assignedModeratorId) === String(user._id));

  if (!staffCanJudge) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center space-y-2">
            <p className="text-muted-foreground">
              {user.role === "moderator"
                ? "Claim this dispute from the case page (Assign to me) before recording a judgment."
                : "You are not authorized to record a judgment here."}
            </p>
            <Button asChild className="mt-4">
              <Link href={`/dashboard/disputes/${disputeId}`}>Back to dispute</Link>
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
          <h1 className="text-3xl font-bold tracking-tight">Record dispute judgment</h1>
          <p className="text-muted-foreground mt-1">
            Capture the decision, the hire status that should apply once the case is resolved, and staff notes.
            If the hire is marked disputed, it updates to your selected status as soon as the judgment is saved.
            Funds and roster steps still run from the dispute page under manual enforcement.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resolution Details</CardTitle>
          <CardDescription>
            Review the evidence and record a clear, enforceable decision.
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
                onValueChange={(value) => {
                  const decision = value as ResolveDecision;
                  setFormData({
                    ...formData,
                    decision,
                    projectStatusAfterResolution: suggestedHireStatusForDecision(decision),
                  });
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_favor">In Favor of Client</SelectItem>
                  <SelectItem value="freelancer_favor">In Favor of Freelancer</SelectItem>
                  <SelectItem value="partial">Partial Split</SelectItem>
                  <SelectItem value="replacement">Freelancer Replacement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hire-status-after">Hire status after resolution *</Label>
              <Select
                value={formData.projectStatusAfterResolution}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    projectStatusAfterResolution: value as PostResolutionProjectStatus,
                  })
                }
              >
                <SelectTrigger id="hire-status-after">
                  <SelectValue placeholder="Select hire status" />
                </SelectTrigger>
                <SelectContent>
                  {HIRE_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                This controls what status the hire should show after resolution. Typical choices:{" "}
                <span className="font-medium text-foreground">In progress</span> if work continues, or{" "}
                <span className="font-medium text-foreground">Matching</span> when the client must select a new
                freelancer. The default updates when you change the decision; adjust if needed.
              </p>
            </div>

            {formData.decision === "replacement" && (
              <Alert className="border-violet-500/35 bg-violet-500/6">
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
              <div className="space-y-5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4 sm:p-5">
                <div>
                  <Label className="text-base font-semibold">Partial payment — split the disputed pool</Label>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    This decision records how much of the{" "}
                    <strong className="font-medium text-foreground">freelancer-net</strong> money in dispute goes to
                    freelancers vs back to the client. Nothing moves until someone runs{" "}
                    <strong className="font-medium text-foreground">Run fund release</strong> on the dispute case page.
                  </p>
                </div>

                <Alert className="border-border/60 bg-background/80">
                  <Info className="h-4 w-4" />
                  <AlertTitle className="text-sm">How the platform applies it</AlertTitle>
                  <AlertDescription className="text-sm leading-relaxed text-muted-foreground space-y-2 pt-1">
                    <ol className="list-decimal list-inside space-y-1.5">
                      <li>
                        <strong className="text-foreground">Pool</strong> — The amount below is the disputed slice (e.g.
                        one monthly cycle or one team seat), in freelancer-net USD.
                      </li>
                      <li>
                        <strong className="text-foreground">Freelancer share</strong> — We pay this amount from escrow to
                        the freelancer wallet (team disputes: disputed seat(s) only).
                      </li>
                      <li>
                        <strong className="text-foreground">Client share</strong> — The remainder is credited to the
                        client&apos;s balance from escrow (not a separate “refund” line here — same escrow bucket).
                      </li>
                    </ol>
                  </AlertDescription>
                </Alert>

                {partialScope != null ? (
                  <div className="rounded-lg border border-border/50 bg-background px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-muted-foreground">Disputed pool (freelancer-net)</span>
                      <span className="font-mono text-lg font-semibold tabular-nums">
                        ${partialScope.freelancerNetUsd.toFixed(2)}
                      </span>
                    </div>
                    {partialScope.tiedToMonthlyCycle ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Tied to the monthly billing cycle attached to this dispute.
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">Hire-level / escrow pool in dispute.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Loading disputed pool…</p>
                )}

                <div>
                  <p className="mb-2 text-sm font-medium">Choose split</p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Percentages are <strong className="text-foreground">freelancer / client</strong> of the pool above
                    (both shares sum to 100% of that pool).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: "preset50" as const, label: "50% / 50%", sub: "Equal split" },
                        { id: "preset70" as const, label: "70% / 30%", sub: "Freelancer weighted" },
                        { id: "preset85" as const, label: "85% / 15%", sub: "Mostly freelancer" },
                      ] as const
                    ).map((opt) => (
                      <Button
                        key={opt.id}
                        type="button"
                        size="sm"
                        variant={formData.partialSplitMethod === opt.id ? "default" : "outline"}
                        className="h-auto flex-col items-start gap-0.5 py-2.5"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            partialSplitMethod: opt.id,
                            resolutionAmount: "",
                          })
                        }
                      >
                        <span>{opt.label}</span>
                        <span className="text-[10px] font-normal opacity-80">{opt.sub}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-border/40 bg-background/60 p-3">
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="radio"
                      name="partialSplitMethod"
                      checked={formData.partialSplitMethod === "customPct"}
                      onChange={() =>
                        setFormData({ ...formData, partialSplitMethod: "customPct", resolutionAmount: "" })
                      }
                      className="accent-primary mt-1"
                    />
                    <span>
                      <span className="font-medium">Custom percentage</span>
                      <span className="block text-xs text-muted-foreground">
                        Freelancer gets this % of the pool; client gets the rest.
                      </span>
                    </span>
                  </label>
                  {formData.partialSplitMethod === "customPct" && (
                    <div className="pl-6">
                      <Input
                        type="number"
                        min={1}
                        max={99}
                        step={1}
                        value={formData.partialCustomPercent}
                        onChange={(e) =>
                          setFormData({ ...formData, partialCustomPercent: e.target.value })
                        }
                        placeholder="e.g. 65 (= 65% freelancer)"
                        className="max-w-xs"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2 rounded-lg border border-border/40 bg-background/60 p-3">
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="radio"
                      name="partialSplitMethod"
                      checked={formData.partialSplitMethod === "usd"}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          partialSplitMethod: "usd",
                          partialCustomPercent: "",
                        })
                      }
                      className="accent-primary mt-1"
                    />
                    <span>
                      <span className="font-medium">Exact freelancer amount (USD, net)</span>
                      <span className="block text-xs text-muted-foreground">
                        Type the dollar amount freelancers should receive; we derive the client portion as pool minus
                        this (capped at the pool).
                      </span>
                    </span>
                  </label>
                  {formData.partialSplitMethod === "usd" && (
                    <div className="pl-6">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.resolutionAmount}
                        onChange={(e) =>
                          setFormData({ ...formData, resolutionAmount: e.target.value })
                        }
                        placeholder="0.00"
                        className="max-w-xs"
                      />
                    </div>
                  )}
                </div>

                {partialScope != null &&
                  (() => {
                    let freelancerCents = 0;
                    if (formData.partialSplitMethod === "usd") {
                      const usd = parseFloat(formData.resolutionAmount);
                      if (!Number.isFinite(usd) || usd <= 0) return null;
                      freelancerCents = Math.round(usd * 100);
                    } else {
                      let pct = 0;
                      if (formData.partialSplitMethod === "preset50") pct = 50;
                      else if (formData.partialSplitMethod === "preset70") pct = 70;
                      else if (formData.partialSplitMethod === "preset85") pct = 85;
                      else if (formData.partialSplitMethod === "customPct") {
                        pct = parseInt(formData.partialCustomPercent, 10);
                      }
                      if (!Number.isFinite(pct) || pct < 1 || pct > 99) return null;
                      freelancerCents = Math.floor((partialScope.freelancerNetCents * pct) / 100);
                    }
                    const cap = partialScope.freelancerNetCents;
                    const fl = Math.min(freelancerCents, cap);
                    const clientCents = Math.max(0, cap - fl);
                    const flUsd = fl / 100;
                    const clientUsd = clientCents / 100;
                    return (
                      <div className="overflow-hidden rounded-lg border border-primary/20 bg-primary/[0.04]">
                        <div className="border-b border-border/50 bg-muted/30 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Payment summary (after you save judgment)
                        </div>
                        <div className="grid divide-y divide-border/50 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                          <div className="p-4">
                            <p className="text-xs text-muted-foreground">Total pool</p>
                            <p className="font-mono text-base font-semibold tabular-nums">
                              ${partialScope.freelancerNetUsd.toFixed(2)}
                            </p>
                          </div>
                          <div className="p-4">
                            <p className="text-xs text-muted-foreground">→ Freelancer(s) net</p>
                            <p className="font-mono text-base font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                              ${flUsd.toFixed(2)}
                            </p>
                          </div>
                          <div className="p-4">
                            <p className="text-xs text-muted-foreground">→ Client (from escrow)</p>
                            <p className="font-mono text-base font-semibold tabular-nums">
                              ${clientUsd.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <p className="border-t border-border/50 px-4 py-2 text-xs text-muted-foreground">
                          Next step on the case: <strong className="text-foreground">Manual enforcement</strong> →{" "}
                          <strong className="text-foreground">Run fund release</strong> to execute this split.
                        </p>
                      </div>
                    );
                  })()}

                <p className="text-xs text-muted-foreground">
                  Amounts are freelancer-net (what hits freelancer wallets). Platform fee was already handled when the
                  client funded escrow; partial split applies only inside this disputed pool.
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
                <div className="col-span-2">
                  <span className="text-muted-foreground">Current hire status:</span>{" "}
                  {project === undefined
                    ? "Loading…"
                    : project
                      ? String(project.status).replace(/_/g, " ")
                      : "—"}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Resolving dispute..." : "Resolve dispute"}
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

