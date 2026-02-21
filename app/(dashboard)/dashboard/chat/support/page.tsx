"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardLoadingState } from "@/components/dashboard/dashboard-loading-state";

export default function SupportChatPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const createSupportChat = useMutation(api.chat.mutations.createSupportChat);

  // Check if user already has a support chat
  const chats = useQuery(
    api.chat.queries.getChats,
    isAuthenticated && user?._id ? { userId: user._id } : "skip"
  );

  useEffect(() => {
    // If user has an existing support chat, redirect to it
    if (chats) {
      const supportChat = chats.find(
        (chat: Doc<"chats">) =>
          chat.type === "support" && chat.status === "active"
      );
      if (supportChat) {
        router.replace(`/dashboard/chat/${supportChat._id}`);
      }
    }
  }, [chats, router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user?._id) return;

    setIsCreating(true);
    try {
      const chatId = await createSupportChat({
        subject: title.trim(),
        initialMessage: details.trim()
          ? `Support request: ${title.trim()}\n\n${details.trim()}`
          : `Support request: ${title.trim()}`,
        userId: user._id,
      });
      router.push(`/dashboard/chat/${chatId}`);
    } catch (error) {
      console.error("Failed to create support chat:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isAuthenticated || !user) {
    return <DashboardEmptyState icon={MessageSquare} title="Please log in" />;
  }

  if (chats === undefined) {
    return <DashboardLoadingState label="Loading support chat..." />;
  }

  // If redirecting to existing chat, show loading
  const supportChat = chats?.find(
    (chat: Doc<"chats">) => chat.type === "support" && chat.status === "active"
  );
  if (supportChat) {
    return <DashboardLoadingState label="Opening existing support chat..." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" asChild className="h-9 w-9 shrink-0">
          <Link href="/dashboard/chat">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <DashboardPageHeader
            title="New Support Chat"
            description="Create a support request to get help from our team."
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="pointer-events-none h-px w-full bg-linear-to-r from-transparent via-primary/40 to-transparent" />
        <CardHeader>
          <CardTitle>Support Request</CardTitle>
          <CardDescription>
            Share what happened and our support team will respond as quickly as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Subject *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of your issue"
                required
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">Issue Details (optional)</Label>
              <Textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Add context, steps to reproduce, and expected outcome."
                disabled={isCreating}
                rows={5}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isCreating || !title.trim()} className="flex-1">
                {isCreating ? "Creating..." : "Start Support Chat"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/chat">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

