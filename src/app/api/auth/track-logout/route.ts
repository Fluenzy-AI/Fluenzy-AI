import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Called via navigator.sendBeacon on beforeunload.
 * Updates the most recent open login log with logoutTime + sessionDuration.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // sendBeacon may not always carry session cookies — accept userId from body as fallback
    let userId = (session?.user as any)?.id as string | undefined;
    if (!userId) {
      try {
        const body = await req.json();
        userId = body?.userId;
      } catch (_) {}
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const latestLog = await (prisma as any).userLoginLog.findFirst({
      where: {
        userId,
        logoutTime: null,
      },
      orderBy: { loginTime: "desc" },
    });

    if (latestLog) {
      const logoutTime = new Date();
      const duration = Math.floor(
        (logoutTime.getTime() - new Date(latestLog.loginTime).getTime()) / 1000
      );
      await (prisma as any).userLoginLog.update({
        where: { id: latestLog.id },
        data: { logoutTime, sessionDuration: duration },
      });
      console.log("[TRACK_LOGOUT]", { logId: latestLog.id, duration });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[TRACK_LOGOUT_ERROR]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
