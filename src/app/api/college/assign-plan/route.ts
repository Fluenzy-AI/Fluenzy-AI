import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCollegeAdminFromRequest } from "@/lib/collegeAuth";
import { Plan } from "@prisma/client";

export async function POST(req: NextRequest) {
  const admin = await getCollegeAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json();
  const { plan, totalSeats, planExpiresAt, moduleLimits, studentIds } = body as {
    plan: Plan;
    totalSeats?: number;
    planExpiresAt?: string;
    moduleLimits?: Record<string, number>;
    studentIds?: string[]; // if provided, assign custom plan to specific students only
  };

  if (!plan) return NextResponse.json({ error: "Plan is required." }, { status: 400 });

  if (studentIds && studentIds.length > 0) {
    // Assign custom plan to specific students
    await prisma.collegeStudent.updateMany({
      where: { id: { in: studentIds }, collegeAdminId: admin.id },
      data: {
        customPlan: plan,
        customPlanExpiresAt: planExpiresAt ? new Date(planExpiresAt) : undefined,
      },
    });
    return NextResponse.json({ success: true, message: `Custom plan assigned to ${studentIds.length} student(s).` });
  }

  // Assign plan to the whole college
  const updateData: Record<string, unknown> = { allocatedPlan: plan };
  if (totalSeats !== undefined) updateData.totalSeats = Number(totalSeats);
  if (planExpiresAt) updateData.planExpiresAt = new Date(planExpiresAt);
  if (moduleLimits) updateData.moduleLimits = moduleLimits;

  await prisma.collegeAdmin.update({
    where: { id: admin.id },
    data: updateData as any,
  });

  return NextResponse.json({ success: true, message: "Plan updated for college." });
}
