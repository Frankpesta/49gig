"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

function PaymentForm({ projectId, amount, currency }: { projectId: string; amount: number; currency: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "An error occurred");
      setIsProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/projects/${projectId}/payment/success`,
      },
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay $${amount.toFixed(2)} ${currency.toUpperCase()}`
        )}
      </Button>
    </form>
  );
}

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

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

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

    // Check if payment already exists and has a client secret
    if (paymentStatus?.payment?.stripePaymentIntentId && !clientSecret && !isInitializing) {
      // Payment intent exists, we need to retrieve it from Stripe
      // For now, we'll create a new one if needed
    }

    // Prevent multiple simultaneous calls
    if (isInitializing || clientSecret) {
      return;
    }

    // Create payment intent
    const initializePayment = async () => {
      if (isInitializing) return;
      
      try {
        setIsInitializing(true);
        setIsLoading(true);
        const result = await createPaymentIntent({
          projectId: projectId as any,
          amount: Math.round(project.totalAmount * 100), // Convert to cents
          currency: project.currency || "usd",
          userId: user._id,
        });

        setClientSecret(result.clientSecret);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to initialize payment";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
        setIsInitializing(false);
      }
    };

    initializePayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, project?._id, projectId]);

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

  if (!clientSecret || !project) {
    return null;
  }

  const options = {
    clientSecret,
    appearance: {
      theme: "stripe" as const,
    },
  };

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
                ${totalAmount.toFixed(2)} {project.currency.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform Fee ({platformFee}%)</span>
              <span>${platformFeeAmount.toFixed(2)}</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>
                  ${totalAmount.toFixed(2)} {project.currency.toUpperCase()}
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
            Enter your payment details to complete the transaction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise} options={options}>
            <PaymentForm
              projectId={projectId}
              amount={totalAmount}
              currency={project.currency}
            />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}

