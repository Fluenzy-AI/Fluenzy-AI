// ─── FluenzyAI — Interview Settings Store (localStorage-based) ───────────────
// No Zustand dependency. Uses localStorage for instant persistence.
// DB sync is background-only, debounced 3s. Zero API calls on page load.

import {
  InterviewSettings,
  DEFAULT_SETTINGS,
  VoiceSpeed,
  VoiceId,
  PressureStyle,
  ResponseTiming,
} from '@/types/interviewSettings';

const STORAGE_KEY = 'fluenzy_interview_settings_v1';

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Read settings from localStorage (instant, no API call).
 * Falls back to DEFAULT_SETTINGS if nothing is stored or parse fails.
 */
export function getInterviewSettings(): InterviewSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<InterviewSettings>;
    return {
      voiceSpeed:     parsed.voiceSpeed     ?? DEFAULT_SETTINGS.voiceSpeed,
      voiceId:        parsed.voiceId        ?? DEFAULT_SETTINGS.voiceId,
      pressureStyle:  parsed.pressureStyle  ?? DEFAULT_SETTINGS.pressureStyle,
      responseTiming: parsed.responseTiming ?? DEFAULT_SETTINGS.responseTiming,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Write settings to localStorage immediately and trigger a background DB sync.
 */
export function saveInterviewSettings(settings: InterviewSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    scheduleSyncToDb(settings);
  } catch {
    // localStorage quota exceeded — fail silently
  }
}

// Individual setters (convenience wrappers)
export function setVoiceSpeed(value: VoiceSpeed): InterviewSettings {
  const s = { ...getInterviewSettings(), voiceSpeed: value };
  saveInterviewSettings(s);
  return s;
}

export function setVoiceId(value: VoiceId): InterviewSettings {
  const s = { ...getInterviewSettings(), voiceId: value };
  saveInterviewSettings(s);
  return s;
}

export function setPressureStyle(value: PressureStyle): InterviewSettings {
  const s = { ...getInterviewSettings(), pressureStyle: value };
  saveInterviewSettings(s);
  return s;
}

export function setResponseTiming(value: ResponseTiming): InterviewSettings {
  const s = { ...getInterviewSettings(), responseTiming: value };
  saveInterviewSettings(s);
  return s;
}

export function resetToDefaults(): InterviewSettings {
  saveInterviewSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

// ── DB Sync (background, debounced 3s) ────────────────────────────────────────

let syncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSyncToDb(settings: InterviewSettings): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncToDb(settings), 3000);
}

async function syncToDb(settings: InterviewSettings): Promise<void> {
  try {
    await fetch('/api/user/interview-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  } catch {
    // Background sync failure is non-critical — settings are in localStorage
  }
}

/**
 * Load settings from DB in background and reconcile with localStorage.
 * Call once on app mount (e.g., in a settings panel). Non-blocking.
 */
export async function syncFromDb(): Promise<InterviewSettings> {
  const localSettings = getInterviewSettings();
  try {
    const response = await fetch('/api/user/interview-settings');
    if (!response.ok) return localSettings;
    const dbSettings = await response.json() as Partial<InterviewSettings> | null;
    if (!dbSettings) return localSettings;
    // DB wins for cross-device sync
    const merged: InterviewSettings = {
      voiceSpeed:     dbSettings.voiceSpeed     ?? localSettings.voiceSpeed,
      voiceId:        dbSettings.voiceId        ?? localSettings.voiceId,
      pressureStyle:  dbSettings.pressureStyle  ?? localSettings.pressureStyle,
      responseTiming: dbSettings.responseTiming ?? localSettings.responseTiming,
    };
    // Update localStorage with DB values for offline fallback
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return localSettings;
  }
}
