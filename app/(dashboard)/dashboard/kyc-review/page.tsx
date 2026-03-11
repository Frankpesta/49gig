"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ShieldCheck, ExternalLink, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";

const ID_REJECTION_REASONS = [
  "Document is blurry or unreadable",
  "Document is expired",
  "Wrong document type submitted",
  "Front and back do not match",
  "Name does not match account",
  "Other",
];

const ADDRESS_REJECTION_REASONS = [
  "Document is older than 3 months",
  "Document is blurry or unreadable",
  "Address does not match account",
  "Wrong document type",
  "Other",
];

export default function KycReviewPage() {
  const { user, isAuthenticated } = useAuth();
  const pending = useQuery(
    api.kyc.queries.getPendingKycSubmissions,
    isAuthenticated && user?._id ? { userId: user._id } : "skip"
  );
  const approveKyc = useMutation(api.kyc.mutations.approveKyc);
  const rejectKyc = useMutation(api.kyc.mutations.rejectKyc);

  const [rejectDialog, setRejectDialog] = useState<{
    freelancerId: Id<"users">;
    step: "id" | "address";
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectExtra, setRejectExtra] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [approvingId, setApprovingId] = useState<Id<"users"> | null>(null);

  const handleApprove = async (freelancerId: Id<"users">) => {
    setApprovingId(freelancerId);
    try {
      await approveKyc({ freelancerId, reviewerUserId: user?._id });
      toast.success("KYC approved. Freelancer can now be matched.");
    } catch (e) {
      toast.error(getUserFriendlyError(e) ?? "Failed to approve");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog || !rejectReason.trim()) return;
    const reason = rejectExtra.trim() ? `${rejectReason}: ${rejectExtra}` : rejectReason;
    setIsRejecting(true);
    try {
      const result = await rejectKyc({
        freelancerId: rejectDialog.freelancerId,
        step: rejectDialog.step,
        reason,
        reviewerUserId: user?._id,
      });
      setRejectDialog(null);
      setRejectReason("");
      setRejectExtra("");
      if (result.accountDeleted) {
        toast.success("KYC rejected. Account removed after 2 rejections.");
      } else {
        toast.success("KYC rejected. Freelancer will receive an email to resubmit.");
      }
    } catch (e) {
      toast.error(getUserFriendlyError(e) ?? "Failed to reject");
    } finally {
      setIsRejecting(false);
    }
  };

  if (!isAuthenticated || !user) {
    return <DashboardEmptyState icon={ShieldCheck} title="Please log in" iconTone="muted" />;
  }

  if (user.role !== "admin" && user.role !== "moderator") {
    return (
      <DashboardEmptyState
        icon={ShieldCheck}
        iconTone="muted"
        title="Access restricted"
        description="Only admins and moderators can review KYC submissions."
        action={
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="KYC Review"
        description="Review freelancer ID and address verification. Approve or reject with a reason. Two rejections of the same step result in account removal."
        icon={ShieldCheck}
      />

      {pending === undefined ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : pending.length === 0 ? (
        <DashboardEmptyState
          icon={ShieldCheck}
          iconTone="muted"
          title="No pending KYC"
          description="When freelancers submit ID and address documents, they will appear here for review."
        />
      ) : (
        <div className="space-y-4">
          {pending.map((s: {
            freelancerId: Id<"users">;
            freelancerName: string | null;
            freelancerEmail: string | null;
            idType: string;
            addressDocType: string;
            idFrontUrl: string | null;
            idBackUrl: string | null;
            addressUrl: string | null;
          }) => (
            <Card key={s.freelancerId}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{s.freelancerName ?? "—"}</CardTitle>
                    <CardDescription>{s.freelancerEmail ?? "—"}</CardDescription>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ID (front)</p>
                    {s.idFrontUrl ? (
                      <a
                        href={s.idFrontUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        View <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ID (back)</p>
                    {s.idBackUrl ? (
                      <a
                        href={s.idBackUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        View <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address doc</p>
                    {s.addressUrl ? (
                      <a
                        href={s.addressUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        View <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  ID type: {s.idType.replace(/_/g, " ")} · Address: {s.addressDocType.replace(/_/g, " ")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => handleApprove(s.freelancerId)}
                    disabled={approvingId === s.freelancerId}
                  >
                    {approvingId === s.freelancerId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => setRejectDialog({ freelancerId: s.freelancerId, step: "id" })}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject ID
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => setRejectDialog({ freelancerId: s.freelancerId, step: "address" })}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Address
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!rejectDialog} onOpenChange={() => !isRejecting && setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejectDialog?.step === "id" ? "ID" : "Address"} verification</DialogTitle>
            <DialogDescription>
              The freelancer will receive an email with this reason and can resubmit. Rejecting the same step twice will remove their account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Reason</Label>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {(rejectDialog?.step === "id" ? ID_REJECTION_REASONS : ADDRESS_REJECTION_REASONS).map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Additional details (optional)</Label>
              <Textarea
                className="mt-1"
                placeholder="Extra context for the freelancer"
                value={rejectExtra}
                onChange={(e) => setRejectExtra(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)} disabled={isRejecting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isRejecting || !rejectReason.trim()}>
              {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
