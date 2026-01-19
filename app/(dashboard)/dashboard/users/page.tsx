"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Users, Shield, Ban, CheckCircle2, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function UsersPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<Doc<"users"> | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const users = useQuery(
    api.users.queries.getAllUsersAdmin,
    isAuthenticated && user?._id && (user.role === "admin" || user.role === "moderator")
      ? {
          userId: user._id,
          role: roleFilter !== "all" ? (roleFilter as "client" | "freelancer" | "moderator" | "admin") : undefined,
          status: statusFilter !== "all" ? (statusFilter as "active" | "suspended" | "deleted") : undefined,
        }
      : "skip"
  );

  const updateUserRole = useMutation(api.users.mutations.updateUserRole);
  const updateUserStatus = useMutation(api.users.mutations.updateUserStatus);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  if (user.role !== "admin" && user.role !== "moderator") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Access denied. Admin or Moderator role required.</p>
      </div>
    );
  }

  if (users === undefined) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle case where query returns null or error
  if (users === null || !Array.isArray(users)) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Failed to load users. Please try again.</p>
      </div>
    );
  }

  const filteredUsers = users.filter((u: Doc<"users">) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

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
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("Failed to update user role");
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
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update user status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage users, roles, and account status.
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
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
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
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((u: Doc<"users">) => (
                    <TableRow key={u._id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {u.role}
                        </Badge>
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
                          <Badge
                            variant={
                              u.verificationStatus === "approved"
                                ? "default"
                                : u.verificationStatus === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {u.verificationStatus || "not_started"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(u)}
                            >
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage User: {selectedUser?.name}</DialogTitle>
                              <DialogDescription>
                                Update user role and status. Changes are logged in audit logs.
                              </DialogDescription>
                            </DialogHeader>
                            {selectedUser && (
                              <div className="space-y-4 py-4">
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
                              </div>
                            )}
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setSelectedUser(null)}
                              >
                                Close
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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
        </CardContent>
      </Card>
    </div>
  );
}

