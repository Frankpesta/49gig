"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type EnrichedWithdrawalRequest = Doc<"walletBankWithdrawalRequests"> & {
  freelancerName: string;
  freelancerEmail: string;
};
import { ArrowDownToLine, Loader2 } from "lucide-react";

function formatDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminWithdrawalApprovalsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const requests = useQuery(api.walletWithdrawals.queries.getWalletWithdrawalRequests, {
    limit: 200,
  });
  const rejectMutation = useMutation(
    api.walletWithdrawals.mutations.rejectFreelancerBankWithdrawal
  );
  const approveAction = useAction(
    api.walletWithdrawals.actions.adminApproveFreelancerBankWithdrawal
  );

  const [approveId, setApproveId] = useState<Id<"walletBankWithdrawalRequests"> | null>(null);
  const [rejectRow, setRejectRow] = useState<Id<"walletBankWithdrawalRequests"> | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (!user || user.role !== "admin") {
    return null;
  }

  const list: EnrichedWithdrawalRequest[] = (requests ?? []) as EnrichedWithdrawalRequest[];
  const pending = list.filter((r) => r.status === "pending");
  const history = list.filter((r) => r.status !== "pending");

  const handleApproveConfirm = async () => {
    if (!approveId) return;
    setBusy(true);
    try {
      await approveAction({ requestId: approveId });
      toast.success("Withdrawal approved; Flutterwave transfer was initiated.");
      setApproveId(null);
    } catch (e) {
      toast.error(getUserFriendlyError(e) || "Approval failed");
    } finally {
      setBusy(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectRow) return;
    setBusy(true);
    try {
      await rejectMutation({
        requestId: rejectRow,
        adminNote: rejectNote.trim() || undefined,
      });
      toast.success("Withdrawal request rejected.");
      setRejectRow(null);
      setRejectNote("");
    } catch (e) {
      toast.error(getUserFriendlyError(e) || "Reject failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Bank withdrawal approvals"
        description="Review freelancer wallet withdrawals. Approving runs a Flutterwave transfer to their linked bank."
        icon={ArrowDownToLine}
      />

      <AlertDialog open={approveId !== null} onOpenChange={(o) => !o && !busy && setApproveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this withdrawal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will initiate a Flutterwave transfer and debit the freelancer&apos;s in-app wallet
              for the requested amount. Ensure their bank details in Settings are correct.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleApproveConfirm();
              }}
              disabled={busy}
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  Processing
                </>
              ) : (
                "Approve & transfer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rejectRow !== null} onOpenChange={(o) => !o && !busy && setRejectRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject withdrawal request?</AlertDialogTitle>
            <AlertDialogDescription>
              The freelancer keeps their wallet balance. Optionally add a note (not shown to users if
              your product doesn&apos;t surface it—currently stored on the request).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Internal note (optional)"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void handleRejectConfirm();
              }}
              disabled={busy}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="rounded-xl overflow-hidden">
        <CardHeader>
          <CardTitle>Pending</CardTitle>
          <CardDescription>Requests awaiting your decision.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requests === undefined ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending bank withdrawal requests.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((r) => (
                <div
                  key={r._id}
                  className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {r.freelancerName}{" "}
                      <span className="font-normal text-muted-foreground">&lt;{r.freelancerEmail}&gt;</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDollars(r.amountCents)} · requested{" "}
                      {formatDistanceToNow(r.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button size="sm" variant="destructive" onClick={() => setRejectRow(r._id)}>
                      Reject
                    </Button>
                    <Button size="sm" onClick={() => setApproveId(r._id)}>
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl overflow-hidden">
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>Processed and failed withdrawal requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {requests === undefined ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No past requests.</p>
          ) : (
            <div className="space-y-2">
              {history.map((r) => (
                <div
                  key={r._id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/40 px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{r.freelancerName}</span>
                    <span className="text-muted-foreground"> — {formatDollars(r.amountCents)}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDistanceToNow(r.createdAt, { addSuffix: true })}
                      {r.errorMessage ? ` · ${r.errorMessage}` : ""}
                    </span>
                  </div>
                  <Badge
                    variant={
                      r.status === "completed"
                        ? "default"
                        : r.status === "failed" || r.status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
