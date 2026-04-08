// POST /api/chat/groups/[id]/leave - Leave a group
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { leaveGroup } from "@/modules/chat/services/group.service";

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
    await leaveGroup(session.user.id, id);

    return NextResponse.json({
      success: true,
      message: "Left the group"
    });
  } catch (error: any) {
    console.error("[POST /api/chat/groups/[id]/leave]", error);
    
    const status = error.message.includes("not found") ? 404 
      : error.message.includes("member") ? 403
      : error.message.includes("Transfer") ? 400
      : 500;

    return NextResponse.json(
      { error: error.message || "Failed to leave group" },
      { status }
    );
  }
}
