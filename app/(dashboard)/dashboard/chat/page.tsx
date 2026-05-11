"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import {
  MessageSquare,
  Search,
  Plus,
  Sparkles,
  Headphones,
  Users,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChatWithUnread = Doc<"chats"> & { unreadCount?: number };

type ProjectChatRow = ChatWithUnread & {
  clientName?: string | null;
  freelancerName?: string | null;
};

/** WhatsApp-style time: time today, Yesterday, weekday, or short date */
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

function avatarInitials(title: string | undefined, chatType: string) {
  const t = (title || "").replace(/^Project:\s*/i, "").trim();
  if (!t) {
    return chatType === "support" ? "S" : chatType === "system" ? "•" : "C";
  }
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0] ?? "";
    const b = parts[1][0] ?? "";
    return (a + b).toUpperCase().slice(0, 2);
  }
  return t.slice(0, 2).toUpperCase();
}

function avatarTone(chatType: string) {
  if (chatType === "support")
    return "bg-teal-500/15 text-teal-700 dark:text-teal-300";
  if (chatType === "system")
    return "bg-violet-500/15 text-violet-700 dark:text-violet-300";
  return "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300";
}

function UserChatListRow({ chat }: { chat: ChatWithUnread }) {
  const unread = chat.unreadCount ?? 0;
  const preview =
    chat.lastMessagePreview?.trim() || "No messages yet";
  const href =
    chat.type === "support"
      ? `/dashboard/chat/support/${chat._id}`
      : `/dashboard/chat/${chat._id}`;
  const supportResolved =
    chat.type === "support" &&
    ((chat.supportResolvedAt != null && chat.supportResolvedAt > 0) ||
      chat.status === "archived");

  return (
    <Link
      href={href}
      className={cn(
        "flex gap-3 px-3 py-3 transition-colors border-b border-border/60",
        "hover:bg-muted/70 active:bg-muted",
        unread > 0 && "bg-muted/30"
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
          avatarTone(chat.type)
        )}
      >
        {avatarInitials(chat.title, chat.type)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h3
              className={cn(
                "min-w-0 truncate text-[15px] leading-tight",
                unread > 0 ? "font-semibold" : "font-medium"
              )}
            >
              {chat.title || "Chat"}
            </h3>
            {supportResolved ? (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-950/45 dark:text-amber-100">
                Resolved
              </span>
            ) : null}
          </div>
          {chat.lastMessageAt != null && (
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {formatChatListTime(chat.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={cn(
              "min-w-0 flex-1 truncate text-[13px] leading-snug",
              unread > 0
                ? "text-foreground/90"
                : "text-muted-foreground"
            )}
          >
            {chat.type === "support" && (
              <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Support
              </span>
            )}
            {preview}
          </p>
          {unread > 0 ? (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

type MessagesInboxTab = "project" | "support" | "enquiries";

const TAB_LABELS: Record<MessagesInboxTab, string> = {
  project: "Project",
  support: "Support ticket",
  enquiries: "Enquiries",
};

const ENQUIRY_CATEGORY_LABELS: Record<string, string> = {
  hiring: "Hiring Talent",
  freelancer: "Becoming a Freelancer",
  support: "Technical Support",
  billing: "Billing & Payments",
  partnership: "Partnership",
  other: "Other",
};

const ENQUIRY_STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  replied:
    "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
  closed: "bg-muted text-muted-foreground",
};

function MessagesCategoryTabs({
  active,
  onChange,
  counts,
}: {
  active: MessagesInboxTab;
  onChange: (t: MessagesInboxTab) => void;
  counts: Record<MessagesInboxTab, number>;
}) {
  const keys: MessagesInboxTab[] = ["project", "support", "enquiries"];
  return (
    <div
      role="tablist"
      aria-label="Message categories"
      className="flex gap-1 rounded-xl border border-border/60 bg-muted/30 p-1"
    >
      {keys.map((key) => {
        const selected = active === key;
        const count = counts[key];
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(key)}
            className={cn(
              "relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-center text-xs font-medium transition-colors sm:flex-row sm:justify-center sm:gap-1.5 sm:px-3 sm:text-sm",
              selected
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="truncate">{TAB_LABELS[key]}</span>
            {count > 0 ? (
              <span
                className={cn(
                  "inline-flex min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums sm:text-[11px]",
                  selected
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

type StaffSupportChatRow = Doc<"chats"> & {
  openerName?: string | null;
  openerEmail?: string | null;
  openerRole?: string | null;
  assignedModeratorName?: string | null;
};

function StaffSupportChatListRow({ chat }: { chat: StaffSupportChatRow }) {
  const preview =
    chat.lastMessagePreview?.trim() ||
    chat.openerName ||
    chat.openerEmail?.trim() ||
    "No messages yet";
  const supportResolved =
    (chat.supportResolvedAt != null && chat.supportResolvedAt > 0) ||
    chat.status === "archived";
  const sub =
    [chat.openerName, chat.assignedModeratorName ? `Assigned: ${chat.assignedModeratorName}` : null]
      .filter(Boolean)
      .join(" · ") || null;

  return (
    <Link
      href={`/dashboard/chat/support/${chat._id}`}
      className={cn(
        "flex gap-3 px-3 py-3 transition-colors border-b border-border/60",
        "hover:bg-muted/70 active:bg-muted"
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
          avatarTone("support")
        )}
      >
        {avatarInitials(chat.title, "support")}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h3 className="min-w-0 truncate text-[15px] font-medium leading-tight">
              {chat.title || "Support"}
            </h3>
            {supportResolved ? (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-950/45 dark:text-amber-100">
                Resolved
              </span>
            ) : null}
          </div>
          {chat.lastMessageAt != null && (
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {formatChatListTime(chat.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 truncate text-[13px] leading-snug text-muted-foreground">
            <span className="mr-1 text-[11px] font-medium uppercase tracking-wide">
              Support
            </span>
            {preview}
          </p>
        </div>
        {sub ? (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{sub}</p>
        ) : null}
      </div>
    </Link>
  );
}

function EnquiryPreviewRow({ enquiry }: { enquiry: Doc<"contactEnquiries"> }) {
  const cat =
    ENQUIRY_CATEGORY_LABELS[enquiry.category] ?? enquiry.category ?? "General";
  const ts = enquiry.updatedAt ?? enquiry.createdAt;

  return (
    <Link
      href="/dashboard/enquiries"
      className={cn(
        "flex gap-3 px-3 py-3 transition-colors border-b border-border/60",
        "hover:bg-muted/70 active:bg-muted"
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-sm font-semibold text-violet-800 dark:text-violet-300">
        <Mail className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="min-w-0 truncate text-[15px] font-medium leading-tight">
            {enquiry.subject}
          </h3>
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {formatChatListTime(ts)}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
              ENQUIRY_STATUS_STYLES[enquiry.status] ?? ENQUIRY_STATUS_STYLES.closed
            )}
          >
            {enquiry.status}
          </span>
          <span className="truncate text-[12px] text-muted-foreground">{cat}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted-foreground">
          {enquiry.message.trim()}
        </p>
      </div>
    </Link>
  );
}

function ProjectChatListRow({ chat }: { chat: ProjectChatRow }) {
  const unread = chat.unreadCount ?? 0;
  const subtitle = [chat.clientName, chat.freelancerName]
    .filter(Boolean)
    .join(" · ");
  const preview =
    chat.lastMessagePreview?.trim() ||
    subtitle ||
    "No messages yet";

  return (
    <Link
      href={`/dashboard/chat/${chat._id}`}
      className={cn(
        "flex gap-3 px-3 py-3 transition-colors border-b border-border/60",
        "hover:bg-muted/70 active:bg-muted",
        unread > 0 && "bg-muted/30"
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
          avatarTone("project")
        )}
      >
        {avatarInitials(chat.title, "project")}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3
            className={cn(
              "min-w-0 truncate text-[15px] leading-tight",
              unread > 0 ? "font-semibold" : "font-medium"
            )}
          >
            {(chat.title || "Project chat").replace(/^Project:\s*/i, "").trim() ||
              chat.title ||
              "Project chat"}
          </h3>
          {chat.lastMessageAt != null && (
            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {formatChatListTime(chat.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={cn(
              "min-w-0 flex-1 truncate text-[13px] leading-snug",
              unread > 0
                ? "text-foreground/90"
                : "text-muted-foreground"
            )}
          >
            {preview}
          </p>
          {unread > 0 ? (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export default function ChatPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [messagesTab, setMessagesTab] = useState<MessagesInboxTab>("project");

  const chats = useQuery(
    api.chat.queries.getChats,
    isAuthenticated && user?._id ? { userId: user._id } : "skip"
  );

  const projectChatsForAdmin = useQuery(
    api.chat.queries.getProjectChatsForAdmin,
    isAuthenticated &&
      user?._id &&
      (user.role === "admin" || user.role === "moderator")
      ? { userId: user._id }
      : "skip"
  );

  const supportChatsForStaff = useQuery(
    api.chat.queries.getSupportChatsForAdmin,
    isAuthenticated &&
      user?._id &&
      (user.role === "admin" || user.role === "moderator")
      ? { userId: user._id }
      : "skip"
  );

  const contactEnquiriesStaff = useQuery(
    api.contactEnquiries.queries.getContactEnquiries,
    isAuthenticated &&
      user?._id &&
      (user.role === "admin" || user.role === "moderator")
      ? { userId: user._id }
      : "skip"
  );

  const unreadCount = useQuery(
    api.chat.queries.getUnreadCount,
    isAuthenticated && user?._id ? { userId: user._id } : "skip"
  );

  const isAdminOrModerator =
    user?.role === "admin" || user?.role === "moderator";

  const adminChatsRaw = useMemo(
    () => (projectChatsForAdmin ?? []) as ProjectChatRow[],
    [projectChatsForAdmin]
  );

  const supportChatsRaw = useMemo(
    () => (supportChatsForStaff ?? []) as StaffSupportChatRow[],
    [supportChatsForStaff]
  );

  const enquiriesRaw = useMemo(
    (): Doc<"contactEnquiries">[] =>
      (contactEnquiriesStaff ?? []) as Doc<"contactEnquiries">[],
    [contactEnquiriesStaff]
  );

  const adminChatsFiltered = useMemo(() => {
    if (!searchQuery.trim()) return adminChatsRaw;
    const q = searchQuery.toLowerCase();
    return adminChatsRaw.filter(
      (c) =>
        (c.title?.toLowerCase().includes(q) ?? false) ||
        (c.lastMessagePreview?.toLowerCase().includes(q) ?? false) ||
        (c.clientName?.toLowerCase().includes(q) ?? false) ||
        (c.freelancerName?.toLowerCase().includes(q) ?? false)
    );
  }, [adminChatsRaw, searchQuery]);

  const adminSupportFiltered = useMemo(() => {
    if (!searchQuery.trim()) return supportChatsRaw;
    const q = searchQuery.toLowerCase();
    return supportChatsRaw.filter(
      (c) =>
        (c.title?.toLowerCase().includes(q) ?? false) ||
        (c.lastMessagePreview?.toLowerCase().includes(q) ?? false) ||
        (c.openerName?.toLowerCase().includes(q) ?? false) ||
        (c.openerEmail?.toLowerCase().includes(q) ?? false) ||
        (c.assignedModeratorName?.toLowerCase().includes(q) ?? false)
    );
  }, [supportChatsRaw, searchQuery]);

  const adminEnquiriesFiltered = useMemo(() => {
    if (!searchQuery.trim()) return enquiriesRaw;
    const q = searchQuery.toLowerCase();
    return enquiriesRaw.filter(
      (e) =>
        e.subject.toLowerCase().includes(q) ||
        e.message.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.category?.toLowerCase().includes(q) ?? false)
    );
  }, [enquiriesRaw, searchQuery]);

  const adminTabCounts = useMemo(
    () => ({
      project: adminChatsRaw.length,
      support: supportChatsRaw.length,
      enquiries: enquiriesRaw.length,
    }),
    [adminChatsRaw.length, enquiriesRaw.length, supportChatsRaw.length]
  );

  const userChatsFiltered = useMemo(() => {
    const list = (chats ?? []) as ChatWithUnread[];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (c) =>
        (c.title?.toLowerCase().includes(q) ?? false) ||
        (c.lastMessagePreview?.toLowerCase().includes(q) ?? false)
    );
  }, [chats, searchQuery]);

  const userTabFiltered = useMemo(() => {
    return userChatsFiltered.filter((c) => {
      if (messagesTab === "project") return c.type === "project";
      if (messagesTab === "support") return c.type === "support";
      return c.type === "system";
    });
  }, [messagesTab, userChatsFiltered]);

  const userTabCounts = useMemo(() => {
    const list = (chats ?? []) as ChatWithUnread[];
    return {
      project: list.filter((c) => c.type === "project").length,
      support: list.filter((c) => c.type === "support").length,
      enquiries: list.filter((c) => c.type === "system").length,
    };
  }, [chats]);

  if (!isAuthenticated || !user) {
    return (
      <DashboardEmptyState
        icon={MessageSquare}
        title="Please log in to view chats"
        iconTone="muted"
      />
    );
  }

  if (chats === undefined) {
    return <DashboardLoadingState label="Loading" />;
  }

  if (isAdminOrModerator) {
    const totalProject = adminChatsRaw.length;
    const activeProject = adminChatsRaw.filter((c) => c.status === "active")
      .length;

    const adminSearchPlaceholder =
      messagesTab === "project"
        ? "Search by project, client, or freelancer…"
        : messagesTab === "support"
          ? "Search support tickets…"
          : "Search contact enquiries…";

    const tabListLoading =
      (messagesTab === "project" && projectChatsForAdmin === undefined) ||
      (messagesTab === "support" && supportChatsForStaff === undefined) ||
      (messagesTab === "enquiries" && contactEnquiriesStaff === undefined);

    let body: ReactNode;
    if (tabListLoading) {
      body = (
        <DashboardLoadingState
          label={
            messagesTab === "project"
              ? "Loading project chats"
              : messagesTab === "support"
                ? "Loading support tickets"
                : "Loading enquiries"
          }
        />
      );
    } else if (messagesTab === "project") {
      if (adminChatsRaw.length === 0) {
        body = (
          <DashboardEmptyState
            icon={MessageSquare}
            iconTone="muted"
            title="No project chats yet"
          />
        );
      } else if (adminChatsFiltered.length === 0) {
        body = (
          <DashboardEmptyState
            icon={MessageSquare}
            iconTone="muted"
            title="No matches"
            description="Try a different search."
          />
        );
      } else {
        body = (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
            {adminChatsFiltered.map((chat) => (
              <ProjectChatListRow key={chat._id} chat={chat} />
            ))}
          </div>
        );
      }
    } else if (messagesTab === "support") {
      if (supportChatsRaw.length === 0) {
        body = (
          <DashboardEmptyState
            icon={Headphones}
            iconTone="muted"
            title="No support tickets"
            description="Support conversations will appear here. Use Support Inbox for triage tools."
            action={
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/dashboard/support-inbox">Open Support Inbox</Link>
              </Button>
            }
          />
        );
      } else if (adminSupportFiltered.length === 0) {
        body = (
          <DashboardEmptyState
            icon={MessageSquare}
            iconTone="muted"
            title="No matches"
            description="Try a different search."
          />
        );
      } else {
        body = (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
            {adminSupportFiltered.map((chat) => (
              <StaffSupportChatListRow key={chat._id} chat={chat} />
            ))}
          </div>
        );
      }
    } else if (enquiriesRaw.length === 0) {
      body = (
        <DashboardEmptyState
          icon={Mail}
          iconTone="muted"
          title="No contact enquiries"
          description="Submissions from the public contact form will show here when they arrive."
        />
      );
    } else if (adminEnquiriesFiltered.length === 0) {
      body = (
        <DashboardEmptyState
          icon={MessageSquare}
          iconTone="muted"
          title="No matches"
          description="Try a different search."
        />
      );
    } else {
      body = (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          {adminEnquiriesFiltered.map((enquiry) => (
            <EnquiryPreviewRow key={enquiry._id} enquiry={enquiry} />
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4 animate-in fade-in-50 duration-300">
        <DashboardPageHeader
          title="Messages"
          description="Project chats, support tickets, and contact enquiries."
          icon={MessageSquare}
          actions={
            <Button asChild variant="outline" className="shrink-0 rounded-xl">
              <Link href="/dashboard/support-inbox" className="flex items-center gap-2">
                <Headphones className="h-4 w-4" />
                Support Inbox
              </Link>
            </Button>
          }
        />

        {messagesTab === "project" ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <Card className="rounded-xl border-border/60 shadow-none">
              <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                <div className="rounded-full bg-primary/10 p-2.5 text-primary">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Total
                  </p>
                  <p className="text-lg font-semibold leading-tight">{totalProject}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-border/60 shadow-none">
              <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                <div className="rounded-full bg-emerald-500/15 p-2.5 text-emerald-700 dark:text-emerald-400">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Active
                  </p>
                  <p className="text-lg font-semibold leading-tight">{activeProject}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-border/60 shadow-none">
              <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                <div className="rounded-full bg-amber-500/15 p-2.5 text-amber-700 dark:text-amber-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Unread (all)
                  </p>
                  <p className="text-lg font-semibold leading-tight">
                    {unreadCount ?? 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={adminSearchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 rounded-xl border-border/80 pl-10 shadow-none"
          />
        </div>

        <MessagesCategoryTabs
          active={messagesTab}
          onChange={setMessagesTab}
          counts={adminTabCounts}
        />

        {body}
      </div>
    );
  }

  const userSearchPlaceholder =
    messagesTab === "project"
      ? "Search projects…"
      : messagesTab === "support"
        ? "Search support…"
        : "Search enquiries…";

  let userTabBody: ReactNode = null;

  if ((chats ?? []).length > 0 && userChatsFiltered.length === 0) {
    userTabBody = (
      <DashboardEmptyState
        icon={MessageSquare}
        iconTone="muted"
        title="No matches"
        description="No chats match your search."
      />
    );
  } else if ((chats ?? []).length > 0 && userTabFiltered.length === 0) {
    if (messagesTab === "enquiries") {
      userTabBody = (
        <DashboardEmptyState
          icon={Mail}
          iconTone="muted"
          title="No enquiry threads"
          description="Contact form enquiries are reviewed by our team. To send one, visit the contact page."
          action={
            <Button asChild className="rounded-xl">
              <Link href="/contact">Contact us</Link>
            </Button>
          }
        />
      );
    } else if (messagesTab === "support") {
      userTabBody = (
        <DashboardEmptyState
          icon={Headphones}
          iconTone="muted"
          title="No support tickets"
          description="When you reach out via support chat, conversations appear here."
          action={
            <Button asChild className="rounded-xl">
              <Link href="/dashboard/chat/support">New support chat</Link>
            </Button>
          }
        />
      );
    } else {
      userTabBody = (
        <DashboardEmptyState
          icon={MessageSquare}
          iconTone="muted"
          title="No project chats"
          description="When you're hired or matched on a project, threads show up here."
        />
      );
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Messages"
        description="Chats with clients, freelancers, and support."
        icon={MessageSquare}
        actions={
          <Button asChild className="w-full shrink-0 rounded-xl sm:w-auto">
            <Link href="/dashboard/chat/support" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New support chat
            </Link>
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={(chats ?? []).length === 0 ? "Search chats…" : userSearchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 rounded-xl border-border/80 pl-10 shadow-none"
        />
      </div>

      {(chats ?? []).length > 0 ? (
        <MessagesCategoryTabs
          active={messagesTab}
          onChange={setMessagesTab}
          counts={userTabCounts}
        />
      ) : null}

      {(chats ?? []).length === 0 ? (
        <DashboardEmptyState
          icon={MessageSquare}
          iconTone="muted"
          title="No chats yet"
          description="Start a support chat to get help."
        />
      ) : userTabBody ? (
        userTabBody
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          {userTabFiltered.map((chat) => (
            <UserChatListRow key={chat._id} chat={chat} />
          ))}
        </div>
      )}
    </div>
  );
}
