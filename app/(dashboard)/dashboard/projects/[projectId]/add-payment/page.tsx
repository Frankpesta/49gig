"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, DollarSign, ExternalLink } from "lucide-react";
import { getUserFriendlyError } from "@/lib/error-handling";
import { getDurationMonths } from "@/lib/project-duration";
import Link from "next/link";

export default function AddPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const projectId = params.projectId as string;

  const createTopUpPaymentIntent = useAction(
    (api as any)["payments/actions"].createTopUpPaymentIntent
  );
  const project = useQuery(
    (api as any)["projects/queries"].getProject,
    user?._id ? { projectId: projectId as any, userId: user._id } : "skip"
  );

  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const proceedLockRef = useRef(false);

  useEffect(() => {
    if (!user || user.role !== "client") {
      router.push("/dashboard/projects");
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (project && (project.status !== "in_progress" && project.status !== "cancelled")) {
      router.push(`/dashboard/projects/${projectId}`);
    }
  }, [project, projectId, router]);

  const monthsToFund = useMemo(() => {
    if (!project) return 1;
    const dur = getDurationMonths(project.intakeForm?.projectDuration);
    const lastFunded = project.lastFundedMonthIndex ?? 0;
    if (lastFunded >= dur) {
      return Math.max(1, dur);
    }
    return Math.max(1, dur - lastFunded);
  }, [project]);

  const handleProceed = async () => {
    if (!project || !user) return;
    if (proceedLockRef.current || isInitializing) return;
    proceedLockRef.current = true;
    try {
      setIsInitializing(true);
      setError(null);
      const result = await createTopUpPaymentIntent({
        projectId: projectId as any,
        monthsToFund,
        userId: user._id,
      });
      window.location.href = result.paymentLink;
    } catch (err: unknown) {
      setError(getUserFriendlyError(err) || "Failed to start payment");
    } finally {
      proceedLockRef.current = false;
      setIsInitializing(false);
    }
  };

  if (!user || user.role !== "client") return null;
  if (!project) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (project.status !== "in_progress" && project.status !== "cancelled") {
    return null;
  }

  const durMonths = getDurationMonths(project.intakeForm?.projectDuration);
  const perMonth = project.totalAmount / durMonths;
  const amountToPay = perMonth * monthsToFund;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/projects/${projectId}`}>← Back to hire</Link>
        </Button>
        <h1 className="text-3xl font-heading font-bold">
          {project.status === "cancelled" ? "Reactivate hire" : "Add payment"}
        </h1>
        <p className="text-muted-foreground">
          {project.status === "cancelled"
            ? "Pay the remaining balance for this hire to reactivate it. Funds are held in escrow and released as you approve each month's work."
            : "Complete the payment below to catch up or extend coverage. Funds stay in escrow; freelancers are paid month by month when you approve their work."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {project.intakeForm?.title}
          </CardTitle>
          <CardDescription>
            Funds are held in escrow and released to your hire(s) each month after you approve completed work.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              This checkout covers{" "}
              <strong className="text-foreground">
                {monthsToFund} month{monthsToFund !== 1 ? "s" : ""}
              </strong>{" "}
              ({(perMonth * monthsToFund).toFixed(2)} {(project.currency || "USD").toUpperCase()}). There is no
              partial-month picker — we bill the block your hire needs in one step.
            </p>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Amount to pay</span>
            <span>
              {amountToPay.toFixed(2)} {(project.currency || "USD").toUpperCase()}
            </span>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button
            onClick={handleProceed}
            className="w-full"
            size="lg"
            disabled={isInitializing}
          >
            {isInitializing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <span>Proceed to payment</span>
                <ExternalLink className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
