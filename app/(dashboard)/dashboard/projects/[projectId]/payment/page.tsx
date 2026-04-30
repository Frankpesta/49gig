"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, CheckCircle2, XCircle, ExternalLink, Info, Wallet } from "lucide-react";
import { getUserFriendlyError } from "@/lib/error-handling";
import { getDurationMonths } from "@/lib/project-duration";
import { useAnalytics } from "@/hooks/use-analytics";
import { toast } from "sonner";

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const projectId = params.projectId as string;

  const createPaymentIntent = useAction(api.payments.actions.createPaymentIntent);
  const abandonCheckoutPayment = useAction(api.payments.actions.abandonCheckoutPayment);
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

  const walletBreakdown = useQuery(
    api.wallets.queries.getMyClientPrefundingWalletBreakdown,
    user?._id && project
      ? { userId: user._id, currency: project.currency || "USD" }
      : "skip"
  );

  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [txRef, setTxRef] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);
  const [walletApplyCents, setWalletApplyCents] = useState(0);
  /** Synchronous guard — React state updates are async, so a double tap can spawn two Flutterwave sessions. */
  const proceedToPaymentLockRef = useRef(false);
  type FundingPreference = "wallet_max" | "custom" | "card_only";
  const [fundingPreference, setFundingPreference] = useState<FundingPreference>("wallet_max");

  const maxWalletApplyCents = useMemo(() => {
    if (!project || walletBreakdown === undefined) return 0;
    const grossCents = Math.round(project.totalAmount * 100);
    return Math.min(walletBreakdown.spendableCents ?? 0, grossCents);
  }, [project, walletBreakdown]);

  useEffect(() => {
    if (walletBreakdown === undefined) return;
    if (maxWalletApplyCents <= 0) {
      setFundingPreference("card_only");
      setWalletApplyCents(0);
      return;
    }
    if (fundingPreference === "wallet_max") {
      setWalletApplyCents(maxWalletApplyCents);
    } else if (fundingPreference === "card_only") {
      setWalletApplyCents(0);
    } else {
      setWalletApplyCents((c) => Math.min(c, maxWalletApplyCents));
    }
  }, [maxWalletApplyCents, fundingPreference, walletBreakdown]);

  const onFundingPreferenceChange = useCallback((value: string) => {
    const v = value as FundingPreference;
    setFundingPreference(v);
    if (v === "wallet_max") setWalletApplyCents(maxWalletApplyCents);
    else if (v === "card_only") setWalletApplyCents(0);
  }, [maxWalletApplyCents]);

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

  const handleAbandonPreviousAttempt = async () => {
    if (!user) return;
    if (isAbandoning) return;
    try {
      setIsAbandoning(true);
      const result = await abandonCheckoutPayment({
        projectId: projectId as any,
        userId: user._id,
      });
      if (result.released) {
        toast.success("Previous attempt cancelled. You can pay again.");
        setError(null);
      } else {
        toast.message("No pending attempt to cancel.");
      }
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Could not cancel the previous attempt.");
    } finally {
      setIsAbandoning(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!project || !user) return;
    if (proceedToPaymentLockRef.current || isInitializing) return;
    proceedToPaymentLockRef.current = true;

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
        walletCreditCentsToApply: walletApplyCents,
      });

      if (result.fundedWithWalletOnly) {
        toast.success("Your hire is funded from your wallet.");
        router.push(`/dashboard/projects/${projectId}`);
        return;
      }

      if (!result.paymentLink) {
        throw new Error("No checkout link was returned. Please try again.");
      }

      setPaymentLink(result.paymentLink);
      setTxRef(result.txRef);
      window.location.href = result.paymentLink;
    } catch (err: unknown) {
      const errorMessage = getUserFriendlyError(err) || "Failed to initialize payment";
      setError(errorMessage);
    } finally {
      proceedToPaymentLockRef.current = false;
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
    const looksLikeStalePending = /already being processed/i.test(error);
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
          <CardContent className="space-y-3">
            {looksLikeStalePending && (
              <Button
                onClick={() => void handleAbandonPreviousAttempt()}
                className="w-full"
                disabled={isAbandoning}
              >
                {isAbandoning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Cancel previous attempt and start fresh"
                )}
              </Button>
            )}
            <Button
              onClick={() => router.push(`/dashboard/projects/${projectId}`)}
              variant="outline"
              className="w-full"
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
  const grossCents = Math.round(amountToPay * 100);
  const walletAppliedCents = Math.min(walletApplyCents, maxWalletApplyCents);
  const cardChargeApproxZero = grossCents - walletAppliedCents <= 0;

  const stalePendingPayment =
    paymentStatus?.payment &&
    paymentStatus.payment.type === "pre_funding" &&
    (paymentStatus.payment.status === "pending" ||
      paymentStatus.payment.status === "processing") &&
    !!paymentStatus.payment.flutterwaveTransactionId &&
    !paymentStatus.isPreFundingPaymentSucceeded;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold">Complete Payment</h1>
        <p className="text-muted-foreground">
          Fund your hire to start matching with vetted freelancers.
        </p>
      </div>

      {stalePendingPayment && (
        <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  A previous payment attempt is still open
                </p>
                <p className="text-xs text-muted-foreground">
                  Cancel it to start a fresh checkout. No charges will be made.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleAbandonPreviousAttempt()}
              disabled={isAbandoning}
              className="shrink-0"
            >
              {isAbandoning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel and start fresh"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

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
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-start gap-2">
                <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Pay from wallet and/or card</p>
                  <p className="text-xs text-muted-foreground">
                    Choose where to pay from. Any wallet amount you apply reduces the card charge.
                  </p>
                  <RadioGroup
                    value={fundingPreference}
                    onValueChange={onFundingPreferenceChange}
                    className="grid gap-2 pt-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="wallet_max"
                        id="fund-wallet-max"
                        disabled={maxWalletApplyCents <= 0}
                      />
                      <Label
                        htmlFor="fund-wallet-max"
                        className={`font-normal ${maxWalletApplyCents > 0 ? "cursor-pointer" : "text-muted-foreground"}`}
                      >
                        Use available wallet credit first ({(maxWalletApplyCents / 100).toFixed(2)}{" "}
                        {project.currency.toUpperCase()})
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="custom"
                        id="fund-custom"
                        disabled={maxWalletApplyCents <= 0}
                      />
                      <Label
                        htmlFor="fund-custom"
                        className={`font-normal ${maxWalletApplyCents > 0 ? "cursor-pointer" : "text-muted-foreground"}`}
                      >
                        Custom wallet amount
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="card_only" id="fund-card-only" />
                      <Label htmlFor="fund-card-only" className="font-normal cursor-pointer">
                        Pay full amount by card
                      </Label>
                    </div>
                  </RadioGroup>
                  {maxWalletApplyCents <= 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No wallet balance is currently available for this hire.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Apply up to {(maxWalletApplyCents / 100).toFixed(2)}{" "}
                      {project.currency.toUpperCase()} from your wallet. Any remainder is paid by card.
                    </p>
                  )}
                  {walletBreakdown &&
                    walletBreakdown.referralHiringCents > 0 &&
                    walletBreakdown.referralHiringCents < walletBreakdown.spendableCents && (
                      <p className="text-xs text-muted-foreground flex items-start gap-1">
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        Includes{" "}
                        {(walletBreakdown.referralHiringCents / 100).toFixed(2)}{" "}
                        {project.currency.toUpperCase()} from referral hiring credit and other available
                        balance.
                      </p>
                    )}
                  <input
                    type="range"
                    min={0}
                    max={maxWalletApplyCents}
                    step={1}
                    value={Math.min(walletApplyCents, maxWalletApplyCents)}
                    onChange={(e) => {
                      setFundingPreference("custom");
                      setWalletApplyCents(parseInt(e.target.value, 10));
                    }}
                    disabled={fundingPreference !== "custom" || maxWalletApplyCents <= 0}
                    className="w-full accent-primary disabled:opacity-50"
                  />
                  <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      From wallet:{" "}
                      {(Math.min(walletApplyCents, maxWalletApplyCents) / 100).toFixed(2)}{" "}
                      {project.currency.toUpperCase()}
                    </span>
                    <span>
                      Card charge (approx.):{" "}
                      {(
                        amountToPay -
                        Math.min(walletApplyCents, maxWalletApplyCents) / 100
                      ).toFixed(2)}{" "}
                      {project.currency.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
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
            Pay any card balance below through our secure checkout, or confirm if your wallet covers the full
            hire.
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
            ) : cardChargeApproxZero && maxWalletApplyCents > 0 ? (
              <>
                <span>Fund hire from wallet</span>
                <CheckCircle2 className="ml-2 h-4 w-4" />
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
