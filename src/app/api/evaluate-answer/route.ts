import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { question, answer, module, context } = await request.json();

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    // 1. Environment Variable Check (support both GEMINI_API_KEY and NEXT_PUBLIC_GEMINI_API_KEY)
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('CRITICAL: GEMINI_API_KEY is missing in .env');
      return NextResponse.json({ error: 'API key configuration error' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

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

    // --- SMART MODEL SELECTION & FALLBACK (2026 UPDATED) ---
    let result;
    try {
      // Primary: Gemini 2.5 Pro (State-of-the-art for reasoning)
      const modelPro = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-pro', 
        generationConfig: { responseMimeType: "application/json" } 
      });
      result = await modelPro.generateContent(prompt);
    } catch (proError: any) {
      console.warn("Gemini 2.5 Pro busy or 404, switching to 2.5 Flash...");
      
      // Fallback: Gemini 2.5 Flash (Reliable & Fast)
      // Note: If 2.5 is not available, try 'gemini-3-flash-preview'
      const modelFlash = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: "application/json" }
      });
      result = await modelFlash.generateContent(prompt);
    }

    const response = await result.response;
    const text = response.text();

    // 2. Safer JSON parsing with Cleanup
    try {
      const evaluation = JSON.parse(text);
      return NextResponse.json(evaluation);
    } catch (parseError) {
      // Cleanup backticks if JSON mode wasn't strictly followed by AI
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      return NextResponse.json(JSON.parse(cleanedText));
    }

  } catch (error: any) {
    console.error('Final Evaluation error:', error);
    return NextResponse.json({ 
      error: 'Failed to evaluate answer', 
      details: error.message 
    }, { status: 500 });
  }
}