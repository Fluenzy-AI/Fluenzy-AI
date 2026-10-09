import { NextRequest, NextResponse } from "next/server";
import { requireCompanyRoles } from "@/lib/company-auth";
import { sendPortalEmail } from "@/lib/portal-email";
import { z } from "zod";

const CompanySendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1),
  body: z.string().min(1),
  templateId: z.string().optional(),
});

/**
 * POST /api/company/email/send
 * Send candidate email from company portal
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER", "HIRING_MANAGER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CompanySendEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const { to, subject, body: emailBody, templateId } = parsed.data;

    // Convert body text to HTML structure
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="border-bottom: 2px solid #7C6EF6; padding-bottom: 10px; margin-bottom: 20px;">
          <h2 style="color: #1A1B23; margin: 0;">${authResult.company.name}</h2>
          <p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">Recruitment Communication</p>
        </div>
        <div style="white-space: pre-wrap; font-size: 14px;">${emailBody}</div>
        <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 15px; font-size: 12px; color: #888;">
          <p>Sent by ${authResult.member.name} (${authResult.member.role}) via Fluenzy AI Enterprise Company Portal.</p>
        </div>
      </div>
    `;

    const result = await sendPortalEmail({
      to,
      subject: `[${authResult.company.name}] ${subject}`,
      html: htmlBody,
      text: emailBody,
      senderRole: "HR",
      senderEmail: authResult.member.email,
      staffId: authResult.member.id,
      templateId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("[COMPANY_EMAIL_SEND]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
