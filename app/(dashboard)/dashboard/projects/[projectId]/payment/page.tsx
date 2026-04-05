"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
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
import { Loader2, CheckCircle2, XCircle, ExternalLink, Info } from "lucide-react";
import { getUserFriendlyError } from "@/lib/error-handling";
import { getDurationMonths } from "@/lib/project-duration";
import { useAnalytics } from "@/hooks/use-analytics";

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const projectId = params.projectId as string;

  const createPaymentIntent = useAction(api.payments.actions.createPaymentIntent);
  const updateProject = useMutation(api.projects.mutations.updateProject);
  const project = useQuery(
    api.projects.queries.getProject,
    user?._id ? { projectId: projectId as any, userId: user._id } : "skip"
  );
  const paymentStatus = useQuery(
    api.payments.queries.getPaymentStatus,
    user?._id && projectId
      ? { projectId: projectId as any, userId: user._id }
      : "skip"
  );

  const hiringBalance = useQuery(
    api.wallets.queries.getMyClientReferralHiringBalance,
    user?._id && project
      ? { userId: user._id, currency: project.currency || "USD" }
      : "skip"
  );

  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [txRef, setTxRef] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [referralApplyCents, setReferralApplyCents] = useState(0);

  const maxReferralApplyCents = useMemo(() => {
    if (!project || hiringBalance === undefined) return 0;
    const grossCents = Math.round(project.totalAmount * 100);
    return Math.min(hiringBalance.cents ?? 0, grossCents);
  }, [project, hiringBalance]);

  useEffect(() => {
    setReferralApplyCents(maxReferralApplyCents);
  }, [maxReferralApplyCents]);

  useEffect(() => {
    if (!user || user.role !== "client") {
      router.push("/dashboard/projects");
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (!project || !paymentStatus) return;
    if (
      paymentStatus.isPreFundingPaymentSucceeded ||
      paymentStatus.isProjectPastFunding
    ) {
      router.push(`/dashboard/projects/${projectId}`);
      return;
    }
    if (
      (project.status === "draft" || project.status === "pending_funding") &&
      !project.selectedFreelancerId &&
      (!project.selectedFreelancerIds || project.selectedFreelancerIds.length === 0)
    ) {
      router.push(`/dashboard/projects/${projectId}/matches`);
      return;
    }
    if (
      (project.status === "draft" || project.status === "pending_funding") &&
      (project.selectedFreelancerId || (project.selectedFreelancerIds && project.selectedFreelancerIds.length > 0)) &&
      !project.clientContractSignedAt
    ) {
      router.push(`/dashboard/projects/${projectId}/contract`);
      return;
    }
  }, [project, paymentStatus, projectId, router]);

  const handleProceedToPayment = async () => {
    if (!project || !user) return;
    if (isInitializing) return;

    try {
      setIsInitializing(true);
      setIsLoading(true);
      setError(null);

      const durMonths = getDurationMonths(project.intakeForm?.projectDuration);
      const amountToPay = project.totalAmount;

      await updateProject({
        projectId: projectId as any,
        fundUpfrontMonths: durMonths,
        userId: user._id,
      });

      trackEvent("begin_checkout", { project_id: projectId, value: amountToPay, currency: project.currency || "USD" });

      const result = await createPaymentIntent({
        projectId: projectId as any,
        amount: amountToPay,
        currency: project.currency || "USD",
        userId: user._id,
        referralCreditCentsToApply: referralApplyCents,
      });

      setPaymentLink(result.paymentLink);
      setTxRef(result.txRef);
      window.location.href = result.paymentLink;
    } catch (err: unknown) {
      const errorMessage = getUserFriendlyError(err) || "Failed to initialize payment";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsInitializing(false);
    }
  };

  if (!user || user.role !== "client") {
    return null;
  }

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

  if (isLoading && isInitializing) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Initializing payment...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Payment Error
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push(`/dashboard/projects/${projectId}`)}
              variant="outline"
            >
              Back to Hire
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const durMonths = getDurationMonths(project.intakeForm?.projectDuration);
  const perMonth = durMonths > 0 ? project.totalAmount / durMonths : 0;
  const amountToPay = project.totalAmount;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold">Complete Payment</h1>
        <p className="text-muted-foreground">
          Fund your hire to start matching with vetted freelancers.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hire Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Role Title
              </p>
              <p className="text-lg font-semibold">
                {project.intakeForm.title}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Description
              </p>
              <p className="text-sm">{project.intakeForm.description}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Full hire total</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You pay the entire amount now; it stays in escrow. Each month, after you review and approve
                that period&apos;s work, the corresponding share is released to the freelancer (or
                auto-releases after the review window). About{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {perMonth.toFixed(2)} {project.currency.toUpperCase()}
                </span>{" "}
                per month on average over {durMonths} month{durMonths !== 1 ? "s" : ""}.
              </p>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Amount due</span>
              <span>
                {amountToPay.toFixed(2)} {project.currency.toUpperCase()}
              </span>
            </div>
            {maxReferralApplyCents > 0 && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Referral hiring credit</p>
                    <p className="text-xs text-muted-foreground">
                      Apply up to {(maxReferralApplyCents / 100).toFixed(2)}{" "}
                      {project.currency.toUpperCase()} from successful referrals. Any amount not covered by
                      credit is charged to your card (minimum card charge rules apply).
                    </p>
                    <input
                      type="range"
                      min={0}
                      max={maxReferralApplyCents}
                      step={1}
                      value={Math.min(referralApplyCents, maxReferralApplyCents)}
                      onChange={(e) => setReferralApplyCents(parseInt(e.target.value, 10))}
                      className="w-full accent-primary"
                    />
                    <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        Credit applied: {(Math.min(referralApplyCents, maxReferralApplyCents) / 100).toFixed(2)}{" "}
                        {project.currency.toUpperCase()}
                      </span>
                      <span>
                        Card charge (approx.):{" "}
                        {(
                          amountToPay -
                          Math.min(referralApplyCents, maxReferralApplyCents) / 100
                        ).toFixed(2)}{" "}
                        {project.currency.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              After payment succeeds, matching continues and monthly payouts still flow only when you approve each month&apos;s work.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>
            Click the button below to proceed to the secure payment page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Secure Payment</p>
                <p className="text-xs text-muted-foreground">
                  Your payment will be processed securely. 
                  You'll be redirected to the payment page where you can choose from multiple payment methods.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleProceedToPayment}
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
                <span>Proceed to Payment</span>
                <ExternalLink className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          {txRef && (
            <p className="text-center text-xs text-muted-foreground">
              Transaction Reference: {txRef}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
