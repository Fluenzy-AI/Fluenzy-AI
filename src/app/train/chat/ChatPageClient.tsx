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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Messages
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="/train/friends"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Friends
            </a>
            <a 
              href="/train"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Dashboard
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        <ChatLayout
          userId={userId}
          userName={userName}
          initialConversations={initialConversations}
        />
      </main>
    </div>
  );
}
