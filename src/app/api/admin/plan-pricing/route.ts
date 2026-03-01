import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DEFAULT_PLAN_LIMITS } from "@/lib/billing";

export async function GET() {
  try {
    const pricings = await (prisma as any).planPricing.findMany();

    // Return as object with plan as key
    const pricingObj: Record<string, any> = {};
    pricings.forEach((pricing: any) => {
      pricingObj[pricing.plan] = {
        name: pricing.name,
        price: pricing.price,
        annualPrice: pricing.annualPrice,
        currency: pricing.currency,
        status: pricing.status,
        moduleLimits: pricing.moduleLimits,
        razorpayPlanId: pricing.razorpayPlanId,
        razorpayPriceId: pricing.razorpayPriceId,
        isUnlimited: pricing.isUnlimited,
        totalMonthlyLimit: pricing.totalMonthlyLimit,
        billingCycleDays: pricing.billingCycleDays,
        updatedAt: pricing.updatedAt,
      };
    });

    // Ensure all plans have defaults (CORRECTED LIMITS)
    const defaults: Record<string, any> = {
      Free: { 
        name: 'Free', 
        price: 0, 
        annualPrice: 0,
        currency: 'INR', 
        status: 'active',
        moduleLimits: DEFAULT_PLAN_LIMITS.Free,
        razorpayPlanId: null,
        razorpayPriceId: null,
        isUnlimited: false,
        totalMonthlyLimit: 2,
        billingCycleDays: 30,
      },
      Standard: { 
        name: 'Standard', 
        price: 150, 
        annualPrice: 1500,
        currency: 'INR', 
        status: 'active',
        moduleLimits: DEFAULT_PLAN_LIMITS.Standard,
        razorpayPlanId: null,
        razorpayPriceId: null,
        isUnlimited: false,
        totalMonthlyLimit: 300,
        billingCycleDays: 30,
      },
      Pro: { 
        name: 'Pro', 
        price: 20, 
        annualPrice: 200,
        currency: 'INR', 
        status: 'active',
        moduleLimits: DEFAULT_PLAN_LIMITS.Pro,
        razorpayPlanId: null,
        razorpayPriceId: null,
        isUnlimited: false,
        totalMonthlyLimit: 30,
        billingCycleDays: 30,
      },
      Enterprise: { 
        name: 'Enterprise', 
        price: 0, 
        annualPrice: 0,
        currency: 'INR', 
        status: 'active',
        moduleLimits: DEFAULT_PLAN_LIMITS.Enterprise,
        razorpayPlanId: null,
        razorpayPriceId: null,
        isUnlimited: true,
        totalMonthlyLimit: 999999,
        billingCycleDays: 30,
      },
    };

    Object.keys(defaults).forEach(plan => {
      if (!pricingObj[plan]) {
        pricingObj[plan] = { ...defaults[plan], updatedAt: new Date() };
      }
    });

    return NextResponse.json(pricingObj);
  } catch (error) {
    console.error("Error fetching plan pricing:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role as any) !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { plans } = body;

    if (!plans || typeof plans !== 'object') {
      return NextResponse.json({ error: "Invalid plans data" }, { status: 400 });
    }

    const planNames = ['Free', 'Standard', 'Pro', 'Enterprise'];
    const userId = session.user.id;

    for (const planName of planNames) {
      const planData = plans[planName];
      if (planData) {
        await (prisma as any).planPricing.upsert({
          where: { plan: planName },
          update: {
            name: planData.name,
            price: planData.price,
            annualPrice: planData.annualPrice,
            currency: planData.currency,
            status: planData.status,
            moduleLimits: planData.moduleLimits,
            razorpayPlanId: planData.razorpayPlanId,
            razorpayPriceId: planData.razorpayPriceId,
            isUnlimited: planData.isUnlimited,
            totalMonthlyLimit: planData.totalMonthlyLimit,
            billingCycleDays: planData.billingCycleDays,
            updatedBy: userId,
          },
          create: {
            plan: planName,
            name: planData.name,
            price: planData.price,
            annualPrice: planData.annualPrice,
            currency: planData.currency,
            status: planData.status,
            moduleLimits: planData.moduleLimits || DEFAULT_PLAN_LIMITS[planName],
            razorpayPlanId: planData.razorpayPlanId,
            razorpayPriceId: planData.razorpayPriceId,
            isUnlimited: planData.isUnlimited,
            totalMonthlyLimit: planData.totalMonthlyLimit,
            billingCycleDays: planData.billingCycleDays || 30,
            updatedBy: userId,
          },
        });
      }
    }

    return NextResponse.json({ message: "Plan pricing updated successfully" });
  } catch (error) {
    console.error("Error updating plan pricing:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}