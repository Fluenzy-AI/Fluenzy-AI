import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const COLLECTION = "behavioral_analytics";
const MAX_SNAPSHOTS = 6;
const MAX_IMAGE_LENGTH = 1_500_000;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const sessionId = String(body?.sessionId || "").trim();
    const timeline = Array.isArray(body?.timeline) ? body.timeline : [];
    const summary = body?.summary && typeof body.summary === "object" ? body.summary : null;
    const alerts = Array.isArray(body?.alerts) ? body.alerts.filter((x: unknown) => typeof x === "string") : [];
    const alertSnapshots = Array.isArray(body?.alertSnapshots)
      ? body.alertSnapshots
          .filter((snap: any) =>
            snap &&
            typeof snap === "object" &&
            typeof snap.timestamp === "string" &&
            typeof snap.issueCode === "string" &&
            typeof snap.issueDetected === "string" &&
            typeof snap.observation === "string" &&
            typeof snap.suggestion === "string" &&
            typeof snap.imageData === "string" &&
            snap.imageData.startsWith("data:image/jpeg;base64,") &&
            snap.imageData.length <= MAX_IMAGE_LENGTH
          )
          .slice(0, MAX_SNAPSHOTS)
      : [];
    const sampleCount = Number(body?.sampleCount || timeline.length || 0);

    if (!sessionId || !timeline.length || !summary) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const document = {
      userId: user.id,
      sessionId,
      startedAt: body?.startedAt || new Date().toISOString(),
      endedAt: body?.endedAt || new Date().toISOString(),
      summary,
      timeline,
      alerts,
      alertSnapshots,
      sampleCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await (prisma as any).$runCommandRaw({
      insert: COLLECTION,
      documents: [document],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Behavioral analytics save error:", error);
    return NextResponse.json({ error: "Failed to save behavioral analytics" }, { status: 500 });
  }
}
