"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  User,
  Building2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

const TYPE_LABELS: Record<string, string> = {
  pre_funding: "Project Funding",
  milestone_release: "Milestone Release",
  refund: "Refund",
  platform_fee: "Included services",
  payout: "Payout",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }
> = {
  pending: { label: "Pending", variant: "outline", icon: Clock },
  processing: { label: "Processing", variant: "secondary", icon: Clock },
  succeeded: { label: "Succeeded", variant: "default", icon: CheckCircle2 },
  failed: { label: "Failed", variant: "destructive", icon: XCircle },
  refunded: { label: "Refunded", variant: "outline", icon: RefreshCw },
  cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
};

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const transactionId = params.transactionId as Id<"payments">;

  const transaction = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api as any)["transactions/queries"].getTransaction,
    user?._id
      ? { transactionId, userId: user._id }
      : "skip"
  );

  if (!user) {
    return null;
  }

  if (transaction === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (transaction === null) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">Transaction not found</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              The transaction you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button asChild>
              <Link href="/dashboard/transactions">Back to Transactions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[transaction.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="rounded-lg">
            <Link href="/dashboard/transactions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">Transaction Details</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusConfig.variant} className="gap-1.5">
                <StatusIcon className="h-3.5 w-3.5" />
                {statusConfig.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {new Date(transaction.createdAt).toLocaleDateString()} at{" "}
                {new Date(transaction.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Information */}
          <Card className="rounded-xl overflow-hidden border-border/60">
            <CardHeader className="bg-linear-to-r from-primary/5 via-transparent to-transparent">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Transaction Information
              </CardTitle>
              <CardDescription>Payment details and identifiers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Transaction ID</div>
                  <div className="font-mono text-sm break-all">{transaction._id}</div>
                </div>
                <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Type</div>
                  <Badge variant="outline" className="mt-1">
                    {TYPE_LABELS[transaction.type] || transaction.type}
                  </Badge>
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    {user.role === "client" ? "Amount paid" : "Amount received"}
                  </div>
                  <div className="text-xl font-bold text-primary">
                    $
                    {(user.role === "client"
                      ? transaction.amount
                      : (transaction.netAmount ?? transaction.amount)
                    ).toLocaleString()}{" "}
                    {transaction.currency.toUpperCase()}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Created At</div>
                  <div className="text-sm">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </div>
                </div>
                {transaction.processedAt && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Processed At</div>
                    <div className="text-sm">
                      {new Date(transaction.processedAt).toLocaleString()}
                    </div>
                  </div>
                )}
                {transaction.webhookReceivedAt && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Webhook Received</div>
                    <div className="text-sm">
                      {new Date(transaction.webhookReceivedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {transaction.errorMessage && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium text-destructive mb-2">Error Message</div>
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {transaction.errorMessage}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Project Information */}
          {transaction.project && (
            <Card className="rounded-xl overflow-hidden border-border/60">
              <CardHeader className="bg-linear-to-r from-primary/5 via-transparent to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Project Information
                </CardTitle>
                <CardDescription>Related project and milestone</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Project Title</div>
                  <Link
                    href={`/dashboard/projects/${transaction.project._id}`}
                    className="text-lg font-semibold hover:underline"
                  >
                    {transaction.project.title}
                  </Link>
                </div>
                {transaction.project.description && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Description</div>
                    <p className="text-sm">{transaction.project.description}</p>
                  </div>
                )}
                {transaction.milestone && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Milestone</div>
                      <div className="font-semibold">{transaction.milestone.title}</div>
                      {transaction.milestone.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {transaction.milestone.description}
                        </p>
                      )}
                      <div className="text-sm text-muted-foreground mt-2">
                        Amount: ${transaction.milestone.amount.toLocaleString()}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stripe Information */}
          {(transaction.stripePaymentIntentId ||
            transaction.stripePayoutId ||
            transaction.stripeTransferId) && (
            <Card>
              <CardHeader>
                <CardTitle>Stripe Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {transaction.stripePaymentIntentId && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Payment Intent ID</div>
                    <div className="font-mono text-sm">{transaction.stripePaymentIntentId}</div>
                  </div>
                )}
                {transaction.stripePayoutId && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Payout ID</div>
                    <div className="font-mono text-sm">{transaction.stripePayoutId}</div>
                  </div>
                )}
                {transaction.stripeTransferId && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Transfer ID</div>
                    <div className="font-mono text-sm">{transaction.stripeTransferId}</div>
                  </div>
                )}
                {transaction.stripeCustomerId && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Customer ID</div>
                    <div className="font-mono text-sm">{transaction.stripeCustomerId}</div>
                  </div>
                )}
                {transaction.stripeAccountId && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Connected Account ID</div>
                    <div className="font-mono text-sm">{transaction.stripeAccountId}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Parties */}
          <Card className="rounded-xl overflow-hidden border-border/60">
            <CardHeader className="bg-linear-to-r from-primary/5 via-transparent to-transparent">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Parties
              </CardTitle>
              <CardDescription>Client and freelancer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {transaction.project?.client && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium mb-1">
                    <User className="h-4 w-4" />
                    Client
                  </div>
                  <div className="text-sm">{transaction.project.client.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {transaction.project.client.email}
                  </div>
                </div>
              )}
              {transaction.project?.freelancer && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                      <Building2 className="h-4 w-4" />
                      Freelancer
                    </div>
                    <div className="text-sm">{transaction.project.freelancer.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {transaction.project.freelancer.email}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="rounded-xl overflow-hidden border-border/60">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {transaction.project && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/dashboard/projects/${transaction.project._id}`}>
                    View Project
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/transactions">Back to Transactions</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

