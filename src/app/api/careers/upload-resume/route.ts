/**
 * Careers - Resume Upload
 * POST /api/careers/upload-resume
 *
 * Accepts PDF only, max 5 MB.
 * Uploads to R2 storage (preferred) or falls back to filesystem.
 * Returns the URL of the uploaded file.
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getCandidateFromRequest, calcProfileCompletion } from "@/lib/candidate-auth";
import { uploadPdfToR2, getSignedUrl } from "@/lib/r2-service";
import { isR2Configured } from "@/lib/r2";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["application/pdf"];
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "resumes");

function isPdfBuffer(buffer: Buffer): boolean {
  // PDF files start with "%PDF"
  return buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData().catch(() => null);
    if (!formData) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

    const file = (formData.get("file") || formData.get("resume")) as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // Validate type — accept by MIME or by extension (.pdf)
    const isPdfMime = ALLOWED_TYPES.includes(file.type);
    const isPdfExt = file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfMime && !isPdfExt) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 415 });
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "File size must be under 5 MB" }, { status: 413 });
    }

    // Sanitize filename (remove special characters that could cause issues)
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const buffer = Buffer.from(await file.arrayBuffer());
    
    if (!isPdfBuffer(buffer)) {
      return NextResponse.json({ error: "Invalid PDF file. Please upload a real PDF document." }, { status: 415 });
    }

    let fileUrl = "";
    let fileKey: string | null = null;
    const candidateSession = getCandidateFromRequest(req);

    // Try R2 first, fallback to filesystem
    if (isR2Configured()) {
      try {
        const candidateId = candidateSession?.id || "anonymous";
        fileKey = await uploadPdfToR2("job-resume", candidateId, buffer, originalName);
        
        // Create FileRecord if we have a candidate
        if (candidateSession?.id) {
          await prisma.fileRecord.create({
            data: {
              fileType: "job-resume",
              fileKey,
              originalFileName: file.name,
              fileSize: file.size,
              mimeType: "application/pdf",
              metadata: { candidateId: candidateSession.id },
            },
          });
        }

        // Generate signed URL for immediate use (1 hour)
        fileUrl = await getSignedUrl(fileKey, 3600);
        console.info(`[CAREERS_RESUME] Uploaded to R2: ${fileKey}`);
      } catch (r2Error) {
        console.error("[CAREERS_RESUME] R2 upload failed, falling back to filesystem:", r2Error);
        fileKey = null;
        fileUrl = "";
      }
    }

    // Fallback to filesystem if R2 failed or not configured
    if (!fileKey || !fileUrl) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).slice(2, 8);
      const fileName = `resume_${timestamp}_${random}_${originalName}`;

      await mkdir(UPLOAD_DIR, { recursive: true });
      const filePath = path.join(UPLOAD_DIR, fileName);
      await writeFile(filePath, buffer);

      // Normalize URL to always use forward slashes
      fileUrl = `/uploads/resumes/${fileName}`;
    }

    // If candidate is logged in, persist resume immediately so refresh does not lose it.
    if (candidateSession) {
      const existing = await prisma.candidateProfile.findUnique({ where: { candidateId: candidateSession.id } });
      const profileCompletion = calcProfileCompletion({
        phone: existing?.phone,
        education: existing?.education,
        experience: existing?.experience,
        skills: existing?.skills,
        resumeUrl: fileKey || fileUrl, // Store R2 key or filesystem URL
        linkedin: existing?.linkedin,
        portfolio: existing?.portfolio,
        address: existing?.address,
      });

      await prisma.candidateProfile.upsert({
        where: { candidateId: candidateSession.id },
        update: {
          resumeUrl: fileKey || fileUrl,
          resumeName: file.name,
          profileCompletion,
          updatedAt: new Date(),
        },
        create: {
          candidateId: candidateSession.id,
          skills: [],
          resumeUrl: fileKey || fileUrl,
          resumeName: file.name,
          profileCompletion,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      url: fileUrl, 
      name: file.name,
      fileKey: fileKey || undefined, // Return R2 key if available
    }, { status: 201 });
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload resume. Please try again." },
      { status: 500 }
    );
  }
}
