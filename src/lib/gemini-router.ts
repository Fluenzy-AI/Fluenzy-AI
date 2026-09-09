/**
 * gemini-router.ts — Centralized Gemini API Key + Model Router
 *
 * ─── How it works ───────────────────────────────────────────────────────────
 *  Every Gemini call goes through `callGeminiWithFallback()`.
 *
 *  Model strategy:
 *    Uses currently supported Gemini models:
 *      gemini-2.0-flash   → fast, reliable 2.0 generation (default cheap)
 *      gemini-1.5-flash   → lightweight, high-throughput fallback
 *      gemini-1.5-pro     → high-capability quality model
 *    Configurable via process.env.GEMINI_MODELS (comma-separated).
 *
 *  Routing & Resilience:
 *    • API keys load-balanced with round-robin start index.
 *    • 404 (Invalid / Deprecated Model) → marked invalid globally in-memory,
 *      skipped instantly across all keys without wasting requests.
 *    • 429 (Quota / Rate Limit) → provider placed in cooldown (default 60s or server retry-after),
 *      router immediately moves to next healthy key/model.
 *    • 401/403 (Auth Error) → key placed in long cooldown, skipping key.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { GoogleGenerativeAI, GenerateContentRequest } from '@google/generative-ai';

// ─── In-Memory State for Provider Cooldowns & Invalid Models ─────────────────

/** Set of models permanently returning 404 / Not Found in the current process */
const invalidModels = new Set<string>();

/** Map of `${keyId}:${modelName}` -> timestamp (ms) until cooldown expires */
const providerCooldowns = new Map<string, number>();

/** Global round-robin index to distribute traffic evenly across API keys */
let keyRoundRobinCounter = 0;

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
    // Public key as last resort
    process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  ];
  // Deduplicate and filter valid keys
  return [...new Set(raw.filter((k): k is string => !!k && k.length > 10))];
}

function getKeyId(key: string, index: number): string {
  return `key[${index}]=...${key.slice(-6)}`;
}

// ─── Model Registry & Configuration ──────────────────────────────────────────

function getSupportedModels(preferHighCapability = false, preferredModel?: string): string[] {
  let baseModels: string[] = [];

  if (process.env.GEMINI_MODELS) {
    baseModels = process.env.GEMINI_MODELS.split(',')
      .map((m) => m.trim())
      .filter(Boolean);
  }

  if (baseModels.length === 0) {
    const cheapFirst = [
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-2.5-pro',
    ];
    const qualityFirst = [
      'gemini-3.8-flash',
      'gemini-2.5-pro',
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-2.5-flash',
    ];
    baseModels = preferHighCapability ? qualityFirst : cheapFirst;
  }

  if (preferredModel) {
    baseModels = [preferredModel, ...baseModels.filter((m) => m !== preferredModel)];
  }

  // Filter out any models previously flagged as invalid (404)
  const validModels = baseModels.filter((m) => !invalidModels.has(m));

  // If all configured models were marked invalid, fall back to safe standard defaults
  if (validModels.length === 0) {
    return [
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-2.5-pro',
    ].filter((m) => !invalidModels.has(m));
  }

  return validModels;
}

// ─── Error Classification & Quota Parsing ────────────────────────────────────

function classifyError(err: unknown): 'quota' | 'auth' | 'model' | 'unknown' {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (
    msg.includes('404') ||
    lower.includes('not found') ||
    lower.includes('no longer available') ||
    (lower.includes('model') && lower.includes('not'))
  ) {
    return 'model';
  }
  if (
    msg.includes('429') ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests')
  ) {
    return 'quota';
  }
  if (
    msg.includes('401') ||
    msg.includes('403') ||
    lower.includes('api key') ||
    lower.includes('unauthorized') ||
    lower.includes('forbidden')
  ) {
    return 'auth';
  }
  return 'unknown';
}

function parseRetryDelayMs(msg: string): number {
  // Check for server-provided retry interval like "retry after 2s" or "in 15.5s"
  const secMatch = msg.match(/retry\s+after\s+(\d+(?:\.\d+)?)s/i) || msg.match(/in\s+(\d+(?:\.\d+)?)s/i);
  if (secMatch && secMatch[1]) {
    const sec = parseFloat(secMatch[1]);
    if (!isNaN(sec) && sec > 0) {
      return Math.min(sec * 1000 + 500, 120000); // capped at 2 min
    }
  }
  // Default cooldown for 429 quota limit: 60 seconds
  return 60000;
}

// ─── Core Types ──────────────────────────────────────────────────────────────

export interface GeminiCallOptions {
  /** Text prompt (required) */
  prompt: string;
  /** Optional inline binary data (PDF, image, etc.) */
  inlineData?: {
    mimeType: string;
    data: string; // base64
  };
  /** Start with quality models (true) or cheap models (false) */
  preferHighCapability?: boolean;
  /** Force a specific model */
  preferredModel?: string;
  /** System instruction (optional) */
  systemInstruction?: string;
  /** Max output tokens */
  maxOutputTokens?: number;
}

export interface GeminiCallResult {
  text: string;
  model: string;
  keyIndex: number;
}

// ─── Main Routing Function ───────────────────────────────────────────────────

/**
 * Call Gemini with intelligent key balancing, 404 model pruning, and 429 quota cooldown tracking.
 */
export async function callGeminiWithFallback(
  opts: GeminiCallOptions,
): Promise<GeminiCallResult> {
  const apiKeys = getAllApiKeys();

  if (apiKeys.length === 0) {
    throw new Error('No GEMINI_API_KEY configured. Add at least one key to environment variables.');
  }

  const modelList = getSupportedModels(opts.preferHighCapability, opts.preferredModel);
  if (modelList.length === 0) {
    throw new Error('[GEMINI_ROUTER] All Gemini models are marked invalid (404). Check API model configuration.');
  }

  const now = Date.now();
  const startKeyIndex = Math.abs(keyRoundRobinCounter++) % apiKeys.length;
  let lastError: unknown = null;
  let skippedCooldownCount = 0;

  // Outer loop: Try available models
  for (const modelName of modelList) {
    if (invalidModels.has(modelName)) {
      console.warn(`[GEMINI_ROUTER] model=${modelName} -> INVALID_MODEL -> skipping model`);
      continue;
    }

    // Inner loop: Rotate through keys starting from round-robin position
    for (let i = 0; i < apiKeys.length; i++) {
      const ki = (startKeyIndex + i) % apiKeys.length;
      const apiKey = apiKeys[ki];
      const keyId = getKeyId(apiKey, ki);
      const cooldownKey = `${keyId}:${modelName}`;

      // Check if this provider:model combination is in cooldown
      const cooldownUntil = providerCooldowns.get(cooldownKey) || 0;
      if (cooldownUntil > now) {
        skippedCooldownCount++;
        const remainingSec = Math.ceil((cooldownUntil - now) / 1000);
        console.log(`[GEMINI_ROUTER] ${keyId}, model=${modelName} -> IN_COOLDOWN (${remainingSec}s left) -> skipping provider`);
        continue;
      }

      try {
        console.log(`[GEMINI_ROUTER] Attempting ${keyId}, model=${modelName}`);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: modelName,
          ...(opts.systemInstruction ? { systemInstruction: opts.systemInstruction } : {}),
          ...(opts.maxOutputTokens ? { generationConfig: { maxOutputTokens: opts.maxOutputTokens } } : {}),
        });

        const parts: GenerateContentRequest['contents'][0]['parts'] = [{ text: opts.prompt }];
        if (opts.inlineData) {
          parts.push({ inlineData: opts.inlineData });
        }

        const result = await model.generateContent({
          contents: [{ role: 'user', parts }],
        });

        const text = result.response.text().trim();
        console.log(`[GEMINI_ROUTER] ✓ ${keyId}, model=${modelName}, chars=${text.length}`);
        
        // Remove active cooldown for successful provider
        providerCooldowns.delete(cooldownKey);
        return { text, model: modelName, keyIndex: ki };

      } catch (err: unknown) {
        lastError = err;
        const kind = classifyError(err);
        const rawMsg = err instanceof Error ? err.message : String(err);
        const shortMsg = rawMsg.split('\n')[0];

        if (kind === 'model') {
          // 404 / Model Not Found — mark model invalid globally so we never try it on other keys!
          invalidModels.add(modelName);
          console.warn(`[GEMINI_ROUTER] model=${modelName} -> INVALID_MODEL (404) -> skipping model globally across all keys`);
          break; // Break key loop to immediately advance to the next model
        }

        if (kind === 'quota') {
          const delayMs = parseRetryDelayMs(rawMsg);
          const cooldownSec = Math.round(delayMs / 1000);
          providerCooldowns.set(cooldownKey, Date.now() + delayMs);
          console.warn(`[GEMINI_ROUTER] ${keyId}, model=${modelName} -> QUOTA (429) -> cooldown ${cooldownSec}s -> trying next provider`);
          continue; // Try next key/model
        }

        if (kind === 'auth') {
          // Auth error — mark key in cooldown for 1 hour
          const authCooldownKey = `${keyId}:ALL`;
          providerCooldowns.set(authCooldownKey, Date.now() + 3600000);
          console.warn(`[GEMINI_ROUTER] ${keyId} -> AUTH_ERROR -> skipping key for 1h`);
          break; // Move to next key
        }

        console.warn(`[GEMINI_ROUTER] ✗ ${keyId}, model=${modelName} [${kind.toUpperCase()}]: ${shortMsg}`);
        continue;
      }
    }
  }

  // If all providers were exhausted or in cooldown
  const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
  if (skippedCooldownCount > 0 && !lastError) {
    throw new Error('[GEMINI_ROUTER] All Gemini providers are currently in rate-limit cooldown. Please retry in a few moments.');
  }

  throw new Error(`[GEMINI_ROUTER] AI Service temporarily unavailable. Details: ${errMsg}`);
}

/**
 * Convenience wrapper: generates text from prompt string.
 */
export async function generateText(
  prompt: string,
  opts?: Omit<GeminiCallOptions, 'prompt'>,
): Promise<string> {
  const result = await callGeminiWithFallback({ prompt, ...opts });
  return result.text;
}

/**
 * Convenience wrapper: generates and parses JSON from response.
 * Strips markdown code fences before parsing.
 */
export async function generateJSON<T = unknown>(
  prompt: string,
  opts?: Omit<GeminiCallOptions, 'prompt'>,
): Promise<T> {
  const result = await callGeminiWithFallback({ prompt, ...opts });
  const cleaned = result.text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    const match = objMatch ?? arrMatch;
    if (match) return JSON.parse(match[0]) as T;
    throw new Error(`[GEMINI_ROUTER] Failed to parse JSON response. Raw: ${cleaned.slice(0, 200)}`);
  }
}
