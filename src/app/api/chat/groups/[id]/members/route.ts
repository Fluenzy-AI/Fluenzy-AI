// POST /api/chat/groups/[id]/members - Add members to group
// DELETE /api/chat/groups/[id]/members - Remove member from group
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addGroupMembers, removeGroupMember } from "@/modules/chat/services/group.service";

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
    const { memberIds } = body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { error: "Member IDs array is required" },
        { status: 400 }
      );
    }

    const group = await addGroupMembers(session.user.id, id, { memberIds });

    return NextResponse.json({
      success: true,
      message: "Members added",
      group
    });
  } catch (error: any) {
    console.error("[POST /api/chat/groups/[id]/members]", error);
    
    const status = error.message.includes("not found") ? 404 
      : error.message.includes("admin") ? 403
      : error.message.includes("member") ? 403
      : 500;

    return NextResponse.json(
      { error: error.message || "Failed to add members" },
      { status }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await removeGroupMember(session.user.id, id, userId);

    return NextResponse.json({
      success: true,
      message: "Member removed"
    });
  } catch (error: any) {
    console.error("[DELETE /api/chat/groups/[id]/members]", error);
    
    const status = error.message.includes("not found") ? 404 
      : error.message.includes("owner") ? 403
      : error.message.includes("admin") ? 403
      : error.message.includes("member") ? 403
      : 500;

    return NextResponse.json(
      { error: error.message || "Failed to remove member" },
      { status }
    );
  }
}
