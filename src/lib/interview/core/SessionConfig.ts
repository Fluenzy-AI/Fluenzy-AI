// ─── FluenzyAI — Interview Session Identity & Configuration ──────────────────
// Every interview session has immutable identity + config set at creation time.
// Changing settings mid-session is explicitly NOT allowed after the session
// is in READY or later states — prevents turn-corruption from stale config.

import { InterviewSettings, GEMINI_VOICE_MAP } from '@/types/interviewSettings';
import type { ModuleType } from 'LE/types';

// ── Session Identity ──────────────────────────────────────────────────────────
export interface SessionIdentity {
  /** Globally-unique session identifier — also used as the audio turn namespace. */
  sessionId: string;
  /** End-to-end trace ID propagated to all services for debugging. */
  traceId: string;
  /** Incrementing index — helps detect duplicates in logs. */
  instanceIndex: number;
  /** Wall-clock time the session was created. */
  createdAt: Date;
}

// ── Session Metadata from URL / Context ──────────────────────────────────────
export interface SessionMeta {
  lessonId?: string;
  lessonTitle?: string;
  company?: string;
  companyLogo?: string;
  role?: string;
  experience?: string;
  difficulty?: string;
  roundType?: string;
  resumeText?: string;
  isCompanyWise?: boolean;
  focus?: string;
  level?: string;
}

// ── Immutable Interview Configuration (frozen at session start) ───────────────
export interface InterviewConfig {
  // Settings selected by user in the UI — locked once session starts
  settings: Readonly<InterviewSettings>;
  // The resolved Gemini voice name (computed from voiceId at session start)
  resolvedVoiceName: string;
  // Module type
  moduleType: ModuleType | string;
  // Session metadata (company, role, etc.)
  meta: Readonly<SessionMeta>;
  // The built system instruction (computed once, never re-built mid-session)
  systemInstruction: string;
}

// ── Counter for detecting duplicate session starts ────────────────────────────
let _globalSessionCounter = 0;

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create a unique SessionIdentity. Each call increments the global counter
 * so duplicate starts within the same page load are detectable in logs.
 */
export function createSessionIdentity(): SessionIdentity {
  _globalSessionCounter++;
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 9);
  return {
    sessionId: `SID_${timestamp}_${random}`,
    traceId:   `TID_${timestamp}_${Math.random().toString(36).slice(2, 9)}`,
    instanceIndex: _globalSessionCounter,
    createdAt: new Date(timestamp),
  };
}

/**
 * Resolve the Gemini voice name from a VoiceId, with a safe fallback.
 */
export function resolveGeminiVoiceName(voiceId: string): string {
  const entry = GEMINI_VOICE_MAP[voiceId as keyof typeof GEMINI_VOICE_MAP];
  if (!entry) {
    console.error(
      `[SessionConfig] No Gemini voice mapping for voiceId="${voiceId}". Falling back to Aoede.`,
    );
    return 'Aoede';
  }
  console.log(`[SessionConfig] voiceId="${voiceId}" → Gemini voice="${entry.voiceName}" (${entry.gender})`);
  return entry.voiceName;
}

/**
 * Create an InterviewConfig from settings + meta. This is called ONCE at
 * session start and the result is frozen. The session instruction is built
 * by the caller (VoiceAgent / InterviewController) and passed in.
 */
export function createInterviewConfig(
  settings: InterviewSettings,
  moduleType: ModuleType | string,
  meta: SessionMeta,
  systemInstruction: string,
): InterviewConfig {
  const resolvedVoiceName = resolveGeminiVoiceName(settings.voiceId);
  return Object.freeze({
    settings: Object.freeze({ ...settings }),
    resolvedVoiceName,
    moduleType,
    meta: Object.freeze({ ...meta }),
    systemInstruction,
  });
}

/**
 * Derive AI response delay (ms) from responseTiming setting.
 * Returns 0 for instant, 150 for natural, 600 for thoughtful.
 */
export function getResponseDelayMs(settings: Readonly<InterviewSettings>): number {
  switch (settings.responseTiming) {
    case 'instant':    return 0;
    case 'natural':    return 150;
    case 'thoughtful': return 600;
    default:           return 150;
  }
}

/**
 * Build a human-readable label for a session (for logs / UI).
 */
export function sessionLabel(identity: SessionIdentity, config: InterviewConfig): string {
  return (
    `[${config.meta.company || config.moduleType}/${config.meta.role || 'General'}] ` +
    `session=${identity.sessionId} trace=${identity.traceId} instance=#${identity.instanceIndex}`
  );
}
