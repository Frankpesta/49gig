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
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ResolveDisputePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const disputeId = params.disputeId as string;

  const [formData, setFormData] = useState({
    decision: "" as
      | "client_favor"
      | "freelancer_favor"
      | "partial"
      | "replacement"
      | "",
    resolutionAmount: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispute = useQuery(
    api.disputes.queries.getDispute,
    isAuthenticated && user?._id && disputeId
      ? { disputeId: disputeId as any, userId: user._id }
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
        disputeId: disputeId as any,
        decision: formData.decision as any,
        resolutionAmount: formData.resolutionAmount
          ? parseFloat(formData.resolutionAmount) * 100
          : undefined,
        notes: formData.notes,
      });

      router.push(`/dashboard/disputes/${disputeId}`);
    } catch (err: any) {
      setError(err.message || "Failed to resolve dispute");
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

  if (dispute.status === "resolved" || dispute.status === "closed") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">This dispute is already resolved</p>
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
                  setFormData({ ...formData, decision: value as any })
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
                  Amount to be released to freelancer (in USD). Remaining amount will be refunded to client.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Resolution Notes *</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Provide detailed explanation of your decision..."
                rows={8}
                required
              />
              <p className="text-sm text-muted-foreground">
                This explanation will be visible to both parties and included in the dispute record.
              </p>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm font-medium">Dispute Summary</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Type:</span>{" "}
                  {dispute.type.replace("_", " ")}
                </div>
                <div>
                  <span className="text-muted-foreground">Amount Locked:</span>{" "}
                  ${(dispute.lockedAmount / 100).toFixed(2)}
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

