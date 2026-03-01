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
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const payments = await prisma.paymentHistory.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        paymentId: true,
        orderId: true,
        plan: true,
        billingCycle: true,
        paymentCurrency: true,
        originalAmount: true,
        discountAmount: true,
        finalAmount: true,
        paymentMethod: true,
        status: true,
        couponUsed: true,
        couponType: true,
        date: true,
        receipt: {
          select: {
            receiptUrl: true,
            invoiceNumber: true,
          },
        },
      },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('[PAYMENT_HISTORY_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
