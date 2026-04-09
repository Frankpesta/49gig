"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  CheckCircle2,
  XCircle,
  Mail,
  Bitcoin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";
import { useAnalytics } from "@/hooks/use-analytics";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";

const TYPE_LABELS: Record<string, string> = {
  credit: "Credit",
  debit: "Withdrawal",
  refund: "Refund",
};

export default function WalletPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === "moderator") router.replace("/dashboard");
  }, [user?.role, router]);
  const { trackEvent } = useAnalytics();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [paypalAmount, setPaypalAmount] = useState("");
  const [paypalSubmitting, setPaypalSubmitting] = useState(false);
  const [cryptoNetwork, setCryptoNetwork] = useState("");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [cryptoSubmitting, setCryptoSubmitting] = useState(false);
  const [adminActionId, setAdminActionId] = useState<Id<"clientReferralPayoutRequests"> | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [adminActioning, setAdminActioning] = useState(false);

  const wallet = useQuery(api.wallets.queries.getMyWallet, user?._id ? { userId: user._id } : "skip");
  const walletStats = useQuery(api.wallets.queries.getWalletStats, user?._id ? { userId: user._id } : "skip");
  const transactions = useQuery(api.wallets.queries.getMyWalletTransactions, user?._id ? { limit: 50, userId: user._id } : "skip");
  const withdrawFromWallet = useAction(api.payments.actions.withdrawFromWallet);
  const reconcileWallet = useAction(api.wallets.actions.reconcileWalletFromPayments);
  const clientWalletBreakdown = useQuery(
    api.wallets.queries.getMyClientPrefundingWalletBreakdown,
    user?._id && user.role === "client"
      ? { userId: user._id, currency: wallet?.currency?.toLowerCase() ?? "usd" }
      : "skip"
  );
  const requestPaypalPayout = useMutation(api.referrals.mutations.requestClientReferralPaypalPayout);
  const requestCryptoPayout = useMutation(api.referrals.mutations.requestClientReferralCryptoPayout);
  const myPayoutRequests = useQuery(
    api.referrals.queries.getMyPayoutRequests,
    user?._id && user.role === "client" ? { userId: user._id } : "skip"
  );
  const adminPayoutRequests = useQuery(
    api.referrals.queries.getClientPayoutRequests,
    user?.role === "admin" ? {} : "skip"
  );
  const markCompleted = useMutation(api.referrals.mutations.markClientPayoutCompleted);
  const rejectPayout = useMutation(api.referrals.mutations.rejectClientPayout);
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
    const clientBankWithdrawable =
      clientWalletBreakdown?.bankWithdrawableCents ?? 0;
    const walletAvailable = walletStats?.availableCents ?? 0;
    const walletPending = walletStats?.pendingCents ?? 0;

    const handleClientBankWithdraw = async () => {
      if (!user?._id) return;
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount < 1) {
        toast.error("Please enter a valid amount (minimum $1.00)");
        return;
      }
      const amountCents = Math.round(amount * 100);
      if (amountCents > clientBankWithdrawable) {
        toast.error("Amount exceeds withdrawable balance");
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
      if (amountCents > clientBankWithdrawable) {
        toast.error("Amount exceeds withdrawable balance");
        return;
      }
      if (!cryptoNetwork.trim()) {
        toast.error("Enter the crypto network (e.g. Bitcoin, Ethereum, USDT-TRC20)");
        return;
      }
      if (!cryptoAddress.trim()) {
        toast.error("Enter your wallet address");
        return;
      }
      setCryptoSubmitting(true);
      try {
        await requestCryptoPayout({ amountCents, cryptoNetwork: cryptoNetwork.trim(), cryptoAddress: cryptoAddress.trim() });
        toast.success("Crypto payout request submitted. Our team will send funds within 1–3 business days.");
        setCryptoAmount("");
        setCryptoNetwork("");
        setCryptoAddress("");
      } catch (err) {
        toast.error(getUserFriendlyError(err) || "Request failed");
      } finally {
        setCryptoSubmitting(false);
      }
    };

    const handlePaypalRequest = async () => {
      if (!user?._id) return;
      const amount = parseFloat(paypalAmount);
      if (isNaN(amount) || amount < 1) {
        toast.error("Enter a valid amount (minimum $1.00)");
        return;
      }
      const amountCents = Math.round(amount * 100);
      if (amountCents > clientBankWithdrawable) {
        toast.error("Amount exceeds withdrawable balance");
        return;
      }
      if (!paypalEmail.trim()) {
        toast.error("Enter your PayPal email address");
        return;
      }
      setPaypalSubmitting(true);
      try {
        await requestPaypalPayout({ amountCents, paypalEmail: paypalEmail.trim() });
        toast.success("Payout request submitted. Our team will send funds to your PayPal within 1–3 business days.");
        setPaypalAmount("");
        setPaypalEmail("");
      } catch (err) {
        toast.error(getUserFriendlyError(err) || "Request failed");
      } finally {
        setPaypalSubmitting(false);
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in-50 duration-300">
        <DashboardPageHeader
          title="Wallet"
          description="Track your wallet funds, credits, and project refund holds in one place."
          icon={Wallet}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-xl overflow-hidden">
            <CardHeader>
              <CardTitle>Total wallet balance</CardTitle>
              <CardDescription>
                Includes available wallet funds and completed credits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {walletStats === undefined ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <p className="text-3xl font-bold">{formatDollars(walletAvailable)}</p>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-xl overflow-hidden">
            <CardHeader>
              <CardTitle>Pending refund credit</CardTitle>
              <CardDescription>
                Held for ongoing hires or replacement flow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {walletStats === undefined ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <p className="text-3xl font-bold">{formatDollars(walletPending)}</p>
              )}
            </CardContent>
          </Card>
        </div>
        <Card className="rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle>Withdrawable balance</CardTitle>
            <CardDescription>
              Cash you can withdraw (bank, PayPal, or crypto). Legacy hiring-only referral
              credits apply at checkout only and are not included here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clientWalletBreakdown === undefined ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <p className="text-3xl font-bold">{formatDollars(clientBankWithdrawable)}</p>
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
              disabled={isWithdrawing || clientBankWithdrawable < 100}
            >
              {isWithdrawing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Withdraw"}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Request PayPal payout
            </CardTitle>
            <CardDescription>
              Submit your PayPal email. Our team will manually send the funds within 1–3 business days.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label>Amount (USD)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={paypalAmount}
                  onChange={(e) => setPaypalAmount(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>PayPal email address</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
              />
            </div>
            <Button
              onClick={handlePaypalRequest}
              disabled={paypalSubmitting || clientBankWithdrawable < 100}
              className="gap-2"
            >
              {paypalSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowUpFromLine className="h-4 w-4" /> Submit request</>}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bitcoin className="h-5 w-5 text-primary" />
              Request crypto payout
            </CardTitle>
            <CardDescription>
              Submit your wallet address. Our team will manually send the funds within 1–3 business days.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label>Amount (USD)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={cryptoAmount}
                  onChange={(e) => setCryptoAmount(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Crypto network</Label>
              <Input
                type="text"
                placeholder="e.g. Bitcoin, Ethereum, USDT-TRC20"
                value={cryptoNetwork}
                onChange={(e) => setCryptoNetwork(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Wallet address</Label>
              <Input
                type="text"
                placeholder="Your wallet address"
                value={cryptoAddress}
                onChange={(e) => setCryptoAddress(e.target.value)}
              />
            </div>
            <Button
              onClick={handleCryptoRequest}
              disabled={cryptoSubmitting || clientBankWithdrawable < 100}
              className="gap-2"
            >
              {cryptoSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowUpFromLine className="h-4 w-4" /> Submit request</>}
            </Button>
          </CardContent>
        </Card>

        {/* Payout request history */}
        {myPayoutRequests && myPayoutRequests.length > 0 && (
          <Card className="rounded-xl overflow-hidden">
            <CardHeader>
              <CardTitle>Payout request history</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myPayoutRequests.map((r: { _id: Id<"clientReferralPayoutRequests">; amountCents: number; paypalEmail?: string; cryptoNetwork?: string; cryptoAddress?: string; method?: string; createdAt: number; adminNote?: string; status: string }) => (
                  <div key={r._id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">
                        {formatDollars(r.amountCents)} → {r.method === "crypto" ? `${r.cryptoNetwork}: ${r.cryptoAddress?.slice(0, 12)}…` : r.paypalEmail}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(r.createdAt, { addSuffix: true })}</p>
                      {r.adminNote && <p className="text-xs text-muted-foreground mt-1">Note: {r.adminNote}</p>}
                    </div>
                    <Badge variant={r.status === "completed" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  type PayoutRequest = { _id: Id<"clientReferralPayoutRequests">; amountCents: number; method?: string; paypalEmail?: string; cryptoNetwork?: string; cryptoAddress?: string; createdAt: number; adminNote?: string; status: string; clientName?: string; clientEmail?: string };

  if (user.role === "admin") {
    const pendingRequests = (adminPayoutRequests ?? [] as PayoutRequest[]).filter((r: PayoutRequest) => r.status === "pending" || r.status === "processing");
    const completedRequests = (adminPayoutRequests ?? [] as PayoutRequest[]).filter((r: PayoutRequest) => r.status === "completed" || r.status === "rejected");

    const handleMarkCompleted = async (requestId: Id<"clientReferralPayoutRequests">) => {
      setAdminActioning(true);
      try {
        await markCompleted({ requestId, adminNote: adminNote.trim() || undefined });
        toast.success("Marked as paid. Client balance updated.");
        setAdminActionId(null);
        setAdminNote("");
      } catch (err) {
        toast.error(getUserFriendlyError(err) || "Action failed");
      } finally {
        setAdminActioning(false);
      }
    };

    const handleReject = async (requestId: Id<"clientReferralPayoutRequests">) => {
      setAdminActioning(true);
      try {
        await rejectPayout({ requestId, adminNote: adminNote.trim() || undefined });
        toast.success("Request rejected.");
        setAdminActionId(null);
        setAdminNote("");
      } catch (err) {
        toast.error(getUserFriendlyError(err) || "Action failed");
      } finally {
        setAdminActioning(false);
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in-50 duration-300">
        <DashboardPageHeader
          title="Referral Payout Requests"
          description="Review and manually disburse client referral earnings via PayPal."
          icon={Wallet}
        />

        {/* Pending */}
        <Card className="rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle>Pending requests ({pendingRequests.length})</CardTitle>
            <CardDescription>Send payment via PayPal, then mark as paid here to update the client's balance.</CardDescription>
          </CardHeader>
          <CardContent>
            {adminPayoutRequests === undefined ? (
              <Skeleton className="h-20 w-full" />
            ) : pendingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No pending requests.</p>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((r: PayoutRequest) => (
                  <div key={r._id} className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-lg">{formatDollars(r.amountCents)}</p>
                        <p className="text-sm text-muted-foreground">{r.clientName} · {r.clientEmail}</p>
                        <div className="flex items-center gap-2 text-sm">
                          {r.method === "crypto" ? (
                            <>
                              <Bitcoin className="h-3.5 w-3.5 text-primary" />
                              <span className="font-medium">Crypto ({r.cryptoNetwork}):</span>
                              <span className="text-primary font-mono text-xs break-all">{r.cryptoAddress}</span>
                            </>
                          ) : (
                            <>
                              <Mail className="h-3.5 w-3.5 text-primary" />
                              <span className="font-medium">PayPal:</span>
                              <span className="text-primary">{r.paypalEmail}</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(r.createdAt, { addSuffix: true })}</p>
                      </div>
                      <Badge variant="secondary">{r.status}</Badge>
                    </div>

                    {adminActionId === r._id ? (
                      <div className="space-y-2 pt-2 border-t border-border/40">
                        <Label className="text-xs">Note to client (optional)</Label>
                        <Textarea
                          placeholder="e.g. Payment sent, check your PayPal"
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          rows={2}
                          className="resize-none text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleMarkCompleted(r._id)}
                            disabled={adminActioning}
                          >
                            {adminActioning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            Mark as paid
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1.5"
                            onClick={() => handleReject(r._id)}
                            disabled={adminActioning}
                          >
                            {adminActioning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                            Reject
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setAdminActionId(null); setAdminNote(""); }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAdminActionId(r._id)}
                      >
                        Review & action
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* History */}
        {completedRequests.length > 0 && (
          <Card className="rounded-xl overflow-hidden">
            <CardHeader>
              <CardTitle>Processed requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {completedRequests.map((r: PayoutRequest) => (
                  <div key={r._id} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/10 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">
                        {r.clientName} — {formatDollars(r.amountCents)} → {r.method === "crypto" ? `${r.cryptoNetwork}: ${r.cryptoAddress?.slice(0, 16)}…` : r.paypalEmail}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(r.createdAt, { addSuffix: true })}</p>
                      {r.adminNote && <p className="text-xs text-muted-foreground">Note: {r.adminNote}</p>}
                    </div>
                    <Badge variant={r.status === "completed" ? "default" : "destructive"}>{r.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
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
                    <div className="font-medium flex items-center gap-2 flex-wrap">
                      <span>{tx.description}</span>
                      <Badge
                        variant={
                          tx.status === "completed"
                            ? "default"
                            : tx.status === "pending"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {tx.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString()} • {TYPE_LABELS[tx.type] ?? tx.type}
                    </div>
                  </div>
                  <div
                    className={`font-semibold ${
                      (tx.type === "credit" || tx.type === "refund") && tx.status === "completed"
                        ? "text-green-600"
                        : tx.type === "refund" && tx.status === "pending"
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {tx.type === "debit" ? "-" : tx.status === "pending" ? "~" : "+"}
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
