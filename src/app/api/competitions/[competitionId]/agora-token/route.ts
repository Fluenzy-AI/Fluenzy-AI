import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

// ═══════════════════════════════════════════════════════════════════════════════
// Agora Token Generation for Competition Battles
// Generates RTC tokens for video/audio in GD battles
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    const { competitionId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId, agoraUid } = await request.json();

    // Check if user is registered for this competition
    const participant = await prisma.competitionParticipant.findFirst({
      where: {
        competitionId: competitionId,
        userId: session.user.id
      }
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Not registered for this competition' },
        { status: 403 }
      );
    }

    // Get competition details
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId }
    });

    if (!competition) {
      return NextResponse.json(
        { success: false, error: 'Competition not found' },
        { status: 404 }
      );
    }

    // Check if competition is active
    if (competition.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Competition is not active' },
        { status: 400 }
      );
    }

    // Get Agora credentials
    const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

    if (!APP_ID || !APP_CERTIFICATE) {
      return NextResponse.json(
        { success: false, error: 'Agora credentials not configured' },
        { status: 500 }
      );
    }

    // Generate channel name based on competition ID
    const channelName = `comp_${competitionId}`;

    // Token expires in 24 hours
    const expirationTimeInSeconds = 86400;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Build token - 7 parameters required
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      agoraUid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return NextResponse.json({
      success: true,
      token,
      channelName,
      appId: APP_ID,
      uid: agoraUid,
      expiresAt: privilegeExpiredTs
    });
  } catch (error) {
    console.error('Agora token generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
