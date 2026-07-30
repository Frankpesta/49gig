"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Mail, Send, Loader2, Users, User, Briefcase, Search, ChevronsUpDown, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { Id } from "@/convex/_generated/dataModel";

type RecipientType = "all" | "clients" | "freelancers" | "individual";

export default function SendEmailPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user?.role === "moderator") router.replace("/dashboard");
  }, [isAuthenticated, user?.role, router]);
  const [recipientType, setRecipientType] = useState<RecipientType>("all");
  const [recipientUserId, setRecipientUserId] = useState<Id<"users"> | "">("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  const counts = useQuery(
    api.users.queries.getBroadcastRecipientCounts,
    isAuthenticated && user?._id && user.role === "admin" ? { userId: user._id } : "skip"
  );

  const users = useQuery(
    api.users.queries.getAllUsersAdmin,
    isAuthenticated && user?._id && user.role === "admin" ? { userId: user._id } : "skip"
  );

  const sendEmail = useAction(api.email.actions.sendAdminBroadcastEmail);

  const handleSend = async () => {
    if (!user?._id || !subject.trim() || !body.trim()) {
      toast.error("Please fill in subject and message");
      return;
    }
    if (recipientType === "individual" && !recipientUserId) {
      toast.error("Please select a recipient");
      return;
    }
    setIsSending(true);
    try {
      const individualRecipientId =
        recipientType === "individual" && recipientUserId !== ""
          ? recipientUserId
          : undefined;
      const result = await sendEmail({
        adminUserId: user._id,
        recipientType,
        recipientUserId: individualRecipientId,
        subject: subject.trim(),
        body: body.trim(),
      });
      toast.success(result.message || `Email sent to ${result.sent} recipient(s)`);
      setSubject("");
      setBody("");
      setRecipientUserId("");
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  if (!isAuthenticated || !user) {
    return <DashboardEmptyState icon={Mail} title="Please log in" iconTone="muted" />;
  }

  if (user.role !== "admin") {
    return (
      <DashboardEmptyState
        icon={Mail}
        iconTone="muted"
        title="Access restricted"
        description="Only admins can send platform emails."
        action={
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        }
      />
    );
  }

  const usersList = users && Array.isArray(users) ? users : [];
  const emailedUsers = usersList.filter((u: { email?: string }) => u.email) as {
    _id: Id<"users">;
    name: string;
    email: string;
    role: string;
  }[];
  const selectedUser = emailedUsers.find((u) => u._id === recipientUserId);
  const filteredUsers = (() => {
    const query = userSearchQuery.trim().toLowerCase();
    if (!query) return emailedUsers;
    return emailedUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
    );
  })();

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Send Email"
        description="Send emails to platform users. Choose everyone, clients only, freelancers only, or a specific individual."
        icon={Mail}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Compose email
          </CardTitle>
          <CardDescription>
            Emails are sent from 49GIG and use the standard platform layout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Recipients</Label>
            <Select
              value={recipientType}
              onValueChange={(v) => {
                setRecipientType(v as RecipientType);
                setRecipientUserId("");
              }}
            >
              <SelectTrigger className="w-full sm:max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Everyone ({counts?.all ?? "—"} users)
                  </span>
                </SelectItem>
                <SelectItem value="clients">
                  <span className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Clients only ({counts?.clients ?? "—"})
                  </span>
                </SelectItem>
                <SelectItem value="freelancers">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Freelancers only ({counts?.freelancers ?? "—"})
                  </span>
                </SelectItem>
                <SelectItem value="individual">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Individual user
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recipientType === "individual" && (
            <div className="space-y-2">
              <Label>Select user</Label>
              <Popover
                open={userSearchOpen}
                onOpenChange={(open) => {
                  setUserSearchOpen(open);
                  if (!open) setUserSearchQuery("");
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={userSearchOpen}
                    className="w-full sm:max-w-md justify-between font-normal"
                  >
                    <span className={selectedUser ? "" : "text-muted-foreground"}>
                      {selectedUser
                        ? `${selectedUser.name} (${selectedUser.email}) — ${selectedUser.role}`
                        : "Choose a user..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0 sm:max-w-md"
                  align="start"
                >
                  <div className="flex items-center gap-2 border-b px-3 py-2">
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                      autoFocus
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search by name or email..."
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1">
                    {filteredUsers.length === 0 ? (
                      <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                        No users found
                      </p>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() => {
                            setRecipientUserId(u._id);
                            setUserSearchOpen(false);
                            setUserSearchQuery("");
                          }}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                          <Check
                            className={`h-4 w-4 shrink-0 ${u._id === recipientUserId ? "opacity-100" : "opacity-0"}`}
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {u.name} ({u.email}) — {u.role}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="max-w-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              placeholder="Write your message. Plain text is supported."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="max-w-xl resize-y"
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={isSending || !subject.trim() || !body.trim() || (recipientType === "individual" && !recipientUserId)}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send email
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
