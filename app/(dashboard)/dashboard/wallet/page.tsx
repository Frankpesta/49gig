"use client";

import { useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
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
import { useAnalytics } from "@/hooks/use-analytics";
import { Doc } from "@/convex/_generated/dataModel";

const TYPE_LABELS: Record<string, string> = {
  credit: "Credit",
  debit: "Withdrawal",
  refund: "Refund",
};

export default function WalletPage() {
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [cryptoNetwork, setCryptoNetwork] = useState("");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [cryptoSubmitting, setCryptoSubmitting] = useState(false);

  const wallet = useQuery(api.wallets.queries.getMyWallet, user?._id ? { userId: user._id } : "skip");
  const walletStats = useQuery(api.wallets.queries.getWalletStats, user?._id ? { userId: user._id } : "skip");
  const transactions = useQuery(api.wallets.queries.getMyWalletTransactions, user?._id ? { limit: 50, userId: user._id } : "skip");
  const withdrawFromWallet = useAction(api.payments.actions.withdrawFromWallet);
  const reconcileWallet = useAction(api.wallets.actions.reconcileWalletFromPayments);
  const referralCash = useQuery(
    api.wallets.queries.getClientReferralCashBalanceCents,
    user?._id && user.role === "client" ? { userId: user._id } : "skip"
  );
  const requestCryptoPayout = useMutation(api.referrals.mutations.requestClientReferralCryptoPayout);
  const [isReconciling, setIsReconciling] = useState(false);

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
      trackEvent("withdraw", { value: amountCents / 100, currency: "USD" });
      toast.success("Withdrawal initiated. Funds will be transferred to your bank account.");
      setWithdrawAmount("");
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Withdrawal failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleReconcile = async () => {
    if (!user?._id) return;
    setIsReconciling(true);
    try {
      const result = await reconcileWallet({ userId: user._id });
      if (result.reconciled) {
        toast.success(`Wallet synced. $${result.creditedCents! / 100} credited.`);
      } else {
        toast.info(result.message ?? "Wallet already in sync");
      }
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Reconciliation failed");
    } finally {
      setIsReconciling(false);
    }
  };

  if (!user) {
    return null;
  }

  const formatDollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (user.role === "client") {
    const available = referralCash?.cents ?? 0;

    const handleClientBankWithdraw = async () => {
      if (!user?._id) return;
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount < 1) {
        toast.error("Please enter a valid amount (minimum $1.00)");
        return;
      }
      const amountCents = Math.round(amount * 100);
      if (amountCents > available) {
        toast.error("Amount exceeds withdrawable referral balance");
        return;
      }
      setIsWithdrawing(true);
      try {
        await withdrawFromWallet({ amountCents, userId: user._id });
        toast.success("Withdrawal initiated to your linked bank account.");
        setWithdrawAmount("");
      } catch (err) {
        toast.error(getUserFriendlyError(err) || "Withdrawal failed");
      } finally {
        setIsWithdrawing(false);
      }
    };

    const handleCryptoRequest = async () => {
      if (!user?._id) return;
      const amount = parseFloat(cryptoAmount);
      if (isNaN(amount) || amount < 1) {
        toast.error("Enter a valid amount (minimum $1.00)");
        return;
      }
      const amountCents = Math.round(amount * 100);
      if (amountCents > available) {
        toast.error("Amount exceeds withdrawable referral balance");
        return;
      }
      setCryptoSubmitting(true);
      try {
        await requestCryptoPayout({
          amountCents,
          cryptoNetwork,
          cryptoAddress,
        });
        toast.success("Request submitted. Our team will process your crypto payout and may contact you if needed.");
        setCryptoAmount("");
        setCryptoNetwork("");
        setCryptoAddress("");
      } catch (err) {
        toast.error(getUserFriendlyError(err) || "Request failed");
      } finally {
        setCryptoSubmitting(false);
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in-50 duration-300">
        <DashboardPageHeader
          title="Wallet"
          description="Referral rewards (after the first monthly payment is approved on a referred hire) appear here. Withdraw to your bank or request a crypto payout."
          icon={Wallet}
        />
        <Card className="rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle>Withdrawable referral balance</CardTitle>
            <CardDescription>
              Separate from hiring credits used at checkout. Link a bank account under Settings (same as freelancers) to withdraw via bank.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referralCash === undefined ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-3xl font-bold">{formatDollars(available)}</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle>Withdraw to bank</CardTitle>
            <CardDescription>Uses your payout account from Settings.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 max-w-xs space-y-2">
              <Label htmlFor="client-withdraw">Amount (USD)</Label>
              <Input
                id="client-withdraw"
                type="number"
                min="1"
                step="0.01"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
            </div>
            <Button
              onClick={handleClientBankWithdraw}
              disabled={isWithdrawing || available < 100}
            >
              {isWithdrawing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Withdraw"}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle>Request crypto payout</CardTitle>
            <CardDescription>
              Submit network and address. We review and process manually (similar to P2P escrow flows).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label>Amount (USD)</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={cryptoAmount}
                onChange={(e) => setCryptoAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Network</Label>
              <Input
                placeholder="e.g. USDT TRC20, ERC20, BTC"
                value={cryptoNetwork}
                onChange={(e) => setCryptoNetwork(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Wallet address</Label>
              <Input
                value={cryptoAddress}
                onChange={(e) => setCryptoAddress(e.target.value)}
              />
            </div>
            <Button onClick={handleCryptoRequest} disabled={cryptoSubmitting || available < 100}>
              {cryptoSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit request"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== "freelancer") {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-300">
        <DashboardPageHeader title="Wallet" description="Wallet access is not available for your role." icon={Wallet} />
        <Card>
          <CardContent className="py-12">
            <DashboardEmptyState icon={Wallet} title="Unavailable" description="Sign in as a client or freelancer." iconTone="muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Wallet"
        description="Approved payments are credited here. Withdraw to your bank account when ready."
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
            Funds from approved monthly payments go to your wallet. Withdraw to your bank account when you're ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {walletStats != null && (
            <div className="flex flex-col gap-2">
              <div className="text-sm text-muted-foreground">
                Available: <span className="font-semibold text-foreground">{formatDollars(walletStats?.availableCents ?? 0)}</span>
              </div>
              {walletStats?.needsReconciliation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReconcile}
                  disabled={isReconciling}
                  className="w-fit"
                >
                  {isReconciling ? "Syncing..." : "Sync wallet from payment records"}
                </Button>
              )}
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
              description="When clients approve monthly payments, funds are credited here. You can then withdraw to your bank."
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
