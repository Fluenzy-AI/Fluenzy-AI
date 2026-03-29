import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCompanyRoles } from "@/lib/company-auth";
import { generateGDToken, isAgoraConfigured } from "@/lib/agoraToken";
import crypto from "crypto";
import nodemailer from "nodemailer";

/**
 * POST /api/company/assessments/[id]/assign
 * Assign assessment to candidates (job applicants)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify company member authentication
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { applicationIds, sendInviteEmail = true, expiryDays = 7 } = body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json({ error: "Please select at least one candidate" }, { status: 400 });
    }

    // Get assessment with company validation
    const assessment = await prisma.assessment.findUnique({
      where: {
        id: id,
        companyId: authResult.company.id,
      },
      include: {
        company: {
          select: {
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (!assessment.isActive) {
      return NextResponse.json({ error: "Assessment is not active" }, { status: 400 });
    }

    // Get the applications
    const applications = await prisma.externalJobApplication.findMany({
      where: {
        id: { in: applicationIds },
        job: {
          companyId: authResult.company.id,
        },
      },
      include: {
        job: {
          select: {
            title: true,
          },
        },
      },
    });

    if (applications.length === 0) {
      return NextResponse.json({ error: "No valid applications found" }, { status: 400 });
    }

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Create assessment sessions for each application
    const sessions = await Promise.all(
      applications.map(async (application) => {
        // Generate unique session token
        const sessionToken = crypto.randomBytes(32).toString("hex");
        
        // Prepare Agora data for Voice/GD assessments
        let agoraChannel: string | null = null;
        let agoraToken: string | null = null;
        let agoraUid: number | null = null;
        let gdRoomId: string | null = null;

        if (assessment.type === "VOICE" || assessment.type === "GD") {
          if (isAgoraConfigured()) {
            agoraChannel = `assessment_${id}_${application.id}_${Date.now()}`;
            agoraUid = Math.floor(Math.random() * 100000) + 1;
            try {
              const tokenResult = await generateGDToken(agoraChannel, agoraUid, "publisher");
              agoraToken = tokenResult.token;
            } catch (error) {
              console.error("Failed to generate Agora token:", error);
            }
          }
          if (assessment.type === "GD") {
            gdRoomId = `gd_${id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          }
        }

        // Create or update the session
        return prisma.candidateAssessmentSession.upsert({
          where: {
            assessmentId_applicationId: {
              assessmentId: id,
              applicationId: application.id,
            },
          },
          create: {
            assessmentId: id,
            applicationId: application.id,
            candidateId: application.candidateId || application.id,
            assignedBy: authResult.member!.id,
            sessionToken,
            status: "INVITED",
            expiresAt,
            agoraChannel,
            agoraToken,
            agoraUid,
            gdRoomId,
          },
          update: {
            status: "INVITED",
            sessionToken,
            expiresAt,
            assignedBy: authResult.member!.id,
            assignedAt: new Date(),
            agoraChannel,
            agoraToken,
            agoraUid,
            gdRoomId,
            // Reset previous attempt data
            score: null,
            passed: null,
            timeTaken: null,
            answers: null,
            startedAt: null,
            completedAt: null,
          },
        });
      })
    );

    // Send invite emails if enabled
    let emailsSent = 0;
    let emailsFailed = 0;

    if (sendInviteEmail) {
      const transporter = nodemailer.createTransport({
        host: process.env.HR_EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.HR_EMAIL_PORT || "587"),
        secure: false,
        auth: {
          user: process.env.HR_EMAIL_USER,
          pass: process.env.HR_EMAIL_PASS,
        },
      });

      for (let i = 0; i < sessions.length; i++) {
        const session = sessions[i];
        const application = applications[i];
        
        try {
          const assessmentUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/candidate/assessment/${session.sessionToken}`;
          
          const typeLabel = {
            MCQ: "Multiple Choice Assessment",
            CODING: "Coding Challenge",
            AI_INTERVIEW: "AI-Powered Interview",
            VOICE: "Voice Interview",
            GD: "Group Discussion",
            CORPORATE_VOICE: "Corporate Voice Assessment",
          }[assessment.type] || "Assessment";

          await transporter.sendMail({
            from: `"${authResult.company.name}" <${process.env.HR_EMAIL_USER}>`,
            to: application.email,
            subject: `You're Invited: ${assessment.title} - ${typeLabel}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0;">Assessment Invitation</h1>
                </div>
                <div style="padding: 30px; background: #f8fafc; border-radius: 0 0 10px 10px;">
                  <p style="font-size: 16px; color: #334155;">Dear ${application.name},</p>
                  <p style="font-size: 16px; color: #334155;">
                    You have been invited to complete an assessment for the <strong>${application.job.title}</strong> position at <strong>${authResult.company.name}</strong>.
                  </p>
                  
                  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
                    <p style="margin: 0 0 10px 0;"><strong>Assessment:</strong> ${assessment.title}</p>
                    <p style="margin: 0 0 10px 0;"><strong>Type:</strong> ${typeLabel}</p>
                    <p style="margin: 0 0 10px 0;"><strong>Duration:</strong> ${assessment.duration} minutes</p>
                    <p style="margin: 0;"><strong>Expires:</strong> ${expiresAt.toLocaleDateString()}</p>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${assessmentUrl}" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                      Start Assessment
                    </a>
                  </div>
                  
                  <p style="font-size: 14px; color: #64748b;">
                    If you have any questions, please don't hesitate to reach out to us.
                  </p>
                  
                  <p style="font-size: 14px; color: #64748b;">
                    Best regards,<br>
                    <strong>${authResult.company.name}</strong> Hiring Team
                  </p>
                </div>
              </div>
            `,
          });

          // Update session to mark email as sent
          await prisma.candidateAssessmentSession.update({
            where: { id: session.id },
            data: {
              inviteEmailSent: true,
              inviteSentAt: new Date(),
            },
          });

          emailsSent++;
        } catch (error) {
          console.error(`Failed to send email to ${application.email}:`, error);
          emailsFailed++;
        }
      }
    }

    // Update application status to INTERVIEW_SCHEDULED if not already
    await prisma.externalJobApplication.updateMany({
      where: {
        id: { in: applicationIds },
        status: "PENDING",
      },
      data: {
        status: "INTERVIEW_SCHEDULED",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Assessment assigned to ${sessions.length} candidate(s)`,
      assigned: sessions.length,
      emailsSent,
      emailsFailed,
      sessions: sessions.map((s) => ({
        id: s.id,
        applicationId: s.applicationId,
        status: s.status,
        sessionToken: s.sessionToken,
        expiresAt: s.expiresAt,
      })),
    });
  } catch (error) {
    console.error("[COMPANY_ASSESSMENT_ASSIGN]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/company/assessments/[id]/assign
 * Get all candidates assigned to this assessment
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify company member authentication
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER", "HIRING_MANAGER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify assessment belongs to company
    const assessment = await prisma.assessment.findUnique({
      where: {
        id: id,
        companyId: authResult.company.id,
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Get all sessions for this assessment
    const sessions = await prisma.candidateAssessmentSession.findMany({
      where: {
        assessmentId: id,
      },
      include: {
        application: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            job: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      sessions: sessions.map((s) => ({
        id: s.id,
        applicationId: s.applicationId,
        candidateName: s.application.name,
        candidateEmail: s.application.email,
        candidatePhone: s.application.phone,
        jobTitle: s.application.job.title,
        status: s.status,
        score: s.score,
        passed: s.passed,
        assignedAt: s.assignedAt,
        expiresAt: s.expiresAt,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        inviteEmailSent: s.inviteEmailSent,
      })),
    });
  } catch (error) {
    console.error("[COMPANY_ASSESSMENT_ASSIGN_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
