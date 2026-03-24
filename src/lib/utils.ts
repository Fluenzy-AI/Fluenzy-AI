import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parse number - prevents NaN display in UI
 */
export function safeNum(val: unknown, fallback: number = 0): number {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

/**
 * Format number with NaN safety
 */
export function formatNum(val: unknown, fallback: string = '0'): string {
  const num = safeNum(val);
  return num.toLocaleString() || fallback;
}

/**
 * Get relative time string from date
 */
export function getRelativeTime(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "1 month ago";
  return `${Math.floor(diffDays / 30)} months ago`;
}

// Technical keywords for scoring
const TECHNICAL_KEYWORDS = [
  'python', 'javascript', 'java', 'react', 'node', 'api', 'database', 'sql', 'mongodb', 'aws', 'docker', 'kubernetes',
  'machine learning', 'ml', 'ai', 'data science', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'model', 'algorithm',
  'regression', 'classification', 'neural network', 'deep learning', 'nlp', 'computer vision', 'cloud', 'serverless',
  'microservices', 'agile', 'scrum', 'git', 'ci/cd', 'testing', 'automation', 'security', 'blockchain', 'iot'
];

// Hindi words for Hinglish detection
const HINDI_WORDS = ['main', 'hai', 'ka', 'ki', 'ke', 'ko', 'se', 'mein', 'par', 'aur', 'ye', 'wo', 'kya', 'kuch', 'bahut'];

export function calculateInterviewScore(transcripts: any[], duration?: number): { score: number, status: string, subScores: { technical: number, communication: number, grammar: number, confidence: number } } {
  if (!transcripts || transcripts.length === 0) {
    return { score: 0, status: 'Incomplete', subScores: { technical: 0, communication: 0, grammar: 0, confidence: 0 } };
  }

  const userAnswers = transcripts.map(t => t.userAnswer || '').filter(a => a.trim().length > 0);

  if (userAnswers.length === 0) {
    return { score: 0, status: 'Incomplete', subScores: { technical: 0, communication: 0, grammar: 0, confidence: 0 } };
  }

  const allText = userAnswers.join(' ').toLowerCase();
  const totalWords = userAnswers.reduce((sum, answer) => sum + answer.split(' ').length, 0);
  const avgWordsPerAnswer = totalWords / userAnswers.length;

  // Technical Knowledge (0-10)
  const foundKeywords = TECHNICAL_KEYWORDS.filter(keyword => allText.includes(keyword));
  let technical = 0;
  if (foundKeywords.length === 0) technical = 0;
  else if (foundKeywords.length <= 2) technical = 4;
  else technical = Math.min(7 + (foundKeywords.length - 3), 9);
  if (allText.includes('pixora') || allText.includes('api')) technical = Math.max(technical, 5);

  // Communication (0-10)
  let communication = 0;
  if (avgWordsPerAnswer < 3) communication = 2;
  else if (avgWordsPerAnswer <= 15) communication = 5;
  else communication = 8;

  // Grammar & Confidence (0-10) - baseline 5 if readable
  let grammar = 5; // Default for readable English
  let confidence = 5; // Default

  // Check for excessive fillers or silence
  const fillers = (allText.match(/\b(umm?|uhh?|er|like)\b/gi) || []).length;
  if (fillers > totalWords * 0.1) { // More than 10% fillers
    confidence = Math.max(confidence - 2, 2);
  }

  // If Hinglish, adjust
  const hasHinglish = HINDI_WORDS.some(word => allText.includes(word));
  if (hasHinglish) {
    grammar = Math.min(grammar, 6);
    confidence = Math.min(confidence, 6);
  }

  const subScores = { technical, communication, grammar, confidence };
  const totalSubScore = technical + communication + grammar + confidence;
  const score = Math.round((totalSubScore / 40) * 100);

  const status = score >= 71 ? 'Excellent' : score >= 31 ? 'Good' : 'Needs Practice';

  return { score, status, subScores };
}
