"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Search, Plus, Users, Headphones } from "lucide-react";
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
          className="block p-3 hover:bg-muted/50 sm:p-4"
        >
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                <h3 className="min-w-0 truncate text-sm font-semibold sm:text-base">
                  {chat.title || "Untitled Chat"}
                </h3>
                <Badge variant="outline" className="shrink-0 text-[10px] sm:text-xs">
                  {chat.type}
                </Badge>
              </div>
              {chat.lastMessagePreview && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
                  {chat.lastMessagePreview}
                </p>
              )}
              {chat.lastMessageAt && (
                <p className="mt-0.5 text-[10px] text-muted-foreground sm:mt-1 sm:text-xs">
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
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to view chats</p>
        </div>
      </div>
    );
  }

  if (chats === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
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
    <div className="mx-auto w-full min-w-0 max-w-7xl px-2 py-4 sm:px-4 sm:py-6 lg:py-8">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Messages</h1>
          <p className="mt-0.5 truncate text-sm text-muted-foreground sm:mt-1">
            {isAdminOrModerator
              ? "View all project and support chats"
              : "Communicate with clients, freelancers, and support"}
          </p>
        </div>
        <Button asChild className="w-full shrink-0 sm:w-auto">
          <Link href="/dashboard/chat/support" className="flex items-center justify-center">
            <Plus className="mr-2 h-4 w-4" />
            New Support Chat
          </Link>
        </Button>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="min-w-0 lg:col-span-1">
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
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
                <div className="divide-y">
                  <div>
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium sm:px-4 sm:text-sm bg-muted/50">
                      <Users className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                      <span className="truncate">Project Chats (Client ↔ Freelancer)</span>
                    </div>
                    <ChatListSection
                      chats={projectChatsForAdmin ?? []}
                      searchQuery={searchQuery}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium sm:px-4 sm:text-sm bg-muted/50">
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
                <ChatListSection
                  chats={filteredChats ?? []}
                  searchQuery={searchQuery}
                  unreadCount={unreadCount ?? 0}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="hidden lg:block lg:col-span-2">
          <Card className="flex h-[500px] min-h-[280px] items-center justify-center lg:h-[600px]">
            <div className="text-center px-4">
              <MessageSquare className="mx-auto mb-3 h-12 w-12 text-muted-foreground sm:mb-4 sm:h-16 sm:w-16" />
              <h3 className="mb-1.5 text-base font-semibold sm:mb-2 sm:text-lg">Select a chat</h3>
              <p className="text-sm text-muted-foreground">
                Choose a chat from the list to start messaging
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

