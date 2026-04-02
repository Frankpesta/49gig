"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  ShieldCheck,
  User,
  Shield,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  FileText,
  Clock,
  CalendarCheck,
} from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";
import Link from "next/link";

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

function DocLink({ url, label }: { url: string | null; label: string }) {
  if (!url) {
    return (
      <div className="rounded-lg border border-border/40 bg-muted/30 p-4 space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm text-muted-foreground italic">Not submitted</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border/40 bg-muted/30 p-4 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <FileText className="h-4 w-4" />
        Open document
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

const KYC_STATUS_STYLES: Record<string, string> = {
  not_submitted: "bg-muted text-muted-foreground",
  pending_review: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  approved: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  resubmit_required: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
};

export default function UserKycPage() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const params = useParams();
  const userId = params.userId as string;

  const [rejectDialog, setRejectDialog] = useState<{ step: "id" | "address" } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectExtra, setRejectExtra] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const profileData = useQuery(
    api.users.queries.getUserProfileForAdmin,
    isAuthenticated && currentUser?._id && (currentUser.role === "admin" || currentUser.role === "moderator")
      ? { targetUserId: userId as Id<"users">, adminUserId: currentUser._id }
      : "skip"
  );

  const kycData = useQuery(
    api.kyc.queries.getKycByFreelancerId,
    isAuthenticated && currentUser?._id && (currentUser.role === "admin" || currentUser.role === "moderator")
      ? { freelancerId: userId as Id<"users">, reviewerUserId: currentUser._id }
      : "skip"
  );

  const approveKyc = useMutation(api.kyc.mutations.approveKyc);
  const rejectKyc = useMutation(api.kyc.mutations.rejectKyc);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approveKyc({ freelancerId: userId as Id<"users">, reviewerUserId: currentUser?._id });
      toast.success("KYC approved successfully.");
    } catch (e) {
      toast.error(getUserFriendlyError(e) ?? "Failed to approve KYC");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog || !rejectReason.trim()) return;
    const reason = rejectExtra.trim() ? `${rejectReason}: ${rejectExtra}` : rejectReason;
    setIsRejecting(true);
    try {
      const result = await rejectKyc({
        freelancerId: userId as Id<"users">,
        step: rejectDialog.step,
        reason,
        reviewerUserId: currentUser?._id,
      });
      setRejectDialog(null);
      setRejectReason("");
      setRejectExtra("");
      if ((result as any)?.accountDeleted) {
        toast.success("KYC rejected. Account removed after 2 rejections.");
      } else {
        toast.success("KYC rejected. Freelancer will receive an email to resubmit.");
      }
    } catch (e) {
      toast.error(getUserFriendlyError(e) ?? "Failed to reject KYC");
    } finally {
      setIsRejecting(false);
    }
  };

  if (!isAuthenticated || !currentUser) {
    return <DashboardEmptyState icon={User} title="Please log in" iconTone="muted" />;
  }

  if (currentUser.role !== "admin" && currentUser.role !== "moderator") {
    return (
      <DashboardEmptyState
        icon={Shield}
        iconTone="muted"
        title="Access restricted"
        description="Only admins and moderators can review KYC documents."
        action={<Button asChild><Link href="/dashboard/users">Back to Users</Link></Button>}
      />
    );
  }

  if (profileData === undefined || kycData === undefined) {
    return <DashboardLoadingState label="Loading KYC data" />;
  }

  if (!profileData) {
    return (
      <DashboardEmptyState
        icon={User}
        iconTone="muted"
        title="User not found"
        action={<Button asChild><Link href="/dashboard/users">Back to Users</Link></Button>}
      />
    );
  }

  if (profileData.role !== "freelancer") {
    return (
      <DashboardEmptyState
        icon={ShieldCheck}
        iconTone="muted"
        title="Not a freelancer"
        description="KYC documents are only available for freelancer accounts."
        action={<Button asChild><Link href={`/dashboard/users/${userId}`}>Back to Profile</Link></Button>}
      />
    );
  }

  const kycStatus = (profileData as any).kycStatus ?? "not_submitted";
  const canAction = kycData && kycData.status === "pending_review" && !kycData.documentsDeletedAt;
  const currentReasons = rejectDialog?.step === "id" ? ID_REJECTION_REASONS : ADDRESS_REJECTION_REASONS;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href={`/dashboard/users/${userId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <DashboardPageHeader
          title="KYC Review"
          description={`Identity and address verification documents for ${profileData.name}`}
          icon={ShieldCheck}
          className="flex-1"
        />
      </div>

      {/* Status overview */}
      <Card className="rounded-xl overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">{profileData.name}</CardTitle>
              <CardDescription>{profileData.email}</CardDescription>
            </div>
            <Badge
              className={`capitalize text-xs ${KYC_STATUS_STYLES[kycStatus] ?? "bg-muted text-muted-foreground"}`}
              variant="outline"
            >
              {kycStatus.replace(/_/g, " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {(profileData as any).kycApprovedAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarCheck className="h-4 w-4 text-green-500" />
              Approved on {format((profileData as any).kycApprovedAt, "PPP")}
            </div>
          )}
          {kycData?.submittedAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Submitted {format(kycData.submittedAt, "PPP 'at' p")}
            </div>
          )}
        </CardContent>
      </Card>

      {!kycData ? (
        <DashboardEmptyState
          icon={ShieldCheck}
          iconTone="muted"
          title="No KYC submission"
          description={`${profileData.name} has not submitted KYC documents yet.`}
        />
      ) : kycData.documentsDeletedAt ? (
        <DashboardEmptyState
          icon={ShieldCheck}
          iconTone="muted"
          title="Documents deleted"
          description="KYC documents have been deleted after review as per our data retention policy."
        />
      ) : (
        <>
          {/* Documents */}
          <Card className="rounded-xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Identity Documents
              </CardTitle>
              <CardDescription>
                ID type: <span className="font-medium capitalize">{kycData.idType?.replace(/_/g, " ") ?? "—"}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <DocLink url={kycData.idFrontUrl ?? null} label="ID — Front" />
              <DocLink url={kycData.idBackUrl ?? null} label="ID — Back" />
            </CardContent>
          </Card>

          <Card className="rounded-xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Proof of Address
              </CardTitle>
              <CardDescription>
                Document type: <span className="font-medium capitalize">{kycData.addressDocType?.replace(/_/g, " ") ?? "—"}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocLink url={kycData.addressUrl ?? null} label="Address Document" />
            </CardContent>
          </Card>

          {/* Rejection history */}
          {((kycData.idRejectionReasons?.length ?? 0) > 0 || (kycData.addressRejectionReasons?.length ?? 0) > 0) && (
            <Card className="rounded-xl overflow-hidden border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Rejection History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(kycData.idRejectionReasons?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">ID rejections ({kycData.idRejectionReasons?.length ?? 0}/2)</p>
                    <ul className="space-y-1">
                      {kycData.idRejectionReasons?.map((r: string, i: number) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-1.5">
                          <span className="text-muted-foreground mt-0.5">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(kycData.addressRejectionReasons?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Address rejections ({kycData.addressRejectionReasons?.length ?? 0}/2)</p>
                    <ul className="space-y-1">
                      {kycData.addressRejectionReasons?.map((r: string, i: number) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-1.5">
                          <span className="text-muted-foreground mt-0.5">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {canAction && (
            <Card className="rounded-xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Review Actions</CardTitle>
                <CardDescription>Approve or reject the submitted documents.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button
                  className="gap-1.5"
                  onClick={handleApprove}
                  disabled={isApproving}
                >
                  {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Approve KYC
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setRejectDialog({ step: "id" })}
                  disabled={isApproving}
                >
                  <XCircle className="h-4 w-4" />
                  Reject ID
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setRejectDialog({ step: "address" })}
                  disabled={isApproving}
                >
                  <XCircle className="h-4 w-4" />
                  Reject Address
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Reject dialog */}
      <AlertDialog open={!!rejectDialog} onOpenChange={() => !isRejecting && setRejectDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Reject {rejectDialog?.step === "id" ? "Identity Document" : "Address Document"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Select a reason for rejection. The freelancer will be notified and asked to resubmit.
              Two rejections of the same step result in permanent account removal.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Rejection reason</Label>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {currentReasons.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {rejectReason === "Other" && (
              <div className="space-y-2">
                <Label>Additional details</Label>
                <Textarea
                  placeholder="Describe the issue..."
                  value={rejectExtra}
                  onChange={(e) => setRejectExtra(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRejecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectReason.trim() || isRejecting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRejecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Rejection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
