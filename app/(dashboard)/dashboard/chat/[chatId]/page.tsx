"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send,
  Paperclip,
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
    <div className="flex flex-col -mx-4 -mb-4 sm:-mx-6 min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100dvh-4rem)] max-h-[calc(100dvh-3.5rem)] sm:max-h-[calc(100dvh-4rem)] overflow-hidden rounded-none sm:rounded-xl border border-border/60 bg-background shadow-sm">
      {/* WhatsApp-style header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-primary/20 bg-primary px-2 py-2.5 text-primary-foreground sm:px-4 sm:py-3">
        <Button variant="ghost" size="icon" asChild className="h-10 w-10 shrink-0 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
          <Link href="/dashboard/chat" aria-label="Back to conversations">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold sm:text-lg">{chat.title || "Chat"}</h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-primary-foreground/85">
            <span className="capitalize">{chat.type}</span>
            {chat.type === "project" && chat.projectId && (
              <>
                <span aria-hidden>·</span>
                <Link
                  href={`/dashboard/projects/${chat.projectId}`}
                  className="truncate underline-offset-2 hover:underline"
                >
                  Hire details
                </Link>
              </>
            )}
          </div>
        </div>
        {participantsList[0] && (
          <Avatar className="h-9 w-9 shrink-0 border-2 border-primary-foreground/30 sm:h-10 sm:w-10">
            {otherParticipants[0]?.imageUrl && (
              <AvatarImage src={otherParticipants[0].imageUrl} alt={otherParticipants[0].name} />
            )}
            <AvatarFallback className="bg-primary-foreground/20 text-sm text-primary-foreground">
              {(otherParticipants[0]?.name ?? "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Thread: subtle pattern like WhatsApp */}
      <div
        className="min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-4 sm:py-4"
        style={{
          backgroundColor: "color-mix(in oklab, var(--muted) 55%, var(--background))",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:gap-3">
          {displayMessages.length === 0 ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <p className="text-base text-muted-foreground">No messages yet — say hello.</p>
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
                  className={`flex gap-2 sm:gap-3 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  {!isOwnMessage && (
                    <Avatar className="h-9 w-9 shrink-0 self-end sm:h-10 sm:w-10">
                      {sender?.imageUrl && <AvatarImage src={sender.imageUrl} alt={senderName} />}
                      <AvatarFallback className="text-sm">
                        {senderName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`flex max-w-[min(100%,28rem)] flex-col sm:max-w-[min(100%,32rem)] ${isOwnMessage ? "items-end" : "items-start"}`}
                  >
                    {!isOwnMessage && (
                      <span className="mb-0.5 px-1 text-xs font-medium text-muted-foreground">
                        {senderName}
                      </span>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-base leading-relaxed shadow-sm sm:px-4 sm:py-3 ${
                        isOwnMessage
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md border border-border/60 bg-card"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments?.map((att: { fileId: Id<"_storage">; fileName: string; fileSize: number; mimeType: string; url: string }, idx: number) => (
                            <a
                              key={idx}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`block text-sm underline ${isOwnMessage ? "text-primary-foreground/90" : ""}`}
                            >
                              📎 {att.fileName}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 px-1">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {isOwnMessage && (
                        <span className="text-muted-foreground">
                          {isRead ? (
                            <CheckCheck className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  {isOwnMessage && (
                    <Avatar className="h-9 w-9 shrink-0 self-end sm:h-10 sm:w-10">
                      {getParticipant(user._id)?.imageUrl && (
                        <AvatarImage src={getParticipant(user._id)!.imageUrl!} alt="You" />
                      )}
                      <AvatarFallback className="text-sm">You</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border/70 bg-card px-2 py-2.5 sm:px-4 sm:py-3">
        <div className="mx-auto max-w-3xl">
          {pendingFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {pendingFiles.map((f, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-sm"
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
          <div className="flex items-end gap-2">
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
              className="h-11 w-11 shrink-0 rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isSending}
              title="Attach file or image"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Textarea
              placeholder="Message… (Shift+Enter for new line)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isSending}
              rows={1}
              className="min-h-11 max-h-40 flex-1 resize-none rounded-2xl border-border/80 bg-background px-4 py-2.5 text-base leading-relaxed overflow-y-auto"
            />
            <Button
              size="icon"
              className="h-11 w-11 shrink-0 rounded-full"
              onClick={handleSend}
              disabled={
                isSending ||
                isUploading ||
                (!message.trim() && pendingFiles.length === 0)
              }
              aria-label="Send"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Images, PDFs, documents (max 10MB). Enter to send · Shift+Enter for new line.
          </p>
        </div>
      </div>
    </div>
  );
}

