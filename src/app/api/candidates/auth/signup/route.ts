/**
 * POST /api/candidates/auth/signup
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { signCandidateToken, setCandidateCookie } from "@/lib/candidate-auth";

const Schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Validation failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.candidateUser.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

  const hashedPassword = await bcrypt.hash(password, 12);

  const candidate = await prisma.candidateUser.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
    },
  });

  // Create empty profile
  await prisma.candidateProfile.create({
    data: { candidateId: candidate.id, skills: [], profileCompletion: 0, updatedAt: new Date() },
  });

  const token = signCandidateToken({ id: candidate.id, email: candidate.email, name: candidate.name, role: "CANDIDATE" });

  const res = NextResponse.json({ success: true, candidate: { id: candidate.id, name: candidate.name, email: candidate.email } }, { status: 201 });
  return setCandidateCookie(res, token);
}
