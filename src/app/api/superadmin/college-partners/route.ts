import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendCollegeApprovalEmail } from "@/lib/collegeEmail";

// GET /api/superadmin/college-partners - List all college admins
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const collegeId = searchParams.get("collegeId");
  const include = searchParams.get("include");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  // Return students for a specific college
  if (collegeId && include === "students") {
    const students = await prisma.collegeStudent.findMany({
      where: { collegeAdminId: collegeId } as any,
      orderBy: { createdAt: "desc" } as any,
      select: {
        id: true,
        studentName: true,
        email: true,
        department: true,
        year: true,
        rollNumber: true,
        status: true,
        onboardedAt: true,
        createdAt: true,
      } as any,
    });
    return NextResponse.json({ students });
  }

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [total, colleges] = await Promise.all([
    prisma.collegeAdmin.count({ where } as any),
    prisma.collegeAdmin.findMany({
      where: where as any,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        collegeName: true,
        adminName: true,
        email: true,
        domain: true,
        designation: true,
        contactNumber: true,
        status: true,
        totalSeats: true,
        usedSeats: true,
        allocatedPlan: true,
        planExpiresAt: true,
        approvedAt: true,
        createdAt: true,
        _count: { select: { students: true } },
      },
    }),
  ]);

  return NextResponse.json({ colleges, total, page, limit });
}

// PATCH /api/superadmin/college-partners - Approve or reject a college admin
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json();
  const { collegeAdminId, action, reason, totalSeats, allocatedPlan, planExpiresAt } = body as {
    collegeAdminId: string;
    action: "approve" | "reject" | "suspend" | "reactivate";
    reason?: string;
    totalSeats?: number;
    allocatedPlan?: string;
    planExpiresAt?: string;
  };

  if (!collegeAdminId || !action) {
    return NextResponse.json({ error: "collegeAdminId and action are required." }, { status: 400 });
  }

  const admin = await prisma.collegeAdmin.findUnique({ where: { id: collegeAdminId } });
  if (!admin) return NextResponse.json({ error: "College admin not found." }, { status: 404 });

  const superAdminId = (session.user as any)?.id ?? "";

  const statusMap: Record<string, string> = {
    approve: "APPROVED",
    reject: "REJECTED",
    suspend: "SUSPENDED",
    reactivate: "APPROVED",
  };

  const updateData: Record<string, unknown> = {
    status: statusMap[action],
    approvedBy: superAdminId,
    approvedAt: new Date(),
  };

  if (action === "reject") updateData.rejectionReason = reason ?? "Application not approved.";
  if (action === "approve" || action === "reactivate") {
    if (totalSeats !== undefined) updateData.totalSeats = Number(totalSeats);
    if (allocatedPlan) updateData.allocatedPlan = allocatedPlan;
    if (planExpiresAt) updateData.planExpiresAt = new Date(planExpiresAt);
  }

  await prisma.collegeAdmin.update({ where: { id: collegeAdminId }, data: updateData as any });

  // Send email notification
  sendCollegeApprovalEmail(
    admin.email,
    admin.adminName,
    admin.collegeName,
    action === "approve" || action === "reactivate",
    reason
  ).catch(console.error);

  return NextResponse.json({ success: true, message: `College admin ${action}d successfully.` });
}
