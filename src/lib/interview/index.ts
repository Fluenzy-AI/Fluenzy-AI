// ─── FluenzyAI — Interview Engine Public API ──────────────────────────────────
// Barrel export: consumers import from '@/lib/interview' instead of deep paths.

// Core
export { InterviewStateMachine } from './core/InterviewStateMachine';
export type { InterviewState, StateChangeListener } from './core/InterviewStateMachine';

export {
  createSessionIdentity,
  createInterviewConfig,
  resolveGeminiVoiceName,
  getResponseDelayMs,
  sessionLabel,
} from './core/SessionConfig';
export type { SessionIdentity, InterviewConfig, SessionMeta } from './core/SessionConfig';

// Audio
export { AudioPlaybackManager } from './audio/AudioPlaybackManager';
export type { PlaybackEvent, ScheduleResult } from './audio/AudioPlaybackManager';

export { MicrophoneManager } from './audio/MicrophoneManager';
export type { MicFrame, MicState } from './audio/MicrophoneManager';

export { ManualVAD } from './audio/ManualVAD';
export type { VADOptions, VADCallbacks } from './audio/ManualVAD';

// Transcript
export { TranscriptManager } from './transcript/TranscriptManager';
export type { InterviewTurn, TurnStatus } from './transcript/TranscriptManager';

// Session
export { GracefulShutdownCoordinator, evaluateAllAnswers, getCompletionEndpoint } from './session/GracefulShutdownCoordinator';
export type { ShutdownStep, ShutdownResult, EvaluatedTranscript } from './session/GracefulShutdownCoordinator';

// Hook
export { useInterviewEngine } from './useInterviewEngine';
export type { UseInterviewEngineOptions, UseInterviewEngineReturn } from './useInterviewEngine';
