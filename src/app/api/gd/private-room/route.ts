import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate unique room ID
    const roomId = `gd_${uuidv4().substring(0, 8)}_${Date.now().toString(36)}`;
    const channelName = `private_${roomId}`;

    // Create room in database using GDSession model
    const room = await prisma.gDSession.create({
      data: {
        channelName,
        topic: 'Private Discussion',
        topicCategory: 'Random',
        difficulty: 'Medium',
        phase: 'Waiting', // Will be changed to Active when GD starts
      }
    });

    // Add host as first participant
    await prisma.gDParticipant.create({
      data: {
        sessionId: room.id,
        userId: user.id,
        role: 'Initiator',
        order: 0,
        status: 'Active'
      }
    });

    return NextResponse.json({
      success: true,
      roomId,
      sessionId: room.id,
      channelName: room.channelName,
      hostId: user.id,
      message: 'Private room created successfully'
    });
  } catch (error) {
    console.error('Error creating private room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID required' }, { status: 400 });
    }

    // Find room by channelName (private rooms use channelName = private_{roomId})
    const channelName = `private_${roomId}`;
    const room = await prisma.gDSession.findUnique({
      where: { channelName },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Get host (first participant)
    const host = room.participants[0];

    return NextResponse.json({
      roomId,
      hostId: host?.userId,
      hostName: host?.user?.name || 'Host',
      status: room.phase === 'Completed' ? 'ended' : 'active',
      createdAt: room.createdAt,
      participantCount: room.participants.length,
      channelName: room.channelName,
      topic: room.topic,
      participants: room.participants.map((p: any) => ({
        userId: p.userId,
        userName: p.user?.name,
        role: p.role
      }))
    });
  } catch (error) {
    console.error('Error getting private room:', error);
    return NextResponse.json(
      { error: 'Failed to get room' },
      { status: 500 }
    );
  }
}
