"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  FolderKanban,
  Users,
  TrendingUp,
  Plus,
  ChevronRight,
  Zap,
  CircleDot,
  Bug,
  Leaf,
  Gauge,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const PROJECT_ICONS = [Zap, CircleDot, Gauge, Leaf, Bug];
const STATUS_COLORS = {
  completed: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  in_progress: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  pending: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30",
};

type ProjectWithDue = {
  _id: string;
  intakeForm: { title: string };
  status: string;
  createdAt?: number;
};

export function ProjectAnalyticsCard({
  data,
  isLoading,
  isClient,
}: {
  data?: Array<{ day: string; count: number; pct?: number }>;
  isLoading?: boolean;
  isClient?: boolean;
}) {
  const chartData = data ?? [
    { day: "S", count: 2 },
    { day: "M", count: 5 },
    { day: "T", count: 8, pct: 74 },
    { day: "W", count: 6 },
    { day: "T", count: 4 },
    { day: "F", count: 7 },
    { day: "S", count: 3 },
  ];

  return (
    <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{isClient ? "Hire Analytics" : "Project Analytics"}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="h-[180px] flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }}
                  formatter={(value: number | undefined) => [`${value ?? 0} hires`, "Activity"]}
                />
                <Bar
                  dataKey="count"
                  fill="var(--primary)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ProjectListCard({
  projects,
  isLoading,
  onCreateHref,
  isClient,
}: {
  projects?: ProjectWithDue[];
  isLoading?: boolean;
  onCreateHref?: string;
  isClient?: boolean;
}) {
  const displayProjects = (projects ?? []).slice(0, 5);
  const title = "Hires";

  return (
    <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {onCreateHref && (
          <Button asChild variant="ghost" size="sm" className="h-7 rounded-lg text-xs">
            <Link href={onCreateHref}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              New
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : displayProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No hires yet</p>
        ) : (
          <ul className="space-y-2">
            {displayProjects.map((project, i) => {
              const Icon = PROJECT_ICONS[i % PROJECT_ICONS.length];
              const intake = (project as any).intakeForm;
              const dueDate = intake?.endDate
                ? format(intake.endDate, "MMM d, yyyy")
                : intake?.startDate
                  ? format(intake.startDate + 14 * 24 * 60 * 60 * 1000, "MMM d, yyyy")
                  : "—";
              return (
                <li key={project._id}>
                  <Link
                    href={`/dashboard/projects/${project._id}`}
                    className="flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {project.intakeForm?.title ?? "Untitled"}
                      </p>
                      <p className="text-xs text-muted-foreground">Due: {dueDate}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function TeamCollaborationCard({
  members,
  isLoading,
  onAddHref,
}: {
  members?: Array<{ name: string; task: string; status: "completed" | "in_progress" | "pending" }>;
  isLoading?: boolean;
  onAddHref?: string;
}) {
  const displayMembers = members ?? [];

  return (
    <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Team Collaboration</CardTitle>
        {onAddHref && (
          <Button asChild variant="ghost" size="sm" className="h-7 rounded-lg text-xs">
            <Link href={onAddHref}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Member
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : displayMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No team members</p>
        ) : (
          <ul className="space-y-3">
            {displayMembers.map((member, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  {member.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.task}</p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] shrink-0",
                    STATUS_COLORS[member.status as keyof typeof STATUS_COLORS] ?? "bg-muted"
                  )}
                >
                  {member.status.replace("_", " ")}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function ProjectProgressCard({
  completed,
  inProgress,
  pending,
  isLoading,
}: {
  completed: number;
  inProgress: number;
  pending: number;
  isLoading?: boolean;
}) {
  const total = completed + inProgress + pending;
  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const data = [
    { name: "Completed", value: completed, color: "var(--chart-1)" },
    { name: "In Progress", value: inProgress, color: "var(--chart-2)" },
    { name: "Pending", value: pending, color: "var(--muted-foreground)" },
  ].filter((d) => d.value > 0);

  return (
    <Card className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Project Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[180px] flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative h-32 w-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.length ? data : [{ name: "Empty", value: 1, color: "var(--muted)" }]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={36}
                      outerRadius={48}
                      paddingAngle={2}
                    >
                      {data.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{completedPct}%</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-(--chart-1)" />
                <span className="text-muted-foreground">Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-(--chart-2)" />
                <span className="text-muted-foreground">In Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                <span className="text-muted-foreground">Pending</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function EarningsWidget({
  amount,
  label,
  isLoading,
}: {
  amount: string | number;
  label?: string;
  isLoading?: boolean;
}) {
  return (
    <Card className="overflow-hidden rounded-xl border-0 bg-primary text-primary-foreground shadow-lg">
      <CardContent className="relative p-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-foreground/30 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-primary-foreground/20 blur-xl" />
        </div>
        <div className="relative">
          <p className="text-sm font-medium text-primary-foreground/85">{label ?? "Earnings this month"}</p>
          {isLoading ? (
            <div className="h-12 w-32 mt-2 rounded bg-primary-foreground/20 animate-pulse" />
          ) : (
            <p className="text-3xl font-bold mt-1">{amount}</p>
          )}
          <div className="flex gap-2 mt-4">
            <Button asChild size="sm" variant="secondary" className="rounded-lg bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 border-0">
              <Link href="/dashboard/transactions">
                <TrendingUp className="mr-1.5 h-4 w-4" />
                View
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
