// GET /api/chat/groups/[id] - Get group details
// PATCH /api/chat/groups/[id] - Update group
// DELETE /api/chat/groups/[id] - Archive/delete group
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGroup, updateGroup, archiveGroup, getUserGroupRole } from "@/modules/chat/services/group.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const group = await getGroup(id);

    // Check if user is a member
    const role = await getUserGroupRole(session.user.id, id);
    if (!role) {
      return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
    }

    return NextResponse.json({ group, role });
  } catch (error: any) {
    console.error("[GET /api/chat/groups/[id]]", error);
    
    const status = error.message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to get group" },
      { status }
    );
  }
}

export async function PATCH(
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
    const { name, description, avatar } = body;

    const group = await updateGroup(session.user.id, id, {
      name,
      description,
      avatar
    });

    return NextResponse.json({
      success: true,
      message: "Group updated",
      group
    });
  } catch (error: any) {
    console.error("[PATCH /api/chat/groups/[id]]", error);
    
    const status = error.message.includes("not found") ? 404 
      : error.message.includes("admin") ? 403
      : error.message.includes("member") ? 403
      : 500;

    return NextResponse.json(
      { error: error.message || "Failed to update group" },
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
    await archiveGroup(session.user.id, id, true);

    return NextResponse.json({
      success: true,
      message: "Group archived"
    });
  } catch (error: any) {
    console.error("[DELETE /api/chat/groups/[id]]", error);
    
    const status = error.message.includes("owner") ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to archive group" },
      { status }
    );
  }
}
