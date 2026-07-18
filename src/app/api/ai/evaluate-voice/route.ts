import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { traceGeminiCall, extractRequestMetadata, FEATURES, TraceMetadata } from "@/lib/langsmith";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI?.getGenerativeModel({ model: "gemini-1.5-flash" });

interface VoiceEvaluationRequest {
  type: "read_aloud" | "listen_repeat" | "interview_response" | "extemporaneous" | "listen_summarize" | "conversation" | "final_evaluation";
  transcript?: string;
  originalText?: string;
  question?: string;
  jobRole?: string;
  phase?: string;
  topic?: string;
  candidateName?: string;
  durationSeconds?: number;
  candidateSummary?: string;
}

interface TranscriptEntry {
  role: "interviewer" | "candidate";
  text: string;
  score?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: VoiceEvaluationRequest & { transcript?: string | TranscriptEntry[]; userId?: string; sessionId?: string } = await req.json();
    const { type, userId, sessionId } = body;

    const traceMeta = extractRequestMetadata(req, {
      userId,
      sessionId,
      conversationId: body.topic || body.question,
    });

    // Handle different evaluation types
    switch (type) {
      case "read_aloud":
        return evaluateReadAloud(body, traceMeta);
      case "listen_repeat":
        return evaluateListenRepeat(body, traceMeta);
      case "interview_response":
        return evaluateInterviewResponse(body, traceMeta);
      case "extemporaneous":
        return evaluateExtemporaneous(body, traceMeta);
      case "listen_summarize":
        return evaluateListenSummarize(body, traceMeta);
      case "conversation":
        return evaluateConversation(body, traceMeta);
      case "final_evaluation":
        return evaluateFinalInterview(body, traceMeta);
      default:
        return NextResponse.json(
          { error: `Unknown evaluation type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[EVALUATE_VOICE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to evaluate voice" },
      { status: 500 }
    );
  }
}

async function evaluateReadAloud(body: VoiceEvaluationRequest, traceMeta?: TraceMetadata) {
  const { transcript, originalText } = body;

  if (!transcript || !originalText) {
    return NextResponse.json({
      scores: { pronunciation: 0, pace: 0, clarity: 0, completeness: 0 },
      overallScore: 0,
      feedback: "No transcript or original text provided.",
    });
  }

  if (!model) {
    // Basic evaluation without AI
    const similarity = calculateSimilarity(transcript, originalText);
    return NextResponse.json({
      scores: {
        pronunciation: similarity,
        pace: 70,
        clarity: similarity,
        completeness: similarity,
      },
      overallScore: similarity,
      passed: similarity >= 70,
      feedback: similarity >= 70 
        ? "Good reading! Your pronunciation was clear." 
        : "Practice reading aloud more to improve fluency.",
      highlights: similarity >= 70 ? ["Clear pronunciation"] : [],
      improvements: similarity < 70 ? ["Work on pronunciation accuracy", "Practice reading speed"] : [],
    });
  }

  const prompt = `Compare the original text with what was spoken. Evaluate the reading quality.

ORIGINAL TEXT: "${originalText}"

SPOKEN TRANSCRIPT: "${transcript}"

Return JSON:
{
  "scores": {
    "pronunciation": <0-100>,
    "pace": <0-100>,
    "clarity": <0-100>,
    "completeness": <0-100>
  },
  "overallScore": <0-100>,
  "passed": <true/false, passed if overallScore >= 70>,
  "feedback": "<specific feedback>",
  "highlights": ["<positive aspect>"],
  "improvements": ["<area to improve>"],
  "errors": [{"word": "<mispronounced word>", "suggestion": "<correct pronunciation>"}]
}

Respond ONLY with valid JSON.`;

  try {
    const result = await traceGeminiCall({
      feature: FEATURES.VOICE_PRACTICE,
      name: 'evaluate-read-aloud',
      model: 'gemini-1.5-flash',
      userPrompt: prompt,
      metadata: traceMeta,
      tags: ['read_aloud'],
      fn: () => model.generateContent(prompt)
    });
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("No JSON in response");
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    const similarity = calculateSimilarity(transcript, originalText);
    return NextResponse.json({
      scores: { pronunciation: similarity, pace: 70, clarity: similarity, completeness: similarity },
      overallScore: similarity,
      passed: similarity >= 70,
      feedback: "Reading evaluated.",
    });
  }
}

async function evaluateListenRepeat(body: VoiceEvaluationRequest, traceMeta?: TraceMetadata) {
  const { transcript, originalText } = body;

  if (!transcript || !originalText) {
    return NextResponse.json({
      scores: { accuracy: 0, pronunciation: 0 },
      overallScore: 0,
      feedback: "No transcript provided.",
    });
  }

  const similarity = calculateSimilarity(transcript, originalText);

  if (!model) {
    return NextResponse.json({
      scores: { accuracy: similarity, pronunciation: similarity },
      overallScore: similarity,
      passed: similarity >= 70,
      feedback: similarity >= 70 
        ? "Good repetition accuracy!" 
        : "Work on listening comprehension and repetition.",
    });
  }

  const prompt = `Evaluate how accurately the speaker repeated the original phrase.

ORIGINAL: "${originalText}"
REPEATED: "${transcript}"

Return JSON:
{
  "scores": {
    "accuracy": <0-100>,
    "pronunciation": <0-100>,
    "timing": <0-100>
  },
  "overallScore": <0-100>,
  "passed": <true/false>,
  "feedback": "<specific feedback>",
  "misheardWords": [{"original": "<word>", "repeated": "<what they said>"}]
}

Respond ONLY with valid JSON.`;

  try {
    const result = await traceGeminiCall({
      feature: FEATURES.VOICE_PRACTICE,
      name: 'evaluate-listen-repeat',
      model: 'gemini-1.5-flash',
      userPrompt: prompt,
      metadata: traceMeta,
      tags: ['listen_repeat'],
      fn: () => model.generateContent(prompt)
    });
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("No JSON in response");
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    return NextResponse.json({
      scores: { accuracy: similarity, pronunciation: similarity },
      overallScore: similarity,
      passed: similarity >= 70,
      feedback: "Repetition evaluated.",
    });
  }
}

async function evaluateInterviewResponse(body: VoiceEvaluationRequest, traceMeta?: TraceMetadata) {
  const { transcript, question, jobRole, phase } = body;

  if (!transcript) {
    return NextResponse.json({
      scores: { fluency: 0, vocabulary: 0, clarity: 0, relevance: 0, confidence: 0 },
      overallScore: 0,
      feedback: "No response provided.",
    });
  }

  // Basic evaluation without AI
  const wordCount = transcript.split(/\s+/).length;
  const baseScore = Math.min(100, Math.max(40, 50 + wordCount * 2));

  if (!model) {
    return NextResponse.json({
      scores: {
        fluency: baseScore,
        vocabulary: baseScore,
        clarity: baseScore,
        relevance: baseScore - 10,
        confidence: baseScore,
      },
      overallScore: baseScore,
      passed: baseScore >= 70,
      feedback: wordCount > 30 
        ? "Good detailed response!" 
        : "Try to elaborate more on your answers.",
    });
  }

  const prompt = `Evaluate this interview response for a ${jobRole || "professional"} position.

QUESTION: "${question || "General interview question"}"
PHASE: ${phase || "general"}

CANDIDATE RESPONSE: "${transcript}"

Evaluate and return JSON:
{
  "scores": {
    "fluency": <0-100, how smoothly they spoke>,
    "vocabulary": <0-100, professional language use>,
    "clarity": <0-100, clear and structured response>,
    "relevance": <0-100, addresses the question directly>,
    "confidence": <0-100, assertive delivery>
  },
  "overallScore": <0-100, weighted average>,
  "passed": <true/false>,
  "feedback": "<brief constructive feedback>",
  "followUpQuestion": "<optional follow-up based on their answer>"
}

Respond ONLY with valid JSON.`;

  try {
    const result = await traceGeminiCall({
      feature: FEATURES.HR_INTERVIEW,
      name: 'evaluate-interview-response',
      model: 'gemini-1.5-flash',
      userPrompt: prompt,
      metadata: traceMeta,
      tags: ['interview_response', jobRole || 'unknown', phase || 'unknown'],
      fn: () => model.generateContent(prompt)
    });
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("No JSON in response");
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    return NextResponse.json({
      scores: {
        fluency: baseScore,
        vocabulary: baseScore,
        clarity: baseScore,
        relevance: baseScore - 10,
        confidence: baseScore,
      },
      overallScore: baseScore,
      passed: baseScore >= 70,
      feedback: "Response evaluated.",
    });
  }
}

async function evaluateExtemporaneous(body: VoiceEvaluationRequest, traceMeta?: TraceMetadata) {
  const { transcript, topic, durationSeconds } = body;

  if (!transcript) {
    return NextResponse.json({
      scores: { content: 0, delivery: 0, vocabulary: 0, confidence: 0 },
      overallScore: 0,
      feedback: "No speech provided.",
    });
  }

  const wordCount = transcript.split(/\s+/).length;
  const wordsPerMinute = durationSeconds ? (wordCount / durationSeconds) * 60 : 100;
  const baseScore = Math.min(100, Math.max(40, 50 + wordCount));

  if (!model) {
    return NextResponse.json({
      scores: {
        content: baseScore,
        delivery: wordsPerMinute > 100 && wordsPerMinute < 150 ? 80 : 60,
        vocabulary: baseScore,
        confidence: baseScore,
      },
      overallScore: baseScore,
      passed: baseScore >= 70,
      feedback: `You spoke ${wordCount} words in ${durationSeconds || 60} seconds.`,
    });
  }

  const prompt = `Evaluate this extemporaneous speech on the topic: "${topic || "General topic"}"

SPEECH: "${transcript}"
DURATION: ${durationSeconds || 60} seconds
WORDS: ${wordCount}

Evaluate and return JSON:
{
  "scores": {
    "content": <0-100, relevance and depth of content>,
    "delivery": <0-100, pacing and flow>,
    "vocabulary": <0-100, language quality>,
    "confidence": <0-100, assertiveness>
  },
  "overallScore": <0-100>,
  "passed": <true/false>,
  "feedback": "<detailed feedback>",
  "highlights": ["<strength>"],
  "improvements": ["<area to improve>"]
}

Respond ONLY with valid JSON.`;

  try {
    const result = await traceGeminiCall({
      feature: FEATURES.VOICE_PRACTICE,
      name: 'evaluate-extemporaneous',
      model: 'gemini-1.5-flash',
      userPrompt: prompt,
      metadata: traceMeta,
      tags: ['extemporaneous', topic || 'unknown'],
      fn: () => model.generateContent(prompt)
    });
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("No JSON in response");
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    return NextResponse.json({
      scores: {
        content: baseScore,
        delivery: 70,
        vocabulary: baseScore,
        confidence: baseScore,
      },
      overallScore: baseScore,
      passed: baseScore >= 70,
      feedback: "Speech evaluated.",
    });
  }
}

async function evaluateListenSummarize(body: VoiceEvaluationRequest, traceMeta?: TraceMetadata) {
  const { originalText, candidateSummary } = body;

  if (!candidateSummary) {
    return NextResponse.json({
      scores: { accuracy: 0, coherence: 0, recall: 0 },
      overallScore: 0,
      feedback: "No summary provided.",
    });
  }

  const baseScore = Math.min(100, 50 + candidateSummary.split(/\s+/).length);

  if (!model) {
    return NextResponse.json({
      scores: {
        accuracy: baseScore,
        coherence: baseScore,
        recall: baseScore - 10,
      },
      overallScore: baseScore,
      passed: baseScore >= 70,
      feedback: "Summary evaluated.",
    });
  }

  const prompt = `Evaluate how well the candidate summarized the original passage.

ORIGINAL PASSAGE: "${originalText || "A passage was played"}"

CANDIDATE SUMMARY: "${candidateSummary}"

Evaluate and return JSON:
{
  "scores": {
    "accuracy": <0-100, factual accuracy>,
    "coherence": <0-100, logical structure>,
    "recall": <0-100, key points captured>
  },
  "overallScore": <0-100>,
  "passed": <true/false>,
  "feedback": "<detailed feedback>",
  "missedPoints": ["<key point they missed>"],
  "highlights": ["<what they got right>"]
}

Respond ONLY with valid JSON.`;

  try {
    const result = await traceGeminiCall({
      feature: FEATURES.VOICE_PRACTICE,
      name: 'evaluate-listen-summarize',
      model: 'gemini-1.5-flash',
      userPrompt: prompt,
      metadata: traceMeta,
      tags: ['listen_summarize'],
      fn: () => model.generateContent(prompt)
    });
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("No JSON in response");
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    return NextResponse.json({
      scores: { accuracy: baseScore, coherence: baseScore, recall: baseScore - 10 },
      overallScore: baseScore,
      passed: baseScore >= 70,
      feedback: "Summary evaluated.",
    });
  }
}

async function evaluateFinalInterview(body: VoiceEvaluationRequest & { transcript?: string | TranscriptEntry[] }, traceMeta?: TraceMetadata) {
  const { transcript, jobRole, candidateName } = body;

  if (!transcript || (Array.isArray(transcript) && transcript.length === 0)) {
    return NextResponse.json({
      scores: { overall: 0 },
      feedback: "No interview transcript available.",
      highlights: [],
      improvements: ["Complete the interview to receive feedback"],
    });
  }

  // Calculate average from individual scores if available
  const transcriptArray = Array.isArray(transcript) ? transcript : [];
  const candidateResponses = transcriptArray.filter(
    (t) => t.role === "candidate" && t.score !== undefined
  );
  
  const avgScore = candidateResponses.length > 0
    ? Math.round(candidateResponses.reduce((acc, t) => acc + (t.score || 0), 0) / candidateResponses.length)
    : 70;

  if (!model) {
    return NextResponse.json({
      scores: {
        fluency: avgScore,
        vocabulary: avgScore,
        clarity: avgScore,
        relevance: avgScore,
        confidence: avgScore,
        overall: avgScore,
      },
      feedback: `Interview completed. Overall score: ${avgScore}%.`,
      highlights: ["Completed the interview"],
      improvements: ["Practice more technical questions"],
    });
  }

  const formattedTranscript = Array.isArray(transcript)
    ? transcript.map((t) => `${t.role.toUpperCase()}: ${t.text}`).join("\n")
    : transcript;

  const prompt = `Provide a comprehensive evaluation of this voice interview for a ${jobRole || "professional"} position.

CANDIDATE: ${candidateName || "Candidate"}

INTERVIEW TRANSCRIPT:
${formattedTranscript}

Return JSON:
{
  "scores": {
    "fluency": <0-100>,
    "vocabulary": <0-100>,
    "clarity": <0-100>,
    "relevance": <0-100>,
    "confidence": <0-100>,
    "technical": <0-100, if applicable>,
    "overall": <0-100>
  },
  "feedback": "<comprehensive paragraph of feedback>",
  "highlights": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "recommendation": "<hire/consider/reject and brief reason>"
}

Respond ONLY with valid JSON.`;

  try {
    const result = await traceGeminiCall({
      feature: FEATURES.HR_INTERVIEW,
      name: 'evaluate-final-interview',
      model: 'gemini-1.5-flash',
      userPrompt: prompt,
      metadata: traceMeta,
      tags: ['final_evaluation', jobRole || 'unknown'],
      fn: () => model.generateContent(prompt)
    });
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("No JSON in response");
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    return NextResponse.json({
      scores: {
        fluency: avgScore,
        vocabulary: avgScore,
        clarity: avgScore,
        relevance: avgScore,
        confidence: avgScore,
        overall: avgScore,
      },
      feedback: `Interview completed with an average score of ${avgScore}%.`,
      highlights: ["Interview completed"],
      improvements: ["Continue practicing interview skills"],
    });
  }
}

function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const matches = words1.filter((word) => words2.includes(word)).length;
  const maxLength = Math.max(words1.length, words2.length);
  
  return maxLength > 0 ? Math.round((matches / maxLength) * 100) : 0;
}

async function evaluateConversation(body: VoiceEvaluationRequest, traceMeta?: TraceMetadata) {
  const { transcript, topic } = body;

  if (!transcript) {
    return NextResponse.json({
      scores: { communication: 0, professionalism: 0, confidence: 0, clarity: 0 },
      overallScore: 0,
      feedback: "No conversation transcript provided.",
    });
  }

  const wordCount = transcript.split(/\s+/).length;
  const baseScore = Math.min(100, Math.max(40, 50 + wordCount * 0.5));

  if (!model) {
    return NextResponse.json({
      scores: {
        communication: baseScore,
        professionalism: baseScore,
        confidence: baseScore,
        clarity: baseScore,
      },
      overallScore: baseScore,
      passed: baseScore >= 70,
      feedback: "Conversation evaluated.",
    });
  }

  const prompt = `Evaluate this corporate conversation between an AI and a candidate on the topic: "${topic || "Professional communication"}"

CONVERSATION TRANSCRIPT:
${transcript}

Evaluate the candidate's performance and return JSON:
{
  "scores": {
    "communication": <0-100, ability to convey ideas clearly>,
    "professionalism": <0-100, business-appropriate language and tone>,
    "confidence": <0-100, assertive but not aggressive>,
    "clarity": <0-100, structured and coherent responses>,
    "adaptability": <0-100, responds appropriately to conversation flow>
  },
  "overallScore": <0-100>,
  "passed": <true/false>,
  "feedback": "<detailed constructive feedback on conversation skills>",
  "highlights": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area to improve 1>", "<area to improve 2>"]
}

Respond ONLY with valid JSON.`;

  try {
    const result = await traceGeminiCall({
      feature: FEATURES.VOICE_PRACTICE,
      name: 'evaluate-conversation',
      model: 'gemini-1.5-flash',
      userPrompt: prompt,
      metadata: traceMeta,
      tags: ['conversation', topic || 'unknown'],
      fn: () => model.generateContent(prompt)
    });
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("No JSON in response");
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    return NextResponse.json({
      scores: {
        communication: baseScore,
        professionalism: baseScore,
        confidence: baseScore,
        clarity: baseScore,
      },
      overallScore: baseScore,
      passed: baseScore >= 70,
      feedback: "Conversation skills evaluated.",
    });
  }
}
