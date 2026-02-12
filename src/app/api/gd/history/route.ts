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

    const { searchParams } = new URL(request.url);
    const historyId = searchParams.get('id');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // If historyId is provided, return detailed view
    if (historyId) {
      const history = await prisma.gDHistory.findFirst({
        where: {
          id: historyId,
          userId: user.id
        },
        include: {
          session: {
            include: {
              participants: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      avatar: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!history) {
        return NextResponse.json({ error: 'History not found' }, { status: 404 });
      }

      // Get transcript if available
      const transcript = await prisma.gDTranscript.findMany({
        where: { sessionId: history.sessionId },
        orderBy: { timestamp: 'asc' }
      });

      return NextResponse.json({
        ...history,
        transcript
      });
    }

    // Get GD history list for user
    const history = await prisma.gDHistory.findMany({
      where: { userId: user.id },
      include: {
        session: {
          select: {
            duration: true,
            topicCategory: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.gDHistory.count({
      where: { userId: user.id }
    });

    return NextResponse.json({
      history: history.map(h => ({
        id: h.id,
        topic: h.topic,
        topicCategory: h.topicCategory,
        role: h.role,
        duration: h.duration,
        overallScore: h.overallScore,
        communicationScore: h.communicationScore,
        confidenceScore: h.confidenceScore,
        grammarScore: h.grammarScore,
        relevanceScore: h.relevanceScore,
        leadershipScore: h.leadershipScore,
        roleScore: h.roleScore,
        strengths: h.strengths,
        improvements: h.improvements,
        createdAt: h.createdAt
      })),
      total,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error('GD history fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
