"use client";

import { useEffect, useState, useRef } from "react";
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
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const projectId = params.projectId as string;

  const createPaymentIntent = useAction(
    (api as any)["payments/actions"].createPaymentIntent
  );
  const project = useQuery(
    (api as any)["projects/queries"].getProject,
    user?._id ? { projectId: projectId as any, userId: user._id } : "skip"
  );
  const paymentStatus = useQuery(
    (api as any)["payments/queries"].getPaymentStatus,
    user?._id && projectId
      ? { projectId: projectId as any, userId: user._id }
      : "skip"
  );

  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [txRef, setTxRef] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const initializationRef = useRef(false);

  useEffect(() => {
    if (!user || user.role !== "client") {
      router.push("/dashboard/projects");
      return;
    }

    if (!project) {
      return;
    }

    // Check if already paid
    if (paymentStatus?.isFunded) {
      router.push(`/dashboard/projects/${projectId}`);
      return;
    }

    // Prevent multiple simultaneous calls
    if (initializationRef.current || isInitializing || paymentLink) {
      return;
    }

    // Create payment
    const initializePayment = async () => {
      if (initializationRef.current || isInitializing || paymentLink) {
        return;
      }
      
      try {
        initializationRef.current = true;
        setIsInitializing(true);
        setIsLoading(true);
        
        const result = await createPaymentIntent({
          projectId: projectId as any,
          amount: project.totalAmount, // Flutterwave uses currency units, not cents
          currency: project.currency || "USD",
          userId: user._id,
        });

        setPaymentLink(result.paymentLink);
        setTxRef(result.txRef);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to initialize payment";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
        setIsInitializing(false);
        if (error) {
          initializationRef.current = false;
        }
      }
    };

    initializePayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, project?._id, projectId, paymentStatus?.isFunded]);

  const handlePayNow = () => {
    if (paymentLink) {
      // Redirect to payment page
      window.location.href = paymentLink;
    }
  };

  if (!user || user.role !== "client") {
    return null;
  }

  if (isLoading) {
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
              Back to Project
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentLink || !project) {
    return null;
  }

  const platformFee = project.platformFee || 10;
  const platformFeeAmount = (project.totalAmount * platformFee) / 100;
  const totalAmount = project.totalAmount;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold">Complete Payment</h1>
        <p className="text-muted-foreground">
          Fund your project to start matching with vetted freelancers.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Project Title
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
            <div className="flex justify-between">
              <span className="text-muted-foreground">Project Budget</span>
              <span className="font-semibold">
                {totalAmount.toFixed(2)} {project.currency.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform Fee ({platformFee}%)</span>
              <span>{platformFeeAmount.toFixed(2)}</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>
                  {totalAmount.toFixed(2)} {project.currency.toUpperCase()}
                </span>
              </div>
            </div>
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
            onClick={handlePayNow}
            className="w-full"
            size="lg"
          >
            <span>Proceed to Payment</span>
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Transaction Reference: {txRef}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
