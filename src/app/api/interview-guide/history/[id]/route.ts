import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/interview-guide/history/[id] - Get specific guide
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const guide = await (prisma as any).interviewGuide.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!guide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    return NextResponse.json(guide);
  } catch (error: any) {
    console.error("Failed to fetch guide:", error);
    return NextResponse.json(
      { error: "Failed to fetch guide", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/interview-guide/history/[id] - Delete a guide
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify ownership before delete
    const guide = await (prisma as any).interviewGuide.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!guide) {
      return NextResponse.json({ error: "Guide not found" }, { status: 404 });
    }

    await (prisma as any).interviewGuide.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete guide:", error);
    return NextResponse.json(
      { error: "Failed to delete guide", details: error.message },
      { status: 500 }
    );
  }
}
