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
          title: "Client Ratings",
          subtitle: "Your reputation",
          value: dashboardMetrics?.metrics?.avgRating
            ? `${dashboardMetrics.metrics.avgRating}/5 (${dashboardMetrics.metrics.reviewCount ?? 0} reviews)`
            : "No reviews yet",
          description: "Client feedback from completed projects",
          icon: Star,
          variant: "warning" as const,
          progress:
            dashboardMetrics?.metrics?.avgRating
              ? { value: (dashboardMetrics.metrics.avgRating / 5) * 100, label: "Reputation" }
              : undefined,
          badge: "Reputation",
        },
        {
          title: "Match Score",
          subtitle: "Profile strength",
          value: `${dashboardMetrics?.metrics?.matchScore ?? 0}%`,
          description: "Completeness & relevance",
          icon: Gauge,
          variant: "default" as const,
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

      {/* Main 2-column layout: center content + right rail */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1.4fr)] xl:grid-cols-[minmax(0,3.5fr)_minmax(280px,1.4fr)]">
        {/* Center column (primary content) */}
        <div className="space-y-6">
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
                    Here&apos;s what&apos;s happening with your {isClient ? "projects" : isFreelancer ? "projects" : "platform"} today.
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

          {/* Client feedback (freelancer) */}
          {isFreelancer && freelancerReviews && freelancerReviews.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-heading font-semibold">Client feedback</h2>
              <p className="text-sm text-muted-foreground">
                Recent ratings and feedback from clients you&apos;ve worked with.
              </p>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Your reviews
                  </CardTitle>
                  <CardDescription>
                    {freelancerReviews.length} review{freelancerReviews.length !== 1 ? "s" : ""} from clients
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
                                review.rating >= s
                                  ? "fill-amber-400 text-amber-500"
                                  : "text-muted-foreground"
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
            </div>
          )}

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
                    <CardTitle className="text-xl">View Projects</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Projects you&apos;re selected for appear here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full group-hover:scale-[1.02] transition-transform">
                    <Link href="/dashboard/projects" className="flex items-center justify-center">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      View Projects
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
                    ? "Complete your profile to get more projects"
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
        </div>

        {/* Right column: Up next + activity + help */}
        <aside className="space-y-4">
          {/* Up next */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Up next
              </CardTitle>
              <CardDescription className="text-xs">
                Key actions based on your current projects.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {isClient && (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">Approve milestones</p>
                      <p className="text-xs text-muted-foreground">
                        Review work and release payments for submitted milestones.
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/projects">View projects</Link>
                    </Button>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">Sign contracts</p>
                      <p className="text-xs text-muted-foreground">
                        Make sure contracts are signed before work starts.
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/dashboard/projects">Open contracts</Link>
                    </Button>
                  </div>
                </>
              )}
              {isFreelancer && (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">Upcoming deadlines</p>
                      <p className="text-xs text-muted-foreground">
                        Submit work for milestones due soon.
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/projects">View milestones</Link>
                    </Button>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">Respond to clients</p>
                      <p className="text-xs text-muted-foreground">
                        Keep your response rate high to get more matches.
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/dashboard/messages">Open inbox</Link>
                    </Button>
                  </div>
                </>
              )}
              {isAdmin && (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">Review disputes</p>
                      <p className="text-xs text-muted-foreground">
                        Resolve open disputes to keep projects moving.
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/moderator/disputes">View disputes</Link>
                    </Button>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">Monitor system health</p>
                      <p className="text-xs text-muted-foreground">
                        Check platform metrics and operational status.
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/dashboard/analytics">View analytics</Link>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Compact activity feed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Recent activity
              </CardTitle>
              <CardDescription className="text-xs">
                Matches, messages, payments, and more.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {recentActivity === undefined ? (
                <p className="text-xs text-muted-foreground">Loading activity…</p>
              ) : recentActivity.length === 0 ? (
                <p className="text-xs text-muted-foreground">No recent updates yet.</p>
              ) : (
                recentActivity.slice(0, 6).map((notification: Doc<"notifications">) => (
                  <div
                    key={notification._id}
                    className="flex items-start justify-between gap-3 rounded-md border border-border/40 bg-background/60 px-3 py-2"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium line-clamp-2">
                        {notification.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {notification.body}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Contextual help / trust card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">How 49GIG protects you</CardTitle>
              <CardDescription className="text-xs">
                Escrow, contracts, and disputes built into every project.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <ul className="space-y-1 list-disc list-inside">
                <li>Funds held in escrow until milestones are approved.</li>
                <li>Standardized digital contracts for every engagement.</li>
                <li>Dedicated dispute resolution if things go off track.</li>
              </ul>
              <Button asChild variant="ghost" size="sm" className="mt-1 px-0 text-xs">
                <Link href="/legal/payment-terms">Learn about payments &amp; terms</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
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
