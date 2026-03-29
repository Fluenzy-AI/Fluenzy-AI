import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export interface VideoMetricsInput {
  confidence: number;
  eyeContact: number;
  posture: number;
  smile: number;
  stressLevel: number;
  engagement: number;
  stressControl: number;
  focus: number;
  faceDetection: number;
  expressionAnalysis: number;
}

export interface VideoFeedbackResponse {
  confidence: string;
  eyeContact: string;
  posture: string;
  smile: string;
  engagement: string;
  stressLevel: string;
  stressControl: string;
  focus: string;
  faceDetection: string;
  expressionAnalysis: string;
  overallBehavioralScore: number;
  behavioralSummary: string;
  strengths: string[];
  improvements: string[];
}

/**
 * POST /api/ai/generate-video-feedback
 * Generate AI-powered feedback for video analysis metrics
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { metrics, jobRole, sessionDurationSeconds, averagedMetrics = true } = body;

    // Validate metrics
    if (!metrics || typeof metrics !== 'object') {
      return NextResponse.json(
        { error: "Missing or invalid metrics object" },
        { status: 400 }
      );
    }

    const requiredFields = [
      'confidence', 'eyeContact', 'posture', 'smile', 'stressLevel',
      'engagement', 'stressControl', 'focus', 'faceDetection', 'expressionAnalysis'
    ];

    for (const field of requiredFields) {
      if (typeof metrics[field] !== 'number' || metrics[field] < 0 || metrics[field] > 100) {
        return NextResponse.json(
          { error: `Invalid value for ${field}: must be a number between 0-100` },
          { status: 400 }
        );
      }
    }

    // Calculate overall behavioral score
    const overallBehavioralScore = Math.round(
      metrics.confidence * 0.20 +
      metrics.eyeContact * 0.15 +
      metrics.posture * 0.10 +
      metrics.smile * 0.05 +
      metrics.engagement * 0.15 +
      (100 - metrics.stressLevel) * 0.10 + // Invert stress
      metrics.stressControl * 0.10 +
      metrics.focus * 0.10 +
      metrics.expressionAnalysis * 0.05
    );

    // Generate AI feedback using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const durationMinutes = sessionDurationSeconds ? Math.round(sessionDurationSeconds / 60) : null;

    const prompt = `Generate professional, specific behavioral feedback for an interview candidate.

Metrics (0-100 scale)${averagedMetrics ? ' - These are session averages' : ''}:
- Confidence: ${metrics.confidence}%
- Eye Contact: ${metrics.eyeContact}%
- Posture: ${metrics.posture}%
- Smile: ${metrics.smile}%
- Engagement: ${metrics.engagement}%
- Stress Level: ${metrics.stressLevel}% (lower = better)
- Stress Control: ${metrics.stressControl}% (higher = better control)
- Focus: ${metrics.focus}%
- Face Detection: ${metrics.faceDetection}%
- Expression Analysis: ${metrics.expressionAnalysis}%

${jobRole ? `Job Role: ${jobRole}` : ''}
${durationMinutes ? `Interview Duration: ${durationMinutes} minutes` : ''}
Overall Behavioral Score: ${overallBehavioralScore}%

IMPORTANT GUIDELINES:
- For each metric, write exactly ONE specific sentence of feedback (not generic)
- Focus on what this score means for ${jobRole || 'a professional'} interview
- For Stress Level: Remember LOWER is better (<=30 excellent, <=60 moderate, >60 critical)
- For Stress Control: Higher means better ability to manage stress
- Be constructive and actionable
- Identify 2-3 key strengths and 2-3 specific areas for improvement

Return ONLY valid JSON in this exact format:
{
  "confidence": "Your sentence about confidence here...",
  "eyeContact": "Your sentence about eye contact here...",
  "posture": "Your sentence about posture here...",
  "smile": "Your sentence about facial expression warmth here...",
  "engagement": "Your sentence about engagement level here...",
  "stressLevel": "Your sentence about stress indicators here...",
  "stressControl": "Your sentence about stress management here...",
  "focus": "Your sentence about focus and attention here...",
  "faceDetection": "Your sentence about camera positioning here...",
  "expressionAnalysis": "Your sentence about overall expression here...",
  "behavioralSummary": "A 2-3 sentence overall assessment of behavioral presentation...",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": ["Improvement area 1", "Improvement area 2", "Improvement area 3"]
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to extract JSON from Gemini response:", response);
      // Return a default response if parsing fails
      return NextResponse.json({
        confidence: "Confidence levels were tracked throughout the session.",
        eyeContact: "Eye contact patterns were monitored for engagement.",
        posture: "Posture was assessed for professional presentation.",
        smile: "Facial expressions were analyzed for warmth and approachability.",
        engagement: "Engagement levels indicated attention to the interview.",
        stressLevel: "Stress indicators were monitored throughout.",
        stressControl: "Stress management was observed during responses.",
        focus: "Focus levels were tracked for sustained attention.",
        faceDetection: "Camera positioning allowed for proper analysis.",
        expressionAnalysis: "Overall expressions were analyzed.",
        overallBehavioralScore,
        behavioralSummary: "The candidate completed the video assessment. Detailed behavioral analysis was performed.",
        strengths: ["Completed the full assessment"],
        improvements: ["Consider practicing in front of a camera"],
      });
    }

    const feedback = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      ...feedback,
      overallBehavioralScore,
    });

  } catch (error: any) {
    console.error("[GENERATE_VIDEO_FEEDBACK]", error);
    return NextResponse.json(
      { error: `Failed to generate video feedback: ${error.message}` },
      { status: 500 }
    );
  }
}
