"use client";

import { useState } from "react";
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
import { Doc, Id } from "@/convex/_generated/dataModel";

export default function MonthlyApprovalsPage() {
  const { user } = useAuth();
  const pendingCycles = useQuery(api.monthlyBillingCycles.queries.getPendingCyclesForClient);
  const approveCycle = useMutation(api.monthlyBillingCycles.mutations.approveMonthlyCycle);

  const [approvingId, setApprovingId] = useState<Id<"monthlyBillingCycles"> | null>(null);

  const handleApprove = async (cycleId: Id<"monthlyBillingCycles">) => {
    setApprovingId(cycleId);
    try {
      await approveCycle({ monthlyCycleId: cycleId });
      toast.success("Month approved. Funds have been released to the freelancer's wallet.");
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
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-300">
        <DashboardPageHeader
          title="Monthly Approvals"
          description="Approve monthly payments for your projects."
          icon={CalendarCheck}
        />
        <Card>
          <CardContent className="py-12">
            <DashboardEmptyState
              icon={CalendarCheck}
              title="Clients only"
              description="Monthly approvals are for project clients. At the end of each month, you can approve or dispute payments."
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
        description="Approve or dispute monthly payments for your active projects."
        icon={CalendarCheck}
      />

      <Card className="rounded-xl overflow-hidden">
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>
            Review and approve each month's work. Funds are released to the freelancer's wallet upon
            approval.
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
              title="No pending approvals"
              description="All monthly payments are up to date. New approvals will appear here at the end of each billing cycle."
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
  onApprove,
  isApproving,
}: {
  cycle: Doc<"monthlyBillingCycles">;
  userId: Id<"users">;
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
  const amountDollars = (cycle.amountCents / 100).toFixed(2);

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border/60 bg-muted/20">
      <div>
        <div className="font-medium">
          {project?.intakeForm?.title ?? "Project"} – {monthLabel}
        </div>
        <div className="text-sm text-muted-foreground">
          Month {cycle.monthIndex} • ${amountDollars} {cycle.currency.toUpperCase()}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/projects/${cycle.projectId}`}>View Project</Link>
        </Button>
        <Button
          size="sm"
          onClick={onApprove}
          disabled={isApproving}
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
