import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import FriendsPageClient from "./FriendsPageClient";

export default async function FriendsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true },
  });
  
  if (!user) redirect("/login");

  // Fetch friends with profile info
  const friendships = await prisma.friendship.findMany({
    where: { userId: user.id },
    include: {
      friend: {
        select: {
          id: true,
          name: true,
          avatar: true,
          profile: {
            select: {
              username: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Fetch pending received requests
  const receivedRequests = await prisma.friendRequest.findMany({
    where: {
      receiverId: user.id,
      status: 'PENDING'
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatar: true,
          profile: {
            select: {
              username: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Fetch pending sent requests
  const sentRequests = await prisma.friendRequest.findMany({
    where: {
      senderId: user.id,
      status: 'PENDING'
    },
    include: {
      receiver: {
        select: {
          id: true,
          name: true,
          avatar: true,
          profile: {
            select: {
              username: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Transform to flatten profile username
  const friends = friendships.map(f => ({
    id: f.friend.id,
    name: f.friend.name,
    avatar: f.friend.avatar,
    username: f.friend.profile?.username || null
  }));
  
  const incomingRequests = receivedRequests.map(r => ({
    id: r.id,
    user: {
      id: r.sender.id,
      name: r.sender.name,
      avatar: r.sender.avatar,
      username: r.sender.profile?.username || null
    },
    createdAt: r.createdAt
  }));
  
  const outgoingRequests = sentRequests.map(r => ({
    id: r.id,
    user: {
      id: r.receiver.id,
      name: r.receiver.name,
      avatar: r.receiver.avatar,
      username: r.receiver.profile?.username || null
    },
    createdAt: r.createdAt
  }));

  return (
    <FriendsPageClient 
      userId={user.id}
      friends={friends}
      incomingRequests={incomingRequests}
      outgoingRequests={outgoingRequests}
    />
  );
}
