/**
 * HR Portal - Certificate Templates API
 * GET /api/portal/hr/certificate-templates - List templates
 * POST /api/portal/hr/certificate-templates - Create template
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";

export async function GET(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const where: any = { isActive: true };
    if (type) where.type = type;

    const templates = await prisma.certificateTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (err) {
    console.error("[Templates list error]", err);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (decoded.role !== "ADMIN" && decoded.role !== "HR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, type, description, contentHtml, variables, styles, isDefault } = body;

    if (!name || !type || !contentHtml) {
      return NextResponse.json({ error: "Name, type, and content are required" }, { status: 400 });
    }

    const template = await prisma.certificateTemplate.create({
      data: {
        name,
        type,
        description,
        contentHtml,
        variables: variables || {},
        styles: styles || {},
        isDefault: isDefault || false,
        createdBy: decoded.email,
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (err) {
    console.error("[Template create error]", err);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}