'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SessionState,
  LiveScores,
  TranscriptEntry,
  BehavioralAlert,
  AIQuestion,
  CandidateProfile,
} from '@/types/interview';

const DEFAULT_STATE: SessionState = {
  sessionId: null,
  status: 'PENDING',
  mode: 'MOBILE',
  candidate: null,
  scores: null,
  transcript: [],
  alerts: [],
  aiQuestions: [],
  consentGiven: false,
  startedAt: null,
  elapsedSeconds: 0,
  mobileConnected: false, // v2.0
};

// ─── Simulated AI data (swap for real Socket.IO in production) ────────────────

const SIMULATED_TRANSCRIPTS: Omit<TranscriptEntry, 'id'>[] = [
  { speakerRole: 'interviewer', text: 'Can you walk me through your experience with scalable backend systems?', startTime: 5, endTime: 12, relevanceScore: 0.95 },
  { speakerRole: 'candidate', text: 'Sure! At my last role I designed a microservices architecture on AWS that handled 50k requests per second. We used Kafka for event streaming and Redis for caching.', startTime: 14, endTime: 28, relevanceScore: 0.92, starCompliance: 0.88 },
  { speakerRole: 'interviewer', text: 'What was your biggest technical challenge there?', startTime: 30, endTime: 35, relevanceScore: 0.90 },
  { speakerRole: 'candidate', text: 'Honestly, umm, the hardest part was... the distributed tracing. We had latency spikes that were really hard to diagnose across services.', startTime: 37, endTime: 52, relevanceScore: 0.85, starCompliance: 0.74 },
  { speakerRole: 'interviewer', text: 'How did you resolve that?', startTime: 54, endTime: 57, relevanceScore: 0.88 },
  { speakerRole: 'candidate', text: 'We implemented Jaeger for distributed tracing and added structured logging with correlation IDs. Reduced our mean time to debug from hours to minutes.', startTime: 59, endTime: 72, relevanceScore: 0.96, starCompliance: 0.93 },
  { speakerRole: 'interviewer', text: 'How do you handle team conflict during high-pressure deployments?', startTime: 75, endTime: 82, relevanceScore: 0.80 },
  { speakerRole: 'candidate', text: 'I believe in, like, structured communication. We hold a quick sync, identify blockers, assign owners and keep a shared doc of decisions.', startTime: 84, endTime: 97, relevanceScore: 0.83, starCompliance: 0.71 },
];

const SIMULATED_ALERTS: Omit<BehavioralAlert, 'id' | 'timestamp'>[] = [
  { alertType: 'FILLER_OVERUSE', severity: 'INFO', message: 'Candidate used 3 filler words ("umm", "like") in last 2 responses. Consider probing deeper.' },
  { alertType: 'STRESS_SPIKE', severity: 'WARNING', message: 'Micro-expression analysis detected elevated stress when asked about conflict resolution. Follow up.' },
  { alertType: 'LONG_PAUSE', severity: 'INFO', message: 'Notable pause (4.2s) before technical challenge answer — possible memory retrieval or fabrication.' },
  { alertType: 'CONTRADICTION', severity: 'WARNING', message: 'Candidate said "hours to debug" but earlier claimed "strong observability". Probe consistency.' },
];

const SIMULATED_QUESTIONS: AIQuestion[] = [
  { id: 'q1', text: 'You mentioned Kafka for streaming — how did you handle consumer lag during traffic spikes?', type: 'DEPTH_PROBE', triggerReason: 'Candidate mentioned Kafka but did not elaborate on challenges.' },
  { id: 'q2', text: 'Walk me through a time your debugging decision caused a production incident. What did you learn?', type: 'STRESS_TEST', triggerReason: 'Stress spike detected on conflict/high-pressure topic.' },
  { id: 'q3', text: 'Earlier you said latency was your biggest challenge, but how does that square with your observability setup?', type: 'CONTRADICTION', triggerReason: 'Potential inconsistency between observability claim and debug time.' },
  { id: 'q4', text: 'How would you re-architect this system if you had to reduce cloud costs by 40%?', type: 'TECHNICAL', triggerReason: 'Depth probe on architecture decision-making.' },
];

function generateScore(base: number, variance: number, time: number): number {
  const noise = Math.sin(time * 0.3) * variance + Math.cos(time * 0.7) * (variance * 0.5);
  return Math.min(100, Math.max(20, base + noise));
}

// ─────────────────────────────────────────────────────────────────────────────

export function useInterviewSession(sessionId?: string, candidate?: CandidateProfile | null) {
  const [state, setState] = useState<SessionState>({
    ...DEFAULT_STATE,
    sessionId: sessionId || null,
    candidate: candidate || null,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptIndexRef = useRef(0);
  const alertIndexRef = useRef(0);
  const questionsSentRef = useRef(false);

  // Start simulation once session is ACTIVE
  const startSimulation = useCallback(() => {
    let tick = 0;

    simulationRef.current = setInterval(() => {
      tick++;

      const scores: LiveScores = {
        communication: generateScore(72, 8, tick),
        technical: generateScore(81, 6, tick),
        confidence: generateScore(65, 12, tick),
        behavioral: generateScore(70, 9, tick),
        composite: 0,
        updatedAt: Date.now(),
      };
      scores.composite = Math.round(
        scores.communication * 0.30 +
        scores.technical * 0.30 +
        scores.confidence * 0.20 +
        scores.behavioral * 0.20
      );

      setState(prev => ({ ...prev, scores }));

      if (tick % 7 === 0 && transcriptIndexRef.current < SIMULATED_TRANSCRIPTS.length) {
        const entry: TranscriptEntry = {
          id: `t-${Date.now()}-${transcriptIndexRef.current}`,
          ...SIMULATED_TRANSCRIPTS[transcriptIndexRef.current],
        };
        setState(prev => ({ ...prev, transcript: [...prev.transcript, entry] }));
        transcriptIndexRef.current++;
      }

      if (tick % 10 === 0 && alertIndexRef.current < SIMULATED_ALERTS.length) {
        const alert: BehavioralAlert = {
          id: `a-${Date.now()}-${alertIndexRef.current}`,
          timestamp: Date.now(),
          ...SIMULATED_ALERTS[alertIndexRef.current],
        };
        setState(prev => ({ ...prev, alerts: [alert, ...prev.alerts] }));
        alertIndexRef.current++;
      }

      if (tick === 15 && !questionsSentRef.current) {
        questionsSentRef.current = true;
        setState(prev => ({ ...prev, aiQuestions: SIMULATED_QUESTIONS }));
      }
    }, 2000);
  }, []);

  // Elapsed time counter
  useEffect(() => {
    if (state.status === 'ACTIVE' && state.startedAt) {
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          elapsedSeconds: Math.floor((Date.now() - (prev.startedAt || Date.now())) / 1000),
        }));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.status, state.startedAt]);

  // v2.0 — Mark mobile as connected (called when socket DEVICE_JOINED fires)
  const confirmMobileConnected = useCallback(() => {
    setState(prev => ({ ...prev, mobileConnected: true, status: 'CONSENT_PENDING' }));
  }, []);

  const activateSession = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'ACTIVE',
      consentGiven: true,
      startedAt: Date.now(),
    }));
    startSimulation();
  }, [startSimulation]);

  const endSession = useCallback(() => {
    if (simulationRef.current) clearInterval(simulationRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setState(prev => ({ ...prev, status: 'ENDED' }));
  }, []);

  const pauseSession = useCallback(() => {
    if (simulationRef.current) clearInterval(simulationRef.current);
    setState(prev => ({ ...prev, status: 'PAUSED' }));
  }, []);

  const resumeSession = useCallback(() => {
    setState(prev => ({ ...prev, status: 'ACTIVE' }));
    startSimulation();
  }, [startSimulation]);

  const dismissQuestion = useCallback((questionId: string) => {
    setState(prev => ({
      ...prev,
      aiQuestions: prev.aiQuestions.filter(q => q.id !== questionId),
    }));
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(a => a.id !== alertId),
    }));
  }, []);

  useEffect(() => {
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    ...state,
    confirmMobileConnected,
    activateSession,
    endSession,
    pauseSession,
    resumeSession,
    dismissQuestion,
    dismissAlert,
  };
}
