import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { handleSubscriptionRenewal, checkSubscriptionStatus, getPlanPricing } from "@/lib/billing";

/**
 * POST - Handle manual subscription renewal
 * Can be triggered by admin or webhook from payment provider
 */
export async function POST(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions);
    
    // Allow both authenticated users (own renewal) and admins (any user)
    if (!authSession?.user?.email) {
      // Check for admin API key in headers for webhook calls
      const apiKey = request.headers.get("x-api-key");
      if (apiKey !== process.env.ADMIN_API_KEY) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
    }

    const body = await request.json();
    const { userId, plan, billingCycle, razorpaySubscriptionId } = body;

    // If no userId provided, use the authenticated user
    let targetUserId = userId;
    
    if (!targetUserId && authSession?.user?.email) {
      const user = await prisma.users.findUnique({
        where: { email: authSession.user.email },
        select: { id: true },
      });
      targetUserId = user?.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify admin authorization if modifying another user
    if (userId && authSession?.user?.email) {
      const adminUser = await prisma.users.findUnique({
        where: { email: authSession.user.email },
        select: { role: true },
      });
      
      if (adminUser?.role !== "SUPER_ADMIN" && adminUser?.role !== "Admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    if (!plan) {
      return NextResponse.json({ error: "Plan is required" }, { status: 400 });
    }

    const result = await handleSubscriptionRenewal(
      targetUserId,
      plan,
      billingCycle || "monthly",
      razorpaySubscriptionId
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Subscription renewal error:", error);
    return NextResponse.json(
      { error: "Failed to process subscription renewal" },
      { status: 500 }
    );
  }
}

/**
 * GET - Check subscription status for the current user
 * Can be used by frontend to show renewal warnings
 */
export async function GET(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions);

    if (!authSession?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: authSession.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const status = await checkSubscriptionStatus(user.id);
    
    // Get plan details
    const userData = await prisma.users.findUnique({
      where: { id: user.id },
      select: { plan: true },
    });

    const pricing = userData ? await getPlanPricing(userData.plan as string) : null;

    return NextResponse.json({
      ...status,
      plan: userData?.plan,
      planName: pricing?.name,
      price: pricing?.price,
    });
  } catch (error) {
    console.error("Subscription status check error:", error);
    return NextResponse.json(
      { error: "Failed to check subscription status" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Process expired/downgraded subscriptions
 * Should be called by a scheduled cron job
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify admin API key for cron job
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "process-expired") {
      // Find all users whose subscriptions have expired
      const now = new Date();
      
      const expiredUsers = await prisma.users.findMany({
        where: {
          renewalDate: {
            lt: now,
          },
          plan: {
            not: "Free",
          },
        },
        select: {
          id: true,
          plan: true,
          email: true,
        },
      });

      const results = {
        processed: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const user of expiredUsers) {
        try {
          // Downgrade to Free plan and reset usage
          await prisma.users.update({
            where: { id: user.id },
            data: {
              plan: "Free",
              usageLimit: 3,
              // Reset all usage counters
              usageCount: 0,
              englishUsage: 0,
              dailyUsage: 0,
              hrUsage: 0,
              technicalUsage: 0,
              companyUsage: 0,
              mockUsage: 0,
              gdUsage: 0,
              interviewGuideUsage: 0,
              renewalDate: null,
              billingCycle: null,
            },
          });

          // Update subscription status if exists
          await (prisma as any).subscriptions.updateMany({
            where: { userId: user.id, status: "active" },
            data: { status: "expired" },
          });

          results.processed++;
          console.log(`Processed expired subscription for user: ${user.email}`);
        } catch (err: any) {
          results.failed++;
          results.errors.push(`Failed for ${user.email}: ${err.message}`);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Processed ${results.processed} expired subscriptions`,
        results,
      });
    }

    if (action === "check-expiring-soon") {
      // Find subscriptions expiring within 7 days
      const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const now = new Date();

      const expiringUsers = await prisma.users.findMany({
        where: {
          renewalDate: {
            gt: now,
            lt: soon,
          },
          plan: {
            not: "Free",
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          renewalDate: true,
        },
      });

      return NextResponse.json({
        count: expiringUsers.length,
        users: expiringUsers,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Subscription maintenance error:", error);
    return NextResponse.json(
      { error: "Failed to process subscription maintenance" },
      { status: 500 }
    );
  }
}
