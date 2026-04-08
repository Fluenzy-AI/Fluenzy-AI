// POST /api/chat/groups/[id]/promote - Promote member to admin or demote
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { promoteToAdmin, demoteToMember } from "@/modules/chat/services/group.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { userId, action } = body; // action: 'promote' | 'demote'

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (action === 'demote') {
      await demoteToMember(session.user.id, id, userId);
    } else {
      await promoteToAdmin(session.user.id, id, userId);
    }

    return NextResponse.json({
      success: true,
      message: action === 'demote' ? "Member demoted" : "Member promoted to admin"
    });
  } catch (error: any) {
    console.error("[POST /api/chat/groups/[id]/promote]", error);
    
    const status = error.message.includes("owner") ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to update member role" },
      { status }
    );
  }
}
