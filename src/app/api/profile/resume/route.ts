import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { uploadPdfToR2, getSignedUrl, deleteFromR2 } from "@/lib/r2-service";
import { isR2Configured } from "@/lib/r2";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const STORAGE_LIMIT = 100 * 1024 * 1024; // 100MB per user

const sanitizeFileName = (name: string) => name.replace(/[^a-z0-9._-]/gi, "_");

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const replaceMode = formData.get("replace") === "true"; // New: replace mode

    if (!file) {
      return NextResponse.json({ error: "Resume file is required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size must be under 5MB" }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    // **NEW: In replace mode, delete all existing resumes**
    if (replaceMode) {
      const existingResumes = await (prisma as any).resume.findMany({
        where: { userId: user.id },
      });

      for (const oldResume of existingResumes) {
        // Delete from R2 or filesystem
        const isR2File = oldResume.fileUrl && !oldResume.fileUrl.startsWith("/");
        
        if (isR2File && isR2Configured()) {
          try {
            await deleteFromR2(oldResume.fileUrl);
            console.info(`[PROFILE_RESUME] Deleted from R2: ${oldResume.fileUrl}`);
          } catch (error) {
            console.error(`[PROFILE_RESUME] Failed to delete from R2: ${oldResume.fileUrl}`, error);
          }
        } else if (oldResume.fileUrl && oldResume.fileUrl.startsWith("/")) {
          // Filesystem file
          try {
            const localPath = path.join(process.cwd(), "public", oldResume.fileUrl.replace(/^\/+/, ""));
            await unlink(localPath);
            console.info(`[PROFILE_RESUME] Deleted from filesystem: ${localPath}`);
          } catch (error) {
            console.error(`[PROFILE_RESUME] Failed to delete from filesystem: ${oldResume.fileUrl}`, error);
          }
        }

        // Delete FileRecord if exists
        if (isR2File) {
          await prisma.fileRecord.deleteMany({
            where: {
              userId: user.id,
              fileKey: oldResume.fileUrl,
            },
          });
        }

        // Decrease storage usage
        if (oldResume.fileSize) {
          await prisma.users.update({
            where: { id: user.id },
            data: { storageUsed: { decrement: oldResume.fileSize } },
          });
        }
      }

      // Delete all resume records
      await (prisma as any).resume.deleteMany({
        where: { userId: user.id },
      });

      console.info(`[PROFILE_RESUME] Deleted ${existingResumes.length} old resume(s) for user ${user.id}`);
    }

    // Check storage quota
    const storageUsed = user.storageUsed || 0;
    if (storageUsed + file.size > STORAGE_LIMIT) {
      return NextResponse.json({ error: "Storage limit reached (100 MB)" }, { status: 413 });
    }

    const safeName = sanitizeFileName(file.name || "resume.pdf");
    const buffer = Buffer.from(await file.arrayBuffer());
    
    let fileUrl = "";
    let fileKey: string | null = null;

    // Try R2 first
    if (isR2Configured()) {
      try {
        fileKey = await uploadPdfToR2("resume", user.id, buffer, safeName);
        
        // Create FileRecord
        await prisma.fileRecord.create({
          data: {
            userId: user.id,
            fileType: "resume",
            fileKey,
            originalFileName: safeName,
            fileSize: file.size,
            mimeType: "application/pdf",
          },
        });

        // Update user storage quota
        await prisma.users.update({
          where: { id: user.id },
          data: { storageUsed: { increment: file.size } },
        });

        // Generate signed URL for immediate use
        fileUrl = await getSignedUrl(fileKey, 3600);
        console.info(`[PROFILE_RESUME] Uploaded to R2: ${fileKey}`);
      } catch (r2Error) {
        console.error("[PROFILE_RESUME] R2 upload failed, falling back to filesystem:", r2Error);
        fileKey = null;
        fileUrl = "";
      }
    }

    // Fallback to filesystem if R2 failed or not configured
    if (!fileKey || !fileUrl) {
      const uniqueName = `${Date.now()}-${safeName}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "resumes", user.id.toString());

      await mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, uniqueName);
      await writeFile(filePath, buffer);

      // Normalize URL to use forward slashes
      fileUrl = `/uploads/resumes/${user.id}/${uniqueName}`;
    }

    const resume = await (prisma as any).resume.create({
      data: {
        userId: user.id,
        fileName: safeName,
        fileUrl: fileKey || fileUrl, // Store R2 key or filesystem URL
      },
    });

    return NextResponse.json({
      success: true,
      resume: {
        id: resume.id,
        fileName: resume.fileName,
        fileUrl: fileUrl, // Return the accessible URL (signed or filesystem)
        uploadedAt: resume.uploadedAt,
        isR2: !!fileKey,
      },
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json({ error: "Failed to upload resume" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const resumes = await (prisma as any).resume.findMany({
      where: { userId: user.id },
      orderBy: { uploadedAt: "desc" },
      take: 5,
    });

    // Generate signed URLs for R2 files
    const resumesWithUrls = await Promise.all(
      resumes.map(async (resume: any) => {
        let fileUrl = resume.fileUrl;
        const isR2File = fileUrl && !fileUrl.startsWith("/") && !fileUrl.startsWith("http");
        
        if (isR2File && isR2Configured()) {
          try {
            fileUrl = await getSignedUrl(resume.fileUrl, 3600);
          } catch (e) {
            console.error(`[PROFILE_RESUME] Failed to get signed URL for ${resume.fileUrl}:`, e);
          }
        }
        
        return {
          id: resume.id,
          fileName: resume.fileName,
          fileUrl,
          uploadedAt: resume.uploadedAt,
          isR2: isR2File,
        };
      })
    );

    return NextResponse.json({ resumes: resumesWithUrls });
  } catch (error) {
    console.error("Resume fetch error:", error);
    return NextResponse.json({ error: "Failed to load resumes" }, { status: 500 });
  }
}
