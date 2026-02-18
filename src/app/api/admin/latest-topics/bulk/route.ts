import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST bulk create topics (CSV import)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role as any) !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { topics } = body;

    if (!Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json({ error: "No topics provided" }, { status: 400 });
    }

    if (topics.length > 500) {
      return NextResponse.json({ error: "Maximum 500 topics per upload" }, { status: 400 });
    }

    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process in batches of 50 for performance
    const batchSize = 50;
    for (let i = 0; i < topics.length; i += batchSize) {
      const batch = topics.slice(i, i + batchSize);
      const validBatch = [];

      for (const topic of batch) {
        const {
          companyName, type,
          gdTopic, gdQuestion, gdDifficulty,
          personalInterviewTopic, personalInterviewQuestion, personalInterviewDifficulty,
          technicalInterviewTopic, technicalInterviewQuestion, technicalInterviewDifficulty,
          // flat CSV fields
          topic: flatTopic, question: flatQuestion, difficulty: flatDifficulty,
        } = topic;

        if (!companyName?.trim()) {
          failed++;
          errors.push(`Missing company name in row`);
          continue;
        }

        // Build data object — support both flat (per-type CSV) and multi-column formats
        const data: any = {
          companyName: companyName.trim(),
          gdTopic: null, gdQuestion: null, gdDifficulty: null,
          personalInterviewTopic: null, personalInterviewQuestion: null, personalInterviewDifficulty: null,
          technicalInterviewTopic: null, technicalInterviewQuestion: null, technicalInterviewDifficulty: null,
        };

        if (type === "gd" || type === "gdTopic") {
          data.gdTopic = (flatTopic || gdTopic)?.trim() || null;
          data.gdQuestion = (flatQuestion || gdQuestion)?.trim() || null;
          data.gdDifficulty = (flatDifficulty || gdDifficulty)?.trim() || null;
        } else if (type === "personal" || type === "personalInterviewTopic") {
          data.personalInterviewTopic = (flatTopic || personalInterviewTopic)?.trim() || null;
          data.personalInterviewQuestion = (flatQuestion || personalInterviewQuestion)?.trim() || null;
          data.personalInterviewDifficulty = (flatDifficulty || personalInterviewDifficulty)?.trim() || null;
        } else if (type === "technical" || type === "technicalInterviewTopic") {
          data.technicalInterviewTopic = (flatTopic || technicalInterviewTopic)?.trim() || null;
          data.technicalInterviewQuestion = (flatQuestion || technicalInterviewQuestion)?.trim() || null;
          data.technicalInterviewDifficulty = (flatDifficulty || technicalInterviewDifficulty)?.trim() || null;
        } else {
          // Multi-column format (all types)
          data.gdTopic = gdTopic?.trim() || null;
          data.gdQuestion = gdQuestion?.trim() || null;
          data.gdDifficulty = gdDifficulty?.trim() || null;
          data.personalInterviewTopic = personalInterviewTopic?.trim() || null;
          data.personalInterviewQuestion = personalInterviewQuestion?.trim() || null;
          data.personalInterviewDifficulty = personalInterviewDifficulty?.trim() || null;
          data.technicalInterviewTopic = technicalInterviewTopic?.trim() || null;
          data.technicalInterviewQuestion = technicalInterviewQuestion?.trim() || null;
          data.technicalInterviewDifficulty = technicalInterviewDifficulty?.trim() || null;
        }

        const hasAny = data.gdTopic || data.gdQuestion ||
          data.personalInterviewTopic || data.personalInterviewQuestion ||
          data.technicalInterviewTopic || data.technicalInterviewQuestion;

        if (!hasAny) {
          failed++;
          errors.push(`No topic data for "${companyName}"`);
          continue;
        }

        validBatch.push(data);
      }

      if (validBatch.length > 0) {
        try {
          const result = await prisma.latestTopic.createMany({
            data: validBatch,
          });
          created += result.count;
        } catch (batchError) {
          // Fallback: insert one by one
          for (const item of validBatch) {
            try {
              await prisma.latestTopic.create({ data: item });
              created++;
            } catch {
              failed++;
              errors.push(`Failed to create topic for "${item.companyName}"`);
            }
          }
        }
      }
    }

    return NextResponse.json({
      message: "Bulk import completed",
      created,
      failed,
      total: topics.length,
      errors: errors.slice(0, 20), // Return max 20 errors
    });
  } catch (error) {
    console.error("Error in bulk import:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
