"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Check } from "lucide-react";
import { useState } from "react";
import type { Doc, Id } from "@/convex/_generated/dataModel";

interface ChatEvidenceSelectorProps {
  projectId: Id<"projects">;
  userId: Id<"users">;
  selectedMessages: Id<"messages">[];
  onSelectionChange: (messageIds: Id<"messages">[]) => void;
}

export function ChatEvidenceSelector({
  projectId,
  userId,
  selectedMessages,
  onSelectionChange,
}: ChatEvidenceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get project chat
  const chat = useQuery(
    api.chat.queries.getProjectChat,
    projectId && userId ? { projectId, userId } : "skip"
  );

  // Get messages from chat
  const messages = useQuery(
    api.chat.queries.getMessages,
    chat?._id && userId
      ? { chatId: chat._id, userId, limit: 100 }
      : "skip"
  );

  const toggleMessage = (messageId: Id<"messages">) => {
    if (selectedMessages.includes(messageId)) {
      onSelectionChange(selectedMessages.filter((id) => id !== messageId));
    } else {
      onSelectionChange([...selectedMessages, messageId]);
    }
  };

  if (!chat) {
    return (
      <div className="text-sm text-muted-foreground">
        No project chat found. Chat will be created when project starts.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Select Chat Messages as Evidence</h3>
          <p className="text-sm text-muted-foreground">
            Choose relevant messages from the project chat
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "Hide Messages" : "Show Messages"}
        </Button>
      </div>

      {selectedMessages.length > 0 && (
        <div className="rounded-lg bg-muted p-3">
          <p className="text-sm font-medium mb-2">
            {selectedMessages.length} message{selectedMessages.length !== 1 ? "s" : ""} selected
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedMessages.map((msgId) => {
              const msg = messages?.find((m: Doc<"messages">) => m._id === msgId);
              if (!msg) return null;
              return (
                <Badge key={msgId} variant="secondary" className="text-xs">
                  {msg.content.substring(0, 30)}...
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {isOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Chat Messages</CardTitle>
          </CardHeader>
          <CardContent>
            {messages === undefined ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No messages in this chat yet
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {messages.map((message: Doc<"messages">) => (
                  <div
                    key={message._id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      selectedMessages.includes(message._id)
                        ? "bg-primary/5 border-primary"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={selectedMessages.includes(message._id)}
                      onCheckedChange={() => toggleMessage(message._id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {message.senderRole}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 flex gap-2">
                          {message.attachments.map((att, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              📎 {att.fileName}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

