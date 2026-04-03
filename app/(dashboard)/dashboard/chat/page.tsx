"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { MessageSquare, Search, Plus, Sparkles, Headphones, ExternalLink, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function formatRelativeTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - d.getTime()) / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function ChatRow({ chat, searchQuery }: { chat: Doc<"chats"> & { clientName?: string | null; freelancerName?: string | null }; searchQuery: string }) {
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    const matches =
      chat.title?.toLowerCase().includes(q) ||
      chat.lastMessagePreview?.toLowerCase().includes(q) ||
      chat.clientName?.toLowerCase().includes(q) ||
      chat.freelancerName?.toLowerCase().includes(q);
    if (!matches) return null;
  }
  return (
    <TableRow className="hover:bg-muted/20">
      <TableCell>
        <p className="font-medium text-sm truncate max-w-[200px]">{chat.title || "Untitled Chat"}</p>
        {chat.lastMessagePreview && (
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{chat.lastMessagePreview}</p>
        )}
      </TableCell>
      <TableCell>
        <div className="space-y-0.5">
          {chat.clientName && <div className="text-xs"><span className="text-muted-foreground">Client: </span><span className="font-medium">{chat.clientName}</span></div>}
          {chat.freelancerName && <div className="text-xs"><span className="text-muted-foreground">Freelancer: </span><span className="font-medium">{chat.freelancerName}</span></div>}
          {!chat.clientName && !chat.freelancerName && <span className="text-xs text-muted-foreground">—</span>}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-[10px] capitalize">{chat.status}</Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {chat.lastMessageAt ? formatRelativeTime(chat.lastMessageAt) : "—"}
      </TableCell>
      <TableCell className="text-right">
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" asChild>
          <Link href={`/dashboard/chat/${chat._id}`}>
            <ExternalLink className="h-3 w-3" /> Open
          </Link>
        </Button>
      </TableCell>
    </TableRow>
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
    isAuthenticated && user?._id && (user.role === "admin" || user.role === "moderator")
      ? { userId: user._id }
      : "skip"
  );

  const unreadCount = useQuery(
    api.chat.queries.getUnreadCount,
    isAuthenticated && user?._id ? { userId: user._id } : "skip"
  );

  const isAdminOrModerator = user?.role === "admin" || user?.role === "moderator";

  if (!isAuthenticated || !user) {
    return <DashboardEmptyState icon={MessageSquare} title="Please log in to view chats" iconTone="muted" />;
  }

  if (chats === undefined) {
    return <DashboardLoadingState label="Loading" />;
  }

  // ── Admin / Moderator view ──────────────────────────────────────
  if (isAdminOrModerator) {
    const adminChats = (projectChatsForAdmin ?? []) as (Doc<"chats"> & { clientName?: string | null; freelancerName?: string | null })[];
    const totalProject = adminChats.length;
    const activeProject = adminChats.filter((c) => c.status === "active").length;

    return (
      <div className="space-y-5 animate-in fade-in-50 duration-300">
        <DashboardPageHeader
          title="Project Chats"
          description="All project conversations between clients and freelancers."
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

        {/* Stats — project chats only */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="rounded-xl overflow-hidden">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Users className="h-4 w-4" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Project Chats</p>
                <p className="text-lg font-semibold">{totalProject}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl overflow-hidden">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-green-100 dark:bg-green-950/30 p-2.5 text-green-600"><MessageSquare className="h-4 w-4" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-lg font-semibold">{activeProject}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl overflow-hidden">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-xl bg-secondary/20 p-2.5 text-secondary-foreground"><Sparkles className="h-4 w-4" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Unread</p>
                <p className="text-lg font-semibold">{unreadCount ?? 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by project, client, or freelancer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-lg"
          />
        </div>

        {adminChats.length === 0 ? (
          <DashboardEmptyState icon={MessageSquare} iconTone="muted" title="No project chats yet" />
        ) : (
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Project</TableHead>
                  <TableHead>Parties</TableHead>
                  <TableHead className="w-[90px]">Status</TableHead>
                  <TableHead className="w-[110px]">Last Message</TableHead>
                  <TableHead className="w-[80px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminChats.map((chat) => (
                  <ChatRow key={chat._id} chat={chat} searchQuery={searchQuery} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  }

  // ── Non-admin view (clients / freelancers) ──────────────────────
  const filteredChats = (chats ?? []).filter((chat: Doc<"chats">) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      chat.title?.toLowerCase().includes(q) ||
      chat.lastMessagePreview?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Messages"
        description="Communicate with clients, freelancers, and support."
        icon={MessageSquare}
        actions={
          <Button asChild className="w-full shrink-0 rounded-xl sm:w-auto">
            <Link href="/dashboard/chat/support" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Support Chat
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="rounded-xl overflow-hidden">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><MessageSquare className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Chats</p>
              <p className="text-lg font-semibold">{chats.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl overflow-hidden">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-secondary/20 p-2.5 text-secondary-foreground"><Sparkles className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Unread</p>
              <p className="text-lg font-semibold">{unreadCount ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 rounded-lg"
        />
      </div>

      {filteredChats.length === 0 ? (
        <DashboardEmptyState icon={MessageSquare} iconTone="muted" title="No chats yet" description={searchQuery ? "No chats match your search" : "Start a support chat to get help"} />
      ) : (
        <div className="divide-y divide-border/40 rounded-xl border border-border/60 overflow-hidden">
          {filteredChats.map((chat: Doc<"chats">) => (
            <Link
              key={chat._id}
              href={`/dashboard/chat/${chat._id}`}
              className="group flex items-start gap-3 p-4 transition-all hover:bg-primary/5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="min-w-0 truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                    {chat.title || "Untitled Chat"}
                  </h3>
                  {chat.lastMessageAt && (
                    <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                      {formatRelativeTime(chat.lastMessageAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="shrink-0 text-[10px] font-medium">{chat.type}</Badge>
                  {chat.lastMessagePreview && (
                    <p className="min-w-0 truncate text-xs text-muted-foreground">{chat.lastMessagePreview}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
