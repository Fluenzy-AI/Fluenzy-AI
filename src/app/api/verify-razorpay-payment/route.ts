import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import Razorpay from "razorpay";
import { getPlanConfig, handleSubscriptionRenewal } from "@/lib/billing";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY!,
  key_secret: process.env.RAZORPAY_API_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions);

    if (!authSession?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      order_id,
      plan,
      couponCode,
      originalAmount: requestOriginalAmount,
      discountAmount: requestDiscountAmount,
      finalAmount: requestFinalAmount,
      billingCycle: requestBillingCycle,
    } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment verification data" }, { status: 400 });
    }

    // Verify payment signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET!)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      console.error("Payment signature verification failed");
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    // Get user
    const user = await prisma.users.findUnique({
      where: { email: authSession.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if payment already processed (idempotency)
    const existingPayment = await (prisma as any).paymentHistory.findFirst({
      where: { paymentId: razorpay_payment_id },
    });

    if (existingPayment) {
      return NextResponse.json({ success: true, message: "Payment already processed" });
    }

    const parsedOriginal = typeof requestOriginalAmount === 'number' ? requestOriginalAmount : Number(requestOriginalAmount);
    const parsedDiscount = typeof requestDiscountAmount === 'number' ? requestDiscountAmount : Number(requestDiscountAmount);
    const parsedFinal = typeof requestFinalAmount === 'number' ? requestFinalAmount : Number(requestFinalAmount);
    const hasRequestOriginal = Number.isFinite(parsedOriginal);
    const hasRequestDiscount = Number.isFinite(parsedDiscount);
    const hasRequestFinal = Number.isFinite(parsedFinal);

    // Get plan configuration for amount and limits
    const planPricing = await getPlanConfig(plan);

    if (!planPricing) {
      return NextResponse.json({ error: `Pricing not found for plan: ${plan}` }, { status: 400 });
    }

    // Calculate discount and final amount using pricing from database
    let discountAmount = hasRequestDiscount ? parsedDiscount : 0;
    let couponType = null;
    let couponDiscountValue: number | null = null;
    let originalAmount = hasRequestOriginal ? parsedOriginal : planPricing.price;
    let finalAmount = hasRequestFinal ? parsedFinal : originalAmount;

    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: {
            equals: couponCode,
            mode: 'insensitive'
          }
        },
      });

        if (coupon) {
          couponType = coupon.discountType;
          couponDiscountValue = coupon.discountValue;
          if (!hasRequestFinal) {
            if (coupon.discountType?.toUpperCase() === 'PERCENTAGE') {
              discountAmount = originalAmount * (coupon.discountValue / 100);
            } else {
              discountAmount = coupon.discountValue;
            }

            finalAmount = Math.max(0, originalAmount - discountAmount);
          } else if (!hasRequestDiscount) {
            discountAmount = Math.max(0, originalAmount - finalAmount);
          }

        // Use transaction to create coupon usage and increment usedCount
        await prisma.$transaction(async (tx) => {
          // Create coupon usage record with pricing data
          await tx.couponUsage.create({
            data: {
              couponId: coupon.id,
              userId: user.id,
              appliedPlan: plan,
              originalPrice: originalAmount,
              discountAmount: discountAmount,
              finalPrice: finalAmount,
              couponCode: coupon.code,
              appliedAt: new Date(),
            },
          });

          // Increment usedCount
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        });

        console.log('Database: Coupon usage recorded and count incremented', {
          couponId: coupon.id,
          userId: user.id,
          appliedPlan: plan
        });
      }
    }

    // Update user plan with proper limits from pricing
    // Use the database pricing instead of hardcoded values
    const usageLimit = planPricing.totalMonthlyLimit || (plan === 'Standard' || plan === 'Enterprise' ? 999999 : (plan === 'Pro' ? 30 : 2));
    const billingDays = planPricing.billingCycleDays || 30;
    const newRenewalDate = new Date(Date.now() + billingDays * 24 * 60 * 60 * 1000);

    const updatedUser = await prisma.users.update({
      where: { id: user.id },
      data: {
        plan: plan as any,
        usageLimit: usageLimit,
        renewalDate: newRenewalDate,
        // Reset training module usage counters for new billing cycle
        // Note: Usage is now tracked in MonthlyUsage table
      },
    });

    console.log('Database: User plan updated successfully', {
      userId: user.id,
      newPlan: updatedUser.plan,
      usageLimit: updatedUser.usageLimit
    });

    let paymentMethod: string | undefined;
    let paymentCurrency: string | undefined;
    try {
      const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
      paymentMethod = paymentDetails?.method;
      paymentCurrency = paymentDetails?.currency;
    } catch (fetchError) {
      console.warn("Failed to fetch Razorpay payment details", fetchError);
    }

    const receiptNumber = `FLZ-INV-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const receiptUrl = `/api/receipt-pdf?orderId=${encodeURIComponent(razorpay_order_id)}`;

    // Create payment history record
    const paymentHistory = await (prisma as any).paymentHistory.create({
      data: {
        userId: user.id,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        originalAmount: originalAmount,
        discountAmount: discountAmount,
        finalAmount: finalAmount,
        paymentMethod: paymentMethod || 'razorpay',
        paymentCurrency: paymentCurrency || 'INR',
        status: 'paid',
        plan: plan,
        billingCycle: requestBillingCycle || 'monthly',
        couponUsed: couponCode || null,
        couponType: couponType,
        invoiceId: receiptNumber,
        date: new Date(),
      },
    });

    // Update receipt validTill with actual renewal date
    const receiptValidTill = newRenewalDate;
    const receiptValidFrom = new Date();

    await (prisma as any).receipt.create({
      data: {
        paymentHistoryId: paymentHistory.id,
        userId: user.id,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        invoiceNumber: receiptNumber,
        currency: paymentCurrency || 'INR',
        billingCycle: requestBillingCycle || 'monthly',
        plan: plan,
        originalAmount: originalAmount,
        discountAmount: discountAmount,
        finalAmount: finalAmount,
        couponCode: couponCode || null,
        couponType: couponType || null,
        discountValue: couponDiscountValue,
        validFrom: receiptValidFrom,
        validTill: receiptValidTill,
        receiptUrl: receiptUrl,
        snapshot: {
          receiptNumber,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          invoiceDate: new Date(),
          paymentStatus: 'Paid',
          paymentMethod: paymentMethod || 'razorpay',
          currency: paymentCurrency || 'INR',
          billedTo: {
            name: user.name,
            email: user.email,
            userId: user.id,
          },
          planDetails: {
            plan,
            billingCycle: requestBillingCycle || 'monthly',
            sessionsIncluded: plan === 'Standard' ? 'Unlimited' : (plan === 'Pro' ? '100' : 'N/A'),
            validFrom: new Date(),
            validTill: user.renewalDate || null,
          },
          priceBreakdown: {
            originalAmount,
            discountAmount,
            finalAmount,
            taxes: 0,
          },
          coupon: couponCode ? {
            code: couponCode,
            type: couponType,
            value: couponDiscountValue,
          } : null,
        },
      },
    });

    console.log('Database: Payment history created', {
      paymentHistoryId: paymentHistory.id,
      paymentId: razorpay_payment_id,
      userId: user.id,
      plan: plan,
      finalAmount: finalAmount,
      couponUsed: couponCode
    });

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${plan}`,
      plan: plan,
      receiptUrl
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}