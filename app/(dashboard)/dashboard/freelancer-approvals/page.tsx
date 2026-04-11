"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/dashboard/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ShieldCheck, ExternalLink, Loader2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";

const ID_REJECT = [
  "Document is blurry or unreadable",
  "Document is expired",
  "Wrong document type submitted",
  "Name does not match account",
  "Other",
];

export default function FreelancerApprovalsPage() {
  const { user, isAuthenticated } = useAuth();
  const rows = useQuery(
    api.kyc.queries.getPendingSignupApprovals,
    isAuthenticated && user?.role === "admin" && user?._id ? { userId: user._id } : "skip"
  );
  const [selectedId, setSelectedId] = useState<Id<"users"> | null>(null);
  const detail = useQuery(
    api.kyc.queries.getSignupApprovalDetail,
    isAuthenticated && user?.role === "admin" && selectedId
      ? { freelancerId: selectedId, reviewerUserId: user._id }
      : "skip"
  );
  const approve = useMutation(api.kyc.mutations.approveFreelancerSignup);
  const rejectKyc = useMutation(api.kyc.mutations.rejectKyc);
  const [approving, setApproving] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectExtra, setRejectExtra] = useState("");
  const [rejecting, setRejecting] = useState(false);

  if (!isAuthenticated || !user) {
    return <DashboardEmptyState icon={ShieldCheck} title="Please log in" iconTone="muted" />;
  }
  if (user.role !== "admin") {
    return (
      <DashboardEmptyState icon={ShieldCheck} title="Admins only" description="You need admin access." iconTone="muted" />
    );
  }
  if (rows === undefined) {
    return <DashboardLoadingState label="Loading approvals" />;
  }

  const handleApprove = async () => {
    if (!selectedId || !user._id) return;
    setApproving(true);
    try {
      await approve({ freelancerId: selectedId, reviewerUserId: user._id });
      toast.success("Freelancer approved. They received a confirmation email.");
      setSelectedId(null);
    } catch (e) {
      toast.error(getUserFriendlyError(e) ?? "Approve failed");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedId || !user._id) return;
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
        freelancerId: selectedId,
        step: "id",
        reason,
        reviewerUserId: user._id,
      });
      toast.success("KYC rejected; freelancer was emailed to reupload.");
      setRejectOpen(false);
      setSelectedId(null);
      setRejectReason("");
      setRejectExtra("");
    } catch (e) {
      toast.error(getUserFriendlyError(e) ?? "Reject failed");
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Freelancer approvals"
        description="New signups with tests submitted and KYC pending. Approve to grant full platform access."
        icon={ShieldCheck}
      />

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Queue</CardTitle>
          <CardDescription>Sorted by KYC submission time (newest first).</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No pending signups.</p>
          ) : (
            <DataTable>
              <DataTableHeader>
                <DataTableRow>
                  <DataTableHead>Freelancer</DataTableHead>
                  <DataTableHead>Email</DataTableHead>
                  <DataTableHead>Weighted score</DataTableHead>
                  <DataTableHead />
                </DataTableRow>
              </DataTableHeader>
              <DataTableBody>
                {rows.map((r: (typeof rows)[number]) => (
                  <DataTableRow key={r.freelancerId}>
                    <DataTableCell className="font-medium">{r.name ?? "—"}</DataTableCell>
                    <DataTableCell className="text-muted-foreground text-sm">{r.email}</DataTableCell>
                    <DataTableCell>{r.overallScore.toFixed(1)}%</DataTableCell>
                    <DataTableCell className="text-right">
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setSelectedId(r.freelancerId)}>
                        View details
                      </Button>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review signup</DialogTitle>
            <DialogDescription>Tests (pending admin) and KYC documents.</DialogDescription>
          </DialogHeader>
          {detail === undefined ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : detail ? (
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium">{detail.freelancer.name}</p>
                <p className="text-muted-foreground break-all">{detail.freelancer.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">Vetting: {detail.vetting?.status}</Badge>
                  <Badge variant="outline">KYC: {detail.kyc?.status}</Badge>
                </div>
              </div>
              {detail.vetting && (
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="font-medium">Scores</p>
                  <p>Overall (stored): {detail.vetting.overallScore}%</p>
                  {detail.vetting.englishProficiency?.overallScore != null && (
                    <p>English composite: {detail.vetting.englishProficiency.overallScore}%</p>
                  )}
                  {detail.vetting.skillAssessments?.length > 0 && (
                    <p>
                      Skills:{" "}
                      {detail.vetting.skillAssessments
                        .map((a: { skillName: string; score: number }) => `${a.skillName} ${a.score}%`)
                        .join(" · ")}
                    </p>
                  )}
                </div>
              )}
              {detail.kyc && (
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="font-medium">KYC</p>
                  <p className="text-muted-foreground capitalize">
                    ID: {detail.kyc.idType?.replace(/_/g, " ")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {detail.kyc.idFrontUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={detail.kyc.idFrontUrl} target="_blank" rel="noreferrer">
                          ID front <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {detail.kyc.idBackUrl &&
                      detail.kyc.idBackFileId &&
                      detail.kyc.idBackFileId !== detail.kyc.idFrontFileId && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={detail.kyc.idBackUrl} target="_blank" rel="noreferrer">
                            ID additional <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    {detail.kyc.addressUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={detail.kyc.addressUrl} target="_blank" rel="noreferrer">
                          Address doc <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Could not load details.</p>
          )}
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setRejectOpen(true)} disabled={!detail}>
              Reject KYC
            </Button>
            <Button onClick={handleApprove} disabled={!detail || approving}>
              {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve signup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC</DialogTitle>
            <DialogDescription>The freelancer will receive an email with this reason and can reupload.</DialogDescription>
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
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejecting}>
              {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
