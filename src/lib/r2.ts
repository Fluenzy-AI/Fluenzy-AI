/**
 * Cloudflare R2 Configuration
 * R2 is S3-compatible, so we use the AWS SDK v3
 */

import { S3Client } from "@aws-sdk/client-s3";

// Validate required environment variables
const requiredEnvVars = [
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`[R2] Missing environment variable: ${envVar}`);
  }
}

// Create S3 client configured for R2
export const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME || "";

// Check if R2 is properly configured
export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}
