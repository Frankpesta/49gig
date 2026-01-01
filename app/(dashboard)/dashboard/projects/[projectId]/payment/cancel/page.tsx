"use client";

import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="w-full max-w-md border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <CardDescription>
            Your payment was cancelled. No charges were made.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>
    </div>
  );
}

