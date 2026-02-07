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

    // Fetch GD lesson progress
    const progressRecords = await prisma.gDProgress.findMany({
      where: { userId: user.id }
    });

    // Convert to object with lessonId as key
    const progressMap: { [key: string]: boolean } = {};
    progressRecords.forEach((record: any) => {
      progressMap[record.lessonId] = record.isCompleted;
    });

    return NextResponse.json(progressMap);
  } catch (error) {
    console.error('GD progress fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
