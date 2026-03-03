import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { validateModuleAccess } from "@/lib/billing";
import { EVAL_MODULE_MAP } from "@/lib/serverAccessCheck";

/**
 * POST /api/check-module-access
 * Pre-flight check: frontend calls this on page load to verify the user
 * still has sessions remaining for a given module.
 *
 * Body: { module: string }
 * Returns: { allowed: boolean, remaining: number | null, plan: string, upgradeUrl: string }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse body
    const body = await req.json().catch(() => ({}));
    const { module } = body as { module?: string };

    if (!module) {
      return NextResponse.json({ error: "module is required" }, { status: 400 });
    }

    // 3. Resolve billing key
    const billingKey = (EVAL_MODULE_MAP[module] ?? module) as Parameters<
      typeof validateModuleAccess
    >[1];

    // 4. Lookup user
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 5. Check access via billing
    const access = await validateModuleAccess(user.id, billingKey);

    return NextResponse.json({
      allowed: access.allowed,
      remaining: access.remaining ?? null,
      plan: access.plan,
      upgradeUrl: "/billing",
    });
  } catch (err) {
    console.error("[check-module-access] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
