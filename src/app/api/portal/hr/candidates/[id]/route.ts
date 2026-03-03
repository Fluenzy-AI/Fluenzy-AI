/**
 * HR Portal - Candidate individual management
 * GET   /api/portal/hr/candidates/[id]
 * PATCH /api/portal/hr/candidates/[id]
 * DELETE /api/portal/hr/candidates/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: { offerLetters: { orderBy: { createdAt: "desc" } } },
  });
  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (decoded.role === "HR" && candidate.hrId !== decoded.staffId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ candidate });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const body = await req.json();
    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (decoded.role === "HR" && candidate.hrId !== decoded.staffId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { interviewDate, ...rest } = body;
    const updated = await prisma.candidate.update({
      where: { id },
      data: { ...rest, ...(interviewDate ? { interviewDate: new Date(interviewDate) } : {}) },
    });

    await prisma.portalAuditLog.create({
      data: {
        staffId: decoded.staffId,
        actorEmail: decoded.email,
        actorRole: decoded.role,
        action: "UPDATE_CANDIDATE",
        entityType: "Candidate",
        entityId: id,
        metadata: { changes: rest },
      },
    });

    return NextResponse.json({ success: true, candidate: updated });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (decoded.role !== "ADMIN") return NextResponse.json({ error: "Admins only" }, { status: 403 });
  const { id } = await params;
  try {
    await prisma.candidate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
