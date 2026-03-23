/**
 * Public Job Apply API
 * POST /api/jobs/apply - Submit job application
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getCandidateFromRequest } from "@/lib/candidate-auth";

const ApplySchema = z.object({
  jobId: z.string(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  resumeUrl: z.string().url(),
  resumeName: z.string().optional(),
  portfolio: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  coverLetter: z.string().max(3000).optional(),
  experience: z.string(),
});

// Simple rate limiting
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // 5 applications per hour per IP
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimit.get(ip);

  if (!record || record.resetAt < now) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many applications. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = ApplySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    // Get job details
    const job = await prisma.externalJob.findUnique({
      where: { id: data.jobId },
      include: {
        company: { select: { id: true, name: true, status: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (!job.isActive) {
      return NextResponse.json({ error: "This job is no longer accepting applications" }, { status: 410 });
    }

    if (job.company.status !== "ACTIVE") {
      return NextResponse.json({ error: "Company is not currently hiring" }, { status: 410 });
    }

    // Check for duplicate application
    const existingApplication = await prisma.externalJobApplication.findFirst({
      where: {
        jobId: data.jobId,
        email: data.email.toLowerCase(),
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already applied to this job" },
        { status: 409 }
      );
    }

    // Check if candidate is logged in
    const candidate = await getCandidateFromRequest(req);

    // Create application
    const application = await prisma.externalJobApplication.create({
      data: {
        jobId: data.jobId,
        candidateId: candidate?.id,
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        resumeUrl: data.resumeUrl,
        resumeName: data.resumeName,
        portfolio: data.portfolio || null,
        linkedin: data.linkedin || null,
        coverLetter: data.coverLetter || null,
        experience: data.experience,
        status: "PENDING",
        isAutoApplied: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully!",
      applicationId: application.id,
    });
  } catch (error) {
    console.error("[JOBS_APPLY]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
