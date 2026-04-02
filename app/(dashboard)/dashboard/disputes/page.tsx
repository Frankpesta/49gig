"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  DataTableHeader,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableCell,
} from "@/components/dashboard/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Scale,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";
import { useRouter } from "next/navigation";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";

type StatusFilter =
  | "open"
  | "under_review"
  | "resolved"
  | "escalated"
  | "closed"
  | undefined;

export default function DisputesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const assignModerator = useMutation(api.disputes.mutations.assignModerator);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const isStaff =
    user?.role === "admin" || user?.role === "moderator";

  const disputes = useQuery(
    api.disputes.queries.getDisputes,
    isAuthenticated && user?._id
      ? { userId: user._id, status: statusFilter }
      : "skip"
  );

  // Staff only: counts of open/under_review for stats cards
  const pendingDisputes = useQuery(
    api.disputes.queries.getPendingDisputes,
    isAuthenticated && isStaff && user?._id ? { userId: user._id } : "skip"
  );

  if (!isAuthenticated || !user) {
    return <DashboardEmptyState icon={Scale} title="Please log in" iconTone="muted" />;
  }

  if (disputes === undefined) {
    return <DashboardLoadingState label="Loading disputes" />;
  }

  const getStatusBadge = (status: string) => {
    const tone =
      status === "resolved"
        ? "success"
        : status === "open" || status === "escalated"
          ? "danger"
          : status === "under_review"
            ? "warning"
            : "neutral";
    return (
      <DashboardStatusBadge
        label={status.replace(/_/g, " ").toUpperCase()}
        tone={tone as "success" | "danger" | "warning" | "neutral"}
      />
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      milestone_quality: "Deliverable Quality",
      payment: "Payment",
      communication: "Communication",
      freelancer_replacement: "Replacement",
      client_deliverable_quality: "Deliverable Quality",
      client_timeline_scope: "Timeline / Scope",
      client_payment_billing: "Payment / Billing",
      client_communication_conduct: "Communication",
      client_request_replacement: "Request Replacement",
      freelancer_payment_issue: "Payment Issue",
      freelancer_scope_requirements: "Scope / Requirements",
      freelancer_communication: "Communication",
      freelancer_platform_policy: "Platform / Policy",
    };
    return labels[type] || type;
  };

  const totalPages = Math.max(1, Math.ceil(disputes.length / itemsPerPage));
  const paginatedDisputes = disputes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openCount = (pendingDisputes ?? disputes).filter(
    (d: Doc<"disputes">) => d.status === "open"
  ).length;
  const underReviewCount = (pendingDisputes ?? disputes).filter(
    (d: Doc<"disputes">) => d.status === "under_review"
  ).length;
  const resolvedCount = disputes.filter(
    (d: Doc<"disputes">) => d.status === "resolved"
  ).length;
  const escalatedCount = disputes.filter(
    (d: Doc<"disputes">) => d.status === "escalated"
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Disputes"
        description={
          isStaff
            ? `Review, assign, and resolve disputes across all hires.`
            : user.role === "client"
              ? "Manage disputes on your hires."
              : "Manage disputes on your projects."
        }
        icon={Scale}
        actions={
          !isStaff ? (
            <Button asChild className="rounded-xl">
              <Link href="/dashboard/disputes/new">
                <Plus className="mr-2 h-4 w-4" />
                New Dispute
              </Link>
            </Button>
          ) : null
        }
      />

      {/* Stats cards — staff only */}
      {isStaff && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <Card className="rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openCount}</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Under Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{underReviewCount}</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolvedCount}</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escalated</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{escalatedCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <DashboardFilterBar className="mb-0">
        {isStaff ? (
          <Select
            value={statusFilter ?? "all"}
            onValueChange={(value) => {
              setStatusFilter(value === "all" ? undefined : (value as StatusFilter));
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
        ) : (
          <>
            {(["all", "open", "under_review", "resolved"] as const).map((s) => (
              <Button
                key={s}
                variant={(statusFilter ?? "all") === s ? "default" : "outline"}
                className="rounded-lg"
                onClick={() => {
                  setStatusFilter(s === "all" ? undefined : s);
                  setCurrentPage(1);
                }}
              >
                {s === "all" ? "All" : s.replace("_", " ").charAt(0).toUpperCase() + s.replace("_", " ").slice(1)}
              </Button>
            ))}
          </>
        )}
      </DashboardFilterBar>

      {/* Table */}
      <Card className="rounded-xl overflow-hidden">
        <CardHeader>
          <CardTitle>
            {statusFilter
              ? statusFilter.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) + " Disputes"
              : "All Disputes"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {disputes.length === 0 ? (
            <DashboardEmptyState
              icon={Scale}
              title="No disputes found"
              iconTone="muted"
              className="border-0 bg-transparent py-8 shadow-none"
            />
          ) : (
            <DataTable>
              <DataTableHeader>
                <DataTableHead>ID</DataTableHead>
                {!isStaff && (
                  <DataTableHead>
                    {user.role === "client" ? "Hire" : "Project"}
                  </DataTableHead>
                )}
                <DataTableHead>Type</DataTableHead>
                <DataTableHead>Status</DataTableHead>
                <DataTableHead>Initiator</DataTableHead>
                {isStaff && <DataTableHead>Assigned</DataTableHead>}
                <DataTableHead>Locked</DataTableHead>
                <DataTableHead>Date</DataTableHead>
                <DataTableHead className="text-right">Actions</DataTableHead>
              </DataTableHeader>
              <DataTableBody>
                {paginatedDisputes.map((dispute: Doc<"disputes">) => (
                  <DataTableRow key={dispute._id}>
                    <DataTableCell className="font-mono text-xs">
                      {dispute._id.slice(-8)}
                    </DataTableCell>
                    {!isStaff && (
                      <DataTableCell>
                        <Link
                          href={`/dashboard/projects/${dispute.projectId}`}
                          className="text-primary hover:underline"
                        >
                          View {user.role === "client" ? "hire" : "project"}
                        </Link>
                      </DataTableCell>
                    )}
                    <DataTableCell>{getTypeLabel(dispute.type)}</DataTableCell>
                    <DataTableCell>{getStatusBadge(dispute.status)}</DataTableCell>
                    <DataTableCell className="capitalize">
                      {dispute.initiatorRole}
                    </DataTableCell>
                    {isStaff && (
                      <DataTableCell>
                        {dispute.assignedModeratorId ? (
                          <Badge variant="outline">
                            <User className="mr-1 h-3 w-3" />
                            Assigned
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Unassigned</Badge>
                        )}
                      </DataTableCell>
                    )}
                    <DataTableCell>
                      ${Number(dispute.lockedAmount ?? 0).toFixed(2)}
                    </DataTableCell>
                    <DataTableCell>
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </DataTableCell>
                    <DataTableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="rounded-lg"
                        >
                          <Link href={`/dashboard/disputes/${dispute._id}`}>
                            View
                          </Link>
                        </Button>
                        {isStaff &&
                          dispute.status === "open" &&
                          !dispute.assignedModeratorId && (
                            <Button
                              size="sm"
                              className="rounded-lg"
                              onClick={async () => {
                                if (!user?._id) return;
                                try {
                                  await assignModerator({
                                    disputeId: dispute._id,
                                    moderatorId: user._id,
                                  });
                                  toast.success("Dispute assigned to you.");
                                } catch (e) {
                                  toast.error(
                                    getUserFriendlyError(e) || "Could not assign"
                                  );
                                }
                              }}
                            >
                              Assign to me
                            </Button>
                          )}
                        {isStaff &&
                          dispute.status !== "resolved" &&
                          dispute.status !== "closed" &&
                          (dispute.assignedModeratorId === user._id ||
                            user.role === "admin") && (
                            <Button
                              size="sm"
                              variant="default"
                              className="rounded-lg"
                              onClick={() =>
                                router.push(
                                  `/dashboard/disputes/${dispute._id}/resolve`
                                )
                              }
                            >
                              Resolve
                            </Button>
                          )}
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          )}
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={disputes.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemName="disputes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
