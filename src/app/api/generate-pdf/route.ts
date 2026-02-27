import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateInterviewScore } from "@/lib/utils";

const BEHAVIORAL_COLLECTION = "behavioral_analytics";

type BehavioralDoc = {
  userId?: string;
  sessionId?: string;
  startedAt?: string;
  endedAt?: string;
  summary?: Record<string, unknown>;
  alerts?: string[];
  alertSnapshots?: Array<{
    timestamp?: string;
    issueCode?: string;
    issueDetected?: string;
    observation?: string;
    suggestion?: string;
    imageData?: string;
  }>;
  createdAt?: string;
};

type MetricRow = {
  name: string;
  value: number;
  status: "Excellent" | "Good" | "Needs Improvement" | "Critical";
  explanation: string;
};

const clampPercent = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, parsed));
};

const formatPercent = (value: number) => `${Math.round(clampPercent(value))}%`;

const getStatusLabel = (value: number, invert = false): MetricRow["status"] => {
  const normalized = invert ? 100 - clampPercent(value) : clampPercent(value);
  if (normalized >= 85) return "Excellent";
  if (normalized >= 70) return "Good";
  if (normalized >= 50) return "Needs Improvement";
  return "Critical";
};

const explanationForMetric = (name: string, value: number, status: MetricRow["status"]) => {
  const rounded = Math.round(clampPercent(value));
  switch (name) {
    case "Confidence":
      return status === "Excellent"
        ? "Delivery remained stable and assured throughout the interview."
        : `Confidence signals fluctuated and averaged ${rounded}%, indicating room for stronger delivery control.`;
    case "Eye Contact":
      return status === "Excellent"
        ? "Camera engagement stayed consistent and interviewer-facing."
        : "Frequent gaze shifts reduced perceived confidence in multiple moments.";
    case "Posture":
      return status === "Excellent"
        ? "Body alignment remained professional and interview-ready."
        : "Posture drift suggests improving upright alignment and shoulder stability.";
    case "Smile":
      return status === "Excellent"
        ? "Facial tone looked approachable and naturally engaged."
        : "Expression appeared neutral or tense in key response windows.";
    case "Engagement":
      return status === "Excellent"
        ? "Visual engagement stayed strong with active interviewer presence."
        : "Engagement signals dropped intermittently during responses.";
    case "Stress Level":
      return status === "Excellent"
        ? "Stress indicators remained low and controlled."
        : "Elevated stress markers appeared in challenging response phases.";
    case "Stress Control":
      return status === "Excellent"
        ? "Composure remained steady under pressure."
        : "Composure dipped in parts of the interview; regulation techniques are recommended.";
    case "Focus":
      return status === "Excellent"
        ? "Attention stability remained consistent across the session."
        : "Attention continuity can improve with tighter camera and response discipline.";
    case "Face Detection Status":
      return status === "Excellent"
        ? "Face detection remained consistently available for analysis."
        : "Face tracking interruptions reduced continuity of behavioral scoring.";
    case "Expression Analysis":
      return status === "Excellent"
        ? "Facial expression stayed positive and interview-appropriate."
        : "Expression signals indicate opportunities for more natural, positive affect.";
    default:
      return `${name} scored ${rounded}% (${status}).`;
  }
};

const normalizeIssueLabel = (code?: string) => {
  const key = String(code || "").toUpperCase();
  if (key === "LOW_EYE_CONTACT") return "Low Eye Contact";
  if (key === "POOR_POSTURE") return "Poor Posture";
  if (key === "HIGH_STRESS") return "High Stress";
  if (key === "NO_FACE") return "Face Not Detected";
  if (key === "NEGATIVE_EXPRESSION") return "Negative Expression";
  if (key === "LOW_ENGAGEMENT") return "Low Engagement";
  return key.replace(/_/g, " ").trim() || "Behavioral Alert";
};

const buildRecommendationList = (metrics: MetricRow[]) => {
  const needsWork = new Set(
    metrics.filter((m) => m.status === "Needs Improvement" || m.status === "Critical").map((m) => m.name)
  );
  const recommendations: string[] = [];

  if (needsWork.has("Posture")) {
    recommendations.push("Improve posture by sitting upright with shoulders aligned and head centered.");
  }
  if (needsWork.has("Stress Level") || needsWork.has("Stress Control")) {
    recommendations.push("Reduce stress with controlled breathing before and between answers.");
  }
  if (needsWork.has("Eye Contact")) {
    recommendations.push("Maintain consistent eye contact by focusing on the camera lens while speaking.");
  }
  if (needsWork.has("Engagement") || needsWork.has("Focus")) {
    recommendations.push("Avoid long pauses and filler transitions; keep responses concise and structured.");
  }
  if (needsWork.has("Expression Analysis") || needsWork.has("Smile")) {
    recommendations.push("Show natural facial engagement to appear confident and approachable.");
  }
  if (needsWork.has("Face Detection Status")) {
    recommendations.push("Stabilize camera framing and lighting to keep your face consistently detectable.");
  }
  if (!recommendations.length) {
    recommendations.push("Maintain current behavioral consistency and continue mock sessions for reinforcement.");
  }

  return recommendations;
};

const findBestBehavioralDoc = async (userId: string, sessionStart: Date, sessionEnd: Date) => {
  try {
    const raw = await (prisma as any).$runCommandRaw({
      find: BEHAVIORAL_COLLECTION,
      filter: { userId },
      sort: { createdAt: -1 },
      limit: 40,
    });

    const docs: BehavioralDoc[] = raw?.cursor?.firstBatch || [];
    if (!docs.length) return null;

    const scored = docs
      .map((doc) => {
        const started = doc.startedAt ? new Date(doc.startedAt) : null;
        const ended = doc.endedAt ? new Date(doc.endedAt) : null;
        if (!started || Number.isNaN(started.getTime())) return null;
        const safeEnd = ended && !Number.isNaN(ended.getTime()) ? ended : started;

        const overlapMs = Math.max(
          0,
          Math.min(sessionEnd.getTime(), safeEnd.getTime()) - Math.max(sessionStart.getTime(), started.getTime())
        );
        const midpoint = (started.getTime() + safeEnd.getTime()) / 2;
        const sessionMidpoint = (sessionStart.getTime() + sessionEnd.getTime()) / 2;
        const distanceMs = Math.abs(midpoint - sessionMidpoint);

        return { doc, overlapMs, distanceMs };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        if (b.overlapMs !== a.overlapMs) return b.overlapMs - a.overlapMs;
        return a.distanceMs - b.distanceMs;
      });

    const best = scored[0];
    if (!best) return null;
    const maxDistanceMs = 4 * 60 * 60 * 1000;
    if (best.overlapMs === 0 && best.distanceMs > maxDistanceMs) return null;

    return best.doc as BehavioralDoc;
  } catch (error) {
    console.error("Behavioral analytics fetch error:", error);
    return null;
  }
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await request.json();

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sessionData = await (prisma as any).session.findFirst({
      where: {
        sessionId,
        userId: user.id,
      },
      include: {
        transcripts: {
          orderBy: { turnNumber: "asc" },
        },
      },
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    let { subScores } = calculateInterviewScore(sessionData.transcripts);
    const score = Math.round((sessionData.aggregateScore || 0) * 100);
    const status = sessionData.status || "Incomplete";

    if (
      score > 0 &&
      subScores.technical === 0 &&
      subScores.communication === 0 &&
      subScores.grammar === 0 &&
      subScores.confidence === 0
    ) {
      const targetTotal = Math.round((score / 100) * 40);
      subScores.technical = Math.min(Math.round(targetTotal * 0.35), 9);
      subScores.communication = Math.min(Math.round(targetTotal * 0.25), 8);
      subScores.confidence = Math.min(Math.round(targetTotal * 0.25), 7);
      subScores.grammar = Math.max(
        targetTotal - subScores.technical - subScores.communication - subScores.confidence,
        2
      );
    }

    const sessionStart = new Date(sessionData.startTime);
    const sessionEnd =
      sessionData.endTime && !Number.isNaN(new Date(sessionData.endTime).getTime())
        ? new Date(sessionData.endTime)
        : new Date(sessionStart.getTime() + 60 * 60 * 1000);
    const behavioralDoc = await findBestBehavioralDoc(user.id, sessionStart, sessionEnd);
    const summary = (behavioralDoc?.summary || {}) as Record<string, unknown>;
    const snapshots =
      Array.isArray(behavioralDoc?.alertSnapshots) && behavioralDoc?.alertSnapshots.length
        ? behavioralDoc.alertSnapshots.slice(0, 4)
        : [];

    const confidence = clampPercent(summary.confidence);
    const eyeContact = clampPercent(summary.eye_contact);
    const posture = clampPercent(summary.posture);
    const smile = clampPercent(summary.smile);
    const engagement = clampPercent(summary.engagement);
    const stressLevel = clampPercent(summary.stress_level);
    const stressControl = clampPercent(100 - stressLevel);
    const headStability = clampPercent(summary.head_stability);
    const focus = clampPercent((engagement + eyeContact + headStability) / 3);
    const faceDetectionStatus = clampPercent(summary.face_detected_rate);
    const expressionAnalysis = clampPercent((smile + (100 - stressLevel)) / 2);

    const behavioralMetrics: MetricRow[] = [
      { name: "Confidence", value: confidence, status: getStatusLabel(confidence), explanation: "" },
      { name: "Eye Contact", value: eyeContact, status: getStatusLabel(eyeContact), explanation: "" },
      { name: "Posture", value: posture, status: getStatusLabel(posture), explanation: "" },
      { name: "Smile", value: smile, status: getStatusLabel(smile), explanation: "" },
      { name: "Engagement", value: engagement, status: getStatusLabel(engagement), explanation: "" },
      { name: "Stress Level", value: stressLevel, status: getStatusLabel(stressLevel, true), explanation: "" },
      { name: "Stress Control", value: stressControl, status: getStatusLabel(stressControl), explanation: "" },
      { name: "Focus", value: focus, status: getStatusLabel(focus), explanation: "" },
      {
        name: "Face Detection Status",
        value: faceDetectionStatus,
        status: getStatusLabel(faceDetectionStatus),
        explanation: "",
      },
      {
        name: "Expression Analysis",
        value: expressionAnalysis,
        status: getStatusLabel(expressionAnalysis),
        explanation: "",
      },
    ].map((metric) => ({
      ...metric,
      explanation: explanationForMetric(metric.name, metric.value, metric.status),
    }));

    const averageBehavioral =
      behavioralMetrics.reduce((sum, metric) => sum + clampPercent(metric.value), 0) / behavioralMetrics.length;
    const averageBehavioralStatus = getStatusLabel(averageBehavioral);
    const recommendations = buildRecommendationList(behavioralMetrics);

    const hasBehavioralData = behavioralDoc && Object.keys(summary).length > 0;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>FluenzyAI Performance Report - ${sessionData.sessionId}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Inter', sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 10pt; line-height: 1.6; }
            .header { border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 22pt; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase; }
            .meta { font-size: 8pt; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; }
            .section { margin-bottom: 40px; page-break-inside: avoid; }
            .section-title { font-size: 14pt; font-weight: 900; background: #f8fafc; padding: 10px 15px; border-left: 6px solid #0f172a; margin-bottom: 20px; text-transform: uppercase; }
            .subsection-title { font-size: 10.5pt; font-weight: 800; margin: 18px 0 10px 0; text-transform: uppercase; color: #1e293b; }
            .turn { margin-bottom: 20px; padding: 15px; border-radius: 8px; border: 1px solid #f1f5f9; }
            .label { font-size: 7pt; font-weight: 900; text-transform: uppercase; margin-bottom: 5px; display: block; }
            .label.ai { color: #2563eb; }
            .label.user { color: #64748b; }
            .bubble { padding: 10px; border-radius: 6px; }
            .bubble.ai { background: #eff6ff; color: #1e40af; border: 1px solid #dbeafe; font-weight: 600; }
            .bubble.user { background: #f8fafc; color: #334155; }
            .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 7pt; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px; }
            .scores { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .score-item { text-align: center; }
            .score-value { font-size: 18pt; font-weight: 900; }
            .score-label { font-size: 8pt; font-weight: 700; text-transform: uppercase; }
            .metric-row { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; background: #ffffff; }
            .metric-header { display: flex; justify-content: space-between; gap: 10px; font-weight: 800; }
            .metric-status { font-size: 8pt; letter-spacing: 0.03em; text-transform: uppercase; color: #334155; }
            .metric-note { margin-top: 4px; color: #475569; font-size: 9pt; }
            .snapshot { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 14px; }
            .snapshot img { width: 100%; max-height: 280px; object-fit: contain; border-radius: 8px; border: 1px solid #cbd5e1; background: #0f172a; }
            .snapshot-meta { margin-top: 8px; font-size: 9pt; color: #334155; }
            .recommendations { padding-left: 18px; margin: 8px 0 0; }
            .recommendations li { margin: 6px 0; }
            .page-break { page-break-before: always; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">FluenzyAI Performance Report</div>
              <div class="meta">Session Archive: ${sessionData.sessionId}</div>
            </div>
            <div class="meta" style="text-align: right;">
              Date: ${sessionData.startTime.toLocaleDateString()}<br/>
              Score: ${score}%
            </div>
          </div>

          <div class="section">
            <div class="section-title">1. EXECUTIVE SUMMARY</div>
            <p><strong>Candidate Name:</strong> ${user.name}</p>
            <p><strong>Target Company:</strong> ${sessionData.targetCompany || "N/A"}</p>
            <p><strong>Role:</strong> ${sessionData.role || "N/A"}</p>
            <p><strong>Date:</strong> ${sessionData.startTime.toLocaleDateString()}</p>
            <p><strong>Aggregate Score:</strong> ${score}%</p>
            <p><strong>Final Status:</strong> ${status}</p>
          </div>

          <div class="section">
            <div class="section-title">2. FULL CONVERSATION ARCHIVE</div>
            ${sessionData.transcripts
              .map(
                (t: any) => `
              <div class="turn">
                <span class="label ai">AI PROMPT:</span>
                <div class="bubble ai">"${t.aiPrompt}"</div>
                <span class="label user">USER CAPTURED ANSWER (RAW):</span>
                <div class="bubble user">"${t.userAnswer}"</div>
                <span class="label ai">HOW TO ANSWER PROFESSIONALLY:</span>
                <div class="bubble ai">"${t.idealAnswer}"</div>
              </div>
            `
              )
              .join("")}
          </div>

          <div class="section">
            <div class="section-title">3. PERFORMANCE BREAKDOWN</div>
            <div class="scores">
              <div class="score-item">
                <div class="score-value">${subScores.communication}/10</div>
                <div class="score-label">Communication</div>
              </div>
              <div class="score-item">
                <div class="score-value">${subScores.confidence}/10</div>
                <div class="score-label">Confidence</div>
              </div>
              <div class="score-item">
                <div class="score-value">${subScores.grammar}/10</div>
                <div class="score-label">Grammar</div>
              </div>
              <div class="score-item">
                <div class="score-value">${subScores.technical}/10</div>
                <div class="score-label">Technical Knowledge</div>
              </div>
              <div class="score-item">
                <div class="score-value">${score}%</div>
                <div class="score-label">Overall Rating</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">4. SYSTEM VERDICT</div>
            <p>Based on the performance analysis, the candidate demonstrates good technical vocabulary and understanding of key concepts. Areas for improvement include refining sentence structure and practicing fluent delivery to enhance overall communication.</p>
          </div>

          <div class="section page-break">
            <div class="section-title">5. AI Video Analysis Report</div>
            ${
              hasBehavioralData
                ? `
                  <div class="subsection-title">Behavioral & Visual Metrics</div>
                  ${behavioralMetrics
                    .map(
                      (metric) => `
                    <div class="metric-row">
                      <div class="metric-header">
                        <span>${metric.name}: ${formatPercent(metric.value)}</span>
                        <span class="metric-status">${metric.status}</span>
                      </div>
                      <div class="metric-note">${metric.explanation}</div>
                    </div>
                  `
                    )
                    .join("")}
                  <div class="subsection-title">Behavioral Metrics Summary</div>
                  <p>Overall behavioral intelligence score: <strong>${formatPercent(
                    averageBehavioral
                  )}</strong> (${averageBehavioralStatus}).</p>
                `
                : `<p>No behavioral video analysis data was available for this session archive.</p>`
            }

            ${
              snapshots.length
                ? `
                  <div class="subsection-title">Behavioral Alert Snapshot</div>
                  ${snapshots
                    .map((snapshot) => {
                      const issue = snapshot.issueDetected || normalizeIssueLabel(snapshot.issueCode);
                      const timestamp = snapshot.timestamp
                        ? new Date(snapshot.timestamp).toLocaleString()
                        : "N/A";
                      const observation =
                        snapshot.observation || "Behavioral deviation detected during the interview.";
                      const suggestion =
                        snapshot.suggestion || "Apply posture, gaze, and composure corrections in the next response.";
                      const safeImage = (snapshot.imageData || "").startsWith("data:image/jpeg;base64,")
                        ? snapshot.imageData
                        : "";
                      return `
                        <div class="snapshot">
                          ${
                            safeImage
                              ? `<img src="${safeImage}" alt="Behavioral Alert Snapshot" />`
                              : `<div style="padding: 10px; border: 1px dashed #94a3b8; border-radius: 8px; color: #64748b;">Snapshot unavailable.</div>`
                          }
                          <div class="snapshot-meta"><strong>Issue Detected:</strong> ${issue}</div>
                          <div class="snapshot-meta"><strong>Timestamp:</strong> ${timestamp}</div>
                          <div class="snapshot-meta"><strong>AI Observation:</strong> ${observation}</div>
                          <div class="snapshot-meta"><strong>Suggested Correction:</strong> ${suggestion}</div>
                        </div>
                      `;
                    })
                    .join("")}
                `
                : ""
            }
          </div>

          <div class="section">
            <div class="section-title">6. AI Behavioral Recommendations</div>
            <ul class="recommendations">
              ${recommendations.map((item) => `<li>${item}</li>`).join("")}
            </ul>
          </div>

          <div class="footer">FluenzyAI - CONFIDENTIAL CAREER ARCHIVE | https://www.fluenzyai.app/</div>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
