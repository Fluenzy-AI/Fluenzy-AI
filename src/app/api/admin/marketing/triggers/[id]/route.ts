/**
 * Marketing Trigger by ID API
 * GET - Get trigger details
 * PUT - Update trigger
 * DELETE - Delete trigger
 * POST - Toggle trigger active status
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkMarketingAuth, unauthorizedResponse } from "@/lib/marketing-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkMarketingAuth(req);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { id } = await params;

    const trigger = await prisma.automationTrigger.findUnique({
      where: { id },
      include: {
        firedLogs: {
          orderBy: { firedAt: "desc" },
          take: 20,
          select: {
            id: true,
            userId: true,
            firedAt: true,
            contextData: true,
          },
        },
      },
    });

    if (!trigger) {
      return NextResponse.json({ error: "Trigger not found" }, { status: 404 });
    }

    return NextResponse.json({ trigger });
  } catch (error) {
    console.error("Trigger fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trigger" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkMarketingAuth(req);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.automationTrigger.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Trigger not found" }, { status: 404 });
    }

    const {
      name,
      description,
      conditionType,
      conditionParams,
      senderType,
      emailSubject,
      emailBodyHtml,
      emailBodyText,
      cooldownHours,
      isActive,
    } = body;

    const trigger = await prisma.automationTrigger.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description ?? undefined,
        conditionType: conditionType || undefined,
        conditionParams: conditionParams ?? undefined,
        senderType: senderType || undefined,
        emailSubject: emailSubject || undefined,
        emailBodyHtml: emailBodyHtml || undefined,
        emailBodyText: emailBodyText ?? undefined,
        cooldownHours: cooldownHours ?? undefined,
        isActive: isActive ?? undefined,
      },
    });

    return NextResponse.json({
      success: true,
      trigger,
    });
  } catch (error) {
    console.error("Trigger update error:", error);
    return NextResponse.json(
      { error: "Failed to update trigger" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkMarketingAuth(req);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { id } = await params;

    const existing = await prisma.automationTrigger.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Trigger not found" }, { status: 404 });
    }

    await prisma.automationTrigger.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Trigger delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete trigger" },
      { status: 500 }
    );
  }
}

// POST - Toggle trigger active status
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await checkMarketingAuth(req);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const { id } = await params;

    const existing = await prisma.automationTrigger.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Trigger not found" }, { status: 404 });
    }

    const trigger = await prisma.automationTrigger.update({
      where: { id },
      data: {
        isActive: !existing.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      isActive: trigger.isActive,
      message: trigger.isActive ? "Trigger activated" : "Trigger deactivated",
    });
  } catch (error) {
    console.error("Trigger toggle error:", error);
    return NextResponse.json(
      { error: "Failed to toggle trigger" },
      { status: 500 }
    );
  }
}
