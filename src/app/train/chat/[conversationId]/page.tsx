import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import ConversationPageClient from "./ConversationPageClient";

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params;
  
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true },
  });
  
  if (!user) redirect("/login");

  // Fetch conversation and verify access
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
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
          avatar: true,
          description: true
        }
      }
    }
  });

  if (!conversation) notFound();

  // Fetch initial messages
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      isDeleted: false
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      },
      replyTo: {
        include: {
          sender: {
            select: { id: true, name: true }
          }
        }
      },
      reactions: {
        include: {
          user: {
            select: { id: true, name: true }
          }
        }
      },
      readStatus: {
        select: { userId: true, readAt: true }
      }
    },
    orderBy: { createdAt: 'asc' },
    take: 50
  });

  // Build conversation info
  const otherParticipants = conversation.participants.filter(p => p.userId !== user.id);
  const conversationInfo = {
    id: conversation.id,
    type: conversation.type,
    name: conversation.type === 'GROUP' 
      ? conversation.group?.name || 'Group'
      : otherParticipants[0]?.user?.name || 'Unknown',
    avatar: conversation.type === 'GROUP'
      ? conversation.group?.avatar
      : otherParticipants[0]?.user?.avatar,
    description: conversation.group?.description,
    participants: conversation.participants.map(p => ({
      id: p.user.id,
      name: p.user.name,
      avatar: p.user.avatar
    }))
  };

  // Transform messages to include proper types
  const transformedMessages = messages.map(msg => ({
    ...msg,
    status: msg.status,
    sender: msg.sender,
    reactions: msg.reactions,
    readStatus: msg.readStatus,
    replyTo: msg.replyTo ? {
      id: msg.replyTo.id,
      content: msg.replyTo.content,
      senderId: msg.replyTo.senderId,
      senderName: msg.replyTo.sender?.name || 'Unknown',
      type: msg.replyTo.type
    } : null
  }));

  // Mark messages as read
  await prisma.conversationParticipant.updateMany({
    where: {
      conversationId,
      userId: user.id
    },
    data: {
      unreadCount: 0,
      lastReadAt: new Date()
    }
  });

  return (
    <ConversationPageClient 
      userId={user.id}
      userName={user.name || 'User'}
      conversation={conversationInfo}
      initialMessages={transformedMessages as any}
    />
  );
}
