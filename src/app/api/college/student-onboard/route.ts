import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/college/student-onboard  - Activate student account from invite token
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = body as { token: string; newPassword: string };

    if (!token?.trim() || !newPassword?.trim()) {
      return NextResponse.json({ error: "Token and new password are required." }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const student = await prisma.collegeStudent.findUnique({ where: { inviteToken: token } });
    if (!student) {
      return NextResponse.json({ error: "Invalid or expired invite link." }, { status: 404 });
    }

    // Check if token is still valid (7 days)
    if (student.inviteSentAt) {
      const expiry = new Date(student.inviteSentAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (new Date() > expiry) {
        return NextResponse.json({ error: "This invite link has expired. Please contact your college admin." }, { status: 410 });
      }
    }

    if (student.onboardedAt) {
      return NextResponse.json({ error: "Account already activated. Please log in." }, { status: 409 });
    }

    const collegeAdmin = await prisma.collegeAdmin.findUnique({
      where: { id: student.collegeAdminId },
    });

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Create or find user account in the main users table
    let user = await prisma.users.findUnique({ where: { email: student.email } });
    if (!user) {
      user = await prisma.users.create({
        data: {
          name: student.studentName,
          email: student.email,
          password: hashedPassword,
          plan: (student.customPlan ?? collegeAdmin?.allocatedPlan ?? "Free") as any,
          usageCount: 0,
          usageLimit: 30, // College students get higher default
          role: "User",
        },
      });
    } else {
      // Update password on re-activation
      await prisma.users.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
    }

    // Link students to the user
    await prisma.collegeStudent.update({
      where: { id: student.id },
      data: {
        userId: user.id,
        onboardedAt: new Date(),
        inviteToken: null, // invalidate
        tempPassword: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Account activated successfully! You can now log in.",
      email: student.email,
    });
  } catch (error) {
    console.error("[college/student-onboard]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// GET /api/college/student-onboard?token=xxx  - Validate invite token
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) return NextResponse.json({ error: "Token is required." }, { status: 400 });

  const student = await prisma.collegeStudent.findUnique({
    where: { inviteToken: token },
    select: {
      studentName: true,
      email: true,
      department: true,
      inviteSentAt: true,
      onboardedAt: true,
      collegeAdmin: { select: { collegeName: true, domain: true } },
    },
  });

  if (!student) return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });
  if (student.onboardedAt) return NextResponse.json({ error: "Account already activated." }, { status: 409 });

  return NextResponse.json({ valid: true, student });
}
