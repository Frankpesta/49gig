"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
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
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
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
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

const TYPE_LABELS: Record<string, string> = {
  pre_funding: "Project Funding",
  top_up: "Add payment (months)",
  milestone_release: "Milestone Release",
  monthly_release: "Monthly Release",
  refund: "Refund",
  platform_fee: "Included services",
  payout: "Payout",
};

type TxWithFunding = {
  type: string;
  amount: number;
  currency: string;
  netAmount?: number;
  platformFee?: number;
  fundingGrossAmount?: number;
  clientWalletCreditApplied?: number;
  flutterwaveTransactionId?: string;
  webhookEventId?: string;
  walletFunding?: {
    fundingGrossAmount: number;
    walletAppliedDollars: number;
    gatewayChargedDollars: number;
    summary: string;
    isFullWalletFunding: boolean;
    isPartialWalletFunding: boolean;
    isGatewayOnly: boolean;
  } | null;
};

function detailComparableGross(tx: TxWithFunding): number {
  if (tx.walletFunding) return tx.walletFunding.fundingGrossAmount;
  if ((tx.type === "pre_funding" || tx.type === "top_up") && tx.fundingGrossAmount != null) {
    return tx.fundingGrossAmount;
  }
  if (tx.type === "pre_funding" || tx.type === "top_up") {
    return (tx.amount ?? 0) + (tx.clientWalletCreditApplied ?? 0);
  }
  return tx.amount ?? 0;
}

function fmtDetailMoney(n: number, currency: string): string {
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency.toUpperCase()}`;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: LucideIcon }
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
              The transaction you&apos;re looking for doesn&apos;t exist or you don&apos;t have access
              to it.
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
  const txFunding = transaction as TxWithFunding;
  const isHireFundingType = txFunding.type === "pre_funding" || txFunding.type === "top_up";
  const clientGrossShown = detailComparableGross(txFunding);

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
                    {isHireFundingType
                      ? "Client gross (wallet + checkout)"
                      : user.role === "client"
                        ? "Amount paid"
                        : "Amount received"}
                  </div>
                  <div className="text-xl font-bold text-primary">
                    $
                    {(isHireFundingType
                      ? clientGrossShown
                      : user.role === "client"
                        ? transaction.amount
                        : (transaction.netAmount ?? transaction.amount)
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {transaction.currency.toUpperCase()}
                  </div>
                </div>
              </div>

              {isHireFundingType && (
                <>
                  <Separator />
                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-semibold">Hire funding breakdown</span>
                      {txFunding.walletFunding && (
                        <>
                          {txFunding.walletFunding.isFullWalletFunding && (
                            <Badge variant="secondary">Fully from wallet</Badge>
                          )}
                          {txFunding.walletFunding.isPartialWalletFunding && (
                            <Badge variant="secondary">Wallet + checkout</Badge>
                          )}
                          {txFunding.walletFunding.isGatewayOnly && (
                            <Badge variant="outline">Checkout only</Badge>
                          )}
                        </>
                      )}
                    </div>
                    {txFunding.walletFunding ? (
                      <>
                        <p className="text-sm text-muted-foreground">{txFunding.walletFunding.summary}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div className="rounded-md border border-border/40 bg-background/80 p-3">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              From client wallet
                            </div>
                            <div className="mt-1 font-semibold tabular-nums">
                              {fmtDetailMoney(
                                txFunding.walletFunding.walletAppliedDollars,
                                transaction.currency
                              )}
                            </div>
                          </div>
                          <div className="rounded-md border border-border/40 bg-background/80 p-3">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Via checkout (gateway)
                            </div>
                            <div className="mt-1 font-semibold tabular-nums">
                              {fmtDetailMoney(
                                txFunding.walletFunding.gatewayChargedDollars,
                                transaction.currency
                              )}
                            </div>
                          </div>
                          <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Client gross total
                            </div>
                            <div className="mt-1 font-semibold tabular-nums text-primary">
                              {fmtDetailMoney(
                                txFunding.walletFunding.fundingGrossAmount,
                                transaction.currency
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No wallet vs checkout split is recorded for this row yet (amounts may still be zero or
                        pending).
                      </p>
                    )}
                  </div>
                </>
              )}

              <Separator />

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Timeline
                </p>
                <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
                  <Table>
                    <TableBody>
                      <TableRow className="border-border/60 hover:bg-transparent">
                        <TableCell className="w-[min(11rem,42%)] py-3 pl-4 pr-2 text-sm font-medium text-muted-foreground sm:py-3.5 sm:pl-5">
                          Created at
                        </TableCell>
                        <TableCell className="whitespace-normal py-3 pr-4 pl-2 text-sm tabular-nums text-foreground sm:py-3.5 sm:pr-5">
                          {new Date(transaction.createdAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "medium",
                          })}
                        </TableCell>
                      </TableRow>
                      {transaction.processedAt ? (
                        <TableRow className="border-border/60 hover:bg-transparent">
                          <TableCell className="py-3 pl-4 pr-2 text-sm font-medium text-muted-foreground sm:py-3.5 sm:pl-5">
                            Processed at
                          </TableCell>
                          <TableCell className="whitespace-normal py-3 pr-4 pl-2 text-sm tabular-nums text-foreground sm:py-3.5 sm:pr-5">
                            {new Date(transaction.processedAt).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "medium",
                            })}
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {transaction.webhookReceivedAt ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell className="py-3 pl-4 pr-2 text-sm font-medium text-muted-foreground sm:py-3.5 sm:pl-5">
                            Webhook received
                          </TableCell>
                          <TableCell className="whitespace-normal py-3 pr-4 pl-2 text-sm tabular-nums text-foreground sm:py-3.5 sm:pr-5">
                            {new Date(transaction.webhookReceivedAt).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "medium",
                            })}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
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

          {(transaction.flutterwaveTransactionId ||
            transaction.flutterwaveTransferId ||
            transaction.flutterwaveRefundId ||
            transaction.flutterwaveCustomerEmail ||
            transaction.flutterwaveSubaccountId) && (
            <Card className="rounded-xl overflow-hidden border-border/60">
              <CardHeader className="bg-linear-to-r from-primary/5 via-transparent to-transparent">
                <CardTitle>Flutterwave</CardTitle>
                <CardDescription>Gateway references for this payment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {transaction.flutterwaveTransactionId && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Transaction reference</div>
                    <div className="font-mono text-sm break-all">{transaction.flutterwaveTransactionId}</div>
                  </div>
                )}
                {transaction.flutterwaveTransferId && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Transfer reference</div>
                    <div className="font-mono text-sm break-all">{transaction.flutterwaveTransferId}</div>
                  </div>
                )}
                {transaction.flutterwaveRefundId && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Refund reference</div>
                    <div className="font-mono text-sm break-all">{transaction.flutterwaveRefundId}</div>
                  </div>
                )}
                {transaction.flutterwaveCustomerEmail && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Customer email</div>
                    <div className="text-sm">{transaction.flutterwaveCustomerEmail}</div>
                  </div>
                )}
                {transaction.flutterwaveSubaccountId && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Subaccount ID</div>
                    <div className="font-mono text-sm break-all">{transaction.flutterwaveSubaccountId}</div>
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

