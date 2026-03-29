import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY not configured - AI evaluation will be limited");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI?.getGenerativeModel({ model: "gemini-1.5-flash" });

interface GDTranscriptEntry {
  participantId: string;
  participantName: string;
  text: string;
  timestamp: string | Date;
}

interface GDEvaluationRequest {
  transcript: GDTranscriptEntry[];
  topic: string;
  userId: string;
  participantName: string;
}

interface ParticipantScore {
  userId: string;
  name: string;
  talkTimePercent: number;
  scores: {
    contentQuality: number;
    communication: number;
    leadership: number;
    teamwork: number;
    confidence: number;
    overall: number;
  };
  strengths: string[];
  improvements: string[];
  keyPoints: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body: GDEvaluationRequest = await req.json();
    const { transcript, topic, userId, participantName } = body;

    if (!transcript || transcript.length === 0) {
      return NextResponse.json({
        scores: {
          contentQuality: 0,
          communication: 0,
          leadership: 0,
          teamwork: 0,
          confidence: 0,
          overall: 0,
        },
        feedback: "No transcript available for evaluation.",
        highlights: [],
        improvements: ["Participate more actively in discussions"],
      });
    }

    // Calculate talk time for each participant
    const participantStats = new Map<string, { count: number; charCount: number }>();
    transcript.forEach((entry) => {
      const stats = participantStats.get(entry.participantId) || { count: 0, charCount: 0 };
      stats.count++;
      stats.charCount += entry.text.length;
      participantStats.set(entry.participantId, stats);
    });

    const totalMessages = transcript.length;
    const totalChars = Array.from(participantStats.values()).reduce((acc, s) => acc + s.charCount, 0);
    const userStats = participantStats.get(userId) || { count: 0, charCount: 0 };
    const talkTimePercent = totalChars > 0 ? Math.round((userStats.charCount / totalChars) * 100) : 0;

    // If no Gemini API, return basic scores
    if (!model) {
      const basicScore = calculateBasicScore(transcript, userId);
      return NextResponse.json({
        scores: {
          contentQuality: basicScore,
          communication: basicScore,
          leadership: Math.max(0, basicScore - 10),
          teamwork: basicScore,
          confidence: basicScore,
          overall: basicScore,
        },
        feedback: `You participated in ${userStats.count} out of ${totalMessages} messages (${talkTimePercent}% of discussion). Continue to engage actively and build on others' points.`,
        highlights: userStats.count > 0 ? ["Active participation in the discussion"] : [],
        improvements: userStats.count < totalMessages * 0.2 
          ? ["Increase participation frequency", "Share more original viewpoints"] 
          : ["Build more on others' ideas"],
        talkTimePercent,
      });
    }

    // Format transcript for Gemini
    const formattedTranscript = transcript
      .map((t) => `[${new Date(t.timestamp).toISOString()}] ${t.participantName}: ${t.text}`)
      .join("\n");

    const prompt = `You are an expert Group Discussion evaluator. Analyze this GD transcript and evaluate the specific participant.

TOPIC: "${topic}"

TRANSCRIPT:
${formattedTranscript}

EVALUATE PARTICIPANT: ${participantName} (ID: ${userId})

Provide a JSON response with this exact structure:
{
  "scores": {
    "contentQuality": <0-100, relevance and depth of points made>,
    "communication": <0-100, clarity and articulation>,
    "leadership": <0-100, initiating topics, summarizing, guiding discussion>,
    "teamwork": <0-100, building on others' points, acknowledging contributions>,
    "confidence": <0-100, assertiveness without aggression>,
    "overall": <0-100, weighted average>
  },
  "feedback": "<2-3 sentences of constructive feedback specific to this participant>",
  "highlights": ["<specific strength 1>", "<specific strength 2>"],
  "improvements": ["<specific improvement area 1>", "<specific improvement area 2>"],
  "keyPoints": ["<notable point made by participant 1>", "<notable point 2>"]
}

IMPORTANT: 
- Be specific and reference actual statements from the transcript
- Score fairly based on the quality, not just quantity of participation
- The overall score should reflect interview readiness
- Respond ONLY with valid JSON, no markdown or explanation`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const evaluation = JSON.parse(jsonMatch[0]);

      return NextResponse.json({
        ...evaluation,
        talkTimePercent,
        messageCount: userStats.count,
        totalMessages,
      });
    } catch (aiError) {
      console.error("Gemini evaluation failed:", aiError);
      
      // Fallback to basic evaluation
      const basicScore = calculateBasicScore(transcript, userId);
      return NextResponse.json({
        scores: {
          contentQuality: basicScore,
          communication: basicScore,
          leadership: Math.max(0, basicScore - 10),
          teamwork: basicScore,
          confidence: basicScore,
          overall: basicScore,
        },
        feedback: `You participated in ${userStats.count} out of ${totalMessages} messages. ${talkTimePercent > 30 ? "Good level of engagement!" : "Consider participating more actively."}`,
        highlights: ["Participated in the discussion"],
        improvements: ["Build on others' points more", "Add unique perspectives"],
        talkTimePercent,
      });
    }
  } catch (error) {
    console.error("[EVALUATE_GD_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to evaluate GD" },
      { status: 500 }
    );
  }
}

function calculateBasicScore(transcript: GDTranscriptEntry[], userId: string): number {
  const userMessages = transcript.filter((t) => t.participantId === userId);
  const totalMessages = transcript.length;
  
  if (totalMessages === 0) return 0;
  
  // Base score on participation ratio
  const participationRatio = userMessages.length / totalMessages;
  
  // Ideal participation is around 20-30% for a group
  const idealRatio = 0.25;
  const deviation = Math.abs(participationRatio - idealRatio);
  
  // Start at 70, adjust based on participation
  let score = 70;
  
  if (participationRatio > 0) {
    score += 15; // At least participated
  }
  
  if (deviation < 0.1) {
    score += 10; // Near ideal participation
  } else if (deviation > 0.3) {
    score -= 10; // Too much or too little
  }
  
  // Bonus for longer messages (more substance)
  const avgMessageLength = userMessages.reduce((acc, m) => acc + m.text.length, 0) / (userMessages.length || 1);
  if (avgMessageLength > 100) {
    score += 5; // Substantive contributions
  }
  
  return Math.min(100, Math.max(0, score));
}
