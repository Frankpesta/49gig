"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { useAuth } from "@/hooks/use-auth";
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  Clock,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";
import { Doc } from "@/convex/_generated/dataModel";

const TYPE_LABELS: Record<string, string> = {
  credit: "Credit",
  debit: "Withdrawal",
  refund: "Refund",
};

export default function WalletPage() {
  const { user } = useAuth();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const wallet = useQuery(api.wallets.queries.getMyWallet);
  const walletStats = useQuery(api.wallets.queries.getWalletStats);
  const transactions = useQuery(api.wallets.queries.getMyWalletTransactions, { limit: 50 });
  const withdrawFromWallet = useAction(api.payments.actions.withdrawFromWallet);

  const handleWithdraw = async () => {
    if (!user?._id) return;
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 1) {
      toast.error("Please enter a valid amount (minimum $1.00)");
      return;
    }
    const amountCents = Math.round(amount * 100);
    if (!walletStats || (walletStats.availableCents ?? 0) < amountCents) {
      toast.error("Insufficient balance");
      return;
    }
    setIsWithdrawing(true);
    try {
      await withdrawFromWallet({ amountCents, userId: user._id });
      toast.success("Withdrawal initiated. Funds will be transferred to your bank account.");
      setWithdrawAmount("");
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Withdrawal failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!user) {
    return null;
  }

  if (user.role !== "freelancer") {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-300">
        <DashboardPageHeader
          title="Wallet"
          description="In-platform balance for freelancers."
          icon={Wallet}
        />
        <Card>
          <CardContent className="py-12">
            <DashboardEmptyState
              icon={Wallet}
              title="Freelancers only"
              description="Wallet is available only for freelancers. Monthly payments from approved projects are credited here."
              iconTone="muted"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Wallet"
        description="Your in-platform balance. Withdraw to your bank account anytime."
        icon={Wallet}
      />

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {walletStats === undefined ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatDollars(walletStats?.availableCents ?? 0)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Ready to withdraw
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {walletStats === undefined ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatDollars(walletStats?.pendingCents ?? 0)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting client approval
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Withdrawn Balance</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {walletStats === undefined ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatDollars(walletStats?.withdrawnCents ?? 0)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Total sent to bank
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Withdraw Card */}
      <Card className="rounded-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5" />
            Withdraw Funds
          </CardTitle>
          <CardDescription>
            Funds from approved monthly payments. Withdraw to your connected bank account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {walletStats != null && (
            <div className="text-sm text-muted-foreground">
              Available: <span className="font-semibold text-foreground">{formatDollars(walletStats?.availableCents ?? 0)}</span>
            </div>
          )}

          {/* Withdraw Form */}
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 max-w-xs space-y-2">
              <Label htmlFor="withdraw-amount">Withdraw amount (USD)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
            </div>
            <Button
              onClick={handleWithdraw}
              disabled={isWithdrawing || walletStats == null || (walletStats?.availableCents ?? 0) < 100}
              className="gap-2"
            >
              {isWithdrawing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowDownToLine className="h-4 w-4" />
              )}
              Withdraw
            </Button>
          </div>
          {(wallet?.balanceCents ?? 0) < 100 && (
            <p className="text-sm text-muted-foreground">
              Minimum withdrawal is $1.00. Set up your bank account in Settings to withdraw.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="rounded-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpFromLine className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>Credits and withdrawals</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions === undefined ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <DashboardEmptyState
              icon={Wallet}
              title="No transactions yet"
              description="When clients approve monthly payments, funds will appear here."
              iconTone="muted"
              className="border-0 bg-transparent py-8 shadow-none"
            />
          ) : (
            <div className="space-y-2">
              {transactions.map((tx: Doc<"walletTransactions">) => (
                <div
                  key={tx._id}
                  className="flex items-center justify-between py-3 border-b border-border/60 last:border-0"
                >
                  <div>
                    <div className="font-medium">{tx.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString()} • {TYPE_LABELS[tx.type] ?? tx.type}
                    </div>
                  </div>
                  <div
                    className={`font-semibold ${
                      tx.type === "credit" || tx.type === "refund"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {tx.type === "debit" ? "-" : "+"}
                    ${(tx.amountCents / 100).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
