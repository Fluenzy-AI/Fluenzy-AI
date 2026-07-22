// ─── FluenzyAI — Session Config Builder ──────────────────────────────────────
// Converts user's InterviewSettings into a concrete SessionConfig that
// flows into: (1) Gemini system prompt, (2) response delay, (3) ElevenLabs (future).

import {
  InterviewSettings,
  SessionConfig,
  VOICE_OPTIONS,
  PRESSURE_STYLE_OPTIONS,
  RESPONSE_TIMING_OPTIONS,
  VOICE_SPEED_LABELS,
} from '@/types/interviewSettings';

interface BaseContext {
  company?: string;
  role?: string;
  level?: string;
  roundType?: string;
}

/**
 * Build a SessionConfig from InterviewSettings and base interview context.
 * Call this just before launching the session, and pass the config via URL params.
 */
export function buildSessionConfig(
  settings: InterviewSettings,
  baseContext: BaseContext = {}
): SessionConfig {
  // Voice ID → ElevenLabs env var lookup
  const voiceOption = VOICE_OPTIONS.find(v => v.id === settings.voiceId);
  const elevenLabsVoiceId = voiceOption
    ? (process.env[voiceOption.elevenLabsEnvKey] ?? settings.voiceId)
    : settings.voiceId;

  // Style → system prompt addon
  const styleOption = PRESSURE_STYLE_OPTIONS.find(s => s.id === settings.pressureStyle);
  const stylePrompt = styleOption?.systemPrompt ?? '';

  // Speed → verbal instruction to AI
  const speedLabel = VOICE_SPEED_LABELS[settings.voiceSpeed];
  const speedInstruction = buildSpeedInstruction(settings.voiceSpeed);

  // Timing → delay ms
  const timingOption = RESPONSE_TIMING_OPTIONS.find(t => t.id === settings.responseTiming);
  const responseDelayMs = timingOption?.delayMs ?? 150; // default: near-instant

  // Compose full system prompt addon
  const systemPromptAddons = [
    stylePrompt,
    speedInstruction,
    `Voice persona: ${voiceOption?.name ?? 'Professional'} (${voiceOption?.accent ?? ''}).`,
  ].filter(Boolean).join(' ');

  return {
    elevenLabsVoiceId,
    voiceSpeed: settings.voiceSpeed,
    systemPromptAddons,
    responseDelayMs,
  };
}

/**
 * Convert numeric voiceSpeed into a natural-language speaking-pace instruction
 * that Gemini Live can follow (since Gemini handles audio, not ElevenLabs here).
 */
function buildSpeedInstruction(voiceSpeed: InterviewSettings['voiceSpeed']): string {
  switch (voiceSpeed) {
    case 0.75:
      return 'Speak slowly and clearly. Pause briefly between sentences. The candidate is building confidence.';
    case 1:
      return 'Speak at a normal, natural interview pace.';
    case 1.25:
      return 'Speak at a slightly brisk pace, like an experienced interviewer would.';
    case 1.5:
      return 'Speak at a fast pace. Keep questions concise. Move quickly to follow-ups.';
    case 1.75:
      return 'Speak very fast. Fire questions rapidly with minimal pausing. This is a high-pressure simulation.';
    default:
      return '';
  }
}

/**
 * Serialize settings as URL search params for passing to the session page.
 * VoiceAgent reads these via useSearchParams().
 */
export function settingsToUrlParams(settings: InterviewSettings): Record<string, string> {
  return {
    voiceSpeed:     String(settings.voiceSpeed),
    voiceId:        settings.voiceId,
    pressureStyle:  settings.pressureStyle,
    responseTiming: settings.responseTiming,
  };
}

/**
 * Parse InterviewSettings back from URL search params.
 * Provides type-safe defaults for each field.
 */
export function settingsFromUrlParams(
  searchParams: URLSearchParams | Record<string, string | null>
): Partial<InterviewSettings> {
  const get = (key: string) =>
    searchParams instanceof URLSearchParams
      ? searchParams.get(key)
      : (searchParams as Record<string, string | null>)[key];

  const voiceSpeedRaw = parseFloat(get('voiceSpeed') ?? '');
  const validSpeeds = [0.75, 1, 1.25, 1.5, 1.75];

  return {
    voiceSpeed: (validSpeeds.includes(voiceSpeedRaw) ? voiceSpeedRaw : undefined) as InterviewSettings['voiceSpeed'] | undefined,
    voiceId:        (['priya', 'arjun', 'sarah', 'marcus'].includes(get('voiceId') ?? '')
      ? get('voiceId') as InterviewSettings['voiceId']
      : undefined),
    pressureStyle:  (['supportive', 'professional', 'pressure'].includes(get('pressureStyle') ?? '')
      ? get('pressureStyle') as InterviewSettings['pressureStyle']
      : undefined),
    responseTiming: (['instant', 'natural', 'thoughtful'].includes(get('responseTiming') ?? '')
      ? get('responseTiming') as InterviewSettings['responseTiming']
      : undefined),
  };
}
