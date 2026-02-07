
export enum ModuleType {
  ENGLISH_LEARNING = 'ENGLISH_LEARNING',
  CONVERSATION_PRACTICE = 'CONVERSATION_PRACTICE',
  HR_INTERVIEW = 'HR_INTERVIEW',
  TECH_INTERVIEW = 'TECH_INTERVIEW',
  COMPANY_SPECIFIC = 'COMPANY_SPECIFIC',
  FULL_MOCK = 'FULL_MOCK',
  COMPANY_WISE_HR = 'COMPANY_WISE_HR',
  GD_DISCUSSION = 'GD_DISCUSSION'
}

export enum GDRole {
  INITIATOR = 'Initiator',
  INFO_PROVIDER = 'Information Provider',
  ANALYZER = 'Analyzer',
  MODERATOR = 'Moderator',
  SUPPORTER = 'Supporter',
  CHALLENGER = 'Challenger',
  CONCLUDER = 'Summarizer'
}

export enum ProficiencyLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced'
}

export interface UserScores {
  englishSpeaking: number;
  grammarAccuracy: number;
  pronunciation: number;
  hrInterview: number;
  technicalInterview: number;
  confidence: number;
  readiness: number;
}

export interface Mistake {
  id: string;
  type: 'Grammar' | 'Communication' | 'Confidence' | 'Structure';
  whatWentWrong: string;
  howToCorrect: string;
  correctExample: string;
}

export interface QAPair {
  speaker: string; // The character speaking (e.g., 'Chandni [Initiator]', 'Candidate (You)', 'Moderator')
  text: string;    // The actual spoken content
  ideal?: string;
  explanation?: string;
  evaluation?: string;
  timestamp: string;
  isStrongMoment?: boolean;
  isWeakMoment?: boolean;
}

// Added InterviewQA interface to store structured question-answer pairs with metrics
export interface InterviewQA {
  question: string;
  answer: string;
  ideal?: string;
  explanation?: string;
  evaluation?: string;
  duration?: string;
  timestamp: string;
  isStrongMoment?: boolean;
  isWeakMoment?: boolean;
}

export interface SessionRecord {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number | null;
  type: ModuleType;
  topic: string;
  score: number;
  feedback: string;
  company?: string;
  role?: string;
  level?: string;
  gdRole?: GDRole;
  resumeUsed: boolean;
  resultStatus: 'Selected' | 'Rejected' | 'Borderline';
  readinessLevel: 'Interview Ready' | 'Needs Practice' | 'Fluent Speaker';
  transcript: QAPair[]; // Stores exact conversation
  qaPairs?: InterviewQA[]; // Added qaPairs for structured interview analysis
  strengths: string[];
  weaknesses: string[];
  mistakes: Mistake[];
  skillScores: {
    communication: number;
    confidence: number;
    clarity: number;
    hrReadiness: number;
    companyFit: number;
    content: number;
  };
  analytics: {
    totalSpeakingTime: string;
    avgAnswerLength: string;
    pauseTime: string;
    responseSpeed: 'Fast' | 'Optimal' | 'Slow';
    talkingBalance: 'Under-talking' | 'Good' | 'Over-talking';
  };
  actionPlan: string[];
}

export interface Lesson {
  id: string;
  title: string;
  isCompleted: boolean;
  isLocked: boolean;
  score?: number;
}

export interface LevelProgress {
  level: ProficiencyLevel;
  lessons: Lesson[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture?: string;
  careerGoal: string;
  jobRole: string;
  experienceLevel: string;
  proficiency: ProficiencyLevel;
  isPro: boolean;
  scores: UserScores;
  history: SessionRecord[];
  learningPath: LevelProgress[];
  hrLearningPath: LevelProgress[];
}