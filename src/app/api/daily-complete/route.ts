import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { incrementModuleUsage } from '@/lib/billing';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lessonId } = await request.json();
    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID required' }, { status: 400 });
    }

    // Find the user
    const user = await prisma.users.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Increment Daily Conversation usage count using centralized billing system
    console.log(`[SESSION_COMPLETE] User: ${user.id}, Module: DAILY_CONVERSATION, SessionID: ${lessonId}`);
    const usageResult = await incrementModuleUsage(user.id, 'daily');

    if (!usageResult.success) {
      console.error(`[INCREMENT_FAILED] User: ${user.id}, Module: daily, Error: ${usageResult.error}`);
      return NextResponse.json({
        error: usageResult.error || 'Failed to record usage',
        success: false
      }, { status: 500 });
    }

    // Dispatch event for UI refetch
    console.log('[SESSION_COMPLETE_DISPATCH] Daily conversation session completed, UI refetch triggered');

    return NextResponse.json({ 
      success: true,
      usage: usageResult.currentUsage,
      remaining: usageResult.remaining,
      message: 'Daily conversation session completed'
    });
  } catch (error) {
    console.error('Daily conversation completion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
