"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { Headphones, Search, CheckCircle2, Clock, Inbox, UserPlus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";

type SupportChat = {
  _id: Id<"chats">;
  title?: string;
  status: string;
  lastMessageAt?: number;
  lastMessagePreview?: string;
  openerName?: string | null;
  openerRole?: string | null;
  openerEmail?: string | null;
  supportAssignedModeratorId?: Id<"users">;
  assignedModeratorName?: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  archived: "bg-muted text-muted-foreground",
  deleted: "bg-muted text-muted-foreground",
};

function formatChatListTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfMsg.getTime()) / 86400000
  );
  if (diffDays === 0) {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function SupportInboxPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "resolved">("all");
  const [assignChatId, setAssignChatId] = useState<Id<"chats"> | null>(null);
  const [assignModeratorId, setAssignModeratorId] = useState<string>("");

  const supportChats = useQuery(
    api.chat.queries.getSupportChatsForAdmin,
    isAuthenticated && user?._id ? { userId: user._id } : "skip"
  );

  const moderatorsForAssign = useQuery(
    api.users.queries.getAllUsersAdmin,
    isAuthenticated && user?.role === "admin" && user?._id
      ? { role: "moderator", status: "active", userId: user._id }
      : "skip"
  );

  const assignSupportModerator = useMutation(
    api.chat.mutations.assignSupportChatModerator
  );

  const assignTarget = useMemo(() => {
    if (!assignChatId || !supportChats) return null;
    return (supportChats as SupportChat[]).find((c) => c._id === assignChatId) ?? null;
  }, [assignChatId, supportChats]);

  if (!isAuthenticated || !user) {
    return <DashboardEmptyState icon={Headphones} title="Please log in" iconTone="muted" />;
  }

  if (user.role !== "admin" && user.role !== "moderator") {
    return (
      <DashboardEmptyState
        icon={Headphones}
        iconTone="muted"
        title="Access restricted"
        description="Only admins and moderators can access the support inbox."
        action={
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        }
      />
    );
  }

  if (supportChats === undefined) {
    return <DashboardLoadingState label="Loading support inbox" />;
  }

  const chats = supportChats as SupportChat[];
  const total = chats.length;
  const openCount = chats.filter((c) => c.status === "active").length;
  const resolvedCount = chats.filter((c) => c.status !== "active").length;

  const filtered = chats.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      [c.title, c.lastMessagePreview, c.openerName, c.openerEmail, c.assignedModeratorName]
        .some((val) => val?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && c.status === "active") ||
      (statusFilter === "resolved" && c.status !== "active");
    return matchesSearch && matchesStatus;
  });

  const isAdmin = user.role === "admin";

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Support Inbox"
        description="Support requests from clients and freelancers."
        icon={Headphones}
      />

      <div className="grid gap-2 sm:grid-cols-3">
        <Card className="rounded-xl border-border/60 shadow-none">
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <div className="rounded-full bg-primary/10 p-2.5 text-primary">
              <Inbox className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Total
              </p>
              <p className="text-lg font-semibold leading-tight">{total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/60 shadow-none">
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <div className="rounded-full bg-amber-500/15 p-2.5 text-amber-700 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Open
              </p>
              <p className="text-lg font-semibold leading-tight">{openCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/60 shadow-none">
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <div className="rounded-full bg-emerald-500/15 p-2.5 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Resolved
              </p>
              <p className="text-lg font-semibold leading-tight">{resolvedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative min-w-0 flex-1 basis-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search subject, user, moderator…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 rounded-xl border-border/80 pl-10 shadow-none"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "active", "resolved"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
              className="h-9 capitalize rounded-lg"
            >
              {s === "active" ? "Open" : s === "resolved" ? "Resolved" : "All"}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <DashboardEmptyState
          icon={Headphones}
          iconTone="muted"
          title="No support chats found"
          description={
            searchQuery ? "No chats match your search." : "No support requests yet."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          {filtered.map((chat) => {
            const preview =
              chat.lastMessagePreview?.trim() || "No messages yet";
            const openedBy = chat.openerName
              ? `${chat.openerName} · ${chat.openerRole ?? "user"}`
              : "Unknown user";

            return (
              <div
                key={chat._id}
                className="flex border-b border-border/60 last:border-b-0"
              >
                <Link
                  href={`/dashboard/chat/support/${chat._id}`}
                  className={cn(
                    "flex min-w-0 flex-1 gap-3 px-3 py-3 transition-colors",
                    "hover:bg-muted/70 active:bg-muted"
                  )}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-sm font-semibold text-teal-700 dark:text-teal-300">
                    S
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="min-w-0 truncate text-[15px] font-semibold leading-tight">
                        {chat.title || "Support request"}
                      </h3>
                      {chat.lastMessageAt != null && (
                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                          {formatChatListTime(chat.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                      {preview}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLES[chat.status] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {chat.status === "active" ? "Open" : "Resolved"}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        {openedBy}
                      </span>
                      {chat.assignedModeratorName ? (
                        <span className="text-[11px] font-medium text-primary/90 truncate">
                          → {chat.assignedModeratorName}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </div>
                    {chat.lastMessageAt != null && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Active {formatDistanceToNow(chat.lastMessageAt, { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </Link>
                {isAdmin && chat.status === "active" ? (
                  <div className="flex shrink-0 items-center border-l border-border/60 bg-muted/20 px-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 gap-1 rounded-lg px-2 text-xs"
                      onClick={(e) => {
                        e.preventDefault();
                        setAssignChatId(chat._id);
                        const first = moderatorsForAssign?.[0]?._id;
                        setAssignModeratorId(
                          chat.supportAssignedModeratorId
                            ? String(chat.supportAssignedModeratorId)
                            : first
                              ? String(first)
                              : ""
                        );
                      }}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Assign
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={!!assignChatId}
        onOpenChange={(open) => {
          if (!open) {
            setAssignChatId(null);
            setAssignModeratorId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign to moderator</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {assignTarget?.title
                ? `Thread: ${assignTarget.title}`
                : "Pick a moderator for this support thread."}
            </p>
          </DialogHeader>
          {moderatorsForAssign === undefined ? (
            <p className="text-sm text-muted-foreground">Loading moderators…</p>
          ) : moderatorsForAssign.length === 0 ? (
            <p className="text-sm text-destructive">No active moderators found.</p>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="support-assign-mod">Moderator</Label>
              <Select value={assignModeratorId} onValueChange={setAssignModeratorId}>
                <SelectTrigger id="support-assign-mod" className="w-full">
                  <SelectValue placeholder="Select moderator" />
                </SelectTrigger>
                <SelectContent>
                  {moderatorsForAssign.map((m: { _id: string; name: string; email: string }) => (
                    <SelectItem key={m._id} value={String(m._id)}>
                      {m.name} ({m.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAssignChatId(null);
                setAssignModeratorId("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                !assignChatId ||
                !assignModeratorId ||
                moderatorsForAssign === undefined ||
                moderatorsForAssign.length === 0
              }
              onClick={async () => {
                if (!assignChatId || !assignModeratorId || !user?._id) return;
                try {
                  await assignSupportModerator({
                    chatId: assignChatId,
                    moderatorId: assignModeratorId as Id<"users">,
                    userId: user._id,
                  });
                  toast.success("Support chat assigned.");
                  setAssignChatId(null);
                  setAssignModeratorId("");
                } catch (e) {
                  toast.error(getUserFriendlyError(e) || "Could not assign");
                }
              }}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
