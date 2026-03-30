/**
 * File Delete API Route
 * Supports both soft delete (recommended) and hard delete (permanent)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteFromR2 } from "@/lib/uploadService";
import { checkWriteAccess } from "@/lib/fileAccess";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { fileId } = await params;
    
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

    // 2. Parse delete mode from query: ?mode=soft (default) or ?mode=hard
    const mode = req.nextUrl.searchParams.get("mode") ?? "soft";

    // 3. Check write access (verify ownership)
    const access = await checkWriteAccess(fileId, user.id);
    
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const file = access.file;

    // 4. Already deleted?
    if (file.isDeleted && mode === "soft") {
      return NextResponse.json(
        { error: "File already deleted" },
        { status: 400 }
      );
    }

    if (mode === "hard") {
      // ── HARD DELETE (PERMANENT) ──────────────────────────────────
      
      // Step A: Delete from R2
      try {
        await deleteFromR2(file.fileKey);
      } catch (err) {
        console.error("[DELETE] R2 deletion failed:", err);
        // Continue to DB delete even if R2 fails (key may already be gone)
      }

      // Step B: Remove from database entirely
      await prisma.fileRecord.delete({
        where: { id: fileId },
      });

      // Step C: Update user storage quota
      if (file.userId) {
        await prisma.users.update({
          where: { id: file.userId },
          data: {
            storageUsed: {
              decrement: file.fileSize,
            },
          },
        });
      }

      return NextResponse.json({
        success: true,
        mode: "hard",
        message: "File permanently deleted from storage and database.",
      });
    } else {
      // ── SOFT DELETE (RECOMMENDED) ────────────────────────────────
      
      // Mark deleted in DB — file stays in R2 (for safety/audit)
      await prisma.fileRecord.update({
        where: { id: fileId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: user.id,
          isPublic: false, // Also hide from public
        },
      });

      return NextResponse.json({
        success: true,
        mode: "soft",
        message: "File hidden from public. Stored safely for audit.",
      });
    }
  } catch (error: any) {
    console.error("[FILE_DELETE] Error:", error);
    return NextResponse.json(
      { error: error.message || "Delete failed" },
      { status: 500 }
    );
  }
}

// ─── RESTORE SOFT-DELETED FILE ────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { fileId } = await params;
    
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

    // Check write access
    const access = await checkWriteAccess(fileId, user.id);
    
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const file = access.file;

    // Parse action from body
    const body = await req.json();
    const action = body.action;

    if (action === "restore") {
      // Restore soft-deleted file
      if (!file.isDeleted) {
        return NextResponse.json(
          { error: "File is not deleted" },
          { status: 400 }
        );
      }

      const restored = await prisma.fileRecord.update({
        where: { id: fileId },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          isPublic: true,
        },
      });

      return NextResponse.json({
        success: true,
        file: restored,
        message: "File restored successfully",
      });
    } else if (action === "toggle-visibility") {
      // Toggle public/private
      const updated = await prisma.fileRecord.update({
        where: { id: fileId },
        data: {
          isPublic: !file.isPublic,
        },
      });

      return NextResponse.json({
        success: true,
        isPublic: updated.isPublic,
        message: `File is now ${updated.isPublic ? "public" : "private"}`,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'restore' or 'toggle-visibility'" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("[FILE_PATCH] Error:", error);
    return NextResponse.json(
      { error: error.message || "Operation failed" },
      { status: 500 }
    );
  }
}
