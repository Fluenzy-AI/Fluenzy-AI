import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getCollegeAdminFromRequest } from "@/lib/collegeAuth";

function generateInvoiceId(prefix = "INV-COL"): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getCollegeAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transactionId,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !transactionId) {
      return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
    }

    // 1. Verify Razorpay signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET!)
      .update(sign)
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    // 2. Load transaction and verify ownership
    const transaction = await prisma.collegeTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }
    if (transaction.collegeAdminId !== admin.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    if (transaction.status === "paid") {
      return NextResponse.json({ message: "Payment already processed.", success: true });
    }
    if (transaction.razorpayOrderId !== razorpay_order_id) {
      return NextResponse.json({ error: "Order ID mismatch." }, { status: 400 });
    }

    const invoiceId = generateInvoiceId();
    const validFrom = new Date();
    const validTill = new Date(validFrom);
    validTill.setMonth(validTill.getMonth() + 1); // 1 month validity

    // 3. Mark transaction as paid
    await prisma.collegeTransaction.update({
      where: { id: transactionId },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "paid",
        invoiceId,
        validFrom,
        validTill,
      },
    });

    // 4. Activate students: ensure they exist as CollegeStudent records
    const college = await prisma.collegeAdmin.findUnique({ where: { id: admin.id } });
    if (!college) return NextResponse.json({ error: "College not found." }, { status: 404 });

    let newStudentsCount = 0;
    for (const email of transaction.studentEmails) {
      const existing = await prisma.collegeStudent.findUnique({ where: { email } });
      if (!existing) {
        // Create placeholder student record
        await prisma.collegeStudent.create({
          data: {
            collegeAdminId: admin.id,
            studentName: email.split("@")[0], // placeholder name
            email,
            status: "ACTIVE",
            inviteSentAt: new Date(),
          },
        });
        newStudentsCount++;
      } else if (existing.status !== "ACTIVE") {
        await prisma.collegeStudent.update({
          where: { id: existing.id },
          data: { status: "ACTIVE" },
        });
      }
    }

    // 5. Update college admin plan
    const newUsedSeats = (college.usedSeats ?? 0) + newStudentsCount;
    const newTotalSeats = Math.max(college.totalSeats ?? 0, transaction.seats);

    await prisma.collegeAdmin.update({
      where: { id: admin.id },
      data: {
        allocatedPlan: transaction.plan,
        totalSeats: newTotalSeats,
        usedSeats: newUsedSeats,
        planExpiresAt: validTill,
      },
    });

    // 6. Update coupon usage count
    if (transaction.couponCode) {
      await prisma.collegeCoupon.update({
        where: { code: transaction.couponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    // 7. Record in CollegePaymentHistory (existing model)
    await prisma.collegePaymentHistory.create({
      data: {
        collegeAdminId: admin.id,
        plan: transaction.plan,
        seats: transaction.seats,
        amount: transaction.finalAmount,
        currency: "INR",
        status: "paid",
        invoiceId,
        paymentMethod: "razorpay",
        validFrom,
        validTill,
        notes: `Razorpay payment ${razorpay_payment_id}`,
      },
    });

    return NextResponse.json({
      success: true,
      invoiceId,
      validFrom: validFrom.toISOString(),
      validTill: validTill.toISOString(),
      studentsActivated: transaction.studentEmails.length,
      plan: transaction.plan,
      seats: transaction.seats,
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    return NextResponse.json({ error: "Payment verification failed." }, { status: 500 });
  }
}
