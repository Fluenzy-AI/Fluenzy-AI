/**
 * Careers - Apply for a Job
 * POST /api/careers/apply
 *
 * Rate limited: 3 submissions per IP per hour (tracked in memory for simplicity)
 * Sends confirmation email to candidate + notification to HR
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import nodemailer from "nodemailer";

// ── Simple in-memory rate limiter ──────────────────────────────────────────
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ── Validation Schema ──────────────────────────────────────────────────────
const ApplySchema = z.object({
  jobId: z.string().min(1),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  resumeUrl: z.string().url(),
  resumeName: z.string().optional(),
  portfolio: z.string().url().optional().or(z.literal("")),
  coverLetter: z.string().max(3000).optional(),
  experience: z.string().min(1),
  linkedin: z.string().url().optional().or(z.literal("")),
});

// ── Email Sender ───────────────────────────────────────────────────────────
async function sendEmails(
  job: { title: string; department: string },
  applicant: { name: string; email: string; resumeUrl: string; experience: string }
) {
  const user = process.env.HR_EMAIL_USER;
  const pass = process.env.HR_EMAIL_PASS;
  const hrEmail = process.env.HR_NOTIFICATION_EMAIL || user;

  if (!user || !pass) return;

  const transporter = nodemailer.createTransport({
    host: process.env.HR_EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.HR_EMAIL_PORT || 587),
    secure: false,
    auth: { user, pass },
  });

  // Candidate confirmation
  await transporter.sendMail({
    from: `"Fluenzy AI Careers" <${user}>`,
    to: applicant.email,
    subject: `Application Received – ${job.title} | Fluenzy AI`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d1117;color:#e6edf3;padding:40px 32px;border-radius:16px">
        <div style="margin-bottom:24px">
          <span style="background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:24px;font-weight:700">Fluenzy AI</span>
        </div>
        <h2 style="color:#e6edf3;font-size:20px;margin-bottom:8px">Hi ${applicant.name},</h2>
        <p style="color:#8b949e;line-height:1.6">Thank you for applying for the <strong style="color:#6366f1">${job.title}</strong> position at Fluenzy AI. We've received your application and our team will review it shortly.</p>
        <div style="background:#161b22;border:1px solid #30363d;border-radius:12px;padding:20px;margin:24px 0">
          <p style="margin:0 0 8px;color:#8b949e;font-size:13px">APPLIED FOR</p>
          <p style="margin:0;color:#e6edf3;font-weight:600;font-size:16px">${job.title}</p>
          <p style="margin:4px 0 0;color:#6366f1;font-size:13px">${job.department}</p>
        </div>
        <p style="color:#8b949e;line-height:1.6">We typically respond within 5–7 business days. If you have any questions, feel free to reply to this email.</p>
        <p style="color:#8b949e;margin-top:24px">Best regards,<br><strong style="color:#e6edf3">The Fluenzy AI Team</strong></p>
      </div>
    `,
  });

  // HR notification
  await transporter.sendMail({
    from: `"Fluenzy AI Careers Bot" <${user}>`,
    to: hrEmail!,
    subject: `New Application: ${job.title} – ${applicant.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h2>New Job Application</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;color:#666;width:140px">Position</td><td style="padding:8px;font-weight:600">${job.title}</td></tr>
          <tr><td style="padding:8px;color:#666">Applicant</td><td style="padding:8px">${applicant.name}</td></tr>
          <tr><td style="padding:8px;color:#666">Email</td><td style="padding:8px">${applicant.email}</td></tr>
          <tr><td style="padding:8px;color:#666">Experience</td><td style="padding:8px">${applicant.experience}</td></tr>
          <tr><td style="padding:8px;color:#666">Resume</td><td style="padding:8px"><a href="${applicant.resumeUrl}">Download Resume</a></td></tr>
        </table>
        <p style="margin-top:24px"><a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/hr/job-applications" style="background:#6366f1;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">View in HR Portal</a></p>
      </div>
    `,
  });
}

// ── Handler ────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many applications. Please try again later." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = ApplySchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;

  // Check job exists and is active
  const job = await prisma.job.findUnique({ where: { id: d.jobId } });
  if (!job || !job.isActive)
    return NextResponse.json({ error: "This position is no longer available." }, { status: 404 });

  // Prevent duplicate from same email for same job
  const duplicate = await prisma.jobApplication.findFirst({
    where: { jobId: d.jobId, email: d.email.toLowerCase() },
  });
  if (duplicate)
    return NextResponse.json({ error: "You have already applied for this position." }, { status: 409 });

  const application = await prisma.jobApplication.create({
    data: {
      jobId: d.jobId,
      name: d.name.trim(),
      email: d.email.toLowerCase(),
      phone: d.phone,
      resumeUrl: d.resumeUrl,
      resumeName: d.resumeName,
      portfolio: d.portfolio || null,
      coverLetter: d.coverLetter || null,
      experience: d.experience,
      linkedin: d.linkedin || null,
    },
  });

  // Send emails non-blocking
  sendEmails(job, { name: d.name, email: d.email, resumeUrl: d.resumeUrl, experience: d.experience }).catch(
    (err) => console.warn("[CAREERS_EMAIL_WARN]", err)
  );

  return NextResponse.json({ success: true, applicationId: application.id }, { status: 201 });
}
