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
    // Only check for modules that consume sessions (free-tier limited modules).
    // Unlimited modules (vocabulary, latestTopics, corporateVoice) bypass this.
    if (module) {
      const denied = await enforceModuleAccess(user.id, module);
      if (denied) return denied;
    }

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
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

    // gemini-router: cycles all keys × models automatically (quality-first for answer eval)
    const evaluation = await generateJSON(prompt, { preferHighCapability: true });
    return NextResponse.json(evaluation);

  } catch (error: any) {
    console.error('Final Evaluation error:', error);
    return NextResponse.json({ 
      error: 'Failed to evaluate answer', 
      details: error.message 
    }, { status: 500 });
  }
}