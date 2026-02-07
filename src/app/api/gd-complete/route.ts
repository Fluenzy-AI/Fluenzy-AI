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

    // Update or create GD lesson progress
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

    // Increment GD usage count
    await prisma.users.update({
      where: { id: user.id },
      data: {
        gdUsage: { increment: 1 }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('GD lesson completion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
