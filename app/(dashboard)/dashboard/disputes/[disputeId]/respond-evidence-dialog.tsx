"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Paperclip, X } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/error-handling";

type GenerateUploadUrlArgs = { userId?: Id<"users"> };
type GenerateUploadUrlResult = string;

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
type SubmitStructuredEvidenceResult = {
  success: boolean;
  evidenceId: Id<"disputeEvidence">;
};

const generateUploadUrlRef = makeFunctionReference<
  "mutation",
  GenerateUploadUrlArgs,
  GenerateUploadUrlResult
>("disputes/mutations:generateDisputeUploadUrl");

const submitStructuredEvidenceRef = makeFunctionReference<
  "mutation",
  SubmitStructuredEvidenceArgs,
  SubmitStructuredEvidenceResult
>("disputes/mutations:submitStructuredEvidence");

interface RespondEvidenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disputeId: Id<"disputes">;
  evidenceRequestId: Id<"disputeEvidenceRequests"> | null;
  requestDescription: string;
  userId: Id<"users">;
  onSuccess?: () => void;
}

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB

export function RespondEvidenceDialog({
  open,
  onOpenChange,
  disputeId,
  evidenceRequestId,
  requestDescription,
  userId,
  onSuccess,
}: RespondEvidenceDialogProps) {
  const [response, setResponse] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateUploadUrl = useMutation(generateUploadUrlRef);
  const submitStructuredEvidence = useMutation(submitStructuredEvidenceRef);

  useEffect(() => {
    if (!open) {
      setResponse("");
      setLink("");
      setFile(null);
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!evidenceRequestId) return;
    const trimmed = response.trim();
    if (!trimmed) {
      toast.error("Please type a response before submitting.");
      return;
    }

    const linkTrimmed = link.trim();
    if (linkTrimmed && !/^https?:\/\//i.test(linkTrimmed)) {
      toast.error("Links must start with http:// or https://");
      return;
    }
    if (file && file.size > MAX_FILE_BYTES) {
      toast.error("File is too large. Max 25MB.");
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
        if (!res.ok) {
          throw new Error("File upload failed");
        }
        const json = (await res.json()) as { storageId: Id<"_storage"> };
        fileId = json.storageId;
      }

      const evidenceType: "file" | "link" | "other" = fileId
        ? "file"
        : linkTrimmed
          ? "link"
          : "other";

      const titlePreview = trimmed.split(/\s+/).slice(0, 8).join(" ");
      const title = titlePreview.length > 0
        ? titlePreview.length < trimmed.length ? `${titlePreview}…` : titlePreview
        : "Response to evidence request";

      await submitStructuredEvidence({
        disputeId,
        evidenceRequestId,
        title,
        description: trimmed,
        evidenceType,
        fileId,
        url: linkTrimmed || undefined,
        userId,
      });

      toast.success("Response submitted.");
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(getUserFriendlyError(err) || "Could not submit response.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Respond to evidence request</DialogTitle>
          <DialogDescription>
            Type your response below. You can optionally attach a file or share a link.
          </DialogDescription>
        </DialogHeader>

        {requestDescription && (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Staff request
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">
              {requestDescription}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="evidence-response">
              Your response <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="evidence-response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Explain in your own words. Be specific — include dates, amounts, and what was agreed."
              rows={6}
              maxLength={4000}
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              {response.length}/4000
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="evidence-link">Reference link (optional)</Label>
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
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
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
            <p className="text-[11px] text-muted-foreground">
              PDFs, images, or documents. Max 25MB.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || !response.trim() || !evidenceRequestId}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit response"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
