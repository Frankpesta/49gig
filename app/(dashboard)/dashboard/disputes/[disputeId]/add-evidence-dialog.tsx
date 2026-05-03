"use client";

import { useMutation } from "convex/react";
import { makeFunctionReference } from "convex/server";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChatEvidenceSelector } from "@/components/disputes/chat-evidence-selector";
import { useEffect, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { getUserFriendlyError } from "@/lib/error-handling";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Paperclip, X } from "lucide-react";

type SubmitStructuredEvidenceArgs = {
  disputeId: Id<"disputes">;
  checklistItemId?: string;
  evidenceRequestId?: Id<"disputeEvidenceRequests">;
  title: string;
  description?: string;
  evidenceType:
    | "message"
    | "file"
    | "link"
    | "deliverable"
    | "payment_record"
    | "other";
  messageId?: Id<"messages">;
  fileId?: Id<"_storage">;
  url?: string;
  userId?: Id<"users">;
};

type GenerateUploadUrlArgs = { userId?: Id<"users"> };
type GenerateUploadUrlResult = string;

const submitStructuredEvidenceRef = makeFunctionReference<
  "mutation",
  SubmitStructuredEvidenceArgs,
  { success: boolean; evidenceId: Id<"disputeEvidence"> }
>("disputes/mutations:submitStructuredEvidence");

const generateUploadUrlRef = makeFunctionReference<
  "mutation",
  GenerateUploadUrlArgs,
  GenerateUploadUrlResult
>("disputes/mutations:generateDisputeUploadUrl");

interface AddEvidenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disputeId: Id<"disputes">;
  projectId: Id<"projects">;
  userId: Id<"users">;
  onSuccess: () => void;
}

const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function AddEvidenceDialog({
  open,
  onOpenChange,
  disputeId,
  projectId,
  userId,
  onSuccess,
}: AddEvidenceDialogProps) {
  const [mode, setMode] = useState<"chat" | "upload">("chat");
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [freeTitle, setFreeTitle] = useState("");
  const [freeDescription, setFreeDescription] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitStructuredEvidence = useMutation(submitStructuredEvidenceRef);
  const generateUploadUrl = useMutation(generateUploadUrlRef);

  useEffect(() => {
    if (!open) {
      setMode("chat");
      setSelectedMessages([]);
      setFreeTitle("");
      setFreeDescription("");
      setLink("");
      setFile(null);
      setError("");
      setIsSubmitting(false);
    }
  }, [open]);

  const submitChatEvidence = async () => {
    if (selectedMessages.length === 0) return;
    for (const messageId of selectedMessages) {
      await submitStructuredEvidence({
        disputeId,
        title: "Chat message evidence",
        description: "Evidence from project chat",
        evidenceType: "message",
        messageId: messageId as Id<"messages">,
        userId,
      });
    }
  };

  const submitUploadEvidence = async () => {
    const title = freeTitle.trim();
    const desc = freeDescription.trim();
    if (!title) {
      throw new Error("Give this evidence a short title.");
    }
    if (!desc) {
      throw new Error("Add a description for this evidence.");
    }
    const linkTrimmed = link.trim();
    if (linkTrimmed && !/^https?:\/\//i.test(linkTrimmed)) {
      throw new Error("Links must start with http:// or https://");
    }
    if (file && file.size > MAX_FILE_BYTES) {
      throw new Error("File is too large. Max 25MB.");
    }

    let fileId: Id<"_storage"> | undefined;
    if (file) {
      const uploadUrl = await generateUploadUrl({ userId });
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!res.ok) throw new Error("File upload failed");
      const json = (await res.json()) as { storageId: Id<"_storage"> };
      fileId = json.storageId;
    }

    const evidenceType:
      | "file"
      | "link"
      | "other" = fileId
      ? "file"
      : linkTrimmed
        ? "link"
        : "other";

    await submitStructuredEvidence({
      disputeId,
      title,
      description: desc,
      evidenceType,
      fileId,
      url: linkTrimmed || undefined,
      userId,
    });
  };

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      if (mode === "chat") {
        if (selectedMessages.length === 0) {
          setError("Select at least one chat message.");
          return;
        }
        await submitChatEvidence();
      } else {
        await submitUploadEvidence();
      }
      setSelectedMessages([]);
      setFreeTitle("");
      setFreeDescription("");
      setLink("");
      setFile(null);
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(getUserFriendlyError(err) || "Failed to add evidence");
    } finally {
      setIsSubmitting(false);
    }
  };

  const chatValid = selectedMessages.length > 0;
  const uploadValid =
    freeTitle.trim().length > 0 && freeDescription.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add evidence</DialogTitle>
          <DialogDescription>
            Attach chat messages or upload documents and links — you do not need a staff request to add
            evidence.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === "chat" ? "default" : "outline"}
            onClick={() => setMode("chat")}
          >
            From chat
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "upload" ? "default" : "outline"}
            onClick={() => setMode("upload")}
          >
            File or link
          </Button>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {mode === "chat" ? (
          <div className="space-y-4">
            <ChatEvidenceSelector
              projectId={projectId}
              userId={userId}
              selectedMessages={selectedMessages as Id<"messages">[]}
              onSelectionChange={(ids) => setSelectedMessages(ids as string[])}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="voluntary-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="voluntary-title"
                value={freeTitle}
                onChange={(e) => setFreeTitle(e.target.value)}
                placeholder="e.g. Signed scope addendum — March 2025"
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="voluntary-description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="voluntary-description"
                value={freeDescription}
                onChange={(e) => setFreeDescription(e.target.value)}
                placeholder="Explain what this shows and why it matters to the case."
                rows={5}
                maxLength={4000}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="voluntary-link">Reference link (optional)</Label>
              <Input
                id="voluntary-link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Attachment (optional)</Label>
              {file ? (
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/15 px-3 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{file.name}</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setFile(null)}
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  accept="image/*,application/pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
                />
              )}
              <p className="text-[11px] text-muted-foreground">Max 25MB.</p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || (mode === "chat" ? !chatValid : !uploadValid)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : mode === "chat" ? (
              `Submit ${selectedMessages.length} message${selectedMessages.length === 1 ? "" : "s"}`
            ) : (
              "Submit evidence"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
