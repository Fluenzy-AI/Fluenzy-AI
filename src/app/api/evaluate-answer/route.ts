import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { enforceModuleAccess } from '@/lib/serverAccessCheck';
import { generateJSON } from '@/lib/gemini-router';
import { extractRequestMetadata } from '@/lib/langsmith';

export async function POST(request: NextRequest) {
  try {
    // ── Auth guard ────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, disabled: true },
    });

    if (!user || user.disabled) {
      return NextResponse.json({ error: 'Account not found or disabled' }, { status: 403 });
    }

    const { question, answer, module, context } = await request.json();

    // ── Session-limit guard ───────────────────────────────────────────────
    if (module) {
      const denied = await enforceModuleAccess(user.id, module);
      if (denied) return denied;
    }

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // ── Empty/missing answer: return a structured fallback, do NOT reject ──
    // An empty answer means STT captured nothing for this turn (microphone off,
    // very short response, or connection drop). Returning 400 causes the caller
    // to hit a rejected Promise.allSettled entry and the turn gets no feedback.
    // We return a graceful degraded response instead.
    if (!answer || !String(answer).trim()) {
      return NextResponse.json({
        idealAnswer: 'Please provide a verbal response to the interview question.',
        aiFeedback: 'No speech was captured for this turn. Ensure your microphone is active and speak clearly.',
        scores: { clarity: 0, relevance: 0, grammar: 0, confidence: 0, technicalAccuracy: 0 },
        perQuestionScore: 0,
        transcriptStatus: 'NO_SPEECH_CAPTURED',
      });
    }

    const prompt = `
You are Fluenzy AI, an advanced AI Interview Coach. Analyze this transcript.
Candidate might use Hindi-English mix or have Speech-to-Text errors.

**CRITICAL RULES:**
1. NEVER repeat the user's raw answer in "idealAnswer".
2. Rewrite the answer in high-impact, professional corporate English for companies like Apple/Google.
3. Fix STT errors: e.g., "Germany API" -> "Gemini API", "Random object" -> "Random Forest".
4. SCORING: No zeros unless silent. Give credit for technical keywords (Python, ML, etc.) even if grammar is poor.

Question: ${question}
Raw Answer: ${answer}
Context: ${context || 'General practice'}

Provide evaluation in STRICT JSON format:
{
  "idealAnswer": "Professional version of answer",
  "aiFeedback": "Constructive technical feedback",
  "scores": {
    "clarity": 0-10,
    "relevance": 0-10,
    "grammar": 0-10,
    "confidence": 0-10,
    "technicalAccuracy": 0-10
  },
  "perQuestionScore": 0-10
}`;

    // Extract trace metadata from request headers and active session
    const traceMeta = extractRequestMetadata(request, {
      userId: user.id,
      email: session.user.email,
      conversationId: context,
    });

    // gemini-router: cycles healthy keys x models automatically
    const evaluation = await generateJSON(prompt, { preferHighCapability: true });
    return NextResponse.json(evaluation);

  } catch (error: any) {
    console.error('[EVALUATE_ANSWER_ERROR]', error);
    const msg = error?.message || '';

    if (
      msg.includes('GEMINI_ROUTER') ||
      msg.toLowerCase().includes('rate-limit') ||
      msg.toLowerCase().includes('quota') ||
      msg.toLowerCase().includes('cooldown')
    ) {
      return NextResponse.json({
        error: 'AI evaluation service is temporarily busy due to rate limits. Please retry in a few moments.',
        code: 'AI_RATE_LIMITED'
      }, { status: 503 });
    }

    return NextResponse.json({ 
      error: 'Failed to evaluate answer', 
      details: error.message 
    }, { status: 500 });
  }
}