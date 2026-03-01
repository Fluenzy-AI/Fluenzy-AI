import { NextRequest, NextResponse } from "next/server";
import { getCollegeAdminFromRequest } from "@/lib/collegeAuth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const adminToken = await getCollegeAdminFromRequest(req);
  if (!adminToken) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "currentPassword and newPassword are required." }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  const admin = await prisma.collegeAdmin.findUnique({
    where: { id: adminToken.id },
    select: { password: true },
  });

  if (!admin) return NextResponse.json({ error: "Admin not found." }, { status: 404 });

  const isValid = await bcrypt.compare(currentPassword, admin.password);
  if (!isValid) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.collegeAdmin.update({
    where: { id: adminToken.id },
    data: { password: newHash },
  });

  return NextResponse.json({ message: "Password updated successfully." });
}
