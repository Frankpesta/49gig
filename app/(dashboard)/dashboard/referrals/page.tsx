"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

export default function ReferralsPage() {
  const { user, isAuthenticated } = useAuth();
  const summary = useQuery(
    api.referrals.queries.getMyReferralSummary,
    user?._id ? { userId: user._id } : "skip"
  );
  const ensureCode = useMutation(api.referrals.mutations.ensureMyReferralCode);

  useEffect(() => {
    if (!user?._id || summary === undefined || summary === null) return;
    if (!summary.referralCode) {
      ensureCode({ userId: user._id }).catch(() => {});
    }
  }, [user?._id, summary, ensureCode]);

  const copyLink = async () => {
    if (!summary?.referralCode || typeof window === "undefined") return;
    const url = `${window.location.origin}/signup/client?ref=${summary.referralCode}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <DashboardEmptyState icon={Gift} title="Please log in." iconTone="muted" />
    );
  }

  if (user.role !== "client" && user.role !== "freelancer") {
    return (
      <DashboardEmptyState
        icon={Gift}
        title="Referrals"
        description="This section is for clients and freelancers."
        iconTone="muted"
      />
    );
  }

  const shareUrl =
    typeof window !== "undefined" && summary?.referralCode
      ? `${window.location.origin}/signup/client?ref=${summary.referralCode}`
      : "";

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Referrals"
        description="Share your link with new clients. When their first hire is funded and active for 7 days, you earn a percentage of the first funding."
        icon={Gift}
      />

      <Card>
        <CardHeader>
          <CardTitle>Your link</CardTitle>
          <CardDescription>
            First-touch attribution: we record the referral when someone creates a client account with your
            code (email signup, Google, or ?ref= in the URL).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(() => {
            if (summary === undefined) {
              return (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </div>
              );
            }
            if (!summary) {
              return <p className="text-sm text-muted-foreground">Could not load referral data.</p>;
            }
            const s = summary;
            return (
              <>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input readOnly value={shareUrl || "Generating code…"} className="font-mono text-sm" />
                  <Button type="button" variant="outline" onClick={copyLink} disabled={!shareUrl}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
                {s.referredByName && (
                  <p className="text-sm text-muted-foreground">
                    You were referred by{" "}
                    <span className="font-medium text-foreground">{s.referredByName}</span>.
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Rewards pending</p>
                    <p className="text-2xl font-semibold">{s.rewardsPendingCount}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Rewards paid</p>
                    <p className="text-2xl font-semibold">{s.rewardsCreditedCount}</p>
                  </div>
                </div>
                {user.role === "client" && (
                  <p className="text-sm text-muted-foreground">
                    Your referral rewards are hiring credit only—they apply at checkout when you fund a hire, and
                    cannot be withdrawn.
                  </p>
                )}
                {user.role === "freelancer" && (
                  <p className="text-sm text-muted-foreground">
                    Referral rewards go to your wallet and can be withdrawn like other earnings.
                  </p>
                )}
              </>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
