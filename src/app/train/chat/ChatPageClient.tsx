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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-hidden h-screen">
      {/* Header */}
      <header className="h-14 sm:h-16 border-b border-white/5 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50 flex-shrink-0">
        <div className="h-full px-3 sm:px-4 flex items-center justify-between max-w-full">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent truncate">
              Messages
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <a
              href="/train/friends"
              className="text-xs sm:text-sm text-slate-400 hover:text-white transition-colors whitespace-nowrap"
            >
              Friends
            </a>
            <a
              href="/train"
              className="text-xs sm:text-sm text-slate-400 hover:text-white transition-colors whitespace-nowrap"
            >
              Dashboard
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-2 sm:p-4 min-w-0 overflow-hidden">
        <ChatLayout
          userId={userId}
          userName={userName}
          initialConversations={initialConversations}
        />
      </main>
    </div>
  );
}
