import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { interviewSettings: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user.interviewSettings || null);
  } catch (error) {
    console.error('Failed to get interview settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { voiceSpeed, voiceId, pressureStyle, responseTiming } = body;
    
    const updateData: any = {};
    if (voiceSpeed !== undefined) updateData.voiceSpeed = voiceSpeed;
    if (voiceId !== undefined) updateData.voiceId = voiceId;
    if (pressureStyle !== undefined) updateData.pressureStyle = pressureStyle;
    if (responseTiming !== undefined) updateData.responseTiming = responseTiming;

    const user = await prisma.users.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentSettings = (user.interviewSettings as Record<string, any>) || {};
    const newSettings = { ...currentSettings, ...updateData };

    await prisma.users.update({
      where: { email: session.user.email },
      data: { interviewSettings: newSettings }
    });

    return NextResponse.json({ success: true, settings: newSettings });
  } catch (error) {
    console.error('Failed to update interview settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
