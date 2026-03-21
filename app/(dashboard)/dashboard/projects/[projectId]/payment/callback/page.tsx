"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAnalytics } from "@/hooks/use-analytics";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { getUserFriendlyError } from "@/lib/error-handling";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const projectId = params.projectId as string;
  const txRef = searchParams.get("tx_ref") ?? searchParams.get("transaction_id");
  const status = searchParams.get("status");
  const isTopUp = searchParams.get("type") === "top_up";

  const verifyPayment = useAction(api.payments.actions.verifyPayment);
  const paymentStatus = useQuery(
    api.payments.queries.getPaymentStatus,
    user?._id && projectId
      ? { projectId: projectId as any, userId: user._id }
      : "skip"
  );

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const { trackEvent } = useAnalytics();
  const hasTracked = useRef(false);

  // Verify payment when component mounts
  useEffect(() => {
    if (!txRef || !user || !projectId) {
      return;
    }

    // Only verify if status indicates success (Flutterwave uses "successful" or "succeeded")
    if (status === "successful" || status === "succeeded") {
      const verify = async () => {
        setIsVerifying(true);
        try {
          await verifyPayment({
            txRef,
            projectId: projectId as any,
          });
          setVerificationSuccess(true);
        } catch (err) {
          setVerificationError(
            getUserFriendlyError(err) || "Payment verification failed"
          );
        } finally {
          setIsVerifying(false);
        }
      };

      verify();
    } else if (status === "cancelled") {
      // User cancelled - redirect to cancel page
      router.push(`/dashboard/projects/${projectId}/payment/cancel`);
    }
  }, [txRef, status, user, projectId, verifyPayment, router]);

  const initialFundComplete =
    verificationSuccess ||
    paymentStatus?.isPreFundingPaymentSucceeded ||
    !!paymentStatus?.isProjectPastFunding;
  const topUpComplete =
    verificationSuccess || !!paymentStatus?.isLatestTopUpSucceeded;

  // Redirect after successful payment (webhook may confirm before verify returns; do not block on isVerifying)
  useEffect(() => {
    const success = isTopUp
      ? topUpComplete && !verificationError
      : initialFundComplete && !verificationError;
    if (!success) return;
    const backendConfirmed = isTopUp
      ? paymentStatus?.isLatestTopUpSucceeded
      : paymentStatus?.isPreFundingPaymentSucceeded ||
        paymentStatus?.isProjectPastFunding;
    if (isVerifying && !verificationSuccess && !backendConfirmed) return;

    if (!hasTracked.current) {
      hasTracked.current = true;
      trackEvent(isTopUp ? "add_payment" : "purchase", {
        project_id: projectId,
        value: paymentStatus?.totalAmount,
        currency: (paymentStatus?.currency || "USD").toUpperCase(),
      });
    }
    const timer = setTimeout(() => {
      setRedirecting(true);
      router.push(`/dashboard/projects/${projectId}`);
    }, 3000);

    return () => clearTimeout(timer);
  }, [
    isTopUp,
    initialFundComplete,
    topUpComplete,
    paymentStatus?.totalAmount,
    paymentStatus?.currency,
    isVerifying,
    verificationSuccess,
    paymentStatus?.isLatestTopUpSucceeded,
    paymentStatus?.isPreFundingPaymentSucceeded,
    paymentStatus?.isProjectPastFunding,
    verificationError,
    projectId,
    router,
    trackEvent,
  ]);

  if (!user) {
    return null;
  }

  const isSuccessStatus = status === "successful" || status === "succeeded";
  const isSuccess = isTopUp
    ? isSuccessStatus &&
      (verificationSuccess || paymentStatus?.isLatestTopUpSucceeded) &&
      !verificationError
    : isSuccessStatus &&
      (verificationSuccess ||
        paymentStatus?.isPreFundingPaymentSucceeded ||
        paymentStatus?.isProjectPastFunding) &&
      !verificationError;
  const isCancelled = status === "cancelled";
  const waitingOnBackend = isTopUp
    ? !verificationSuccess && !paymentStatus?.isLatestTopUpSucceeded
    : !verificationSuccess &&
      !paymentStatus?.isPreFundingPaymentSucceeded &&
      !paymentStatus?.isProjectPastFunding;

  const isPending =
    isSuccessStatus &&
    !isSuccess &&
    !verificationError &&
    (isVerifying || waitingOnBackend);

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isSuccess ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Payment Successful!</CardTitle>
              <CardDescription>
                {isTopUp
                  ? "Your payment was received. The hire has been updated."
                  : "Your hire has been funded and is ready for matching."}
              </CardDescription>
            </>
          ) : isCancelled ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                <XCircle className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
              <CardDescription>
                Your payment was cancelled. No charges were made.
              </CardDescription>
            </>
          ) : verificationError ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Verification Failed</CardTitle>
              <CardDescription>{verificationError}</CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Processing Payment...</CardTitle>
              <CardDescription>
                {isVerifying
                  ? "Verifying your payment..."
                  : "Please wait while we confirm your payment."}
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isSuccess ? (
            <>
              <p className="text-center text-sm text-muted-foreground">
                {redirecting
                  ? "Redirecting to your hire..."
                  : "You will be redirected to your hire in a few seconds."}
              </p>
              <Button
                onClick={() => router.push(`/dashboard/projects/${projectId}`)}
                className="w-full"
              >
                Go to Hire
              </Button>
            </>
          ) : isCancelled ? (
            <>
              <p className="text-center text-sm text-muted-foreground">
                You can return to your hire and try again when you're ready.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(isTopUp ? `/dashboard/projects/${projectId}/add-payment` : `/dashboard/projects/${projectId}/payment`)}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => router.push(`/dashboard/projects/${projectId}`)}
                  className="flex-1"
                >
                  Back to Hire
                </Button>
              </div>
            </>
          ) : verificationError ? (
            <>
              <p className="text-center text-sm text-muted-foreground">
                Please contact support if this issue persists.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/projects/${projectId}`)}
                  className="flex-1"
                >
                  Back to Hire
                </Button>
                <Button
                  onClick={() => router.push(isTopUp ? `/dashboard/projects/${projectId}/add-payment` : `/dashboard/projects/${projectId}/payment`)}
                  className="flex-1"
                >
                  Try Again
                </Button>
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              This page will update automatically once your payment is confirmed.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
