// ─── FluenzyAI — useInterviewEngine Hook ─────────────────────────────────────
// The enterprise replacement for the scattered state in VoiceAgent.tsx.
//
// This hook orchestrates:
//   • InterviewStateMachine    — single source of truth for interview phase
//   • MicrophoneManager        — mic + PCM capture
//   • ManualVAD                — speech start/end detection
//   • AudioPlaybackManager     — single-speaker guarantee (turn-ID arbitration)
//   • TranscriptManager        — per-turn transcript isolation
//   • GracefulShutdownCoordinator — idempotent interview end
//
// VoiceAgent.tsx STILL handles:
//   • Gemini Live session connect/disconnect (ai.live.connect)
//   • UI rendering
//   • Navigation (router.push)
//
// This hook decouples the business logic from React rendering.
//
// Migration path:
//   Phase 1: VoiceAgent uses this hook's managers internally (current)
//   Phase 2: Full decomposition — VoiceAgent becomes a thin controller

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { InterviewStateMachine, type InterviewState } from '@/lib/interview/core/InterviewStateMachine';
import { AudioPlaybackManager } from '@/lib/interview/audio/AudioPlaybackManager';
import { MicrophoneManager } from '@/lib/interview/audio/MicrophoneManager';
import { ManualVAD } from '@/lib/interview/audio/ManualVAD';
import { TranscriptManager, type InterviewTurn } from '@/lib/interview/transcript/TranscriptManager';
import {
  GracefulShutdownCoordinator,
  evaluateAllAnswers,
  getCompletionEndpoint,
  type EvaluatedTranscript,
} from '@/lib/interview/session/GracefulShutdownCoordinator';
import {
  createSessionIdentity,
  createInterviewConfig,
  getResponseDelayMs,
  sessionLabel,
  type SessionIdentity,
  type InterviewConfig,
  type SessionMeta,
} from '@/lib/interview/core/SessionConfig';
import type { InterviewSettings } from '@/types/interviewSettings';
import type { ModuleType } from 'LE/types';

// ── Hook Options ──────────────────────────────────────────────────────────────
export interface UseInterviewEngineOptions {
  moduleType: ModuleType | string;
  meta: SessionMeta;
  settings: InterviewSettings;
  systemInstruction: string;
  isInterviewModule: boolean;
  /** Called when graceful shutdown + save completes successfully */
  onCompleted?: (sessionId: string) => void;
  /** Called when any error occurs */
  onError?: (err: Error) => void;
}

// ── Hook Return Value ─────────────────────────────────────────────────────────
export interface UseInterviewEngineReturn {
  // State machine
  interviewState: InterviewState;
  sessionIdentity: SessionIdentity | null;
  config: InterviewConfig | null;

  // Audio state
  isAiSpeaking: boolean;
  isUserSpeaking: boolean;

  // Controls
  initSession: () => { sessionId: string; config: InterviewConfig; identity: SessionIdentity };
  cleanup: (saveResults?: boolean) => Promise<void>;
  startTurn: (turnId: string) => void;
  scheduleAudioChunk: (turnId: string, audioBuffer: AudioBuffer) => void;
  onTurnComplete: () => void;
  appendQuestion: (text: string) => void;
  appendAnswer: (text: string) => void;
  onUserSpeechStart: () => void;
  onUserSpeechEnd: () => void;
  enableVAD: (enabled: boolean) => void;
  processAudioFrame: (rmsLevel: number) => void;
  sendToGemini: (data: string) => void;  // base64 PCM passthrough

  // Microphone
  startMicrophone: () => Promise<void>;
  stopMicrophone: () => Promise<void>;
  onMicFrame: (cb: (frame: { base64Pcm: string; rmsLevel: number }) => void) => void;

  // Data
  transcriptManager: TranscriptManager | null;
  completedTurns: InterviewTurn[];
  toQAPairs: () => Array<{ question: string; answer: string; timestamp: string }>;

  // Debug
  debugState: () => object;
}

// ── Global instance counter (duplicate session detection) ─────────────────────
let _hookInstanceCount = 0;

export function useInterviewEngine(opts: UseInterviewEngineOptions): UseInterviewEngineReturn {
  _hookInstanceCount++;
  const instanceId = useRef(_hookInstanceCount);

  // ── Core Managers (stable refs — not recreated on re-render) ──────────────
  const stateMachine   = useRef<InterviewStateMachine | null>(null);
  const playbackMgr    = useRef<AudioPlaybackManager>(new AudioPlaybackManager());
  const micMgr         = useRef<MicrophoneManager | null>(null);
  const vad            = useRef<ManualVAD>(new ManualVAD({}, {}));
  const transcriptMgr  = useRef<TranscriptManager | null>(null);
  const shutdownCoord  = useRef<GracefulShutdownCoordinator>(new GracefulShutdownCoordinator());
  const micFrameCb     = useRef<((frame: { base64Pcm: string; rmsLevel: number }) => void) | null>(null);

  // ── Session identity (set once at initSession) ─────────────────────────────
  const identityRef = useRef<SessionIdentity | null>(null);
  const configRef   = useRef<InterviewConfig | null>(null);

  // ── React state (minimal — drives UI) ─────────────────────────────────────
  const [interviewState, setInterviewState] = useState<InterviewState>('IDLE');
  const [isAiSpeaking,   setIsAiSpeaking]   = useState(false);
  const [isUserSpeaking, setIsUserSpeaking]  = useState(false);
  const [completedTurns, setCompletedTurns]  = useState<InterviewTurn[]>([]);

  // ── Warn on duplicate hook instances (React Strict Mode / double-mount) ────
  useEffect(() => {
    if (instanceId.current > 1) {
      console.warn(
        `[useInterviewEngine] Instance #${instanceId.current} detected. ` +
        'If this is React Strict Mode double-mount, it will be cleaned up. ' +
        'In production, this indicates a duplicate session start.',
      );
    }
    return () => { _hookInstanceCount = Math.max(0, _hookInstanceCount - 1); };
  }, []);

  // ── initSession ───────────────────────────────────────────────────────────
  const initSession = useCallback((): {
    sessionId: string;
    config: InterviewConfig;
    identity: SessionIdentity;
  } => {
    // Prevent duplicate initialization
    if (stateMachine.current && !stateMachine.current.isTerminal) {
      console.warn('[useInterviewEngine] initSession() called while session already active');
      return {
        sessionId: identityRef.current!.sessionId,
        config: configRef.current!,
        identity: identityRef.current!,
      };
    }

    const identity = createSessionIdentity();
    const config   = createInterviewConfig(opts.settings, opts.moduleType, opts.meta, opts.systemInstruction);
    identityRef.current = identity;
    configRef.current   = config;

    console.log(`[useInterviewEngine] Session initialized: ${sessionLabel(identity, config)}`);

    // Create state machine
    const sm = new InterviewStateMachine(identity.sessionId);
    sm.addListener((prev, next) => {
      setInterviewState(next);
      // Sync AI speaking state
      if (next === 'AI_SPEAKING') setIsAiSpeaking(true);
      if (next === 'WAITING_USER' || next === 'LISTENING') setIsAiSpeaking(false);
      // Sync user speaking state
      if (next === 'USER_SPEAKING') setIsUserSpeaking(true);
      if (next !== 'USER_SPEAKING' && next !== 'LISTENING') setIsUserSpeaking(false);
    });
    stateMachine.current = sm;

    // Reset transcript manager
    transcriptMgr.current = new TranscriptManager(identity.sessionId, {
      isInterviewModule: opts.isInterviewModule,
      onTurnFinalized: (turn) => {
        setCompletedTurns((prev) => [...prev.filter((t) => t.turnId !== turn.turnId), turn]);
      },
      onCaptureFailDetected: () => {
        // Caller's onCaptureFailDetected is wired in VoiceAgent
      },
    });

    // Reset shutdown coordinator for this session
    shutdownCoord.current = new GracefulShutdownCoordinator();

    // Init audio playback (creates AudioContext)
    playbackMgr.current.init(24000);
    playbackMgr.current.resume().catch(() => {});

    // Subscribe to playback events for AI speaking state
    playbackMgr.current.addListener((event) => {
      if (event.type === 'TURN_STARTED')    setIsAiSpeaking(true);
      if (event.type === 'TURN_COMPLETED')  { setIsAiSpeaking(false); }
      if (event.type === 'TURN_CANCELLED')  { setIsAiSpeaking(false); }
    });

    // Reset VAD
    vad.current.reset();
    vad.current.updateCallbacks({
      onSpeechStart: (_ts) => {
        setIsUserSpeaking(true);
        // Barge-in: if AI was speaking, cancel immediately
        if (playbackMgr.current.isSpeaking) {
          playbackMgr.current.cancelCurrentTurn();
          stateMachine.current?.tryTransition('USER_SPEAKING', { reason: 'barge-in' });
        }
      },
      onSpeechEnd: (_ts, _dur) => {
        setIsUserSpeaking(false);
      },
    });

    return { sessionId: identity.sessionId, config, identity };
  }, [opts.settings, opts.moduleType, opts.meta, opts.systemInstruction, opts.isInterviewModule]);

  // ── Audio turn lifecycle ───────────────────────────────────────────────────
  const startTurn = useCallback((turnId: string) => {
    if (!configRef.current || !identityRef.current) return;
    const delayMs = getResponseDelayMs(configRef.current.settings);
    playbackMgr.current.startTurn(identityRef.current.sessionId, turnId, delayMs);
    stateMachine.current?.tryTransition('AI_SPEAKING', { turnId });
    // Start new transcript turn
    transcriptMgr.current?.startTurn();
    // Suppress VAD while AI speaks
    vad.current.setEnabled(false);
  }, []);

  const scheduleAudioChunk = useCallback((turnId: string, audioBuffer: AudioBuffer) => {
    if (!identityRef.current) return;
    playbackMgr.current.scheduleChunk(identityRef.current.sessionId, turnId, audioBuffer);
  }, []);

  const onTurnComplete = useCallback(() => {
    // AI finished speaking for this turn
    const turn = transcriptMgr.current?.finalizeCurrentTurn();
    if (turn) {
      console.log(`[useInterviewEngine] Turn ${turn.turnId} finalized. answer="${turn.rawAnswer.slice(0, 60)}"`);
    }
    stateMachine.current?.tryTransition('WAITING_USER');
    // Re-enable VAD now that AI has stopped
    vad.current.setEnabled(true);
    vad.current.markUserSpoke();
  }, []);

  const appendQuestion = useCallback((text: string) => {
    transcriptMgr.current?.appendQuestion(text);
  }, []);

  const appendAnswer = useCallback((text: string) => {
    transcriptMgr.current?.appendAnswer(text);
    vad.current.markUserSpoke();
  }, []);

  const onUserSpeechStart = useCallback(() => {
    setIsUserSpeaking(true);
    stateMachine.current?.tryTransition('USER_SPEAKING');
  }, []);

  const onUserSpeechEnd = useCallback(() => {
    setIsUserSpeaking(false);
    stateMachine.current?.tryTransition('PROCESSING');
  }, []);

  const enableVAD = useCallback((enabled: boolean) => {
    vad.current.setEnabled(enabled);
  }, []);

  const processAudioFrame = useCallback((rmsLevel: number) => {
    vad.current.processFrame(rmsLevel);
  }, []);

  const sendToGemini = useCallback((_data: string) => {
    // Passthrough — actual send is in VoiceAgent via sessionRef
    // This is a hook for future WorkletNode integration
  }, []);

  // ── Microphone ────────────────────────────────────────────────────────────
  const startMicrophone = useCallback(async () => {
    if (micMgr.current?.isActive) {
      console.warn('[useInterviewEngine] startMicrophone() called while already active');
      return;
    }
    micMgr.current = new MicrophoneManager({
      sampleRate: 16000,
      bufferSize: 4096,
      onFrame: (frame) => {
        micFrameCb.current?.(frame);
        // Feed RMS into VAD
        vad.current.processFrame(frame.rmsLevel);
      },
      onStateChange: (state) => {
        console.log('[useInterviewEngine] Mic state:', state);
      },
      onError: (err) => {
        console.error('[useInterviewEngine] Mic error:', err);
        opts.onError?.(err);
      },
    });
    await micMgr.current.start();
  }, [opts.onError]);

  const stopMicrophone = useCallback(async () => {
    await micMgr.current?.stop();
    micMgr.current = null;
  }, []);

  const onMicFrame = useCallback((cb: (frame: { base64Pcm: string; rmsLevel: number }) => void) => {
    micFrameCb.current = cb;
  }, []);

  // ── Cleanup (idempotent) ──────────────────────────────────────────────────
  const cleanup = useCallback(async (saveResults = false) => {
    if (!identityRef.current || !configRef.current) return;

    const coord = shutdownCoord.current;
    const sm    = stateMachine.current;
    const tm    = transcriptMgr.current;
    const pm    = playbackMgr.current;

    sm?.tryTransition('ENDING', { reason: 'cleanup called' });

    await coord.execute([
      {
        name: 'STOP_MICROPHONE',
        timeoutMs: 3000,
        fn: () => stopMicrophone(),
      },
      {
        name: 'CANCEL_AI_AUDIO',
        timeoutMs: 1000,
        fn: () => { pm.cancelCurrentTurn(); },
      },
      {
        name: 'DISABLE_VAD',
        timeoutMs: 500,
        fn: () => { vad.current.setEnabled(false); },
      },
      {
        name: 'CLOSE_AUDIO_CONTEXT',
        timeoutMs: 3000,
        fn: () => pm.close(),
      },
      ...(saveResults && tm ? [
        {
          name: 'EVALUATE_ANSWERS',
          timeoutMs: 60000, // 60s for all evaluations
          fn: async () => {
            const pairs = tm.toQAPairs();
            if (pairs.length === 0) return;

            const evaluated: EvaluatedTranscript[] = await evaluateAllAnswers(
              pairs,
              configRef.current!.moduleType as string,
              configRef.current!.meta,
            );

            const totalScore = evaluated.reduce((s, t) => s + (t.perQuestionScore ?? 0), 0);
            const aggregateScore = evaluated.length > 0 ? totalScore / evaluated.length : 0;
            const status = aggregateScore >= 6 ? 'PASS' : 'FAIL';

            await fetch('/api/sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                module: configRef.current!.moduleType,
                targetCompany: configRef.current!.meta.company,
                role: configRef.current!.meta.role,
                startTime: identityRef.current!.createdAt.toISOString(),
                endTime: new Date().toISOString(),
                transcripts: evaluated,
                aggregateScore,
                status,
              }),
            });
          },
        },
        {
          name: 'MARK_LESSON_COMPLETE',
          timeoutMs: 10000,
          fn: async () => {
            const lessonId = configRef.current!.meta.lessonId;
            if (!lessonId) return;
            const { endpoint, storageKey, moduleLabel } = getCompletionEndpoint(
              configRef.current!.moduleType as string,
            );
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lessonId }),
            });
            if (res.ok) {
              const ts = Date.now().toString();
              localStorage.setItem('usage-updated', ts);
              localStorage.setItem(`usage-updated-${moduleLabel}`, ts);
              window.dispatchEvent(
                new CustomEvent('usage-updated', { detail: { module: moduleLabel, timestamp: ts } }),
              );
              // localStorage fallback
              const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
              stored[lessonId] = true;
              localStorage.setItem(storageKey, JSON.stringify(stored));
            }
          },
        },
      ] : []),
      {
        name: 'FINALIZE_STATE',
        timeoutMs: 1000,
        fn: () => { sm?.tryTransition('COMPLETED'); },
      },
    ]);

    opts.onCompleted?.(identityRef.current.sessionId);
  }, [stopMicrophone, opts.onCompleted]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // Graceful teardown on unmount — do NOT save (just release resources)
      playbackMgr.current.close().catch(() => {});
      micMgr.current?.stop().catch(() => {});
    };
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────────
  const toQAPairs = useCallback(() => {
    return transcriptMgr.current?.toQAPairs() ?? [];
  }, []);

  const debugState = useCallback(() => ({
    stateMachine:    stateMachine.current?.toJSON(),
    playback:        playbackMgr.current.toJSON(),
    transcript:      transcriptMgr.current?.toJSON(),
    vad:             vad.current.toJSON(),
    mic:             micMgr.current?.toJSON(),
    session:         identityRef.current,
    shutdownRunning: shutdownCoord.current.isRunning,
  }), []);

  return {
    interviewState,
    sessionIdentity: identityRef.current,
    config: configRef.current,
    isAiSpeaking,
    isUserSpeaking,
    initSession,
    cleanup,
    startTurn,
    scheduleAudioChunk,
    onTurnComplete,
    appendQuestion,
    appendAnswer,
    onUserSpeechStart,
    onUserSpeechEnd,
    enableVAD,
    processAudioFrame,
    sendToGemini,
    startMicrophone,
    stopMicrophone,
    onMicFrame,
    transcriptManager: transcriptMgr.current,
    completedTurns,
    toQAPairs,
    debugState,
  };
}
