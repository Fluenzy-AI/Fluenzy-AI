"use client";

import { Suspense } from "react";
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
    <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-slate-950 text-white">Loading chat...</div>}>
      <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        <ChatLayout
          userId={userId}
          userName={userName}
          initialConversations={initialConversations}
        />
      </div>
    </Suspense>
  );
}

