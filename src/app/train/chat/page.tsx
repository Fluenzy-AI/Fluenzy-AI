import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ChatPageClient from "./ChatPageClient";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { 
      id: true, 
      name: true, 
      avatar: true 
    },
  });
  
  if (!user) redirect("/login");

  // Fetch initial conversations with all relations
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: { userId: user.id }
      }
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      },
      group: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          content: true,
          type: true,
          createdAt: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 50
  });

  // Transform to list items
  const conversationItems = conversations.map(conv => {
    const currentParticipant = conv.participants.find(p => p.userId === user.id);
    const otherParticipants = conv.participants.filter(p => p.userId !== user.id);
    const lastMsg = conv.messages[0];
    
    return {
      id: conv.id,
      type: conv.type,
      name: conv.type === 'GROUP' 
        ? conv.group?.name || 'Group'
        : otherParticipants[0]?.user?.name || 'Unknown',
      avatar: conv.type === 'GROUP'
        ? conv.group?.avatar
        : otherParticipants[0]?.user?.avatar,
      lastMessage: lastMsg?.content || null,
      lastMessageAt: lastMsg?.createdAt || conv.updatedAt,
      unreadCount: currentParticipant?.unreadCount || 0,
      isPinned: currentParticipant?.isPinned || false,
      isMuted: currentParticipant?.isMuted || false,
      isArchived: currentParticipant?.isArchived || false,
      participants: otherParticipants.map(p => ({
        id: p.user.id,
        name: p.user.name,
        avatar: p.user.avatar
      }))
    };
  });

  return (
    <ChatPageClient 
      userId={user.id}
      userName={user.name || 'User'}
      initialConversations={conversationItems}
    />
  );
}
