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

function ChatListSection({
  chats,
  searchQuery,
  unreadCount,
}: {
  chats: Doc<"chats">[];
  searchQuery: string;
  unreadCount?: number;
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
      <div className="p-4 text-center sm:p-6 lg:p-8">
        <MessageSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground sm:mb-4 sm:h-12 sm:w-12" />
        <p className="text-sm text-muted-foreground sm:text-base">
          {searchQuery ? "No chats found" : "No chats yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {filtered.map((chat) => (
        <Link
          key={chat._id}
          href={`/dashboard/chat/${chat._id}`}
          className="group block p-3 transition-colors hover:bg-primary/5 sm:p-4"
        >
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                <h3 className="min-w-0 truncate text-sm font-semibold text-foreground/95 group-hover:text-primary sm:text-base">
                  {chat.title || "Untitled Chat"}
                </h3>
                <Badge variant="outline" className="shrink-0 border-primary/30 bg-primary/5 text-[10px] sm:text-xs">
                  {chat.type}
                </Badge>
              </div>
              {chat.lastMessagePreview && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                  {chat.lastMessagePreview}
                </p>
              )}
              {chat.lastMessageAt && (
                <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">
                  {new Date(chat.lastMessageAt).toLocaleDateString()}
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
    return <DashboardEmptyState icon={MessageSquare} title="Please log in to view chats" />;
  }

  if (chats === undefined) {
    return <DashboardLoadingState label="Loading chats..." />;
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
    <div className="space-y-5">
      <DashboardPageHeader
        title="Messages"
        description={
          isAdminOrModerator
            ? "View all project and support chats."
            : "Communicate with clients, freelancers, and support."
        }
        actions={
          <Button asChild className="w-full shrink-0 sm:w-auto">
            <Link href="/dashboard/chat/support" className="flex items-center justify-center">
              <Plus className="mr-2 h-4 w-4" />
              New Support Chat
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="sm:col-span-1">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2 text-primary"><MessageSquare className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Chats</p>
              <p className="text-lg font-semibold">{chats.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-1">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-secondary/20 p-2 text-secondary-foreground"><Sparkles className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Unread</p>
              <p className="text-lg font-semibold">{unreadCount ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="min-w-0 lg:col-span-1">
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="p-3 sm:p-4 lg:p-5">
              <div className="flex min-w-0 items-center justify-between gap-2">
                <CardTitle className="truncate text-base sm:text-lg lg:text-xl">Chats</CardTitle>
                {unreadCount && unreadCount > 0 && (
                  <Badge variant="destructive" className="shrink-0 text-[10px] sm:text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div className="relative mt-3 sm:mt-4">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:left-3" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 min-w-0 pl-8 text-sm sm:h-10 sm:pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="min-w-0 p-0">
              {isAdminOrModerator ? (
                <div className="max-h-[65vh] divide-y overflow-y-auto">
                  <div>
                    <div className="flex items-center gap-2 bg-primary/5 px-3 py-2 text-xs font-medium text-primary sm:px-4 sm:text-sm">
                      <Users className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                      <span className="truncate">Project Chats (Client ↔ Freelancer)</span>
                    </div>
                    <ChatListSection
                      chats={projectChatsForAdmin ?? []}
                      searchQuery={searchQuery}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 bg-primary/5 px-3 py-2 text-xs font-medium text-primary sm:px-4 sm:text-sm">
                      <Headphones className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                      Support Chats
                    </div>
                    <ChatListSection
                      chats={supportChatsForAdmin ?? []}
                      searchQuery={searchQuery}
                    />
                  </div>
                </div>
              ) : (
                <div className="max-h-[65vh] overflow-y-auto">
                  <ChatListSection
                    chats={filteredChats ?? []}
                    searchQuery={searchQuery}
                    unreadCount={unreadCount ?? 0}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="flex min-h-[300px] items-center justify-center bg-linear-to-br from-card via-card to-primary/5 p-2 sm:min-h-[360px] lg:h-[600px]">
            <div className="text-center px-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-16 sm:w-16">
                <MessageSquare className="h-7 w-7 sm:h-8 sm:w-8" />
              </div>
              <h3 className="mb-2 text-base font-semibold sm:text-lg">Select a chat to start messaging</h3>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Open any conversation from the left panel to view messages, send files, and manage communication in real-time.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

