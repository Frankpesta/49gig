"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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

  const [monthsToFund, setMonthsToFund] = useState<number>(1);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleProceed = async () => {
    if (!project || !user) return;
    if (isInitializing) return;
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
            ? "Add payment for the next month(s) to reactivate this hire."
            : "Fund the next month(s) to keep your hire active. All funds are held in escrow and released monthly."}
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
          <div className="space-y-2">
            <Label>Months to fund</Label>
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
                    {n} month{n > 1 ? "s" : ""} — {(perMonth * n).toFixed(2)} {(project.currency || "USD").toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
