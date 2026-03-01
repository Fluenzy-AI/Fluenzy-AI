import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { 
  MODULE_USAGE_FIELDS, 
  ModuleType, 
  validateModuleAccess, 
  incrementModuleUsage,
  getUserUsageBreakdown,
  getPlanConfig,
  DEFAULT_PLAN_LIMITS,
  getModuleAccessType,
  UNLIMITED_MODULES,
  LIMITED_MODULES
} from "@/lib/billing";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: token.email as string },
      select: { id: true, plan: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get comprehensive usage breakdown
    const usageData = await getUserUsageBreakdown(user.id);
    
    if (!usageData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get plan pricing for display name
    const planConfig = await getPlanConfig(user.plan as string);

    // Build canUse object with proper unlimited handling
    const canUse: Record<string, boolean> = {};
    const isUnlimited: Record<string, boolean> = {};
    
    // Check each module's access type
    const allModuleKeys = [
      'english', 'daily', 'hr', 'technical', 'company', 'mock', 'gdCoach', 'gd', 'interviewGuide',
      'vocabulary', 'latestTopics', 'corporateVoice'
    ];
    
    console.log('[TRAINING_USAGE] Checking modules:', allModuleKeys);
    
    for (const key of allModuleKeys) {
      const moduleType = key as ModuleType;
      const accessType = getModuleAccessType(moduleType);
      
      if (accessType === 'unlimited') {
        // Unlimited modules are always accessible
        canUse[key] = true;
        isUnlimited[key] = true;
        console.log(`[MODULE_UNLIMITED] ${key} is unlimited`);
      } else if (accessType === 'limited') {
        // Limited modules depend on remaining count - use from getUserUsageBreakdown
        const remaining = usageData.remaining[key as keyof typeof usageData.remaining];
        canUse[key] = (remaining || 0) > 0;
        // Also check if returned isUnlimited from usage breakdown
        isUnlimited[key] = usageData.isUnlimited?.[key] || false;
        console.log(`[MODULE_LIMITED] ${key}: canUse=${canUse[key]}, remaining=${remaining}`);
      } else if (accessType === 'partial') {
        // Partial modules (like GD) - parent is unlimited, sub-features have limits
        // GD parent module should be unlimited (no direct limit)
        canUse[key] = true;
        isUnlimited[key] = true;
        console.log(`[MODULE_PARTIAL] ${key} parent is unlimited`);
      }
    }

    const response = {
      usage: usageData.usage,
      limits: usageData.limits,
      remaining: usageData.remaining,
      plan: usageData.plan,
      planName: planConfig?.name || usageData.plan,
      billingMonth: usageData.billingMonth,
      billingYear: usageData.billingYear,
      resetAt: usageData.resetAt,
      // Module-level access with unlimited status
      canUse,
      isUnlimited,
      // Vocabulary and Latest Topics are always unlimited
      vocabularyUnlimited: true,
      latestTopicsUnlimited: true,
    };
    
    console.log('[TRAINING_USAGE_RESPONSE] Returning:', response);
    return NextResponse.json(response);
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
    const { module, subFeature, mode = 'validate-then-increment' } = body;

    if (!module || !MODULE_USAGE_FIELDS[module as ModuleType]) {
      // Check if it's an unlimited module (might not be in MODULE_USAGE_FIELDS)
      const accessType = getModuleAccessType(module as ModuleType);
      if (accessType === 'unlimited' || accessType === 'partial') {
        // Unlimited or partial module - allow without incrementing
        return NextResponse.json({
          success: true,
          usage: 0,
          limit: 999999,
          plan: "Free",
          canUse: true,
          remaining: 999999,
          isUnlimited: true,
        });
      }
      return NextResponse.json({ error: "Invalid module" }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { email: token.email as string },
      select: { id: true, plan: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use centralized validation with optional subFeature for partial modules
    const accessResult = await validateModuleAccess(user.id, module as ModuleType, subFeature);

    if (!accessResult.allowed) {
      return NextResponse.json(
        {
          error: accessResult.error || "Usage limit reached",
          usage: accessResult.currentUsage,
          limit: accessResult.limit,
          plan: accessResult.plan,
          canUse: false,
          resetAt: accessResult.resetAt,
          isUnlimited: accessResult.isUnlimited,
        },
        { status: 403 }
      );
    }

    // If unlimited, don't increment - just return success
    if (accessResult.isUnlimited) {
      return NextResponse.json({
        success: true,
        usage: 0,
        limit: 999999,
        plan: user.plan,
        canUse: true,
        remaining: 999999,
        isUnlimited: true,
      });
    }

    // Only increment if mode is 'validate-then-increment'
    // For session START, use mode='validate-only' to just check eligibility
    // For session COMPLETE, use mode='validate-then-increment' to increment usage
    if (mode !== 'validate-only') {
      // Increment usage using centralized utility with subFeature
      const result = await incrementModuleUsage(user.id, module as ModuleType, subFeature);

      if (!result.success) {
        return NextResponse.json(
          {
            error: result.error || "Failed to increment usage",
            usage: result.currentUsage,
            limit: result.limit,
            plan: user.plan,
            canUse: false,
            isUnlimited: false,
          },
          { status: 500 }
        );
      }

      // Dispatch event for UI refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('usage-updated'));
      }
      // Also set in localStorage for cross-tab sync
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('usage-updated', Date.now().toString());
      }

      return NextResponse.json({
        success: true,
        usage: result.currentUsage,
        limit: result.limit,
        plan: user.plan,
        canUse: result.remaining > 0,
        remaining: result.remaining,
        isUnlimited: result.isUnlimited,
      });
    }

    // validate-only mode: just return validation success without incrementing
    return NextResponse.json({
      success: true,
      usage: accessResult.currentUsage,
      limit: accessResult.limit,
      plan: user.plan,
      canUse: true,
      remaining: accessResult.remaining,
      isUnlimited: false,
      validatedOnly: true,
    });
  } catch (error) {
    console.error("Training usage increment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
