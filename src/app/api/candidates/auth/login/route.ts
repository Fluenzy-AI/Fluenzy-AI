/**
 * POST /api/candidates/auth/login
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { signCandidateToken, setCandidateCookie } from "@/lib/candidate-auth";

const Schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Validation failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const candidate = await prisma.candidateUser.findUnique({ where: { email: email.toLowerCase() } });
  if (!candidate) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  const valid = await bcrypt.compare(password, candidate.password);
  if (!valid) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  const token = signCandidateToken({ id: candidate.id, email: candidate.email, name: candidate.name, role: "CANDIDATE" });

  const res = NextResponse.json({ success: true, candidate: { id: candidate.id, name: candidate.name, email: candidate.email } });
  return setCandidateCookie(res, token);
}
