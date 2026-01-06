"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChatEvidenceSelector } from "@/components/disputes/chat-evidence-selector";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

interface AddEvidenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disputeId: Id<"disputes">;
  projectId: Id<"projects">;
  userId: Id<"users">;
  onSuccess: () => void;
}

export function AddEvidenceDialog({
  open,
  onOpenChange,
  disputeId,
  projectId,
  userId,
  onSuccess,
}: AddEvidenceDialogProps) {
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const addEvidence = useMutation(api.disputes.mutations.addEvidence);

  const handleSubmit = async () => {
    if (selectedMessages.length === 0) {
      setError("Please select at least one message");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Add each selected message as evidence
      for (const messageId of selectedMessages) {
        await addEvidence({
          disputeId,
          evidence: {
            type: "message",
            messageId: messageId as any,
            description: "Chat message evidence",
          },
          userId,
        });
      }

      setSelectedMessages([]);
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to add evidence");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Evidence from Chat</DialogTitle>
          <DialogDescription>
            Select chat messages to add as evidence for this dispute
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <ChatEvidenceSelector
            projectId={projectId}
            userId={userId}
            selectedMessages={selectedMessages as any}
            onSelectionChange={(ids) => setSelectedMessages(ids as string[])}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || selectedMessages.length === 0}>
            {isSubmitting ? "Adding..." : `Add ${selectedMessages.length} Message${selectedMessages.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

