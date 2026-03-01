import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Plan } from "@prisma/client";
import { getCollegeAdminFromRequest } from "@/lib/collegeAuth";
import { sendStudentActivationEmail, sendStudentReceiptEmails, sendAdminBulkReceiptEmail } from "@/lib/collegeEmail";

function generateInvoiceId(prefix = "INV-FREE"): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getCollegeAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { seats, studentEmails, plan, couponCode, couponDiscount: couponDiscountInput }: {
      seats: number;
      studentEmails: string[];
      plan?: string;
      couponCode?: string;
      couponDiscount?: number;
    } = await req.json();
    const effectivePlan = plan || "Free";
    const effectiveCouponDiscount = couponDiscountInput ?? 0;

    if (!seats || seats < 1 || !studentEmails || studentEmails.length === 0) {
      return NextResponse.json({ error: "Seats and student emails are required." }, { status: 400 });
    }

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
        { error: `Student count (${uniqueEmails.length}) exceeds seats (${seats}).` },
        { status: 400 }
      );
    }

    const invoiceId = generateInvoiceId();
    const validFrom = new Date();
    const validTill = new Date(validFrom);
    validTill.setMonth(validTill.getMonth() + 1);

    // Create a free transaction record
    const PLAN_PRICE: Record<string, number> = { Free: 0, Standard: 150, Pro: 20, Enterprise: 0 };
    const pricePerSeat = PLAN_PRICE[effectivePlan] ?? 0;
    const subtotal = pricePerSeat * seats;
    await prisma.collegeTransaction.create({
      data: {
        collegeAdminId: admin.id,
        razorpayOrderId: `free-${Date.now()}`,
        plan: effectivePlan as Plan,
        seats,
        pricePerSeat,
        subtotal,
        couponDiscount: effectiveCouponDiscount,
        gstAmount: 0,
        finalAmount: 0,
        status: "paid",
        couponCode: couponCode ?? null,
        invoiceId,
        studentEmails: uniqueEmails,
        validFrom,
        validTill,
      },
    });

    const planEnum = effectivePlan as Plan;

    // Activate students
    let newStudentsCount = 0;
    for (const email of uniqueEmails) {
      const existing = await prisma.collegeStudent.findUnique({ where: { email } });
      if (!existing) {
        await prisma.collegeStudent.create({
          data: {
            collegeAdminId: admin.id,
            studentName: email.split("@")[0],
            email,
            status: "ACTIVE",
            inviteSentAt: new Date(),
            customPlan: planEnum,
            customPlanExpiresAt: validTill,
          },
        });
        newStudentsCount++;
      } else {
        await prisma.collegeStudent.update({
          where: { id: existing.id },
          data: {
            status: "ACTIVE",
            customPlan: planEnum,
            customPlanExpiresAt: validTill,
          },
        });
      }

      // Upgrade the linked users record (what the dashboard reads)
      await prisma.users.updateMany({
        where: { email },
        data: { plan: planEnum, renewalDate: validTill },
      });
    }

    // Update college admin plan + seats
    const newUsedSeats = (college.usedSeats ?? 0) + newStudentsCount;
    const newTotalSeats = Math.max(college.totalSeats ?? 0, seats);
    await prisma.collegeAdmin.update({
      where: { id: admin.id },
      data: {
        allocatedPlan: planEnum,
        totalSeats: newTotalSeats,
        usedSeats: newUsedSeats,
        planExpiresAt: validTill,
      },
    });

    // Increment coupon usedCount if a coupon was applied
    if (couponCode) {
      await prisma.collegeCoupon.update({
        where: { code: couponCode.toUpperCase().trim() },
        data: { usedCount: { increment: 1 } },
      }).catch((err) => console.error("[free-activate] coupon update error:", err));
    }

    // Create PaymentHistory records for each student who has a users account
    const activatedStudentsInfo: Array<{ email: string; name?: string }> = [];
    for (const email of uniqueEmails) {
      const linkedUser = await (prisma as any).users.findUnique({
        where: { email },
        select: { id: true, name: true },
      });
      if (linkedUser) {
        await (prisma as any).paymentHistory.create({
          data: {
            userId: linkedUser.id,
            plan: effectivePlan,
            billingCycle: "monthly",
            paymentCurrency: "INR",
            originalAmount: pricePerSeat,
            discountAmount: 0,
            finalAmount: 0,
            paymentMethod: "College Purchase",
            orderId: invoiceId,
            paymentId: `college_${admin.id}`,
            invoiceId,
            status: "paid",
            couponUsed: college.collegeName,
            couponType: "college",
            date: validFrom,
          },
        });
      }
      activatedStudentsInfo.push({ email, name: linkedUser?.name ?? undefined });
    }

    // Send activation + receipt emails (fire-and-forget)
    Promise.allSettled([
      sendStudentActivationEmail({
        studentEmails: uniqueEmails,
        collegeName: college.collegeName,
        plan: effectivePlan,
        seats,
        validTill,
        invoiceId,
      }),
      sendStudentReceiptEmails({
        students: activatedStudentsInfo,
        collegeName: college.collegeName,
        plan: effectivePlan,
        pricePerSeat,
        validFrom,
        validTill,
        invoiceId,
        seats,
      }),
      sendAdminBulkReceiptEmail({
        adminEmail: college.email,
        collegeName: college.collegeName,
        plan: effectivePlan,
        seats,
        pricePerSeat,
        couponCode: couponCode ?? null,
        couponDiscount: effectiveCouponDiscount,
        totalAmount: 0,
        validFrom,
        validTill,
        invoiceId,
        students: activatedStudentsInfo,
      }),
    ]).catch((err) => console.error("[free-activate] email error:", err));

    return NextResponse.json({
      success: true,
      invoiceId,
      validTill: validTill.toISOString(),
      studentsActivated: uniqueEmails.length,
    });
  } catch (err) {
    console.error("[free-activate]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
