import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
      return NextResponse.json({ error: "Resume file is required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size must be under 5MB" }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    const safeName = sanitizeFileName(file.name || "resume.pdf");
    const uniqueName = `${Date.now()}-${safeName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "resumes", user.id.toString());

    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    // Normalize URL to use forward slashes
    const fileUrl = `/uploads/resumes/${user.id}/${uniqueName}`;

    const resume = await (prisma as any).resume.create({
      data: {
        userId: user.id,
        fileName: safeName,
        fileUrl,
      },
    });

    return NextResponse.json({
      success: true,
      resume: {
        id: resume.id,
        fileName: resume.fileName,
        fileUrl: resume.fileUrl,
        uploadedAt: resume.uploadedAt,
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

    return NextResponse.json({
      resumes: resumes.map((resume: any) => ({
        id: resume.id,
        fileName: resume.fileName,
        fileUrl: resume.fileUrl,
        uploadedAt: resume.uploadedAt,
      })),
    });
  } catch (error) {
    console.error("Resume fetch error:", error);
    return NextResponse.json({ error: "Failed to load resumes" }, { status: 500 });
  }
}
