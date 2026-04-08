import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { registerDeviceKeys } from "@/modules/chat/services/encryption.service";

/**
 * POST /api/chat/encryption/register
 * Register encryption keys for a user's device
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId, publicKey, identityKey, signedPreKey, preKeySignature, oneTimePreKeys } = body;

    if (!deviceId || !publicKey || !identityKey || !signedPreKey || !preKeySignature) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await registerDeviceKeys(
      session.user.id,
      deviceId,
      publicKey,
      identityKey,
      signedPreKey,
      preKeySignature,
      oneTimePreKeys || []
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Encryption Register] Error:", error);
    return NextResponse.json(
      { error: "Failed to register keys" },
      { status: 500 }
    );
  }
}
