"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2, FileText, Search, Shield, CreditCard, AlertCircle, Settings, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Doc, Id } from "@/convex/_generated/dataModel";

// Type for enriched audit log with actor information
type EnrichedAuditLog = Doc<"auditLogs"> & {
  actor: {
    _id: Id<"users">;
    name: string;
    email: string;
    role: string;
  } | null;
};

const ACTION_TYPE_ICONS: Record<string, any> = {
  auth: User,
  payment: CreditCard,
  dispute: AlertCircle,
  admin: Shield,
  system: Settings,
};

export default function AuditLogsPage() {
  const { user, isAuthenticated } = useAuth();
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [actionTypeFilter, searchTerm]);

  const logs = useQuery(
    (api as any)["audit/queries"].getAuditLogs,
    isAuthenticated && user?._id && user.role === "admin"
      ? {
          userId: user._id,
          actionType:
            actionTypeFilter !== "all" ? (actionTypeFilter as any) : undefined,
          limit: 200,
        }
      : "skip"
  );

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Access denied. Admin role required.</p>
      </div>
    );
  }

  if (logs === undefined) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredLogs = logs?.filter((log: EnrichedAuditLog) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetType?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">
          View system audit trail and activity logs.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by action, actor, or target..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="auth">Auth</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="dispute">Dispute</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Logs ({filteredLogs.length})
          </CardTitle>
          <CardDescription>
            Complete audit trail of all system actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log: EnrichedAuditLog) => {
                    const Icon = ACTION_TYPE_ICONS[log.actionType] || FileText;
                    return (
                      <TableRow key={log._id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(log.createdAt), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{log.action}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {log.actionType}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-normal max-w-[220px] break-words">
                          <div className="space-y-1">
                            <div className="font-medium">{log.actor?.name || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">
                              {log.actor?.email || "—"}
                            </div>
                            <Badge variant="secondary" className="text-xs capitalize">
                              {log.actorRole}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-normal max-w-[220px] break-words">
                          {log.targetType && log.targetId ? (
                            <div className="space-y-1">
                              <Badge variant="outline" className="text-xs">
                                {log.targetType}
                              </Badge>
                              <div className="text-xs text-muted-foreground font-mono">
                                {log.targetId.substring(0, 8)}...
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-normal max-w-[280px] break-words">
                          {log.details ? (
                            <details className="cursor-pointer">
                              <summary className="text-sm text-muted-foreground hover:text-foreground">
                                View details
                              </summary>
                              <pre className="mt-2 text-xs bg-muted p-2 rounded max-w-[320px] overflow-auto whitespace-pre-wrap break-words">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

