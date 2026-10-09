import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const PublicApplySchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Phone number required"),
  resumeUrl: z.string().min(1, "Resume upload is required"),
  resumeName: z.string().optional(),
  portfolio: z.string().optional(),
  coverLetter: z.string().optional(),
  experience: z.string().min(1, "Experience is required"),
  linkedin: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PublicApplySchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat()[0] || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { jobId, name, email, phone, resumeUrl, resumeName, portfolio, coverLetter, experience, linkedin } = parsed.data;

    // Check if external job exists and is active
    const job = await prisma.externalJob.findUnique({
      where: { id: jobId },
      include: { company: true },
    });

    if (!job || !job.isActive) {
      return NextResponse.json({ error: "This position is no longer active or available." }, { status: 404 });
    }

    // Check for duplicate application
    const existingApp = await prisma.externalJobApplication.findFirst({
      where: {
        jobId,
        email: email.toLowerCase(),
      },
    });

    if (existingApp) {
      return NextResponse.json({ error: "You have already applied for this job position." }, { status: 409 });
    }

    // Create application in ExternalJobApplication
    const application = await prisma.externalJobApplication.create({
      data: {
        jobId,
        name: name.trim(),
        email: email.toLowerCase(),
        phone: phone.trim(),
        resumeUrl,
        resumeName: resumeName || "Resume.pdf",
        portfolio: portfolio || null,
        coverLetter: coverLetter || null,
        experience,
        linkedin: linkedin || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      message: `Your application for ${job.title} at ${job.company.name} was submitted successfully!`,
    }, { status: 201 });
  } catch (error) {
    console.error("[PUBLIC_COMPANY_APPLY_ERROR]", error);
    return NextResponse.json({ error: "Failed to submit job application" }, { status: 500 });
  }
}
