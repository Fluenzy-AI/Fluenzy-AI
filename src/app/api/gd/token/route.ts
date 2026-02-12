import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateGDToken, getAgoraAppId, isAgoraConfigured, isValidChannelName } from '@/lib/agoraToken';

export async function POST(request: NextRequest) {
  try {
    console.log('[Token API] Request received');
    
    const session = await getServerSession(authOptions);
    
    const body = await request.json();
    const { channelName, uid, role, sessionId, userId: bodyUserId } = body;

    // Use bodyUserId for Socket.IO sessions, fallback to session user or 'guest'
    const effectiveUserId = bodyUserId || session?.user?.id || 'guest';

    console.log('[Token API] Request params:', { channelName, uid, role, sessionId, effectiveUserId });

    // Validate required parameters
    if (!channelName) {
      console.error('[Token API] Missing channelName');
      return NextResponse.json({ error: 'Missing channel name' }, { status: 400 });
    }

    if (uid === undefined || uid === null) {
      console.error('[Token API] Missing uid');
      return NextResponse.json({ error: 'Missing UID' }, { status: 400 });
    }

    // Validate channel name format
    if (!isValidChannelName(channelName)) {
      console.error('[Token API] Invalid channel name:', channelName);
      return NextResponse.json({ error: 'Invalid channel name format' }, { status: 400 });
    }

    // Check if Agora is configured
    if (!isAgoraConfigured()) {
      console.error('[Token API] Agora not configured');
      return NextResponse.json(
        { error: 'Agora is not configured properly' },
        { status: 500 }
      );
    }

    // Try to find session in database first (for HTTP-based sessions)
    let participant = null;

    try {
      // Find by session ID if provided
      if (sessionId) {
        participant = await prisma.gDParticipant.findFirst({
          where: {
            sessionId: sessionId,
            userId: effectiveUserId,
            status: { in: ['Active', 'Joining'] }
          }
        });
        
        if (participant) {
          console.log('[Token API] Found participant in DB:', participant.id);
        } else {
          // Try to find any participant in this session with matching odlUserId
          participant = await prisma.gDParticipant.findFirst({
            where: {
              sessionId: sessionId,
              status: { in: ['Active', 'Joining'] }
            }
          });
          console.log('[Token API] Found participant (any) in DB:', participant?.id);
        }
      }
    } catch (dbError) {
      console.log('[Token API] Database lookup skipped (Socket.IO mode):', dbError);
    }

    // For Socket.IO sessions, allow token generation if:
    // 1. Participant found in DB, OR
    // 2. sessionId is provided (Socket.IO already validated the user), OR
    // 3. User is a guest (no auth)
    const isGuest = !session?.user?.id;
    const hasSocketIOSession = !!sessionId; // Socket.IO validated the user before emitting match-found

    // Allow if: guest, OR has Socket.IO session, OR DB participant found
    const isAllowed = isGuest || hasSocketIOSession || !!participant;

    if (!isAllowed) {
      console.error('[Token API] User not found in session');
      return NextResponse.json(
        { error: 'You are not part of this GD session' },
        { status: 403 }
      );
    }

    // Log the validation result
    console.log('[Token API] Validation result:', {
      participantFound: !!participant,
      isGuest,
      hasSocketIOSession,
      isAllowed
    });

    console.log('[Token API] Generating token for:', { channelName, uid, role });

    // Generate token
    const { token, expiresAt, appId } = await generateGDToken(
      channelName,
      uid,
      role || 'publisher'
    );

    console.log('[Token API] Token generated successfully');

    // Update participant status if found
    if (participant && participant.status === 'Joining') {
      await prisma.gDParticipant.update({
        where: { id: participant.id },
        data: { status: 'Active' }
      });
    }

    return NextResponse.json({
      success: true,
      token,
      expiresAt,
      appId,
      channelName,
      uid,
      role: role || 'publisher'
    });
  } catch (error: unknown) {
    console.error('[Token API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage || 'Failed to generate token', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return Agora App ID for client-side use
    return NextResponse.json({
      appId: getAgoraAppId(),
      configured: isAgoraConfigured()
    });
  } catch (error: any) {
    console.error('Agora config check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
