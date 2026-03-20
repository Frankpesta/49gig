"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  type PaymentBreakdown,
  formatCurrency,
  formatPaymentBreakdown,
} from "@/lib/payment-calculator";
import { Info, DollarSign, Users, Clock } from "lucide-react";

interface PaymentBreakdownProps {
  breakdown: PaymentBreakdown;
  className?: string;
}

export function PaymentBreakdownDisplay({
  breakdown,
  className,
}: PaymentBreakdownProps) {
  const formatted = formatPaymentBreakdown(breakdown);

  const billingModelLabels: Record<PaymentBreakdown["billingModel"], string> = {
    fixed_price: "Fixed Price",
    milestone_based: "Deliverable-Based",
    hourly: "Hourly Rate",
    hybrid: "Hybrid (Hourly + Deliverables)",
  };

  const billingModelIcons: Record<PaymentBreakdown["billingModel"], typeof DollarSign> = {
    fixed_price: DollarSign,
    hourly: Clock,
    milestone_based: DollarSign,
    hybrid: Users,
  };

  const BillingIcon = billingModelIcons[breakdown.billingModel];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BillingIcon className="h-5 w-5 text-primary" />
              Payment Breakdown
            </CardTitle>
            <CardDescription className="mt-1">
              {formatted.summary}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {billingModelLabels[breakdown.billingModel]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary: stack on mobile to avoid overlapping values */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {formatted.details.map((detail, index) => (
            <div
              key={index}
              className="min-w-0 rounded-lg border border-border/60 bg-muted/30 p-4 sm:bg-transparent sm:border-0 sm:p-0"
            >
              <div className="text-sm text-muted-foreground">{detail.label}</div>
              <div className="mt-1 text-lg font-semibold tabular-nums">{detail.value}</div>
              {detail.description && (
                <div className="mt-1 text-xs text-muted-foreground leading-snug">
                  {detail.description}
                </div>
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Hourly Rate Info */}
        {breakdown.billingModel === "hourly" && breakdown.hourlyRate && (
          <div className="rounded-lg border bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-primary" />
              Hourly Billing
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Hourly Rate</div>
                <div className="font-semibold">
                  {formatCurrency(breakdown.hourlyRate, breakdown.currency)}
                </div>
              </div>
              {breakdown.estimatedHours && (
                <div>
                  <div className="text-muted-foreground">Estimated Hours</div>
                  <div className="font-semibold">{breakdown.estimatedHours} hrs</div>
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <Info className="h-3 w-3 inline mr-1" />
              You'll be billed based on actual hours worked, tracked through the platform.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
