/**
 * Careers - Resume Upload
 * POST /api/careers/upload-resume
 *
 * Accepts PDF only, max 5 MB.
 * Saves to /public/uploads/resumes/
 * Returns the public URL of the uploaded file.
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["application/pdf"];
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "resumes");

export async function POST(req: NextRequest) {
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

  // Sanitize filename
  const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const fileName = `resume_${timestamp}_${random}_${originalName}`;

  // Ensure upload directory exists
  await mkdir(UPLOAD_DIR, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(UPLOAD_DIR, fileName);
  await writeFile(filePath, buffer);

  const fileUrl = `/uploads/resumes/${fileName}`;
  return NextResponse.json({ success: true, url: fileUrl, name: file.name }, { status: 201 });
}
