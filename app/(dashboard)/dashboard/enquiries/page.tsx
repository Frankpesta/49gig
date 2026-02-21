"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Send, Loader2, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";

const CATEGORY_LABELS: Record<string, string> = {
  hiring: "Hiring Talent",
  freelancer: "Becoming a Freelancer",
  support: "Technical Support",
  billing: "Billing & Payments",
  partnership: "Partnership Opportunities",
  other: "Other",
};

export default function EnquiriesPage() {
  const { user, isAuthenticated } = useAuth();
  const [selectedEnquiry, setSelectedEnquiry] = useState<Id<"contactEnquiries"> | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const enquiries = useQuery(
    api.contactEnquiries.queries.getContactEnquiries,
    isAuthenticated && (user?.role === "admin" || user?.role === "moderator") ? {} : "skip"
  );
  const replyMutation = useMutation(api.contactEnquiries.mutations.replyToContactEnquiry);
  const sendReplyEmail = useAction(api.contactEnquiries.actions.sendContactEnquiryReplyEmail);

  const handleReply = async () => {
    if (!selectedEnquiry || !replyMessage.trim()) return;
    setIsReplying(true);
    try {
      await replyMutation({ enquiryId: selectedEnquiry, replyMessage: replyMessage.trim() });
      await sendReplyEmail({ enquiryId: selectedEnquiry });
      setReplyMessage("");
      setSelectedEnquiry(null);
    } catch (error) {
      console.error("Failed to reply:", error);
    } finally {
      setIsReplying(false);
    }
  };

  if (!isAuthenticated || !user) {
    return <DashboardEmptyState icon={Mail} title="Please log in" />;
  }

  if (user.role !== "admin" && user.role !== "moderator") {
    return (
      <DashboardEmptyState
        icon={Clock}
        title="Access restricted"
        description="Only admins and moderators can access contact enquiries."
        action={
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        }
      />
    );
  }

  const enquiry = selectedEnquiry && enquiries?.find((e: Doc<"contactEnquiries">) => e._id === selectedEnquiry);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Contact Enquiries"
        description="View and reply to enquiries from the public contact form."
      />

      {enquiries === undefined ? (
        <DashboardLoadingState label="Loading enquiries..." className="min-h-[180px]" />
      ) : enquiries.length === 0 ? (
        <DashboardEmptyState
          icon={Mail}
          title="No contact enquiries yet"
          className="py-10"
        />
      ) : (
        <div className="space-y-4">
          {enquiries.map((e: Doc<"contactEnquiries">) => (
            <Card key={e._id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{e.subject}</CardTitle>
                    <CardDescription>
                      {e.name} &lt;{e.email}&gt; · {CATEGORY_LABELS[e.category] || e.category}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={e.status === "new" ? "default" : "secondary"}>
                      {e.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(e.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm whitespace-pre-wrap">{e.message}</p>
                {e.replyMessage && (
                  <div className="rounded-lg bg-muted/50 p-4 text-sm">
                    <p className="font-medium mb-2">Your reply:</p>
                    <p className="whitespace-pre-wrap text-muted-foreground">{e.replyMessage}</p>
                  </div>
                )}
                {e.status === "new" && (
                  <Button
                    size="sm"
                    onClick={() => setSelectedEnquiry(e._id)}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Reply via Email
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedEnquiry} onOpenChange={() => !isReplying && setSelectedEnquiry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to enquiry</DialogTitle>
            <DialogDescription>
              Your reply will be sent to {enquiry?.email}. The enquirer can respond directly to that
              email.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Write your reply..."
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEnquiry(null)} disabled={isReplying}>
              Cancel
            </Button>
            <Button onClick={handleReply} disabled={!replyMessage.trim() || isReplying}>
              {isReplying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Reply
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
