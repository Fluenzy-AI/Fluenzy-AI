import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

function calculateStreak(sessions: { createdAt: Date | string }[]): number {
  if (!sessions || sessions.length === 0) return 0;

  const dateStrings = Array.from(
    new Set(
      sessions.map((s) => {
        const d = new Date(s.createdAt);
        return d.toISOString().split('T')[0];
      })
    )
  ).sort((a, b) => (a > b ? -1 : 1));

  if (dateStrings.length === 0) return 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  // If latest activity is not today or yesterday, streak is broken
  if (dateStrings[0] !== todayStr && dateStrings[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  let currentDate = new Date(dateStrings[0]);

  for (let i = 1; i < dateStrings.length; i++) {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const expectedStr = prevDate.toISOString().split('T')[0];

    if (dateStrings[i] === expectedStr) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }

  return streak;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sessions = await (prisma as any).session.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        duration: true,
        startTime: true,
        endTime: true,
      },
    });

    const totalSessions = sessions.length;
    const streakDays = calculateStreak(sessions);

    let totalMinutes = 0;
    for (const s of sessions) {
      if (typeof s.duration === 'number' && s.duration > 0) {
        totalMinutes += s.duration;
      } else if (s.startTime && s.endTime) {
        const diffMs = new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
        if (diffMs > 0) {
          totalMinutes += Math.round(diffMs / 60000);
        }
      }
    }

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const totalPracticeDisplay = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    return NextResponse.json({
      sessionsDone: totalSessions,
      dayStreak: streakDays,
      totalPracticeMinutes: totalMinutes,
      totalPracticeDisplay,
    });
  } catch (error) {
    console.error('[USER_STATS_FETCH_ERROR]', error);
    return NextResponse.json({
      sessionsDone: 0,
      dayStreak: 0,
      totalPracticeMinutes: 0,
      totalPracticeDisplay: '0m',
    });
  }
}
