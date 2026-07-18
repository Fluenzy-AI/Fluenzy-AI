/**
 * AI Email Generation API
 * POST - Generate marketing email content using Gemini AI
 */

import { NextRequest, NextResponse } from "next/server";
import {
  generateMarketingEmail,
  generateEmailVariations,
  improveEmailContent,
  generateSubjectLines,
} from "@/lib/marketing/ai-email-generator";
import { checkMarketingAuth, unauthorizedResponse } from "@/lib/marketing-auth";
import { extractRequestMetadata } from "@/lib/langsmith";

export async function POST(req: NextRequest) {
  try {
    const auth = await checkMarketingAuth(req);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const body = await req.json();
    const { action, ...params } = body;

    const traceMeta = extractRequestMetadata(req, {
      userId: auth.userId,
      email: auth.email,
      plan: "Pro",
    });

    switch (action || "generate") {
      case "generate": {
        const {
          prompt,
          segmentContext,
          senderType,
          tone,
          targetAudience,
          purpose,
        } = params;

        if (!prompt || !senderType) {
          return NextResponse.json(
            { error: "Missing required fields: prompt, senderType" },
            { status: 400 }
          );
        }

        const result = await generateMarketingEmail({
          prompt,
          segmentContext,
          senderType,
          tone: tone || "professional",
          targetAudience,
          purpose,
        }, traceMeta);

        return NextResponse.json({
          success: true,
          email: result,
        });
      }

      case "variations": {
        const { prompt, senderType, tone, count } = params;

        if (!prompt || !senderType) {
          return NextResponse.json(
            { error: "Missing required fields: prompt, senderType" },
            { status: 400 }
          );
        }

        const variations = await generateEmailVariations(
          { prompt, senderType, tone: tone || "professional" },
          count || 3,
          traceMeta
        );

        return NextResponse.json({
          success: true,
          variations,
        });
      }

      case "improve": {
        const { subject, body: emailBody, focus } = params;

        if (!subject || !emailBody || !focus) {
          return NextResponse.json(
            { error: "Missing required fields: subject, body, focus" },
            { status: 400 }
          );
        }

        const validFocus = ["deliverability", "engagement", "conversion", "clarity"];
        if (!validFocus.includes(focus)) {
          return NextResponse.json(
            { error: `Invalid focus. Must be one of: ${validFocus.join(", ")}` },
            { status: 400 }
          );
        }

        const improved = await improveEmailContent(subject, emailBody, focus, traceMeta);

        return NextResponse.json({
          success: true,
          improved,
        });
      }

      case "subject-lines": {
        const { context, count } = params;

        if (!context) {
          return NextResponse.json(
            { error: "Missing required field: context" },
            { status: 400 }
          );
        }

        const subjects = await generateSubjectLines(context, count || 5, traceMeta);

        return NextResponse.json({
          success: true,
          subjects,
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: generate, variations, improve, or subject-lines" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate email content",
      },
      { status: 500 }
    );
  }
}
