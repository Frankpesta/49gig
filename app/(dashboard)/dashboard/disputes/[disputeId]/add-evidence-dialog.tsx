"use client";

import { useMutation } from "convex/react";
import { makeFunctionReference } from "convex/server";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { getUserFriendlyError } from "@/lib/error-handling";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Paperclip, X } from "lucide-react";

const MIN_EXPLANATION_LEN = 20;

type SubmitStructuredEvidenceArgs = {
  disputeId: Id<"disputes">;
  checklistItemId?: string;
  evidenceRequestId?: Id<"disputeEvidenceRequests">;
  title?: string;
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
  projectId: _projectId,
  userId,
  onSuccess,
}: AddEvidenceDialogProps) {
  void _projectId;
  const [explanation, setExplanation] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitStructuredEvidence = useMutation(submitStructuredEvidenceRef);
  const generateUploadUrl = useMutation(generateUploadUrlRef);

  useEffect(() => {
    if (!open) {
      setExplanation("");
      setLink("");
      setFile(null);
      setError("");
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    setError("");
    const text = explanation.trim();
    if (text.length < MIN_EXPLANATION_LEN) {
      setError(
        `Please write at least ${MIN_EXPLANATION_LEN} characters explaining your position.`
      );
      return;
    }

    const linkTrimmed = link.trim();
    if (linkTrimmed && !/^https?:\/\//i.test(linkTrimmed)) {
      setError("Links must start with http:// or https://");
      return;
    }
    if (file && file.size > MAX_FILE_BYTES) {
      setError("File is too large. Max 25MB.");
      return;
    }

    setIsSubmitting(true);
    try {
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

      const evidenceType: "file" | "link" | "other" = fileId
        ? "file"
        : linkTrimmed
          ? "link"
          : "other";

      await submitStructuredEvidence({
        disputeId,
        description: text,
        evidenceType,
        fileId,
        url: linkTrimmed || undefined,
        userId,
      });

      setExplanation("");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add evidence</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="evidence-explanation">Your explanation</Label>
            <Textarea
              id="evidence-explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="State the facts as you see them: timeline, what was agreed, what happened, and what you’re asking the reviewer to consider."
              rows={10}
              maxLength={8000}
              className="min-h-[200px] resize-y"
            />
            <p className="text-[11px] text-muted-foreground">
              {explanation.trim().length} characters · minimum {MIN_EXPLANATION_LEN}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="evidence-link">Link (optional)</Label>
            <Input
              id="evidence-link"
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

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || explanation.trim().length < MIN_EXPLANATION_LEN}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
