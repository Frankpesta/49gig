"use client";

import { useState } from "react";
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
import { Mail, Send, Loader2, Users, User, Briefcase } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { Id } from "@/convex/_generated/dataModel";

type RecipientType = "all" | "clients" | "freelancers" | "individual";

export default function SendEmailPage() {
  const { user, isAuthenticated } = useAuth();
  const [recipientType, setRecipientType] = useState<RecipientType>("all");
  const [recipientUserId, setRecipientUserId] = useState<Id<"users"> | "">("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const counts = useQuery(
    api.users.queries.getBroadcastRecipientCounts,
    isAuthenticated && user?._id && (user.role === "admin" || user.role === "moderator")
      ? { userId: user._id }
      : "skip"
  );

  const users = useQuery(
    api.users.queries.getAllUsersAdmin,
    isAuthenticated && user?._id && (user.role === "admin" || user.role === "moderator")
      ? { userId: user._id }
      : "skip"
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
      const result = await sendEmail({
        adminUserId: user._id,
        recipientType,
        recipientUserId: recipientType === "individual" ? recipientUserId : undefined,
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

  if (user.role !== "admin" && user.role !== "moderator") {
    return (
      <DashboardEmptyState
        icon={Mail}
        iconTone="muted"
        title="Access restricted"
        description="Only admins and moderators can send platform emails."
        action={
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        }
      />
    );
  }

  const usersList = users && Array.isArray(users) ? users : [];

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
              <Select
                value={recipientUserId || "none"}
                onValueChange={(v) => setRecipientUserId(v === "none" ? "" : (v as Id<"users">))}
              >
                <SelectTrigger className="w-full sm:max-w-md">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Select user —</SelectItem>
                  {usersList
                    .filter((u: { email?: string }) => u.email)
                    .map((u: { _id: Id<"users">; name: string; email: string; role: string }) => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.name} ({u.email}) — {u.role}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
