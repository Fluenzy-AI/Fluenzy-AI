import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { validateModuleAccess, incrementModuleUsage } from '@/lib/billing';

/**
 * POST /api/session-start
 * 
 * CRITICAL: This endpoint MUST be called BEFORE starting Gemini API connection.
 * It validates user has sessions remaining and decrements usage IMMEDIATELY.
 * 
 * This prevents abuse where users:
 * 1. Start interview
 * 2. Use Gemini API
 * 3. Refresh page (no decrement happens)
 * 4. Repeat for unlimited usage
 * 
 * Flow:
 * 1. Validate user has sessions remaining
 * 2. Create ActiveSession record (to track abandoned sessions)
 * 3. Decrement usage IMMEDIATELY
 * 4. Return sessionToken for tracking
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, plan: true, disabled: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.disabled) {
      return NextResponse.json({ error: 'Account is disabled' }, { status: 403 });
    }

    const { module, lessonId, lessonTitle } = await request.json();

    if (!module) {
      return NextResponse.json({ error: 'Module is required' }, { status: 400 });
    }

    console.log('[SESSION_START_REQUEST]', { 
      userId: user.id, 
      module, 
      lessonId, 
      timestamp: new Date().toISOString() 
    });

    // Step 1: Validate user has sessions remaining
    const validation = await validateModuleAccess(user.id, module);

    if (!validation.allowed) {
      console.log('[SESSION_START_BLOCKED]', { 
        userId: user.id, 
        module, 
        reason: validation.error || 'No sessions remaining',
        currentUsage: validation.currentUsage,
        limit: validation.limit
      });
      
      return NextResponse.json({ 
        success: false,
        error: validation.error || 'No sessions remaining',
        remaining: validation.remaining,
        limit: validation.limit,
        isUnlimited: validation.isUnlimited
      }, { status: 403 });
    }

    // Step 2: Generate session token for tracking
    const sessionToken = `ST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Step 3: IMMEDIATELY decrement usage (before Gemini API call)
    // This is the critical fix - decrement happens NOW, not on "End Interview"
    if (!validation.isUnlimited) {
      const incrementResult = await incrementModuleUsage(user.id, module);
      
      if (!incrementResult.success) {
        console.error('[SESSION_START_INCREMENT_FAILED]', {
          userId: user.id,
          module,
          error: incrementResult.error
        });
        
        return NextResponse.json({
          success: false,
          error: incrementResult.error || 'Failed to start session',
          remaining: incrementResult.remaining
        }, { status: 500 });
      }

      console.log('[SESSION_START_DECREMENTED]', {
        userId: user.id,
        module,
        sessionToken,
        previousRemaining: validation.remaining,
        newRemaining: incrementResult.remaining,
        currentUsage: incrementResult.currentUsage
      });

      // Step 4: Create ActiveSession record to track this session
      try {
        await (prisma as any).activeSession.create({
          data: {
            sessionToken,
            userId: user.id,
            module,
            lessonId: lessonId || null,
            lessonTitle: lessonTitle || null,
            status: 'active',
            startTime: new Date()
          }
        });
        console.log('[ACTIVE_SESSION_CREATED]', { sessionToken, userId: user.id, module });
      } catch (dbError) {
        // If ActiveSession model doesn't exist yet, log but don't fail
        console.warn('[ACTIVE_SESSION_CREATE_SKIPPED]', { 
          reason: 'Model may not exist yet',
          error: dbError instanceof Error ? dbError.message : 'Unknown error'
        });
      }

      return NextResponse.json({
        success: true,
        sessionToken,
        remaining: incrementResult.remaining,
        currentUsage: incrementResult.currentUsage,
        limit: incrementResult.limit,
        isUnlimited: false,
        message: 'Session started and usage decremented'
      });
    }

    // For unlimited modules, just return success without decrement
    console.log('[SESSION_START_UNLIMITED]', { userId: user.id, module, sessionToken });
    
    return NextResponse.json({
      success: true,
      sessionToken,
      remaining: 999999,
      currentUsage: 0,
      limit: 999999,
      isUnlimited: true,
      message: 'Session started (unlimited module)'
    });

  } catch (error) {
    console.error('[SESSION_START_ERROR]', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    });
    return NextResponse.json({ 
      success: false,
      error: 'Failed to start session' 
    }, { status: 500 });
  }
}
