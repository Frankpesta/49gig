"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
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
import { Users, Shield, Search, AlertCircle, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import {
  needsFreelancerKycOrAdminApproval,
  normalizeFreelancerKycStatus,
  normalizeFreelancerVerificationStatus,
} from "@/lib/freelancer-matching-readiness";

const ROLE_VALUES = new Set(["client", "freelancer", "moderator", "admin"]);
const STATUS_VALUES = new Set(["active", "suspended", "deleted"]);

function UsersPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  // Initial state is restored from the URL so that navigating to a user's
  // detail page and back (or a plain browser back) lands on the exact same
  // search/filter/page instead of resetting to page 1.
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") ?? "");
  const [roleFilter, setRoleFilter] = useState<string>(() => {
    const v = searchParams.get("role");
    return v && ROLE_VALUES.has(v) ? v : "all";
  });
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    const v = searchParams.get("status");
    return v && STATUS_VALUES.has(v) ? v : "all";
  });
  /** Admin: active freelancers with tests + KYC submitted, awaiting review. */
  const [freelancerQueueFilter, setFreelancerQueueFilter] = useState<"all" | "pending_signup">(() =>
    searchParams.get("queue") === "pending_signup" ? "pending_signup" : "all"
  );
  const [currentPage, setCurrentPage] = useState(() => {
    const v = Number(searchParams.get("page"));
    return Number.isFinite(v) && v > 0 ? Math.floor(v) : 1;
  });
  const itemsPerPage = 50;

  useEffect(() => {
    if (isAuthenticated && user?.role === "moderator") {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, user?.role, router]);

  const signupQueueOnly =
    user?.role === "admin" && freelancerQueueFilter === "pending_signup";

  const users = useQuery(
    api.users.queries.getAllUsersAdmin,
    isAuthenticated && user?._id && user.role === "admin"
      ? {
          userId: user._id,
          role:
            signupQueueOnly
              ? "freelancer"
              : roleFilter !== "all"
                ? (roleFilter as "client" | "freelancer" | "moderator" | "admin")
                : undefined,
          status: statusFilter !== "all" ? (statusFilter as "active" | "suspended" | "deleted") : undefined,
          signupApprovalQueueOnly: signupQueueOnly,
        }
      : "skip"
  );

  const pendingSignupRows = useQuery(
    api.kyc.queries.getPendingSignupApprovals,
    isAuthenticated && user?.role === "admin" && user._id ? { userId: user._id } : "skip"
  );
  const pendingSignupIdSet = useMemo(() => {
    const rows = pendingSignupRows ?? [];
    return new Set(
      rows.map((r: { freelancerId: Id<"users"> }) => String(r.freelancerId))
    );
  }, [pendingSignupRows]);

  // Mirror list state into the URL (replace — no new history entries) so the
  // current page is always recoverable from the address bar / browser back.
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (roleFilter !== "all") params.set("role", roleFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (freelancerQueueFilter !== "all") params.set("queue", freelancerQueueFilter);
    if (currentPage !== 1) params.set("page", String(currentPage));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, roleFilter, statusFilter, freelancerQueueFilter, currentPage, pathname]);

  // Reset to page 1 when a filter genuinely changes — but not on first
  // mount, where currentPage may have just been restored from the URL.
  const isFirstFilterEffect = useRef(true);
  useEffect(() => {
    if (isFirstFilterEffect.current) {
      isFirstFilterEffect.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, freelancerQueueFilter]);

  const usersList = users != null && Array.isArray(users) ? users : [];
  const filteredUsers = usersList.filter((u: Doc<"users">) => {
    const name = (u.name ?? "").toString().toLowerCase();
    const email = (u.email ?? "").toString().toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term);
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!isAuthenticated || !user) {
    return <DashboardEmptyState icon={Users} title="Please log in" iconTone="muted" />;
  }

  if (user.role !== "admin") {
    return (
      <DashboardEmptyState
        icon={Shield}
        iconTone="muted"
        title="Access denied"
        description="Admin role required."
      />
    );
  }

  if (users === undefined) {
    return <DashboardLoadingState label="Loading" />;
  }

  if (users === null || !Array.isArray(users)) {
    return (
      <DashboardEmptyState
        icon={AlertCircle}
        iconTone="danger"
        title="Failed to load users"
        description="Please try again."
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="User Management"
        description={
          signupQueueOnly
            ? "Active freelancers who completed verification tests and submitted KYC, awaiting admin review and one-step signup approval."
            : "Manage users, roles, and account status. Use the freelancer queue filter to review signup approvals."
        }
        icon={Users}
      />

      {/* Filters */}
      <DashboardFilterBar>
          <div className="flex w-full flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={roleFilter}
              onValueChange={setRoleFilter}
              disabled={signupQueueOnly}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={freelancerQueueFilter}
              onValueChange={(v) => {
                const next = v as "all" | "pending_signup";
                setFreelancerQueueFilter(next);
                if (next === "pending_signup") setRoleFilter("freelancer");
              }}
            >
              <SelectTrigger className="w-full md:w-[260px]">
                <SelectValue placeholder="Freelancer queue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users (no approval filter)</SelectItem>
                <SelectItem value="pending_signup">Awaiting signup approval</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
      </DashboardFilterBar>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5">
          <span className="font-semibold text-foreground">{filteredUsers.length}</span> users
        </span>
        <span className="rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5">
          <span className="font-semibold text-green-600">{usersList.filter((u: Doc<"users">) => u.status === "active").length}</span> active
        </span>
        <span className="rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5">
          <span className="font-semibold text-orange-600">{usersList.filter((u: Doc<"users">) => u.status === "suspended").length}</span> suspended
        </span>
        {signupQueueOnly && (
          <span className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-1.5">
            <span className="font-semibold text-foreground">{filteredUsers.length}</span> awaiting signup approval
          </span>
        )}
        {pendingSignupRows && pendingSignupRows.length > 0 && (
          <span className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5">
            <span className="font-semibold text-foreground">{pendingSignupRows.length}</span> ready for one-step signup approval
          </span>
        )}
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Tech Field</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Admin approval</TableHead>
              <TableHead>KYC</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((u: Doc<"users">) => (
                <TableRow key={u._id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{u.name ?? "—"}</TableCell>
                      <TableCell>{u.email ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground capitalize">
                        {u.role === "freelancer"
                          ? (u.profile?.techField ?? "—").replace(/_/g, " ")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground capitalize">
                        {u.role === "freelancer" ? u.profile?.experienceLevel ?? "—" : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            u.status === "active"
                              ? "default"
                              : u.status === "suspended"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.role === "freelancer" ? (
                          <div className="flex flex-col items-start gap-1">
                            {(() => {
                              const adminStatus = normalizeFreelancerVerificationStatus(
                                u.verificationStatus
                              );
                              return (
                                <Badge
                                  variant={
                                    adminStatus === "approved"
                                      ? "default"
                                      : adminStatus === "rejected"
                                        ? "destructive"
                                        : adminStatus === "pending_review"
                                          ? "outline"
                                          : "secondary"
                                  }
                                >
                                  {adminStatus.replace(/_/g, " ")}
                                </Badge>
                              );
                            })()}
                            {pendingSignupIdSet.has(String(u._id)) && (
                              <Badge variant="default" className="text-[10px] font-normal">
                                Ready to approve
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.role === "freelancer" ? (
                          <div className="flex flex-col items-start gap-1">
                            {(() => {
                              const kycStatus = normalizeFreelancerKycStatus(u.kycStatus);
                              return (
                                <Badge
                                  variant={
                                    kycStatus === "approved"
                                      ? "default"
                                      : kycStatus === "pending_review"
                                        ? "outline"
                                        : kycStatus === "id_rejected" ||
                                            kycStatus === "address_rejected"
                                          ? "destructive"
                                          : "secondary"
                                  }
                                >
                                  {kycStatus.replace(/_/g, " ")}
                                </Badge>
                              );
                            })()}
                            {needsFreelancerKycOrAdminApproval(u) &&
                              !pendingSignupIdSet.has(String(u._id)) && (
                                <Badge variant="secondary" className="text-[10px] font-normal">
                                  In progress
                                </Badge>
                              )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.createdAt != null
                          ? formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/users/${u._id}`}>
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            Manage
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
          </TableBody>
        </Table>
      </div>
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredUsers.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        itemName="users"
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<DashboardLoadingState label="Loading users" />}>
      <UsersPageContent />
    </Suspense>
  );
}
