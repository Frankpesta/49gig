"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Search, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ChatPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const chats = useQuery(
    api.chat.queries.getChats,
    isAuthenticated && user?._id ? { userId: user._id } : "skip"
  );

  const unreadCount = useQuery(
    api.chat.queries.getUnreadCount,
    isAuthenticated && user?._id ? { userId: user._id } : "skip"
  );

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
    <div className="container mx-auto max-w-7xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground mt-1">
            Communicate with clients, freelancers, and support
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/chat/support">
            <Plus className="mr-2 h-4 w-4" />
            New Support Chat
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Chats</CardTitle>
                {unreadCount && unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount}</Badge>
                )}
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredChats.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No chats found" : "No chats yet"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredChats.map((chat: Doc<"chats">) => (
                    <Link
                      key={chat._id}
                      href={`/dashboard/chat/${chat._id}`}
                      className="block p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">
                              {chat.title || "Untitled Chat"}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {chat.type}
                            </Badge>
                          </div>
                          {chat.lastMessagePreview && (
                            <p className="text-sm text-muted-foreground truncate">
                              {chat.lastMessagePreview}
                            </p>
                          )}
                          {chat.lastMessageAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(chat.lastMessageAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Preview / Empty State */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a chat</h3>
              <p className="text-muted-foreground">
                Choose a chat from the list to start messaging
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

