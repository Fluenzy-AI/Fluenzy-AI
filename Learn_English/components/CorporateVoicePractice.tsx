import React, { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Mic,
  MicOff,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Award,
  Target,
  Zap,
  MessageSquare,
  BookOpen,
  Headphones,
  HelpCircle,
  BarChart3,
  Star,
  Trophy,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Timer,
  Brain,
  Gauge,
  Lightbulb,
  FileText,
  Home,
} from 'lucide-react';
import { UserProfile } from '../types';

interface CorporateVoicePracticeProps {
  user: UserProfile;
}

// ==================== DATA ====================

// --- Dynamic topic/passage/question sources ---
const DYNAMIC_TOPICS = [
  'Corporate culture',
  'Leadership',
  'Workplace ethics',
  'Technology & business',
  'AI & future jobs',
  'Communication challenges',
  'Productivity & teamwork',
  'Remote vs office work',
  'Customer experience',
  'Decision-making in companies',
  'Diversity & inclusion',
  'Digital transformation',
  'Sustainability in business',
  'Crisis management',
  'Innovation',
  'Change management',
  'Employee engagement',
  'Corporate social responsibility',
  'Business strategy',
  'Hybrid work models',
];

// Utility to get a new topic/passage/question never used before for this user/section
function getNewDynamicItem(section: string, userHistory: any[], generator: () => any) {
  const usedTopics = userHistory
    .filter((h) => h.section === section)
    .map((h) => h.topic || h.title || h.passage || h.question || '');
  let candidate;
  let attempts = 0;
  do {
    candidate = generator();
    attempts++;
  } while (usedTopics.includes(candidate.topic || candidate.title || candidate.passage || candidate.question) && attempts < 10);
  return candidate;
}

// Example dynamic passage generator for Read Aloud
function generateReadAloudPassage() {
  const topic = DYNAMIC_TOPICS[Math.floor(Math.random() * DYNAMIC_TOPICS.length)];
  const now = new Date();
  return {
    id: uuidv4(),
    title: `${topic} - ${now.getFullYear()} Q${Math.ceil((now.getMonth() + 1) / 3)}`,
    text: `This passage discusses ${topic.toLowerCase()} in the context of modern organizations. It highlights recent trends, challenges, and best practices relevant to professionals.`,
    wordCount: 60 + Math.floor(Math.random() * 40),
    difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)],
    topic,
  };
}

// Example dynamic passage generator for Listen & Repeat
function generateListenRepeatPassage() {
  const topic = DYNAMIC_TOPICS[Math.floor(Math.random() * DYNAMIC_TOPICS.length)];
  return {
    id: uuidv4(),
    text: `In today's business world, ${topic.toLowerCase()} plays a crucial role in organizational success.`,
    category: topic,
    topic,
  };
}

// Example dynamic comprehension generator
function generateComprehensionPassage() {
  const topic = DYNAMIC_TOPICS[Math.floor(Math.random() * DYNAMIC_TOPICS.length)];
  return {
    id: uuidv4(),
    passage: `This audio passage covers ${topic.toLowerCase()} and its impact on workplace performance. Listen carefully to answer the questions.`,
    questions: [
      { question: `What is the main focus of this passage?`, expectedAnswer: topic },
      { question: `How does ${topic.toLowerCase()} affect employees?`, expectedAnswer: 'It impacts performance and engagement.' },
    ],
    topic,
  };
}

// Example dynamic conversation topic generator
function generateConversationTopic() {
  const topic = DYNAMIC_TOPICS[Math.floor(Math.random() * DYNAMIC_TOPICS.length)];
  return {
    id: uuidv4(),
    opener: `Let's discuss ${topic.toLowerCase()}. What are your thoughts?`,
    followUps: [
      `How is ${topic.toLowerCase()} changing in today's companies?`,
      `What challenges do professionals face regarding ${topic.toLowerCase()}?`,
      `Share an example of ${topic.toLowerCase()} from your experience.`,
    ],
    topic,
  };
}

// Example dynamic extemporaneous topic generator
function generateExtemporaneousTopic() {
  const topic = DYNAMIC_TOPICS[Math.floor(Math.random() * DYNAMIC_TOPICS.length)];
  return {
    id: uuidv4(),
    topic,
    hints: [
      `Recent trends in ${topic.toLowerCase()}`,
      `Key challenges in ${topic.toLowerCase()}`,
      `Best practices for ${topic.toLowerCase()}`,
      `Future outlook for ${topic.toLowerCase()}`,
    ],
  };
}

// Example dynamic summarize passage generator
function generateSummarizePassage() {
  const topic = DYNAMIC_TOPICS[Math.floor(Math.random() * DYNAMIC_TOPICS.length)];
  return {
    id: uuidv4(),
    title: `Summary: ${topic}`,
    passage: `This passage provides an overview of ${topic.toLowerCase()} in the corporate world, including its significance, challenges, and future prospects.`,
    keyPoints: [
      `Significance of ${topic.toLowerCase()}`,
      `Challenges in ${topic.toLowerCase()}`,
      `Future prospects of ${topic.toLowerCase()}`,
    ],
    topic,
  };
}

// Listen and Repeat passages
const listenRepeatPassages = [
  {
    id: 1,
    text: "The budget allocation for the marketing department has been approved by the finance committee. We can now proceed with the advertising campaign as planned. The team should prepare a detailed execution strategy by next week.",
    category: "Finance"
  },
  {
    id: 2,
    text: "Customer satisfaction scores have improved significantly this quarter due to our enhanced support services and reduced response time. We attribute this success to our dedicated customer service team and improved training programs.",
    category: "Customer Service"
  },
  {
    id: 3,
    text: "The board of directors has announced a strategic partnership with a leading technology company to accelerate digital transformation initiatives. This collaboration will enable us to leverage cutting-edge solutions for our clients.",
    category: "Corporate Announcements"
  },
  {
    id: 4,
    text: "All employees are reminded to complete the mandatory compliance training modules before the end of this month to maintain regulatory standards. Non-compliance may result in restricted access to certain systems.",
    category: "HR Communication"
  },
  {
    id: 5,
    text: "The quarterly revenue exceeded projections by fifteen percent, reflecting strong market demand and effective sales strategies across all regions. This performance positions us well for the annual targets.",
    category: "Business Performance"
  },
];

// Comprehension passages with questions
const comprehensionPassages = [
  {
    id: 1,
    passage: "The company has decided to implement a flexible work policy starting next month. Employees can choose to work from home up to three days per week, provided they maintain their productivity levels and attend all scheduled meetings. Department managers will monitor performance metrics to ensure business continuity. The policy will be reviewed after a six-month trial period.",
    questions: [
      { question: "How many days per week can employees work from home?", expectedAnswer: "up to three days" },
      { question: "What condition must employees meet to work from home?", expectedAnswer: "maintain productivity and attend meetings" }
    ]
  },
  {
    id: 2,
    passage: "The annual company retreat will be held at the mountain resort from December fifteenth to eighteenth. All full-time employees are invited to participate in team-building activities, workshops, and networking sessions. Registration closes on November thirtieth, and transportation will be arranged from the main office. Accommodation and meals will be provided by the company.",
    questions: [
      { question: "When is the company retreat scheduled?", expectedAnswer: "December fifteenth to eighteenth" },
      { question: "What is the registration deadline?", expectedAnswer: "November thirtieth" }
    ]
  },
  {
    id: 3,
    passage: "Due to the upcoming system upgrade, all internal applications will be unavailable from Saturday at ten PM until Sunday at six AM. Please save your work and log out before the maintenance window begins. Critical operations should be completed by Friday evening to avoid any disruption. The IT team will send a notification once systems are back online.",
    questions: [
      { question: "When does the maintenance window start?", expectedAnswer: "Saturday at ten PM" },
      { question: "By when should critical operations be completed?", expectedAnswer: "Friday evening" }
    ]
  },
];

// Conversation topics for live AI interaction
const conversationTopics = [
  {
    id: 1,
    opener: "Tell me about a challenging project you worked on and how you handled it.",
    followUps: [
      "What was the main obstacle you faced?",
      "How did you overcome those challenges?",
      "What did you learn from that experience?"
    ]
  },
  {
    id: 2,
    opener: "How do you prioritize your tasks when you have multiple deadlines?",
    followUps: [
      "Can you give me a specific example?",
      "How do you handle unexpected urgent tasks?",
      "What tools or methods do you use for time management?"
    ]
  },
  {
    id: 3,
    opener: "Describe a situation where you had to work with a difficult team member.",
    followUps: [
      "How did you approach the situation initially?",
      "What was the outcome?",
      "What would you do differently now?"
    ]
  },
  {
    id: 4,
    opener: "What motivates you to perform well at work?",
    followUps: [
      "How do you stay motivated during challenging times?",
      "Can you share a recent achievement you're proud of?",
      "How do you balance personal and professional goals?"
    ]
  },
];

// Extemporaneous speaking topics
const extemporaneousTopics = [
  {
    id: 1,
    topic: "Impact of Artificial Intelligence on Jobs",
    hints: ["Job displacement vs job creation", "Skills needed for AI era", "Industries most affected", "Future workforce adaptations"]
  },
  {
    id: 2,
    topic: "Remote Work vs Office Culture",
    hints: ["Productivity considerations", "Work-life balance", "Team collaboration challenges", "Future of workplace"]
  },
  {
    id: 3,
    topic: "Leadership in Modern Companies",
    hints: ["Transformational vs transactional", "Emotional intelligence", "Managing diverse teams", "Decision-making approaches"]
  },
  {
    id: 4,
    topic: "Work-Life Balance in Corporate Life",
    hints: ["Setting boundaries", "Mental health importance", "Flexible work arrangements", "Personal productivity"]
  },
  {
    id: 5,
    topic: "The Role of Innovation in Business Growth",
    hints: ["Disruption vs incremental change", "R&D investments", "Customer-centric innovation", "Competitive advantages"]
  },
  {
    id: 6,
    topic: "Effective Communication in the Workplace",
    hints: ["Verbal vs written communication", "Active listening", "Cross-cultural communication", "Conflict resolution"]
  },
];

// Listen and Summarize passages (longer content for AI to speak)
const listenSummarizePassages = [
  {
    id: 1,
    title: "Digital Transformation in Business",
    passage: "Digital transformation has become imperative for businesses across all industries. Companies are investing heavily in technology infrastructure, cloud computing, and data analytics to remain competitive. The shift involves not just adopting new technologies but fundamentally changing how organizations operate and deliver value to customers. Successful digital transformation requires strong leadership commitment, employee training, and a culture that embraces innovation. Many organizations face challenges including legacy system integration, cybersecurity concerns, and resistance to change. However, those who successfully navigate this transition often see improved operational efficiency, enhanced customer experiences, and new revenue streams. The key is to start with a clear strategy, prioritize initiatives based on business impact, and maintain flexibility to adapt as technologies evolve.",
    keyPoints: ["Technology investment", "Cultural change", "Leadership commitment", "Challenges and opportunities"]
  },
  {
    id: 2,
    title: "Sustainable Business Practices",
    passage: "Sustainability has moved from being a corporate social responsibility initiative to a core business strategy. Companies worldwide are recognizing that sustainable practices can drive profitability while protecting the environment. This includes reducing carbon footprint, implementing circular economy principles, and ensuring ethical supply chain management. Consumers are increasingly making purchasing decisions based on environmental impact, pushing companies to be more transparent about their practices. Regulatory frameworks are also becoming stricter, with governments implementing carbon taxes and mandatory sustainability reporting. Forward-thinking organizations are finding that sustainable practices often lead to cost savings through energy efficiency, waste reduction, and improved resource utilization. The challenge lies in balancing short-term costs with long-term benefits and measuring the true impact of sustainability initiatives.",
    keyPoints: ["Business strategy shift", "Consumer expectations", "Regulatory requirements", "Cost-benefit balance"]
  },
  {
    id: 3,
    title: "The Future of Work",
    passage: "The workplace is undergoing unprecedented transformation driven by technology, changing demographics, and evolving employee expectations. Hybrid work models are becoming the norm, with organizations redesigning physical spaces to support collaboration rather than individual work. Automation and artificial intelligence are reshaping job roles, requiring workers to continuously upskill and adapt. The gig economy continues to grow, offering flexibility but also raising questions about job security and benefits. Employee well-being has become a priority, with companies investing in mental health resources, flexible schedules, and purpose-driven work environments. Diversity, equity, and inclusion initiatives are gaining importance as organizations recognize the value of diverse perspectives. The future of work will likely feature more personalized career paths, technology-augmented roles, and a greater emphasis on human skills like creativity, empathy, and critical thinking.",
    keyPoints: ["Hybrid work models", "Skills evolution", "Employee well-being", "Diversity and inclusion"]
  },
];

// ==================== TYPES ====================

type Section = 'selector' | 'read-aloud' | 'listen-repeat' | 'comprehension' | 'conversation' | 'extemporaneous' | 'summarize' | 'scorecard';

interface SectionScore {
  section: string;
  score: number;
  feedback: string;
  completedAt: Date;
  details: {
    pronunciation?: number;
    accuracy?: number;
    fluency?: number;
    confidence?: number;
    grammar?: number;
    pace?: number;
    comprehension?: number;
    relevance?: number;
    structure?: number;
    vocabulary?: number;
    stamina?: number;
  };
}

interface OverallScorecard {
  overall: number;
  communication: number;
  confidence: number;
  grammar: number;
  speakingPace: number;
  wpm: number;
  sectionsCompleted: number;
  totalSections: number;
  sectionScores: SectionScore[];
  strengths: string[];
  improvements: string[];
  recommendation: string;
}

// Section configuration
const sectionConfig = [
  { 
    id: 'read-aloud' as Section, 
    title: 'Read Aloud', 
    description: 'Professional text reading test',
    duration: '10-15 min',
    icon: BookOpen, 
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-500/20',
    borderColor: 'border-indigo-500/30'
  },
  { 
    id: 'listen-repeat' as Section, 
    title: 'Listen & Repeat', 
    description: 'Audio accuracy test',
    duration: '10-15 min',
    icon: Headphones, 
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30'
  },
  { 
    id: 'comprehension' as Section, 
    title: 'Comprehension', 
    description: 'Listen and answer questions',
    duration: '10-15 min',
    icon: Brain, 
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30'
  },
  { 
    id: 'conversation' as Section, 
    title: 'Conversation', 
    description: 'Live corporate interaction',
    duration: '10-15 min',
    icon: MessageSquare, 
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30'
  },
  { 
    id: 'extemporaneous' as Section, 
    title: 'Extemporaneous', 
    description: 'Random topic speaking',
    duration: '5-10 min',
    icon: Lightbulb, 
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30'
  },
  { 
    id: 'summarize' as Section, 
    title: 'Listen & Summarize', 
    description: 'AI speaks, you summarize',
    duration: '5-10 min',
    icon: FileText, 
    color: 'from-rose-500 to-red-500',
    bgColor: 'bg-rose-500/20',
    borderColor: 'border-rose-500/30'
  },
];

// ==================== COMPONENT ====================

const CorporateVoicePractice: React.FC<CorporateVoicePracticeProps> = ({ user }) => {
  // State management
  const [currentSection, setCurrentSection] = useState<Section>('selector');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Raw transcript (exact, uncorrected)
  const [rawTranscript, setRawTranscript] = useState('');
  // Analysis transcript (for feedback)
  const [transcript, setTranscript] = useState('');
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<{ role: 'ai' | 'user'; text: string }[]>([]);
  const [conversationTurnCount, setConversationTurnCount] = useState(0);
  const [sectionScores, setSectionScores] = useState<SectionScore[]>([]);
  const [overallScorecard, setOverallScorecard] = useState<OverallScorecard | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sectionStartTime, setSectionStartTime] = useState<number | null>(null);
  const [totalWordsSpoken, setTotalWordsSpoken] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [hasListened, setHasListened] = useState(false);
  const [userResponses, setUserResponses] = useState<string[]>([]);
  const [extemporaneousTopic, setExtemporaneousTopic] = useState<typeof extemporaneousTopics[0] | null>(null);
  const [speakingTimer, setSpeakingTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Refs
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Speech APIs (capture raw transcript exactly)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.onresult = (event: any) => {
          let raw = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptText = event.results[i][0].transcript;
            // Always append, never clean or merge
            raw += transcriptText;
          }
          setRawTranscript(prev => prev + raw);
          setTranscript(prev => prev + raw); // For analysis, can be processed later
        };
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
        };
        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (synthRef.current) synthRef.current.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setSpeakingTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive]);

  // Text-to-speech function
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    const voices = synthRef.current.getVoices();
    const englishVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Google')) 
      || voices.find(v => v.lang.includes('en-US'))
      || voices.find(v => v.lang.includes('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => setIsSpeaking(false);
    
    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    if (recognitionRef.current && !isRecording) {
      setRawTranscript('');
      setTranscript('');
      recognitionRef.current.start();
      setIsRecording(true);
    }
  }, [isRecording]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Calculate similarity score between two texts
  const calculateSimilarity = (original: string, spoken: string): number => {
    const originalWords = original.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const spokenWords = spoken.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    
    let matchCount = 0;
    const originalSet = new Set(originalWords);
    
    spokenWords.forEach(word => {
      if (originalSet.has(word)) {
        matchCount++;
      }
    });
    
    const maxLength = Math.max(originalWords.length, spokenWords.length);
    return maxLength > 0 ? (matchCount / maxLength) * 100 : 0;
  };

  // Calculate WPM
  const calculateWPM = (wordCount: number, durationMs: number): number => {
    const minutes = durationMs / 60000;
    return minutes > 0 ? Math.round(wordCount / minutes) : 0;
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ==================== EVALUATION FUNCTIONS ====================

  // Evaluate Read Aloud
  const evaluateReadAloud = (spokenText: string, originalText: string): SectionScore => {
    const similarity = calculateSimilarity(originalText, spokenText);
    const wordsSpoken = spokenText.split(/\s+/).length;
    const originalWordCount = originalText.split(/\s+/).length;
    
    const pronunciationScore = Math.min(100, similarity * 1.1);
    const accuracyScore = Math.min(100, (wordsSpoken / originalWordCount) * 100);
    const fluencyScore = similarity > 70 ? 85 : similarity > 50 ? 70 : 55;
    const paceScore = wordsSpoken > 50 ? 80 : 60;
    
    const overallScore = Math.round((pronunciationScore * 0.35 + accuracyScore * 0.30 + fluencyScore * 0.20 + paceScore * 0.15));
    
    let feedback = '';
    if (overallScore >= 80) {
      feedback = "Excellent reading. Your pronunciation and clarity were professional.";
    } else if (overallScore >= 60) {
      feedback = "Good effort. Focus on reading smoothly without skipping words.";
    } else {
      feedback = "Keep practicing. Try reading slower and pronouncing each word clearly.";
    }
    
    return {
      section: 'Read Aloud',
      score: overallScore,
      feedback,
      completedAt: new Date(),
      details: {
        pronunciation: Math.round(pronunciationScore),
        accuracy: Math.round(accuracyScore),
        fluency: Math.round(fluencyScore),
        pace: Math.round(paceScore),
      }
    };
  };

  // Evaluate Listen & Repeat
  const evaluateListenRepeat = (spokenText: string, originalText: string): SectionScore => {
    const similarity = calculateSimilarity(originalText, spokenText);
    
    const accuracyScore = similarity;
    const memoryScore = similarity > 80 ? 90 : similarity > 60 ? 75 : 60;
    const clarityScore = spokenText.length > 10 ? 80 : 60;
    
    const overallScore = Math.round((accuracyScore * 0.5 + memoryScore * 0.3 + clarityScore * 0.2));
    
    let feedback = '';
    if (overallScore >= 80) {
      feedback = "Outstanding listening and repetition. You captured details accurately.";
    } else if (overallScore >= 60) {
      feedback = "Good attempt. Focus on exact wording and sentence structure.";
    } else {
      feedback = "Practice active listening. Pay attention to each word carefully.";
    }
    
    return {
      section: 'Listen & Repeat',
      score: overallScore,
      feedback,
      completedAt: new Date(),
      details: {
        accuracy: Math.round(accuracyScore),
        comprehension: Math.round(memoryScore),
        fluency: Math.round(clarityScore),
      }
    };
  };

  // Evaluate Comprehension
  const evaluateComprehension = (answers: string[], questions: { question: string; expectedAnswer: string }[]): SectionScore => {
    let totalRelevance = 0;
    
    answers.forEach((answer, index) => {
      if (questions[index]) {
        const relevance = calculateSimilarity(questions[index].expectedAnswer, answer);
        totalRelevance += relevance;
      }
    });
    
    const avgRelevance = answers.length > 0 ? totalRelevance / answers.length : 0;
    const comprehensionScore = Math.min(100, avgRelevance * 1.2);
    const grammarScore = answers.some(a => a.length > 20) ? 80 : 65;
    const confidenceScore = answers.length >= 2 ? 80 : 65;
    
    const overallScore = Math.round((comprehensionScore * 0.5 + grammarScore * 0.25 + confidenceScore * 0.25));
    
    let feedback = '';
    if (overallScore >= 80) {
      feedback = "Excellent comprehension. You understood and answered accurately.";
    } else if (overallScore >= 60) {
      feedback = "Good understanding. Include more specific details from the passage.";
    } else {
      feedback = "Focus on listening for key information. Take mental notes.";
    }
    
    return {
      section: 'Comprehension',
      score: overallScore,
      feedback,
      completedAt: new Date(),
      details: {
        comprehension: Math.round(comprehensionScore),
        relevance: Math.round(avgRelevance),
        grammar: grammarScore,
        confidence: confidenceScore,
      }
    };
  };

  // Evaluate Conversation
  const evaluateConversation = (history: { role: 'ai' | 'user'; text: string }[]): SectionScore => {
    const userMessages = history.filter(h => h.role === 'user');
    const totalWords = userMessages.reduce((sum, r) => sum + r.text.split(/\s+/).length, 0);
    const avgResponseLength = userMessages.length > 0 ? totalWords / userMessages.length : 0;
    
    const fluencyScore = avgResponseLength > 15 ? 85 : avgResponseLength > 8 ? 70 : 55;
    const confidenceScore = userMessages.length >= 3 ? 85 : userMessages.length >= 2 ? 70 : 55;
    const grammarScore = avgResponseLength > 10 ? 80 : 65;
    
    const overallScore = Math.round((fluencyScore * 0.35 + confidenceScore * 0.35 + grammarScore * 0.3));
    
    let feedback = '';
    if (overallScore >= 80) {
      feedback = "Great conversational skills. Natural and professional communication.";
    } else if (overallScore >= 60) {
      feedback = "Good interaction. Elaborate more on your answers with examples.";
    } else {
      feedback = "Practice speaking in complete sentences with more details.";
    }
    
    return {
      section: 'Conversation',
      score: overallScore,
      feedback,
      completedAt: new Date(),
      details: {
        fluency: fluencyScore,
        confidence: confidenceScore,
        grammar: grammarScore,
      }
    };
  };

  // Evaluate Extemporaneous Speaking
  const evaluateExtemporaneous = (spokenText: string, duration: number): SectionScore => {
    const wordCount = spokenText.split(/\s+/).filter(w => w.length > 0).length;
    const sentenceCount = spokenText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    
    // Evaluate based on content length and speaking duration
    const staminaScore = duration >= 180 ? 90 : duration >= 120 ? 75 : duration >= 60 ? 60 : 45; // 3+ min ideal
    const fluencyScore = wordCount > 150 ? 85 : wordCount > 100 ? 75 : wordCount > 50 ? 60 : 45;
    const structureScore = avgWordsPerSentence > 8 && avgWordsPerSentence < 25 ? 85 : 65;
    const vocabularyScore = wordCount > 100 ? 80 : 65;
    const confidenceScore = duration >= 120 && wordCount > 100 ? 85 : 65;
    
    const overallScore = Math.round((staminaScore * 0.25 + fluencyScore * 0.25 + structureScore * 0.2 + vocabularyScore * 0.15 + confidenceScore * 0.15));
    
    let feedback = '';
    if (overallScore >= 80) {
      feedback = "Excellent extempore speech. Good structure, flow, and confidence.";
    } else if (overallScore >= 60) {
      feedback = "Good effort. Work on speaking longer with clearer structure.";
    } else {
      feedback = "Practice speaking continuously on topics. Build speaking stamina.";
    }
    
    return {
      section: 'Extemporaneous',
      score: overallScore,
      feedback,
      completedAt: new Date(),
      details: {
        stamina: staminaScore,
        fluency: fluencyScore,
        structure: structureScore,
        vocabulary: vocabularyScore,
        confidence: confidenceScore,
      }
    };
  };

  // Evaluate Listen & Summarize
  const evaluateSummarize = (summary: string, originalPassage: typeof listenSummarizePassages[0]): SectionScore => {
    const similarity = calculateSimilarity(originalPassage.passage, summary);
    const summaryWords = summary.split(/\s+/).filter(w => w.length > 0).length;
    
    // Check for key points coverage
    let keyPointsCovered = 0;
    originalPassage.keyPoints.forEach(point => {
      if (summary.toLowerCase().includes(point.toLowerCase().split(' ')[0])) {
        keyPointsCovered++;
      }
    });
    const coverageScore = (keyPointsCovered / originalPassage.keyPoints.length) * 100;
    
    const comprehensionScore = Math.min(100, similarity * 1.3);
    const structureScore = summaryWords > 50 ? 80 : summaryWords > 30 ? 70 : 55;
    const grammarScore = summaryWords > 40 ? 80 : 65;
    const confidenceScore = summaryWords > 60 ? 85 : 70;
    
    const overallScore = Math.round((comprehensionScore * 0.35 + coverageScore * 0.25 + structureScore * 0.15 + grammarScore * 0.15 + confidenceScore * 0.1));
    
    let feedback = '';
    if (overallScore >= 80) {
      feedback = "Excellent summary. You captured the key points accurately.";
    } else if (overallScore >= 60) {
      feedback = "Good attempt. Include more key points from the passage.";
    } else {
      feedback = "Focus on identifying main ideas while listening.";
    }
    
    return {
      section: 'Listen & Summarize',
      score: overallScore,
      feedback,
      completedAt: new Date(),
      details: {
        comprehension: Math.round(comprehensionScore),
        accuracy: Math.round(coverageScore),
        structure: structureScore,
        grammar: grammarScore,
        confidence: confidenceScore,
      }
    };
  };

  // Generate overall scorecard
  const generateOverallScorecard = (scores: SectionScore[]): OverallScorecard => {
    if (scores.length === 0) {
      return {
        overall: 0,
        communication: 0,
        confidence: 0,
        grammar: 0,
        speakingPace: 0,
        wpm: 0,
        sectionsCompleted: 0,
        totalSections: 6,
        sectionScores: [],
        strengths: [],
        improvements: ["Complete at least one section to see your scores"],
        recommendation: "Start with any section to begin your assessment.",
      };
    }
    
    const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
    
    const communication = Math.round(scores.reduce((sum, s) => sum + (s.details.fluency || s.details.accuracy || 70), 0) / scores.length);
    const confidence = Math.round(scores.reduce((sum, s) => sum + (s.details.confidence || 75), 0) / scores.length);
    const grammar = Math.round(scores.reduce((sum, s) => sum + (s.details.grammar || 75), 0) / scores.length);
    
    // Calculate session duration and WPM
    const sessionDuration = sessionStartTime ? Date.now() - sessionStartTime : 600000;
    const wpm = calculateWPM(totalWordsSpoken, sessionDuration);
    
    // Determine speaking pace
    let speakingPace: number;
    if (wpm >= 120 && wpm <= 150) {
      speakingPace = 90;
    } else if (wpm >= 100 && wpm <= 180) {
      speakingPace = 75;
    } else if (wpm < 100) {
      speakingPace = 60;
    } else {
      speakingPace = 55;
    }
    
    // Identify strengths and improvements
    const strengths: string[] = [];
    const improvements: string[] = [];
    
    if (communication >= 75) strengths.push("Clear and effective communication");
    else improvements.push("Work on speaking more clearly and fluently");
    
    if (confidence >= 75) strengths.push("Confident speaking tone");
    else improvements.push("Build more confidence in your delivery");
    
    if (grammar >= 75) strengths.push("Good grammatical accuracy");
    else improvements.push("Practice sentence structure and grammar");
    
    if (speakingPace >= 75) strengths.push("Well-paced speech delivery");
    else if (wpm < 100) improvements.push("Try to speak a bit faster");
    else improvements.push("Slow down your speaking pace slightly");
    
    scores.forEach(s => {
      if (s.score >= 80) {
        if (s.section === 'Read Aloud') strengths.push("Strong reading skills");
        if (s.section === 'Listen & Repeat') strengths.push("Excellent listening accuracy");
        if (s.section === 'Comprehension') strengths.push("Great comprehension abilities");
        if (s.section === 'Conversation') strengths.push("Natural conversation skills");
        if (s.section === 'Extemporaneous') strengths.push("Strong extempore speaking");
        if (s.section === 'Listen & Summarize') strengths.push("Excellent summarization skills");
      }
    });
    
    // Generate recommendation
    let recommendation = '';
    if (avgScore >= 80) {
      recommendation = "Outstanding performance! You are well-prepared for company voice rounds.";
    } else if (avgScore >= 65) {
      recommendation = "Good progress! Focus on improvement areas. Consistent practice will help you excel.";
    } else {
      recommendation = "Keep practicing daily! Focus on listening carefully and speaking clearly.";
    }
    
    return {
      overall: Math.round(avgScore),
      communication,
      confidence,
      grammar,
      speakingPace,
      wpm,
      sectionsCompleted: scores.length,
      totalSections: 6,
      sectionScores: scores,
      strengths: strengths.slice(0, 4),
      improvements: improvements.slice(0, 4),
      recommendation,
    };
  };

  // ==================== SECTION HANDLERS ====================

  // --- User history for topic repeat prevention ---
  const [userHistory, setUserHistory] = useState<any[]>([]);

  // Start a section (dynamic topic, never repeat)
  const startSection = (sectionId: Section) => {
    if (!sessionStartTime) setSessionStartTime(Date.now());
    setSectionStartTime(Date.now());
    setCurrentSection(sectionId);
    setShowInstructions(true);
    setRawTranscript('');
    setTranscript('');
    setHasListened(false);
    setUserResponses([]);
    setConversationHistory([]);
    setConversationTurnCount(0);
    setSpeakingTimer(0);
    setTimerActive(false);
    setFeedbackMessage('');

    // Dynamic topic/passage/question per section
    if (sectionId === 'read-aloud') {
      const passage = getNewDynamicItem('read-aloud', userHistory, generateReadAloudPassage);
      setCurrentPassageIndex(0);
      setExtemporaneousTopic(null);
      setUserHistory((h) => [...h, { section: 'read-aloud', ...passage, date: new Date().toISOString() }]);
    } else if (sectionId === 'listen-repeat') {
      const passage = getNewDynamicItem('listen-repeat', userHistory, generateListenRepeatPassage);
      setCurrentPassageIndex(0);
      setExtemporaneousTopic(null);
      setUserHistory((h) => [...h, { section: 'listen-repeat', ...passage, date: new Date().toISOString() }]);
    } else if (sectionId === 'comprehension') {
      const passage = getNewDynamicItem('comprehension', userHistory, generateComprehensionPassage);
      setCurrentPassageIndex(0);
      setExtemporaneousTopic(null);
      setUserHistory((h) => [...h, { section: 'comprehension', ...passage, date: new Date().toISOString() }]);
    } else if (sectionId === 'conversation') {
      const topic = getNewDynamicItem('conversation', userHistory, generateConversationTopic);
      setCurrentPassageIndex(0);
      setExtemporaneousTopic(null);
      setUserHistory((h) => [...h, { section: 'conversation', ...topic, date: new Date().toISOString() }]);
    } else if (sectionId === 'extemporaneous') {
      const topic = getNewDynamicItem('extemporaneous', userHistory, generateExtemporaneousTopic);
      setExtemporaneousTopic(topic);
      setCurrentPassageIndex(0);
      setUserHistory((h) => [...h, { section: 'extemporaneous', ...topic, date: new Date().toISOString() }]);
    } else if (sectionId === 'summarize') {
      const passage = getNewDynamicItem('summarize', userHistory, generateSummarizePassage);
      setCurrentPassageIndex(0);
      setExtemporaneousTopic(null);
      setUserHistory((h) => [...h, { section: 'summarize', ...passage, date: new Date().toISOString() }]);
    }
  };

  // Complete a section (store session report)
  const completeSection = async (score: SectionScore) => {
    const newScores = [...sectionScores, score];
    setSectionScores(newScores);
    const wordsInTranscript = transcript.split(/\s+/).filter(w => w.length > 0).length;
    setTotalWordsSpoken(prev => prev + wordsInTranscript);

    // Find the last used topic/passage for this section
    const lastHistory = userHistory.filter(h => h.section === currentSection).slice(-1)[0];
    const now = new Date();
    // Session Report Object
    const sessionReport = {
      id: uuidv4(),
      date: now.toLocaleDateString(),
      startTime: sectionStartTime ? new Date(sectionStartTime).toLocaleTimeString() : '',
      endTime: now.toLocaleTimeString(),
      durationMinutes: sectionStartTime ? Math.round((now.getTime() - sectionStartTime) / 60000) : null,
      type: 'CORPORATE_VOICE',
      section: currentSection,
      topic: lastHistory?.topic || lastHistory?.title || '',
      transcript: [
        {
          speaker: 'User',
          text: rawTranscript,
          timestamp: now.toISOString(),
        },
      ],
      rawTranscript,
      analysisTranscript: transcript,
      score: score.score,
      feedback: score.feedback,
      strengths: score.details ? Object.keys(score.details).filter(k => (score.details as any)[k] >= 75) : [],
      weaknesses: score.details ? Object.keys(score.details).filter(k => (score.details as any)[k] < 75) : [],
      mistakes: [], // Could be filled by analysis
      skillScores: {
        communication: score.details?.fluency || 0,
        confidence: score.details?.confidence || 0,
        clarity: score.details?.accuracy || 0,
        hrReadiness: 0,
        companyFit: 0,
        content: score.details?.comprehension || 0,
      },
      analytics: {
        totalSpeakingTime: sectionStartTime ? `${Math.round((now.getTime() - sectionStartTime) / 1000)}s` : '',
        avgAnswerLength: `${wordsInTranscript} words`,
        pauseTime: '',
        responseSpeed: 'Optimal',
        talkingBalance: 'Good',
      },
      actionPlan: [],
    };
    // Store in localStorage for demo (replace with API call for real persistence)
    try {
      const historyKey = `fluenzy_corpvoice_history_${user?.id || 'demo'}`;
      const prev = JSON.parse(localStorage.getItem(historyKey) || '[]');
      localStorage.setItem(historyKey, JSON.stringify([...prev, sessionReport]));
    } catch (e) { /* ignore */ }

    setFeedbackMessage(score.feedback);
    setTimeout(() => {
      setFeedbackMessage('');
      setCurrentSection('selector');
    }, 3000);
  };

  // Go back to section selector
  const goToSelector = () => {
    stopSpeaking();
    stopRecording();
    setCurrentSection('selector');
    setShowInstructions(true);
    setTranscript('');
    setTimerActive(false);
    setSpeakingTimer(0);
  };

  // View final scorecard
  const viewScorecard = () => {
    const scorecard = generateOverallScorecard(sectionScores);
    setOverallScorecard(scorecard);
    setCurrentSection('scorecard');
  };

  // Reset session
  const resetSession = () => {
    setSectionScores([]);
    setOverallScorecard(null);
    setCurrentSection('selector');
    setSessionStartTime(null);
    setTotalWordsSpoken(0);
  };

  // ==================== SUBMIT HANDLERS ====================

  // Submit Read Aloud
  const submitReadAloud = () => {
    if (transcript.trim().length < 10) {
      setFeedbackMessage("Please read the passage aloud before submitting.");
      return;
    }
    
    setIsProcessing(true);
    // Use last generated dynamic passage for this section
    const passage = userHistory.filter(h => h.section === 'read-aloud').slice(-1)[0];
    const score = evaluateReadAloud(transcript, passage.text);
    
    setTimeout(() => {
      setIsProcessing(false);
      completeSection(score);
    }, 1500);
  };

  // Submit Listen & Repeat
  const submitListenRepeat = () => {
    if (!hasListened) {
      setFeedbackMessage("Please listen to the passage first.");
      return;
    }
    if (transcript.trim().length < 10) {
      setFeedbackMessage("Please repeat the passage after listening.");
      return;
    }
    
    setIsProcessing(true);
    // Use last generated dynamic listen-repeat passage for this section
    const listenRepeatHistory = userHistory.filter(h => h.section === 'listen-repeat');
    const passage = listenRepeatHistory.length > 0 ? listenRepeatHistory[listenRepeatHistory.length - 1].prompt : '';
    const score = evaluateListenRepeat(transcript, passage);
    
    setTimeout(() => {
      setIsProcessing(false);
      completeSection(score);
    }, 1500);
  };

  // Submit Comprehension answer
  const submitComprehensionAnswer = () => {
    if (transcript.trim().length < 3) {
      setFeedbackMessage("Please speak your answer.");
      return;
    }
    
    const newResponses = [...userResponses, transcript];
    setUserResponses(newResponses);
    setTranscript('');
    
    const currentPassage = comprehensionPassages[currentPassageIndex % comprehensionPassages.length];
    
    if (currentQuestionIndex < currentPassage.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      speak(currentPassage.questions[currentQuestionIndex + 1].question);
    } else {
      setIsProcessing(true);
      const score = evaluateComprehension(newResponses, currentPassage.questions);
      
      setTimeout(() => {
        setIsProcessing(false);
        setCurrentQuestionIndex(0);
        completeSection(score);
      }, 1500);
    }
  };

  // Submit Conversation response
  const submitConversationResponse = () => {
    if (transcript.trim().length < 5) {
      setFeedbackMessage("Please provide a more detailed response.");
      return;
    }
    
    const newHistory = [...conversationHistory, { role: 'user' as const, text: transcript }];
    setConversationHistory(newHistory);
    setTranscript('');
    setConversationTurnCount(prev => prev + 1);
    
    const topic = conversationTopics[currentPassageIndex % conversationTopics.length];
    
    if (conversationTurnCount < topic.followUps.length) {
      const followUp = topic.followUps[conversationTurnCount];
      setConversationHistory(prev => [...prev, { role: 'ai' as const, text: followUp }]);
      speak(followUp);
    } else {
      setIsProcessing(true);
      const score = evaluateConversation(newHistory);
      
      setTimeout(() => {
        setIsProcessing(false);
        setConversationTurnCount(0);
        completeSection(score);
      }, 1500);
    }
  };

  // Submit Extemporaneous
  const submitExtemporaneous = () => {
    setTimerActive(false);
    
    if (transcript.trim().length < 20 || speakingTimer < 30) {
      setFeedbackMessage("Please speak for at least 1 minute on the topic.");
      return;
    }
    
    setIsProcessing(true);
    const score = evaluateExtemporaneous(transcript, speakingTimer);
    
    setTimeout(() => {
      setIsProcessing(false);
      completeSection(score);
    }, 1500);
  };

  // Submit Summarize
  const submitSummarize = () => {
    if (transcript.trim().length < 20) {
      setFeedbackMessage("Please provide a more detailed summary.");
      return;
    }
    
    setIsProcessing(true);
    const passage = listenSummarizePassages[currentPassageIndex % listenSummarizePassages.length];
    const score = evaluateSummarize(transcript, passage);
    
    setTimeout(() => {
      setIsProcessing(false);
      completeSection(score);
    }, 1500);
  };

  // Play comprehension passage
  const playComprehensionPassage = () => {
    const passage = comprehensionPassages[currentPassageIndex % comprehensionPassages.length];
    speak(passage.passage, () => {
      setHasListened(true);
      setTimeout(() => {
        speak(passage.questions[0].question);
      }, 1000);
    });
  };

  // Start conversation
  const startConversation = () => {
    const topic = conversationTopics[currentPassageIndex % conversationTopics.length];
    setConversationHistory([{ role: 'ai', text: topic.opener }]);
    speak(topic.opener);
    setShowInstructions(false);
  };

  // Start extemporaneous timer
  const startExtemporaneousSpeaking = () => {
    setShowInstructions(false);
    setSpeakingTimer(0);
    setTimerActive(true);
    startRecording();
  };

  // Play summarize passage
  const playSummarizePassage = () => {
    const passage = listenSummarizePassages[currentPassageIndex % listenSummarizePassages.length];
    speak(passage.passage, () => {
      setHasListened(true);
    });
  };

  // ==================== RENDER FUNCTIONS ====================

  // Check if section is completed
  const isSectionCompleted = (sectionId: string) => {
    return sectionScores.some(s => s.section === sectionConfig.find(c => c.id === sectionId)?.title);
  };

  // Get section score
  const getSectionScore = (sectionId: string) => {
    const config = sectionConfig.find(c => c.id === sectionId);
    return sectionScores.find(s => s.section === config?.title)?.score;
  };

  // Render Section Selector
  const renderSectionSelector = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center">
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto shadow-xl">
            <Award size={40} className="text-white" />
          </div>
          <div className="absolute -inset-3 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-20 blur-xl rounded-full" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Corporate Voice Assessment</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Choose any section to practice. Complete all for a comprehensive evaluation.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 max-w-md mx-auto">
        <div className="text-center">
          <p className="text-3xl font-black text-blue-400">{sectionScores.length}</p>
          <p className="text-slate-400 text-xs">Completed</p>
        </div>
        <div className="w-px h-10 bg-slate-700" />
        <div className="text-center">
          <p className="text-3xl font-black text-white">6</p>
          <p className="text-slate-400 text-xs">Total</p>
        </div>
        <div className="w-px h-10 bg-slate-700" />
        <div className="text-center">
          <p className="text-3xl font-black text-emerald-400">
            {sectionScores.length > 0 ? Math.round(sectionScores.reduce((s, sc) => s + sc.score, 0) / sectionScores.length) : '-'}
          </p>
          <p className="text-slate-400 text-xs">Avg Score</p>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectionConfig.map((section) => {
          const completed = isSectionCompleted(section.id);
          const score = getSectionScore(section.id);
          
          return (
            <button
              key={section.id}
              onClick={() => startSection(section.id)}
              className={`relative p-6 rounded-2xl border transition-all duration-300 text-left group ${
                completed 
                  ? `${section.bgColor} ${section.borderColor} hover:scale-[1.02]`
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600 hover:scale-[1.02]'
              }`}
            >
              {completed && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
                  <CheckCircle2 size={12} />
                  {score}%
                </div>
              )}
              
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <section.icon size={24} className="text-white" />
              </div>
              
              <h3 className="text-white font-bold text-lg mb-1">{section.title}</h3>
              <p className="text-slate-400 text-sm mb-3">{section.description}</p>
              
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Clock size={12} />
                {section.duration}
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      {sectionScores.length > 0 && (
        <div className="flex justify-center gap-4">
          <button
            onClick={viewScorecard}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            <BarChart3 size={20} />
            View Scorecard
          </button>
          <button
            onClick={resetSession}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-700 text-slate-300 font-bold hover:bg-slate-600 transition-colors"
          >
            <RefreshCw size={20} />
            Reset
          </button>
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 max-w-2xl mx-auto">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-amber-400 font-bold text-sm mb-1">Assessment Guidelines</p>
            <p className="text-slate-300 text-sm">
              Each section is independent. Complete any or all sections. 
              Ensure quiet environment with working microphone. Speak clearly and professionally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Back button component
  const BackButton = () => (
    <button
      onClick={goToSelector}
      className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
    >
      <Home size={18} />
      Back to Sections
    </button>
  );

  // Render Read Aloud Section
  const renderReadAloud = () => {
    // Use last generated dynamic passage for this section
    const passage = userHistory.filter(h => h.section === 'read-aloud').slice(-1)[0];
    
    if (showInstructions) {
      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <BackButton />
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto shadow-xl">
              <BookOpen size={40} className="text-white" />
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Read Aloud</h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Read the professional paragraph clearly and confidently. 
                Focus on pronunciation, fluency, and pace.
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 max-w-md mx-auto text-left">
              <h4 className="text-white font-bold mb-2">Evaluation Criteria:</h4>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• Pronunciation accuracy</li>
                <li>• Fluency & flow</li>
                <li>• Speaking pace</li>
                <li>• Clarity of speech</li>
              </ul>
            </div>
            
            <button
              onClick={() => setShowInstructions(false)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-colors"
            >
              Start Reading
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <BackButton />
        
        <div className="text-center mb-4">
          <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">
            {passage.difficulty} • {passage.wordCount} words
          </span>
        </div>
        
        <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-400" />
            {passage.title}
          </h3>
          <p className="text-slate-200 text-lg leading-relaxed">{passage.text}</p>
        </div>
        
        <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
          <p className="text-slate-400 text-sm mb-4">Your reading:</p>
          <div className="min-h-[100px] p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
            {transcript || <span className="text-slate-500 italic">Start speaking...</span>}
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              {isRecording ? 'Stop' : 'Record'}
            </button>
            <button
              onClick={() => setTranscript('')}
              className="p-3 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
            >
              <RotateCcw size={20} />
            </button>
          </div>
          
          {feedbackMessage && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-center max-w-md">
              {feedbackMessage}
            </div>
          )}
          
          <button
            onClick={submitReadAloud}
            disabled={isProcessing || isRecording}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
              isProcessing 
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg'
            }`}
          >
            {isProcessing ? (
              <><RefreshCw size={20} className="animate-spin" /> Evaluating...</>
            ) : (
              <><CheckCircle2 size={20} /> Submit</>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Render Listen & Repeat Section
  const renderListenRepeat = () => {
    const passage = listenRepeatPassages[currentPassageIndex % listenRepeatPassages.length];
    
    if (showInstructions) {
      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <BackButton />
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto shadow-xl">
              <Headphones size={40} className="text-white" />
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Listen & Repeat</h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Listen to the audio passage carefully, then repeat it as accurately as possible.
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 max-w-md mx-auto text-left">
              <h4 className="text-white font-bold mb-2">Evaluation Criteria:</h4>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• Word accuracy</li>
                <li>• Sentence structure match</li>
                <li>• Listening precision</li>
                <li>• Memory & clarity</li>
              </ul>
            </div>
            
            <button
              onClick={() => setShowInstructions(false)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition-colors"
            >
              Continue
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <BackButton />
        
        <div className="text-center mb-4">
          <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold">
            {passage.category}
          </span>
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={() => {
              speak(passage.text, () => setHasListened(true));
            }}
            disabled={isSpeaking}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all ${
              isSpeaking 
                ? 'bg-cyan-500 text-white animate-pulse' 
                : hasListened
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg'
            }`}
          >
            {isSpeaking ? (
              <><Volume2 size={24} className="animate-pulse" /> Playing...</>
            ) : hasListened ? (
              <><CheckCircle2 size={24} /> Listened</>
            ) : (
              <><Volume2 size={24} /> Play Audio</>
            )}
          </button>
        </div>
        
        <p className="text-center text-slate-400 text-sm">
          {hasListened ? "Now repeat what you heard" : "Listen carefully, then repeat"}
        </p>
        
        <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
          <p className="text-slate-400 text-sm mb-4">Your repetition:</p>
          <div className="min-h-[100px] p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
            {transcript || <span className="text-slate-500 italic">Start speaking...</span>}
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!hasListened}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                !hasListened 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : isRecording 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-cyan-500 text-white hover:bg-cyan-600'
              }`}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              {isRecording ? 'Stop' : 'Record'}
            </button>
            <button
              onClick={() => setTranscript('')}
              className="p-3 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
            >
              <RotateCcw size={20} />
            </button>
          </div>
          
          {feedbackMessage && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-center max-w-md">
              {feedbackMessage}
            </div>
          )}
          
          <button
            onClick={submitListenRepeat}
            disabled={isProcessing || isRecording}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
              isProcessing 
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg'
            }`}
          >
            {isProcessing ? (
              <><RefreshCw size={20} className="animate-spin" /> Evaluating...</>
            ) : (
              <><CheckCircle2 size={20} /> Submit</>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Render Comprehension Section
  const renderComprehension = () => {
    const passage = comprehensionPassages[currentPassageIndex % comprehensionPassages.length];
    
    if (showInstructions) {
      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <BackButton />
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto shadow-xl">
              <Brain size={40} className="text-white" />
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Comprehension</h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Listen to a passage, then answer questions based on what you heard.
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 max-w-md mx-auto text-left">
              <h4 className="text-white font-bold mb-2">Evaluation Criteria:</h4>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• Understanding</li>
                <li>• Answer relevance</li>
                <li>• Sentence formation</li>
                <li>• Confidence</li>
              </ul>
            </div>
            
            <button
              onClick={() => setShowInstructions(false)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors"
            >
              Continue
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      );
    }
    
    if (!hasListened) {
      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <BackButton />
          <div className="text-center space-y-6">
            <p className="text-slate-300">Click below to hear the passage. Listen carefully!</p>
            <button
              onClick={playComprehensionPassage}
              disabled={isSpeaking}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold mx-auto transition-all ${
                isSpeaking 
                  ? 'bg-amber-500 text-white animate-pulse' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg'
              }`}
            >
              {isSpeaking ? (
                <><Volume2 size={24} className="animate-pulse" /> Playing...</>
              ) : (
                <><Volume2 size={24} /> Play Passage</>
              )}
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <BackButton />
        
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
          <p className="text-amber-400 font-bold">Question {currentQuestionIndex + 1} of {passage.questions.length}:</p>
          <p className="text-white text-lg mt-2">{passage.questions[currentQuestionIndex].question}</p>
        </div>
        
        <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
          <p className="text-slate-400 text-sm mb-4">Your answer:</p>
          <div className="min-h-[80px] p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
            {transcript || <span className="text-slate-500 italic">Speak your answer...</span>}
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              {isRecording ? 'Stop' : 'Record'}
            </button>
            <button
              onClick={() => setTranscript('')}
              className="p-3 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
            >
              <RotateCcw size={20} />
            </button>
          </div>
          
          {feedbackMessage && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-center max-w-md">
              {feedbackMessage}
            </div>
          )}
          
          <button
            onClick={submitComprehensionAnswer}
            disabled={isProcessing || isRecording}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
              isProcessing 
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg'
            }`}
          >
            {isProcessing ? (
              <><RefreshCw size={20} className="animate-spin" /> Evaluating...</>
            ) : (
              <><CheckCircle2 size={20} /> {currentQuestionIndex < passage.questions.length - 1 ? 'Next Question' : 'Submit'}</>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Render Conversation Section
  const renderConversation = () => {
    if (showInstructions) {
      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <BackButton />
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto shadow-xl">
              <MessageSquare size={40} className="text-white" />
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Live Conversation</h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Engage in a professional conversation. Answer workplace questions naturally.
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 max-w-md mx-auto text-left">
              <h4 className="text-white font-bold mb-2">Evaluation Criteria:</h4>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• Fluency</li>
                <li>• Confidence</li>
                <li>• Professional tone</li>
                <li>• Grammar</li>
              </ul>
            </div>
            
            <button
              onClick={startConversation}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-600 transition-colors"
            >
              Start Conversation
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <BackButton />
        
        <div className="max-w-2xl mx-auto space-y-4 max-h-[300px] overflow-y-auto p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50">
          {conversationHistory.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === 'ai' 
                  ? 'bg-purple-500/20 text-purple-100 rounded-tl-none' 
                  : 'bg-blue-500/20 text-blue-100 rounded-tr-none'
              }`}>
                <p className="text-xs text-slate-400 mb-1">
                  {msg.role === 'ai' ? 'Interviewer' : 'You'}
                </p>
                <p>{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
          <p className="text-slate-400 text-sm mb-4">Your response:</p>
          <div className="min-h-[80px] p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
            {transcript || <span className="text-slate-500 italic">Speak your response...</span>}
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              {isRecording ? 'Stop' : 'Record'}
            </button>
            <button
              onClick={() => setTranscript('')}
              className="p-3 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
            >
              <RotateCcw size={20} />
            </button>
          </div>
          
          {feedbackMessage && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-center max-w-md">
              {feedbackMessage}
            </div>
          )}
          
          <button
            onClick={submitConversationResponse}
            disabled={isProcessing || isRecording}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
              isProcessing 
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg'
            }`}
          >
            {isProcessing ? (
              <><RefreshCw size={20} className="animate-spin" /> Evaluating...</>
            ) : (
              <><CheckCircle2 size={20} /> Send</>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Render Extemporaneous Section
  const renderExtemporaneous = () => {
    if (showInstructions) {
      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <BackButton />
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto shadow-xl">
              <Lightbulb size={40} className="text-white" />
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Extemporaneous Speaking</h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                You'll receive a random topic. Speak continuously for 5-10 minutes. 
                No interruptions - just share your thoughts freely.
              </p>
            </div>
            
            {extemporaneousTopic && (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 max-w-lg mx-auto">
                <p className="text-emerald-400 text-sm font-bold mb-2">Your Topic:</p>
                <h3 className="text-white text-xl font-bold mb-4">{extemporaneousTopic.topic}</h3>
                <p className="text-slate-400 text-sm mb-2">Points to consider:</p>
                <ul className="text-slate-300 text-sm space-y-1">
                  {extemporaneousTopic.hints.map((hint, i) => (
                    <li key={i}>• {hint}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 max-w-md mx-auto text-left">
              <h4 className="text-white font-bold mb-2">Evaluation Criteria:</h4>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• Idea flow & structure</li>
                <li>• Confidence</li>
                <li>• Vocabulary</li>
                <li>• Speaking stamina</li>
              </ul>
            </div>
            
            <button
              onClick={startExtemporaneousSpeaking}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors"
            >
              Start Speaking
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <BackButton />
        
        <div className="text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-500/20 border border-emerald-500/30">
            <Timer size={20} className="text-emerald-400" />
            <span className="text-2xl font-mono font-bold text-emerald-400">
              {formatTime(speakingTimer)}
            </span>
            {timerActive && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          </div>
        </div>
        
        {extemporaneousTopic && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
            <p className="text-emerald-400 text-sm font-bold">Topic:</p>
            <h3 className="text-white text-lg font-bold">{extemporaneousTopic.topic}</h3>
          </div>
        )}
        
        <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
          <p className="text-slate-400 text-sm mb-4">Your speech:</p>
          <div className="min-h-[150px] max-h-[250px] overflow-y-auto p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
            {transcript || <span className="text-slate-500 italic">Speaking...</span>}
          </div>
          <p className="text-slate-500 text-xs mt-2">
            Words: {transcript.split(/\s+/).filter(w => w.length > 0).length}
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (isRecording) {
                  stopRecording();
                  setTimerActive(false);
                } else {
                  startRecording();
                  setTimerActive(true);
                }
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              {isRecording ? 'Pause' : 'Resume'}
            </button>
          </div>
          
          {feedbackMessage && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-center max-w-md">
              {feedbackMessage}
            </div>
          )}
          
          <button
            onClick={submitExtemporaneous}
            disabled={isProcessing}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
              isProcessing 
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg'
            }`}
          >
            {isProcessing ? (
              <><RefreshCw size={20} className="animate-spin" /> Evaluating...</>
            ) : (
              <><CheckCircle2 size={20} /> Finish Speaking</>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Render Listen & Summarize Section
  const renderSummarize = () => {
    const passage = listenSummarizePassages[currentPassageIndex % listenSummarizePassages.length];
    
    if (showInstructions) {
      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <BackButton />
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center mx-auto shadow-xl">
              <FileText size={40} className="text-white" />
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Listen & Summarize</h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Listen to a 5-10 minute passage, then summarize it in your own words. 
                Capture the key points and main ideas.
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 max-w-md mx-auto text-left">
              <h4 className="text-white font-bold mb-2">Evaluation Criteria:</h4>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• Listening comprehension</li>
                <li>• Summary accuracy</li>
                <li>• Logical structure</li>
                <li>• Grammar & confidence</li>
              </ul>
            </div>
            
            <button
              onClick={() => setShowInstructions(false)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-colors"
            >
              Continue
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      );
    }
    
    if (!hasListened) {
      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <BackButton />
          
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 max-w-lg mx-auto text-center">
            <p className="text-rose-400 text-sm font-bold mb-2">Topic:</p>
            <h3 className="text-white text-xl font-bold">{passage.title}</h3>
          </div>
          
          <div className="text-center space-y-4">
            <p className="text-slate-300">Click below to listen to the passage. Take mental notes!</p>
            <button
              onClick={playSummarizePassage}
              disabled={isSpeaking}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold mx-auto transition-all ${
                isSpeaking 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'bg-gradient-to-r from-rose-500 to-red-500 text-white hover:shadow-lg'
              }`}
            >
              {isSpeaking ? (
                <><Volume2 size={24} className="animate-pulse" /> Playing...</>
              ) : (
                <><Volume2 size={24} /> Play Passage</>
              )}
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <BackButton />
        
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
          <CheckCircle2 size={20} className="inline text-green-400 mr-2" />
          <span className="text-green-400 font-bold">Passage listened. Now summarize!</span>
        </div>
        
        <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
          <p className="text-slate-400 text-sm mb-4">Your summary:</p>
          <div className="min-h-[150px] max-h-[250px] overflow-y-auto p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
            {transcript || <span className="text-slate-500 italic">Start speaking your summary...</span>}
          </div>
          <p className="text-slate-500 text-xs mt-2">
            Words: {transcript.split(/\s+/).filter(w => w.length > 0).length}
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-rose-500 text-white hover:bg-rose-600'
              }`}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              {isRecording ? 'Stop' : 'Record'}
            </button>
            <button
              onClick={() => setTranscript('')}
              className="p-3 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
            >
              <RotateCcw size={20} />
            </button>
          </div>
          
          {feedbackMessage && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-center max-w-md">
              {feedbackMessage}
            </div>
          )}
          
          <button
            onClick={submitSummarize}
            disabled={isProcessing || isRecording}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
              isProcessing 
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg'
            }`}
          >
            {isProcessing ? (
              <><RefreshCw size={20} className="animate-spin" /> Evaluating...</>
            ) : (
              <><CheckCircle2 size={20} /> Submit Summary</>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Render Final Scorecard
  const renderScorecard = () => {
    if (!overallScorecard) return null;
    
    const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-green-400';
      if (score >= 60) return 'text-amber-400';
      return 'text-red-400';
    };
    
    const getScoreBg = (score: number) => {
      if (score >= 80) return 'from-green-500 to-emerald-500';
      if (score >= 60) return 'from-amber-500 to-orange-500';
      return 'from-red-500 to-rose-500';
    };
    
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Overall Score */}
        <div className="text-center">
          <div className="relative inline-block">
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${getScoreBg(overallScorecard.overall)} flex items-center justify-center shadow-2xl`}>
              <div className="text-center">
                <Trophy size={32} className="text-white mx-auto mb-1" />
                <span className="text-3xl font-black text-white">{overallScorecard.overall}</span>
                <span className="text-white/70 text-sm">/100</span>
              </div>
            </div>
            <div className={`absolute -inset-4 bg-gradient-to-br ${getScoreBg(overallScorecard.overall)} opacity-30 blur-2xl rounded-full`} />
          </div>
          
          <h2 className="text-2xl font-black text-white mt-6 mb-2">Assessment Complete</h2>
          <p className="text-slate-400">{overallScorecard.sectionsCompleted} of {overallScorecard.totalSections} sections completed</p>
        </div>
        
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
          {[
            { label: 'Communication', value: overallScorecard.communication, icon: MessageSquare },
            { label: 'Confidence', value: overallScorecard.confidence, icon: Zap },
            { label: 'Grammar', value: overallScorecard.grammar, icon: BookOpen },
            { label: 'Pace', value: overallScorecard.speakingPace, icon: Gauge },
            { label: 'WPM', value: overallScorecard.wpm, icon: Timer, isWpm: true },
          ].map((metric, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-center">
              <metric.icon size={24} className={`mx-auto mb-2 ${getScoreColor(metric.value)}`} />
              <p className={`text-2xl font-black ${metric.isWpm ? 'text-white' : getScoreColor(metric.value)}`}>
                {metric.value}{metric.isWpm ? '' : '%'}
              </p>
              <p className="text-slate-400 text-xs mt-1">{metric.label}</p>
            </div>
          ))}
        </div>
        
        {/* Section Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {overallScorecard.sectionScores.map((section, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-bold">{section.section}</h4>
                <span className={`text-xl font-black ${getScoreColor(section.score)}`}>{section.score}%</span>
              </div>
              <p className="text-slate-400 text-sm mb-3">{section.feedback}</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(section.details).map(([key, value]) => (
                  <span key={key} className="px-2 py-1 rounded-full bg-slate-700/50 text-xs text-slate-300">
                    {key}: {value}%
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/30">
            <h4 className="text-green-400 font-bold mb-4 flex items-center gap-2">
              <Star size={20} />
              Strengths
            </h4>
            <ul className="space-y-2">
              {overallScorecard.strengths.map((s, i) => (
                <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <h4 className="text-amber-400 font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={20} />
              Areas to Improve
            </h4>
            <ul className="space-y-2">
              {overallScorecard.improvements.map((s, i) => (
                <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                  <Target size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Recommendation */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 max-w-4xl mx-auto">
          <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
            <Sparkles size={20} />
            Coach's Recommendation
          </h4>
          <p className="text-slate-300">{overallScorecard.recommendation}</p>
        </div>
        
        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setCurrentSection('selector')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold hover:shadow-lg transition-all"
          >
            <ArrowLeft size={20} />
            Continue Practice
          </button>
          <button
            onClick={resetSession}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-700 text-slate-300 font-bold hover:bg-slate-600 transition-colors"
          >
            <RefreshCw size={20} />
            Start Fresh
          </button>
        </div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================

  return (
    <div className="min-h-[600px] p-6 md:p-8">
      {currentSection === 'selector' && renderSectionSelector()}
      {currentSection === 'read-aloud' && renderReadAloud()}
      {currentSection === 'listen-repeat' && renderListenRepeat()}
      {currentSection === 'comprehension' && renderComprehension()}
      {currentSection === 'conversation' && renderConversation()}
      {currentSection === 'extemporaneous' && renderExtemporaneous()}
      {currentSection === 'summarize' && renderSummarize()}
      {currentSection === 'scorecard' && renderScorecard()}
    </div>
  );
};

export default CorporateVoicePractice;
