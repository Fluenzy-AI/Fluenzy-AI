/**
 * HR Portal - Certificate PDF Download
 * GET /api/portal/hr/certificates/[id]/pdf
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        candidate: true,
        employee: true,
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // Read PDF file
    const pdfPath = path.join(process.cwd(), "public", certificate.pdfUrl!);
    
    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json({ error: "PDF file not found" }, { status: 404 });
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    const candidateName = certificate.candidate?.name || certificate.employee?.name || "Certificate";
    const fileName = `${certificate.certificateNumber}_${candidateName.replace(/\s+/g, "_")}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error("[Certificate PDF download error]", err);
    return NextResponse.json({ error: "Failed to download certificate" }, { status: 500 });
  }
}