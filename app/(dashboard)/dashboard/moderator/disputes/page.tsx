"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Clock, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Doc } from "@/convex/_generated/dataModel";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";

export default function ModeratorDisputesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<
    "open" | "under_review" | "resolved" | "escalated" | "closed" | undefined
  >(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const disputes = useQuery(
    api.disputes.queries.getPendingDisputes,
    isAuthenticated && user?._id ? { userId: user._id } : "skip"
  );

  const allDisputes = useQuery(
    api.disputes.queries.getDisputes,
    isAuthenticated && user?._id
      ? { userId: user._id, status: statusFilter }
      : "skip"
  );

  if (!isAuthenticated || !user) {
    return <DashboardEmptyState icon={AlertCircle} title="Please log in" />;
  }

  if (user.role !== "moderator" && user.role !== "admin") {
    return (
      <DashboardEmptyState
        icon={AlertCircle}
        title="Access restricted"
        description="Only moderators and admins can access this page."
        action={
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        }
      />
    );
  }

  if (disputes === undefined || allDisputes === undefined) {
    return <DashboardLoadingState label="Loading disputes..." />;
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      open: "destructive",
      under_review: "secondary",
      resolved: "default",
      escalated: "destructive",
      closed: "outline",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      milestone_quality: "Milestone Quality",
      payment: "Payment",
      communication: "Communication",
      freelancer_replacement: "Freelancer Replacement",
    };
    return labels[type] || type;
  };

  const totalPages = Math.max(1, Math.ceil(allDisputes.length / itemsPerPage));
  const paginatedDisputes = allDisputes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Dispute Management"
        description={`Review and resolve disputes as a ${user.role}.`}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {disputes?.filter((d: Doc<"disputes">) => d.status === "open").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {disputes?.filter((d: Doc<"disputes">) => d.status === "under_review").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allDisputes?.filter((d: Doc<"disputes">) => d.status === "resolved").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escalated</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allDisputes?.filter((d: Doc<"disputes">) => d.status === "escalated").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <DashboardFilterBar className="mb-0">
        <Select
          value={statusFilter || "all"}
          onValueChange={(value) => {
            setStatusFilter(value === "all" ? undefined : (value as any));
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </DashboardFilterBar>

      {/* Disputes Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {statusFilter ? `${statusFilter.replace("_", " ").toUpperCase()} Disputes` : "All Disputes"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allDisputes.length === 0 ? (
            <DashboardEmptyState icon={AlertCircle} title="No disputes found" className="border-0 bg-transparent py-8 shadow-none" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Initiator</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDisputes.map((dispute: Doc<"disputes">) => (
                  <TableRow key={dispute._id}>
                    <TableCell className="font-mono text-xs">
                      {dispute._id.slice(-8)}
                    </TableCell>
                    <TableCell>{getTypeLabel(dispute.type)}</TableCell>
                    <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                    <TableCell className="capitalize">
                      {dispute.initiatorRole}
                    </TableCell>
                    <TableCell>
                      {dispute.assignedModeratorId ? (
                        <Badge variant="outline">
                          <User className="mr-1 h-3 w-3" />
                          Assigned
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Unassigned</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      ${(dispute.lockedAmount / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/disputes/${dispute._id}`}>
                            View
                          </Link>
                        </Button>
                        {dispute.status === "open" && !dispute.assignedModeratorId && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              router.push(`/dashboard/disputes/${dispute._id}/assign`);
                            }}
                          >
                            Assign
                          </Button>
                        )}
                        {dispute.status !== "resolved" &&
                          dispute.status !== "closed" &&
                          (dispute.assignedModeratorId === user._id || user.role === "admin") && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                router.push(`/dashboard/disputes/${dispute._id}/resolve`);
                              }}
                            >
                              Resolve
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={allDisputes.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemName="disputes"
          />
        </CardContent>
      </Card>
    </div>
  );
}

