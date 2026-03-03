/**
 * Admin Portal - Support Ticket Management
 * GET    /api/portal/admin/tickets   - List tickets
 * POST   /api/portal/admin/tickets   - Create ticket
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import { sendPortalEmail, ADMIN_EMAIL_TEMPLATES } from "@/lib/portal-email";
import { z } from "zod";

const CreateTicketSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  submittedBy: z.string().email(),
  submittedByRole: z.string(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional().default("MEDIUM"),
  category: z.string().optional(),
});

function generateTicketNumber(): string {
  return "TKT-" + Date.now().toString().slice(-6);
}

export async function GET(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (decoded.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");

  const where = {
    ...(status ? { status: status as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" } : {}),
    ...(priority ? { priority: priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" } : {}),
  };

  const [total, tickets] = await Promise.all([
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ tickets, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = CreateTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: { ...parsed.data, ticketNumber: generateTicketNumber() },
    });

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (err) {
    console.error("[CREATE_TICKET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
