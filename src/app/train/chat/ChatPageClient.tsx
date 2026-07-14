"use client";

import { ChatLayout } from "@/components/chat";
import type { ConversationListItem } from "@/modules/chat/types/chat.types";

interface ChatPageClientProps {
  userId: string;
  userName: string;
  initialConversations: ConversationListItem[];
}

export default function ChatPageClient({
  userId,
  userName,
  initialConversations
}: ChatPageClientProps) {
  return (
    // Fill all space below the global LayoutWrapper top navbar.
    // The LayoutWrapper's <main> is flex-col, so flex-1 + overflow-hidden
    // gives the chat UI exactly the remaining viewport height.
    <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      <ChatLayout
        userId={userId}
        userName={userName}
        initialConversations={initialConversations}
      />
    </div>
  );
}
