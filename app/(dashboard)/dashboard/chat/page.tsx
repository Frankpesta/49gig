"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { MessageSquare, Search, Plus, Users, Headphones, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function formatRelativeTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function ChatListSection({
  chats,
  searchQuery,
  sectionLabel,
  sectionIcon,
}: {
  chats: Doc<"chats">[];
  searchQuery: string;
  sectionLabel?: string;
  sectionIcon?: React.ReactNode;
}) {
  const filtered = chats.filter((chat) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      chat.title?.toLowerCase().includes(q) ||
      chat.lastMessagePreview?.toLowerCase().includes(q)
    );
  });

  if (filtered.length === 0) {
    return (
      <div className="p-6 text-center">
        <MessageSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">
          {searchQuery ? "No chats match your search" : "No chats yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/40">
      {filtered.map((chat) => (
        <Link
          key={chat._id}
          href={`/dashboard/chat/${chat._id}`}
          className="group flex items-start gap-3 p-4 transition-all hover:bg-primary/5 rounded-lg mx-2 my-1"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
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
              <Badge variant="outline" className="shrink-0 text-[10px] font-medium border-primary/30 bg-primary/5">
                {chat.type}
              </Badge>
              {chat.lastMessagePreview && (
                <p className="min-w-0 truncate text-xs text-muted-foreground">
                  {chat.lastMessagePreview}
                </p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
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

  const supportChatsForAdmin = useQuery(
    api.chat.queries.getSupportChatsForAdmin,
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

  const filteredChats = chats?.filter((chat: Doc<"chats">) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      chat.title?.toLowerCase().includes(query) ||
      chat.lastMessagePreview?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Messages"
        description={
          isAdminOrModerator
            ? "View all project and support chats."
            : "Communicate with clients, freelancers, and support."
        }
        icon={MessageSquare}
        actions={
          <Button asChild className="w-full shrink-0 rounded-xl sm:w-auto">
            <Link href="/dashboard/chat/support" className="flex items-center justify-center">
              <Plus className="mr-2 h-4 w-4" />
              New Support Chat
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="sm:col-span-1 rounded-xl overflow-hidden">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><MessageSquare className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Chats</p>
              <p className="text-lg font-semibold">{chats.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-1 rounded-xl overflow-hidden">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-secondary/20 p-2.5 text-secondary-foreground"><Sparkles className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Unread</p>
              <p className="text-lg font-semibold">{unreadCount ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[340px_1fr] lg:gap-6">
        <Card className="min-w-0 overflow-hidden rounded-xl border-border/60 shadow-sm">
          <CardHeader className="p-4 sm:p-5 border-b border-border/40 bg-gradient-to-b from-muted/5 to-transparent">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <CardTitle className="text-lg font-semibold">Conversations</CardTitle>
              {unreadCount != null && unreadCount > 0 && (
                <Badge variant="destructive" className="shrink-0 text-xs font-semibold">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 min-w-0 pl-9 rounded-lg border-border/60"
              />
            </div>
          </CardHeader>
          <CardContent className="min-w-0 p-0">
            {isAdminOrModerator ? (
              <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
                <div className="sticky top-0 z-10 flex items-center gap-2 bg-primary/5 px-4 py-2.5 text-xs font-semibold text-primary uppercase tracking-wider">
                  <Users className="h-4 w-4 shrink-0" />
                  Project Chats
                </div>
                <ChatListSection
                  chats={projectChatsForAdmin ?? []}
                  searchQuery={searchQuery}
                />
                <div className="sticky top-0 z-10 flex items-center gap-2 bg-muted/50 px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Headphones className="h-4 w-4 shrink-0" />
                  Support Chats
                </div>
                <ChatListSection
                  chats={supportChatsForAdmin ?? []}
                  searchQuery={searchQuery}
                />
              </div>
            ) : (
              <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
                <ChatListSection
                  chats={filteredChats ?? []}
                  searchQuery={searchQuery}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex min-h-[300px] items-center justify-center rounded-xl overflow-hidden border-border/60 border-dashed sm:min-h-[360px] lg:min-h-[500px]">
          <div className="text-center px-6 py-12">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Select a conversation</h3>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground leading-relaxed">
              Choose a chat from the list to view messages, send replies, and share files in real time.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

