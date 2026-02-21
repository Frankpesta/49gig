"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Doc } from "@/convex/_generated/dataModel";
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
import { AlertCircle, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";

export default function DisputesPage() {
  const { user, isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState<
    "open" | "under_review" | "resolved" | "escalated" | "closed" | undefined
  >(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const disputes = useQuery(
    api.disputes.queries.getDisputes,
    isAuthenticated && user?._id
      ? { userId: user._id, status: statusFilter }
      : "skip"
  );

  if (!isAuthenticated || !user) {
    return <DashboardEmptyState icon={AlertCircle} title="Please log in" />;
  }

  if (disputes === undefined) {
    return <DashboardLoadingState label="Loading disputes..." />;
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
    return <DashboardStatusBadge label={status.replace("_", " ").toUpperCase()} tone={tone as any} />;
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

  const totalPages = Math.max(1, Math.ceil(disputes.length / itemsPerPage));
  const paginatedDisputes = disputes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Disputes"
        description="Manage and resolve project disputes."
        actions={
          user.role === "client" || user.role === "freelancer" ? (
            <Button asChild>
              <Link href="/dashboard/disputes/new">
                <Plus className="mr-2 h-4 w-4" />
                New Dispute
              </Link>
            </Button>
          ) : null
        }
      />

      {/* Filters */}
      <DashboardFilterBar className="mb-0">
        <Button
          variant={statusFilter === undefined ? "default" : "outline"}
          onClick={() => {
            setStatusFilter(undefined);
            setCurrentPage(1);
          }}
        >
          All
        </Button>
        <Button
          variant={statusFilter === "open" ? "default" : "outline"}
          onClick={() => {
            setStatusFilter("open");
            setCurrentPage(1);
          }}
        >
          Open
        </Button>
        <Button
          variant={statusFilter === "under_review" ? "default" : "outline"}
          onClick={() => {
            setStatusFilter("under_review");
            setCurrentPage(1);
          }}
        >
          Under Review
        </Button>
        <Button
          variant={statusFilter === "resolved" ? "default" : "outline"}
          onClick={() => {
            setStatusFilter("resolved");
            setCurrentPage(1);
          }}
        >
          Resolved
        </Button>
      </DashboardFilterBar>

      {/* Disputes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Dispute List</CardTitle>
        </CardHeader>
        <CardContent>
          {disputes.length === 0 ? (
            <DashboardEmptyState icon={AlertCircle} title="No disputes found" className="border-0 bg-transparent py-8 shadow-none" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Initiator</TableHead>
                  <TableHead>Amount Locked</TableHead>
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
                    <TableCell>
                      <Link
                        href={`/dashboard/projects/${dispute.projectId}`}
                        className="text-primary hover:underline"
                      >
                        View Project
                      </Link>
                    </TableCell>
                    <TableCell>{getTypeLabel(dispute.type)}</TableCell>
                    <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                    <TableCell>
                      {dispute.initiatorRole === "client" ? "Client" : "Freelancer"}
                    </TableCell>
                    <TableCell>
                      ${(dispute.lockedAmount / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/disputes/${dispute._id}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

