/**
 * gemini-router.ts — Centralized Gemini API Key + Model Router
 *
 * ─── How it works ───────────────────────────────────────────────────────────
 *  Every Gemini call goes through `callGeminiWithFallback()`.
 *
 *  Model strategy (cost-effective order — cheapest first, escalate on need):
 *    gemini-2.5-flash        → fastest, cheap, latest generation (START HERE)
 *    gemini-2.5-flash-lite   → ultra-cheap preview
 *    gemini-2.0-flash        → proven, reliable
 *    gemini-2.0-flash-lite   → lightest 2.0 model
 *    gemini-1.5-flash        → stable fallback
 *    gemini-1.5-flash-8b     → smallest / cheapest ever
 *    gemini-2.5-pro          → high-capability, expensive (last resort)
 *    gemini-1.5-pro          → final fallback
 *
 *  Key strategy:
 *    • All GEMINI_API_KEY* env vars are collected + deduplicated.
 *    • On quota (429) → try next MODEL with same key first (per-model quotas).
 *    • After all models fail for a key → rotate to next key.
 *    • Auth errors (401/403) → immediately skip that key.
 *
 *  Usage:
 *    import { callGeminiWithFallback } from '@/lib/gemini-router';
 *
 *    const text = await callGeminiWithFallback({
 *      prompt: 'Extract text...',
 *      inlineData: { mimeType: 'application/pdf', data: base64 },
 *    });
 *
 * ────────────────────────────────────────────────────────────────────────────
 */

import { GoogleGenerativeAI, GenerateContentRequest } from '@google/generative-ai';

// ─── Model registry ──────────────────────────────────────────────────────────
//
// Only Gemini 2.5 stable models.
// On quota (429) the router tries the next model / key automatically.
//
const MODELS_CHEAP_FIRST = [
  'gemini-2.5-flash',   // Cheapest & fastest — start here
  'gemini-2.5-pro',     // High-capability — fallback when Flash quota exhausted
];

const MODELS_QUALITY_FIRST = [
  'gemini-2.5-pro',     // Most powerful first
  'gemini-2.5-flash',   // Fast fallback
];

// ─── Key collection ───────────────────────────────────────────────────────────

function getAllApiKeys(): string[] {
  const raw = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_ONE,
    process.env.GEMINI_API_KEY_TWO,
    process.env.GEMINI_API_KEY_THREE,
    process.env.GEMINI_API_KEY_FOUR,
    process.env.GEMINI_API_KEY_FIVE,
    process.env.GEMINI_API_KEY_SIX,
    process.env.GEMINI_API_KEY_SEVEN,
    process.env.GEMINI_API_KEY_EIGHT,
    process.env.GEMINI_API_KEY_NINE,
    process.env.GEMINI_API_KEY_TEN,
    // Public key as last resort (lower priority)
    process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  ];
  // Deduplicate and filter — no point retrying identical keys
  return [...new Set(raw.filter((k): k is string => !!k && k.length > 10))];
}

// ─── Error classification ─────────────────────────────────────────────────────

function classifyError(err: unknown): 'quota' | 'auth' | 'model' | 'unknown' {
  const msg = err instanceof Error ? err.message : String(err);
  if (
    msg.includes('429') ||
    msg.toLowerCase().includes('quota') ||
    msg.toLowerCase().includes('rate limit') ||
    msg.toLowerCase().includes('too many requests')
  ) return 'quota';
  if (
    msg.includes('401') ||
    msg.includes('403') ||
    msg.toLowerCase().includes('api key') ||
    msg.toLowerCase().includes('unauthorized') ||
    msg.toLowerCase().includes('forbidden')
  ) return 'auth';
  if (
    msg.includes('404') ||
    msg.toLowerCase().includes('not found') ||
    msg.toLowerCase().includes('model') && msg.toLowerCase().includes('not')
  ) return 'model'; // Model doesn't exist — try next
  return 'unknown';
}

// ─── Core types ───────────────────────────────────────────────────────────────

export interface GeminiCallOptions {
  /** Text prompt (required) */
  prompt: string;
  /** Optional inline binary data (PDF, image, etc.) */
  inlineData?: {
    mimeType: string;
    data: string; // base64
  };
  /** Start with cheap models (default) or quality models */
  preferHighCapability?: boolean;
  /** Force a specific model (skips rotation — still rotates keys on quota) */
  preferredModel?: string;
  /** System instruction (optional) */
  systemInstruction?: string;
  /** Max output tokens (default: unlimited) */
  maxOutputTokens?: number;
}

export interface GeminiCallResult {
  text: string;
  model: string;
  keyIndex: number; // which key slot was used (0-indexed)
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Call Gemini with automatic key rotation + model fallback.
 *
 * - Tries cheapest model first (or quality-first if preferHighCapability).
 * - On quota (429) → tries next model with same key.
 * - After all models fail for a key → rotates to next key.
 * - Auth errors → immediately skips that key.
 * - Throws only after ALL key × model combinations are exhausted.
 */
export async function callGeminiWithFallback(
  opts: GeminiCallOptions,
): Promise<GeminiCallResult> {
  const apiKeys = getAllApiKeys();

  if (apiKeys.length === 0) {
    throw new Error(
      'No GEMINI_API_KEY configured. Add at least one key to your .env file.',
    );
  }

  const modelList = opts.preferredModel
    ? [opts.preferredModel, ...(opts.preferHighCapability ? MODELS_QUALITY_FIRST : MODELS_CHEAP_FIRST).filter(m => m !== opts.preferredModel)]
    : opts.preferHighCapability
    ? MODELS_QUALITY_FIRST
    : MODELS_CHEAP_FIRST;

  let lastError: unknown = null;

  // Outer: rotate keys; Inner: rotate models
  // On quota → try next MODEL (same key). Per-model quotas are independent.
  // On auth  → skip all remaining models for this key (key is bad).
  for (let ki = 0; ki < apiKeys.length; ki++) {
    const apiKey = apiKeys[ki];

    for (const modelName of modelList) {
      try {
        console.log(
          `[GEMINI_ROUTER] Attempting key[${ki}]=...${apiKey.slice(-6)}, model=${modelName}`,
        );

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: modelName,
          ...(opts.systemInstruction
            ? { systemInstruction: opts.systemInstruction }
            : {}),
          ...(opts.maxOutputTokens
            ? { generationConfig: { maxOutputTokens: opts.maxOutputTokens } }
            : {}),
        });

        // Build the content parts
        const parts: GenerateContentRequest['contents'][0]['parts'] = [
          { text: opts.prompt },
        ];
        if (opts.inlineData) {
          parts.push({ inlineData: opts.inlineData });
        }

        const result = await model.generateContent({
          contents: [{ role: 'user', parts }],
        });

        const text = result.response.text().trim();
        console.log(
          `[GEMINI_ROUTER] ✓ key[${ki}]=...${apiKey.slice(-6)}, model=${modelName}, chars=${text.length}`,
        );
        return { text, model: modelName, keyIndex: ki };

      } catch (err: unknown) {
        lastError = err;
        const kind = classifyError(err);
        const msg  = err instanceof Error ? err.message.split('\n')[0] : String(err);

        console.warn(
          `[GEMINI_ROUTER] ✗ key[${ki}]=...${apiKey.slice(-6)}, model=${modelName} [${kind.toUpperCase()}]: ${msg}`,
        );

        if (kind === 'auth') {
          // This key is invalid/revoked — skip all models for it
          console.warn(`[GEMINI_ROUTER] Bad key[${ki}] — skipping all models for this key`);
          break; // break inner → next key
        }

        // quota | model-not-found | unknown → try next model (same key)
        // (Per-model quotas are independent, so this is almost always the right move)
        continue;
      }
    }
  }

  // Everything exhausted
  const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(
    `[GEMINI_ROUTER] All ${getAllApiKeys().length} keys × ${modelList.length} models failed. Last: ${errMsg}`,
  );
}

/**
 * Convenience wrapper: generates text from a simple prompt string.
 * Returns just the text string (not the full result object).
 */
export async function generateText(
  prompt: string,
  opts?: Omit<GeminiCallOptions, 'prompt'>,
): Promise<string> {
  const result = await callGeminiWithFallback({ prompt, ...opts });
  return result.text;
}

/**
 * Convenience wrapper: generates and parses JSON from the response.
 * Strips markdown code fences before parsing.
 */
export async function generateJSON<T = unknown>(
  prompt: string,
  opts?: Omit<GeminiCallOptions, 'prompt'>,
): Promise<T> {
  const result = await callGeminiWithFallback({ prompt, ...opts });
  // Strip optional markdown code fences
  const cleaned = result.text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try extracting first JSON object/array from the response
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    const match    = objMatch ?? arrMatch;
    if (match) return JSON.parse(match[0]) as T;
    throw new Error(`[GEMINI_ROUTER] Failed to parse JSON. Raw: ${cleaned.slice(0, 200)}`);
  }
}
