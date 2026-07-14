// ─── Fluenzy AI HireLens — Interview Types v2.0 ──────────────────────────────

export type InterviewMode = 'MOBILE' | 'HARDWARE';

export type SessionStatus =
  | 'PENDING'
  | 'AWAITING_DEVICE'   // v2.0 — pairing code shown, waiting for mobile
  | 'CONSENT_PENDING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'ENDED'
  | 'REPORT_READY';

export type Verdict = 'HIRE' | 'REVIEW' | 'REJECT';

export type AlertType =
  | 'STRESS_SPIKE'
  | 'CONTRADICTION'
  | 'EVASION'
  | 'LOW_ENGAGEMENT'
  | 'FILLER_OVERUSE'
  | 'LONG_PAUSE';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

// v2.0 — Device roles for dual-device pairing
export type DeviceRole = 'LAPTOP' | 'MOBILE';

export interface PairingSession {
  sessionId: string;
  pairingCode: string;
  qrPayload: string;          // deep link e.g. https://fluenzyai.app/pair/482913
  expiresAt: number;          // epoch ms — codes expire after 10 min
  laptopConnected: boolean;
  mobileConnected: boolean;
}

export interface SocketDeviceJoined {
  sessionId: string;
  role: DeviceRole;
  deviceInfo?: { userAgent: string; resolution?: string };
}

export interface ScoringWeights {
  communication: number; // 0–1, sum must equal 1
  technical: number;
  confidence: number;
  behavioral: number;
}

export interface LiveScores {
  communication: number; // 0–100
  technical: number;
  confidence: number;
  behavioral: number;
  composite: number;
  updatedAt: number; // epoch ms
}

export interface TranscriptEntry {
  id: string;
  speakerRole: 'candidate' | 'interviewer';
  text: string;
  startTime: number;
  endTime: number;
  relevanceScore?: number;
  starCompliance?: number;
}

export interface BehavioralAlert {
  id: string;
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: number;
}

export interface AIQuestion {
  id: string;
  text: string;
  type: 'DEPTH_PROBE' | 'STRESS_TEST' | 'CONTRADICTION' | 'TECHNICAL' | 'CULTURE_FIT';
  triggerReason: string;
}

export interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  jobRole: string;
  experienceSummary?: string;
  skills?: string[];
}

export interface SessionState {
  sessionId: string | null;
  status: SessionStatus;
  mode: InterviewMode;
  candidate: CandidateProfile | null;
  scores: LiveScores | null;
  transcript: TranscriptEntry[];
  alerts: BehavioralAlert[];
  aiQuestions: AIQuestion[];
  consentGiven: boolean;
  startedAt: number | null;
  elapsedSeconds: number;
  mobileConnected: boolean;   // v2.0 — tracks whether the capture device has paired
}

// Socket.IO event payloads
export interface SocketScoreUpdate {
  sessionId: string;
  scores: LiveScores;
}

export interface SocketTranscriptUpdate {
  sessionId: string;
  entry: TranscriptEntry;
}

export interface SocketAlertUpdate {
  sessionId: string;
  alert: BehavioralAlert;
}

export interface SocketQuestionUpdate {
  sessionId: string;
  questions: AIQuestion[];
}

export interface SocketSessionStatus {
  sessionId: string;
  status: SessionStatus;
}
