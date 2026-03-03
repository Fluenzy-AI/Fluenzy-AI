/**
 * HR Portal - Interview by ID
 * PATCH /api/portal/hr/interviews/[id]
 * DELETE /api/portal/hr/interviews/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const { status, notes, feedback, result, meetingLink } = body;

  const updated = await prisma.interview.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
      ...(feedback !== undefined && { feedback }),
      ...(result !== undefined && { result }),
      ...(meetingLink !== undefined && { meetingLink }),
    },
    include: { candidate: { select: { id: true, name: true, email: true } } },
  });

  // Sync candidate status if interview completed
  if (status === "COMPLETED" && updated.candidateId) {
    const candidateResult = result === "PASS" ? "SELECTED" : result === "FAIL" ? "REJECTED" : "INTERVIEWED";
    await prisma.candidate.update({
      where: { id: updated.candidateId },
      data: { status: candidateResult as never, interviewNotes: feedback || notes || undefined },
    });
  }

  return NextResponse.json({ success: true, interview: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "HR"].includes(decoded.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.interview.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
