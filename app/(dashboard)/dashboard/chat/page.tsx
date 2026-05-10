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
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
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

  const unreadCount = useQuery(
    api.chat.queries.getUnreadCount,
    isAuthenticated && user?._id ? { userId: user._id } : "skip"
  );

  const isAdminOrModerator =
    user?.role === "admin" || user?.role === "moderator";

  const adminChatsRaw = (projectChatsForAdmin ?? []) as ProjectChatRow[];

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

    return (
      <div className="space-y-4 animate-in fade-in-50 duration-300">
        <DashboardPageHeader
          title="Project Chats"
          description="Conversations between clients and freelancers on hires."
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by project, client, or freelancer…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 rounded-xl border-border/80 pl-10 shadow-none"
          />
        </div>

        {projectChatsForAdmin === undefined ? (
          <DashboardLoadingState label="Loading project chats" />
        ) : adminChatsRaw.length === 0 ? (
          <DashboardEmptyState
            icon={MessageSquare}
            iconTone="muted"
            title="No project chats yet"
          />
        ) : adminChatsFiltered.length === 0 ? (
          <DashboardEmptyState
            icon={MessageSquare}
            iconTone="muted"
            title="No matches"
            description="Try a different search."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
            {adminChatsFiltered.map((chat) => (
              <ProjectChatListRow key={chat._id} chat={chat} />
            ))}
          </div>
        )}
      </div>
    );
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
          placeholder="Search chats…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 rounded-xl border-border/80 pl-10 shadow-none"
        />
      </div>

      {(chats ?? []).length === 0 ? (
        <DashboardEmptyState
          icon={MessageSquare}
          iconTone="muted"
          title="No chats yet"
          description="Start a support chat to get help."
        />
      ) : userChatsFiltered.length === 0 ? (
        <DashboardEmptyState
          icon={MessageSquare}
          iconTone="muted"
          title="No matches"
          description="No chats match your search."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          {userChatsFiltered.map((chat) => (
            <UserChatListRow key={chat._id} chat={chat} />
          ))}
        </div>
      )}
    </div>
  );
}
