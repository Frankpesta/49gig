"use client";

import { useEffect, useState } from "react";
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
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const projectId = params.projectId as string;
  const txRef = searchParams.get("tx_ref");
  const status = searchParams.get("status");

  const verifyPayment = useAction(
    (api as any)["payments/actions"].verifyPayment
  );
  const paymentStatus = useQuery(
    (api as any)["payments/queries"].getPaymentStatus,
    user?._id && projectId
      ? { projectId: projectId as any, userId: user._id }
      : "skip"
  );

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  // Verify payment when component mounts
  useEffect(() => {
    if (!txRef || !user || !projectId) {
      return;
    }

    // Only verify if status is "successful" (Flutterwave's success status)
    if (status === "successful") {
      const verify = async () => {
        setIsVerifying(true);
        try {
          await verifyPayment({
            txRef,
            projectId: projectId as any,
          });
          // Verification successful - payment status query will update
        } catch (err) {
          setVerificationError(
            err instanceof Error ? err.message : "Payment verification failed"
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

  // Redirect after successful payment
  useEffect(() => {
    if (paymentStatus?.isFunded && !isVerifying && !verificationError) {
      const timer = setTimeout(() => {
        setRedirecting(true);
        router.push(`/dashboard/projects/${projectId}`);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [paymentStatus?.isFunded, isVerifying, verificationError, projectId, router]);

  if (!user) {
    return null;
  }

  const isSuccess = status === "successful" && paymentStatus?.isFunded;
  const isCancelled = status === "cancelled";
  const isPending = status === "successful" && !paymentStatus?.isFunded && !verificationError;

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
                Your project has been funded and is ready for matching.
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
                  ? "Redirecting to your project..."
                  : "You will be redirected to your project in a few seconds."}
              </p>
              <Button
                onClick={() => router.push(`/dashboard/projects/${projectId}`)}
                className="w-full"
              >
                Go to Project
              </Button>
            </>
          ) : isCancelled ? (
            <>
              <p className="text-center text-sm text-muted-foreground">
                You can return to your project and try again when you're ready.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/projects/${projectId}/payment`)}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => router.push(`/dashboard/projects/${projectId}`)}
                  className="flex-1"
                >
                  Back to Project
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
                  Back to Project
                </Button>
                <Button
                  onClick={() => router.push(`/dashboard/projects/${projectId}/payment`)}
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
