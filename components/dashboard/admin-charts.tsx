"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AdminChartData = {
  usersByMonth: Array<{
    month: string;
    total: number;
    clients: number;
    freelancers: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    volume: number;
  }>;
  projectsByMonth: Array<{
    month: string;
    created: number;
  }>;
  projectStatusByMonth: Array<{
    month: string;
    draft: number;
    pending_funding: number;
    funded: number;
    matching: number;
    matched: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    disputed: number;
  }>;
  projectStatus: Array<{
    name: string;
    value: number;
  }>;
  disputeStatus: Array<{
    name: string;
    value: number;
  }>;
};

const statusColors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9"];

const rangeOptions = [
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "Last 12 months", value: "365" },
];

export function AdminCharts({
  data,
  timeRangeDays,
  onTimeRangeChange,
}: {
  data: AdminChartData;
  timeRangeDays: number;
  onTimeRangeChange: (value: number) => void;
}) {
  const formatCurrency = (value: number) =>
    `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const projectStatusTotal = useMemo(
    () => data.projectStatus.reduce((sum, item) => sum + item.value, 0),
    [data.projectStatus]
  );
  const disputeStatusTotal = useMemo(
    () => data.disputeStatus.reduce((sum, item) => sum + item.value, 0),
    [data.disputeStatus]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Charts & trends</h3>
          <p className="text-sm text-muted-foreground">
            Filter time ranges to drill down.
          </p>
        </div>
        <Select value={String(timeRangeDays)} onValueChange={(value) => onTimeRangeChange(Number(value))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {rangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle>User growth</CardTitle>
          <CardDescription>New accounts over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] pt-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.usersByMonth}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} />
              <Line type="monotone" dataKey="clients" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="freelancers" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle>Revenue trend</CardTitle>
          <CardDescription>Platform fees collected per month</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] pt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value) =>
                  formatCurrency(typeof value === "number" ? value : 0)
                }
              />
              <Bar dataKey="revenue" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle>Project velocity</CardTitle>
          <CardDescription>Projects created per month</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] pt-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.projectsByMonth}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="created" stroke="#0ea5e9" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle>Project status over time</CardTitle>
          <CardDescription>Stacked view of status volume</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] pt-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.projectStatusByMonth}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="draft" stackId="1" fill="#94a3b8" stroke="#94a3b8" />
              <Area type="monotone" dataKey="pending_funding" stackId="1" fill="#f59e0b" stroke="#f59e0b" />
              <Area type="monotone" dataKey="funded" stackId="1" fill="#22c55e" stroke="#22c55e" />
              <Area type="monotone" dataKey="matching" stackId="1" fill="#0ea5e9" stroke="#0ea5e9" />
              <Area type="monotone" dataKey="matched" stackId="1" fill="#6366f1" stroke="#6366f1" />
              <Area type="monotone" dataKey="in_progress" stackId="1" fill="#14b8a6" stroke="#14b8a6" />
              <Area type="monotone" dataKey="completed" stackId="1" fill="#22c55e" stroke="#22c55e" />
              <Area type="monotone" dataKey="cancelled" stackId="1" fill="#ef4444" stroke="#ef4444" />
              <Area type="monotone" dataKey="disputed" stackId="1" fill="#f97316" stroke="#f97316" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle>Operational health</CardTitle>
          <CardDescription>Distribution of project + dispute states</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Project status</span>
              <Badge variant="secondary">{projectStatusTotal}</Badge>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.projectStatus}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {data.projectStatus.map((entry, index) => (
                      <Cell key={entry.name} fill={statusColors[index % statusColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Disputes</span>
              <Badge variant="secondary">{disputeStatusTotal}</Badge>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.disputeStatus}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {data.disputeStatus.map((entry, index) => (
                      <Cell key={entry.name} fill={statusColors[(index + 2) % statusColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
