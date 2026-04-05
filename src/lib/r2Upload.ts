// src/lib/r2Upload.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(
  file: Buffer,
  fileName: string,
  folder: string = "resumes"
): Promise<string> {
  const key = `${folder}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const bucketName = process.env.R2_BUCKET_NAME!;

  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file,
        ContentType: "application/pdf",
      })
    );

    // Return CDN URL
    const cdnBase = process.env.NEXT_PUBLIC_CDN_BASE || process.env.R2_ENDPOINT;
    return `${cdnBase}/${key}`;
  } catch (error) {
    console.error("[R2] Upload failed:", error);
    throw new Error("Failed to upload file to storage");
  }
}
