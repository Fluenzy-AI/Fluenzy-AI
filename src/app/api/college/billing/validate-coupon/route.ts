import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCollegeAdminFromRequest } from "@/lib/collegeAuth";

export async function POST(req: NextRequest) {
  try {
    const admin = await getCollegeAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code, plan, seats } = await req.json();
    if (!code || !plan || !seats) {
      return NextResponse.json({ error: "Coupon code, plan, and seats are required." }, { status: 400 });
    }

    const coupon = await prisma.collegeCoupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!coupon) return NextResponse.json({ error: "Invalid coupon code." }, { status: 404 });
    if (coupon.status !== "active") return NextResponse.json({ error: "This coupon is inactive." }, { status: 400 });
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return NextResponse.json({ error: "This coupon has expired." }, { status: 400 });
    }
    if (coupon.maxUsage !== null && coupon.usedCount >= coupon.maxUsage) {
      return NextResponse.json({ error: "Coupon usage limit has been reached." }, { status: 400 });
    }
    if (coupon.minSeats && seats < coupon.minSeats) {
      return NextResponse.json(
        { error: `This coupon requires a minimum of ${coupon.minSeats} seats.` },
        { status: 400 }
      );
    }
    if (coupon.applicablePlans.length > 0 && !coupon.applicablePlans.includes(plan)) {
      return NextResponse.json({ error: `This coupon is not applicable to the ${plan} plan.` }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
    });
  } catch (err) {
    console.error("Validate coupon error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
