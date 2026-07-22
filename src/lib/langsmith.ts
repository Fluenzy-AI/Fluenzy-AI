/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Fluenzy AI — LangSmith Tracing Utility (TypeScript)
 * File: src/lib/langsmith.ts
 *
 * PURPOSE:
 *   Central observability layer for ALL Gemini AI calls in Next.js API routes.
 *   Uses the official LangSmith SDK Client to post and update runs.
 *
 * DESIGN PRINCIPLES:
 *   ✅ Fire-and-forget  — tracing never blocks the main response
 *   ✅ Fail-safe        — if LangSmith is unreachable, tracing silently drops
 *   ✅ Backward-compatible - signatures remain compatible with existing callers
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Client } from "langsmith";

// ─── Feature → LangSmith Project tag mapping ────────────────────────────────
export const FEATURES = {
  INTERVIEW_AI:        'Interview AI',
  RESUME_ATS:          'Resume ATS',
  MOCK_INTERVIEW:      'Mock Interview',
  GROUP_DISCUSSION:    'Group Discussion',
  CAREER_ROADMAP:      'Career Roadmap',
  AI_CHAT:             'AI Chat',
  CODING_INTERVIEW:    'Coding Interview',
  HR_INTERVIEW:        'HR Interview',
  BEHAVIORAL_INTERVIEW:'Behavioral Interview',
  VOICE_PRACTICE:      'Voice Practice',
  GENERATE_QUESTIONS:  'Generate Questions',
  BEHAVIORAL_ANALYSIS: 'Behavioral Analysis',
} as const;

export type Feature = typeof FEATURES[keyof typeof FEATURES];

// ─── Metadata shape attached to every trace ──────────────────────────────────
export interface TraceMetadata {
  user_id?:        string;
  session_id?:     string;
  conversation_id?:string;
  email?:          string;
  plan?:           string;          // e.g. "Free" | "Pro"
  feature?:        string;
  model?:          string;
  environment?:    string;          // "development" | "production"
  ip?:             string;
  device?:         string;
  browser?:        string;
  country?:        string;
  language?:       string;
  [key: string]:   string | number | boolean | undefined; // allow extra fields
}

// ─── Parameters for traceGeminiCall ──────────────────────────────────────────
export interface TraceGeminiCallParams<T> {
  feature:       Feature | string;
  name:          string;
  model?:        string;
  systemPrompt?: string;
  userPrompt:    string;
  metadata?:     TraceMetadata;
  tags?:         string[];
  fn:            () => Promise<T>;
}

// ─── LangSmith configuration ─────────────────────────────────────────────────
const LANGSMITH_API_KEY  = process.env.LANGSMITH_API_KEY;
const LANGSMITH_PROJECT  = process.env.LANGSMITH_PROJECT  ?? 'Fluenzy AI';
const LANGSMITH_ENDPOINT = process.env.LANGSMITH_ENDPOINT ?? 'https://api.smith.langchain.com';
const TRACING_ENABLED    = process.env.LANGSMITH_TRACING  === 'true' && !!LANGSMITH_API_KEY;
const APP_ENV            = process.env.APP_ENV            ?? 'development';

// Initialize the official LangSmith client
const client = new Client({
  apiKey: LANGSMITH_API_KEY,
  apiUrl: LANGSMITH_ENDPOINT,
});

// ─── Startup diagnostic ───────────────────────────────────────────────────────
// Logs once at module-load time so you can confirm the env vars that the running
// process actually sees (not just what's in the .env file on disk).
if (typeof process !== 'undefined') {
  const keyStatus = !LANGSMITH_API_KEY
    ? '❌ MISSING — set LANGSMITH_API_KEY in .env'
    : LANGSMITH_API_KEY === 'your_langsmith_api_key_here'
    ? '❌ PLACEHOLDER — replace with your real key from https://smith.langchain.com'
    : `✅ set (${LANGSMITH_API_KEY.slice(0, 8)}…)`;

  console.log(
    `[LangSmith] Tracing=${TRACING_ENABLED} | Key=${keyStatus} | Project="${LANGSMITH_PROJECT}" | Env=${APP_ENV}`
  );

  if (!TRACING_ENABLED && LANGSMITH_API_KEY) {
    console.warn(
      '[LangSmith] LANGSMITH_TRACING is not "true" — tracing is disabled. Check .env: LANGSMITH_TRACING=true'
    );
  }
}

// ─── Utility: safely extract text from Gemini result ────────────────────────
function extractGeminiText(result: unknown): string {
  try {
    if (!result) return '';
    const r = result as any;
    if (typeof r?.response?.text === 'function') return r.response.text();
    if (typeof r === 'string') return r;
    return JSON.stringify(r).slice(0, 2000);
  } catch {
    return '[unable to extract text]';
  }
}

// ─── Utility: extract usage metadata from Gemini result ─────────────────────
function extractUsageMetadata(result: unknown): Record<string, number> {
  try {
    const r = result as any;
    const usage = r?.response?.usageMetadata ?? r?.usageMetadata ?? {};
    return {
      prompt_tokens:     usage.promptTokenCount     ?? 0,
      completion_tokens: usage.candidatesTokenCount ?? 0,
      total_tokens:      usage.totalTokenCount      ?? 0,
    };
  } catch {
    return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  }
}

// ─── LangSmith Run Poster using official SDK ─────────────────────────────────
async function postRunToLangSmith(
  run: {
    id:             string;
    name:           string;
    run_type:       string;
    inputs:         Record<string, unknown>;
    outputs?:       Record<string, unknown>;
    error?:         string;
    start_time:     number;
    end_time:       number;
    tags?:          string[];
    extra?:         Record<string, unknown>;
    session_name?:  string;
  },
  isUpdate: boolean = false
): Promise<void> {
  if (!TRACING_ENABLED) return;

  const payload = {
    name:         run.name,
    run_type:     run.run_type,
    inputs:       run.inputs,
    outputs:      run.outputs,
    error:        run.error,
    start_time:   run.start_time,
    end_time:     run.end_time,
    tags:         run.tags ?? [],
    extra:        run.extra ?? {},
    session_name: run.session_name ?? LANGSMITH_PROJECT,
    project_name: LANGSMITH_PROJECT,
  };

  // Fire-and-forget: we do NOT await this at the main execution flow
  try {
    if (isUpdate) {
      client.updateRun(run.id, {
        outputs: payload.outputs,
        error: payload.error,
        end_time: payload.end_time,
        extra: payload.extra,
        tags: payload.tags,
      }).catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[LangSmith] Failed to update run:', err?.message ?? err);
        }
      });
    } else {
      client.createRun({
        id: run.id,
        ...payload,
      }).catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[LangSmith] Failed to create run:', err?.message ?? err);
        }
      });
    }
  } catch (err: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[LangSmith] Client method invocation failed:', err?.message ?? err);
    }
  }
}

// ─── Main export: traceGeminiCall ────────────────────────────────────────────
/**
 * Wraps any Gemini generateContent() call with full LangSmith tracing.
 */
export async function traceGeminiCall<T>(params: TraceGeminiCallParams<T>): Promise<T> {
  const {
    feature,
    name,
    model     = 'gemini-1.5-flash',
    systemPrompt,
    userPrompt,
    metadata  = {},
    tags      = [],
    fn,
  } = params;

  const runId     = crypto.randomUUID();
  const startTime = Date.now();

  const baseMetadata: TraceMetadata = {
    environment: APP_ENV,
    model,
    feature,
    ...metadata,
  };

  let result: T;

  try {
    result = await fn();

    const outputText  = extractGeminiText(result);
    const usageMeta   = extractUsageMetadata(result);
    const endTime     = Date.now();
    const latencyMs   = endTime - startTime;

    postRunToLangSmith({
      id:           runId,
      name:         `${feature} / ${name}`,
      run_type:     'llm',
      inputs:       {
        system: systemPrompt ?? '',
        human:  userPrompt,
      },
      outputs:      {
        output:            outputText,
        latency_ms:        latencyMs,
        prompt_tokens:     usageMeta.prompt_tokens,
        completion_tokens: usageMeta.completion_tokens,
        total_tokens:      usageMeta.total_tokens,
      },
      start_time:   startTime,
      end_time:     endTime,
      tags:         [feature, model, APP_ENV, ...tags].filter(Boolean),
      extra:        { metadata: baseMetadata, usage: usageMeta },
      session_name: LANGSMITH_PROJECT,
    }, false);

    return result;

  } catch (err: any) {
    const errorMessage = err?.message ?? String(err);
    const endTime = Date.now();

    postRunToLangSmith({
      id:           runId,
      name:         `${feature} / ${name}`,
      run_type:     'llm',
      inputs:       { system: systemPrompt ?? '', human: userPrompt },
      error:        errorMessage,
      start_time:   startTime,
      end_time:     endTime,
      tags:         [feature, model, APP_ENV, 'error', ...tags].filter(Boolean),
      extra:        { metadata: baseMetadata },
      session_name: LANGSMITH_PROJECT,
    }, false);

    throw err;
  }
}

// ─── Streaming support helper ────────────────────────────────────────────────
/**
 * Wraps and traces any streaming Gemini call (using model.generateContentStream())
 * recording latency, first-token latency, token counts and accumulated chunks.
 */
export async function traceGeminiStream<T extends { stream: AsyncGenerator<any, any, any> | AsyncIterable<any>; response: Promise<any> }>(
  params: TraceGeminiCallParams<T>
): Promise<T> {
  const {
    feature,
    name,
    model     = 'gemini-1.5-flash',
    systemPrompt,
    userPrompt,
    metadata  = {},
    tags      = [],
    fn,
  } = params;

  const runId     = crypto.randomUUID();
  const startTime = Date.now();

  const baseMetadata: TraceMetadata = {
    environment: APP_ENV,
    model,
    feature,
    ...metadata,
  };

  // Start the run in LangSmith (creation phase)
  postRunToLangSmith({
    id:           runId,
    name:         `${feature} / ${name}`,
    run_type:     'llm',
    inputs:       {
      system: systemPrompt ?? '',
      human:  userPrompt,
    },
    start_time:   startTime,
    end_time:     startTime,
    tags:         [feature, model, APP_ENV, ...tags].filter(Boolean),
    extra:        { metadata: baseMetadata },
    session_name: LANGSMITH_PROJECT,
  }, false);

  try {
    const result = await fn();
    const originalStream = result.stream;
    
    let firstTokenTime: number | null = null;
    let accumulatedText = "";
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;

    // Wrap the original stream generator
    const wrappedStream = (async function* () {
      try {
        for await (const chunk of originalStream) {
          if (firstTokenTime === null) {
            firstTokenTime = Date.now();
            const firstTokenLatency = firstTokenTime - startTime;
            
            // Update metadata with first token latency
            postRunToLangSmith({
              id:         runId,
              name:       `${feature} / ${name}`,
              run_type:   'llm',
              inputs:     { system: systemPrompt ?? '', human: userPrompt },
              start_time: startTime,
              end_time:   firstTokenTime,
              extra:      { 
                metadata: {
                  ...baseMetadata,
                  first_token_latency_ms: firstTokenLatency
                }
              },
            }, true);
          }

          const chunkText = chunk.text ? chunk.text() : '';
          accumulatedText += chunkText;

          if (chunk.usageMetadata) {
            promptTokens = chunk.usageMetadata.promptTokenCount ?? promptTokens;
            completionTokens = chunk.usageMetadata.candidatesTokenCount ?? completionTokens;
            totalTokens = chunk.usageMetadata.totalTokenCount ?? totalTokens;
          }

          yield chunk;
        }

        const endTime = Date.now();
        const latencyMs = endTime - startTime;

        // Try resolving response for usageMetadata fallback
        try {
          const finalResponse = await result.response;
          const usage = finalResponse.usageMetadata;
          if (usage) {
            promptTokens = usage.promptTokenCount ?? promptTokens;
            completionTokens = usage.candidatesTokenCount ?? completionTokens;
            totalTokens = usage.totalTokenCount ?? totalTokens;
          }
        } catch {
          // silent fallback
        }

        // Post final run update
        postRunToLangSmith({
          id:           runId,
          name:         `${feature} / ${name}`,
          run_type:     'llm',
          inputs:       {
            system: systemPrompt ?? '',
            human:  userPrompt,
          },
          outputs:      {
            output:            accumulatedText,
            latency_ms:        latencyMs,
            first_token_latency_ms: firstTokenTime ? firstTokenTime - startTime : undefined,
            prompt_tokens:     promptTokens,
            completion_tokens: completionTokens,
            total_tokens:      totalTokens,
          },
          start_time:   startTime,
          end_time:     endTime,
          tags:         [feature, model, APP_ENV, ...tags].filter(Boolean),
          extra:        { 
            metadata: baseMetadata,
            usage: {
              prompt_tokens: promptTokens,
              completion_tokens: completionTokens,
              total_tokens: totalTokens,
            }
          },
          session_name: LANGSMITH_PROJECT,
        }, true);

      } catch (streamError: any) {
        const errorTime = Date.now();
        postRunToLangSmith({
          id:           runId,
          name:         `${feature} / ${name}`,
          run_type:     'llm',
          inputs:       { system: systemPrompt ?? '', human: userPrompt },
          error:        streamError?.message ?? String(streamError),
          start_time:   startTime,
          end_time:     errorTime,
          tags:         [feature, model, APP_ENV, 'error', ...tags].filter(Boolean),
          extra:        { metadata: baseMetadata },
          session_name: LANGSMITH_PROJECT,
        }, true);
        throw streamError;
      }
    })();

    // Replace the stream of the result with our wrapped generator
    (result as any).stream = wrappedStream;
    return result;

  } catch (err: any) {
    const errorTime = Date.now();
    postRunToLangSmith({
      id:           runId,
      name:         `${feature} / ${name}`,
      run_type:     'llm',
      inputs:       { system: systemPrompt ?? '', human: userPrompt },
      error:        err?.message ?? String(err),
      start_time:   startTime,
      end_time:     errorTime,
      tags:         [feature, model, APP_ENV, 'error', ...tags].filter(Boolean),
      extra:        { metadata: baseMetadata },
      session_name: LANGSMITH_PROJECT,
    }, true);
    throw err;
  }
}

// ─── Simple session/event tracer (non-LLM events) ────────────────────────────
export function traceEvent(params: {
  name:      string;
  feature:   Feature | string;
  inputs:    Record<string, unknown>;
  outputs?:  Record<string, unknown>;
  error?:    string;
  metadata?: TraceMetadata;
  tags?:     string[];
}): void {
  if (!TRACING_ENABLED) return;

  const { name, feature, inputs, outputs, error, metadata = {}, tags = [] } = params;
  const now = Date.now();

  postRunToLangSmith({
    id:           crypto.randomUUID(),
    name:         `${feature} / ${name}`,
    run_type:     'chain',
    inputs,
    outputs,
    error,
    start_time:   now - 1,
    end_time:     now,
    tags:         [feature, APP_ENV, ...tags].filter(Boolean),
    extra:        { metadata: { environment: APP_ENV, feature, ...metadata } },
    session_name: LANGSMITH_PROJECT,
  }, false);
}

// ─── Utility: extract request metadata from NextRequest headers ───────────────
export function extractRequestMetadata(
  req: { headers: { get: (key: string) => string | null } },
  user?: {
    userId?:         string;
    email?:          string;
    plan?:           string;
    sessionId?:      string;
    conversationId?: string;
  }
): TraceMetadata {
  return {
    user_id:          user?.userId,
    email:            user?.email,
    plan:             user?.plan ?? 'Free',
    session_id:       user?.sessionId,
    conversation_id:  user?.conversationId,
    ip:               req.headers.get('x-forwarded-for')
                        ?? req.headers.get('x-real-ip')
                        ?? 'unknown',
    device:           req.headers.get('sec-ch-ua-mobile') === '?1' ? 'mobile' : 'desktop',
    browser:          req.headers.get('user-agent')?.split('/')[0] ?? 'unknown',
    country:          req.headers.get('x-vercel-ip-country') ?? 'unknown',
    language:         req.headers.get('accept-language')?.split(',')[0] ?? 'en',
    environment:      APP_ENV,
  };
}
