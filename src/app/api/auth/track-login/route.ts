import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Lightweight User-Agent parser (no external dependency)
function parseUA(ua: string): { deviceType: string; os: string; browser: string } {
  // Device type
  let deviceType = "Desktop";
  if (/Mobi|Android(?!.*Tablet)|iPhone|iPod|BlackBerry|Windows Phone/i.test(ua)) {
    deviceType = "Mobile";
  } else if (/Tablet|iPad|Android(?=.*Tablet)|Kindle|PlayBook/i.test(ua)) {
    deviceType = "Tablet";
  }

  // OS — order matters: Android before Linux, iOS before macOS
  let os = "Unknown";
  if (/Android/i.test(ua)) {
    const m = ua.match(/Android\s?([\d.]+)/i);
    os = m ? `Android ${m[1]}` : "Android";
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    const m = ua.match(/OS\s?([\d_]+)/i);
    os = m ? `iOS ${m[1].replace(/_/g, ".")}` : "iOS";
  } else if (/Windows NT/i.test(ua)) {
    const versionMap: Record<string, string> = {
      "10.0": "Windows 10/11",
      "6.3": "Windows 8.1",
      "6.2": "Windows 8",
      "6.1": "Windows 7",
    };
    const m = ua.match(/Windows NT\s?([\d.]+)/i);
    os = m ? (versionMap[m[1]] || `Windows NT ${m[1]}`) : "Windows";
  } else if (/Mac OS X/i.test(ua)) {
    const m = ua.match(/Mac OS X\s?([\d_.]+)/i);
    os = m ? `macOS ${m[1].replace(/_/g, ".")}` : "macOS";
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
  } else if (/CrOS/i.test(ua)) {
    os = "ChromeOS";
  }

  // Browser — order matters: Edge before Chrome, Opera before Chrome
  let browser = "Unknown";
  if (/Edg\//i.test(ua)) {
    const m = ua.match(/Edg\/([\d.]+)/i);
    browser = m ? `Edge ${m[1].split(".")[0]}` : "Edge";
  } else if (/OPR\//i.test(ua)) {
    const m = ua.match(/OPR\/([\d.]+)/i);
    browser = m ? `Opera ${m[1].split(".")[0]}` : "Opera";
  } else if (/SamsungBrowser/i.test(ua)) {
    const m = ua.match(/SamsungBrowser\/([\d.]+)/i);
    browser = m ? `Samsung Internet ${m[1].split(".")[0]}` : "Samsung Internet";
  } else if (/Chrome/i.test(ua)) {
    const m = ua.match(/Chrome\/([\d.]+)/i);
    browser = m ? `Chrome ${m[1].split(".")[0]}` : "Chrome";
  } else if (/Firefox/i.test(ua)) {
    const m = ua.match(/Firefox\/([\d.]+)/i);
    browser = m ? `Firefox ${m[1].split(".")[0]}` : "Firefox";
  } else if (/Safari/i.test(ua)) {
    const m = ua.match(/Version\/([\d.]+)/i);
    browser = m ? `Safari ${m[1].split(".")[0]}` : "Safari";
  }

  return { deviceType, os, browser };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ua = req.headers.get("user-agent") || "";
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : (req.headers.get("x-real-ip") || "Unknown");

    const { deviceType, os, browser } = parseUA(ua);

    console.log("[TRACK_LOGIN]", { userId: session.user.id, deviceType, os, browser, ip });

    // Find the most recent login log within the last 15 minutes (handles race condition
    // where the signIn event DB write completes slightly after the tracker fires)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const latestLog = await (prisma as any).userLoginLog.findFirst({
      where: {
        userId: session.user.id,
        loginTime: { gte: fifteenMinsAgo },
      },
      orderBy: { loginTime: "desc" },
    });

    if (latestLog) {
      // Only update if device info is missing
      if (!latestLog.deviceType) {
        await (prisma as any).userLoginLog.update({
          where: { id: latestLog.id },
          data: { ip, deviceType, os, browser },
        });
        console.log("[TRACK_LOGIN_UPDATED]", { logId: latestLog.id, deviceType, os, browser, ip });
      } else {
        console.log("[TRACK_LOGIN_SKIP]", "Log already has device info");
      }
    } else {
      // No recent log found — create one (handles edge case where signIn event failed)
      await (prisma as any).userLoginLog.create({
        data: {
          userId: session.user.id,
          loginTime: new Date(),
          status: "success",
          ip, deviceType, os, browser,
        },
      });
      console.log("[TRACK_LOGIN_CREATED]", { deviceType, os, browser, ip });
    }

    return NextResponse.json({ success: true, deviceType, os, browser, ip });
  } catch (err: any) {
    console.error("[TRACK_LOGIN_ERROR]", err);
    return NextResponse.json({ error: "Failed to track login" }, { status: 500 });
  }
}
