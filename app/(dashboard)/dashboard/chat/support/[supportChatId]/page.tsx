"use client";

import { ChatThread } from "@/components/chat/chat-thread";

/** Support-only conversation view (separate URL from project messages). */
export default function SupportChatThreadPage() {
  return <ChatThread threadKind="support" />;
}
