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
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  if (user.role !== "admin" && user.role !== "moderator") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Only admins and moderators can access contact enquiries.
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const enquiry = selectedEnquiry && enquiries?.find((e: Doc<"contactEnquiries">) => e._id === selectedEnquiry);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Contact Enquiries</h1>
        <p className="text-muted-foreground mt-1">
          View and reply to enquiries from the public contact form.
        </p>
      </div>

      {enquiries === undefined ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : enquiries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No contact enquiries yet.</p>
          </CardContent>
        </Card>
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
