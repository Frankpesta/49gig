"use client";

import { useMemo, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Bell, Send } from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";

const roleOptions = ["client", "freelancer", "moderator", "admin"] as const;

export default function AdminNotificationsPage() {
  const { user, isAuthenticated } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSending, setIsSending] = useState(false);

  const users = useQuery(
    (api as any)["users/queries"].getAllUsersAdmin,
    isAuthenticated && user?._id && (user.role === "admin" || user.role === "moderator")
      ? { userId: user._id }
      : "skip"
  );

  const sendAdminNotification = useAction(api.notifications.actions.sendAdminNotification);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const term = searchTerm.trim().toLowerCase();
    return users.filter((u: Doc<"users">) => {
      if (!term) return true;
      return (
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    });
  }, [users, searchTerm]);

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

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      alert("Please provide a title and message.");
      return;
    }

    if (!sendToAll && selectedRoles.length === 0 && selectedUserIds.length === 0) {
      alert("Select a target group (all, roles, or specific users).");
      return;
    }

    setIsSending(true);
    try {
      await sendAdminNotification({
        target: {
          all: sendToAll,
          roles: selectedRoles.length > 0 ? (selectedRoles as any) : undefined,
          userIds: selectedUserIds.length > 0 ? (selectedUserIds as any) : undefined,
        },
        title: title.trim(),
        message: message.trim(),
      });

      setTitle("");
      setMessage("");
      setSendToAll(false);
      setSelectedRoles([]);
      setSelectedUserIds([]);
      alert("Notification sent.");
    } catch (error) {
      console.error("Failed to send notification:", error);
      alert("Failed to send notification.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold">Notifications</h1>
        <p className="text-muted-foreground">
          Send announcements or updates to specific user groups.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Admin Broadcast
          </CardTitle>
          <CardDescription>
            Create a system message and target roles or specific users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Announcement title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write the notification message..."
              rows={5}
            />
          </div>

          <div className="space-y-3">
            <Label>Target Audience</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={sendToAll}
                onCheckedChange={(value) => setSendToAll(Boolean(value))}
                id="target-all"
              />
              <Label htmlFor="target-all" className="text-sm">
                Send to all users
              </Label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {roleOptions.map((role) => (
                <label key={role} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  <span className="capitalize">{role}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Target Specific Users (optional)</Label>
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <div className="max-h-[260px] overflow-auto rounded-md border p-3">
              {users === undefined ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No users found.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((u: Doc<"users">) => (
                    <label key={u._id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selectedUserIds.includes(u._id)}
                        onCheckedChange={() => toggleUser(u._id)}
                      />
                      <span className="font-medium">{u.name}</span>
                      <span className="text-muted-foreground">({u.email})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Button onClick={handleSend} disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Notification
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
