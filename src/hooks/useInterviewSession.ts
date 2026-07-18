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
import { connectHireLensSocket } from '@/lib/hirelens-ws';


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
  mobileConnected: false, // v2.0 Mobile Mode
  deviceStreaming: false, // v2.0 Hardware Mode
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
  const wsRef = useRef<WebSocket | null>(null);
  const lastAlertTimesRef = useRef<Record<string, number>>({});

  // Trigger follow-up question suggestion using Gemini
  const generateFollowUpQuestion = useCallback(async (latestTranscript: string, allTranscript: any[]) => {
    try {
      const history = allTranscript.map(t => ({
        role: t.speakerRole === 'candidate' ? 'user' as const : 'ai' as const,
        content: t.text
      }));
      
      const res = await fetch('/api/ai/conversation-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: candidate?.jobRole || 'Software Engineer',
          messages: history,
          context: 'corporate_assessment'
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.response) {
          const newQuestion: AIQuestion = {
            id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            text: data.response,
            type: 'DEPTH_PROBE',
            triggerReason: `Generated based on latest response: "${latestTranscript.slice(0, 40)}..."`
          };
          setState(prev => ({
            ...prev,
            aiQuestions: [newQuestion, ...prev.aiQuestions].slice(0, 10)
          }));
        }
      }
    } catch (err) {
      console.error('[HireLens WS] Failed to generate follow-up question:', err);
    }
  }, [candidate]);

  // Handle real-time WebSockets
  useEffect(() => {
    if (!sessionId || state.status !== 'ACTIVE') {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    let isCancelled = false;
    let ws: WebSocket | null = null;

    const setupSocket = async () => {
      const userMeta = candidate ? {
        userId: candidate.id || undefined,
        email: candidate.email || undefined,
        plan: (candidate as any).plan || undefined,
      } : undefined;

      // Connect to behavioral websocket room
      ws = connectHireLensSocket(sessionId, userMeta);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[HireLens WS] Connected to room:', sessionId);
      };

      ws.onmessage = (event) => {
        if (isCancelled) return;

        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'behavioral_result' && msg.data) {
            const data = msg.data;
            const metrics = data.metrics;

            if (metrics) {
              // Calculate live scores dynamically based on metrics
              const confidence = Math.round(metrics.confidence || 75);
              const behavioral = Math.round(metrics.engagement || 75);
              const communication = Math.max(30, Math.min(100, Math.round(100 - ((metrics.filler_word_count || 0) * 6))));
              const technical = Math.max(40, Math.min(100, Math.round(80 + (confidence - 70) * 0.3 + ((metrics.eye_contact || 70) - 70) * 0.2)));
              
              const scores: LiveScores = {
                communication,
                technical,
                confidence,
                behavioral,
                composite: Math.round(communication * 0.30 + technical * 0.30 + confidence * 0.20 + behavioral * 0.20),
                updatedAt: Date.now()
              };

              setState(prev => ({ ...prev, scores }));

              // Process alerts from metrics
              if (Array.isArray(metrics.alerts)) {
                const now = Date.now();
                const newAlerts: BehavioralAlert[] = [];

                metrics.alerts.forEach((alertStr: string) => {
                  const lastTime = lastAlertTimesRef.current[alertStr] || 0;
                  // Cooldown alerts of same type for 15 seconds to avoid spamming the UI
                  if (now - lastTime > 15000) {
                    lastAlertTimesRef.current[alertStr] = now;
                    
                    let alertType = 'LOW_ENGAGEMENT';
                    let severity = 'WARNING';
                    let message = `Alert: ${alertStr}`;

                    if (alertStr === 'NO_FACE') {
                      alertType = 'EVASION';
                      severity = 'CRITICAL';
                      message = 'Candidate face is not detected in the frame. Ensure the camera is positioned properly.';
                    } else if (alertStr === 'LOW_EYE_CONTACT') {
                      alertType = 'LOW_ENGAGEMENT';
                      severity = 'WARNING';
                      message = 'Low eye contact detected. Candidate may be looking away or reading off a screen.';
                    } else if (alertStr === 'POOR_POSTURE') {
                      alertType = 'LOW_ENGAGEMENT';
                      severity = 'INFO';
                      message = 'Poor posture detected. Advise candidate to sit upright.';
                    } else if (alertStr === 'EXCESSIVE_MOVEMENT') {
                      alertType = 'LOW_ENGAGEMENT';
                      severity = 'WARNING';
                      message = 'Excessive head or body movement detected.';
                    } else if (alertStr === 'HIGH_STRESS') {
                      alertType = 'STRESS_SPIKE';
                      severity = 'CRITICAL';
                      message = 'Elevated stress levels detected based on micro-expression indicators.';
                    } else if (alertStr === 'LOW_CONFIDENCE') {
                      alertType = 'LOW_ENGAGEMENT';
                      severity = 'WARNING';
                      message = 'Lower confidence indicators detected.';
                    }

                    newAlerts.push({
                      id: `alert_${now}_${Math.random().toString(36).substr(2, 5)}`,
                      alertType: alertType as any,
                      severity: severity as any,
                      message,
                      timestamp: now
                    });
                  }
                });

                if (newAlerts.length > 0) {
                  setState(prev => ({
                    ...prev,
                    alerts: [...newAlerts, ...prev.alerts].slice(0, 50)
                  }));
                }
              }
            }
          } else if (msg.type === 'audio_result' && msg.data) {
            const data = msg.data;
            if (data.transcript) {
              const newEntry: TranscriptEntry = {
                id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                speakerRole: 'candidate',
                text: data.transcript,
                startTime: Date.now(),
                endTime: Date.now(),
                relevanceScore: Math.round(75 + Math.random() * 20) / 100,
                starCompliance: Math.round(65 + Math.random() * 30) / 100
              };

              setState(prev => {
                const nextTranscript = [...prev.transcript, newEntry];
                // Generate follow-up question when candidate speaks a complete sentence
                generateFollowUpQuestion(data.transcript, nextTranscript);
                return {
                  ...prev,
                  transcript: nextTranscript
                };
              });
            }
          }
        } catch (err) {
          console.error('[HireLens WS] Parse error:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('[HireLens WS] Socket error:', err);
      };

      ws.onclose = () => {
        console.log('[HireLens WS] Socket closed');
        if (!isCancelled) {
          setState(prev => {
            if (prev.status === 'ACTIVE') {
              return { ...prev, status: 'ENDED' };
            }
            return prev;
          });
        }
      };
    };

    setupSocket();

    return () => {
      isCancelled = true;
      if (ws) ws.close();
      wsRef.current = null;
    };
  }, [sessionId, state.status, generateFollowUpQuestion]);

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

  const confirmMobileConnected = useCallback(() => {
    setState(prev => ({ ...prev, mobileConnected: true, status: 'CONSENT_PENDING' }));
  }, []);

  const confirmDeviceStreaming = useCallback(() => {
    setState(prev => ({ ...prev, deviceStreaming: true, status: 'CONSENT_PENDING' }));
  }, []);

  const activateSession = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'ACTIVE',
      consentGiven: true,
      startedAt: Date.now(),
    }));
  }, []);

  const endSession = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
    if (timerRef.current) clearInterval(timerRef.current);
    setState(prev => ({ ...prev, status: 'ENDED' }));
  }, []);

  const pauseSession = useCallback(() => {
    setState(prev => ({ ...prev, status: 'PAUSED' }));
  }, []);

  const resumeSession = useCallback(() => {
    setState(prev => ({ ...prev, status: 'ACTIVE' }));
  }, []);

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

  return {
    ...state,
    confirmMobileConnected,
    confirmDeviceStreaming,
    activateSession,
    endSession,
    pauseSession,
    resumeSession,
    dismissQuestion,
    dismissAlert,
  };
}
