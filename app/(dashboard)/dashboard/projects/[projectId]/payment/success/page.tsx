"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "convex/react";
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
import { CheckCircle2, Loader2 } from "lucide-react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const projectId = params.projectId as string;
  const { trackEvent } = useAnalytics();
  const hasTracked = useRef(false);

  const paymentStatus = useQuery(
    api.payments.queries.getPaymentStatus,
    user?._id && projectId
      ? { projectId: projectId as any, userId: user._id }
      : "skip"
  );

  const fundingConfirmed =
    paymentStatus?.isPreFundingPaymentSucceeded ||
    paymentStatus?.isProjectPastFunding;

  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (fundingConfirmed) {
      if (!hasTracked.current) {
        hasTracked.current = true;
        trackEvent("purchase", {
          project_id: projectId,
          value: paymentStatus?.totalAmount,
          currency: (paymentStatus?.currency || "USD").toUpperCase(),
        });
      }
      // Wait a moment to show success message, then redirect
      const timer = setTimeout(() => {
        setRedirecting(true);
        router.push(`/dashboard/projects/${projectId}`);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [fundingConfirmed, paymentStatus, projectId, router, trackEvent]);

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {fundingConfirmed ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Payment Successful!</CardTitle>
              <CardDescription>
                {paymentStatus?.projectStatus === "matching" || paymentStatus?.projectStatus === "matched"
                  ? "Your payment was received and your hire is being set up."
                  : "Your project has been funded and is ready for matching."}
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Processing Payment...</CardTitle>
              <CardDescription>
                Please wait while we confirm your payment.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {fundingConfirmed ? (
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

