"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { useAuth } from "@/hooks/use-auth";
import { CalendarCheck, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";
import { getDurationMonths } from "@/lib/project-duration";
import { Doc, Id } from "@/convex/_generated/dataModel";

export default function MonthlyApprovalsPage() {
  const { user } = useAuth();
  const [approvalClockMs, setApprovalClockMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setApprovalClockMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const pendingCycles = useQuery(
    api.monthlyBillingCycles.queries.getPendingCyclesForClient,
    user?._id ? { clockMs: approvalClockMs, userId: user._id } : "skip"
  );
  const approveCycle = useMutation(api.monthlyBillingCycles.mutations.approveMonthlyCycle);

  const [approvingId, setApprovingId] = useState<Id<"monthlyBillingCycles"> | null>(null);

  const handleApprove = async (cycleId: Id<"monthlyBillingCycles">) => {
    if (!user?._id) return;
    setApprovingId(cycleId);
    try {
      await approveCycle({ monthlyCycleId: cycleId, userId: user._id });
      toast.success("Month approved. Funds have been released to the freelancer's wallet. They can withdraw to their bank.");
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Approval failed");
    } finally {
      setApprovingId(null);
    }
  };

  if (!user) {
    return null;
  }

  if (user.role !== "client") {
    const isStaff = user.role === "admin" || user.role === "moderator";
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-300">
        <DashboardPageHeader
          title="Monthly Approvals"
          description={
            isStaff
              ? "Approving months releases escrow to freelancers — only the hiring client can do that."
              : "Approve monthly payments for your hires."
          }
          icon={CalendarCheck}
        />
        <Card>
          <CardContent className="py-12">
            <DashboardEmptyState
              icon={CalendarCheck}
              title={isStaff ? "Client action" : "Clients only"}
              description={
                isStaff
                  ? "Staff can open a hire to review billing cycles and disputes, but cannot approve releases on the client’s behalf."
                  : "Monthly approvals are for clients. At the end of each month, you can approve or dispute payments for your hires."
              }
              iconTone="muted"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Monthly Approvals"
        description="Approve or dispute monthly payments for your active hires."
        icon={CalendarCheck}
      />

      <Card className="rounded-xl overflow-hidden">
        <CardHeader>
          <CardTitle>Pending approvals</CardTitle>
          <CardDescription>
            All unpaid months for your active hires are listed below. Approve is available only after each
            billing period ends; until then the button stays disabled. Approval releases funds to the
            freelancer&apos;s wallet (they withdraw to their bank when ready).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingCycles === undefined ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : pendingCycles.length === 0 ? (
            <DashboardEmptyState
              icon={CalendarCheck}
              title="No pending months"
              description="There are no pending billing months on your active hires. New periods appear here when a hire is in progress and a month is waiting for approval."
              iconTone="muted"
              className="border-0 bg-transparent py-8 shadow-none"
            />
          ) : (
            <div className="space-y-4">
              {pendingCycles.map((cycle: Doc<"monthlyBillingCycles">) => (
                <MonthlyApprovalCard
                  key={cycle._id}
                  cycle={cycle}
                  userId={user._id}
                  clockMs={approvalClockMs}
                  onApprove={() => handleApprove(cycle._id)}
                  isApproving={approvingId === cycle._id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MonthlyApprovalCard({
  cycle,
  userId,
  clockMs,
  onApprove,
  isApproving,
}: {
  cycle: Doc<"monthlyBillingCycles">;
  userId: Id<"users">;
  clockMs: number;
  onApprove: () => void;
  isApproving: boolean;
}) {
  const project = useQuery(
    (api as any)["projects/queries"].getProject,
    userId ? { projectId: cycle.projectId, userId } : "skip"
  );

  const monthLabel = new Date(cycle.monthStartDate).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const durMonths = getDurationMonths(project?.intakeForm?.projectDuration) || 1;
  const amountDollars = project
    ? (project.totalAmount / durMonths).toFixed(2)
    : (cycle.amountCents / 100).toFixed(2);

  const canApprove = cycle.monthEndDate <= clockMs;
  const periodEndsLabel = new Date(cycle.monthEndDate).toLocaleDateString("en-US", {
    dateStyle: "medium",
  });

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border border-border/60 bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="font-medium">
          {project?.intakeForm?.title ?? "Hire"} – {monthLabel}
        </div>
        <div className="text-sm text-muted-foreground">
          Month {cycle.monthIndex} • ${amountDollars} {cycle.currency.toUpperCase()}
        </div>
        {!canApprove && (
          <div className="mt-1 text-xs text-amber-700 dark:text-amber-500">
            Billing period in progress — you can approve after {periodEndsLabel}.
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/projects/${cycle.projectId}`}>View Hire</Link>
        </Button>
        <Button
          size="sm"
          onClick={onApprove}
          disabled={!canApprove || isApproving}
          title={
            canApprove
              ? undefined
              : `Approve will unlock after the billing period ends (${periodEndsLabel}).`
          }
          className="gap-2"
        >
          {isApproving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Approve
        </Button>
      </div>
    </div>
  );
}
