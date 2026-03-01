import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCollegeAdminFromRequest } from "@/lib/collegeAuth";

export async function GET(req: NextRequest) {
  try {
    const admin = await getCollegeAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const college = await prisma.collegeAdmin.findUnique({
      where: { id: admin.id },
      select: {
        id: true,
        collegeName: true,
        email: true,
        allocatedPlan: true,
        totalSeats: true,
        usedSeats: true,
        planExpiresAt: true,
        billedCentrally: true,
      },
    });
    if (!college) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const transactions = await prisma.collegeTransaction.findMany({
      where: { collegeAdminId: admin.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        razorpayOrderId: true,
        razorpayPaymentId: true,
        plan: true,
        seats: true,
        pricePerSeat: true,
        subtotal: true,
        couponCode: true,
        couponDiscount: true,
        gstAmount: true,
        finalAmount: true,
        status: true,
        invoiceId: true,
        invoiceUrl: true,
        validFrom: true,
        validTill: true,
        createdAt: true,
      },
    });

    const remainingSeats = Math.max(0, college.totalSeats - college.usedSeats);
    const isExpired = college.planExpiresAt ? new Date(college.planExpiresAt) < new Date() : true;

    return NextResponse.json({
      college: { ...college, remainingSeats, isExpired },
      transactions,
    });
  } catch (err) {
    console.error("Billing GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
