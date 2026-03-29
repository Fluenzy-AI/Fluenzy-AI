import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize R2 client
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ENDPOINT = process.env.R2_ENDPOINT;

const r2Client = R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
  ? new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

/**
 * GET /profile-certs/[filename]
 * Serves certificate PDF files from R2 or redirects to signed URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    if (!filename) {
      return NextResponse.json(
        { error: "Invalid file name" },
        { status: 400 }
      );
    }

    // Try R2 if configured
    if (r2Client && R2_BUCKET_NAME) {
      const possibleKeys = [
        `profile-certs/${filename}`,
        filename,
      ];

      for (const key of possibleKeys) {
        try {
          const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
          });

          const signedUrl = await getSignedUrl(r2Client, command, { 
            expiresIn: 3600 
          });

          return NextResponse.redirect(signedUrl);
        } catch (error) {
          // Continue to next key
        }
      }
    }

    return NextResponse.json(
      { error: "Certificate not found" },
      { status: 404 }
    );

  } catch (error) {
    console.error("Certificate serve error:", error);
    return NextResponse.json(
      { error: "Failed to serve certificate" },
      { status: 500 }
    );
  }
}