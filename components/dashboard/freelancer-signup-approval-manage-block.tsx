"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";

const ID_REJECT = [
  "Document is blurry or unreadable",
  "Document is expired",
  "Wrong document type submitted",
  "Name does not match account",
  "Other",
];

type Props = {
  freelancerId: Id<"users">;
  adminUserId: Id<"users">;
  /** When false, skip queries (dialog closed or not a freelancer row). */
  enabled: boolean;
  onAfterAction: () => void;
};

export function FreelancerSignupApprovalManageBlock({
  freelancerId,
  adminUserId,
  enabled,
  onAfterAction,
}: Props) {
  // Convex infers very deep types for this query (TS2589); keep call site shallow.
  const detail = useQuery(
    api.kyc.queries.getSignupApprovalDetail as typeof api.kyc.queries.getSignupApprovalDetail,
    (enabled
      ? { freelancerId, reviewerUserId: adminUserId }
      : "skip") as
      | { freelancerId: Id<"users">; reviewerUserId: Id<"users"> }
      | "skip"
  );
  const approve = useMutation(api.kyc.mutations.approveFreelancerSignup);
  const rejectKyc = useMutation(api.kyc.mutations.rejectKyc);
  const [approving, setApproving] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectExtra, setRejectExtra] = useState("");
  const [rejecting, setRejecting] = useState(false);

  if (!enabled) return null;

  const kycStatus =
    detail?.kyc && typeof detail.kyc === "object" && "status" in detail.kyc
      ? String((detail.kyc as { status: string }).status)
      : "";
  const inSignupQueue =
    detail?.vetting?.status === "pending_admin" && kycStatus === "pending_review";

  if (detail === undefined) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/15 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        Loading signup review data…
      </div>
    );
  }

  if (!inSignupQueue) return null;

  const handleApprove = async () => {
    setApproving(true);
    try {
      await approve({ freelancerId, reviewerUserId: adminUserId });
      toast.success("Freelancer approved. They received a confirmation email.");
      onAfterAction();
    } catch (e) {
      toast.error(getUserFriendlyError(e) ?? "Approve failed");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    const reason =
      rejectReason === "Other"
        ? rejectExtra.trim() || "Other"
        : rejectReason.trim();
    if (!reason) {
      toast.error("Select or enter a reason");
      return;
    }
    setRejecting(true);
    try {
      await rejectKyc({
        freelancerId,
        step: "id",
        reason,
        reviewerUserId: adminUserId,
      });
      toast.success("KYC rejected; freelancer was emailed to reupload.");
      setRejectOpen(false);
      setRejectReason("");
      setRejectExtra("");
      onAfterAction();
    } catch (e) {
      toast.error(getUserFriendlyError(e) ?? "Reject failed");
    } finally {
      setRejecting(false);
    }
  };

  const kyc = detail.kyc as {
    idType?: string;
    idFrontUrl?: string | null;
    idBackUrl?: string | null;
    idBackFileId?: string;
    idFrontFileId?: string;
    addressUrl?: string | null;
  } | null;

  return (
    <>
      <div className="space-y-3 rounded-lg border border-primary/25 bg-primary/5 p-3 dark:bg-primary/10">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          Signup approval
          <Badge variant="secondary" className="font-normal">
            Tests + KYC
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          This freelancer submitted KYC and is waiting for a one-step signup approval (approves tests and
          identity together).
        </p>
        <div className="space-y-2 text-sm">
          <p className="font-medium">{detail.freelancer.name}</p>
          <p className="text-muted-foreground break-all text-xs">{detail.freelancer.email}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Vetting: {detail.vetting?.status}</Badge>
            <Badge variant="outline">KYC: {kycStatus || "—"}</Badge>
          </div>
        </div>
        {detail.vetting && (
          <div className="rounded-md border border-border/60 bg-background/60 p-3 text-xs space-y-1">
            <p className="font-medium text-foreground">Scores</p>
            <p className="text-muted-foreground">Overall (stored): {detail.vetting.overallScore}%</p>
            {detail.vetting.englishProficiency?.overallScore != null && (
              <p className="text-muted-foreground">
                English composite: {detail.vetting.englishProficiency.overallScore}%
              </p>
            )}
            {detail.vetting.skillAssessments?.length > 0 && (
              <p className="text-muted-foreground">
                Skills:{" "}
                {detail.vetting.skillAssessments
                  .map((a: { skillName: string; score: number }) => `${a.skillName} ${a.score}%`)
                  .join(" · ")}
              </p>
            )}
          </div>
        )}
        {kyc && (
          <div className="rounded-md border border-border/60 bg-background/60 p-3 text-xs space-y-2">
            <p className="font-medium text-foreground">KYC documents</p>
            <p className="text-muted-foreground capitalize">
              ID: {kyc.idType?.replace(/_/g, " ")}
            </p>
            <div className="flex flex-wrap gap-2">
              {kyc.idFrontUrl && (
                <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                  <a href={kyc.idFrontUrl} target="_blank" rel="noreferrer">
                    ID front <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              )}
              {kyc.idBackUrl &&
                kyc.idBackFileId &&
                kyc.idBackFileId !== kyc.idFrontFileId && (
                  <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                    <a href={kyc.idBackUrl} target="_blank" rel="noreferrer">
                      ID additional <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                )}
              {kyc.addressUrl && (
                <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                  <a href={kyc.addressUrl} target="_blank" rel="noreferrer">
                    Address doc <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={() => setRejectOpen(true)}>
            Reject KYC…
          </Button>
          <Button type="button" size="sm" onClick={() => void handleApprove()} disabled={approving}>
            {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve signup"}
          </Button>
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject KYC</DialogTitle>
            <DialogDescription>
              The freelancer will receive an email with this reason and can reupload.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Reason</Label>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a reason" />
                </SelectTrigger>
                <SelectContent>
                  {ID_REJECT.map((x) => (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {rejectReason === "Other" && (
              <Textarea
                value={rejectExtra}
                onChange={(e) => setRejectExtra(e.target.value)}
                placeholder="Details for the freelancer"
              />
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void handleReject()} disabled={rejecting}>
              {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
