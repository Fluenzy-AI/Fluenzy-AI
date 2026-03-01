import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { 
  getPlanConfig, 
  getUserUsageBreakdown, 
  reconcileSubscription,
  DEFAULT_PLAN_LIMITS 
} from "@/lib/billing";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: token.email },
      select: { id: true, name: true, email: true, avatar: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // CRITICAL: Reconcile subscription - check for expiry and auto-downgrade
    // This ensures UI always shows correct plan
    const reconciliation = await reconcileSubscription(user.id);
    
    // Get fresh user data after reconciliation
    const freshUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: {
        plan: true,
        renewalDate: true,
      },
    });

    // Get subscription status
    const subscription = await prisma.subscriptions.findFirst({
      where: {
        userId: user.id,
        status: "active"
      },
      orderBy: { createdAt: "desc" },
    });

    // Get plan configuration
    const userPlan = freshUser?.plan?.toString() || 'Free';
    const planConfig = await getPlanConfig(userPlan);
    
    // Get usage breakdown
    const usageData = await getUserUsageBreakdown(user.id);

    // Calculate total usage from the new system
    const totalUsage = usageData?.usage?.total || 0;
    
    // Get limits
    const limits = planConfig.moduleLimits || DEFAULT_PLAN_LIMITS[userPlan];
    const isUnlimited = planConfig.isUnlimited || false;

    // Calculate remaining for each module type (sum of all core modules)
    const coreModuleLimit = isUnlimited ? 999999 : (limits.english || 2);
    const totalCoreModules = 7; // english, daily, hr, technical, company, mock, gd
    const totalMonthlyLimit = isUnlimited ? 999999 : (coreModuleLimit * totalCoreModules);

    const planInfo = {
      plan: userPlan,
      planName: planConfig?.name || userPlan,
      price: planConfig?.price || 0,
      currency: planConfig?.currency || 'INR',
      monthlyLimit: isUnlimited ? null : totalMonthlyLimit,
      isUnlimited: isUnlimited,
      currentUsage: totalUsage,
      remainingUses: isUnlimited ? 'Unlimited' : Math.max(0, totalMonthlyLimit - totalUsage),
      renewalDate: freshUser?.renewalDate,
      subscription: subscription || null,
      // Include module-specific limits for display
      moduleLimits: {
        coreModules: coreModuleLimit,
        interviewGuide: limits.interviewGuide || 1,
      },
      // Include reconciliation info
      reconciliation: {
        wasDowngraded: reconciliation.wasDowngraded,
        previousPlan: reconciliation.previousPlan,
        action: reconciliation.action,
      },
      // User info for navbar
      user: {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      }
    };

    return NextResponse.json(planInfo);
  } catch (error) {
    console.error("Error fetching user plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
