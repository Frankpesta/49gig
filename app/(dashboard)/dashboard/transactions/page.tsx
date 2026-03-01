"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  DataTable,
  DataTableHeader,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableCell,
} from "@/components/dashboard/data-table";
import { TransactionCard } from "@/components/dashboard/transaction-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TablePagination } from "@/components/ui/table-pagination";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardStatusBadge } from "@/components/dashboard/dashboard-status-badge";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Search,
  DollarSign,
  CheckCircle2,
  LayoutGrid,
  List,
  Receipt,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

type Transaction = {
  _id: Id<"payments">;
  type: "pre_funding" | "milestone_release" | "refund" | "platform_fee" | "payout";
  amount: number;
  currency: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "refunded" | "cancelled";
  createdAt: number;
  netAmount?: number;
  project: {
    _id: Id<"projects">;
    title: string;
  } | null;
  milestone: {
    _id: Id<"milestones">;
    title: string;
  } | null;
};

type SortField = "date" | "amount" | "status" | "type";
type SortDirection = "asc" | "desc";

const TYPE_LABELS: Record<string, string> = {
  pre_funding: "Project Funding",
  milestone_release: "Payment Release",
  monthly_release: "Monthly Release",
  refund: "Refund",
  platform_fee: "Platform Fee",
  payout: "Payout",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pending", variant: "outline" },
  processing: { label: "Processing", variant: "secondary" },
  succeeded: { label: "Succeeded", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
  refunded: { label: "Refunded", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export default function TransactionsPage() {
  const mapStatusTone = (status: string) => {
    if (status === "succeeded") return "success";
    if (status === "failed" || status === "cancelled") return "danger";
    if (status === "processing" || status === "pending") return "warning";
    return "neutral";
  };

  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>(
    searchParams.get("type") || "all"
  );
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || "all"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // View mode: table | cards
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Fetch transactions
  const transactions = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api as any)["transactions/queries"].getTransactions,
    user?._id
      ? {
          userId: user._id,
          ...(typeFilter !== "all" ? { type: typeFilter as any } : {}),
          ...(statusFilter !== "all" ? { status: statusFilter as any } : {}),
        }
      : "skip"
  );

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    if (!transactions) return [];

    let filtered = [...transactions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t: Transaction) =>
          t.project?.title.toLowerCase().includes(query) ||
          t.milestone?.title.toLowerCase().includes(query) ||
          t._id.toLowerCase().includes(query) ||
          TYPE_LABELS[t.type]?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a: Transaction, b: Transaction) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case "date":
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        case "amount":
          aValue = a.amount;
          bValue = b.amount;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "type":
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactions, searchQuery, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredAndSortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const stats = useMemo(() => {
    if (!transactions) return null;

    const succeeded = transactions.filter((t: Transaction) => t.status === "succeeded");
    const isClient = user?.role === "client";
    const isFreelancer = user?.role === "freelancer";

    return {
      total: transactions.length,
      succeeded: succeeded.length,
      totalAmount: succeeded.reduce((sum: number, t: Transaction) => sum + t.amount, 0),
      totalReceived: isFreelancer
        ? succeeded
            .filter((t: Transaction) => t.type === "milestone_release" || t.type === "monthly_release" || t.type === "payout")
            .reduce((sum: number, t: Transaction) => sum + (t.netAmount || 0), 0)
        : 0,
      totalPaid: isClient
        ? succeeded
            .filter((t: Transaction) => t.type === "pre_funding")
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
        : 0,
    };
  }, [transactions, user?.role]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header */}
      <DashboardPageHeader
        title="Transactions"
        description="View, filter, and inspect all payment transactions."
        icon={Receipt}
      />

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.succeeded}</div>
            </CardContent>
          </Card>
          {user.role === "client" && (
            <Card className="rounded-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.totalPaid.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          )}
          {user.role === "freelancer" && (
            <Card className="rounded-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Received</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.totalReceived.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalAmount.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <DashboardFilterBar>
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by project or ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8 rounded-lg"
                />
              </div>
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              }}
            >
            <SelectTrigger className="w-full sm:w-[180px] rounded-lg">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
            <SelectTrigger className="w-full sm:w-[180px] rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
      </DashboardFilterBar>

      {/* Transactions List */}
      <Card className="rounded-xl overflow-hidden">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                {filteredAndSortedTransactions.length} transaction
                {filteredAndSortedTransactions.length !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border/60 p-1 bg-muted/30">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 rounded-md"
                onClick={() => setViewMode("table")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 rounded-md"
                onClick={() => setViewMode("cards")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactions === undefined ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : paginatedTransactions.length === 0 ? (
            <DashboardEmptyState
              icon={Receipt}
              title="No transactions found"
              iconTone="muted"
              description={
                searchQuery || typeFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters."
                  : "You do not have any transactions yet."
              }
              className="border-0 bg-transparent py-8 shadow-none"
            />
          ) : viewMode === "cards" ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedTransactions.map((transaction: Transaction) => (
                  <TransactionCard key={transaction._id} transaction={transaction} />
                ))}
              </div>
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredAndSortedTransactions.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                itemName="transactions"
              />
            </div>
          ) : (
            <div className="space-y-6">
              <DataTable>
                <DataTableHeader>
                  <DataTableHead
                    sortable
                    onSort={() => handleSort("date")}
                  >
                    <span className="inline-flex items-center">
                      Date
                      <SortIcon field="date" />
                    </span>
                  </DataTableHead>
                  <DataTableHead>Type</DataTableHead>
                  <DataTableHead>Project</DataTableHead>
                  <DataTableHead
                    sortable
                    onSort={() => handleSort("amount")}
                  >
                    <span className="inline-flex items-center">
                      Amount
                      <SortIcon field="amount" />
                    </span>
                  </DataTableHead>
                  <DataTableHead
                    sortable
                    onSort={() => handleSort("status")}
                  >
                    <span className="inline-flex items-center">
                      Status
                      <SortIcon field="status" />
                    </span>
                  </DataTableHead>
                  <DataTableHead className="text-right">Actions</DataTableHead>
                </DataTableHeader>
                <DataTableBody>
                  {paginatedTransactions.map((transaction: Transaction) => {
                    const statusConfig = STATUS_CONFIG[transaction.status] || STATUS_CONFIG.pending;
                    return (
                      <DataTableRow
                        key={transaction._id}
                        onClick={() => router.push(`/dashboard/transactions/${transaction._id}`)}
                      >
                        <DataTableCell>
                          <div>
                            {new Date(transaction.createdAt).toLocaleDateString()}
                            <div className="text-xs text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </DataTableCell>
                        <DataTableCell>
                          <Badge variant="outline">
                            {TYPE_LABELS[transaction.type] || transaction.type}
                          </Badge>
                        </DataTableCell>
                        <DataTableCell>
                          {transaction.project ? (
                            <Link
                              href={`/dashboard/projects/${transaction.project._id}`}
                              className="hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {transaction.project.title}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </DataTableCell>
                        <DataTableCell>
                          <div className="font-semibold">
                            ${transaction.amount.toLocaleString()} {transaction.currency.toUpperCase()}
                          </div>
                          {transaction.type === "milestone_release" || transaction.type === "payout" ? (
                            <div className="text-xs text-muted-foreground">
                              Net: ${transaction.netAmount?.toLocaleString() || transaction.amount.toLocaleString()}
                            </div>
                          ) : null}
                        </DataTableCell>
                        <DataTableCell>
                          <DashboardStatusBadge label={statusConfig.label} tone={mapStatusTone(transaction.status)} />
                        </DataTableCell>
                        <DataTableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild className="rounded-lg">
                            <Link href={`/dashboard/transactions/${transaction._id}`} onClick={(e) => e.stopPropagation()}>
                              View
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </DataTableCell>
                      </DataTableRow>
                    );
                  })}
                </DataTableBody>
              </DataTable>

              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredAndSortedTransactions.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                itemName="transactions"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

