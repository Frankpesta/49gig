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
import { CheckCircle2, Info, DollarSign, Users, Clock } from "lucide-react";

interface PaymentBreakdownProps {
  breakdown: PaymentBreakdown;
  showMilestones?: boolean;
  className?: string;
}

export function PaymentBreakdownDisplay({
  breakdown,
  showMilestones = true,
  className,
}: PaymentBreakdownProps) {
  const formatted = formatPaymentBreakdown(breakdown);

  const billingModelLabels: Record<PaymentBreakdown["billingModel"], string> = {
    fixed_price: "Fixed Price",
    milestone_based: "Milestone-Based",
    hourly: "Hourly Rate",
    hybrid: "Hybrid (Hourly + Milestones)",
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
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {formatted.details.map((detail, index) => (
            <div key={index} className="space-y-1">
              <div className="text-sm text-muted-foreground">{detail.label}</div>
              <div className="text-lg font-semibold">{detail.value}</div>
              {detail.description && (
                <div className="text-xs text-muted-foreground">
                  {detail.description}
                </div>
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Milestones */}
        {showMilestones && breakdown.milestones && breakdown.milestones.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Payment Milestones
            </div>
            <div className="space-y-2">
              {breakdown.milestones.map((milestone, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between rounded-lg border bg-muted/30 p-3"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {milestone.order}
                      </span>
                      <span className="font-medium">{milestone.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-8">
                      {milestone.description}
                    </p>
                    <p className="text-xs text-muted-foreground pl-8">
                      Due: {new Date(milestone.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(milestone.amount, breakdown.currency)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {milestone.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
              You&apos;ll be billed based on actual hours worked, tracked through the platform.
            </div>
          </div>
        )}

        {/* Platform Fee Info */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-start gap-2 text-xs">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1">
              <div className="font-semibold">Service Fee</div>
              <div className="text-muted-foreground">
                The service fee ({breakdown.platformFeePercentage}%) includes vetting, escrow, contracts, replacements, and support.
                This fee is included in the total project amount.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
