"use client";

import { useAuth } from "@/hooks/use-auth";
import { MetricCard } from "@/components/dashboard/metric-card";
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
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const isClient = user.role === "client";
  const isFreelancer = user.role === "freelancer";
  const isAdmin = user.role === "admin";

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={isClient ? "Active Projects" : isFreelancer ? "Active Projects" : "Total Projects"}
          value="0"
          description={isClient ? "Projects in progress" : isFreelancer ? "Projects you're working on" : "All platform projects"}
          icon={Briefcase}
          variant="primary"
          trend={isAdmin ? { value: 12, label: "vs last month", isPositive: true } : undefined}
        />

        <MetricCard
          title="Messages"
          value="0"
          description="Unread messages"
          icon={MessageSquare}
          variant="default"
        />

        <MetricCard
          title={isClient ? "Total Spent" : isFreelancer ? "Earnings" : "Revenue"}
          value="$0"
          description={isClient ? "This month" : isFreelancer ? "This month" : "Platform revenue"}
          icon={DollarSign}
          variant="success"
          trend={isAdmin ? { value: 8, label: "vs last month", isPositive: true } : undefined}
        />

        <MetricCard
          title={isClient ? "Pending Approvals" : isFreelancer ? "Pending Deliverables" : "System Health"}
          value="0"
          description={isClient ? "Awaiting your review" : isFreelancer ? "To submit" : "All systems operational"}
          icon={Clock}
          variant={isAdmin ? "success" : "warning"}
        />
      </div>

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

      {/* Recent Activity with Enhanced Design */}
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
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              No recent activity to display
            </p>
            <p className="text-xs text-muted-foreground/70">
              Your activity will appear here as you use the platform
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
