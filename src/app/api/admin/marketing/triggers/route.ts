/**
 * Marketing Automation Triggers API
 * GET - List all triggers
 * POST - Create a new trigger
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkMarketingAuth, unauthorizedResponse } from "@/lib/marketing-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await checkMarketingAuth(req);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const triggers = await prisma.automationTrigger.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        conditionType: true,
        conditionParams: true,
        senderType: true,
        emailSubject: true,
        isActive: true,
        cooldownHours: true,
        totalFired: true,
        lastFiredAt: true,
        createdBy: true,
        createdAt: true,
      },
    });

    // Get trigger condition type descriptions
    const triggerDescriptions: Record<string, string> = {
      quick_submit: "Fires when a user submits an interview in less than X seconds",
      incomplete_module: "Fires when a user has incomplete training modules",
      inactive: "Fires when a user hasn't been active for X days",
      upgrade: "Fires when a user upgrades their plan",
      low_score: "Fires when a user has a score below X%",
      completion: "Fires when a user completes a module",
      new_signup: "Fires when a new user signs up",
      plan_upgrade: "Fires when a user upgrades to a paid plan",
      plan_downgrade: "Fires when a user downgrades their plan",
    };

    const triggersWithInfo = triggers.map((trigger) => ({
      ...trigger,
      conditionDescription: triggerDescriptions[trigger.conditionType] || "Unknown trigger type",
    }));

    return NextResponse.json({ triggers: triggersWithInfo });
  } catch (error) {
    console.error("Triggers list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch triggers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await checkMarketingAuth(req);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const body = await req.json();
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

    // Validate required fields
    if (!name || !conditionType || !senderType || !emailSubject || !emailBodyHtml) {
      return NextResponse.json(
        { error: "Missing required fields: name, conditionType, senderType, emailSubject, emailBodyHtml" },
        { status: 400 }
      );
    }

    // Validate condition type
    const validConditionTypes = [
      "quick_submit",
      "incomplete_module",
      "inactive",
      "upgrade",
      "low_score",
      "completion",
      "new_signup",
      "plan_upgrade",
      "plan_downgrade",
    ];

    if (!validConditionTypes.includes(conditionType)) {
      return NextResponse.json(
        { error: `Invalid condition type. Must be one of: ${validConditionTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate sender type
    if (!["news", "contact", "careers", "support"].includes(senderType)) {
      return NextResponse.json(
        { error: "Invalid sender type" },
        { status: 400 }
      );
    }

    const trigger = await prisma.automationTrigger.create({
      data: {
        name,
        description: description || undefined,
        conditionType,
        conditionParams: conditionParams || undefined,
        senderType,
        emailSubject,
        emailBodyHtml,
        emailBodyText: emailBodyText || undefined,
        cooldownHours: cooldownHours || 24,
        isActive: isActive || false,
        createdBy: auth.email || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      trigger: {
        id: trigger.id,
        name: trigger.name,
        isActive: trigger.isActive,
      },
    });
  } catch (error) {
    console.error("Trigger create error:", error);
    return NextResponse.json(
      { error: "Failed to create trigger" },
      { status: 500 }
    );
  }
}
