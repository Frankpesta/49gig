"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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
import { Headphones, Search, ExternalLink, CheckCircle2, Clock, Inbox } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

type SupportChat = {
  _id: string;
  title?: string;
  status: string;
  lastMessageAt?: number;
  lastMessagePreview?: string;
  openerName?: string | null;
  openerRole?: string | null;
  openerEmail?: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  archived: "bg-muted text-muted-foreground",
  deleted: "bg-muted text-muted-foreground",
};

export default function SupportInboxPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "resolved">("all");

  const supportChats = useQuery(
    api.chat.queries.getSupportChatsForAdmin,
    isAuthenticated && user?._id ? { userId: user._id } : "skip"
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
        description="Only admins and moderators can access the support inbox."
        action={<Button asChild><Link href="/dashboard">Back to Dashboard</Link></Button>}
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
    const matchesSearch = !searchQuery || [c.title, c.lastMessagePreview, c.openerName, c.openerEmail]
      .some((val) => val?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && c.status === "active") ||
      (statusFilter === "resolved" && c.status !== "active");
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <DashboardPageHeader
        title="Support Inbox"
        description="All support requests from clients and freelancers."
        icon={Headphones}
      />

      {/* Stats — support chats only */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-xl overflow-hidden">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Inbox className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">{total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl overflow-hidden">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-amber-100 dark:bg-amber-950/30 p-2.5 text-amber-600"><Clock className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Open</p>
              <p className="text-lg font-semibold">{openCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl overflow-hidden">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-xl bg-green-100 dark:bg-green-950/30 p-2.5 text-green-600"><CheckCircle2 className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Resolved</p>
              <p className="text-lg font-semibold">{resolvedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by subject, user, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-lg"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "active", "resolved"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
              className="capitalize h-9"
            >
              {s === "active" ? "Open" : s === "resolved" ? "Resolved" : "All"}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <DashboardEmptyState icon={Headphones} iconTone="muted" title="No support chats found" description={searchQuery ? "No chats match your search." : "No support requests yet."} />
      ) : (
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Subject</TableHead>
                <TableHead className="w-[180px]">Opened By</TableHead>
                <TableHead className="w-[90px]">Status</TableHead>
                <TableHead className="w-[130px]">Last Activity</TableHead>
                <TableHead className="w-[80px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((chat) => (
                <TableRow key={chat._id} className="hover:bg-muted/20">
                  <TableCell>
                    <p className="font-medium text-sm truncate max-w-[260px]">{chat.title || "Support Request"}</p>
                    {chat.lastMessagePreview && (
                      <p className="text-xs text-muted-foreground truncate max-w-[260px]">{chat.lastMessagePreview}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    {chat.openerName ? (
                      <div>
                        <div className="text-sm font-medium">{chat.openerName}</div>
                        <div className="text-xs text-muted-foreground capitalize">{chat.openerRole}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[chat.status] ?? "bg-muted text-muted-foreground"}`}>
                      {chat.status === "active" ? "Open" : "Resolved"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {chat.lastMessageAt ? formatDistanceToNow(chat.lastMessageAt, { addSuffix: true }) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" asChild>
                      <Link href={`/dashboard/chat/${chat._id}`}>
                        <ExternalLink className="h-3 w-3" /> Open
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
