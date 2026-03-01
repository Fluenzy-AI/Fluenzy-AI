import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions);

    if (!authSession?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { couponCode, targetPlan, billingCycle = 'monthly' } = body;

    if (!couponCode || !targetPlan) {
      return NextResponse.json({ error: "Coupon code and target plan are required" }, { status: 400 });
    }

    // Get user
    const user = await prisma.users.findUnique({
      where: { email: authSession.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get plan pricing — fallback to hardcoded defaults if DB not seeded
    const PLAN_PRICING_DEFAULTS: Record<string, { price: number; currency: string }> = {
      Free:     { price: 0,   currency: 'INR' },
      Standard: { price: 150, currency: 'INR' },
      Pro:      { price: 20,  currency: 'INR' },
    };

    let planPricing = await (prisma as any).planPricing.findUnique({
      where: { plan: targetPlan },
    }).catch(() => null);

    if (!planPricing) {
      const def = PLAN_PRICING_DEFAULTS[targetPlan];
      if (!def) {
        return NextResponse.json({ error: `Pricing not found for plan: ${targetPlan}` }, { status: 400 });
      }
      planPricing = { plan: targetPlan, price: def.price, currency: def.currency };
    }

    // Calculate effective price based on billing cycle
    let effectivePrice = planPricing.price;
    if (billingCycle === 'annual' && targetPlan !== 'Free') {
      effectivePrice = Math.round(planPricing.price * 12 * 0.8);
    }

    // Validate coupon - trim and case-insensitive code matching
    const trimmedCode = couponCode.trim().toUpperCase();
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: {
          equals: trimmedCode,
          mode: 'insensitive'
        }
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
    }

    // Status validation - case insensitive
    if (coupon.status?.toLowerCase() !== 'active') {
      return NextResponse.json({ error: "This coupon is currently inactive" }, { status: 400 });
    }

    // Date validation
    const now = new Date();
    if (coupon.startDate && now < new Date(coupon.startDate)) {
      const startDateStr = new Date(coupon.startDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      return NextResponse.json({ error: `Coupon valid from ${startDateStr}` }, { status: 400 });
    }
    if (coupon.expiryDate && now > new Date(coupon.expiryDate)) {
      const expiryDateStr = new Date(coupon.expiryDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      return NextResponse.json({ error: `Coupon expired on ${expiryDateStr}` }, { status: 400 });
    }

    // Applicable plans validation (case-sensitive)
    const allowedPlans = ["Free", "Standard", "Pro", "Enterprise"];
    if (!allowedPlans.includes(targetPlan)) {
      return NextResponse.json({ error: "Invalid plan selection" }, { status: 400 });
    }
    if (targetPlan === "Free") {
      return NextResponse.json({ error: "This coupon is not applicable to the selected plan." }, { status: 400 });
    }

    const applicablePlans = Array.isArray(coupon.applicablePlans) ? coupon.applicablePlans : [];
    const normalizedApplicablePlans = applicablePlans
      .map((plan: string) => allowedPlans.find((allowed) => allowed.toLowerCase() === String(plan).toLowerCase()))
      .filter(Boolean) as string[];
    const isApplicable = normalizedApplicablePlans.length === 0 || normalizedApplicablePlans.includes(targetPlan);
    console.log("Coupon apply validation", {
      targetPlan,
      applicablePlans: normalizedApplicablePlans,
      isApplicable,
    });

    if (!isApplicable) {
      return NextResponse.json({ error: "Coupon not valid for this plan" }, { status: 400 });
    }

    // Max total usage validation
    const totalUsageCount = await prisma.couponUsage.count({
      where: { couponId: coupon.id },
    });
    if (coupon.maxUsage && totalUsageCount >= coupon.maxUsage) {
      return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
    }

    // Per user limit validation
    const userUsageCount = await prisma.couponUsage.count({
      where: { couponId: coupon.id, userId: user.id },
    });
    if (userUsageCount >= coupon.perUserLimit) {
      return NextResponse.json({ error: "You have already used this coupon" }, { status: 400 });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType?.toUpperCase() === 'PERCENTAGE') {
      discountAmount = effectivePrice * (coupon.discountValue / 100);
    } else {
      discountAmount = coupon.discountValue;
    }

    const finalAmount = Math.max(0, effectivePrice - discountAmount);

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discountAmount,
        originalPrice: effectivePrice,
        finalPrice: finalAmount,
      },
      pricing: {
        originalAmount: effectivePrice,
        discountAmount: discountAmount,
        finalAmount: finalAmount,
        billingCycle: billingCycle,
      },
      breakdown: {
        originalPrice: effectivePrice,
        discount: discountAmount,
        youSave: discountAmount,
        finalPayablePrice: finalAmount,
      },
    });
  } catch (error) {
    console.error("Coupon apply error:", error);
    return NextResponse.json(
      { error: "Failed to apply coupon" },
      { status: 500 }
    );
  }
}