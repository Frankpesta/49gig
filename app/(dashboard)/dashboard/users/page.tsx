"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { getUserFriendlyError } from "@/lib/error-handling";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Users,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Search,
  AlertCircle,
  ExternalLink,
  Ban,
  UserCheck,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { FreelancerSignupApprovalManageBlock } from "@/components/dashboard/freelancer-signup-approval-manage-block";

function UsersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  /** Admin: filter list to freelancers awaiting one-step signup approval (tests + KYC). */
  const [freelancerQueueFilter, setFreelancerQueueFilter] = useState<"all" | "pending_signup">("all");
  const [selectedUser, setSelectedUser] = useState<Doc<"users"> | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: "",
    message: "",
  });
  const [verificationOverrideOpen, setVerificationOverrideOpen] = useState(false);
  const [verificationOverrideReason, setVerificationOverrideReason] = useState("");
  const [verificationOverrideApproveKyc, setVerificationOverrideApproveKyc] = useState(true);
  const [verificationOverrideLoading, setVerificationOverrideLoading] = useState(false);
  const [profileUserId, setProfileUserId] = useState<Id<"users"> | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("permanent");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReviewNotes, setRejectReviewNotes] = useState("");
  const [vettingActionLoading, setVettingActionLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === "moderator") {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, user?.role, router]);

  useEffect(() => {
    if (searchParams.get("signup") === "1") {
      setFreelancerQueueFilter("pending_signup");
      setRoleFilter("freelancer");
    }
  }, [searchParams]);

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
  const pendingSignupIdSet = useMemo(
    () => new Set((pendingSignupRows ?? []).map((r) => String(r.freelancerId))),
    [pendingSignupRows]
  );

  const profileDetail = useQuery(
    api.users.queries.getUserProfileForAdmin,
    profileUserId && user?._id
      ? { targetUserId: profileUserId, adminUserId: user._id }
      : "skip"
  );

  const updateUserRole = useMutation(api.users.mutations.updateUserRole);
  const updateUserStatus = useMutation(api.users.mutations.updateUserStatus);
  const updateFreelancerProfileByAdmin = useMutation(
    (api as any).users.mutations.updateFreelancerProfileByAdmin
  );
  const adminOverrideVerification = useMutation(
    api.vetting.mutations.adminOverrideFreelancerVerificationAndTests
  );
  const approveVerification = useMutation(api.vetting.mutations.approveVerification);
  const rejectVerification = useMutation(api.vetting.mutations.rejectVerification);
  const [freelancerSkillsInput, setFreelancerSkillsInput] = useState("");
  const [freelancerExperienceLevel, setFreelancerExperienceLevel] = useState<
    "junior" | "mid" | "senior" | "expert"
  >("junior");
  const [freelancerTechField, setFreelancerTechField] = useState<string>("other");

  const vettingForSelected = useQuery(
    api.vetting.queries.getVerificationResults,
    selectedUser?.role === "freelancer" && user?._id && (user.role === "admin" || user.role === "moderator")
      ? { freelancerId: selectedUser._id, adminUserId: user._id }
      : "skip"
  );

  useEffect(() => {
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

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!user?._id) return;

    setIsUpdating(true);
    try {
      await updateUserRole({
        userId: userId as any,
        newRole: newRole as any,
        adminUserId: user._id,
      });
      setSelectedUser(null);
      toast.success("User role updated successfully");
    } catch (error) {
      console.error("Failed to update role:", error);
      const errorMessage = getUserFriendlyError(error) || "Failed to update user role";
      setErrorDialog({
        open: true,
        title: "Update Failed",
        message: errorMessage,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    if (!user?._id) return;

    setIsUpdating(true);
    try {
      await updateUserStatus({
        userId: userId as any,
        newStatus: newStatus as any,
        adminUserId: user._id,
      });
      setSelectedUser(null);
      toast.success(
        newStatus === "deleted"
          ? "Account permanently deleted."
          : "User status updated successfully"
      );
    } catch (error) {
      console.error("Failed to update status:", error);
      const errorMessage = getUserFriendlyError(error) || "Failed to update user status";
      setErrorDialog({
        open: true,
        title: "Update Failed",
        message: errorMessage,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getSuspendedUntil = (duration: string): number | undefined => {
    const now = Date.now();
    const map: Record<string, number> = {
      "1week": 7 * 24 * 60 * 60 * 1000,
      "2weeks": 14 * 24 * 60 * 60 * 1000,
      "1month": 30 * 24 * 60 * 60 * 1000,
      "3months": 90 * 24 * 60 * 60 * 1000,
      "6months": 180 * 24 * 60 * 60 * 1000,
      "1year": 365 * 24 * 60 * 60 * 1000,
    };
    return map[duration] ? now + map[duration] : undefined;
  };

  const handleConfirmSuspend = async () => {
    if (!user?._id || !selectedUser) return;
    setIsUpdating(true);
    try {
      await updateUserStatus({
        userId: selectedUser._id,
        newStatus: "suspended",
        adminUserId: user._id,
        suspensionReason: suspendReason.trim() || undefined,
        suspendedUntil: getSuspendedUntil(suspendDuration),
      });
      toast.success("Account suspended. All sessions were revoked.");
      setSuspendDialogOpen(false);
      setSuspendReason("");
      setSuspendDuration("permanent");
      setSelectedUser(null);
    } catch (error) {
      setErrorDialog({
        open: true,
        title: "Suspend failed",
        message: getUserFriendlyError(error) || "Could not suspend this account.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReinstate = async () => {
    if (!user?._id || !selectedUser) return;
    setIsUpdating(true);
    try {
      await updateUserStatus({
        userId: selectedUser._id,
        newStatus: "active",
        adminUserId: user._id,
      });
      toast.success("Account reinstated.");
      setSelectedUser(null);
    } catch (error) {
      setErrorDialog({
        open: true,
        title: "Reinstate failed",
        message: getUserFriendlyError(error) || "Could not reinstate this account.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAdminDeleteAccount = async () => {
    if (!user?._id || !selectedUser || user.role !== "admin") return;
    setDeleteAccountLoading(true);
    try {
      await updateUserStatus({
        userId: selectedUser._id,
        newStatus: "deleted",
        adminUserId: user._id,
      });
      toast.success("Account permanently deleted.");
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      setErrorDialog({
        open: true,
        title: "Delete failed",
        message: getUserFriendlyError(error) || "Could not delete this account.",
      });
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  const handleApproveFreelancerVetting = async () => {
    if (!user?._id || !selectedUser) return;
    setVettingActionLoading(true);
    try {
      await approveVerification({
        freelancerId: selectedUser._id,
        adminUserId: user._id,
      });
      toast.success("Freelancer verification approved.");
      setSelectedUser(null);
    } catch (error) {
      setErrorDialog({
        open: true,
        title: "Approval failed",
        message: getUserFriendlyError(error) || "Could not approve verification.",
      });
    } finally {
      setVettingActionLoading(false);
    }
  };

  const handleRejectFreelancerVetting = async () => {
    if (!user?._id || !selectedUser) return;
    const notes = rejectReviewNotes.trim();
    if (!notes) {
      toast.error("Add review notes explaining the rejection.");
      return;
    }
    setVettingActionLoading(true);
    try {
      await rejectVerification({
        freelancerId: selectedUser._id,
        reviewNotes: notes,
        adminUserId: user._id,
      });
      toast.success("Verification rejected.");
      setRejectDialogOpen(false);
      setRejectReviewNotes("");
      setSelectedUser(null);
    } catch (error) {
      setErrorDialog({
        open: true,
        title: "Rejection failed",
        message: getUserFriendlyError(error) || "Could not reject verification.",
      });
    } finally {
      setVettingActionLoading(false);
    }
  };

  const handleAdminVerificationOverride = async () => {
    if (!user?._id || !selectedUser || selectedUser.role !== "freelancer") return;
    setVerificationOverrideLoading(true);
    try {
      await adminOverrideVerification({
        freelancerId: selectedUser._id,
        adminUserId: user._id,
        reason: verificationOverrideReason.trim() || undefined,
        approveKyc: verificationOverrideApproveKyc,
      });
      toast.success("Verification and tests overridden for this freelancer.");
      setVerificationOverrideOpen(false);
      setVerificationOverrideReason("");
      setVerificationOverrideApproveKyc(true);
      setSelectedUser(null);
    } catch (error) {
      const errorMessage = getUserFriendlyError(error) || "Override failed";
      setErrorDialog({
        open: true,
        title: "Override failed",
        message: errorMessage,
      });
    } finally {
      setVerificationOverrideLoading(false);
    }
  };

  const handleFreelancerProfileUpdate = async () => {
    if (!user?._id || !selectedUser || selectedUser.role !== "freelancer") return;
    const skills = freelancerSkillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setIsUpdating(true);
    try {
      await updateFreelancerProfileByAdmin({
        targetUserId: selectedUser._id,
        adminUserId: user._id,
        experienceLevel: freelancerExperienceLevel,
        techField: freelancerTechField as any,
        skills,
      });
      toast.success("Freelancer profile updated.");
      setSelectedUser(null);
    } catch (error) {
      setErrorDialog({
        open: true,
        title: "Profile update failed",
        message: getUserFriendlyError(error) || "Could not update freelancer profile.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

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
            ? "Showing freelancers awaiting signup approval (submitted tests and KYC). Open Manage to review documents and approve or reject."
            : "Manage users, roles, and account status. Filter freelancers awaiting signup approval to process the queue from here."
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
                <SelectItem value="all">All users (no queue filter)</SelectItem>
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
        {pendingSignupRows && pendingSignupRows.length > 0 && (
          <span className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5">
            <span className="font-semibold text-foreground">{pendingSignupRows.length}</span> awaiting signup approval
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
              <TableHead>Verification</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
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
                            <Badge
                              variant={
                                u.verificationStatus === "approved"
                                  ? "default"
                                  : u.verificationStatus === "rejected"
                                  ? "destructive"
                                  : u.verificationStatus === "pending_review"
                                  ? "outline"
                                  : "secondary"
                              }
                            >
                              {u.verificationStatus || "not_started"}
                            </Badge>
                            {pendingSignupIdSet.has(String(u._id)) && (
                              <Badge variant="secondary" className="text-[10px] font-normal">
                                Signup queue
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
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            asChild
                          >
                            <Link href={`/dashboard/users/${u._id}`}>
                              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                              View details
                            </Link>
                          </Button>
                        <Dialog
                          open={!!selectedUser && selectedUser._id === u._id}
                          onOpenChange={(open) => {
                            if (!open) setSelectedUser(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(u);
                                setFreelancerSkillsInput((u.profile?.skills ?? []).join(", "));
                                setFreelancerExperienceLevel(
                                  (u.profile?.experienceLevel as
                                    | "junior"
                                    | "mid"
                                    | "senior"
                                    | "expert") ?? "junior"
                                );
                                setFreelancerTechField((u.profile?.techField as string) ?? "other");
                              }}
                            >
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="flex max-h-[min(90dvh,calc(100dvh-2rem))] flex-col overflow-hidden sm:max-w-2xl">
                            <DialogHeader className="shrink-0">
                              <DialogTitle>Manage User: {selectedUser?.name}</DialogTitle>
                              <DialogDescription>
                                Update user role and status. Changes are logged in audit logs.
                              </DialogDescription>
                            </DialogHeader>
                            {selectedUser && (
                              <div className="flex-1 space-y-4 overflow-y-auto py-4 pr-1">
                                {user.role === "admin" && selectedUser.role === "freelancer" && user._id && (
                                  <FreelancerSignupApprovalManageBlock
                                    freelancerId={selectedUser._id}
                                    adminUserId={user._id}
                                    enabled
                                    onAfterAction={() => setSelectedUser(null)}
                                  />
                                )}
                                <div className="space-y-2">
                                  <Label>Role</Label>
                                  <Select
                                    value={selectedUser.role}
                                    onValueChange={(value) =>
                                      handleRoleChange(selectedUser._id, value)
                                    }
                                    disabled={isUpdating || selectedUser._id === user._id}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="client">Client</SelectItem>
                                      <SelectItem value="freelancer">Freelancer</SelectItem>
                                      <SelectItem value="moderator">Moderator</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {selectedUser._id === user._id && (
                                    <p className="text-xs text-muted-foreground">
                                      Cannot change your own role
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label>Status</Label>
                                  <Select
                                    value={selectedUser.status}
                                    onValueChange={(value) =>
                                      handleStatusChange(selectedUser._id, value)
                                    }
                                    disabled={
                                      isUpdating ||
                                      selectedUser._id === user._id ||
                                      (selectedUser.status === "deleted" && user.role !== "admin")
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="suspended">Suspended</SelectItem>
                                      {user.role === "admin" && (
                                        <SelectItem value="deleted">Deleted</SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                  {selectedUser._id === user._id && (
                                    <p className="text-xs text-muted-foreground">
                                      Cannot change your own status
                                    </p>
                                  )}
                                  {selectedUser.status === "deleted" && user.role !== "admin" && (
                                    <p className="text-xs text-muted-foreground">
                                      Only admins can restore deleted accounts
                                    </p>
                                  )}
                                </div>

                                {selectedUser.role === "freelancer" && user.role === "admin" && (
                                  <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
                                    <p className="text-sm font-medium">Freelancer profile fields</p>
                                    <div className="space-y-2">
                                      <Label>Tech field</Label>
                                      <Select
                                        value={freelancerTechField}
                                        onValueChange={setFreelancerTechField}
                                        disabled={isUpdating}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="development">Development</SelectItem>
                                          <SelectItem value="data_science">Data Science</SelectItem>
                                          <SelectItem value="technical_writing">Technical Writing</SelectItem>
                                          <SelectItem value="design">Design</SelectItem>
                                          <SelectItem value="software_development">Software Development</SelectItem>
                                          <SelectItem value="ui_ux_design">UI/UX Design</SelectItem>
                                          <SelectItem value="data_analytics">Data Analytics</SelectItem>
                                          <SelectItem value="devops_cloud">DevOps/Cloud</SelectItem>
                                          <SelectItem value="cybersecurity_it">Cybersecurity/IT</SelectItem>
                                          <SelectItem value="ai">AI</SelectItem>
                                          <SelectItem value="machine_learning">Machine Learning</SelectItem>
                                          <SelectItem value="blockchain">Blockchain</SelectItem>
                                          <SelectItem value="qa_testing">QA Testing</SelectItem>
                                          <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Experience level</Label>
                                      <Select
                                        value={freelancerExperienceLevel}
                                        onValueChange={(value) =>
                                          setFreelancerExperienceLevel(
                                            value as "junior" | "mid" | "senior" | "expert"
                                          )
                                        }
                                        disabled={isUpdating}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="junior">Junior</SelectItem>
                                          <SelectItem value="mid">Mid</SelectItem>
                                          <SelectItem value="senior">Senior</SelectItem>
                                          <SelectItem value="expert">Expert</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Skills (comma-separated)</Label>
                                      <Input
                                        value={freelancerSkillsInput}
                                        onChange={(e) => setFreelancerSkillsInput(e.target.value)}
                                        placeholder="React, Node.js, PostgreSQL"
                                        disabled={isUpdating}
                                      />
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => void handleFreelancerProfileUpdate()}
                                      disabled={isUpdating}
                                    >
                                      Save freelancer profile
                                    </Button>
                                  </div>
                                )}

                                {selectedUser._id !== user._id &&
                                  selectedUser.status === "active" &&
                                  (user.role === "admin" ||
                                    (user.role === "moderator" &&
                                      selectedUser.role !== "admin" &&
                                      selectedUser.role !== "moderator")) && (
                                    <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 space-y-2">
                                      <p className="text-xs text-muted-foreground leading-relaxed">
                                        Suspending immediately revokes all active sessions. Add an optional internal
                                        note (visible to staff only).
                                      </p>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="gap-2 w-full sm:w-auto"
                                        onClick={() => {
                                          setSuspendReason("");
                                          setSuspendDialogOpen(true);
                                        }}
                                        disabled={isUpdating}
                                      >
                                        <Ban className="h-4 w-4" />
                                        Suspend account…
                                      </Button>
                                    </div>
                                  )}

                                {selectedUser._id !== user._id && selectedUser.status === "suspended" && (
                                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
                                    {selectedUser.suspensionReason ? (
                                      <p className="text-xs text-muted-foreground leading-relaxed">
                                        <span className="font-medium text-foreground">Internal note: </span>
                                        {selectedUser.suspensionReason}
                                      </p>
                                    ) : null}
                                    <Button
                                      type="button"
                                      variant="default"
                                      size="sm"
                                      className="gap-2 w-full sm:w-auto"
                                      onClick={() => void handleReinstate()}
                                      disabled={isUpdating}
                                    >
                                      <UserCheck className="h-4 w-4" />
                                      Reinstate account
                                    </Button>
                                  </div>
                                )}

                                {user.role === "admin" &&
                                  selectedUser._id !== user._id &&
                                  selectedUser.status !== "deleted" && (
                                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                                      <p className="text-xs text-muted-foreground leading-relaxed">
                                        Permanently removes the user document and purges their sessions, vetting, wallet
                                        (must be zero), notifications, and other user-owned data. Blocked if they are a
                                        client on any project, tied to an active hire, have open disputes, or pending
                                        referral payouts.
                                      </p>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="gap-2 w-full sm:w-auto"
                                        onClick={() => setDeleteDialogOpen(true)}
                                        disabled={isUpdating || deleteAccountLoading}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Delete account…
                                      </Button>
                                    </div>
                                  )}

                                {selectedUser.role === "freelancer" && (
                                  <>
                                    <Separator />
                                    <div className="space-y-3 rounded-lg border border-border/80 bg-muted/15 p-3">
                                      <div className="flex items-center gap-2 text-sm font-semibold">
                                        <Shield className="h-4 w-4" />
                                        Verification &amp; test scores
                                      </div>
                                      {vettingForSelected === undefined && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          Loading…
                                        </p>
                                      )}
                                      {vettingForSelected && !vettingForSelected.vettingResult && (
                                        <p className="text-xs text-muted-foreground">No vetting record yet.</p>
                                      )}
                                      {vettingForSelected?.vettingResult && (() => {
                                        const vr = vettingForSelected.vettingResult;
                                        const en = vr.englishProficiency;
                                        const proc = vr.proctoringSummary;
                                        const canFinalApprove =
                                          user.role === "admin" &&
                                          (vr.status === "pending_admin" || vr.status === "flagged") &&
                                          selectedUser.verificationStatus === "pending_review";
                                        return (
                                          <div className="space-y-3 text-sm">
                                            <div className="flex flex-wrap gap-2">
                                              <Badge variant="outline">Vetting: {vr.status}</Badge>
                                              <Badge variant="secondary">
                                                User: {selectedUser.verificationStatus ?? "—"}
                                              </Badge>
                                              {vr.overallScore > 0 && (
                                                <Badge variant="outline">Overall {vr.overallScore}%</Badge>
                                              )}
                                            </div>
                                            <div className="grid gap-2 sm:grid-cols-2 text-xs">
                                              <div className="rounded-md bg-background/60 border border-border/50 p-2">
                                                <p className="font-medium text-foreground mb-1">English</p>
                                                <p className="text-muted-foreground">
                                                  Grammar: {en.grammarScore ?? "—"}% · Comprehension:{" "}
                                                  {en.comprehensionScore ?? "—"}%
                                                </p>
                                                <p className="text-muted-foreground">
                                                  Written: {en.writtenResponseScore ?? "—"}% · Overall:{" "}
                                                  {en.overallScore ?? "—"}%
                                                </p>
                                              </div>
                                              <div className="rounded-md bg-background/60 border border-border/50 p-2">
                                                <p className="font-medium text-foreground mb-1">Skills</p>
                                                {vr.skillAssessments.length === 0 ? (
                                                  <p className="text-muted-foreground">No assessments</p>
                                                ) : (
                                                  <ul className="text-muted-foreground space-y-0.5">
                                                    {vr.skillAssessments.map((a: { skillId: string; skillName: string; score: number }) => (
                                                      <li key={a.skillId}>
                                                        {a.skillName}: {a.score}%
                                                      </li>
                                                    ))}
                                                  </ul>
                                                )}
                                              </div>
                                            </div>
                                            {proc && (
                                              <div className="rounded-md border border-border/50 bg-background/40 p-2 text-xs text-muted-foreground space-y-1">
                                                <p className="font-medium text-foreground">Proctoring (signals only)</p>
                                                <p>
                                                  Hidden/tab time (reported):{" "}
                                                  {Math.round((proc.visibilityHiddenMsTotal ?? 0) / 1000)}s · Blur
                                                  events: {proc.windowBlurEvents ?? 0} · Paste: {proc.pasteAttempts ?? 0}{" "}
                                                  · Camera drops: {proc.cameraOffSegments ?? 0}
                                                </p>
                                              </div>
                                            )}
                                            {vr.fraudFlags && vr.fraudFlags.length > 0 && (
                                              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs space-y-1">
                                                <p className="font-medium text-amber-900 dark:text-amber-100">Flags</p>
                                                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                                                  {vr.fraudFlags.map((f: { severity: string; description: string }, i: number) => (
                                                    <li key={i}>
                                                      [{f.severity}] {f.description}
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                            {canFinalApprove && (
                                              <div className="flex flex-wrap gap-2 pt-1">
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  className="gap-1.5"
                                                  disabled={vettingActionLoading || isUpdating}
                                                  onClick={() => void handleApproveFreelancerVetting()}
                                                >
                                                  {vettingActionLoading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                  ) : (
                                                    <CheckCircle2 className="h-4 w-4" />
                                                  )}
                                                  Final approve
                                                </Button>
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant="outline"
                                                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                                                  disabled={vettingActionLoading || isUpdating}
                                                  onClick={() => {
                                                    setRejectReviewNotes("");
                                                    setRejectDialogOpen(true);
                                                  }}
                                                >
                                                  Reject verification…
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </>
                                )}

                                {user.role === "admin" && selectedUser.role === "freelancer" && (
                                  <>
                                    <Separator />
                                    <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                                      <div className="flex items-center gap-2 text-sm font-medium">
                                        <ShieldCheck className="h-4 w-4 text-amber-600" />
                                        Admin: override verification &amp; tests
                                      </div>
                                      <p className="text-xs text-muted-foreground leading-relaxed">
                                        Waives English and skill verification requirements, closes any in-progress
                                        skill sessions, and marks vetting as approved. Use when you have verified
                                        this person outside the platform.
                                      </p>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="border-amber-600/50 text-amber-900 hover:bg-amber-500/10 dark:text-amber-100"
                                        onClick={() => setVerificationOverrideOpen(true)}
                                        disabled={isUpdating}
                                      >
                                        Override verification &amp; tests…
                                      </Button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                            <DialogFooter className="shrink-0 border-t border-border/60 pt-4">
                              <Button
                                variant="outline"
                                onClick={() => setSelectedUser(null)}
                              >
                                Close
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        </div>
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

      <Dialog
        open={profileUserId !== null}
        onOpenChange={(open) => {
          if (!open) setProfileUserId(null);
        }}
      >
        <DialogContent className="max-w-lg max-h-[min(85vh,720px)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>User profile</DialogTitle>
            <DialogDescription>
              Read-only view for support and verification.
            </DialogDescription>
          </DialogHeader>
          {profileUserId && profileDetail === undefined && (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          )}
          {profileDetail === null && profileUserId && (
            <p className="text-sm text-muted-foreground py-4">Could not load this profile.</p>
          )}
          {profileDetail && (
            <div className="space-y-4 py-2 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</p>
                <p className="font-medium">{profileDetail.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</p>
                <p>{profileDetail.email ?? "—"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">{profileDetail.role}</Badge>
                <Badge variant="secondary">{profileDetail.status}</Badge>
              </div>
              {profileDetail.profile && (
                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                  {profileDetail.profile.bio && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Bio</p>
                      <p className="leading-relaxed">{profileDetail.profile.bio}</p>
                    </div>
                  )}
                  {profileDetail.profile.companyName && (
                    <p><span className="text-muted-foreground">Company:</span> {profileDetail.profile.companyName}</p>
                  )}
                  {profileDetail.profile.techField && (
                    <p><span className="text-muted-foreground">Tech field:</span> {profileDetail.profile.techField}</p>
                  )}
                  {profileDetail.profile.experienceLevel && (
                    <p><span className="text-muted-foreground">Experience:</span> {profileDetail.profile.experienceLevel}</p>
                  )}
                  {profileDetail.profile.timezone && (
                    <p><span className="text-muted-foreground">Timezone:</span> {profileDetail.profile.timezone}</p>
                  )}
                  {profileDetail.profile.skills && profileDetail.profile.skills.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {profileDetail.profile.skills.map((s: string) => (
                          <Badge key={s} variant="outline" className="font-normal text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {profileDetail.role === "freelancer" && profileDetail.profile?.portfolioUrl && (
                <Button variant="outline" className="w-full gap-2" asChild>
                  <a
                    href={profileDetail.profile.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open portfolio
                  </a>
                </Button>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setProfileUserId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={verificationOverrideOpen}
        onOpenChange={(open) => {
          setVerificationOverrideOpen(open);
          if (!open) {
            setVerificationOverrideReason("");
            setVerificationOverrideApproveKyc(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Override verification &amp; tests?</DialogTitle>
            <DialogDescription>
              This immediately approves vetting and skill tests for{" "}
              <span className="font-medium text-foreground">{selectedUser?.name ?? "this freelancer"}</span>.
              It is recorded in audit logs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 space-y-0">
              <Checkbox
                id="approve-kyc-override"
                checked={verificationOverrideApproveKyc}
                onCheckedChange={(c) => setVerificationOverrideApproveKyc(c === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="approve-kyc-override"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Also approve KYC
                </label>
                <p className="text-xs text-muted-foreground">
                  Required for matching if identity checks are normally mandatory. Uncheck if only tests should be
                  waived.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="override-reason">Notes (optional)</Label>
              <Textarea
                id="override-reason"
                placeholder="e.g. Vetted via partner program, manual interview completed…"
                value={verificationOverrideReason}
                onChange={(e) => setVerificationOverrideReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVerificationOverrideOpen(false)}
              disabled={verificationOverrideLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={() => void handleAdminVerificationOverride()}
              disabled={verificationOverrideLoading}
            >
              {verificationOverrideLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying…
                </>
              ) : (
                "Confirm override"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete this account?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  This permanently deletes{" "}
                  <span className="font-medium text-foreground">
                    {selectedUser?.name ?? "this user"}
                  </span>{" "}
                  ({selectedUser?.email ?? "no email"}) from the database, including related records (sessions, vetting,
                  notifications, etc.). This cannot be undone.
                </p>
                <p>
                  It will fail if they own any client projects, are on an active hire or escrow flow, have open
                  disputes, a non-zero wallet, or pending referral payout requests.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAccountLoading}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleAdminDeleteAccount()}
              disabled={deleteAccountLoading}
            >
              {deleteAccountLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={suspendDialogOpen}
        onOpenChange={(open) => {
          setSuspendDialogOpen(open);
          if (!open) { setSuspendReason(""); setSuspendDuration("permanent"); }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend this account?</DialogTitle>
            <DialogDescription>
              {selectedUser?.name ?? "This user"} will be signed out everywhere immediately and cannot sign in until
              reinstated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="suspend-duration">Suspension duration</Label>
              <Select value={suspendDuration} onValueChange={setSuspendDuration}>
                <SelectTrigger id="suspend-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1week">1 week</SelectItem>
                  <SelectItem value="2weeks">2 weeks</SelectItem>
                  <SelectItem value="1month">1 month</SelectItem>
                  <SelectItem value="3months">3 months</SelectItem>
                  <SelectItem value="6months">6 months</SelectItem>
                  <SelectItem value="1year">1 year</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="suspend-reason">Internal note (optional)</Label>
              <Textarea
                id="suspend-reason"
                placeholder="Reason for suspension (staff only)"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setSuspendDialogOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void handleConfirmSuspend()} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Suspend account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          setRejectDialogOpen(open);
          if (!open) setRejectReviewNotes("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject freelancer verification?</DialogTitle>
            <DialogDescription>
              The freelancer will be notified. Provide clear notes they can act on.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reject-notes">Review notes (required)</Label>
            <Textarea
              id="reject-notes"
              placeholder="Explain what failed or what they should fix"
              value={rejectReviewNotes}
              onChange={(e) => setRejectReviewNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={vettingActionLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleRejectFreelancerVetting()}
              disabled={vettingActionLoading}
            >
              {vettingActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject verification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <AlertDialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {errorDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {errorDialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialog({ open: false, title: "", message: "" })}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
