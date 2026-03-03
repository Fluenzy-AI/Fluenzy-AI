import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCollegeAdminFromRequest } from "@/lib/collegeAuth";

// ─── GET /api/college/students/[id] ─────────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getCollegeAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const student = await prisma.collegeStudent.findFirst({
    where: { id, collegeAdminId: admin.id },
    include: { batch: true },
  });
  if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  let activity: Record<string, unknown> | null = null;

  // Resolve the linked users record — first try the stored userId, then fall
  // back to email (covers students who signed up on the platform directly
  // without using the college invite link, so their userId was never saved).
  let resolvedUserId: string | null = student.userId ?? null;
  if (!resolvedUserId) {
    const userByEmail = await (prisma as any).users.findUnique({
      where: { email: student.email },
      select: { id: true },
    });
    if (userByEmail) {
      resolvedUserId = userByEmail.id;
      // Back-fill the userId so future requests don't need the email lookup
      await prisma.collegeStudent.update({
        where: { id },
        data: {
          userId: resolvedUserId,
          ...(student.onboardedAt ? {} : { onboardedAt: new Date() }),
        },
      });
    }
  }

  if (resolvedUserId) {
    const user = await (prisma as any).users.findUnique({
      where: { id: resolvedUserId },
      include: {
        sessions: { orderBy: { startTime: "desc" } },
        lessonProgress: { orderBy: { completedAt: "desc" } },
        hrProgress:     { orderBy: { completedAt: "desc" } },
        gdProgress:     { orderBy: { completedAt: "desc" } },
        loginLogs:      { orderBy: { loginTime: "desc" }, take: 50 },
        gdHistory:      { orderBy: { createdAt: "desc" } },
        paymentHistories: {
          orderBy: { date: "desc" },
          include: { receipt: { select: { invoiceNumber: true, receiptUrl: true } } },
        },
      },
    });

    const interviewGuides = await (prisma as any).interviewGuide
      .findMany({ where: { userId: resolvedUserId }, orderBy: { createdAt: "desc" } })
      .catch(() => []);

    if (user) {
      const timeOf   = (arr: any[]) => arr.reduce((s: number, x: any) => s + (x.duration || 0), 0);
      const avgScore = (arr: any[]) => arr.length ? arr.reduce((s: number, x: any) => s + (x.aggregateScore || 0), 0) / arr.length : 0;

      const byModule = (mod: string) => user.sessions.filter((s: any) => s.module === mod);
      const hrSessions      = byModule("HR_INTERVIEW");
      const techSessions    = byModule("TECH_INTERVIEW");
      const companySessions = user.sessions.filter((s: any) => s.module === "COMPANY_WISE_HR" || s.module === "COMPANY_SPECIFIC");
      const gdAgentSessions = user.sessions.filter((s: any) => ["GD_DISCUSSION","GD_PRIVATE","GD_RANDOM","GD_AI_AGENTS"].includes(s.module));
      const gdCoachSessions = byModule("GD_COACH");
      const dailySessions   = byModule("CONVERSATION_PRACTICE");
      const engSessions     = byModule("ENGLISH_LEARNING");
      const vocabSessions   = byModule("VOCABULARY_BOOSTER");
      const voiceSessions   = byModule("CORPORATE_VOICE");
      const latestTopicSessions = byModule("LATEST_TOPICS");

      const englishLessons = user.lessonProgress;
      const hrProgress     = user.hrProgress;
      const gdProgress     = user.gdProgress;

      const englishCompleted   = englishLessons.filter((l: any) => l.isCompleted).length;
      const hrCompleted        = hrProgress.filter((l: any) => l.isCompleted).length;
      const gdCoachCompleted   = gdProgress.filter((l: any) => l.isCompleted).length;

      const totalTimeSpent = user.sessions.reduce((s: number, x: any) => s + (x.duration || 0), 0);
      const totalSessions  = user.sessions.length;
      const allScores      = user.sessions.map((s: any) => s.aggregateScore).filter(Boolean) as number[];
      const avgAll         = allScores.length ? allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length : 0;

      const moduleUsageCounts = {
        hr:       user.hrUsage       || 0,
        gdCoach:  user.gdCoachUsage  || 0,
        gd:       user.gdUsage       || 0,
        technical: user.technicalUsage || 0,
        company:  user.companyUsage  || 0,
        daily:    user.dailyUsage    || 0,
        english:  user.englishUsage  || 0,
      };

      activity = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          disabled: user.disabled,
          createdAt: user.createdAt,
          renewalDate: user.renewalDate,
          lastActive: user.loginLogs[0]?.loginTime || null,
          totalTimeSpent,
          totalSessions,
          avgScore: avgAll,
          moduleUsageCounts,
        },
        loginHistory: user.loginLogs.map((l: any) => ({
          id: l.id, loginTime: l.loginTime, logoutTime: l.logoutTime,
          sessionDuration: l.sessionDuration, ip: l.ip, location: l.location,
          deviceType: l.deviceType, os: l.os, browser: l.browser, status: l.status,
        })),
        interviewGuides: (interviewGuides as any[]).map((g: any) => ({
          id: g.id, targetRole: g.targetRole, targetCompany: g.targetCompany,
          experienceLevel: g.experienceLevel, communicationLevel: g.communicationLevel,
          jobDescription: g.jobDescription, pdfUrl: g.pdfUrl, createdAt: g.createdAt,
        })),
        englishLearning: {
          sessions: engSessions.length, totalTimeSpent: timeOf(engSessions),
          completionPercentage: englishLessons.length ? (englishCompleted / englishLessons.length) * 100 : 0,
          lessons: englishLessons.map((l: any) => ({ lessonId: l.lessonId, isCompleted: l.isCompleted, completedAt: l.completedAt, score: l.score })),
          sessionList: engSessions.map((s: any) => ({ id: s.id, startTime: s.startTime, duration: s.duration, status: s.status })),
        },
        hrInterview: {
          totalSessions: hrSessions.length, totalTimeSpent: timeOf(hrSessions),
          averageScore: avgScore(hrSessions),
          completionPercentage: hrProgress.length ? (hrCompleted / hrProgress.length) * 100 : 0,
          sessions: hrSessions.map((s: any) => ({ id: s.id, targetCompany: s.targetCompany, role: s.role, startTime: s.startTime, duration: s.duration, aggregateScore: s.aggregateScore, status: s.status })),
          hrProgress: hrProgress.map((l: any) => ({ lessonId: l.lessonId, isCompleted: l.isCompleted, completedAt: l.completedAt, score: l.score })),
        },
        technicalMastery: {
          totalSessions: techSessions.length, totalTimeSpent: timeOf(techSessions), averageScore: avgScore(techSessions),
          sessions: techSessions.map((s: any) => ({ id: s.id, startTime: s.startTime, duration: s.duration, aggregateScore: s.aggregateScore, status: s.status, role: s.role })),
        },
        companyTracks: {
          totalSessions: companySessions.length, totalTimeSpent: timeOf(companySessions), averageScore: avgScore(companySessions),
          sessions: companySessions.map((s: any) => ({ id: s.id, targetCompany: s.targetCompany, role: s.role, startTime: s.startTime, duration: s.duration, aggregateScore: s.aggregateScore, status: s.status })),
        },
        gdAgent: {
          totalSessions: gdAgentSessions.length, totalTimeSpent: timeOf(gdAgentSessions), averageScore: avgScore(gdAgentSessions),
          sessions: gdAgentSessions.map((s: any) => ({ id: s.id, startTime: s.startTime, duration: s.duration, aggregateScore: s.aggregateScore, status: s.status })),
          gdHistory: user.gdHistory.map((h: any) => ({ id: h.id, topic: h.topic, topicCategory: h.topicCategory, role: h.role, duration: h.duration, overallScore: h.overallScore, communicationScore: h.communicationScore, confidenceScore: h.confidenceScore, grammarScore: h.grammarScore, leadershipScore: h.leadershipScore, strengths: h.strengths, improvements: h.improvements, createdAt: h.createdAt })),
        },
        gdCoach: {
          totalSessions: gdCoachSessions.length, totalTimeSpent: timeOf(gdCoachSessions),
          completionPercentage: gdProgress.length ? (gdCoachCompleted / gdProgress.length) * 100 : 0,
          sessions: gdCoachSessions.map((s: any) => ({ id: s.id, startTime: s.startTime, duration: s.duration, aggregateScore: s.aggregateScore, status: s.status })),
          progress: gdProgress.map((l: any) => ({ lessonId: l.lessonId, isCompleted: l.isCompleted, completedAt: l.completedAt, score: l.score })),
        },
        dailyConversation: {
          totalSessions: dailySessions.length, totalTimeSpent: timeOf(dailySessions), averageScore: avgScore(dailySessions),
          sessions: dailySessions.map((s: any) => ({ id: s.id, startTime: s.startTime, duration: s.duration, aggregateScore: s.aggregateScore, status: s.status })),
        },
        vocabularyBooster: {
          totalSessions: vocabSessions.length, totalTimeSpent: timeOf(vocabSessions),
          sessions: vocabSessions.map((s: any) => ({ id: s.id, startTime: s.startTime, duration: s.duration, status: s.status })),
        },
        voicePractice: {
          totalSessions: voiceSessions.length, totalTimeSpent: timeOf(voiceSessions),
          sessions: voiceSessions.map((s: any) => ({ id: s.id, startTime: s.startTime, duration: s.duration, status: s.status })),
        },
        latestTopics: {
          totalSessions: latestTopicSessions.length,
          sessions: latestTopicSessions.map((s: any) => ({ id: s.id, startTime: s.startTime, duration: s.duration, status: s.status })),
        },
        payments: user.paymentHistories.map((p: any) => ({
          id: p.id,
          plan: p.plan || user.plan || null,
          billingCycle: p.billingCycle || user.billingCycle || null,
          originalAmount: p.originalAmount,
          discountAmount: p.discountAmount, finalAmount: p.finalAmount, paymentMethod: p.paymentMethod,
          couponUsed: p.couponUsed, status: p.status, date: p.date,
          invoiceNumber: p.receipt?.invoiceNumber || null, receiptUrl: p.receipt?.receiptUrl || null,
        })),
      };
    }
  }

  return NextResponse.json({ student, activity });
}

// ─── PATCH /api/college/students/[id] ───────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getCollegeAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const existing = await prisma.collegeStudent.findFirst({
    where: { id, collegeAdminId: admin.id },
  });
  if (!existing) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  const body = await req.json();
  const { studentName, department, year, batchId, rollNumber, status, adminNotes, tags, warningFlags } = body;

  const updated = await prisma.collegeStudent.update({
    where: { id },
    data: {
      ...(studentName !== undefined && { studentName: studentName.trim() }),
      ...(department !== undefined && { department }),
      ...(year !== undefined && { year: Number(year) }),
      ...(batchId !== undefined && { batchId }),
      ...(rollNumber !== undefined && { rollNumber }),
      ...(status !== undefined && { status }),
      ...(adminNotes !== undefined && { adminNotes }),
      ...(tags !== undefined && { tags }),
      ...(warningFlags !== undefined && { warningFlags }),
    },
  });

  return NextResponse.json({ success: true, student: updated });
}

// ─── DELETE /api/college/students/[id] ──────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getCollegeAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const existing = await prisma.collegeStudent.findFirst({
    where: { id, collegeAdminId: admin.id },
  });
  if (!existing) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  await prisma.collegeStudent.delete({ where: { id } });
  await prisma.collegeAdmin.update({
    where: { id: admin.id },
    data: { usedSeats: { decrement: 1 } },
  });

  return NextResponse.json({ success: true });
}
