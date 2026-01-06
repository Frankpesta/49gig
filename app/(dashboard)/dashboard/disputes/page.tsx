"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default function DisputesPage() {
  const { user, isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState<
    "open" | "under_review" | "resolved" | "escalated" | "closed" | undefined
  >(undefined);

  const disputes = useQuery(
    api.disputes.queries.getDisputes,
    isAuthenticated && user?._id
      ? { userId: user._id, status: statusFilter }
      : "skip"
  );

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  if (disputes === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
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

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Disputes</h1>
          <p className="text-muted-foreground mt-1">
            Manage and resolve project disputes
          </p>
        </div>
        {(user.role === "client" || user.role === "freelancer") && (
          <Button asChild>
            <Link href="/dashboard/disputes/new">
              <Plus className="mr-2 h-4 w-4" />
              New Dispute
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={statusFilter === undefined ? "default" : "outline"}
          onClick={() => setStatusFilter(undefined)}
        >
          All
        </Button>
        <Button
          variant={statusFilter === "open" ? "default" : "outline"}
          onClick={() => setStatusFilter("open")}
        >
          Open
        </Button>
        <Button
          variant={statusFilter === "under_review" ? "default" : "outline"}
          onClick={() => setStatusFilter("under_review")}
        >
          Under Review
        </Button>
        <Button
          variant={statusFilter === "resolved" ? "default" : "outline"}
          onClick={() => setStatusFilter("resolved")}
        >
          Resolved
        </Button>
      </div>

      {/* Disputes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Dispute List</CardTitle>
        </CardHeader>
        <CardContent>
          {disputes.length === 0 ? (
            <div className="py-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No disputes found</p>
            </div>
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
                {disputes?.map((dispute: Doc<"disputes">) => (
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
        </CardContent>
      </Card>
    </div>
  );
}

