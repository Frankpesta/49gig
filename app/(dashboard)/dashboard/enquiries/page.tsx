"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
import { Mail, Send, Loader2, ChevronLeft, ChevronRight, Trash2, Clock, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";

const PAGE_SIZE = 20;

const CATEGORY_LABELS: Record<string, string> = {
  hiring: "Hiring Talent",
  freelancer: "Becoming a Freelancer",
  support: "Technical Support",
  billing: "Billing & Payments",
  partnership: "Partnership",
  other: "Other",
};

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  replied: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  closed: "bg-muted text-muted-foreground",
};

export default function EnquiriesPage() {
  const { user, isAuthenticated } = useAuth();
  const [page, setPage] = useState(0);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Id<"contactEnquiries"> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Id<"contactEnquiries"> | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignEnquiryId, setAssignEnquiryId] = useState<Id<"contactEnquiries"> | null>(null);
  const [assignModeratorPick, setAssignModeratorPick] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  const enquiries = useQuery(
    api.contactEnquiries.queries.getContactEnquiries,
    isAuthenticated && user?._id && (user?.role === "admin" || user?.role === "moderator")
      ? { userId: user._id }
      : "skip"
  );

  const replyMutation = useMutation(api.contactEnquiries.mutations.replyToContactEnquiry);
  const deleteMutation = useMutation(api.contactEnquiries.mutations.deleteContactEnquiry);
  const assignToModerator = useMutation(api.contactEnquiries.mutations.assignContactEnquiryToModerator);
  const sendReplyEmail = useAction(api.contactEnquiries.actions.sendContactEnquiryReplyEmail);

  const moderatorsForAssign = useQuery(
    api.users.queries.getAllUsersAdmin,
    isAuthenticated && user?.role === "admin" && user?._id
      ? { role: "moderator", status: "active", userId: user._id }
      : "skip"
  );

  if (!isAuthenticated || !user) {
    return <DashboardEmptyState icon={Mail} title="Please log in" iconTone="muted" />;
  }

  if (user.role !== "admin" && user.role !== "moderator") {
    return (
      <DashboardEmptyState
        icon={Clock}
        iconTone="muted"
        title="Access restricted"
        description="Only admins and moderators can access contact enquiries."
        action={<Button asChild><Link href="/dashboard">Back to Dashboard</Link></Button>}
      />
    );
  }

  if (enquiries === undefined) {
    return <DashboardLoadingState label="Loading enquiries" />;
  }

  const totalPages = Math.ceil(enquiries.length / PAGE_SIZE);
  const paginated = enquiries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const enquiryForReply = selectedEnquiry ? enquiries.find((e: Doc<"contactEnquiries">) => e._id === selectedEnquiry) : null;

  const handleReply = async () => {
    if (!selectedEnquiry || !replyMessage.trim() || !user) return;
    setIsReplying(true);
    try {
      await replyMutation({ enquiryId: selectedEnquiry, replyMessage: replyMessage.trim(), userId: user._id });
      await sendReplyEmail({ enquiryId: selectedEnquiry });
      toast.success("Reply sent successfully");
      setReplyMessage("");
      setSelectedEnquiry(null);
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setIsReplying(false);
    }
  };

  const moderatorNameById =
    moderatorsForAssign && user?.role === "admin"
      ? new Map<string, string>(
          moderatorsForAssign.map((m: { _id: string; name: string }) => [m._id, m.name])
        )
      : null;

  const handleDelete = async () => {
    if (!deleteTarget || !user) return;
    setIsDeleting(true);
    try {
      await deleteMutation({ enquiryId: deleteTarget, userId: user._id });
      toast.success("Enquiry deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete enquiry");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Contact Enquiries"
        description={
          user.role === "admin"
            ? "View all enquiries, assign moderators, and reply. Replies are emailed to the contact via Resend with Reply-To set to your work email."
            : "Enquiries assigned to you by an admin appear here. Replies are emailed to the contact via Resend with Reply-To set to your work email."
        }
        icon={Mail}
      />

      {/* Stats row */}
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5">
          <span className="font-semibold text-foreground">{enquiries.length}</span> total
        </span>
        <span className="rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5">
          <span className="font-semibold text-blue-600">{enquiries.filter((e: Doc<"contactEnquiries">) => e.status === "new").length}</span> new
        </span>
        <span className="rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5">
          <span className="font-semibold text-green-600">{enquiries.filter((e: Doc<"contactEnquiries">) => e.status === "replied").length}</span> replied
        </span>
      </div>

      {enquiries.length === 0 ? (
        <DashboardEmptyState
          icon={Mail}
          iconTone="muted"
          title={user.role === "moderator" ? "No enquiries assigned to you" : "No contact enquiries yet"}
          description={
            user.role === "moderator"
              ? "Ask an admin to assign new contact form messages to you. You will receive an email when a case is assigned."
              : undefined
          }
          className="py-10"
        />
      ) : (
        <>
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[180px]">From</TableHead>
                  <TableHead className="w-[120px]">Category</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="w-[90px]">Status</TableHead>
                  {user.role === "admin" && (
                    <TableHead className="w-[140px]">Assigned</TableHead>
                  )}
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((e: Doc<"contactEnquiries">) => (
                  <TableRow key={e._id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="font-medium text-sm truncate max-w-[160px]">{e.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[160px]">{e.email}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {CATEGORY_LABELS[e.category] ?? e.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium truncate max-w-[260px]">{e.subject}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[260px]">{e.message}</p>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[e.status] ?? "bg-muted text-muted-foreground"}`}>
                        {e.status}
                      </span>
                    </TableCell>
                    {user.role === "admin" && (
                      <TableCell className="text-xs text-muted-foreground">
                        {e.assignedModeratorId ? (
                          <span className="font-medium text-foreground">
                            {moderatorNameById?.get(e.assignedModeratorId) ?? "Moderator"}
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-500">Unassigned</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(e.createdAt, { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {user.role === "admin" && !e.assignedModeratorId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Assign moderator"
                            onClick={() => {
                              setAssignEnquiryId(e._id);
                              const first = moderatorsForAssign?.[0]?._id;
                              setAssignModeratorPick(first ? String(first) : "");
                            }}
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                          title="Reply"
                          onClick={() => { setSelectedEnquiry(e._id); setReplyMessage(e.replyMessage ?? ""); }}
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete"
                          onClick={() => setDeleteTarget(e._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, enquiries.length)} of {enquiries.length}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <span className="text-xs px-2">{page + 1} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Reply dialog */}
      <Dialog open={!!selectedEnquiry} onOpenChange={() => !isReplying && setSelectedEnquiry(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reply to enquiry</DialogTitle>
            <DialogDescription>
              {enquiryForReply && (
                <span>
                  Replying to <strong>{enquiryForReply.name}</strong> &lt;{enquiryForReply.email}&gt; — <em>{enquiryForReply.subject}</em>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {enquiryForReply && (
            <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground max-h-32 overflow-y-auto">
              {enquiryForReply.message}
            </div>
          )}
          <Textarea
            placeholder="Write your reply..."
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            rows={5}
            className="resize-none"
          />
          {enquiryForReply?.replyMessage && (
            <p className="text-xs text-muted-foreground">Previous reply: {enquiryForReply.replyMessage}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEnquiry(null)} disabled={isReplying}>Cancel</Button>
            <Button onClick={handleReply} disabled={!replyMessage.trim() || isReplying}>
              {isReplying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><Send className="mr-2 h-4 w-4" />Send Reply</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign moderator (admin) */}
      <Dialog
        open={!!assignEnquiryId}
        onOpenChange={(open) => {
          if (!open && !isAssigning) {
            setAssignEnquiryId(null);
            setAssignModeratorPick("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign to moderator</DialogTitle>
            <DialogDescription>
              The moderator receives an email with the enquiry details and a link to this page.
            </DialogDescription>
          </DialogHeader>
          {moderatorsForAssign === undefined ? (
            <p className="text-sm text-muted-foreground py-4">Loading moderators…</p>
          ) : moderatorsForAssign.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No active moderators found.</p>
          ) : (
            <div className="space-y-2 py-2">
              <Label htmlFor="enquiry-assign-mod">Moderator</Label>
              <Select value={assignModeratorPick} onValueChange={setAssignModeratorPick}>
                <SelectTrigger id="enquiry-assign-mod" className="w-full">
                  <SelectValue placeholder="Select a moderator" />
                </SelectTrigger>
                <SelectContent>
                  {moderatorsForAssign.map((m: { _id: string; name: string; email: string }) => (
                    <SelectItem key={m._id} value={m._id}>
                      {m.name} ({m.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isAssigning}
              onClick={() => {
                setAssignEnquiryId(null);
                setAssignModeratorPick("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={
                !assignEnquiryId ||
                !assignModeratorPick ||
                !user?._id ||
                moderatorsForAssign === undefined ||
                moderatorsForAssign.length === 0 ||
                isAssigning
              }
              onClick={async () => {
                if (!assignEnquiryId || !assignModeratorPick || !user?._id) return;
                setIsAssigning(true);
                try {
                  await assignToModerator({
                    enquiryId: assignEnquiryId,
                    moderatorId: assignModeratorPick as Id<"users">,
                    userId: user._id,
                  });
                  toast.success("Moderator assigned — they have been emailed.");
                  setAssignEnquiryId(null);
                  setAssignModeratorPick("");
                } catch (err) {
                  toast.error(getUserFriendlyError(err) || "Could not assign");
                } finally {
                  setIsAssigning(false);
                }
              }}
            >
              {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => !isDeleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete enquiry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the enquiry from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
