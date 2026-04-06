"use client";

import { ChatThread } from "@/components/chat/chat-thread";

/** Project (and system) chats only. Support threads use `/dashboard/chat/support/[supportChatId]`. */
export default function ProjectChatDetailPage() {
  return <ChatThread threadKind="project" />;
}
