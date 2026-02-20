import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: token.email },
    });

    const subscription = await prisma.subscriptions.findFirst({
      where: {
        userId: user?.id,
        status: "active"
      },
      orderBy: { createdAt: "desc" },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get plan pricing
    const planPricing = await (prisma as any).planPricing.findMany();
    const pricingMap: Record<string, any> = {};
    planPricing.forEach((pricing: any) => {
      pricingMap[pricing.plan] = pricing;
    });

    // Get global settings
    const globalSettings = await (prisma as any).globalPlanSettings.findMany();
    const settingsMap: Record<string, any> = {};
    globalSettings.forEach((setting: any) => {
      settingsMap[setting.plan] = setting;
    });

    const userPlan = user.plan?.toString() || 'Free';
    const pricing = pricingMap[userPlan];
    const settings = settingsMap[userPlan];

    // Calculate total usage
    const totalUsage = (user.englishUsage || 0) +
                      (user.dailyUsage || 0) +
                      (user.hrUsage || 0) +
                      (user.technicalUsage || 0) +
                      (user.companyUsage || 0) +
                      (user.gdUsage || 0);

    const planInfo = {
      plan: userPlan,
      planName: pricing?.name || userPlan,
      price: pricing?.price || 0,
      currency: pricing?.currency || 'INR',
      monthlyLimit: settings?.isUnlimited ? null : settings?.monthlyLimit || 0,
      isUnlimited: settings?.isUnlimited || false,
      currentUsage: totalUsage,
      remainingUses: settings?.isUnlimited ? 'Unlimited' :
                    Math.max(0, (settings?.monthlyLimit || 0) - totalUsage),
      renewalDate: user.renewalDate,
      subscription: subscription || null,
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