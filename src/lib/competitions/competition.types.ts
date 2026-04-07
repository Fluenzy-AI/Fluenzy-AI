// ═══════════════════════════════════════════════════════════════════════════════
// Competition & Battle System - TypeScript Types
// ═══════════════════════════════════════════════════════════════════════════════

import { 
  CompetitionScope, 
  CompetitionType, 
  CompetitionStatus,
  CompetitionModuleType,
  CompetitionParticipantStatus,
  RewardType,
  BadgeType
} from '@prisma/client';

// ─── Competition Types ─────────────────────────────────────────────────────────

export interface CompetitionCreateInput {
  name: string;
  description?: string;
  scope: CompetitionScope;
  type: CompetitionType;
  startDate: string; // ISO 8601
  endDate: string;
  registrationDeadline?: string;
  durationPerModule: number; // seconds
  maxAttempts?: number;
  participantLimit?: number;
  prizePool?: string;
  bannerUrl?: string;
  universityNames?: string[]; // for UNIVERSITY scope
  // GD Battle specific settings
  minGDParticipants?: number; // 2-5, min participants per GD room
  maxGDParticipants?: number; // 3-8, max participants per GD room
  modules: CompetitionModuleInput[];
  rewards: CompetitionRewardInput[];
}

export interface CompetitionModuleInput {
  moduleType: CompetitionModuleType;
  weight: number; // must sum to 100
  order: number;
  config?: Record<string, unknown>;
}

export interface CompetitionRewardInput {
  rankFrom: number;
  rankTo: number;
  rewardType: RewardType;
  rewardTitle: string;
  rewardValue?: string;
}

export interface CompetitionListQuery {
  scope?: CompetitionScope;
  status?: CompetitionStatus;
  type?: CompetitionType;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'startDate' | 'createdAt' | 'participantCount';
  sortOrder?: 'asc' | 'desc';
  collegeAdminId?: string; // for college admin filtering
}

export interface CompetitionListResponse {
  competitions: CompetitionWithStats[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CompetitionWithStats {
  id: string;
  name: string;
  description?: string | null;
  scope: CompetitionScope;
  type: CompetitionType;
  status: CompetitionStatus;
  startDate: Date;
  endDate: Date;
  registrationDeadline?: Date | null;
  prizePool?: string | null;
  bannerUrl?: string | null;
  participantCount: number;
  participantLimit?: number | null;
  // GD Battle specific
  minGDParticipants?: number | null;
  maxGDParticipants?: number | null;
  universities?: { universityName: string }[];
  createdAt: Date;
  isEligible?: boolean;
  isRegistered?: boolean;
}

// ─── Eligibility Types ─────────────────────────────────────────────────────────

export interface EligibilityCheckResult {
  eligible: boolean;
  reason?: string;
  alreadyRegistered: boolean;
  isRegistered?: boolean;
  participantStatus?: string;
  attemptCount?: number; // Current number of attempts used
  maxAttempts?: number; // Max attempts allowed
  hasAttemptsRemaining?: boolean; // Can user still participate
  competitionFull: boolean;
  registrationClosed: boolean;
}

// ─── Leaderboard Types ─────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  universityName?: string | null;
  collegeName?: string | null;
  totalScore: number;
  moduleScores: Record<string, number>;
  completionTime?: number | null;
  badgeType?: BadgeType | null;
  status?: string; // Participant status (REGISTERED, IN_PROGRESS, COMPLETED, etc.)
}

export interface LeaderboardResponse {
  competitionId: string;
  competitionName: string;
  lastUpdated: string;
  totalParticipants: number;
  entries: LeaderboardEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Module Scoring Types ──────────────────────────────────────────────────────

export interface ModuleEvaluation {
  pronunciationScore: number; // 0-100
  grammarScore: number;
  confidenceScore: number;
  clarityScore: number;
  fluencyScore: number;
  paceScore: number;
  communicationScore: number;
  overallModuleScore: number;
  feedback: {
    strengths: string[];
    improvements: string[];
    detailedFeedback: string;
  };
}

export interface ModuleSubmissionData {
  competitionId: string;
  moduleId: string;
  participantId: string;
  audioUrl?: string;
  textResponse?: string;
  submissionType: 'audio' | 'text' | 'mixed';
  moduleType: CompetitionModuleType;
}

export interface ModuleScoreResult {
  success: boolean;
  score: number;
  evaluation: ModuleEvaluation;
  moduleId: string;
  attemptNumber: number;
}

// ─── Battle Session Types ──────────────────────────────────────────────────────

export interface BattleSessionState {
  competitionId: string;
  userId: string;
  participantId: string;
  currentModuleIndex: number;
  completedModules: string[];
  moduleProgress?: {
    moduleId: string;
    startedAt: string;
    audioRecorded?: boolean;
    textSubmitted?: boolean;
  };
  startedAt: string;
  lastActivityAt: string;
  expiresAt: string;
  isActive: boolean;
}

// ─── Result Types ──────────────────────────────────────────────────────────────

export interface CompetitionResultDetail {
  competitionId: string;
  competitionName: string;
  userId: string;
  rank: number;
  totalScore: number;
  badgeType?: BadgeType | null;
  certificateUrl?: string | null;
  moduleBreakdown: {
    moduleType: CompetitionModuleType;
    moduleName: string;
    score: number;
    weight: number;
    weightedScore: number;
    evaluation?: ModuleEvaluation;
  }[];
  comparisonWithAverage?: {
    yourScore: number;
    averageScore: number;
    percentile: number;
  };
  completionTime: number;
  completedAt: string;
}

// ─── Analytics Types ───────────────────────────────────────────────────────────

export interface CompetitionAnalytics {
  overview: {
    totalCompetitions: number;
    activeCompetitions: number;
    totalParticipants: number;
    avgScore: number;
    completionRate: number;
  };
  scoreDistribution: { range: string; count: number }[];
  participationTrend: { date: string; count: number }[];
  topUniversities: {
    universityName: string;
    participantCount: number;
    avgScore: number;
    competitionsCount: number;
  }[];
  modulePerformance: {
    moduleType: string;
    avgScore: number;
    avgTime: number;
    completionRate: number;
  }[];
  topParticipants: {
    userId: string;
    userName: string;
    universityName?: string;
    totalScore: number;
    rank: number;
    badges: BadgeType[];
  }[];
}

// ─── API Response Types ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

// ─── User Context Types ────────────────────────────────────────────────────────

export interface CompetitionUserContext {
  userId: string;
  userRole: string;
  collegeAdminId?: string;
  collegeName?: string;
  universityName?: string;
}

// ─── RBAC Permission Types ─────────────────────────────────────────────────────

export const COMPETITION_RBAC = {
  create: {
    SUPER_ADMIN: ['GLOBAL', 'UNIVERSITY', 'COLLEGE'] as CompetitionScope[],
    ADMIN: ['GLOBAL', 'UNIVERSITY'] as CompetitionScope[],
    PORTAL_ADMIN: ['GLOBAL', 'UNIVERSITY'] as CompetitionScope[],
    COLLEGE_ADMIN: ['COLLEGE'] as CompetitionScope[],
  },
  manage: {
    SUPER_ADMIN: 'ALL',
    ADMIN: 'ALL_EXCEPT_COLLEGE',
    PORTAL_ADMIN: 'ALL_EXCEPT_COLLEGE',
    COLLEGE_ADMIN: 'OWN_COLLEGE_ONLY',
  },
  viewLeaderboard: {
    SUPER_ADMIN: 'ALL',
    ADMIN: 'ALL',
    PORTAL_ADMIN: 'ALL',
    COLLEGE_ADMIN: 'OWN_COLLEGE_ONLY',
    User: 'ELIGIBLE_COMPETITIONS_ONLY',
  },
  participate: {
    User: 'ELIGIBLE_COMPETITIONS_ONLY',
  }
} as const;

// ─── Module Config Types ───────────────────────────────────────────────────────

export interface ReadAloudConfig {
  passages: {
    text: string;
    difficulty: 'easy' | 'medium' | 'hard';
    timeLimit: number; // seconds
  }[];
}

export interface ListenAndRepeatConfig {
  audioClips: {
    audioUrl: string;
    transcript: string;
    difficulty: 'easy' | 'medium' | 'hard';
    maxPlaybacks: number;
  }[];
}

export interface ComprehensionConfig {
  passages: {
    text: string;
    questions: {
      question: string;
      options?: string[];
      correctAnswer: string;
      type: 'mcq' | 'open-ended';
    }[];
  }[];
}

export interface ConversationConfig {
  scenario: string;
  aiPersona: string;
  maxTurns: number;
  evaluationCriteria: string[];
}

export interface ExtemporaneousConfig {
  topics: {
    topic: string;
    prepTime: number; // seconds
    speakTime: number; // seconds
  }[];
}

export interface ListenAndSummarizeConfig {
  audioClips: {
    audioUrl: string;
    transcript: string; // for evaluation
    expectedKeyPoints: string[];
    minWords: number;
    maxWords: number;
  }[];
}

export type ModuleConfig = 
  | ReadAloudConfig 
  | ListenAndRepeatConfig 
  | ComprehensionConfig 
  | ConversationConfig 
  | ExtemporaneousConfig 
  | ListenAndSummarizeConfig;
