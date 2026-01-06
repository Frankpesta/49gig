"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send,
  Paperclip,
  Pin,
  MoreVertical,
  ArrowLeft,
  Check,
  CheckCheck,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Doc, Id } from "@/convex/_generated/dataModel";

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const chatId = params.chatId as string;

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect to support page if chatId is "support"
  useEffect(() => {
    if (chatId === "support") {
      router.replace("/dashboard/chat/support");
    }
  }, [chatId, router]);

  // Validate chatId is a valid Convex ID format
  // Convex IDs start with 'j' and are longer than 10 characters
  const isValidChatId = chatId && 
    chatId !== "support" &&
    chatId.length > 10 && 
    !chatId.includes("/") &&
    chatId.startsWith("j");

  // ALWAYS skip queries if chatId is "support" or invalid
  // This prevents Convex from receiving invalid IDs
  // Double-check: ensure chatId is never "support" when passed to queries
  const isSupportRoute = chatId === "support";
  const shouldSkipQueries = isSupportRoute || !isValidChatId || !isAuthenticated || !user?._id;

  const chat = useQuery(
    api.chat.queries.getChat,
    shouldSkipQueries || isSupportRoute
      ? "skip"
      : { chatId: chatId as any, userId: user._id }
  );

  // Additional safety: ensure chat._id is valid before using it
  const isValidChatFromQuery = chat?._id && chat._id !== "support" && chat._id.startsWith("j");
  
  const messages = useQuery(
    api.chat.queries.getMessages,
    shouldSkipQueries || !isValidChatFromQuery || isSupportRoute
      ? "skip"
      : { chatId: chat._id, userId: user._id, limit: 100 }
  );

  // Real-time subscription - use useQuery which automatically provides real-time updates
  // No separate subscription needed - Convex queries are real-time by default

  const sendMessage = useMutation(api.chat.mutations.sendMessage);
  const markAsRead = useMutation(api.chat.mutations.markAsRead);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    // Only mark as read if chat exists and is valid (not "support" and valid Convex ID)
    if (chat && chat._id && user?._id && chat._id !== "support" && chat._id.startsWith("j")) {
      markAsRead({ chatId: chat._id, userId: user._id });
    }
  }, [chat, user?._id, markAsRead]);

  const handleSend = async () => {
    if (!message.trim() || isSending || !chat?._id || !user?._id) return;
    // Additional validation to prevent sending to invalid chat IDs
    if (chat._id === "support" || !chat._id.startsWith("j")) return;

    setIsSending(true);
    try {
      await sendMessage({
        chatId: chat._id,
        content: message,
        contentType: "text",
        userId: user._id,
      });
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  // Show loading while redirecting
  if (chatId === "support") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isValidChatId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Invalid chat ID</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/chat">Back to Chats</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (chat === undefined || messages === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (chat === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Chat not found</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/chat">Back to Chats</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayMessages = messages || [];
  const otherParticipants = chat.participants.filter((p: Id<"users">) => p !== user._id);

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <div className="mb-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/chat">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{chat.title || "Chat"}</h1>
          <p className="text-sm text-muted-foreground">
            {chat.type === "project" && chat.projectId && (
              <Link
                href={`/dashboard/projects/${chat.projectId}`}
                className="hover:underline"
              >
                View Project
              </Link>
            )}
          </p>
        </div>
        <Badge variant="outline">{chat.type}</Badge>
      </div>

      <Card className="h-[calc(100vh-200px)] flex flex-col">
        {/* Messages Area */}
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {displayMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">No messages yet</p>
            </div>
          ) : (
            displayMessages.map((msg: Doc<"messages">) => {
              const isOwnMessage = msg.senderId === user._id;
              const isRead = msg.readBy.some((r) => r.userId === user._id);

              return (
                <div
                  key={msg._id}
                  className={`flex gap-3 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  {!isOwnMessage && (
                    <Avatar>
                      <AvatarFallback>
                        {msg.senderRole === "client" ? "C" : "F"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`flex flex-col max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"}`}
                  >
                    {!isOwnMessage && (
                      <span className="text-xs text-muted-foreground mb-1">
                        {msg.senderRole}
                      </span>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments?.map((att: { fileId: Id<"_storage">; fileName: string; fileSize: number; mimeType: string; url: string }, idx: number) => (
                            <a
                              key={idx}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs underline block"
                            >
                              📎 {att.fileName}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                      {isOwnMessage && (
                        <span className="text-xs">
                          {isRead ? (
                            <CheckCheck className="h-3 w-3 text-primary" />
                          ) : (
                            <Check className="h-3 w-3 text-muted-foreground" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  {isOwnMessage && (
                    <Avatar>
                      <AvatarFallback>You</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Area */}
        <CardHeader className="border-t p-4">
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={isSending || !message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

