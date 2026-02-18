import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET all latest topics (admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role as any) !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "latest";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.companyName = { contains: search, mode: "insensitive" };
    }

    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "company") {
      orderBy = { companyName: "asc" };
    } else if (sortBy === "date") {
      orderBy = { createdAt: "asc" };
    }

    const [topics, total] = await Promise.all([
      prisma.latestTopic.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.latestTopic.count({ where }),
    ]);

    return NextResponse.json({
      topics,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching latest topics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create a new topic
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role as any) !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      companyName,
      gdTopic, gdQuestion, gdDifficulty,
      personalInterviewTopic, personalInterviewQuestion, personalInterviewDifficulty,
      technicalInterviewTopic, technicalInterviewQuestion, technicalInterviewDifficulty,
    } = body;

    if (!companyName) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    const hasGd = gdTopic || gdQuestion;
    const hasPersonal = personalInterviewTopic || personalInterviewQuestion;
    const hasTech = technicalInterviewTopic || technicalInterviewQuestion;

    if (!hasGd && !hasPersonal && !hasTech) {
      return NextResponse.json({ error: "At least one topic field is required" }, { status: 400 });
    }

    const topic = await prisma.latestTopic.create({
      data: {
        companyName,
        gdTopic: gdTopic || null,
        gdQuestion: gdQuestion || null,
        gdDifficulty: gdDifficulty || null,
        personalInterviewTopic: personalInterviewTopic || null,
        personalInterviewQuestion: personalInterviewQuestion || null,
        personalInterviewDifficulty: personalInterviewDifficulty || null,
        technicalInterviewTopic: technicalInterviewTopic || null,
        technicalInterviewQuestion: technicalInterviewQuestion || null,
        technicalInterviewDifficulty: technicalInterviewDifficulty || null,
      },
    });

    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error("Error creating topic:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT update an existing topic
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role as any) !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      id, companyName,
      gdTopic, gdQuestion, gdDifficulty,
      personalInterviewTopic, personalInterviewQuestion, personalInterviewDifficulty,
      technicalInterviewTopic, technicalInterviewQuestion, technicalInterviewDifficulty,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 });
    }

    if (!companyName) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    const topic = await prisma.latestTopic.update({
      where: { id },
      data: {
        companyName,
        gdTopic: gdTopic || null,
        gdQuestion: gdQuestion || null,
        gdDifficulty: gdDifficulty || null,
        personalInterviewTopic: personalInterviewTopic || null,
        personalInterviewQuestion: personalInterviewQuestion || null,
        personalInterviewDifficulty: personalInterviewDifficulty || null,
        technicalInterviewTopic: technicalInterviewTopic || null,
        technicalInterviewQuestion: technicalInterviewQuestion || null,
        technicalInterviewDifficulty: technicalInterviewDifficulty || null,
      },
    });

    return NextResponse.json(topic);
  } catch (error) {
    console.error("Error updating topic:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE a topic
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role as any) !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Topic ID is required" }, { status: 400 });
    }

    await prisma.latestTopic.delete({ where: { id } });

    return NextResponse.json({ message: "Topic deleted successfully" });
  } catch (error) {
    console.error("Error deleting topic:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
