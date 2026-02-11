"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const [pendingFiles, setPendingFiles] = useState<Array<{ fileId: Id<"_storage">; fileName: string; fileSize: number; mimeType: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const chatWithParticipants = useQuery(
    api.chat.queries.getChatWithParticipantDetails,
    shouldSkipQueries || isSupportRoute
      ? "skip"
      : { chatId: chatId as any, userId: user._id }
  );
  const chat = chatWithParticipants;

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
  const generateUploadUrl = useMutation(api.chat.mutations.generateUploadUrl);

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
    if ((!message.trim() && pendingFiles.length === 0) || isSending || !chat?._id || !user?._id) return;
    if (chat._id === "support" || !chat._id.startsWith("j")) return;

    setIsSending(true);
    try {
      await sendMessage({
        chatId: chat._id,
        content: message.trim() || (pendingFiles.length > 0 ? "📎 Sent attachment(s)" : ""),
        contentType: pendingFiles.length > 0 && !message.trim() ? "file" : "text",
        attachments: pendingFiles.length > 0 ? pendingFiles : undefined,
        userId: user._id,
      });
      setMessage("");
      setPendingFiles([]);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !user?._id) return;

    setIsUploading(true);
    try {
      const uploaded: typeof pendingFiles = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) continue; // Skip files > 10MB
        const uploadUrl = await generateUploadUrl({ userId: user._id });
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!response.ok) throw new Error("Upload failed");
        const res = await response.json();
        const storageId = typeof res === "string" ? res : res.storageId;
        if (!storageId) throw new Error("Upload did not return storageId");
        uploaded.push({
          fileId: storageId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
        });
      }
      setPendingFiles((prev) => [...prev, ...uploaded]);
    } catch (error) {
      console.error("Failed to upload file:", error);
    } finally {
      setIsUploading(false);
      e.target.value = "";
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
  const participantsList = "participants" in chat && Array.isArray(chat.participants) && chat.participants[0] && typeof chat.participants[0] === "object"
    ? (chat.participants as { _id: Id<"users">; name: string; imageUrl?: string }[])
    : [];
  const getParticipant = (userId: Id<"users">) =>
    participantsList.find((p) => p._id === userId);
  const otherParticipants = participantsList.filter((p) => p._id !== user._id);

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
          {participantsList.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {participantsList.map((p) => (
                <div key={p._id} className="flex items-center gap-2 rounded-full bg-muted/60 px-2 py-1">
                  <Avatar className="h-6 w-6">
                    {p.imageUrl && <AvatarImage src={p.imageUrl} alt={p.name} />}
                    <AvatarFallback className="text-xs">
                      {p.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">
                    {p._id === user._id ? "You" : p.name}
                  </span>
                </div>
              ))}
            </div>
          )}
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
              const sender = participantsList.length > 0 ? getParticipant(msg.senderId) : null;
              const senderName = sender?.name ?? (msg.senderRole === "client" ? "Client" : "Freelancer");

              return (
                <div
                  key={msg._id}
                  className={`flex gap-3 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  {!isOwnMessage && (
                    <Avatar className="h-8 w-8 shrink-0">
                      {sender?.imageUrl && <AvatarImage src={sender.imageUrl} alt={senderName} />}
                      <AvatarFallback className="text-xs">
                        {senderName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`flex flex-col max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"}`}
                  >
                    {!isOwnMessage && (
                      <span className="text-xs font-medium text-muted-foreground mb-1">
                        {senderName}
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
                    <Avatar className="h-8 w-8 shrink-0">
                      {getParticipant(user._id)?.imageUrl && (
                        <AvatarImage src={getParticipant(user._id)!.imageUrl!} alt="You" />
                      )}
                      <AvatarFallback className="text-xs">You</AvatarFallback>
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
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {pendingFiles.map((f, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs"
                >
                  📎 {f.fileName}
                  <button
                    type="button"
                    onClick={() =>
                      setPendingFiles((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="hover:text-destructive"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isSending}
              title="Attach file or image"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Type a message or attach files..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={
                isSending ||
                isUploading ||
                (!message.trim() && pendingFiles.length === 0)
              }
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Images, PDFs, docs, txt (max 10MB)
          </p>
        </CardHeader>
      </Card>
    </div>
  );
}

