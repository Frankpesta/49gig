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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Wallet,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

type LedgerKind = "payment" | "wallet" | "withdrawal_request";

type WalletFunding = {
  fundingGrossAmount: number;
  walletAppliedDollars: number;
  gatewayChargedDollars: number;
  summary: string;
  isFullWalletFunding: boolean;
  isPartialWalletFunding: boolean;
  isGatewayOnly: boolean;
};

type Transaction = {
  ledgerKind?: LedgerKind;
  listingType?: string;
  walletDescription?: string;
  walletTxnType?: string;
  walletCategory?: string | null;
  signedAmount?: number;
  _id: string;
  type: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "refunded" | "cancelled";
  createdAt: number;
  netAmount?: number;
  fundingGrossAmount?: number;
  clientWalletCreditApplied?: number;
  project: {
    _id: Id<"projects">;
    title: string;
  } | null;
  monthlyCycle: {
    _id: Id<"monthlyBillingCycles">;
    monthIndex: number;
  } | null;
  walletFunding?: WalletFunding | null;
};

const WALLET_ACTIVITY_FILTER = "__wallet_activity__";

function displayTypeLabel(t: Transaction): string {
  const kind = t.ledgerKind ?? "payment";
  if (kind === "payment") {
    return TYPE_LABELS[t.type] || t.type;
  }
  if (kind === "withdrawal_request") {
    if (t.listingType === "withdrawal_bank") return "Bank withdrawal (requested)";
    return "Referral cash-out (requested)";
  }
  if (t.walletDescription?.trim()) {
    return t.walletDescription.trim();
  }
  const wc = [t.walletTxnType, t.walletCategory].filter(Boolean).join(" · ");
  return wc ? `Wallet — ${wc}` : "Wallet";
}

function transactionDetailHref(t: Transaction): string | null {
  const kind = t.ledgerKind ?? "payment";
  if (kind === "payment") {
    return `/dashboard/transactions/${t._id}`;
  }
  if (kind === "wallet") {
    return `/dashboard/wallet?highlight=${encodeURIComponent(t._id)}`;
  }
  if (kind === "withdrawal_request") {
    return "/dashboard/wallet";
  }
  return null;
}

function comparableTransactionAmount(t: Transaction): number {
  if (t.ledgerKind === "withdrawal_request") return Math.abs(t.amount ?? 0);
  if (t.ledgerKind === "wallet" && typeof t.signedAmount === "number") {
    return Math.abs(t.signedAmount);
  }
  if (t.walletFunding) return t.walletFunding.fundingGrossAmount;
  if ((t.type === "pre_funding" || t.type === "top_up") && t.fundingGrossAmount != null) {
    return t.fundingGrossAmount;
  }
  if (t.type === "pre_funding" || t.type === "top_up") {
    return (t.amount ?? 0) + (t.clientWalletCreditApplied ?? 0);
  }
  return t.amount ?? 0;
}

function fmtMoney(n: number, currency: string) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency.toUpperCase()}`;
}

/** Short label for how hire funding was split (avoid long `summary` strings in dense tables). */
function walletFundingModeLabel(wf: WalletFunding): string {
  if (wf.isFullWalletFunding) return "Wallet only";
  if (wf.isPartialWalletFunding) return "Wallet + checkout";
  return "Checkout only";
}

type SortField = "date" | "amount" | "status" | "type";
type SortDirection = "asc" | "desc";

function TransactionSortIcon({
  field,
  sortField,
  sortDirection,
}: {
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
}) {
  if (sortField !== field) {
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  }
  return sortDirection === "asc" ? (
    <ArrowUp className="ml-2 h-4 w-4" />
  ) : (
    <ArrowDown className="ml-2 h-4 w-4" />
  );
}

/** Convex nested module `convex/transactions/queries.ts` (see `api.d.ts`). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transactionsQueries = (api as any)["transactions/queries"];

const TYPE_LABELS: Record<string, string> = {
  pre_funding: "Project Funding",
  top_up: "Add payment (months)",
  milestone_release: "Payment Release",
  monthly_release: "Monthly Release",
  refund: "Refund",
  platform_fee: "Included services",
  payout: "Payout",
  withdrawal_bank: "Bank withdrawal (requested)",
  withdrawal_referral_cashout: "Referral cash-out (requested)",
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
    transactionsQueries.getTransactions,
    user?._id ? { userId: user._id } : "skip"
  );

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    if (!transactions) return [];

    let filtered: Transaction[] = (transactions as Transaction[]).map((t) => ({
      ...t,
      ledgerKind: (t.ledgerKind ?? "payment") as LedgerKind,
    }));

    // Type filter (client-side — includes ledger + payment rows)
    if (typeFilter !== "all") {
      filtered = filtered.filter((t: Transaction) => {
        if (typeFilter === WALLET_ACTIVITY_FILTER) {
          return t.ledgerKind === "wallet" || t.ledgerKind === "withdrawal_request";
        }
        return t.ledgerKind === "payment" && t.type === typeFilter;
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((t: Transaction) => t.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t: Transaction) =>
          (t.project?.title?.toLowerCase().includes(query) ?? false) ||
          (t.monthlyCycle && `month ${t.monthlyCycle.monthIndex}`.includes(query)) ||
          t._id.toLowerCase().includes(query) ||
          displayTypeLabel(t).toLowerCase().includes(query) ||
          TYPE_LABELS[t.type]?.toLowerCase().includes(query) ||
          (t.walletFunding?.summary && t.walletFunding.summary.toLowerCase().includes(query)) ||
          (t.walletFunding &&
            walletFundingModeLabel(t.walletFunding).toLowerCase().includes(query)) ||
          (t.walletDescription && t.walletDescription.toLowerCase().includes(query))
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
          aValue = comparableTransactionAmount(a);
          bValue = comparableTransactionAmount(b);
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "type":
          aValue = displayTypeLabel(a).toLowerCase();
          bValue = displayTypeLabel(b).toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactions, searchQuery, sortField, sortDirection, typeFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredAndSortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const stats = useMemo(() => {
    if (!transactions) return null;

    const payOnly = transactions.filter(
      (t: Transaction) => (t.ledgerKind ?? "payment") === "payment"
    );
    const succeeded = payOnly.filter((t: Transaction) => t.status === "succeeded");
    const isClient = user?.role === "client";
    const isFreelancer = user?.role === "freelancer";

    return {
      total: transactions.length,
      succeeded: succeeded.length,
      totalAmount: succeeded.reduce(
        (sum: number, t: Transaction) => sum + comparableTransactionAmount(t),
        0
      ),
      totalReceived: isFreelancer
        ? succeeded
            .filter((t: Transaction) => t.type === "milestone_release" || t.type === "monthly_release" || t.type === "payout")
            .reduce((sum: number, t: Transaction) => sum + (t.netAmount || 0), 0)
        : 0,
      totalPaid: isClient
        ? succeeded
            .filter((t: Transaction) => t.type === "pre_funding" || t.type === "top_up")
            .reduce((sum: number, t: Transaction) => sum + comparableTransactionAmount(t), 0)
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

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header */}
      <DashboardPageHeader
        title="Transactions"
        description="Unified ledger: hires and checkout (payments), in-platform wallet movements, and open withdrawal requests—scoped to what your role should see."
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
                <SelectItem value={WALLET_ACTIVITY_FILTER}>Wallet & withdrawal requests</SelectItem>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5">
            <span className="font-semibold text-foreground">{filteredAndSortedTransactions.length}</span> transaction{filteredAndSortedTransactions.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border/60 p-1 bg-muted/30 self-start sm:self-auto">
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
      <div>
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
                  <TransactionCard
                    key={`${transaction.ledgerKind ?? "payment"}-${transaction._id}`}
                    transaction={transaction}
                  />
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
                      <TransactionSortIcon field="date" sortField={sortField} sortDirection={sortDirection} />
                    </span>
                  </DataTableHead>
                  <DataTableHead>Type</DataTableHead>
                  <DataTableHead>Project</DataTableHead>
                  <DataTableHead className="min-w-[10rem] w-[11rem] max-w-[13rem] sm:min-w-[12rem] sm:w-[13rem]">
                    <span className="inline-flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      Hire funding
                    </span>
                  </DataTableHead>
                  <DataTableHead
                    sortable
                    onSort={() => handleSort("amount")}
                  >
                    <span className="inline-flex items-center">
                      Amount
                      <TransactionSortIcon field="amount" sortField={sortField} sortDirection={sortDirection} />
                    </span>
                  </DataTableHead>
                  <DataTableHead
                    sortable
                    onSort={() => handleSort("status")}
                  >
                    <span className="inline-flex items-center">
                      Status
                      <TransactionSortIcon field="status" sortField={sortField} sortDirection={sortDirection} />
                    </span>
                  </DataTableHead>
                  <DataTableHead className="text-right">Actions</DataTableHead>
                </DataTableHeader>
                <DataTableBody>
                  {paginatedTransactions.map((transaction: Transaction) => {
                    const statusConfig =
                      STATUS_CONFIG[transaction.status] || STATUS_CONFIG.pending;
                    const kind = transaction.ledgerKind ?? "payment";
                    const detailHref = transactionDetailHref(transaction);
                    return (
                      <DataTableRow
                        key={`${kind}-${transaction._id}`}
                        className={
                          detailHref ? "cursor-pointer" : "cursor-default opacity-95"
                        }
                        onClick={() => {
                          if (detailHref) router.push(detailHref);
                        }}
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
                          <Badge variant="outline" className="max-w-[260px] text-left whitespace-normal leading-snug">
                            {displayTypeLabel(transaction)}
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
                            <span className="text-muted-foreground">{kind !== "payment" ? "—" : "N/A"}</span>
                          )}
                        </DataTableCell>
                        <DataTableCell className="align-top">
                          {transaction.type === "pre_funding" || transaction.type === "top_up" ? (
                            transaction.walletFunding ? (
                              <div className="flex flex-col gap-1.5 py-0.5">
                                <Badge variant="secondary" className="w-fit px-2 py-0 text-[10px] font-medium">
                                  {walletFundingModeLabel(transaction.walletFunding)}
                                </Badge>
                                <dl className="space-y-0.5 text-[11px] leading-tight">
                                  {transaction.walletFunding.walletAppliedDollars >= 0.01 ? (
                                    <div className="flex items-baseline justify-between gap-3 tabular-nums">
                                      <dt className="shrink-0 text-muted-foreground">Wallet</dt>
                                      <dd className="min-w-0 truncate text-right font-medium text-foreground">
                                        {fmtMoney(
                                          transaction.walletFunding.walletAppliedDollars,
                                          transaction.currency
                                        )}
                                      </dd>
                                    </div>
                                  ) : null}
                                  {transaction.walletFunding.gatewayChargedDollars >= 0.01 ? (
                                    <div className="flex items-baseline justify-between gap-3 tabular-nums">
                                      <dt className="shrink-0 text-muted-foreground">Checkout</dt>
                                      <dd className="min-w-0 truncate text-right font-medium text-foreground">
                                        {fmtMoney(
                                          transaction.walletFunding.gatewayChargedDollars,
                                          transaction.currency
                                        )}
                                      </dd>
                                    </div>
                                  ) : null}
                                </dl>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </DataTableCell>
                        <DataTableCell>
                          <div className="font-semibold tabular-nums">
                            {kind === "wallet" &&
                            typeof transaction.signedAmount === "number" ? (
                              <>
                                <span
                                  className={
                                    transaction.signedAmount < 0
                                      ? "text-rose-600 dark:text-rose-400"
                                      : "text-emerald-700 dark:text-emerald-400"
                                  }
                                >
                                  {transaction.signedAmount > 0
                                    ? "+"
                                    : transaction.signedAmount < 0
                                      ? "-"
                                      : ""}
                                  $
                                  {Math.abs(transaction.signedAmount).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}{" "}
                                  {transaction.currency.toUpperCase()}
                                </span>
                                <span className="block text-[10px] font-normal text-muted-foreground normal-case">
                                  wallet movement
                                </span>
                              </>
                            ) : kind === "withdrawal_request" ? (
                              <>
                                $
                                {transaction.amount.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                {transaction.currency.toUpperCase()}
                                <span className="block text-[10px] font-normal text-muted-foreground normal-case">
                                  requested withdrawal
                                </span>
                              </>
                            ) : transaction.type === "pre_funding" || transaction.type === "top_up" ? (
                              <>
                                $
                                {comparableTransactionAmount(transaction).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                {transaction.currency.toUpperCase()}
                                <span className="block text-[10px] font-normal text-muted-foreground normal-case">
                                  total client gross
                                </span>
                              </>
                            ) : (
                              <>
                                $
                                {transaction.amount.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                {transaction.currency.toUpperCase()}
                              </>
                            )}
                          </div>
                          {(transaction.ledgerKind ?? "payment") === "payment" &&
                          (transaction.type === "milestone_release" ||
                            transaction.type === "monthly_release" ||
                            transaction.type === "payout") ? (
                            <div className="text-xs text-muted-foreground">
                              Net: $
                              {(transaction.netAmount ?? transaction.amount).toLocaleString()}
                            </div>
                          ) : null}
                          {(transaction.type === "pre_funding" || transaction.type === "top_up") &&
                          transaction.netAmount != null ? (
                            <div className="text-xs text-muted-foreground">
                              Net to escrow: $
                              {transaction.netAmount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          ) : null}
                        </DataTableCell>
                        <DataTableCell>
                          <DashboardStatusBadge
                            label={statusConfig.label}
                            tone={mapStatusTone(transaction.status)}
                          />
                        </DataTableCell>
                        <DataTableCell className="text-right">
                          {detailHref ? (
                            <Button variant="ghost" size="sm" asChild className="rounded-lg">
                              <Link href={detailHref} onClick={(e) => e.stopPropagation()}>
                                View
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
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
      </div>
    </div>
  );
}

