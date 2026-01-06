"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, FolderKanban, CreditCard, Shield, AlertCircle, TrendingUp, DollarSign } from "lucide-react";

export default function AnalyticsPage() {
  const { user, isAuthenticated } = useAuth();

  const analytics = useQuery(
    (api as any)["analytics/queries"].getPlatformAnalytics,
    isAuthenticated && user?._id && user.role === "admin"
      ? { userId: user._id }
      : "skip"
  );

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Access denied. Admin role required.</p>
      </div>
    );
  }

  if (analytics === undefined) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Unable to load analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Platform statistics and insights.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Users Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.users.total}</div>
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
              <span>{analytics.users.clients} clients</span>
              <span>•</span>
              <span>{analytics.users.freelancers} freelancers</span>
            </div>
          </CardContent>
        </Card>

        {/* Projects Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.projects.total}</div>
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
              <span>{analytics.projects.completed} completed</span>
              <span>•</span>
              <span>{analytics.projects.in_progress} in progress</span>
            </div>
          </CardContent>
        </Card>

        {/* Payments Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics.payments.totalAmount.toFixed(2)}
            </div>
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
              <span>{analytics.payments.succeeded} succeeded</span>
              <span>•</span>
              <span>${analytics.payments.totalPlatformFees.toFixed(2)} fees</span>
            </div>
          </CardContent>
        </Card>

        {/* Verifications Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verifications</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.verifications.total}</div>
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
              <span>{analytics.verifications.approved} approved</span>
              <span>•</span>
              <span>Avg: {analytics.verifications.averageScore.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Users Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Clients</span>
              <Badge variant="outline">{analytics.users.clients}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Freelancers</span>
              <Badge variant="outline">{analytics.users.freelancers}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Moderators</span>
              <Badge variant="outline">{analytics.users.moderators}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Admins</span>
              <Badge variant="outline">{analytics.users.admins}</Badge>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Active</span>
                <Badge>{analytics.users.active}</Badge>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium">Suspended</span>
                <Badge variant="secondary">{analytics.users.suspended}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Projects Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Draft</span>
              <Badge variant="outline">{analytics.projects.draft}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Pending Funding</span>
              <Badge variant="outline">{analytics.projects.pending_funding}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Funded</span>
              <Badge variant="outline">{analytics.projects.funded}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Matched</span>
              <Badge variant="outline">{analytics.projects.matched}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">In Progress</span>
              <Badge variant="outline">{analytics.projects.in_progress}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Completed</span>
              <Badge>{analytics.projects.completed}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Disputed</span>
              <Badge variant="destructive">{analytics.projects.disputed}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Payments Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payments Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Payments</span>
              <Badge variant="outline">{analytics.payments.total}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Succeeded</span>
              <Badge>{analytics.payments.succeeded}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Pending</span>
              <Badge variant="secondary">{analytics.payments.pending}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Failed</span>
              <Badge variant="destructive">{analytics.payments.failed}</Badge>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Revenue</span>
                <span className="text-lg font-bold">
                  ${analytics.payments.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium">Platform Fees</span>
                <span className="text-lg font-bold">
                  ${analytics.payments.totalPlatformFees.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disputes & Matches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Disputes & Matches
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="text-sm font-medium">Disputes</div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total</span>
                <Badge variant="outline">{analytics.disputes.total}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Open</span>
                <Badge variant="secondary">{analytics.disputes.open}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Resolved</span>
                <Badge>{analytics.disputes.resolved}</Badge>
              </div>
            </div>
            <div className="border-t pt-4 space-y-3">
              <div className="text-sm font-medium">Matches</div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total</span>
                <Badge variant="outline">{analytics.matches.total}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Accepted</span>
                <Badge>{analytics.matches.accepted}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Average Score</span>
                <Badge variant="outline">
                  {analytics.matches.averageScore.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

