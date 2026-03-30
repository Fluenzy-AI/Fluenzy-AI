import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getPublicUrl } from "@/lib/r2-service";
import { isR2Configured } from "@/lib/r2";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role as any) !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const params = await context.params;
    const { userId } = params;

    // Fetch user with all related data
    const user = await (prisma as any).users.findUnique({
      where: { id: userId },
      include: {
        sessions: {
          orderBy: { startTime: 'desc' },
        },
        lessonProgress: {
          orderBy: { completedAt: 'desc' },
        },
        hrProgress: {
          orderBy: { completedAt: 'desc' },
        },
        gdProgress: {
          orderBy: { completedAt: 'desc' },
        },
        resumes: {
          orderBy: { uploadedAt: 'desc' },
        },
        loginLogs: {
          orderBy: { loginTime: 'desc' },
          take: 50,
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        paymentHistories: {
          orderBy: { date: 'desc' },
          include: { receipt: { select: { invoiceNumber: true, receiptUrl: true } } },
        },
        gdHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            session: {
              select: { topic: true, topicCategory: true, channelName: true },
            },
          },
        },
        monthlyUsages: {
          orderBy: [{ billingYear: 'desc' }, { billingMonth: 'desc' }],
          take: 6,
        },
      },
    });

    // Fetch interview guides separately (no direct relation on users model)
    const interviewGuides = await (prisma as any).interviewGuide.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }).catch(() => []);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── Time / session helpers ─────────────────────────────────────────────
    const totalTimeSpent = user.sessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
    const totalSessions = user.sessions.length;

    const byModule = (mod: string) => user.sessions.filter((s: any) => s.module === mod);
    const timeOf    = (arr: any[]) => arr.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
    const avgScore  = (arr: any[]) => arr.length > 0 ? arr.reduce((sum: number, s: any) => sum + (s.aggregateScore || 0), 0) / arr.length : 0;
    const bestScore = (arr: any[]) => arr.length > 0 ? Math.max(...arr.map((s: any) => s.aggregateScore || 0)) : 0;

    const hrSessions      = byModule('HR_INTERVIEW');
    const techSessions    = byModule('TECH_INTERVIEW');
    const companySessions = user.sessions.filter((s: any) =>
      s.module === 'COMPANY_WISE_HR' || s.module === 'COMPANY_SPECIFIC'
    );
    const gdAgentSessions = user.sessions.filter((s: any) =>
      s.module === 'GD_DISCUSSION' || s.module === 'GD_PRIVATE' ||
      s.module === 'GD_RANDOM'     || s.module === 'GD_AI_AGENTS'
    );
    const gdCoachSessions = byModule('GD_COACH');
    const dailySessions   = byModule('CONVERSATION_PRACTICE');
    const engSessions     = byModule('ENGLISH_LEARNING');
    const vocabSessions   = byModule('VOCABULARY_BOOSTER');
    const voiceSessions   = byModule('CORPORATE_VOICE');
    const latestTopicSessions = byModule('LATEST_TOPICS');

    // ── English Learning ───────────────────────────────────────────────────
    const englishLessons = user.lessonProgress;
    const englishCompleted   = englishLessons.filter((l: any) => l.isCompleted).length;
    const englishPctComplete = englishLessons.length > 0 ? (englishCompleted / englishLessons.length) * 100 : 0;

    // ── HR Coach progress ──────────────────────────────────────────────────
    const hrProgress = user.hrProgress;
    const hrCompleted    = hrProgress.filter((l: any) => l.isCompleted).length;
    const hrPctComplete  = hrProgress.length > 0 ? (hrCompleted / hrProgress.length) * 100 : 0;

    // ── GD Coach progress ──────────────────────────────────────────────────
    const gdProgress = user.gdProgress;
    const gdCoachCompleted   = gdProgress.filter((l: any) => l.isCompleted).length;
    const gdCoachPctComplete = gdProgress.length > 0 ? (gdCoachCompleted / gdProgress.length) * 100 : 0;

    // ── Module time breakdown ──────────────────────────────────────────────
    const moduleTimeBreakdown: Record<string, number> = {
      english:     timeOf(engSessions),
      hr:          timeOf(hrSessions),
      technical:   timeOf(techSessions),
      company:     timeOf(companySessions),
      gd:          timeOf(gdAgentSessions),
      gdCoach:     timeOf(gdCoachSessions),
      daily:       timeOf(dailySessions),
      vocabulary:  timeOf(vocabSessions),
      voice:       timeOf(voiceSessions),
      latestTopics: timeOf(latestTopicSessions),
    };

    // ── Resume ─────────────────────────────────────────────────────────────
    const latestResume = user.resumes[0];

    // ── Unique companies ───────────────────────────────────────────────────
    const allCompaniesSet = new Set<string>();
    [...hrSessions, ...companySessions].forEach((s: any) => {
      if (s.targetCompany) allCompaniesSet.add(s.targetCompany);
    });

    // ── Module open count from usage counters ─────────────────────────────
    const moduleUsageCounts = {
      english:       user.englishUsage       || 0,
      daily:         user.dailyUsage         || 0,
      hr:            user.hrUsage            || 0,
      technical:     user.technicalUsage     || 0,
      company:       user.companyUsage       || 0,
      gd:            user.gdUsage            || 0,
      gdCoach:       user.gdCoachUsage       || 0,
      interviewGuide: user.interviewGuideUsage || 0,
    };

    const response = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        role: user.role,
        disabled: user.disabled,
        createdAt: user.createdAt,
        renewalDate: user.renewalDate,
        billingCycle: user.billingCycle,
        lastActive: user.loginLogs[0]?.loginTime || null,
        totalTimeSpent,
        totalSessions,
        moduleUsageCounts,
        uniqueCompanies: Array.from(allCompaniesSet),
      },
      resume: latestResume ? {
        fileName: latestResume.fileName,
        fileUrl: latestResume.fileUrl && !latestResume.fileUrl.startsWith('http') && !latestResume.fileUrl.startsWith('/') && isR2Configured() 
          ? (getPublicUrl(latestResume.fileUrl) || latestResume.fileUrl) 
          : latestResume.fileUrl,
        uploadedAt: latestResume.uploadedAt,
      } : null,

      // ── Login history ──────────────────────────────────────────────────
      loginHistory: user.loginLogs.map((log: any) => ({
        id: log.id,
        loginTime: log.loginTime,
        logoutTime: log.logoutTime,
        sessionDuration: log.sessionDuration,
        ip: log.ip,
        location: log.location,
        deviceType: log.deviceType,
        os: log.os,
        browser: log.browser,
        status: log.status,
      })),

      // ── Interview Guides ───────────────────────────────────────────────
      interviewGuides: (interviewGuides as any[]).map((g: any) => ({
        id: g.id,
        targetRole: g.targetRole,
        targetCompany: g.targetCompany,
        experienceLevel: g.experienceLevel,
        communicationLevel: g.communicationLevel,
        jobDescription: g.jobDescription,
        pdfUrl: g.pdfUrl && !g.pdfUrl.startsWith('http') && !g.pdfUrl.startsWith('/') && isR2Configured()
          ? (getPublicUrl(g.pdfUrl) || g.pdfUrl)
          : g.pdfUrl,
        createdAt: g.createdAt,
      })),

      // ── English Learning ───────────────────────────────────────────────
      englishLearning: {
        sessions: engSessions.length,
        totalTimeSpent: moduleTimeBreakdown.english,
        totalLessons: englishLessons.length,
        completedLessons: englishCompleted,
        completionPercentage: englishPctComplete,
        lessons: englishLessons.map((l: any) => ({
          lessonId: l.lessonId,
          isCompleted: l.isCompleted,
          completedAt: l.completedAt,
          score: l.score,
        })),
        sessionList: engSessions.map((s: any) => ({
          id: s.id, startTime: s.startTime, duration: s.duration, status: s.status,
        })),
      },

      // ── HR Interview ───────────────────────────────────────────────────
      hrInterview: {
        totalSessions: hrSessions.length,
        totalTimeSpent: timeOf(hrSessions),
        averageScore: avgScore(hrSessions),
        bestScore: bestScore(hrSessions),
        completedSteps: hrCompleted,
        totalSteps: hrProgress.length,
        completionPercentage: hrPctComplete,
        sessions: hrSessions.map((s: any) => ({
          id: s.id,
          targetCompany: s.targetCompany,
          role: s.role,
          startTime: s.startTime,
          duration: s.duration,
          aggregateScore: s.aggregateScore,
          status: s.status,
        })),
        hrProgress: hrProgress.map((l: any) => ({
          lessonId: l.lessonId,
          isCompleted: l.isCompleted,
          completedAt: l.completedAt,
          score: l.score,
        })),
      },

      // ── Technical Mastery──────────────────────────────────────────────
      technicalMastery: {
        totalSessions: techSessions.length,
        totalTimeSpent: timeOf(techSessions),
        averageScore: avgScore(techSessions),
        bestScore: bestScore(techSessions),
        sessions: techSessions.map((s: any) => ({
          id: s.id,
          startTime: s.startTime,
          duration: s.duration,
          aggregateScore: s.aggregateScore,
          status: s.status,
          role: s.role,
        })),
      },

      // ── Company Tracks ─────────────────────────────────────────────────
      companyTracks: {
        totalSessions: companySessions.length,
        totalTimeSpent: timeOf(companySessions),
        averageScore: avgScore(companySessions),
        uniqueCompanies: Array.from(new Set(companySessions.map((s: any) => s.targetCompany).filter(Boolean))),
        sessions: companySessions.map((s: any) => ({
          id: s.id,
          targetCompany: s.targetCompany,
          role: s.role,
          startTime: s.startTime,
          duration: s.duration,
          aggregateScore: s.aggregateScore,
          status: s.status,
        })),
      },

      // ── GD Agent ──────────────────────────────────────────────────────
      gdAgent: {
        totalSessions: gdAgentSessions.length,
        totalTimeSpent: timeOf(gdAgentSessions),
        averageScore: avgScore(gdAgentSessions),
        sessions: gdAgentSessions.map((s: any) => ({
          id: s.id,
          startTime: s.startTime,
          duration: s.duration,
          aggregateScore: s.aggregateScore,
          status: s.status,
        })),
        gdHistory: user.gdHistory.map((h: any) => ({
          id: h.id,
          topic: h.topic,
          topicCategory: h.topicCategory,
          role: h.role,
          duration: h.duration,
          overallScore: h.overallScore,
          communicationScore: h.communicationScore,
          confidenceScore: h.confidenceScore,
          grammarScore: h.grammarScore,
          leadershipScore: h.leadershipScore,
          strengths: h.strengths,
          improvements: h.improvements,
          createdAt: h.createdAt,
        })),
      },

      // ── GD Coach ──────────────────────────────────────────────────────
      gdCoach: {
        totalSessions: gdCoachSessions.length,
        totalTimeSpent: timeOf(gdCoachSessions),
        completedSteps: gdCoachCompleted,
        totalSteps: gdProgress.length,
        completionPercentage: gdCoachPctComplete,
        sessions: gdCoachSessions.map((s: any) => ({
          id: s.id, startTime: s.startTime, duration: s.duration, aggregateScore: s.aggregateScore, status: s.status,
        })),
        progress: gdProgress.map((l: any) => ({
          lessonId: l.lessonId, isCompleted: l.isCompleted, completedAt: l.completedAt, score: l.score,
        })),
      },

      // ── Daily Conversation ────────────────────────────────────────────
      dailyConversation: {
        totalSessions: dailySessions.length,
        totalTimeSpent: timeOf(dailySessions),
        averageScore: avgScore(dailySessions),
        sessions: dailySessions.map((s: any) => ({
          id: s.id, startTime: s.startTime, duration: s.duration, aggregateScore: s.aggregateScore, status: s.status,
        })),
      },

      // ── Vocabulary Booster ────────────────────────────────────────────
      vocabularyBooster: {
        totalSessions: vocabSessions.length,
        totalTimeSpent: timeOf(vocabSessions),
        sessions: vocabSessions.map((s: any) => ({
          id: s.id, startTime: s.startTime, duration: s.duration, status: s.status,
        })),
      },

      // ── Voice Practice ────────────────────────────────────────────────
      voicePractice: {
        totalSessions: voiceSessions.length,
        totalTimeSpent: timeOf(voiceSessions),
        sessions: voiceSessions.map((s: any) => ({
          id: s.id, startTime: s.startTime, duration: s.duration, status: s.status,
        })),
      },

      // ── Latest Topics ─────────────────────────────────────────────────
      latestTopics: {
        totalSessions: latestTopicSessions.length,
        sessions: latestTopicSessions.map((s: any) => ({
          id: s.id, startTime: s.startTime, duration: s.duration, status: s.status,
        })),
      },

      // ── Time analytics ────────────────────────────────────────────────
      timeAnalytics: {
        moduleBreakdown: moduleTimeBreakdown,
        totalTimeSpent,
      },

      // ── Subscription & Payments ───────────────────────────────────────
      subscription: user.subscriptions[0] ? {
        plan: user.subscriptions[0].plan,
        status: user.subscriptions[0].status,
        currentPeriodEnd: user.subscriptions[0].currentPeriodEnd,
        autoRenew: user.subscriptions[0].autoRenew,
      } : null,
      payments: user.paymentHistories.map((p: any) => ({
        id: p.id,
        // Fall back to user's current plan/cycle for old records that were saved without these fields
        plan: p.plan || user.plan || null,
        billingCycle: p.billingCycle || user.billingCycle || null,
        originalAmount: p.originalAmount,
        discountAmount: p.discountAmount,
        finalAmount: p.finalAmount,
        paymentMethod: p.paymentMethod,
        couponUsed: p.couponUsed,
        status: p.status,
        date: p.date,
        invoiceNumber: p.receipt?.invoiceNumber || null,
        receiptUrl: p.receipt?.receiptUrl || null,
      })),

      // ── Monthly usage last 6 months ──────────────────────────────────
      monthlyUsage: user.monthlyUsages.map((m: any) => ({
        month: m.billingMonth,
        year: m.billingYear,
        cycleStart: m.billingCycleStart,
        cycleEnd: m.billingCycleEnd,
        english: m.englishUsage,
        daily: m.dailyUsage,
        hr: m.hrUsage,
        technical: m.technicalUsage,
        company: m.companyUsage,
        gd: m.gdUsage,
        gdCoach: m.gdCoachUsage,
        interviewGuide: m.interviewGuideUsage,
        total: m.totalUsage,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching user activity:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}