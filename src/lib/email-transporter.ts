/**
 * Centralized Email Transporter with Debug Logging
 * 
 * Fixes common issues:
 * - App Password spaces
 * - Missing credentials
 * - Production debugging
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

interface EmailConfig {
  user: string | undefined;
  pass: string | undefined;
  label: string;
}

/**
 * Create Gmail transporter with debug logging
 */
export function createEmailTransporter(config: EmailConfig): Transporter {
  const { user, pass, label } = config;
  
  // Clean App Password (remove spaces if any)
  const cleanPass = pass?.replace(/\s+/g, "");
  
  // Log config status (hide full credentials)
  console.log(`[EMAIL-${label}] Creating transporter...`);
  console.log(`[EMAIL-${label}] User: ${user?.slice(0, 5)}...@gmail.com`);
  console.log(`[EMAIL-${label}] Pass length: ${cleanPass?.length || 0} chars`);
  
  if (!user || !cleanPass) {
    console.error(`[EMAIL-${label}] MISSING CREDENTIALS!`, {
      hasUser: !!user,
      hasPass: !!cleanPass,
    });
    throw new Error(`Missing email credentials for ${label}`);
  }
  
  if (cleanPass.length !== 16) {
    console.warn(`[EMAIL-${label}] WARNING: App Password should be 16 chars, got ${cleanPass.length}`);
  }
  
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // TLS
    auth: { user, pass: cleanPass },
    // Enable debug in production
    logger: process.env.NODE_ENV === "production",
    debug: process.env.NODE_ENV === "production",
  });
}

/**
 * Send email with error handling
 */
export async function sendEmail(
  transporter: Transporter,
  options: {
    from: string;
    to: string;
    subject: string;
    html?: string;
    text?: string;
    attachments?: any[];
  },
  label: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[EMAIL-${label}] Sending to: ${options.to}`);
    console.log(`[EMAIL-${label}] Subject: ${options.subject}`);
    
    const info = await transporter.sendMail(options);
    
    console.log(`[EMAIL-${label}] ✅ SUCCESS!`);
    console.log(`[EMAIL-${label}] MessageId: ${info.messageId}`);
    console.log(`[EMAIL-${label}] Response: ${info.response}`);
    
    return { success: true };
  } catch (error: any) {
    console.error(`[EMAIL-${label}] ❌ FAILED!`);
    console.error(`[EMAIL-${label}] Error:`, error?.message);
    console.error(`[EMAIL-${label}] Code:`, error?.code);
    console.error(`[EMAIL-${label}] Command:`, error?.command);
    console.error(`[EMAIL-${label}] Response:`, error?.response);
    
    return {
      success: false,
      error: error?.message || "Failed to send email",
    };
  }
}
