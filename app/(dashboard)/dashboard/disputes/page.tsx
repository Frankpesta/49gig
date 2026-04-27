"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Doc, Id } from "@/convex/_generated/dataModel";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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

/** Row shape from `getDisputes` (document + list enrichments). */
type DisputeListRow = Doc<"disputes"> & {
  projectTitle?: string | null;
  initiatorName?: string | null;
  respondentName?: string | null;
};

export default function DisputesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const assignModerator = useMutation(api.disputes.mutations.assignModerator);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [assignDisputeId, setAssignDisputeId] = useState<Id<"disputes"> | null>(null);
  const [assignModeratorPick, setAssignModeratorPick] = useState<string>("");

  const isStaff =
    user?.role === "admin" || user?.role === "moderator";

  const disputes = useQuery(
    api.disputes.queries.getDisputes,
    isAuthenticated && user?._id
      ? { userId: user._id, status: statusFilter }
      : "skip"
  );

  const moderatorsForAssign = useQuery(
    api.users.queries.getAllUsersAdmin,
    isAuthenticated && user?.role === "admin" && user?._id
      ? { role: "moderator", status: "active", userId: user._id }
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

  type EnrichedDisputeRow = Doc<"disputes"> & {
    projectTitle?: string | null;
    initiatorName?: string | null;
    respondentName?: string | null;
  };
  const assignTargetDispute =
    assignDisputeId && disputes
      ? (disputes as EnrichedDisputeRow[]).find((d) => d._id === assignDisputeId)
      : null;

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
      {disputes.length === 0 ? (
        <DashboardEmptyState
          icon={Scale}
          title="No disputes found"
          iconTone="muted"
          className="py-10"
        />
      ) : (
        <DataTable>
              <DataTableHeader>
                <DataTableHead>Dispute</DataTableHead>
                <DataTableHead className="w-[120px]">Type</DataTableHead>
                <DataTableHead className="w-[110px]">Status</DataTableHead>
                <DataTableHead>Parties</DataTableHead>
                {isStaff && <DataTableHead className="w-[100px]">Assigned</DataTableHead>}
                <DataTableHead className="w-[100px]">Locked amount</DataTableHead>
                <DataTableHead className="w-[100px]">Date</DataTableHead>
                <DataTableHead className="w-[120px] text-right">Actions</DataTableHead>
              </DataTableHeader>
              <DataTableBody>
                {paginatedDisputes.map((dispute: DisputeListRow) => (
                  <DataTableRow key={dispute._id}>
                    <DataTableCell>
                      <div className="space-y-0.5">
                        {dispute.projectTitle && (
                          <p className="font-medium text-sm truncate max-w-[200px]">{dispute.projectTitle}</p>
                        )}
                        {dispute.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 max-w-[240px]">{dispute.description}</p>
                        )}
                        <p className="text-[10px] font-mono text-muted-foreground/60">#{dispute._id.slice(-8)}</p>
                      </div>
                    </DataTableCell>
                    <DataTableCell className="text-xs">{getTypeLabel(dispute.type)}</DataTableCell>
                    <DataTableCell>{getStatusBadge(dispute.status)}</DataTableCell>
                    <DataTableCell>
                      <div className="space-y-0.5 text-xs">
                        {dispute.initiatorName ? (
                          <div><span className="text-muted-foreground capitalize">{dispute.initiatorRole}: </span><span className="font-medium">{dispute.initiatorName}</span></div>
                        ) : (
                          <div className="text-muted-foreground capitalize">{dispute.initiatorRole}</div>
                        )}
                        {dispute.respondentName && (
                          <div><span className="text-muted-foreground">vs: </span><span className="font-medium">{dispute.respondentName}</span></div>
                        )}
                      </div>
                    </DataTableCell>
                    {isStaff && (
                      <DataTableCell>
                        {dispute.assignedModeratorId ? (
                          <Badge variant="outline" className="text-xs">
                            <User className="mr-1 h-3 w-3" />
                            Assigned
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Unassigned</Badge>
                        )}
                      </DataTableCell>
                    )}
                    <DataTableCell className="text-xs">
                      ${Number(dispute.lockedAmount ?? 0).toFixed(2)}
                    </DataTableCell>
                    <DataTableCell className="text-xs whitespace-nowrap">
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </DataTableCell>
                    <DataTableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="rounded-lg h-7 text-xs"
                        >
                          <Link href={`/dashboard/disputes/${dispute._id}`}>
                            View
                          </Link>
                        </Button>
                        {isStaff &&
                          dispute.status === "open" &&
                          !dispute.assignedModeratorId &&
                          (user.role === "admin" ? (
                            <Button
                              size="sm"
                              className="rounded-lg h-7 text-xs"
                              onClick={() => {
                                setAssignDisputeId(dispute._id);
                                const first = moderatorsForAssign?.[0]?._id;
                                setAssignModeratorPick(first ? String(first) : "");
                              }}
                            >
                              Assign…
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="rounded-lg h-7 text-xs"
                              onClick={async () => {
                                if (!user?._id) return;
                                try {
                                  await assignModerator({
                                    disputeId: dispute._id,
                                    moderatorId: user._id,
                                    userId: user._id,
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
                          ))}
                        {isStaff &&
                          dispute.status !== "resolved" &&
                          dispute.status !== "closed" &&
                          dispute.status !== "cancelled" &&
                          (dispute.assignedModeratorId === user._id ||
                            user.role === "admin") && (
                            <Button
                              size="sm"
                              variant="default"
                              className="rounded-lg h-7 text-xs"
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

      <Dialog
        open={!!assignDisputeId}
        onOpenChange={(open) => {
          if (!open) {
            setAssignDisputeId(null);
            setAssignModeratorPick("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign dispute</DialogTitle>
            <DialogDescription>
              Choose a moderator to own this case. They will receive an in-app notification.
              {assignTargetDispute?.projectTitle
                ? ` Hire: ${assignTargetDispute.projectTitle}`
                : null}
            </DialogDescription>
          </DialogHeader>
          {moderatorsForAssign === undefined ? (
            <p className="text-sm text-muted-foreground py-4">Loading moderators…</p>
          ) : moderatorsForAssign.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No active moderators found.</p>
          ) : (
            <div className="space-y-2 py-2">
              <Label htmlFor="assign-mod">Moderator</Label>
              <Select
                value={assignModeratorPick}
                onValueChange={setAssignModeratorPick}
              >
                <SelectTrigger id="assign-mod" className="w-full">
                  <SelectValue placeholder="Select a moderator" />
                </SelectTrigger>
                <SelectContent>
                  {moderatorsForAssign.map((m: { _id: string; name: string; email: string }) => (
                    <SelectItem key={m._id} value={m._id}>
                      {m.name} ({m.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAssignDisputeId(null);
                setAssignModeratorPick("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={
                !assignDisputeId ||
                !assignModeratorPick ||
                !user?._id ||
                moderatorsForAssign === undefined ||
                moderatorsForAssign.length === 0
              }
              onClick={async () => {
                if (!assignDisputeId || !assignModeratorPick || !user?._id) return;
                try {
                  await assignModerator({
                    disputeId: assignDisputeId,
                    moderatorId: assignModeratorPick as Id<"users">,
                    userId: user._id,
                  });
                  toast.success("Dispute assigned.");
                  setAssignDisputeId(null);
                  setAssignModeratorPick("");
                } catch (e) {
                  toast.error(getUserFriendlyError(e) || "Could not assign");
                }
              }}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
