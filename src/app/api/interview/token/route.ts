import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateGDToken, isAgoraConfigured, isValidChannelName } from '@/lib/agoraToken';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { channelName, uid, role, userId: bodyUserId } = body;

    const effectiveUserId = bodyUserId || session?.user?.id || 'guest';

    if (!channelName || uid === undefined || uid === null) {
      return NextResponse.json({ error: 'Missing channelName or uid' }, { status: 400 });
    }

    if (!isValidChannelName(channelName)) {
      return NextResponse.json({ error: 'Invalid channel name format' }, { status: 400 });
    }

    if (!isAgoraConfigured()) {
      return NextResponse.json({ error: 'Agora is not configured' }, { status: 500 });
    }

    const result = await generateGDToken(channelName, uid, role === 'subscriber' ? 'subscriber' : 'publisher');

    return NextResponse.json({
      token: result.token,
      uid,
      channelName,
      appId: result.appId,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error('[Interview Token API]', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
