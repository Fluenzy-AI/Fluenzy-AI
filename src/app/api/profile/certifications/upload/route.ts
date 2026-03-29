import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { uploadPdfToR2, getSignedUrl } from "@/lib/r2-service";
import { isR2Configured } from "@/lib/r2";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["application/pdf"];
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

    if (!file) {
      return NextResponse.json({ error: "Certificate image is required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size must be under 5MB" }, { status: 400 });
    }

    // Check storage quota
    const currentUsage = user.storageUsed || 0;
    if (currentUsage + file.size > STORAGE_LIMIT) {
      return NextResponse.json(
        { error: "Storage limit reached (100 MB). Please delete some files first." },
        { status: 413 }
      );
    }

    const safeName = sanitizeFileName(file.name || "certificate-image");
    const buffer = Buffer.from(await file.arrayBuffer());

    let fileUrl: string;
    let fileKey: string | null = null;

    // Try R2 first, fallback to filesystem
    if (isR2Configured()) {
      try {
        fileKey = await uploadPdfToR2("profile-cert", user.id, buffer, safeName);
        
        // Create FileRecord
        await prisma.fileRecord.create({
          data: {
            userId: user.id,
            fileType: "profile-cert",
            fileKey,
            originalFileName: file.name || safeName,
            fileSize: file.size,
            mimeType: file.type,
          },
        });

        // Update user storage quota
        await prisma.users.update({
          where: { id: user.id },
          data: { storageUsed: { increment: file.size } },
        });

        // Return signed URL for immediate use
        fileUrl = await getSignedUrl(fileKey, 3600); // 1 hour for initial display
        
        console.info(`[PROFILE_CERT] Uploaded to R2: ${fileKey}`);
        
        return NextResponse.json({
          success: true,
          imageUrl: fileUrl,
          fileKey, // Return key for future reference
        });
      } catch (r2Error) {
        console.error("[PROFILE_CERT] R2 upload failed, falling back to filesystem:", r2Error);
      }
    }

    // Fallback to filesystem
    const uniqueName = `${Date.now()}-${safeName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "certificates", user.id.toString());
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);
    fileUrl = `/uploads/certificates/${user.id}/${uniqueName}`;

    return NextResponse.json({
      success: true,
      imageUrl: fileUrl,
    });
  } catch (error) {
    console.error("Certificate image upload error:", error);
    return NextResponse.json({ error: "Failed to upload certificate image" }, { status: 500 });
  }
}
