"use client";

import { useAuth } from "@/hooks/use-auth";
import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MetricCard } from "@/components/dashboard/metric-card";
import { AdminCharts } from "@/components/dashboard/admin-charts";
import { FreelancerChecklist } from "@/components/dashboard/freelancer-checklist";
import {
  ProjectAnalyticsCard,
  ProjectListCard,
  TeamCollaborationCard,
  ProjectProgressCard,
  EarningsWidget,
} from "@/components/dashboard/dashboard-widgets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  MessageSquare,
  ArrowRight,
  Sparkles,
  DollarSign,
  Users,
  Activity,
  Star,
  Target,
  Wallet,
  Timer,
  Gauge,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Plus,
  FileDown,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Doc } from "@/convex/_generated/dataModel";

export default function DashboardPage() {
  const { user } = useAuth();
  const [adminRangeDays, setAdminRangeDays] = useState(90);

  if (!user) return null;

  const isClient = user.role === "client";
  const isFreelancer = user.role === "freelancer";
  const isAdmin = user.role === "admin";

  const dashboardMetrics = useQuery(
    (api as any).dashboard.queries.getDashboardMetrics,
    user?._id ? { userId: user._id } : "skip"
  );
  const isLoading = dashboardMetrics === undefined;

  const projects = useQuery(
    api.projects.queries.getProjects,
    user?._id ? { userId: user._id } : "skip"
  );

  const recentActivity = useQuery(
    api.notifications.queries.getMyNotifications,
    user?._id ? { userId: user._id, limit: 10 } : "skip"
  );

  const walletStats = useQuery(
    api.wallets.queries.getWalletStats,
    isFreelancer && user?._id ? { userId: user._id } : "skip"
  );

  const freelancerReviews = useQuery(
    (api as any)["reviews/queries"].getReviewsForFreelancer,
    isFreelancer && user?._id
      ? { freelancerId: user._id, userId: user._id, limit: 5 }
      : "skip"
  );

  const adminCharts = useQuery(
    (api as any)["analytics/queries"].getAdminChartData,
    isAdmin && user?._id ? { userId: user._id, rangeDays: adminRangeDays } : "skip"
  );

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  // Build weekly activity for Project Analytics
  const projectAnalyticsData = useMemo(() => {
    if (!projects || projects.length === 0) return undefined;
    const days = ["S", "M", "T", "W", "T", "F", "S"];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    return days.map((day, i) => {
      const start = now - (6 - i) * dayMs;
      const end = start + dayMs;
      const count = projects.filter(
        (p: any) => p.createdAt >= start && p.createdAt < end
      ).length;
      return { day, count };
    });
  }, [projects]);

  // Project progress (completed, in progress, pending)
  const projectProgress = useMemo(() => {
    if (!projects) return { completed: 0, inProgress: 0, pending: 0 };
    const completed = projects.filter((p: any) => p.status === "completed").length;
    const inProgress = projects.filter((p: any) =>
      ["matched", "in_progress"].includes(p.status)
    ).length;
    const pending = projects.filter((p: any) =>
      ["draft", "pending_funding", "funded", "matching"].includes(p.status)
    ).length;
    return { completed, inProgress, pending };
  }, [projects]);

  // Team collaboration - for clients: freelancers on active projects
  const teamMembers = useMemo(() => {
    if (!projects || !isClient) return [];
    const active = projects.filter((p: any) =>
      ["matched", "in_progress"].includes(p.status)
    );
    return active.slice(0, 4).map((p: any) => ({
      name: p.matchedFreelancerName ?? "Freelancer",
      task: p.intakeForm?.title ?? (isClient ? "Working on hire" : "Working on project"),
      status: (p.status === "completed" ? "completed" : "in_progress") as "in_progress" | "completed" | "pending",
    }));
  }, [projects, isClient]);

  const metrics = isClient
    ? [
        {
          title: "Total Hires",
          subtitle: "All time",
          value: projects?.length ?? 0,
          description: "Increased from last month",
          icon: Briefcase,
          variant: "accent" as const,
          trend: dashboardMetrics?.metrics?.trends?.activeProjects,
          badge: "Client",
        },
        {
          title: "Completed",
          subtitle: "Ended successfully",
          value: projects?.filter((p: any) => p.status === "completed").length ?? 0,
          description: "Hires delivered",
          icon: Briefcase,
          variant: "default" as const,
          trend: undefined,
          badge: "Done",
        },
        {
          title: "Active",
          subtitle: "In progress",
          value: dashboardMetrics?.metrics?.activeProjects ?? 0,
          description: "Currently active",
          icon: Briefcase,
          variant: "default" as const,
          trend: dashboardMetrics?.metrics?.trends?.activeProjects,
          badge: "Live",
        },
        {
          title: "Pending",
          subtitle: "Awaiting",
          value: projects?.filter((p: any) =>
            ["draft", "pending_funding", "funded", "matching"].includes((p as any).status)
          ).length ?? 0,
          description: "In discussion",
          icon: Briefcase,
          variant: "default" as const,
          badge: "Queue",
        },
      ]
    : isFreelancer
    ? [
        {
          title: "Total Hires",
          subtitle: "All time",
          value: projects?.length ?? 0,
          description: "Increased from last month",
          icon: Briefcase,
          variant: "accent" as const,
          trend: dashboardMetrics?.metrics?.trends?.activeProjects,
          badge: "Freelancer",
        },
        {
          title: "Completed",
          subtitle: "Delivered",
          value: projects?.filter((p: any) => p.status === "completed").length ?? 0,
          description: "Hires finished",
          icon: Briefcase,
          variant: "default" as const,
          badge: "Done",
        },
        {
          title: "Active",
          subtitle: "In progress",
          value: dashboardMetrics?.metrics?.activeProjects ?? 0,
          description: "Currently working",
          icon: Briefcase,
          variant: "default" as const,
          trend: dashboardMetrics?.metrics?.trends?.activeProjects,
          badge: "Live",
        },
        {
          title: "Earnings",
          subtitle: "This month",
          value: formatCurrency(dashboardMetrics?.metrics?.earnings ?? 0),
          description: "From completed hires",
          icon: DollarSign,
          variant: "default" as const,
          trend: dashboardMetrics?.metrics?.trends?.earnings,
          badge: "MTD",
        },
        {
          title: "Pending Balance",
          subtitle: "Awaiting approval",
          value: walletStats === undefined ? "—" : formatCurrency((walletStats?.pendingCents ?? 0) / 100),
          description: "From monthly cycles awaiting client approval",
          icon: Wallet,
          variant: "default" as const,
          badge: "Pending",
        },
        {
          title: "Approved Balance",
          subtitle: "Available",
          value: walletStats === undefined ? "—" : formatCurrency((walletStats?.availableCents ?? 0) / 100),
          description: "In wallet, ready to withdraw",
          icon: Wallet,
          variant: "default" as const,
          badge: "Ready",
        },
      ]
    : [
        {
          title: "Total Projects",
          subtitle: "Platform-wide",
          value: dashboardMetrics?.metrics?.totalProjects ?? 0,
          description: "All projects in the system",
          icon: Briefcase,
          variant: "accent" as const,
          trend: { value: 12, label: "30d", isPositive: true },
          badge: "Admin",
        },
        {
          title: "Active Clients",
          subtitle: "Engaged",
          value: dashboardMetrics?.metrics?.activeClients ?? 0,
          description: "Currently hiring",
          icon: Users,
          variant: "default" as const,
          badge: "Clients",
        },
        {
          title: "Active Freelancers",
          subtitle: "Verified",
          value: dashboardMetrics?.metrics?.activeFreelancers ?? 0,
          description: "Delivering projects",
          icon: Users,
          variant: "default" as const,
          badge: "Talent",
        },
        {
          title: "Revenue",
          subtitle: "This month",
          value: formatCurrency(dashboardMetrics?.metrics?.revenue ?? 0),
          description: "Platform earnings",
          icon: DollarSign,
          variant: "default" as const,
          trend: { value: 5, label: "30d", isPositive: true },
          badge: "MTD",
        },
      ];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {isFreelancer && <FreelancerChecklist />}

      {/* Page header - reference style, lively typography */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isClient
              ? "Plan, prioritize, and manage your hires with ease."
              : "Plan, prioritize, and accomplish your hires with ease."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isClient && (
            <Button asChild className="rounded-xl">
              <Link href="/dashboard/projects/create">
                <Plus className="mr-2 h-4 w-4" />
                Hire Talents
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" className="rounded-xl border-primary/50 text-primary hover:bg-primary/10 hover:border-secondary/50 hover:text-secondary-foreground">
            <Link href="/dashboard/projects">
              <Briefcase className="mr-2 h-4 w-4" />
              View Hires
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 metric cards - reference style (first one accent) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            subtitle={metric.subtitle}
            value={isLoading ? "—" : metric.value}
            description={metric.description}
            icon={metric.icon}
            variant={metric.variant}
            trend={isLoading ? undefined : metric.trend}
            badge={metric.badge}
          />
        ))}
      </div>

      {/* Main grid - Project Analytics, Project List, Team, Progress, Earnings */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <ProjectAnalyticsCard data={projectAnalyticsData} isLoading={isLoading} isClient={isClient} />

        <ProjectListCard
          projects={projects}
          isLoading={projects === undefined}
          onCreateHref={isClient ? "/dashboard/projects/create" : undefined}
          isClient={isClient}
        />

        <TeamCollaborationCard
          members={teamMembers}
          isLoading={projects === undefined}
          onAddHref={isClient ? "/dashboard/projects/create" : undefined}
        />

        <ProjectProgressCard
          completed={projectProgress.completed}
          inProgress={projectProgress.inProgress}
          pending={projectProgress.pending}
          isLoading={projects === undefined}
        />

        {isFreelancer && (
          <EarningsWidget
            amount={formatCurrency(dashboardMetrics?.metrics?.earnings ?? 0)}
            label="Earnings this month"
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Admin charts */}
      {isAdmin && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Platform trends</h2>
            <p className="text-sm text-muted-foreground">
              Real-time operational charts for admins.
            </p>
          </div>
          {adminCharts ? (
            <AdminCharts
              data={adminCharts}
              timeRangeDays={adminRangeDays}
              onTimeRangeChange={setAdminRangeDays}
            />
          ) : (
            <Card className="flex h-[220px] items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Loading
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Client feedback (freelancer) */}
      {isFreelancer && freelancerReviews && freelancerReviews.length > 0 && (
        <Card className="overflow-hidden rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Client feedback
            </CardTitle>
            <CardDescription>
              Recent ratings from clients you&apos;ve worked with
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {freelancerReviews.map((review: { _id: string; rating: number; comment?: string; createdAt: number }) => (
                <div key={review._id} className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          review.rating >= s ? "fill-amber-400 text-amber-500" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-foreground">&quot;{review.comment}&quot;</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isClient && (
          <Card className="group rounded-xl border-2 border-primary/20 transition-all hover:border-primary/40 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Hire Talents</CardTitle>
              <CardDescription>Get matched with vetted freelancers</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/dashboard/projects/create">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Hire Talents
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
        <Card className="group rounded-xl transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Messages</CardTitle>
            <CardDescription>Check your latest conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/chat">
                <MessageSquare className="mr-2 h-4 w-4" />
                Open Messages
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="group rounded-xl transition-all hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Profile</CardTitle>
            <CardDescription>
              {isClient ? "Add company details" : isFreelancer ? "Complete your profile" : "Update your profile"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/profile">
                <Sparkles className="mr-2 h-4 w-4" />
                Go to Profile
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="overflow-hidden rounded-xl border-border/60">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest updates and notifications</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {recentActivity === undefined ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No recent activity. Your activity will appear here as you get matches, messages, and hire updates.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((n: Doc<"notifications">) => {
                const href =
                  n.type === "match" && n.data?.projectId
                    ? `/dashboard/projects/${n.data.projectId}`
                    : n.type === "message" && n.data?.chatId
                      ? `/dashboard/chat/${n.data.chatId}`
                      : null;
                return (
                  <li key={n._id} className="rounded-lg border p-3 transition-colors hover:bg-muted/50">
                    {href ? (
                      <Link href={href} className="block -m-3 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{n.title}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{n.message}</p>
                      </Link>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{n.title}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{n.message}</p>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
