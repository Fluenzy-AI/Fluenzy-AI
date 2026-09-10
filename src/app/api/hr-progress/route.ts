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
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch HR lesson progress
    const progressRecords = await prisma.hRProgress.findMany({
      where: { userId: user.id }
    });

    // Convert to object with lessonId as key
    const progressMap: { [key: string]: boolean } = {};
    progressRecords.forEach((record: any) => {
      progressMap[record.lessonId] = record.isCompleted;
    });

    return NextResponse.json(progressMap);
  } catch (error) {
    console.error('HR progress fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lessonId, isCompleted = true } = await request.json();
    if (!lessonId) {
      return NextResponse.json({ error: 'Missing lessonId' }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const record = await prisma.hRProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId,
        }
      },
      update: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
      create: {
        userId: user.id,
        lessonId,
        isCompleted,
        completedAt: isCompleted ? new Date() : undefined,
      }
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('HR progress save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.hRProgress.deleteMany({
      where: { userId: user.id }
    });

    return NextResponse.json({ success: true, message: 'HR progress reset' });
  } catch (error) {
    console.error('HR progress reset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}