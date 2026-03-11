"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, CheckCircle2, XCircle, ExternalLink, Info } from "lucide-react";
import { getUserFriendlyError } from "@/lib/error-handling";

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const projectId = params.projectId as string;

  const createPaymentIntent = useAction(
    (api as any)["payments/actions"].createPaymentIntent
  );
  const updateProject = useMutation(
    (api as any)["projects/mutations"].updateProject
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
  const [monthsToFund, setMonthsToFund] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (project?.fundUpfrontMonths != null && project.fundUpfrontMonths >= 1) {
      setMonthsToFund(Math.max(1, Math.floor(project.fundUpfrontMonths)));
    }
  }, [project?.fundUpfrontMonths]);

  useEffect(() => {
    if (!user || user.role !== "client") {
      router.push("/dashboard/projects");
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (!project || !paymentStatus) return;
    if (paymentStatus.isFunded) {
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

      const durMonths =
        project.intakeForm?.projectDuration === "12+"
          ? 12
          : Math.max(1, parseInt(project.intakeForm?.projectDuration ?? "1", 10) || 1);
      const perMonth = project.totalAmount / durMonths;
      const amountToPay = perMonth * monthsToFund;

      await updateProject({
        projectId: projectId as any,
        fundUpfrontMonths: monthsToFund,
        userId: user._id,
      });

      const result = await createPaymentIntent({
        projectId: projectId as any,
        amount: amountToPay,
        currency: project.currency || "USD",
        userId: user._id,
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

  const durMonths =
    project.intakeForm?.projectDuration === "12+"
      ? 12
      : Math.max(1, parseInt(project.intakeForm?.projectDuration ?? "1", 10) || 1);
  const perMonth = project.totalAmount / durMonths;
  const amountToPay = perMonth * monthsToFund;

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
            <div className="space-y-2">
              <Label>Months to fund</Label>
              <p className="text-sm text-muted-foreground">
                You can choose the total engagement duration and fund all months upfront, or pay one month at a time. All funds are securely held in escrow by 49GIG and released to the freelancer or team monthly as salary. You pay upfront and we hold in escrow.
              </p>
              <Select
                value={String(monthsToFund)}
                onValueChange={(v) => setMonthsToFund(parseInt(v, 10))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select months" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: durMonths }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} month{n > 1 ? "s" : ""} — {(perMonth * n).toFixed(2)} {project.currency.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Amount to pay</span>
              <span>
                {amountToPay.toFixed(2)} {project.currency.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Once payment is successful, the matched freelancer(s) will see their share in their pending balance in the wallet.
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
