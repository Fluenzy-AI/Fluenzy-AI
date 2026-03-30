/**
 * Files API - Get URL for R2 files
 * GET /api/files/[id] - Get CDN URL for a file by FileRecord ID
 * DELETE /api/files/[id] - Delete a file from R2
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getPublicUrl, deleteFromR2 } from "@/lib/r2-service";
import { isR2Configured } from "@/lib/r2";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Find the file record
    const fileRecord = await prisma.fileRecord.findUnique({
      where: { id },
    });

    if (!fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check ownership or admin access
    const isOwner = fileRecord.userId === user.id;
    const isAdmin = user.role === "Admin" || user.role === "SUPER_ADMIN";
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "File storage is not configured" },
        { status: 503 }
      );
    }

    // Generate lifetime CDN URL instead of signed URL
    const url = getPublicUrl(fileRecord.fileKey);

    console.info(`[FILES_API] CDN URL generated for file ${id} by user ${user.id}`);

    return NextResponse.json({
      url,
      expiresIn: null, // null = never expires (lifetime CDN URL)
      fileName: fileRecord.originalFileName,
      fileType: fileRecord.fileType,
      fileSize: fileRecord.fileSize,
    });
  } catch (error) {
    console.error("[FILES_API_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to get file" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Find the file record
    const fileRecord = await prisma.fileRecord.findUnique({
      where: { id },
    });

    if (!fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check ownership or admin access
    const isOwner = fileRecord.userId === user.id;
    const isAdmin = user.role === "Admin" || user.role === "SUPER_ADMIN";
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "File storage is not configured" },
        { status: 503 }
      );
    }

    // Delete from R2
    await deleteFromR2(fileRecord.fileKey);

    // Delete record from database
    await prisma.fileRecord.delete({
      where: { id },
    });

    // Decrement user storage quota
    if (fileRecord.userId) {
      await prisma.users.update({
        where: { id: fileRecord.userId },
        data: { storageUsed: { decrement: fileRecord.fileSize } },
      });
    }

    console.info(`[FILES_API] Deleted file ${id} by user ${user.id}`);

    return NextResponse.json({ success: true, message: "File deleted" });
  } catch (error) {
    console.error("[FILES_API_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
