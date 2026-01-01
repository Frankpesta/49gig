"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
import { CheckCircle2, Loader2 } from "lucide-react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const projectId = params.projectId as string;
  const paymentIntent = searchParams.get("payment_intent");

  const paymentStatus = useQuery(
    (api as any)["payments/queries"].getPaymentStatus,
    user?._id && projectId
      ? { projectId: projectId as any, userId: user._id }
      : "skip"
  );

  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (paymentStatus?.isFunded) {
      // Wait a moment to show success message, then redirect
      const timer = setTimeout(() => {
        setRedirecting(true);
        router.push(`/dashboard/projects/${projectId}`);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [paymentStatus, projectId, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {paymentStatus?.isFunded ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Payment Successful!</CardTitle>
              <CardDescription>
                Your project has been funded and is ready for matching.
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
          {paymentStatus?.isFunded ? (
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

