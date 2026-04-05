// src/app/api/job-search/resume/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { extractTextFromPDF, extractSkillsWithGemini } from "@/lib/jobs/resumeParser";
import { uploadToR2 } from "@/lib/r2Upload";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error("[Resume] Unauthorized - no session");
      return NextResponse.json({ 
        success: false,
        error: "Please sign in to upload resume" 
      }, { status: 401 });
    }

    let formData;
    try {
      formData = await req.formData();
    } catch (err: any) {
      console.error("[Resume] Failed to parse form data:", err);
      return NextResponse.json({ 
        success: false,
        error: "Invalid form data" 
      }, { status: 400 });
    }

    const file = formData.get("resume") as File;
    
    if (!file) {
      console.error("[Resume] No file in request");
      return NextResponse.json({ 
        success: false,
        error: "No file provided" 
      }, { status: 400 });
    }

    const allowedTypes = ["application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      console.error("[Resume] Invalid file type:", file.type);
      return NextResponse.json({ 
        success: false,
        error: "Only PDF files are supported" 
      }, { status: 400 });
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      console.error("[Resume] File too large:", file.size);
      return NextResponse.json({ 
        success: false,
        error: "File too large (max 5MB)" 
      }, { status: 400 });
    }

    console.log(`[Resume] Processing ${file.name} (${file.size} bytes) for user ${session.user.id}`);

    const buffer = Buffer.from(await file.arrayBuffer());
    
    let resumeText = "";
    let skills: string[] = [];
    
    // Try to extract text (but continue if it fails)
    try {
      resumeText = await extractTextFromPDF(buffer);
      console.log(`[Resume] Extracted ${resumeText.length} characters`);
      
      if (resumeText && resumeText.length >= 50) {
        // Try to extract skills (optional)
        try {
          skills = await extractSkillsWithGemini(resumeText);
          console.log(`[Resume] Extracted ${skills.length} skills:`, skills.slice(0, 5));
        } catch (skillErr: any) {
          console.warn("[Resume] Skill extraction failed, continuing without skills:", skillErr.message);
        }
      }
    } catch (extractErr: any) {
      console.warn("[Resume] PDF text extraction failed:", extractErr.message);
      // Continue without text - just save the file
      resumeText = "";
    }

    // Upload to R2 (optional - continue if fails)
    let fileUrl = "";
    try {
      fileUrl = await uploadToR2(buffer, file.name, "resumes");
      console.log(`[Resume] Uploaded to R2:`, fileUrl);
    } catch (uploadErr: any) {
      console.warn("[Resume] R2 upload failed, using placeholder:", uploadErr.message);
      fileUrl = `/resumes/${session.user.id}-${Date.now()}.pdf`;
    }

    // Save to database
    try {
      const resume = await prisma.jobSearchResume.upsert({
        where: { userId: session.user.id },
        create: { 
          userId: session.user.id, 
          fileName: file.name, 
          fileUrl, 
          resumeText: resumeText || "", 
          skills: skills.length > 0 ? skills : [] 
        },
        update: { 
          fileName: file.name, 
          fileUrl, 
          resumeText: resumeText || "", 
          skills: skills.length > 0 ? skills : [] 
        },
      });

      console.log(`[Resume] Saved to DB:`, resume.id);

      return NextResponse.json({ 
        success: true, 
        skills, 
        resumeId: resume.id,
        fileName: file.name,
        message: skills.length > 0 
          ? `${skills.length} skills extracted` 
          : "Resume uploaded (skill extraction pending)"
      });
    } catch (dbErr: any) {
      console.error("[Resume] DB save failed:", dbErr);
      return NextResponse.json({ 
        success: false,
        error: "Failed to save resume. Please try again." 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[Resume] Unexpected error:", error);
    return NextResponse.json({ 
      success: false,
      error: "Upload failed. Please try a different PDF file." 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false,
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const resume = await prisma.jobSearchResume.findUnique({ 
      where: { userId: session.user.id } 
    });

    return NextResponse.json({ 
      success: true,
      resume 
    });
  } catch (error: any) {
    console.error("[Resume] Get error:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to get resume" 
    }, { status: 500 });
  }
}
