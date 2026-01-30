"use client";

import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MetricCard } from "@/components/dashboard/metric-card";
import { AdminCharts } from "@/components/dashboard/admin-charts";
import { FreelancerChecklist } from "@/components/dashboard/freelancer-checklist";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  MessageSquare, 
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Sparkles,
  DollarSign,
  Users,
  Activity,
  ShieldCheck,
  Wallet,
  Timer,
  Gauge,
  Star,
  Target,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Doc } from "@/convex/_generated/dataModel";

export default function DashboardPage() {
  const { user } = useAuth();
  const [adminRangeDays, setAdminRangeDays] = useState(90);

  if (!user) {
    return null;
  }

  const isClient = user.role === "client";
  const isFreelancer = user.role === "freelancer";
  const isAdmin = user.role === "admin";

  const dashboardMetrics = useQuery(
    (api as any).dashboard.queries.getDashboardMetrics,
    user?._id ? { userId: user._id } : "skip"
  );
  const recentActivity = useQuery(
    api.notifications.queries.getMyNotifications,
    user?._id ? { userId: user._id, limit: 10 } : "skip"
  );
  const adminCharts = useQuery(
    (api as any)["analytics/queries"].getAdminChartData,
    isAdmin && user?._id ? { userId: user._id, rangeDays: adminRangeDays } : "skip"
  );

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const metrics = isClient
    ? [
        {
          title: "Active Projects",
          subtitle: "Currently in progress",
          value: dashboardMetrics?.metrics?.activeProjects ?? 0,
          description: "Live projects being worked on",
          icon: Briefcase,
          variant: "primary" as const,
          trend: dashboardMetrics?.metrics?.trends?.activeProjects,
          progress: {
            value: dashboardMetrics?.metrics?.activeProjectsProgress ?? 0,
            label: "Milestones",
          },
          badge: "Client",
        },
        {
          title: "Proposals",
          subtitle: "New this week",
          value: dashboardMetrics?.metrics?.proposals ?? 0,
          description: "Freelancer offers received",
          icon: Target,
          variant: "default" as const,
          trend: dashboardMetrics?.metrics?.trends?.proposals,
          badge: "Inbox",
        },
        {
          title: "Budget in Escrow",
          subtitle: "Secured payments",
          value: formatCurrency(dashboardMetrics?.metrics?.escrowed ?? 0),
          description: "Funds protected for milestones",
          icon: Wallet,
          variant: "success" as const,
          trend: dashboardMetrics?.metrics?.trends?.escrowed,
          badge: "Secure",
        },
        {
          title: "Total Spend",
          subtitle: "All time",
          value: formatCurrency(dashboardMetrics?.metrics?.totalSpend ?? 0),
          description: "Cumulative project spend",
          icon: DollarSign,
          variant: "success" as const,
          trend: dashboardMetrics?.metrics?.trends?.totalSpend,
          badge: "Lifetime",
        },
        {
          title: "Avg. Match Time",
          subtitle: "Time to hire",
          value: `${dashboardMetrics?.metrics?.avgMatchHours ?? 0}h`,
          description: "Average time from project creation to match",
          icon: Timer,
          variant: "warning" as const,
          trend: undefined,
          badge: "SLA",
        },
        {
          title: "Satisfaction",
          subtitle: "Your ratings",
          value: `${dashboardMetrics?.metrics?.satisfactionRate ?? 0}%`,
          description: "From your freelancer ratings (1–5 stars)",
          icon: Star,
          variant: "default" as const,
          progress: {
            value: dashboardMetrics?.metrics?.satisfactionRate ?? 0,
            label: "Quality",
          },
          badge: "Top",
        },
      ]
    : isFreelancer
    ? [
        {
          title: "Active Projects",
          subtitle: "Currently assigned",
          value: dashboardMetrics?.metrics?.activeProjects ?? 0,
          description: "Projects you’re working on",
          icon: Briefcase,
          variant: "primary" as const,
          trend: dashboardMetrics?.metrics?.trends?.activeProjects,
          badge: "Freelancer",
        },
        {
          title: "Earnings",
          subtitle: "This month",
          value: formatCurrency(dashboardMetrics?.metrics?.earnings ?? 0),
          description: "Payouts and approved milestones",
          icon: DollarSign,
          variant: "success" as const,
          trend: dashboardMetrics?.metrics?.trends?.earnings,
          badge: "MTD",
        },
        {
          title: "Match Score",
          subtitle: "Profile strength",
          value: `${dashboardMetrics?.metrics?.matchScore ?? 0}%`,
          description: "Completeness & relevance",
          icon: Gauge,
          variant: "warning" as const,
          progress: { value: dashboardMetrics?.metrics?.matchScore ?? 0, label: "Profile" },
          badge: "Improve",
        },
        {
          title: "Estimated Hours",
          subtitle: "This week",
          value: `${dashboardMetrics?.metrics?.estimatedHours ?? 0}h`,
          description: "Projected workload",
          icon: Clock,
          variant: "default" as const,
          badge: "Weekly",
        },
        {
          title: "Pending Reviews",
          subtitle: "Client feedback",
          value: dashboardMetrics?.metrics?.pendingReviews ?? 0,
          description: "Awaiting approvals",
          icon: ShieldCheck,
          variant: "warning" as const,
          badge: "Pending",
        },
        {
          title: "Response Rate",
          subtitle: "Last 30 days",
          value: `${dashboardMetrics?.metrics?.responseRate ?? 0}%`,
          description: "Client reply efficiency",
          icon: Activity,
          variant: "default" as const,
          progress: { value: dashboardMetrics?.metrics?.responseRate ?? 0, label: "Engagement" },
          badge: "Goal",
        },
      ]
    : [
        {
          title: "Total Projects",
          subtitle: "Platform-wide",
          value: dashboardMetrics?.metrics?.totalProjects ?? 0,
          description: "All projects in the system",
          icon: Briefcase,
          variant: "primary" as const,
          trend: { value: 12, label: "30d", isPositive: true },
          badge: "Admin",
        },
        {
          title: "Active Clients",
          subtitle: "Engaged accounts",
          value: dashboardMetrics?.metrics?.activeClients ?? 0,
          description: "Currently hiring",
          icon: Users,
          variant: "default" as const,
          trend: { value: 3, label: "30d", isPositive: true },
          badge: "Clients",
        },
        {
          title: "Active Freelancers",
          subtitle: "Verified & available",
          value: dashboardMetrics?.metrics?.activeFreelancers ?? 0,
          description: "Delivering projects",
          icon: TrendingUp,
          variant: "success" as const,
          trend: { value: 9, label: "30d", isPositive: true },
          badge: "Talent",
        },
        {
          title: "Revenue",
          subtitle: "This month",
          value: formatCurrency(dashboardMetrics?.metrics?.revenue ?? 0),
          description: "Platform earnings",
          icon: DollarSign,
          variant: "success" as const,
          trend: { value: 5, label: "30d", isPositive: true },
          badge: "MTD",
        },
        {
          title: "Open Disputes",
          subtitle: "Needs attention",
          value: dashboardMetrics?.metrics?.openDisputes ?? 0,
          description: "Cases in review",
          icon: AlertCircle,
          variant: "warning" as const,
          badge: "Risk",
        },
        {
          title: "System Health",
          subtitle: "Operational status",
          value: `${dashboardMetrics?.metrics?.systemHealth ?? 100}%`,
          description: "Uptime and reliability",
          icon: Activity,
          variant: "default" as const,
          progress: { value: dashboardMetrics?.metrics?.systemHealth ?? 100, label: "Uptime" },
          badge: "Stable",
        },
      ];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Warning Checklist - Show at top for freelancers */}
      {isFreelancer && <FreelancerChecklist />}
      
      {/* Welcome Section with Gradient */}
      <div className="relative space-y-3 overflow-hidden rounded-xl border bg-gradient-to-br from-primary/5 via-background to-background p-6 shadow-sm">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold tracking-tight text-foreground">
                Welcome back, {user.name.split(" ")[0]}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Here&apos;s what&apos;s happening with your {isClient ? "projects" : isFreelancer ? "opportunities" : "platform"} today.
              </p>
            </div>
          </div>
        </div>
        {/* Decorative gradient */}
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            subtitle={metric.subtitle}
            value={metric.value}
            description={metric.description}
            icon={metric.icon}
            variant={metric.variant}
            trend={metric.trend}
            progress={metric.progress}
            badge={metric.badge}
          />
        ))}
      </div>

      {isAdmin && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-heading font-semibold">Platform trends</h2>
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
                Loading charts...
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Quick Actions with Enhanced Design */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isClient && (
          <Card className="group relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">Get Started</CardTitle>
              </div>
              <CardDescription className="text-base">
                Create your first project to get matched with vetted freelancers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full group-hover:scale-[1.02] transition-transform">
                <Link href="/dashboard/projects/create" className="flex items-center justify-center">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Create Project
                  <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </Button>
            </CardContent>
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Card>
        )}

        {isFreelancer && (
          <Card className="group relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">View Opportunities</CardTitle>
              </div>
              <CardDescription className="text-base">
                Browse projects matched to your skills and expertise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full group-hover:scale-[1.02] transition-transform">
                <Link href="/dashboard/opportunities" className="flex items-center justify-center">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Opportunities
                  <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </Button>
            </CardContent>
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Card>
        )}

        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-accent transition-colors">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl">Messages</CardTitle>
            </div>
            <CardDescription className="text-base">
              Check your latest messages and conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full group-hover:scale-[1.02] transition-transform">
              <Link href="/dashboard/messages" className="flex items-center justify-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                Open Messages
                <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-accent transition-colors">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl">Complete Profile</CardTitle>
            </div>
            <CardDescription className="text-base">
              {isClient 
                ? "Add company details to improve project matching"
                : isFreelancer
                ? "Complete your profile to get more opportunities"
                : "Update your profile information"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full group-hover:scale-[1.02] transition-transform">
              <Link href="/dashboard/profile" className="flex items-center justify-center">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Go to Profile
                <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - from notifications (matches, messages, payments, etc.) */}
      <Card className="overflow-hidden border-2">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Recent Activity</CardTitle>
              <CardDescription className="mt-1">
                Your latest updates and notifications
              </CardDescription>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {recentActivity === undefined ? (
            <div className="flex items-center justify-center py-12">
              <Clock className="h-8 w-8 animate-pulse text-muted-foreground" />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                No recent activity to display
              </p>
              <p className="text-xs text-muted-foreground/70">
                Your activity will appear here as you get matches, messages, and project updates
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((n: Doc<"notifications">) => {
                const href =
                  n.type === "match" && n.data?.projectId
                    ? `/dashboard/projects/${n.data.projectId}`
                    : n.type === "message" && n.data?.chatId
                      ? `/dashboard/chat/${n.data.chatId}`
                      : null;
                const content = (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{n.title}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                  </>
                );
                return (
                  <li
                    key={n._id}
                    className="flex flex-col gap-0.5 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    {href ? (
                      <Link href={href} className="block -m-3 p-3">
                        {content}
                      </Link>
                    ) : (
                      content
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
