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

export default function SupportChatPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [title, setTitle] = useState("");
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
        initialMessage: `Support request: ${title.trim()}`,
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
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Please log in</p>
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

  // If redirecting to existing chat, show loading
  const supportChat = chats?.find(
    (chat: Doc<"chats">) => chat.type === "support" && chat.status === "active"
  );
  if (supportChat) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/chat">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Support Chat</h1>
          <p className="text-muted-foreground mt-1">
            Create a support request to get help from our team
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support Request</CardTitle>
          <CardDescription>
            Describe your issue and our support team will help you
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

