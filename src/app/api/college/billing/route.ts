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
      take: 50,
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
        studentEmails: true,
        validFrom: true,
        validTill: true,
        createdAt: true,
      },
    });

    // For each transaction, enrich with student details from CollegeStudent
    const enrichedTransactions = await Promise.all(
      transactions.map(async (tx) => {
        if (!tx.studentEmails || tx.studentEmails.length === 0) return { ...tx, students: [] };
        const students = await prisma.collegeStudent.findMany({
          where: { email: { in: tx.studentEmails } },
          select: {
            id: true,
            studentName: true,
            email: true,
            department: true,
            year: true,
            rollNumber: true,
            customPlan: true,
            customPlanExpiresAt: true,
            status: true,
            onboardedAt: true,
          },
        });
        return { ...tx, students };
      })
    );

    const remainingSeats = Math.max(0, college.totalSeats - college.usedSeats);
    const isExpired = college.planExpiresAt ? new Date(college.planExpiresAt) < new Date() : true;

    return NextResponse.json({
      college: { ...college, remainingSeats, isExpired },
      transactions: enrichedTransactions,
    });
  } catch (err) {
    console.error("Billing GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

