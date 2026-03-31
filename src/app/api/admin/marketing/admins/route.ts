/**
 * Marketing Admins API
 * GET - List all marketing admins
 * POST - Create a new marketing admin
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only SUPER_ADMIN can manage marketing admins
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admins = await prisma.marketingAdmin.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        permissions: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
    });

    return NextResponse.json({ admins });
  } catch (error) {
    console.error("Marketing admins list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketing admins" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only SUPER_ADMIN can create marketing admins
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, password, permissions } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, password" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.marketingAdmin.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An admin with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Default permissions
    const defaultPermissions = {
      canCreateCampaigns: true,
      canEditCampaigns: true,
      canDeleteCampaigns: false,
      canSendCampaigns: true,
      canManageSegments: true,
      canManageTriggers: true,
      canViewLogs: true,
      canViewAnalytics: true,
      canUseAI: true,
    };

    const admin = await prisma.marketingAdmin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        status: "ACTIVE",
        permissions: permissions || defaultPermissions,
        createdBy: (session.user as any).id || "system",
      },
    });

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        status: admin.status,
      },
    });
  } catch (error) {
    console.error("Marketing admin create error:", error);
    return NextResponse.json(
      { error: "Failed to create marketing admin" },
      { status: 500 }
    );
  }
}
