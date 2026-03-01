import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Razorpay from "razorpay";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { getPlanConfig } from "@/lib/billing";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY!,
  key_secret: process.env.RAZORPAY_API_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    // Validate Razorpay credentials at runtime
    if (!process.env.RAZORPAY_API_KEY || !process.env.RAZORPAY_API_SECRET) {
      return NextResponse.json({ error: "Razorpay credentials not configured" }, { status: 500 });
    }

    const authSession = await getServerSession(authOptions);

    if (!authSession?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    let couponCode = '';
    let targetPlan = 'Pro'; // Default to Pro for backward compatibility
    let billingCycle: 'monthly' | 'annual' = 'monthly';
    let requestOriginalAmount: number | null = null;
    let requestDiscountAmount: number | null = null;
    let requestFinalAmount: number | null = null;
    try {
      const body = await request.json();
      couponCode = body?.couponCode || '';
      targetPlan = body?.targetPlan || 'Pro';
      billingCycle = body?.billingCycle === 'annual' ? 'annual' : 'monthly';
      const parsedOriginal = typeof body?.originalAmount === 'number' ? body.originalAmount : Number(body?.originalAmount);
      const parsedDiscount = typeof body?.discountAmount === 'number' ? body.discountAmount : Number(body?.discountAmount);
      const parsedFinal = typeof body?.finalAmount === 'number' ? body.finalAmount : Number(body?.finalAmount);
      requestOriginalAmount = Number.isFinite(parsedOriginal) ? parsedOriginal : null;
      requestDiscountAmount = Number.isFinite(parsedDiscount) ? parsedDiscount : null;
      requestFinalAmount = Number.isFinite(parsedFinal) ? parsedFinal : null;
    } catch (e) {
      // No body or invalid JSON, continue with defaults
    }

    // Get user
    const user = await prisma.users.findUnique({
      where: { email: authSession.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get plan configuration using the billing utility
    const planPricing = await getPlanConfig(targetPlan);

    if (!planPricing) {
      return NextResponse.json({ error: `Pricing not found for plan: ${targetPlan}` }, { status: 400 });
    }

    // Handle coupon logic
    let appliedCoupon: any = null;
    // Use annual price if annual billing, otherwise use monthly price
    const fallbackOriginalAmount = billingCycle === 'annual' && targetPlan !== 'Free'
      ? (planPricing.annualPrice || Math.round(planPricing.price * 12 * 0.8))
      : planPricing.price;
    let originalAmount = requestOriginalAmount ?? fallbackOriginalAmount;
    let discountAmount = requestDiscountAmount ?? 0;
    let finalAmount = requestFinalAmount ?? originalAmount;

    if (couponCode) {
      const trimmedCode = couponCode.trim().toUpperCase();
      const coupon = await (prisma as any).coupon.findFirst({
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
        return NextResponse.json({ error: "This coupon is currently disabled" }, { status: 400 });
      }

      // Date validation
      const now = new Date();
      if (coupon.startDate && now < coupon.startDate) {
        return NextResponse.json({ error: "Coupon not active yet" }, { status: 400 });
      }
      if (coupon.expiryDate && now > coupon.expiryDate) {
        return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
      }

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
      console.log("Coupon order validation", {
        targetPlan,
        applicablePlans: normalizedApplicablePlans,
        isApplicable,
      });

      if (!isApplicable) {
        return NextResponse.json({ error: "Coupon not valid for this plan" }, { status: 400 });
      }

      // Max total usage validation
      const totalUsageCount = await (prisma as any).couponUsage.count({
        where: { couponId: coupon.id },
      });
      if (coupon.maxUsage && totalUsageCount >= coupon.maxUsage) {
        return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
      }

      // Per user limit validation
      const userUsageCount = await (prisma as any).couponUsage.count({
        where: { couponId: coupon.id, userId: user.id },
      });
      if (userUsageCount >= coupon.perUserLimit) {
        return NextResponse.json({ error: "You have already used this coupon" }, { status: 400 });
      }

      appliedCoupon = coupon;

      // Apply discount if pricing not provided by client
      if (requestFinalAmount === null) {
        if (coupon.discountType?.toUpperCase() === 'PERCENTAGE') {
          discountAmount = originalAmount * (coupon.discountValue / 100);
        } else {
          discountAmount = coupon.discountValue;
        }

        finalAmount = Math.max(0, originalAmount - discountAmount);
      } else if (requestDiscountAmount === null) {
        discountAmount = Math.max(0, originalAmount - finalAmount);
      }
    }

    // Check for 100% discount (free upgrade)
    const isFreeUpgrade = finalAmount === 0;

    // Calculate billing days from pricing
    const billingDays = planPricing.billingCycleDays || 30;

    if (isFreeUpgrade) {
      try {
        const usageLimit = planPricing.totalMonthlyLimit || (targetPlan === 'Standard' || targetPlan === 'Enterprise' ? 999999 : (targetPlan === 'Pro' ? 30 : 2));
        
        await prisma.users.update({
          where: { id: user.id },
          data: {
            plan: targetPlan as any,
            usageLimit: usageLimit,
            renewalDate: new Date(Date.now() + billingDays * 24 * 60 * 60 * 1000),
          },
        });

        await (prisma as any).couponUsage.create({
          data: {
            couponId: appliedCoupon.id,
            userId: user.id,
          },
        });

        await (prisma as any).paymentHistory.create({
          data: {
            userId: user.id,
            plan: targetPlan,
            billingCycle: billingCycle,
            originalAmount: originalAmount,
            discountAmount: originalAmount,
            finalAmount: 0,
            paymentMethod: 'coupon',
            status: 'free_via_coupon',
            couponUsed: appliedCoupon.code,
            couponType: appliedCoupon.discountType,
            date: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          message: `Successfully upgraded to ${targetPlan} with 100% discount coupon!`,
          plan: targetPlan
        });
      } catch (upgradeError) {
        console.error("Free upgrade error:", upgradeError);
        return NextResponse.json({ error: "Failed to process free upgrade" }, { status: 500 });
      }
    }

    // Create Razorpay order
    const receipt = `rcpt_${Date.now().toString(36)}_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
    const amountInPaise = Math.round(finalAmount * 100);
    console.log('Razorpay order amount', {
      targetPlan,
      couponCode,
      originalAmount,
      discountAmount,
      finalAmount,
      amountInPaise,
    });

    const options = {
      amount: amountInPaise, // Amount in paise
      currency: "INR",
      receipt,
      notes: {
        userId: user.id,
        email: user.email,
        targetPlan: targetPlan,
        couponCode: appliedCoupon?.code || '',
        originalAmount: String(originalAmount),
        discountAmount: String(discountAmount),
        finalAmount: String(finalAmount),
        billingCycle,
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_API_KEY,
      notes: order.notes,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}