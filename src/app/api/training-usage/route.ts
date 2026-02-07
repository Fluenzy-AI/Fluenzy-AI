import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const MODULE_USAGE_FIELDS = {
  english: "englishUsage",
  daily: "dailyUsage",
  hr: "hrUsage",
  technical: "technicalUsage",
  company: "companyUsage",
  mock: "mockUsage",
  gd: "gdUsage",
} as const;

// Helper function to check and reset monthly usage
async function checkMonthlyReset(user: any) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Get global settings
  const globalSettings = await (prisma as any).globalPlanSettings.findMany();
  const settingsMap: Record<string, any> = {};
  globalSettings.forEach((setting: any) => {
    settingsMap[setting.plan] = setting;
  });

  const userPlan = user.plan?.toString() || 'Free';
  const planSettings = settingsMap[userPlan];

  if (!planSettings || planSettings.status !== 'active') {
    // Default limits if no global settings or plan disabled
    return { limit: 0, resetNeeded: false }; // Block usage if no settings
  }

  // Check if unlimited
  if (planSettings.isUnlimited) {
    return { limit: 999999, resetNeeded: false };
  }

  const lastReset = new Date(planSettings.lastReset);
  const lastResetMonth = lastReset.getMonth();
  const lastResetYear = lastReset.getFullYear();

  const resetNeeded = currentMonth !== lastResetMonth || currentYear !== lastResetYear;

  if (resetNeeded) {
    // Reset usage including interviewGuideUsage
    await (prisma.users.update as any)({
      where: { id: user.id },
      data: {
        usageCount: 0,
        englishUsage: 0,
        dailyUsage: 0,
        hrUsage: 0,
        technicalUsage: 0,
        companyUsage: 0,
        mockUsage: 0,
        gdUsage: 0,
        interviewGuideUsage: 0,
      },
    });

    // Update last reset
    await (prisma as any).globalPlanSettings.update({
      where: { plan: userPlan },
      data: { lastReset: now },
    });

    // Refresh user data
    const updatedUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: {
        englishUsage: true,
        dailyUsage: true,
        hrUsage: true,
        technicalUsage: true,
        companyUsage: true,
        mockUsage: true,
        gdUsage: true,
      },
    });

    return { limit: planSettings.monthlyLimit || 0, resetNeeded: true, updatedUser };
  }

  return { limit: planSettings.monthlyLimit || 0, resetNeeded: false };
}

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: token.email as string },
      select: {
        id: true,
        plan: true,
        englishUsage: true,
        dailyUsage: true,
        hrUsage: true,
        technicalUsage: true,
        companyUsage: true,
        mockUsage: true,
        gdUsage: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for monthly reset
    const { limit, resetNeeded, updatedUser } = await checkMonthlyReset(user);
    const currentUser = updatedUser ? { ...user, ...updatedUser } : user;

    const usage = {
      english: currentUser.englishUsage ?? 0,
      daily: currentUser.dailyUsage ?? 0,
      hr: currentUser.hrUsage ?? 0,
      technical: currentUser.technicalUsage ?? 0,
      company: currentUser.companyUsage ?? 0,
      mock: currentUser.mockUsage ?? 0,
      gd: currentUser.gdUsage ?? 0,
    };

    // Check against global limits
    const isUnlimited = limit >= 999999; // Pro plan
    const canUse = isUnlimited ? {
      english: true,
      daily: true,
      hr: true,
      technical: true,
      company: true,
      mock: true,
      gd: true,
    } : {
      english: (currentUser.englishUsage ?? 0) < limit,
      daily: (currentUser.dailyUsage ?? 0) < limit,
      hr: (currentUser.hrUsage ?? 0) < limit,
      technical: (currentUser.technicalUsage ?? 0) < limit,
      company: (currentUser.companyUsage ?? 0) < limit,
      mock: (currentUser.mockUsage ?? 0) < limit,
      gd: (currentUser.gdUsage ?? 0) < limit,
    };

    const remaining = isUnlimited ? {
      english: "Unlimited",
      daily: "Unlimited",
      hr: "Unlimited",
      technical: "Unlimited",
      company: "Unlimited",
      mock: "Unlimited",
      gd: "Unlimited",
    } : {
      english: Math.max(0, limit - (currentUser.englishUsage ?? 0)),
      daily: Math.max(0, limit - (currentUser.dailyUsage ?? 0)),
      hr: Math.max(0, limit - (currentUser.hrUsage ?? 0)),
      technical: Math.max(0, limit - (currentUser.technicalUsage ?? 0)),
      company: Math.max(0, limit - (currentUser.companyUsage ?? 0)),
      mock: Math.max(0, limit - (currentUser.mockUsage ?? 0)),
      gd: Math.max(0, limit - (currentUser.gdUsage ?? 0)),
    };

    // Get plan pricing for display name
    const planPricing = await (prisma as any).planPricing.findUnique({
      where: { plan: currentUser.plan },
    });

    return NextResponse.json({
      usage,
      canUse,
      remaining,
      plan: currentUser.plan,
      planName: planPricing?.name || currentUser.plan,
      limit,
      resetPerformed: resetNeeded,
    });
  } catch (error) {
    console.error("Training usage check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { module } = body;

    if (!module || !MODULE_USAGE_FIELDS[module as keyof typeof MODULE_USAGE_FIELDS]) {
      return NextResponse.json({ error: "Invalid module" }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { email: token.email as string },
      select: {
        id: true,
        plan: true,
        englishUsage: true,
        dailyUsage: true,
        hrUsage: true,
        technicalUsage: true,
        companyUsage: true,
        mockUsage: true,
        gdUsage: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for monthly reset
    const { limit } = await checkMonthlyReset(user);

    // Check if unlimited
    if (limit >= 999999) {
      return NextResponse.json({
        success: true,
        message: "Unlimited usage - no limits",
        plan: user.plan,
      });
    }

    const currentUsage = user[MODULE_USAGE_FIELDS[module as keyof typeof MODULE_USAGE_FIELDS] as keyof typeof user] as number;

    if (currentUsage >= limit) {
      return NextResponse.json(
        {
          error: "Usage limit reached",
          usage: currentUsage,
          limit,
          plan: user.plan,
          canUse: false,
        },
        { status: 403 }
      );
    }

    // Increment usage
    const updateData = {
      [MODULE_USAGE_FIELDS[module as keyof typeof MODULE_USAGE_FIELDS]]: currentUsage + 1,
    };

    const updatedUser = await prisma.users.update({
      where: { id: user.id },
      data: updateData,
      select: {
        englishUsage: true,
        dailyUsage: true,
        hrUsage: true,
        technicalUsage: true,
        companyUsage: true,
        mockUsage: true,
        gdUsage: true,
        plan: true,
      },
    });

    const newUsage = updatedUser[MODULE_USAGE_FIELDS[module as keyof typeof MODULE_USAGE_FIELDS] as keyof typeof updatedUser] as number;

    return NextResponse.json({
      success: true,
      usage: newUsage,
      limit,
      plan: updatedUser.plan,
      canUse: newUsage < limit,
      remaining: Math.max(0, limit - newUsage),
    });
  } catch (error) {
    console.error("Training usage increment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}