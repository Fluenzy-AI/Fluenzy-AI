import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const normalizeScore = (value?: number | null) => {
  if (value == null || Number.isNaN(value)) return null;
  if (value <= 1) return Math.max(0, Math.min(100, value * 100));
  if (value <= 10) return Math.max(0, Math.min(100, value * 10));
  if (value <= 100) return Math.max(0, Math.min(100, value));
  return Math.max(0, Math.min(100, value));
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const average = (values: Array<number | null | undefined>) => {
  const filtered = values.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (!filtered.length) return null;
  return filtered.reduce((sum, v) => sum + v, 0) / filtered.length;
};

const stdDev = (values: number[]) => {
  if (!values.length) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
};

const formatDateKey = (value: Date) => value.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

const getDurationMinutes = (start?: Date | null, end?: Date | null, stored?: number | null) => {
  if (typeof stored === "number" && stored > 0) return stored;
  if (!start || !end) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
};

const fillerWords = ["uh", "um", "like", "you know", "basically", "actually", "so", "kind of", "sort of", "hmm", "er", "ah"];
const stopWords = new Set([
  "the",
  "is",
  "a",
  "an",
  "and",
  "or",
  "to",
  "of",
  "in",
  "on",
  "for",
  "with",
  "that",
  "this",
  "it",
  "as",
  "at",
  "be",
  "are",
  "was",
  "were",
  "i",
  "you",
  "we",
  "they",
  "he",
  "she",
  "my",
  "your",
  "our",
  "their",
  "me",
  "us",
  "them",
]);

const countFillerWords = (text: string) => {
  const lower = text.toLowerCase();
  const counts = new Map<string, number>();
  let total = 0;
  fillerWords.forEach((word) => {
    const pattern = new RegExp(`\\b${word.replace(" ", "\\s+")}\\b`, "g");
    const matches = lower.match(pattern);
    if (matches?.length) {
      counts.set(word, (counts.get(word) || 0) + matches.length);
      total += matches.length;
    }
  });
  return { total, counts };
};

const countWords = (text: string) => {
  if (!text) return 0;
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
};

const pearsonCorrelation = (x: number[], y: number[]) => {
  if (x.length !== y.length || x.length < 2) return 0;
  const meanX = x.reduce((sum, v) => sum + v, 0) / x.length;
  const meanY = y.reduce((sum, v) => sum + v, 0) / y.length;
  let num = 0;
  let denomX = 0;
  let denomY = 0;
  for (let i = 0; i < x.length; i += 1) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  if (!denomX || !denomY) return 0;
  return num / Math.sqrt(denomX * denomY);
};

const extractGrammarIssueCounts = (feedbacks: string[]) => {
  const patterns: Array<[RegExp, string]> = [
    [/subject[-\s]?verb/i, "Subject-verb agreement"],
    [/tense/i, "Verb tense"],
    [/article/i, "Articles (a/an/the)"],
    [/preposition/i, "Prepositions"],
    [/punctuation/i, "Punctuation"],
    [/spelling/i, "Spelling"],
    [/grammar/i, "General grammar"],
  ];
  const counts = new Map<string, number>();
  feedbacks.forEach((text) => {
    patterns.forEach(([regex, label]) => {
      if (regex.test(text)) {
        counts.set(label, (counts.get(label) || 0) + 1);
      }
    });
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, count]) => ({ label, count }));
};

const extractGrammarIssues = (feedbacks: string[]) => extractGrammarIssueCounts(feedbacks).map((item) => item.label);

const generateTips = (scores: {
  communicationScore: number | null;
  confidenceScore: number | null;
  grammarScore: number | null;
  vocabularyScore: number | null;
  technicalScore: number | null;
}) => {
  const tips: string[] = [];
  if (scores.communicationScore != null && scores.communicationScore < 65) {
    tips.push("Practice concise answers with a clear opening, example, and summary.");
  }
  if (scores.confidenceScore != null && scores.confidenceScore < 65) {
    tips.push("Reduce pauses by outlining your response in 2-3 bullet points before speaking.");
  }
  if (scores.grammarScore != null && scores.grammarScore < 70) {
    tips.push("Focus on tense consistency and subject-verb agreement in daily practice.");
  }
  if (scores.vocabularyScore != null && scores.vocabularyScore < 60) {
    tips.push("Introduce 3-5 new advanced words per week and reuse them in mock answers.");
  }
  if (scores.technicalScore != null && scores.technicalScore < 65) {
    tips.push("Spend 20 minutes daily on core concepts and explain them aloud.");
  }
  if (!tips.length) {
    tips.push("Keep a steady weekly schedule and aim to improve response clarity by 5% each week.");
  }
  return tips;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const publicUsername = searchParams.get("username");
    const isPublic = searchParams.get("public") === "1";
    const range = (searchParams.get("range") || "all").toLowerCase();
    const selectedSessionId = (searchParams.get("sessionId") || "").trim();
    const behavioralSessionId = searchParams.get("behavioralSessionId");
    let userId: string | null = null;

    if (isPublic && publicUsername) {
      const profile = await (prisma as any).userProfile.findFirst({
        where: { username: publicUsername.toLowerCase() },
        select: { userId: true, publicProfileEnabled: true, publicSections: true },
      });
      const publicSections = (profile?.publicSections as any) || {};
      if (!profile?.publicProfileEnabled || !publicSections.analyticsReport) {
        return NextResponse.json({ error: "Report not public" }, { status: 403 });
      }
      userId = profile.userId;
    } else {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const user = await prisma.users.findUnique({ where: { email: session.user.email } });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const allSessionsForOptions = await prisma.session.findMany({
      where: { userId },
      select: {
        sessionId: true,
        module: true,
        startTime: true,
      },
      orderBy: { startTime: "desc" },
      take: 200,
    });

    const sessionWhere: any = { userId };
    const now = new Date();
    if (selectedSessionId) {
      sessionWhere.sessionId = selectedSessionId;
    } else if (range === "7d") {
      const from = new Date(now);
      from.setDate(now.getDate() - 7);
      sessionWhere.startTime = { gte: from };
    } else if (range === "30d") {
      const from = new Date(now);
      from.setDate(now.getDate() - 30);
      sessionWhere.startTime = { gte: from };
    } else if (range === "3m") {
      const from = new Date(now);
      from.setMonth(now.getMonth() - 3);
      sessionWhere.startTime = { gte: from };
    } else if (range === "5m") {
      const from = new Date(now);
      from.setMonth(now.getMonth() - 5);
      sessionWhere.startTime = { gte: from };
    } else if (range === "1y") {
      const from = new Date(now);
      from.setFullYear(now.getFullYear() - 1);
      sessionWhere.startTime = { gte: from };
    } else if (range === "last_session") {
      const latest = allSessionsForOptions[0];
      if (latest?.sessionId) {
        sessionWhere.sessionId = latest.sessionId;
      }
    }

    const sessions = await prisma.session.findMany({
      where: sessionWhere,
      select: {
        id: true,
        sessionId: true,
        module: true,
        targetCompany: true,
        role: true,
        startTime: true,
        endTime: true,
        duration: true,
        aggregateScore: true,
        status: true,
      },
      orderBy: { startTime: "desc" },
    });

    const sessionIds = sessions.map((s) => s.id);

    const transcripts = sessionIds.length
      ? await prisma.transcript.findMany({
          where: { sessionId: { in: sessionIds } },
          select: {
            sessionId: true,
            turnNumber: true,
            clarityScore: true,
            confidenceScore: true,
            grammarScore: true,
            relevanceScore: true,
            technicalAccuracyScore: true,
            perQuestionScore: true,
            createdAt: true,
            aiFeedback: true,
            userAnswer: true,
          },
          orderBy: { createdAt: "asc" },
        })
      : [];

    const totalDurationMinutes = sessions.reduce(
      (sum, s) => sum + getDurationMinutes(s.startTime, s.endTime, s.duration),
      0
    );

    const totalQuestions = transcripts.length;
    const totalSessions = sessions.length;
    const avgTimePerQuestion = totalQuestions > 0 ? Number((totalDurationMinutes / totalQuestions).toFixed(2)) : 0;

    const communicationScore = normalizeScore(
      average(
        transcripts.map((t) =>
          average([normalizeScore(t.clarityScore), normalizeScore(t.grammarScore), normalizeScore(t.confidenceScore)])
        )
      )
    );

    const confidenceScore = normalizeScore(average(transcripts.map((t) => normalizeScore(t.confidenceScore))));
    const grammarScore = normalizeScore(average(transcripts.map((t) => normalizeScore(t.grammarScore))));

    const vocabularyScore = (() => {
      const words = transcripts
        .map((t) => t.userAnswer || "")
        .join(" ")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
      if (!words.length) return null;
      const uniqueCount = new Set(words).size;
      const ratio = uniqueCount / words.length;
      return Math.min(100, Math.max(0, ratio * 160));
    })();

    const technicalScore = normalizeScore(
      average(transcripts.map((t) => normalizeScore(t.technicalAccuracyScore))) ??
        average(sessions.map((s) => normalizeScore(s.aggregateScore)))
    );

    const overallScore = normalizeScore(
      average([
        communicationScore ?? 0,
        confidenceScore ?? 0,
        grammarScore ?? 0,
        vocabularyScore ?? 0,
        technicalScore ?? 0,
        normalizeScore(average(sessions.map((s) => normalizeScore(s.aggregateScore)))) ?? 0,
      ])
    );

    const overallStatus = overallScore != null && overallScore >= 80 ? "Excellent" : overallScore != null && overallScore >= 60 ? "Good" : "Needs Improvement";

    const companyCounts = new Map<string, number>();
    const roleCounts = new Map<string, number>();
    const moduleCounts = new Map<string, number>();

    sessions.forEach((sessionItem) => {
      if (sessionItem.targetCompany) {
        companyCounts.set(sessionItem.targetCompany, (companyCounts.get(sessionItem.targetCompany) || 0) + 1);
      }
      if (sessionItem.role) {
        roleCounts.set(sessionItem.role, (roleCounts.get(sessionItem.role) || 0) + 1);
      }
      moduleCounts.set(sessionItem.module, (moduleCounts.get(sessionItem.module) || 0) + 1);
    });

    const totalCompanies = companyCounts.size;

    const moduleLabels: Record<string, string> = {
      english: "Communication Practice",
      hr: "HR Interview",
      technical: "Technical Interview",
      company: "Company Track",
      gd: "Group Discussion",
      daily: "Daily Practice",
      mock: "Mock Interview",
    };

    const moduleDistribution = Array.from(moduleCounts.entries()).map(([module, count]) => ({
      name: moduleLabels[module] || module,
      count,
    }));

    const mostPracticed = [...moduleDistribution].sort((a, b) => b.count - a.count).slice(0, 3);
    const leastPracticed = [...moduleDistribution].sort((a, b) => a.count - b.count).slice(0, 3);

    const trendMap = new Map<string, { date: string; communication: number[]; confidence: number[]; grammar: number[]; technical: number[] }>();
    const activityMap = new Map<string, number>();

    transcripts.forEach((t) => {
      const key = formatDateKey(t.createdAt);
      if (!trendMap.has(key)) {
        trendMap.set(key, { date: key, communication: [], confidence: [], grammar: [], technical: [] });
      }
      const entry = trendMap.get(key)!;
      entry.communication.push(
        average([normalizeScore(t.clarityScore), normalizeScore(t.grammarScore), normalizeScore(t.confidenceScore)]) || 0
      );
      entry.confidence.push(normalizeScore(t.confidenceScore) || 0);
      entry.grammar.push(normalizeScore(t.grammarScore) || 0);
      entry.technical.push(normalizeScore(t.technicalAccuracyScore) || 0);
    });

    sessions.forEach((s) => {
      const key = formatDateKey(s.startTime);
      activityMap.set(key, (activityMap.get(key) || 0) + 1);
    });

    const trends = Array.from(trendMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        date: item.date,
        communication: Math.round((average(item.communication) || 0) * 10) / 10,
        confidence: Math.round((average(item.confidence) || 0) * 10) / 10,
        grammar: Math.round((average(item.grammar) || 0) * 10) / 10,
        technical: Math.round((average(item.technical) || 0) * 10) / 10,
      }));

    const activity = Array.from(activityMap.entries()).map(([date, count]) => ({ date, count }));
    const historySessions = sessions.map((s) => ({
      sessionId: s.sessionId,
      company: s.targetCompany || "General",
      role: s.role || "N/A",
      module: s.module,
      date: formatDateKey(s.startTime),
      durationMinutes: getDurationMinutes(s.startTime, s.endTime, s.duration),
      score: Number((normalizeScore(s.aggregateScore) || 0).toFixed(1)),
      status:
        (normalizeScore(s.aggregateScore) || 0) >= 60
          ? "Passed"
          : (normalizeScore(s.aggregateScore) || 0) > 0
          ? "Needs Practice"
          : "Incomplete",
    }));
    const historyStatusBreakdownMap = new Map<string, number>();
    historySessions.forEach((s) => {
      historyStatusBreakdownMap.set(s.status, (historyStatusBreakdownMap.get(s.status) || 0) + 1);
    });
    const historyStatusBreakdown = Array.from(historyStatusBreakdownMap.entries()).map(([status, count]) => ({ status, count }));
    const historyScoreTrend = historySessions
      .map((s) => ({ date: s.date, score: s.score, company: s.company, sessionId: s.sessionId }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const historyDurationTrend = historySessions
      .map((s) => ({ date: s.date, duration: s.durationMinutes, company: s.company, sessionId: s.sessionId }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const completionRate = totalSessions > 0 ? Number(((sessions.filter((s) => s.endTime).length / totalSessions) * 100).toFixed(1)) : 0;

    const accuracyVsSpeed = sessions
      .filter((s) => typeof s.aggregateScore === "number" && getDurationMinutes(s.startTime, s.endTime, s.duration) > 0)
      .map((s) => ({
        duration: getDurationMinutes(s.startTime, s.endTime, s.duration),
        score: normalizeScore(s.aggregateScore) || 0,
      }));

    const feedbacks = transcripts.map((t) => t.aiFeedback || "").filter(Boolean);
    const commonGrammarIssues = extractGrammarIssues(feedbacks);

    const sessionsById = new Map<string, typeof transcripts>();
    transcripts.forEach((t) => {
      if (!sessionsById.has(t.sessionId)) sessionsById.set(t.sessionId, []);
      sessionsById.get(t.sessionId)!.push(t);
    });

    let confidenceDropSessions = 0;
    sessionsById.forEach((list) => {
      if (list.length < 6) return;
      const sorted = [...list].sort((a, b) => a.turnNumber - b.turnNumber);
      const third = Math.floor(sorted.length / 3) || 1;
      const early = average(sorted.slice(0, third).map((t) => normalizeScore(t.confidenceScore) || 0)) || 0;
      const late = average(sorted.slice(-third).map((t) => normalizeScore(t.confidenceScore) || 0)) || 0;
      if (late + 8 < early) confidenceDropSessions += 1;
    });

    const confidenceDropPercent = sessionsById.size
      ? Number(((confidenceDropSessions / sessionsById.size) * 100).toFixed(1))
      : 0;

    const focusAreas = [
      { label: "Communication", score: communicationScore ?? 0 },
      { label: "Confidence", score: confidenceScore ?? 0 },
      { label: "Grammar", score: grammarScore ?? 0 },
      { label: "Vocabulary", score: vocabularyScore ?? 0 },
      { label: "Technical", score: technicalScore ?? 0 },
    ]
      .sort((a, b) => a.score - b.score)
      .slice(0, 2)
      .map((item) => item.label);

    const tips = generateTips({
      communicationScore,
      confidenceScore,
      grammarScore,
      vocabularyScore,
      technicalScore,
    });

    const combinedAnswerText = transcripts.map((t) => t.userAnswer || "").join(" ");
    const totalWords = countWords(combinedAnswerText);
    const fillerStats = countFillerWords(combinedAnswerText);
    const fillerRate = totalWords ? (fillerStats.total / totalWords) * 100 : 0;
    const speakingWpm = totalDurationMinutes ? Number((totalWords / totalDurationMinutes).toFixed(1)) : 0;
    const idealWpmRange: [number, number] = [120, 160];
    const speakingPaceScore = clamp(100 - Math.abs(speakingWpm - 140) * 1.5);

    const sentences = combinedAnswerText
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const sentenceLengths = sentences.map((s) => countWords(s));
    const goodSentences = sentenceLengths.filter((len) => len >= 8 && len <= 24).length;
    const sentenceStructureScore = sentences.length ? clamp((goodSentences / sentences.length) * 100) : 0;

    const confidenceValues = transcripts
      .map((t) => normalizeScore(t.confidenceScore))
      .filter((v): v is number => typeof v === "number");
    const toneConsistency = clamp(100 - stdDev(confidenceValues) * 1.8);
    const hesitationIndex = clamp(fillerRate * 2 + (100 - (confidenceScore ?? 0)) * 0.35);
    const keywordCounts = new Map<string, number>();
    transcripts.forEach((t) => {
      const words = (t.userAnswer || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
      words.forEach((word) => {
        if (word.length < 3 || stopWords.has(word)) return;
        keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1);
      });
    });
    const topKeywords = Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    const responseLengthBySession = sessions
      .map((s) => {
        const items = transcripts.filter((t) => t.sessionId === s.id);
        const lengths = items.map((t) => countWords(t.userAnswer || ""));
        return {
          sessionId: s.sessionId,
          date: formatDateKey(s.startTime),
          avgWords: Number((average(lengths) || 0).toFixed(1)),
          answers: items.length,
        };
      })
      .filter((s) => s.answers > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    const textByCompanyMap = new Map<string, number>();
    sessions.forEach((s) => {
      const items = transcripts.filter((t) => t.sessionId === s.id);
      const words = items.reduce((sum, t) => sum + countWords(t.userAnswer || ""), 0);
      const key = s.targetCompany || "General";
      textByCompanyMap.set(key, (textByCompanyMap.get(key) || 0) + words);
    });
    const textVolumeByCompany = Array.from(textByCompanyMap.entries())
      .map(([company, words]) => ({ company, words }))
      .sort((a, b) => b.words - a.words);

    const mostRecentSession = sessions[0];
    const recentSessionTranscripts = mostRecentSession
      ? transcripts.filter((t) => t.sessionId === mostRecentSession.id).sort((a, b) => a.turnNumber - b.turnNumber)
      : [];
    const confidenceTimeline = recentSessionTranscripts.map((t) => ({
      turn: t.turnNumber,
      confidence: normalizeScore(t.confidenceScore) || 0,
    }));

    const sessionConfidenceTrend = sessions.map((s) => {
      const sessionItems = transcripts.filter((t) => t.sessionId === s.id);
      return {
        date: formatDateKey(s.startTime),
        confidence: Math.round((average(sessionItems.map((t) => normalizeScore(t.confidenceScore))) || 0) * 10) / 10,
      };
    });

    const grammarIssueCounts = extractGrammarIssueCounts(feedbacks);
    const grammarIssueFrequency = totalQuestions ? Number(((feedbacks.length / totalQuestions) * 100).toFixed(1)) : 0;
    const grammarSeries = trends.map((t) => t.grammar);
    const grammarVelocity = grammarSeries.length > 1 ? Number(((grammarSeries[grammarSeries.length - 1] - grammarSeries[0]) / (grammarSeries.length - 1)).toFixed(2)) : 0;

    const grammarScoresOrdered = transcripts
      .map((t) => ({ score: normalizeScore(t.grammarScore), date: t.createdAt }))
      .filter((t): t is { score: number; date: Date } => t.score != null)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((t) => t.score);

    let grammarBefore = 0;
    let grammarAfter = 0;
    if (grammarScoresOrdered.length === 1) {
      grammarBefore = grammarScoresOrdered[0];
      grammarAfter = grammarScoresOrdered[0];
    } else if (grammarScoresOrdered.length > 1) {
      const sliceSize = Math.max(1, Math.floor(grammarScoresOrdered.length * 0.3));
      grammarBefore = average(grammarScoresOrdered.slice(0, sliceSize)) || 0;
      grammarAfter = average(grammarScoresOrdered.slice(-sliceSize)) || 0;
    }

    const confidenceVsDifficulty: Array<{ difficulty: number; confidence: number }> = [];
    const confidenceAccuracyPoints: Array<{ confidence: number; accuracy: number; turnLabel: string }> = [];
    const accuracyScores: number[] = [];
    const confidenceForAccuracy: number[] = [];

    transcripts.forEach((t) => {
      const baseScore = normalizeScore(t.perQuestionScore ?? t.relevanceScore);
      const confidenceValue = normalizeScore(t.confidenceScore);
      if (baseScore != null && confidenceValue != null) {
        const difficulty = clamp(100 - baseScore);
        confidenceVsDifficulty.push({ difficulty, confidence: confidenceValue });
        confidenceAccuracyPoints.push({
          confidence: Number(confidenceValue.toFixed(1)),
          accuracy: Number(baseScore.toFixed(1)),
          turnLabel: `${t.sessionId}-${t.turnNumber}`,
        });
        accuracyScores.push(baseScore);
        confidenceForAccuracy.push(confidenceValue);
      }
    });

    const difficultyDistribution = confidenceVsDifficulty.reduce(
      (acc, item) => {
        if (item.difficulty <= 33) acc.easy += 1;
        else if (item.difficulty <= 66) acc.medium += 1;
        else acc.hard += 1;
        return acc;
      },
      { easy: 0, medium: 0, hard: 0 }
    );

    const fatigueSessions = sessions.filter((s) => {
      const list = transcripts.filter((t) => t.sessionId === s.id).sort((a, b) => a.turnNumber - b.turnNumber);
      if (list.length < 6) return false;
      const third = Math.floor(list.length / 3) || 1;
      const early = list.slice(0, third);
      const late = list.slice(-third);
      const earlyConfidence = average(early.map((t) => normalizeScore(t.confidenceScore) || 0)) || 0;
      const lateConfidence = average(late.map((t) => normalizeScore(t.confidenceScore) || 0)) || 0;
      const earlyWords = average(early.map((t) => countWords(t.userAnswer || ""))) || 0;
      const lateWords = average(late.map((t) => countWords(t.userAnswer || ""))) || 0;
      return lateConfidence + 8 < earlyConfidence && lateWords > earlyWords * 1.1;
    }).length;
    const fatigueRiskPercent = sessions.length ? Number(((fatigueSessions / sessions.length) * 100).toFixed(1)) : 0;

    const confidenceAccuracyCorrelation = Number(pearsonCorrelation(confidenceForAccuracy, accuracyScores).toFixed(2));

    const moduleAccuracyMap = new Map<string, number[]>();
    const sessionMap = new Map(sessions.map((s) => [s.id, s]));
    transcripts.forEach((t) => {
      const sessionItem = sessionMap.get(t.sessionId);
      if (!sessionItem) return;
      const module = sessionItem.module;
      const score = normalizeScore(t.perQuestionScore ?? t.relevanceScore ?? sessionItem.aggregateScore);
      if (score == null) return;
      if (!moduleAccuracyMap.has(module)) moduleAccuracyMap.set(module, []);
      moduleAccuracyMap.get(module)!.push(score);
    });
    const accuracyByType = Array.from(moduleAccuracyMap.entries()).map(([type, scores]) => ({
      type,
      accuracy: Number((average(scores) || 0).toFixed(1)),
    }));

    const sessionGroupMap = new Map<string, typeof sessions>();
    sessions.forEach((s) => {
      const key = `${s.module}|${s.targetCompany || ""}|${s.role || ""}`;
      if (!sessionGroupMap.has(key)) sessionGroupMap.set(key, []);
      sessionGroupMap.get(key)!.push(s);
    });
    let successGroups = 0;
    let totalGroups = 0;
    sessionGroupMap.forEach((list) => {
      if (list.length < 2) return;
      totalGroups += 1;
      const sorted = [...list].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      const firstScore = normalizeScore(sorted[0].aggregateScore) || 0;
      const lastScore = normalizeScore(sorted[sorted.length - 1].aggregateScore) || 0;
      if (lastScore > firstScore) successGroups += 1;
    });
    const reattemptSuccessRate = totalGroups ? Number(((successGroups / totalGroups) * 100).toFixed(1)) : 0;

    const predictedConfidence = clamp(100 - fillerRate * 2 - Math.max(0, 70 - sentenceStructureScore) * 0.6);
    let eyeContactScore = 0;
    let postureScore = 0;
    let smileScore = 0;
    let stressLevel = 0;
    let engagementScore = 0;
    let bodyLanguageScore = 0;
    let behavioralTimeline: Array<{ date: string; eyeContact: number; posture: number; stress: number; engagement: number }> = [];
    let behavioralAlerts: string[] = ["No AI video analysis data yet. Complete one HR/company interview to unlock."];
    let behavioralHasData = false;
    let behavioralMessage = "Complete one interview to unlock AI Behavioral Insights.";
    let behavioralSessions: Array<{ sessionId: string; date: string; sampleCount: number; score: number }> = [];
    let compositeRadar: Array<{ metric: string; score: number }> = [];
    let replayInsights: Array<{ index: number; confidence: number; stress: number; filler: number; dropZone: number; stressSpike: number; fillerPeak: number }> = [];
    let alertFrequency: Array<{ alert: string; count: number; sessions: number; intensity: number }> = [];
    let sessionAlertIntensity: Array<{ sessionId: string; intensity: number }> = [];
    let confidenceBodyLanguageCorrelationHeatmap: Array<{ x: string; y: string; value: number }> = [];
    let stressVsAccuracy: Array<{ stress: number; accuracy: number; sessionId: string }> = [];
    let engagementStabilityIndex: Array<{ sessionId: string; value: number }> = [];
    let confidenceRecoverySpeed: Array<{ sessionId: string; value: number }> = [];
    let microExpressionStabilityTrend: Array<{ date: string; value: number }> = [];
    let sessionQualityIndex: Array<{ date: string; score: number }> = [];
    let stressPerformanceImpact: Array<{ date: string; stress: number; accuracy: number }> = [];
    let emotionalStabilityIndex = 0;

    try {
      const behavioralFilter: Record<string, unknown> = { userId };
      const effectiveBehavioralSession = behavioralSessionId?.trim() || selectedSessionId || (range === "last_session" ? allSessionsForOptions[0]?.sessionId : "");
      if (effectiveBehavioralSession) {
        behavioralFilter.sessionId = effectiveBehavioralSession;
      } else if (range === "7d" || range === "30d") {
        const days = range === "7d" ? 7 : 30;
        const from = new Date(now);
        from.setDate(now.getDate() - days);
        behavioralFilter.createdAt = { $gte: from.toISOString() };
      }
      const rawBehavioral = await (prisma as any).$runCommandRaw({
        find: "behavioral_analytics",
        filter: behavioralFilter,
        sort: { createdAt: 1 },
        limit: 500,
      });
      const behavioralDocs = rawBehavioral?.cursor?.firstBatch || [];

      const toNumber = (value: unknown) => {
        const parsed = typeof value === "number" ? value : Number(value);
        return Number.isFinite(parsed) ? parsed : null;
      };

      if (behavioralDocs.length) {
        behavioralHasData = true;
        behavioralMessage = "";
        eyeContactScore = Number((average(behavioralDocs.map((d: any) => toNumber(d?.summary?.eye_contact))) || 0).toFixed(1));
        postureScore = Number((average(behavioralDocs.map((d: any) => toNumber(d?.summary?.posture))) || 0).toFixed(1));
        smileScore = Number((average(behavioralDocs.map((d: any) => toNumber(d?.summary?.smile))) || 0).toFixed(1));
        stressLevel = Number((average(behavioralDocs.map((d: any) => toNumber(d?.summary?.stress_level))) || 0).toFixed(1));
        engagementScore = Number((average(behavioralDocs.map((d: any) => toNumber(d?.summary?.engagement))) || 0).toFixed(1));
        bodyLanguageScore = Number((average([
          eyeContactScore,
          postureScore,
          smileScore,
          100 - stressLevel,
          engagementScore,
        ]) || 0).toFixed(1));

        const sessionsByExternalId = new Map(sessions.map((s) => [s.sessionId, s]));
        behavioralSessions = behavioralDocs
          .map((doc: any) => {
            const sid = String(doc?.sessionId || "");
            const createdAt = String(doc?.createdAt || "");
            const date = createdAt ? createdAt.slice(0, 10) : "";
            const sampleCount = toNumber(doc?.sampleCount) || (Array.isArray(doc?.timeline) ? doc.timeline.length : 0);
            const summary = doc?.summary || {};
            const score = average([
              toNumber(summary?.eye_contact) || 0,
              toNumber(summary?.posture) || 0,
              toNumber(summary?.smile) || 0,
              100 - (toNumber(summary?.stress_level) || 0),
              toNumber(summary?.engagement) || 0,
            ]) || 0;
            return { sessionId: sid, date, sampleCount, score: Number(score.toFixed(1)) };
          })
          .sort((a: any, b: any) => a.date.localeCompare(b.date));

        compositeRadar = [
          { metric: "Eye Contact", score: eyeContactScore },
          { metric: "Posture", score: postureScore },
          { metric: "Smile", score: smileScore },
          { metric: "Engagement", score: engagementScore },
          { metric: "Stress Control", score: Number((100 - stressLevel).toFixed(1)) },
          {
            metric: "Face Detection",
            score: Number((average(behavioralDocs.map((d: any) => toNumber(d?.summary?.face_detected_rate))) || 0).toFixed(1)),
          },
        ];

        const timelineMap = new Map<string, { eye: number[]; posture: number[]; stress: number[]; engagement: number[] }>();
        const replayRaw: Array<{ confidence: number; stress: number; filler: number }> = [];
        const smilesByDate = new Map<string, number[]>();
        const sessionQualityRaw: Array<{ date: string; score: number }> = [];

        behavioralDocs.forEach((doc: any) => {
          const points = Array.isArray(doc?.timeline) ? doc.timeline : [];
          const sid = String(doc?.sessionId || "");
          const sessionScore = normalizeScore(sessionsByExternalId.get(sid)?.aggregateScore);
          const summary = doc?.summary || {};
          const qScore = average([
            toNumber(summary?.eye_contact) || 0,
            toNumber(summary?.posture) || 0,
            toNumber(summary?.smile) || 0,
            toNumber(summary?.engagement) || 0,
            100 - (toNumber(summary?.stress_level) || 0),
          ]) || 0;
          const sessionDate = String(doc?.createdAt || "").slice(0, 10);
          if (sessionDate) {
            sessionQualityRaw.push({ date: sessionDate, score: Number(qScore.toFixed(1)) });
          }

          let alertIntensity = 0;
          const sessionConfidences: number[] = [];
          const sessionEngagements: number[] = [];
          const sessionSmiles: number[] = [];

          points.forEach((point: any) => {
            const timestamp = String(point?.timestamp || doc?.createdAt || "");
            const date = timestamp ? timestamp.slice(0, 10) : "";
            if (!date) return;
            if (!timelineMap.has(date)) timelineMap.set(date, { eye: [], posture: [], stress: [], engagement: [] });
            const bucket = timelineMap.get(date)!;
            const eye = toNumber(point?.eye_contact);
            const posture = toNumber(point?.posture);
            const stress = toNumber(point?.stress_level);
            const engagement = toNumber(point?.engagement);
            const confidence = toNumber(point?.confidence);
            const filler = toNumber(point?.filler_word_count);
            const smile = toNumber(point?.smile);
            if (eye != null) bucket.eye.push(eye);
            if (posture != null) bucket.posture.push(posture);
            if (stress != null) bucket.stress.push(stress);
            if (engagement != null) bucket.engagement.push(engagement);
            if (confidence != null) sessionConfidences.push(confidence);
            if (engagement != null) sessionEngagements.push(engagement);
            if (smile != null) sessionSmiles.push(smile);
            if (date && smile != null) {
              if (!smilesByDate.has(date)) smilesByDate.set(date, []);
              smilesByDate.get(date)!.push(smile);
            }
            if (confidence != null && stress != null && filler != null) {
              replayRaw.push({ confidence, stress, filler });
              const dropZone = confidence < 50 ? 1 : 0;
              const spike = stress > 65 ? 1 : 0;
              const fillerPeak = filler > 4 ? 1 : 0;
              alertIntensity += dropZone + spike + fillerPeak;
            }
            if (sessionScore != null && stress != null) {
              stressVsAccuracy.push({ stress, accuracy: sessionScore, sessionId: sid });
            }
          });

          if (sessionEngagements.length) {
            const stability = clamp(100 - stdDev(sessionEngagements) * 2);
            engagementStabilityIndex.push({ sessionId: sid || "session", value: Number(stability.toFixed(1)) });
          }

          if (sessionConfidences.length > 2) {
            const minConf = Math.min(...sessionConfidences);
            const endConf = sessionConfidences[sessionConfidences.length - 1];
            confidenceRecoverySpeed.push({ sessionId: sid || "session", value: Number((endConf - minConf).toFixed(1)) });
          }

          sessionAlertIntensity.push({ sessionId: sid || "session", intensity: alertIntensity });
        });

        behavioralTimeline = Array.from(timelineMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, values]) => ({
            date,
            eyeContact: Number((average(values.eye) || 0).toFixed(1)),
            posture: Number((average(values.posture) || 0).toFixed(1)),
            stress: Number((average(values.stress) || 0).toFixed(1)),
            engagement: Number((average(values.engagement) || 0).toFixed(1)),
          }));

        replayInsights = replayRaw.map((point, index) => ({
          index: index + 1,
          confidence: Number(point.confidence.toFixed(1)),
          stress: Number(point.stress.toFixed(1)),
          filler: Number(point.filler.toFixed(1)),
          dropZone: point.confidence < 50 ? 1 : 0,
          stressSpike: point.stress > 65 ? 1 : 0,
          fillerPeak: point.filler > 4 ? 1 : 0,
        }));

        const alertCounts = new Map<string, number>();
        const alertSessions = new Map<string, Set<string>>();
        behavioralDocs.forEach((doc: any) => {
          const alerts = Array.isArray(doc?.alerts) ? doc.alerts : [];
          const sid = String(doc?.sessionId || "session");
          alerts.forEach((alert: unknown) => {
            if (typeof alert !== "string" || !alert.trim()) return;
            alertCounts.set(alert, (alertCounts.get(alert) || 0) + 1);
            if (!alertSessions.has(alert)) alertSessions.set(alert, new Set());
            alertSessions.get(alert)!.add(sid);
          });
        });
        alertFrequency = Array.from(alertCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([alert, count]) => ({
            alert,
            count,
            sessions: alertSessions.get(alert)?.size || 0,
            intensity: Number((count / Math.max(1, alertSessions.get(alert)?.size || 1)).toFixed(2)),
          }));

        behavioralAlerts = alertCounts.size
          ? Array.from(alertCounts.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([alert]) => alert)
          : ["No repeated behavioral alerts detected."];

        const corrInput: Array<{ confidence: number; eye: number; posture: number; smile: number; engagement: number; stress: number }> = [];
        behavioralDocs.forEach((doc: any) => {
          const points = Array.isArray(doc?.timeline) ? doc.timeline : [];
          points.forEach((point: any) => {
            const confidence = toNumber(point?.confidence);
            const eye = toNumber(point?.eye_contact);
            const p = toNumber(point?.posture);
            const s = toNumber(point?.smile);
            const e = toNumber(point?.engagement);
            const st = toNumber(point?.stress_level);
            if (confidence == null || eye == null || p == null || s == null || e == null || st == null) return;
            corrInput.push({ confidence, eye, posture: p, smile: s, engagement: e, stress: st });
          });
        });
        const corrPairs: Array<[string, string, number]> = [
          ["Confidence", "Eye Contact", pearsonCorrelation(corrInput.map((r) => r.confidence), corrInput.map((r) => r.eye))],
          ["Confidence", "Posture", pearsonCorrelation(corrInput.map((r) => r.confidence), corrInput.map((r) => r.posture))],
          ["Confidence", "Smile", pearsonCorrelation(corrInput.map((r) => r.confidence), corrInput.map((r) => r.smile))],
          ["Confidence", "Engagement", pearsonCorrelation(corrInput.map((r) => r.confidence), corrInput.map((r) => r.engagement))],
          ["Confidence", "Stress", pearsonCorrelation(corrInput.map((r) => r.confidence), corrInput.map((r) => r.stress))],
        ];
        confidenceBodyLanguageCorrelationHeatmap = corrPairs.map(([x, y, value]) => ({
          x,
          y,
          value: Number((value * 100).toFixed(1)),
        }));

        microExpressionStabilityTrend = Array.from(smilesByDate.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, values]) => ({
            date,
            value: Number((clamp(100 - stdDev(values) * 2)).toFixed(1)),
          }));

        const sqByDate = new Map<string, number[]>();
        sessionQualityRaw.forEach((row) => {
          if (!sqByDate.has(row.date)) sqByDate.set(row.date, []);
          sqByDate.get(row.date)!.push(row.score);
        });
        sessionQualityIndex = Array.from(sqByDate.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, values]) => ({ date, score: Number((average(values) || 0).toFixed(1)) }));

        const accuracyByDateMap = new Map<string, number[]>();
        transcripts.forEach((t) => {
          const date = formatDateKey(t.createdAt);
          const score = normalizeScore(t.perQuestionScore ?? t.relevanceScore);
          if (score == null) return;
          if (!accuracyByDateMap.has(date)) accuracyByDateMap.set(date, []);
          accuracyByDateMap.get(date)!.push(score);
        });
        stressPerformanceImpact = behavioralTimeline
          .map((row) => ({
            date: row.date,
            stress: row.stress,
            accuracy: Number((average(accuracyByDateMap.get(row.date) || []) || 0).toFixed(1)),
          }))
          .filter((row) => row.accuracy > 0);

        const engagementAvg = average(engagementStabilityIndex.map((i) => i.value)) || 0;
        const recoveryAvg = average(confidenceRecoverySpeed.map((i) => i.value)) || 0;
        const microAvg = average(microExpressionStabilityTrend.map((i) => i.value)) || 0;
        emotionalStabilityIndex = Number(clamp(average([engagementAvg, recoveryAvg + 50, microAvg]) || 0).toFixed(1));
      }
    } catch (behavioralError) {
      console.error("Behavioral analytics read error:", behavioralError);
    }

    const companyReadiness = Array.from(companyCounts.entries()).map(([name, count]) => {
      const companySessions = sessions.filter((s) => s.targetCompany === name);
      const companySessionIds = new Set(companySessions.map((s) => s.id));
      const companyTranscripts = transcripts.filter((t) => companySessionIds.has(t.sessionId));
      const companyConfidence = average(companyTranscripts.map((t) => normalizeScore(t.confidenceScore))) || 0;
      const companyGrammar = average(companyTranscripts.map((t) => normalizeScore(t.grammarScore))) || 0;
      const companyTechnical = average(companyTranscripts.map((t) => normalizeScore(t.technicalAccuracyScore))) || 0;
      const companyCommunication = average(companyTranscripts.map((t) => normalizeScore(t.clarityScore))) || 0;
      const companyWords = companyTranscripts.map((t) => t.userAnswer || "").join(" ");
      const companyVocabulary = (() => {
        const words = companyWords
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter(Boolean);
        if (!words.length) return 0;
        return clamp((new Set(words).size / words.length) * 160);
      })();
      const readinessScore = clamp(average([companyCommunication, companyConfidence, companyGrammar, companyTechnical, companyVocabulary]) || 0);
      const skillScores = [
        { label: "Communication", score: companyCommunication },
        { label: "Confidence", score: companyConfidence },
        { label: "Grammar", score: companyGrammar },
        { label: "Technical", score: companyTechnical },
        { label: "Vocabulary", score: companyVocabulary },
      ];
      const missingSkills = skillScores.sort((a, b) => a.score - b.score).slice(0, 2).map((item) => item.label);
      return { name, count, score: Number(readinessScore.toFixed(1)), missingSkills };
    });

    const compositeTrend = trends.map((t) => (t.communication + t.confidence + t.grammar + t.technical) / 4);
    const compositeVelocity = compositeTrend.length > 1 ? (compositeTrend[compositeTrend.length - 1] - compositeTrend[0]) / (compositeTrend.length - 1) : 0;
    const readinessTimelineWeeks = compositeVelocity > 0
      ? Math.max(0, Math.ceil((80 - (overallScore ?? 0)) / compositeVelocity / 7))
      : null;

    const strengths = [
      { label: "Communication", score: communicationScore ?? 0 },
      { label: "Confidence", score: confidenceScore ?? 0 },
      { label: "Grammar", score: grammarScore ?? 0 },
      { label: "Vocabulary", score: vocabularyScore ?? 0 },
      { label: "Technical", score: technicalScore ?? 0 },
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map((item) => item.label);

    const weaknesses = [
      { label: "Communication", score: communicationScore ?? 0 },
      { label: "Confidence", score: confidenceScore ?? 0 },
      { label: "Grammar", score: grammarScore ?? 0 },
      { label: "Vocabulary", score: vocabularyScore ?? 0 },
      { label: "Technical", score: technicalScore ?? 0 },
    ]
      .sort((a, b) => a.score - b.score)
      .slice(0, 2)
      .map((item) => item.label);

    const plan7Day = [
      `Day 1: Focus on ${focusAreas[0] || "Communication"} with 3 short mock answers.`,
      "Day 2: Reduce filler words by practicing structured openings and closings.",
      "Day 3: Do one timed HR session and review confidence dips.",
      `Day 4: Grammar drill on ${grammarIssueCounts[0]?.label || "tense"}.`,
      "Day 5: Technical explanation practice with 2-minute limits.",
      "Day 6: Mock session with feedback review and retake 1 question.",
      "Day 7: Full mock interview and compare confidence vs accuracy.",
    ];

    const nextSessionFocus = focusAreas.length ? `${focusAreas[0]} Booster` : "Communication Booster";
    const sessionsAsc = [...sessions].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    let cumulativeMinutes = 0;
    const practiceImprovement = sessionsAsc.map((s, idx) => {
      cumulativeMinutes += getDurationMinutes(s.startTime, s.endTime, s.duration);
      return {
        session: idx + 1,
        cumulativeMinutes,
        score: Number((normalizeScore(s.aggregateScore) || 0).toFixed(1)),
      };
    });
    const skillGapCompanyRisk = companyReadiness.map((c) => ({
      company: c.name,
      risk: Number((100 - c.score).toFixed(1)),
      weakestSkill: c.missingSkills[0] || "Communication",
    }));
    const quadrantSummary = {
      ideal: confidenceAccuracyPoints.filter((p) => p.confidence >= 60 && p.accuracy >= 60).length,
      overconfidence: confidenceAccuracyPoints.filter((p) => p.confidence >= 60 && p.accuracy < 60).length,
      selfDoubt: confidenceAccuracyPoints.filter((p) => p.confidence < 60 && p.accuracy >= 60).length,
      weakZone: confidenceAccuracyPoints.filter((p) => p.confidence < 60 && p.accuracy < 60).length,
    };

    return NextResponse.json({
      filters: {
        range,
        sessionId: selectedSessionId || null,
        availableSessions: allSessionsForOptions.map((s) => ({
          sessionId: s.sessionId,
          module: s.module,
          date: formatDateKey(s.startTime),
        })),
      },
      summary: {
        communicationScore: communicationScore ?? 0,
        confidenceScore: confidenceScore ?? 0,
        grammarScore: grammarScore ?? 0,
        vocabularyScore: vocabularyScore ?? 0,
        technicalScore: technicalScore ?? 0,
        overallScore: overallScore ?? 0,
        overallStatus,
        totalQuestions,
        totalSessions,
        totalDurationMinutes,
        avgTimePerQuestion,
        totalCompanies,
        completionRate,
      },
      distributions: {
        company: Array.from(companyCounts.entries()).map(([name, count]) => ({ name, count })),
        role: Array.from(roleCounts.entries()).map(([name, count]) => ({ name, count })),
        module: moduleDistribution,
      },
      trends,
      activity,
      insights: {
        mostPracticed,
        leastPracticed,
        commonGrammarIssues,
        confidenceDropPercent,
        focusAreas,
        tips,
      },
      charts: {
        accuracyVsSpeed,
      },
      history: {
        sessions: historySessions.slice(0, 12),
        scoreTrend: historyScoreTrend,
        durationTrend: historyDurationTrend,
        statusBreakdown: historyStatusBreakdown,
      },
      textReport: {
        topKeywords,
        responseLengthBySession,
        textVolumeByCompany,
      },
      advanced: {
        behavioral: {
          hasData: behavioralHasData,
          message: behavioralMessage,
          sessions: behavioralSessions,
          compositeRadar,
          eyeContactScore: Number(eyeContactScore.toFixed(1)),
          postureScore: Number(postureScore.toFixed(1)),
          smileScore: Number(smileScore.toFixed(1)),
          stressLevel: Number(stressLevel.toFixed(1)),
          engagementScore: Number(engagementScore.toFixed(1)),
          bodyLanguageScore,
          timeline: behavioralTimeline,
          replayInsights,
          alerts: behavioralAlerts,
          alertFrequency,
          sessionAlertIntensity,
          confidenceBodyLanguageCorrelationHeatmap,
          stressVsAccuracy,
          engagementStabilityIndex,
          confidenceRecoverySpeed,
          microExpressionStabilityTrend,
          sessionQualityIndex,
          stressPerformanceImpact,
          emotionalStabilityIndex,
        },
        communication: {
          fillerRate: Number(fillerRate.toFixed(1)),
          fillerWords: Array.from(fillerStats.counts.entries()).map(([word, count]) => ({ word, count })),
          speakingWpm,
          idealWpmRange,
          speakingPaceScore: Number(speakingPaceScore.toFixed(1)),
          sentenceStructureScore: Number(sentenceStructureScore.toFixed(1)),
          toneConsistency: Number(toneConsistency.toFixed(1)),
          hesitationIndex: Number(hesitationIndex.toFixed(1)),
          confidenceTimeline,
          sessionConfidenceTrend,
        },
        grammar: {
          categories: grammarIssueCounts,
          errorFrequency: grammarIssueFrequency,
          improvementVelocity: grammarVelocity,
          beforeAfter: {
            before: Number(grammarBefore.toFixed(1)),
            after: Number(grammarAfter.toFixed(1)),
          },
        },
        confidence: {
          confidenceVsDifficulty,
          confidenceAccuracyPoints,
          quadrantSummary,
          fatigueRiskPercent,
          confidenceVsAccuracyCorrelation: confidenceAccuracyCorrelation,
          sessionTrend: sessionConfidenceTrend,
          predictedVsActual: {
            predicted: Number(predictedConfidence.toFixed(1)),
            actual: Number((confidenceScore ?? 0).toFixed(1)),
          },
        },
        questions: {
          difficultyDistribution: [
            { label: "Easy", count: difficultyDistribution.easy },
            { label: "Medium", count: difficultyDistribution.medium },
            { label: "Hard", count: difficultyDistribution.hard },
          ],
          accuracyByType,
          reattemptSuccessRate,
        },
        company: {
          readiness: companyReadiness,
          skillGapCompanyRisk,
          recommendations: [
            `${nextSessionFocus} recommended based on your weakest area.`,
            "Revisit least practiced modules to balance your interview readiness.",
          ],
          readinessTimelineWeeks,
        },
        growth: {
          practiceImprovement,
        },
        coach: {
          readinessSummary: readinessTimelineWeeks == null
            ? "Maintain current momentum to improve readiness."
            : readinessTimelineWeeks === 0
            ? "You are interview-ready. Keep polishing your responses."
            : `Estimated interview readiness in ${readinessTimelineWeeks} weeks with consistent practice.`,
          strengths,
          weaknesses,
          plan7Day,
          nextSessionFocus,
        },
      },
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
