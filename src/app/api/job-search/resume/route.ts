// src/app/api/job-search/resume/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { extractTextFromPDF, extractSkillsWithGemini } from "@/lib/jobs/resumeParser";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("resume") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const resumeText = await extractTextFromPDF(buffer);
    const skills = await extractSkillsWithGemini(resumeText);

    // Store file URL (in production, upload to R2/S3)
    const fileUrl = `/resumes/${session.user.id}-${Date.now()}.pdf`;

    const resume = await prisma.jobSearchResume.upsert({
      where: { userId: session.user.id },
      create: { 
        userId: session.user.id, 
        fileName: file.name, 
        fileUrl, 
        resumeText, 
        skills 
      },
      update: { 
        fileName: file.name, 
        fileUrl, 
        resumeText, 
        skills 
      },
    });

    return NextResponse.json({ 
      success: true, 
      skills, 
      resumeId: resume.id,
      fileName: file.name,
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resume = await prisma.jobSearchResume.findUnique({ 
      where: { userId: session.user.id } 
    });

    return NextResponse.json({ resume });
  } catch (error) {
    console.error("Get resume error:", error);
    return NextResponse.json({ error: "Failed to get resume" }, { status: 500 });
  }
}
