import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { incrementModuleUsage } from '@/lib/billing';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('[GD_COMPLETE_AUTH_FAILED] No session or email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lessonId } = await request.json();
    if (!lessonId) {
      console.log('[GD_COMPLETE_VALIDATION_FAILED] No lessonId provided');
      return NextResponse.json({ error: 'Lesson ID required' }, { status: 400 });
    }

    console.log(`[GD_COMPLETE_REQUEST_START] Email: ${session.user.email}, LessonID: ${lessonId}`);

    // Find the user
    const user = await prisma.users.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      console.log(`[GD_COMPLETE_USER_NOT_FOUND] Email: ${session.user.email}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`[GD_COMPLETE_USER_FOUND] User ID: ${user.id}`);

    // Update or create GD Coach lesson progress
    await prisma.gDProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lessonId
        }
      },
      update: {
        isCompleted: true,
        completedAt: new Date()
      },
      create: {
        userId: user.id,
        lessonId: lessonId,
        isCompleted: true,
        completedAt: new Date()
      }
    });

    console.log(`[GD_COMPLETE_PROGRESS_UPDATED] User: ${user.id}, Lesson: ${lessonId}`);

    // CRITICAL FIX: Increment GD Coach usage (not GD Agent)
    // GD Coach has its own separate limit (gdCoachUsage field)
    console.log(`[SESSION_COMPLETE] User: ${user.id}, Module: GD_COACH, SessionID: ${lessonId}`);
    const usageResult = await incrementModuleUsage(user.id, 'gdCoach');

    console.log(`[GD_COMPLETE_INCREMENT_RESULT] Success: ${usageResult.success}, CurrentUsage: ${usageResult.currentUsage}, Remaining: ${usageResult.remaining}`);

    if (!usageResult.success) {
      console.error(`[INCREMENT_FAILED] User: ${user.id}, Module: gdCoach, Error: ${usageResult.error}`);
      return NextResponse.json({
        error: usageResult.error || 'Failed to record usage',
        success: false
      }, { status: 500 });
    }

    console.log('[SESSION_COMPLETE_SUCCESS] GD Coach session completed successfully');
    console.log('[FRONTEND_REFETCH_REQUIRED] reason: session_completed, data: usage_updated, history_updated, user_plan_updated');
    
    return NextResponse.json({ 
      success: true,
      usage: usageResult.currentUsage,
      remaining: usageResult.remaining,
      limit: usageResult.limit,
      isLimitExceeded: usageResult.remaining === 0,
      message: 'GD Coach lesson completed'
    });
  } catch (error) {
    console.error('GD lesson completion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
