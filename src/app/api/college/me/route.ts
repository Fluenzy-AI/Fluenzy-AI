import { NextRequest, NextResponse } from "next/server";
import { getCollegeAdminFromRequest } from "@/lib/collegeAuth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const admin = await getCollegeAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const fullAdmin = await prisma.collegeAdmin.findUnique({
    where: { id: admin.id },
    select: {
      id: true,
      collegeName: true,
      adminName: true,
      email: true,
      domain: true,
      designation: true,
      contactNumber: true,
      logoUrl: true,
      totalSeats: true,
      usedSeats: true,
      allocatedPlan: true,
      planExpiresAt: true,
      moduleLimits: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ admin: fullAdmin });
}

export async function PATCH(req: NextRequest) {
  const admin = await getCollegeAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json();
  const { collegeName, adminName, phone, website, address, city, state, country, pincode } = body;

  if (!collegeName?.trim()) {
    return NextResponse.json({ error: "College name is required." }, { status: 400 });
  }

  const updated = await prisma.collegeAdmin.update({
    where: { id: admin.id },
    data: {
      collegeName: collegeName.trim(),
      ...(adminName && { adminName: adminName.trim() }),
      ...(phone !== undefined && { contactNumber: phone }),
      // Store extra fields in a JSON field or extend schema — for now use available fields
    },
  });

  return NextResponse.json({ admin: updated, message: "Profile updated." });
}
