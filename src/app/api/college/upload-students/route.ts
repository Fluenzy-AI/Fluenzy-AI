import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getCollegeAdminFromRequest } from "@/lib/collegeAuth";
import { sendStudentInviteEmail } from "@/lib/collegeEmail";

interface CSVRow {
  studentName: string;
  email: string;
  department?: string;
  year?: string;
  rollNumber?: string;
}

export async function POST(req: NextRequest) {
  const admin = await getCollegeAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json();
  const { students, batchId } = body as { students: CSVRow[]; batchId?: string };

  if (!students || !Array.isArray(students) || students.length === 0) {
    return NextResponse.json({ error: "No student data provided." }, { status: 400 });
  }

  const collegeAdmin = await prisma.collegeAdmin.findUnique({ where: { id: admin.id } });
  if (!collegeAdmin) return NextResponse.json({ error: "Admin not found." }, { status: 404 });

  const availableSeats =
    collegeAdmin.totalSeats > 0
      ? collegeAdmin.totalSeats - collegeAdmin.usedSeats
      : Infinity;

  const results: {
    email: string;
    status: "success" | "error" | "duplicate";
    message: string;
  }[] = [];

  let successCount = 0;

  for (const row of students) {
    if (!row.email?.trim() || !row.studentName?.trim()) {
      results.push({ email: row.email ?? "", status: "error", message: "Missing name or email." });
      continue;
    }

    const emailLower = row.email.trim().toLowerCase();
    const emailDomain = emailLower.split("@")[1];

    if (emailDomain !== admin.domain) {
      results.push({ email: emailLower, status: "error", message: `Email must be @${admin.domain}` });
      continue;
    }

    const existingStudent = await prisma.collegeStudent.findUnique({ where: { email: emailLower } });
    if (existingStudent) {
      results.push({ email: emailLower, status: "duplicate", message: "Already enrolled." });
      continue;
    }

    if (successCount >= availableSeats) {
      results.push({ email: emailLower, status: "error", message: "No available seats." });
      continue;
    }

    // Generate invite credentials
    const tempPassword = `Fluenzy@${crypto.randomBytes(3).toString("hex")}`;
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const hashedTemp = await bcrypt.hash(tempPassword, 10);

    try {
      await prisma.collegeStudent.create({
        data: {
          collegeAdminId: admin.id,
          studentName: row.studentName.trim(),
          email: emailLower,
          department: row.department?.trim(),
          year: row.year ? parseInt(row.year) : undefined,
          rollNumber: row.rollNumber?.trim(),
          batchId: batchId || undefined,
          inviteToken,
          inviteSentAt: new Date(),
          tempPassword: hashedTemp,
        },
      });

      successCount++;
      results.push({ email: emailLower, status: "success", message: "Enrolled successfully." });

      // Send invite email (fire-and-forget)
      sendStudentInviteEmail(emailLower, row.studentName.trim(), admin.collegeName, tempPassword, inviteToken).catch(
        console.error
      );
    } catch {
      results.push({ email: emailLower, status: "error", message: "Failed to create student." });
    }
  }

  // Update usedSeats count
  if (successCount > 0) {
    await prisma.collegeAdmin.update({
      where: { id: admin.id },
      data: { usedSeats: { increment: successCount } },
    });
  }

  const summary = {
    total: students.length,
    success: successCount,
    duplicates: results.filter((r) => r.status === "duplicate").length,
    errors: results.filter((r) => r.status === "error").length,
  };

  return NextResponse.json({ summary, results });
}
