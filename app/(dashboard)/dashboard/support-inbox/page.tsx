"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { Headphones, Search, MessageSquare, Clock, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function formatRelativeTime(ts: number) {
  const now = Date.now();
  const diffMs = now - ts;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function SupportInboxPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const supportChats = useQuery(
    api.chat.queries.getSupportChatsForAdmin,
    isAuthenticated && user?._id && (user.role === "admin" || user.role === "moderator")
      ? { userId: user._id }
      : "skip"
  );

  if (!isAuthenticated || !user) {
    return <DashboardEmptyState icon={Headphones} title="Please log in" iconTone="muted" />;
  }

  if (user.role !== "admin" && user.role !== "moderator") {
    return (
      <DashboardEmptyState
        icon={Headphones}
        iconTone="muted"
        title="Access restricted"
        description="Support inbox is only accessible to admins and moderators."
        action={
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        }
      />
    );
  }

  if (supportChats === undefined) {
    return <DashboardLoadingState label="Loading support chats" />;
  }

  const filtered = supportChats.filter((chat: Doc<"chats">) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      chat.title?.toLowerCase().includes(q) ||
      chat.lastMessagePreview?.toLowerCase().includes(q)
    );
  });

  const openChats = filtered.filter((c: Doc<"chats">) => c.status === "active");
  const closedChats = filtered.filter((c: Doc<"chats">) => c.status === "archived" || c.status === "deleted");

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Support Inbox"
        description="All support chats from clients and freelancers. Only admins and moderators can view and reply."
        icon={Headphones}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="rounded-xl overflow-hidden">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Headphones className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">{supportChats.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl overflow-hidden">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Open</p>
              <p className="text-lg font-semibold">{openChats.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl overflow-hidden">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-green-500/10 p-2.5 text-green-600">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Resolved</p>
              <p className="text-lg font-semibold">{closedChats.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by subject or last message…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-11 rounded-xl"
        />
      </div>

      {filtered.length === 0 ? (
        <DashboardEmptyState
          icon={Headphones}
          iconTone="muted"
          title={searchQuery ? "No chats match your search" : "No support chats yet"}
          description={!searchQuery ? "When clients or freelancers open a support request, they'll appear here." : undefined}
          className="py-12"
        />
      ) : (
        <div className="space-y-6">
          {openChats.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 uppercase tracking-wider">
                <Clock className="h-4 w-4" />
                Open ({openChats.length})
              </div>
              <Card className="rounded-xl overflow-hidden divide-y divide-border/40">
                {openChats.map((chat: Doc<"chats">) => (
                  <Link
                    key={chat._id}
                    href={`/dashboard/chat/${chat._id}`}
                    className="group flex items-start gap-4 p-4 transition-all hover:bg-primary/5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                          {chat.title || "Support Request"}
                        </h3>
                        <div className="flex items-center gap-2 shrink-0">
                          {chat.lastMessageAt && (
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                              {formatRelativeTime(chat.lastMessageAt)}
                            </span>
                          )}
                          <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400">
                            open
                          </Badge>
                        </div>
                      </div>
                      {chat.lastMessagePreview && (
                        <p className="truncate text-xs text-muted-foreground mt-0.5">
                          {chat.lastMessagePreview}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </Card>
            </div>
          )}

          {closedChats.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <MessageSquare className="h-4 w-4" />
                Resolved ({closedChats.length})
              </div>
              <Card className="rounded-xl overflow-hidden divide-y divide-border/40 opacity-80">
                {closedChats.map((chat: Doc<"chats">) => (
                  <Link
                    key={chat._id}
                    href={`/dashboard/chat/${chat._id}`}
                    className="group flex items-start gap-4 p-4 transition-all hover:bg-muted/40"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate font-medium text-foreground line-through decoration-muted-foreground/40">
                          {chat.title || "Support Request"}
                        </h3>
                        <div className="flex items-center gap-2 shrink-0">
                          {chat.lastMessageAt && (
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                              {formatRelativeTime(chat.lastMessageAt)}
                            </span>
                          )}
                          <Badge variant="secondary" className="text-[10px]">resolved</Badge>
                        </div>
                      </div>
                      {chat.lastMessagePreview && (
                        <p className="truncate text-xs text-muted-foreground mt-0.5">
                          {chat.lastMessagePreview}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
