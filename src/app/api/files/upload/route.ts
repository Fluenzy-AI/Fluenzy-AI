/**
 * File Upload API Route
 * Handles PDF uploads to R2 with lifetime CDN caching
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadPDF, FileType } from "@/lib/uploadService";
import { cdnUrl } from "@/lib/cdn";
import prisma from "@/lib/prisma";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES: FileType[] = [
  "RESUME",
  "CERTIFICATE",
  "REPORT",
  "PROFILE_CERT",
  "OFFER_LETTER",
  "PAYMENT_RECEIPT",
];

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const typeRaw = (formData.get("type") as string | null)?.toUpperCase();
    const isPublic = formData.get("isPublic") !== "false"; // Default: true

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!typeRaw || !ALLOWED_TYPES.includes(typeRaw as FileType)) {
      return NextResponse.json(
        { error: `Invalid file type. Use: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const fileType = typeRaw as FileType;

    // 3. Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum 10MB allowed." },
        { status: 400 }
      );
    }

    // 4. Validate MIME type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    // 5. Convert to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 6. Upload to R2
    const { fileKey, fileSize, mimeType } = await uploadPDF(
      buffer,
      fileType,
      user.id,
      file.name
    );

    // 7. Save metadata to database (fileKey only — never the URL)
    const record = await prisma.fileRecord.create({
      data: {
        userId: user.id,
        fileType: fileType.toLowerCase(),
        fileKey,
        originalFileName: file.name,
        fileSize,
        mimeType,
        isPublic,
        isDeleted: false,
      },
    });

    // 8. Update user storage quota
    await prisma.users.update({
      where: { id: user.id },
      data: {
        storageUsed: {
          increment: fileSize,
        },
      },
    });

    // 9. Return CDN URL (constructed dynamically, not from DB)
    return NextResponse.json({
      success: true,
      file: {
        id: record.id,
        fileKey: record.fileKey,
        url: cdnUrl(record.fileKey), // ← Built dynamically, not stored
        type: record.fileType,
        fileName: record.originalFileName,
        fileSize: record.fileSize,
        isPublic: record.isPublic,
      },
    });
  } catch (error: any) {
    console.error("[FILE_UPLOAD] Error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
