"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  DollarSign,
  Calendar,
  FileText,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

const TYPE_LABELS: Record<string, string> = {
  pre_funding: "Project Funding",
  milestone_release: "Milestone Release",
  refund: "Refund",
  platform_fee: "Platform Fee",
  payout: "Payout",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  succeeded: "Succeeded",
  failed: "Failed",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

export type TransactionCardData = {
  _id: Id<"payments">;
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: number;
  netAmount?: number;
  project: { _id: Id<"projects">; title: string } | null;
  milestone: { _id: Id<"milestones">; title: string } | null;
};

const STATUS_ACCENT: Record<string, { border: string; icon: string; amount: string }> = {
  succeeded: {
    border: "border-l-4 border-l-emerald-500",
    icon: "text-emerald-600 dark:text-emerald-400",
    amount: "text-emerald-700 dark:text-emerald-300",
  },
  failed: {
    border: "border-l-4 border-l-rose-500",
    icon: "text-rose-600 dark:text-rose-400",
    amount: "text-rose-700 dark:text-rose-300",
  },
  cancelled: {
    border: "border-l-4 border-l-rose-500",
    icon: "text-rose-600 dark:text-rose-400",
    amount: "text-rose-700 dark:text-rose-300",
  },
  pending: {
    border: "border-l-4 border-l-amber-500",
    icon: "text-amber-600 dark:text-amber-400",
    amount: "text-amber-700 dark:text-amber-300",
  },
  processing: {
    border: "border-l-4 border-l-amber-500",
    icon: "text-amber-600 dark:text-amber-400",
    amount: "text-amber-700 dark:text-amber-300",
  },
  refunded: {
    border: "border-l-4 border-l-blue-500",
    icon: "text-blue-600 dark:text-blue-400",
    amount: "text-blue-700 dark:text-blue-300",
  },
};

const DEFAULT_ACCENT = {
  border: "border-l-4 border-l-primary/50",
  icon: "text-primary",
  amount: "text-foreground",
};

export function TransactionCard({ transaction }: { transaction: TransactionCardData }) {
  const mapStatusTone = (status: string) => {
    if (status === "succeeded") return "success";
    if (status === "failed" || status === "cancelled") return "danger";
    if (status === "processing" || status === "pending") return "warning";
    return "neutral";
  };

  const accent = STATUS_ACCENT[transaction.status] ?? DEFAULT_ACCENT;

  return (
    <Card
      className={cn(
        "group rounded-xl border border-border/60 overflow-hidden transition-all hover:shadow-md",
        accent.border,
        "hover:border-primary/30"
      )}
    >
      <Link href={`/dashboard/transactions/${transaction._id}`}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline" className="font-medium">
                  {TYPE_LABELS[transaction.type] || transaction.type}
                </Badge>
                <DashboardStatusBadge
                  label={STATUS_LABELS[transaction.status] || transaction.status}
                  tone={mapStatusTone(transaction.status)}
                />
              </div>
              {transaction.project && (
                <p className="font-medium text-foreground truncate">
                  {transaction.project.title}
                </p>
              )}
              {transaction.milestone && (
                <p className="text-sm text-muted-foreground truncate mt-0.5 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  {transaction.milestone.title}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                {new Date(transaction.createdAt).toLocaleDateString()}
                <span className="opacity-70">
                  {new Date(transaction.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </p>
            </div>
            <div className="flex items-center justify-between sm:flex-col sm:items-end sm:gap-1">
              <div className="flex items-baseline gap-2">
                <DollarSign className={cn("h-4 w-4 shrink-0", accent.icon)} />
                <span className={cn("text-lg font-bold tabular-nums", accent.amount)}>
                  ${transaction.amount.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground uppercase">
                  {transaction.currency}
                </span>
              </div>
              {(transaction.type === "milestone_release" ||
                transaction.type === "payout") &&
                transaction.netAmount != null && (
                  <span className="text-xs text-muted-foreground">
                    Net: ${transaction.netAmount.toLocaleString()}
                  </span>
                )}
              <span className="inline-flex items-center text-sm font-medium text-primary mt-2 sm:mt-0 group-hover:underline">
                View
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </span>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
