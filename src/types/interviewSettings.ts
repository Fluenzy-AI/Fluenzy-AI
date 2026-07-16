// ─── FluenzyAI — Interview Voice & Style Settings Types ──────────────────────
// Single source of truth for all 4 settings types.
// NOTE: No feedbackMode — feedback is always-on (see spec §5).

// ── Setting 1: AI Voice Speed ─────────────────────────────────────────────────
export type VoiceSpeed = 0.75 | 1 | 1.25 | 1.5 | 1.75;

export const VOICE_SPEED_LABELS: Record<VoiceSpeed, string> = {
  0.75: "AI speaks slowly — ideal if you're still building confidence",
  1:    "Normal interview pace",
  1.25: "Slightly faster — good for experienced speakers",
  1.5:  "Fast pace — challenge yourself",
  1.75: "Very fast — stress interview simulation",
};

export const VOICE_SPEEDS: VoiceSpeed[] = [0.75, 1, 1.25, 1.5, 1.75];

// ── Setting 2: AI Interviewer Voice ──────────────────────────────────────────
export type VoiceId = 'priya' | 'arjun' | 'sarah' | 'marcus';

export interface VoiceOption {
  id: VoiceId;
  name: string;
  emoji: string;
  descriptor: string;
  accent: string;
  elevenLabsEnvKey: string; // maps to NEXT_PUBLIC_ELEVENLABS_VOICE_* env var
  samplePath: string;       // /public/voice-samples/{id}.mp3
  isPro: boolean;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'priya',
    name: 'Priya',
    emoji: '👩',
    descriptor: 'Professional',
    accent: 'Indian Female',
    elevenLabsEnvKey: 'NEXT_PUBLIC_ELEVENLABS_VOICE_PRIYA',
    samplePath: '/voice-samples/priya.mp3',
    isPro: false,
  },
  {
    id: 'arjun',
    name: 'Arjun',
    emoji: '👨',
    descriptor: 'Confident',
    accent: 'Indian Male',
    elevenLabsEnvKey: 'NEXT_PUBLIC_ELEVENLABS_VOICE_ARJUN',
    samplePath: '/voice-samples/arjun.mp3',
    isPro: false,
  },
  {
    id: 'sarah',
    name: 'Sarah',
    emoji: '👩',
    descriptor: 'MNC-Ready',
    accent: 'US Female',
    elevenLabsEnvKey: 'NEXT_PUBLIC_ELEVENLABS_VOICE_SARAH',
    samplePath: '/voice-samples/sarah.mp3',
    isPro: false,
  },
  {
    id: 'marcus',
    name: 'Marcus',
    emoji: '👨',
    descriptor: 'Formal',
    accent: 'UK Male',
    elevenLabsEnvKey: 'NEXT_PUBLIC_ELEVENLABS_VOICE_MARCUS',
    samplePath: '/voice-samples/marcus.mp3',
    isPro: false, // Unlocked
  },
];

// ── Setting 3: Interview Style ────────────────────────────────────────────────
export type PressureStyle = 'supportive' | 'professional' | 'pressure';

export interface PressureStyleOption {
  id: PressureStyle;
  emoji: string;
  label: string;
  uiCopy: string;
  systemPrompt: string;
}

export const PRESSURE_STYLE_OPTIONS: PressureStyleOption[] = [
  {
    id: 'supportive',
    emoji: '😊',
    label: 'Supportive',
    uiCopy: 'Be encouraging. Give hints if candidate struggles. Suitable for first-time practice.',
    systemPrompt: 'Be warm and encouraging. If the candidate struggles, offer gentle hints. Acknowledge good answers positively.',
  },
  {
    id: 'professional',
    emoji: '🎯',
    label: 'Professional',
    uiCopy: 'Standard corporate interview tone. Ask follow-ups naturally. No hints.',
    systemPrompt: 'Maintain a professional, neutral corporate interview tone. Ask natural follow-up questions. Do not offer hints.',
  },
  {
    id: 'pressure',
    emoji: '💼',
    label: 'Pressure',
    uiCopy: 'Stress interview mode. Challenge every answer. Rapid follow-ups.',
    systemPrompt: "Conduct a high-pressure stress interview. Challenge answers with skeptical follow-ups. Do not accept vague responses. Ask 'Why?' and 'Give me a specific example' after every answer.",
  },
];

// ── Setting 4: AI Response Timing ────────────────────────────────────────────
export type ResponseTiming = 'instant' | 'natural' | 'thoughtful';

export interface ResponseTimingOption {
  id: ResponseTiming;
  emoji: string;
  label: string;
  delayMs: number;
  useCase: string;
}

export const RESPONSE_TIMING_OPTIONS: ResponseTimingOption[] = [
  {
    id: 'instant',
    emoji: '⚡',
    label: 'Instant',
    delayMs: 300,
    useCase: 'Fast-paced stress practice',
  },
  {
    id: 'natural',
    emoji: '⏱️',
    label: 'Natural',
    delayMs: 1200,
    useCase: 'Mimics real human interviewer pause',
  },
  {
    id: 'thoughtful',
    emoji: '🤔',
    label: 'Thoughtful',
    delayMs: 2500,
    useCase: 'Beginners who need processing time',
  },
];

// ── Composite Settings Interface ──────────────────────────────────────────────
export interface InterviewSettings {
  voiceSpeed: VoiceSpeed;
  voiceId: VoiceId;
  pressureStyle: PressureStyle;
  responseTiming: ResponseTiming;
  // NOTE: no feedbackMode — feedback is always-on per spec §5
}

export const DEFAULT_SETTINGS: InterviewSettings = {
  voiceSpeed: 1,
  voiceId: 'priya',
  pressureStyle: 'professional',
  responseTiming: 'natural',
};

// ── Session Config (derived from settings) ────────────────────────────────────
export interface SessionConfig {
  elevenLabsVoiceId: string;   // for ElevenLabs TTS (future)
  voiceSpeed: number;           // for ElevenLabs speed param / Gemini prompt
  systemPromptAddons: string;   // injected into Gemini system instruction
  responseDelayMs: number;      // delay before AI initial prompt
}
