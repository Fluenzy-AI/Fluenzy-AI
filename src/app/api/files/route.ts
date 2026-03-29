/**
 * Files API - List files for the authenticated user
 * GET /api/files - List all files for the current user
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
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

    // Parse query params
    const url = new URL(request.url);
    const fileType = url.searchParams.get("fileType");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId: user.id };
    if (fileType) {
      where.fileType = fileType;
    }

    // Admin can see all files
    const isAdmin = user.role === "Admin" || user.role === "SUPER_ADMIN";
    if (isAdmin && url.searchParams.get("all") === "true") {
      delete where.userId;
    }

    const [files, total] = await Promise.all([
      prisma.fileRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fileType: true,
          originalFileName: true,
          fileSize: true,
          mimeType: true,
          createdAt: true,
          metadata: true,
        },
      }),
      prisma.fileRecord.count({ where }),
    ]);

    // Get storage usage
    const storageUsed = user.storageUsed || 0;
    const storageLimit = 100 * 1024 * 1024; // 100 MB

    return NextResponse.json({
      files,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      storage: {
        used: storageUsed,
        limit: storageLimit,
        usedPercent: Math.round((storageUsed / storageLimit) * 100),
      },
    });
  } catch (error) {
    console.error("[FILES_LIST_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
