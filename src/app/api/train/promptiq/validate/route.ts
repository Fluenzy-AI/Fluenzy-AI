/**
 * POST /api/train/promptiq/validate
 * Server-side Gemini validation for PromptIQ.
 * GEMINI_API_KEY is read from process.env — never exposed to the browser.
 */

import { NextRequest, NextResponse } from 'next/server';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ValidationRequest {
  prompt: string;
  taskType: string;
  challengeTask: string;
  requirements: string[];
}

export interface GeminiValidationResult {
  available: true;
  overallScore: number;
  requirementCoverage: number;
  clarity: number;
  specificity: number;
  context: number;
  taskDefinition: number;
  outputDefinition: number;
  reliability: number;
  security: number;
  maintainability: number;
  missingRequirements: string[];
  ambiguities: string[];
  contradictions: string[];
  recommendations: string[];
  requirementResults: { requirement: string; passed: boolean; note: string }[];
  optimizedPrompt: string;
  geminiModel: string;
}

export interface GeminiUnavailableResult {
  available: false;
  reason: string;
}

export type GeminiResult = GeminiValidationResult | GeminiUnavailableResult;

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildEvalPrompt(req: ValidationRequest): string {
  return `You are an enterprise AI prompt quality evaluator. Objectively evaluate whether the submitted prompt satisfies the requirements of its intended task.

TASK TYPE: ${req.taskType}
CHALLENGE TASK: ${req.challengeTask}

REQUIREMENTS TO EVALUATE:
${req.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

EVALUATION RULES:
- Evaluate ONLY what is written in the submitted prompt. Do not give credit for unstated intentions.
- Do NOT reward verbosity. A concise prompt that meets requirements outscores a verbose one that does not.
- If the prompt belongs to a completely different task type (e.g. Coding prompt submitted as Classification), overall score must be <= 45.
- requirementCoverage = percentage of listed requirements the prompt actually satisfies.
- Be strict and consistent. Near-misses are not passes.

SUBMITTED PROMPT:
---
${req.prompt}
---

Return ONLY a valid JSON object (no markdown fences, no explanation):
{
  "overallScore": <integer 0-100>,
  "requirementCoverage": <integer 0-100>,
  "clarity": <integer 0-100>,
  "specificity": <integer 0-100>,
  "context": <integer 0-100>,
  "taskDefinition": <integer 0-100>,
  "outputDefinition": <integer 0-100>,
  "reliability": <integer 0-100>,
  "security": <integer 0-100>,
  "maintainability": <integer 0-100>,
  "missingRequirements": ["string"],
  "ambiguities": ["string"],
  "contradictions": ["string"],
  "recommendations": ["string"],
  "requirementResults": [
    { "requirement": "string", "passed": true|false, "note": "string" }
  ],
  "optimizedPrompt": "improved version of the prompt"
}`;
}

function parseGeminiJSON(raw: string): Record<string, unknown> | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch { /* fall through */ } }
  return null;
}

function clamp(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  return isNaN(n) ? fallback : Math.max(0, Math.min(100, Math.round(n)));
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

// ── Handler ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<GeminiResult>> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ available: false, reason: 'GEMINI_API_KEY is not configured on the server.' } satisfies GeminiUnavailableResult);
  }

  let body: ValidationRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ available: false, reason: 'Invalid request body.' } satisfies GeminiUnavailableResult);
  }

  if (!body.prompt?.trim()) {
    return NextResponse.json({ available: false, reason: 'Empty prompt submitted.' } satisfies GeminiUnavailableResult);
  }

  const evalPrompt = buildEvalPrompt(body);
  const GEMINI_MODEL = 'gemini-3.8-flash';
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 25_000);

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: evalPrompt }] }],
        generationConfig: { temperature: 0.1, topP: 0.95, maxOutputTokens: 2048 },
      }),
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json({ available: false, reason: `Gemini API error ${res.status}: ${errText.slice(0, 200)}` } satisfies GeminiUnavailableResult);
    }

    const data = await res.json();
    const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!rawText) {
      return NextResponse.json({ available: false, reason: 'Gemini returned an empty response.' } satisfies GeminiUnavailableResult);
    }

    const parsed = parseGeminiJSON(rawText);
    if (!parsed) {
      return NextResponse.json({ available: false, reason: 'Gemini response could not be parsed as valid JSON.' } satisfies GeminiUnavailableResult);
    }

    const requirementResults = Array.isArray(parsed.requirementResults)
      ? (parsed.requirementResults as Record<string, unknown>[]).map(r => ({
          requirement: typeof r.requirement === 'string' ? r.requirement : '',
          passed:      r.passed === true,
          note:        typeof r.note === 'string' ? r.note : '',
        }))
      : [];

    const result: GeminiValidationResult = {
      available:           true,
      overallScore:        clamp(parsed.overallScore, 50),
      requirementCoverage: clamp(parsed.requirementCoverage, 50),
      clarity:             clamp(parsed.clarity, 50),
      specificity:         clamp(parsed.specificity, 50),
      context:             clamp(parsed.context, 50),
      taskDefinition:      clamp(parsed.taskDefinition, 50),
      outputDefinition:    clamp(parsed.outputDefinition, 50),
      reliability:         clamp(parsed.reliability, 50),
      security:            clamp(parsed.security, 50),
      maintainability:     clamp(parsed.maintainability, 50),
      missingRequirements: strArr(parsed.missingRequirements),
      ambiguities:         strArr(parsed.ambiguities),
      contradictions:      strArr(parsed.contradictions),
      recommendations:     strArr(parsed.recommendations),
      requirementResults,
      optimizedPrompt:     typeof parsed.optimizedPrompt === 'string' ? parsed.optimizedPrompt : body.prompt,
      geminiModel:         GEMINI_MODEL,
    };

    return NextResponse.json(result);

  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json({
      available: false,
      reason: isTimeout ? 'Gemini API request timed out (25s).' : 'Gemini API is unreachable.',
    } satisfies GeminiUnavailableResult);
  }
}
