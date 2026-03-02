import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const interviewType: string = body.interviewType || 'PI'; // 'PI' | 'Technical'

    const roomId = `ivt_${user.id.slice(-4)}_${Date.now().toString(36)}`;
    const channelName = `private_interview_${roomId}`;
    const token = `ivt_${Buffer.from(JSON.stringify({ roomId, hostId: user.id, interviewType })).toString('base64url')}`;

    return NextResponse.json({
      success: true,
      roomId,
      channelName,
      hostId: user.id,
      interviewType,
      inviteToken: token,
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/train/interview/private/${roomId}?token=${token}`,
    });
  } catch (error) {
    console.error('[Interview Private Room]', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const roomId = searchParams.get('roomId');

    if (!token || !roomId) {
      return NextResponse.json({ error: 'Missing token or roomId' }, { status: 400 });
    }

    try {
      const payload = JSON.parse(Buffer.from(token.replace('ivt_', ''), 'base64url').toString());
      if (payload.roomId !== roomId) {
        return NextResponse.json({ error: 'Invalid invite token' }, { status: 403 });
      }
      return NextResponse.json({ valid: true, roomId, interviewType: payload.interviewType });
    } catch {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to validate room' }, { status: 500 });
  }
}
