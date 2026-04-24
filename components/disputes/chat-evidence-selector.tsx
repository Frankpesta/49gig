"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import type { Doc, Id } from "@/convex/_generated/dataModel";

export interface TeamDisputeMode {
  isTeamHire: boolean;
  scope: "all" | "partial";
  /** When scope is partial, at least one id should be selected in the form for evidence to be meaningful. */
  disputedFreelancerIds: Id<"users">[];
}

interface ChatEvidenceSelectorProps {
  projectId: Id<"projects">;
  userId: Id<"users">;
  selectedMessages: Id<"messages">[];
  onSelectionChange: (messageIds: Id<"messages">[]) => void;
  /** For client + team hire: show only messages from the client, selected freelancers, and system; otherwise full thread. */
  teamDisputeMode?: TeamDisputeMode;
}

type EnrichedMessage = Doc<"messages"> & { senderDisplayName: string };

const roleLabel = (r: EnrichedMessage["senderRole"]): string => {
  if (r === "system") return "System";
  if (r === "client") return "Client";
  if (r === "freelancer") return "Freelancer";
  if (r === "admin") return "Admin";
  return "Moderator";
};

export function ChatEvidenceSelector({
  projectId,
  userId,
  selectedMessages,
  onSelectionChange,
  teamDisputeMode,
}: ChatEvidenceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const evidenceFilter = useMemo(():
    | { kind: "all" }
    | { kind: "partial"; disputedFreelancerIds: Id<"users">[] } => {
    if (!teamDisputeMode?.isTeamHire) {
      return { kind: "all" };
    }
    if (teamDisputeMode.scope === "all") {
      return { kind: "all" };
    }
    return {
      kind: "partial",
      disputedFreelancerIds: teamDisputeMode.disputedFreelancerIds,
    };
  }, [teamDisputeMode]);

  const data = useQuery(
    api.chat.queries.getProjectChatMessagesForDisputeEvidence,
    projectId && userId
      ? { projectId, userId, limit: 100, evidenceFilter }
      : "skip"
  );

  const messages: EnrichedMessage[] | undefined = data?.messages as
    | EnrichedMessage[]
    | undefined;
  const needsMemberSelectionForPartial =
    teamDisputeMode?.isTeamHire &&
    teamDisputeMode.scope === "partial" &&
    teamDisputeMode.disputedFreelancerIds.length === 0;

  // Drop selections for messages that are not in the current visible list
  useEffect(() => {
    if (data == null) return;
    if (data.messages.length === 0) {
      if (selectedMessages.length) onSelectionChange([]);
      return;
    }
    const vis = new Set(
      data.messages.map((m: EnrichedMessage) => m._id)
    );
    const pruned = selectedMessages.filter((id) => vis.has(id));
    if (pruned.length !== selectedMessages.length) onSelectionChange(pruned);
  }, [data, selectedMessages, onSelectionChange]);

  const toggleMessage = (messageId: Id<"messages">) => {
    if (selectedMessages.includes(messageId)) {
      onSelectionChange(selectedMessages.filter((id) => id !== messageId));
    } else {
      onSelectionChange([...selectedMessages, messageId]);
    }
  };

  if (data === null) {
    return (
      <div className="text-sm text-muted-foreground">
        No project chat found. Chat will be created when project starts.
      </div>
    );
  }

  if (data === undefined) {
    return (
      <div className="text-sm text-muted-foreground">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent align-[-0.2em] mr-2" />
        Loading messages…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Select Chat Messages as Evidence</h3>
          <p className="text-sm text-muted-foreground">
            Choose relevant messages from the project chat. Senders are shown with their display names.
          </p>
          {evidenceFilter.kind === "partial" && !needsMemberSelectionForPartial && (
            <p className="text-xs text-muted-foreground mt-1.5 max-w-prose">
              For this partial dispute, the list is limited to you, the selected
              team members, and system messages.
            </p>
          )}
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
              const msg = messages?.find((m) => m._id === msgId);
              if (!msg) return null;
              return (
                <Badge key={msgId} variant="secondary" className="text-xs max-w-[20rem] truncate" title={msg.content}>
                  <span className="font-medium">{msg.senderDisplayName}</span>
                  <span className="text-muted-foreground mx-1">·</span>
                  {msg.content.substring(0, 40)}
                  {msg.content.length > 40 ? "…" : ""}
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
            {evidenceFilter.kind === "partial" && !needsMemberSelectionForPartial && (
              <p className="text-sm font-normal text-muted-foreground">
                Filtered to the people involved in this partial dispute
              </p>
            )}
          </CardHeader>
          <CardContent>
            {needsMemberSelectionForPartial && (
              <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">
                Select at least one team member above. Then the relevant messages
                (you, those members, and system updates) will appear here.
              </p>
            )}
            {!needsMemberSelectionForPartial && (messages?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No messages in this list yet. There may be no project chat history that matches this filter, or
                the chat is empty.
              </p>
            ) : !needsMemberSelectionForPartial && messages && messages.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {messages.map((message) => (
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
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">
                          {message.senderDisplayName}
                        </span>
                        <Badge variant="outline" className="text-xs font-normal">
                          {roleLabel(message.senderRole)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
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
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
