import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const clientId = process.env.ADOBE_PDF_SERVICES_CLIENT_ID;
  const clientSecret = process.env.ADOBE_PDF_SERVICES_CLIENT_SECRET;
  
  return NextResponse.json({
    adobeConfigured: !!(clientId && clientSecret),
    clientIdExists: !!clientId,
    clientIdPreview: clientId ? clientId.substring(0, 8) + "..." : null,
    clientSecretExists: !!clientSecret,
  });
}
