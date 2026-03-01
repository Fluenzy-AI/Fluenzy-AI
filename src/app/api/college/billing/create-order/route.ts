import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getCollegeAdminFromRequest } from "@/lib/collegeAuth";

// Seat pricing per plan per month (INR)
export const PLAN_PRICE: Record<string, number> = {
  Free:       0,
  Standard:   150,
  Pro:        20,
  Enterprise: 0, // custom / contact sales
};

const GST_RATE = 0.18; // 18%

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY!,
  key_secret: process.env.RAZORPAY_API_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const admin = await getCollegeAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      plan,
      seats,
      studentEmails = [],
      couponCode,
      applyGst = false,
      billingAddress,
      gstNumber,
    }: {
      plan: string;
      seats: number;
      studentEmails: string[];
      couponCode?: string;
      applyGst?: boolean;
      billingAddress?: string;
      gstNumber?: string;
    } = body;

    // Validate plan and seats
    if (!plan || !seats || seats < 1) {
      return NextResponse.json({ error: "Plan and seats are required." }, { status: 400 });
    }
    if (!(plan in PLAN_PRICE)) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }
    if (plan === "Free") {
      return NextResponse.json({ error: "Free plan does not require payment." }, { status: 400 });
    }
    if (plan === "Enterprise") {
      return NextResponse.json({ error: "Enterprise plan requires custom pricing. Contact sales." }, { status: 400 });
    }

    // Always calculate amount on backend — never trust frontend
    const pricePerSeat = PLAN_PRICE[plan];
    const subtotal = pricePerSeat * seats;

    // Validate student emails
    const college = await prisma.collegeAdmin.findUnique({ where: { id: admin.id } });
    if (!college) return NextResponse.json({ error: "College not found." }, { status: 404 });

    const uniqueEmails = [...new Set(studentEmails.map((e: string) => e.toLowerCase().trim()))];
    const domainErrors = uniqueEmails.filter((e) => !e.endsWith(`@${college.domain}`));
    if (domainErrors.length > 0) {
      return NextResponse.json(
        { error: `${domainErrors.length} email(s) do not match your college domain (@${college.domain}).` },
        { status: 400 }
      );
    }
    if (uniqueEmails.length > seats) {
      return NextResponse.json(
        { error: `Student count (${uniqueEmails.length}) exceeds purchased seats (${seats}).` },
        { status: 400 }
      );
    }

    // Validate coupon (backend only)
    let couponDiscount = 0;
    let appliedCouponCode: string | undefined;

    if (couponCode) {
      const coupon = await prisma.collegeCoupon.findUnique({
        where: { code: couponCode.toUpperCase().trim() },
      });
      if (
        coupon &&
        coupon.status === "active" &&
        (!coupon.expiryDate || new Date(coupon.expiryDate) > new Date()) &&
        (coupon.maxUsage === null || coupon.usedCount < coupon.maxUsage) &&
        (!coupon.minSeats || seats >= coupon.minSeats) &&
        (coupon.applicablePlans.length === 0 || coupon.applicablePlans.includes(plan))
      ) {
        couponDiscount =
          coupon.discountType === "PERCENTAGE"
            ? Math.round((subtotal * coupon.discountValue) / 100)
            : Math.min(coupon.discountValue, subtotal);
        appliedCouponCode = coupon.code;
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
    const gstAmount = applyGst ? Math.round(discountedSubtotal * GST_RATE) : 0;
    const finalAmount = discountedSubtotal + gstAmount;

    // Create Razorpay order (amount in paise)
    const receiptId = `col_${admin.id.slice(-6)}_${Date.now()}`;
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100), // paise
      currency: "INR",
      receipt: receiptId,
      notes: {
        collegeAdminId: admin.id,
        plan,
        seats: String(seats),
        collegeName: college.collegeName,
      },
    });

    // Save pending transaction
    const transaction = await prisma.collegeTransaction.create({
      data: {
        collegeAdminId: admin.id,
        razorpayOrderId: razorpayOrder.id,
        plan: plan as "Free" | "Standard" | "Pro" | "Enterprise",
        seats,
        pricePerSeat,
        subtotal,
        couponCode: appliedCouponCode,
        couponDiscount,
        gstAmount,
        finalAmount,
        studentEmails: uniqueEmails,
        status: "pending",
      },
    });

    return NextResponse.json({
      orderId: razorpayOrder.id,
      transactionId: transaction.id,
      amount: finalAmount,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      prefill: {
        name: college.adminName,
        email: college.email,
        contact: college.contactNumber,
      },
      breakdown: {
        plan,
        pricePerSeat,
        seats,
        subtotal,
        couponCode: appliedCouponCode,
        couponDiscount,
        gstAmount,
        finalAmount,
        applyGst,
      },
    });
  } catch (err) {
    console.error("Create order error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
