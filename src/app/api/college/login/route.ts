import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signCollegeToken } from "@/lib/collegeAuth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email: string; password: string };

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const admin = await prisma.collegeAdmin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    if (admin.status === "PENDING") {
      return NextResponse.json(
        { error: "Your application is still under review. You will be notified once approved." },
        { status: 403 }
      );
    }

    if (admin.status === "REJECTED") {
      return NextResponse.json(
        { error: "Your partnership application has been rejected. Please contact support." },
        { status: 403 }
      );
    }

    if (admin.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Your account has been suspended. Please contact support." },
        { status: 403 }
      );
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = signCollegeToken({
      collegeAdminId: admin.id,
      email: admin.email,
      domain: admin.domain,
      collegeName: admin.collegeName,
    });

    const response = NextResponse.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        collegeName: admin.collegeName,
        adminName: admin.adminName,
        email: admin.email,
        domain: admin.domain,
        designation: admin.designation,
        totalSeats: admin.totalSeats,
        usedSeats: admin.usedSeats,
        allocatedPlan: admin.allocatedPlan,
        planExpiresAt: admin.planExpiresAt,
        logoUrl: admin.logoUrl,
      },
    });

    // Set HTTP-only cookie
    response.cookies.set("college_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[college/login]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
