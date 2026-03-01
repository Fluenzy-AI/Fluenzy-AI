
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { GoogleGenAI, Modality } from '@google/genai';
import { 
  X, 
  Sparkles,
  CheckCircle2,
  Zap,
  ArrowRight,
  Mic2
} from 'lucide-react';
import { UserProfile, ModuleType, SessionRecord, QAPair, InterviewQA } from '../types';
import { SYSTEM_INSTRUCTIONS } from '../constants';
import { useTheme } from '../../src/contexts/ThemeContext';

// --- Utility Functions for Audio ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const HumanAvatar = ({ 
  isSpeaking, 
  isListening, 
  type
}: { 
  isSpeaking: boolean; 
  isListening: boolean; 
  type?: string;
}) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [mouthOpen, setMouthOpen] = useState(0);
  const requestRef = useRef<number>(null);

  const avatarImage = useMemo(() => {
    if (type === ModuleType.HR_INTERVIEW || type === ModuleType.COMPANY_WISE_HR) {
      return "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800"; 
    }
    if (type === ModuleType.TECH_INTERVIEW) {
      return "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=800"; 
    }
    return "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=800"; 
  }, [type]);

  useEffect(() => {
    const animate = (time: number) => {
      setTilt({ x: Math.sin(time / 1500) * 2, y: Math.cos(time / 2000) * 1 + (isListening ? 3 : 0) });
      setMouthOpen(isSpeaking ? Math.abs(Math.sin(time / 80)) * 15 : 0);
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isSpeaking, isListening]);

  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96 mx-auto perspective-1000">
      <div 
        className="w-full h-full relative transition-transform duration-700 ease-out"
        style={{ transform: `rotateY(${tilt.x}deg) rotateX(${-tilt.y}deg)`, transformStyle: 'preserve-3d' }}
      >
        <div className={`absolute -inset-10 rounded-full blur-[80px] opacity-20 transition-all duration-1000 ${
          isSpeaking ? 'bg-blue-400 scale-110' : isListening ? 'bg-emerald-400 scale-105' : 'bg-slate-200'
        }`} />
        <div className={`relative w-full h-full rounded-[5rem] overflow-hidden border-8 bg-slate-900 shadow-2xl transition-all duration-500 ${
          isSpeaking ? 'border-blue-500/50' : isListening ? 'border-emerald-500/50' : 'border-white/10'
        }`}>
          <img src={avatarImage} alt="Avatar" className="w-full h-full object-cover" />
          <div className="absolute top-[68%] left-1/2 -translate-x-1/2 w-16 h-2 bg-slate-900/60 rounded-full blur-[2px]"
               style={{ height: `${mouthOpen}px`, opacity: isSpeaking ? 0.8 : 0 }} />
        </div>
      </div>
    </div>
  );
};

const VoiceAgent: React.FC<{ user: UserProfile; onSessionEnd: (u: UserProfile) => void; onInterviewStart?: () => void }> = ({ user, onSessionEnd, onInterviewStart }) => {
  const { type } = useParams<{ type: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const isEnglishLearning = type === ModuleType.ENGLISH_LEARNING;
  const isHRInterview = type === ModuleType.HR_INTERVIEW;
  const isConversationPractice = type === ModuleType.CONVERSATION_PRACTICE;
  const isGDCoach = type === ModuleType.GD_COACH;
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  const sessionMeta: any = {
    lessonId: searchParams.get('lessonId'),
    lessonTitle: searchParams.get('lessonTitle') ? decodeURIComponent(searchParams.get('lessonTitle')!) : undefined,
    company: searchParams.get('company') ? decodeURIComponent(searchParams.get('company')!) : undefined,
    companyLogo: searchParams.get('companyLogo') ? decodeURIComponent(searchParams.get('companyLogo')!) : undefined,
    role: searchParams.get('role') ? decodeURIComponent(searchParams.get('role')!) : undefined,
    experience: searchParams.get('experience') ? decodeURIComponent(searchParams.get('experience')!) : undefined,
    difficulty: searchParams.get('difficulty') ? decodeURIComponent(searchParams.get('difficulty')!) : undefined,
    roundType: searchParams.get('roundType') ? decodeURIComponent(searchParams.get('roundType')!) : undefined,
    resumeText: searchParams.get('resumeText') ? decodeURIComponent(searchParams.get('resumeText')!) : undefined,
    isCompanyWise: searchParams.get('isCompanyWise') === 'true',
    focus: searchParams.get('focus') ? decodeURIComponent(searchParams.get('focus')!) : undefined,
    level: searchParams.get('level') ? decodeURIComponent(searchParams.get('level')!) : undefined
  };

  // Lesson-specific messaging for English
  const getLessonContext = () => {
    if (!isEnglishLearning || !sessionMeta?.lessonTitle) return null;
    const title = sessionMeta.lessonTitle.toLowerCase();
    if (title.includes('introduction') || title.includes('self')) {
      return {
        objective: "Practice introducing yourself confidently in English",
        coachMessage: "Let's build your confidence in self-introductions. I'll guide you through natural English expressions."
      };
    }
    if (title.includes('greetings') || title.includes('basic')) {
      return {
        objective: "Master everyday greetings and basic conversations",
        coachMessage: "Greetings are the foundation of communication. Let's practice common phrases you'll use daily."
      };
    }
    // Default for other lessons
    return {
      objective: `Practice ${sessionMeta.lessonTitle} skills`,
      coachMessage: `Let's work on your ${sessionMeta.lessonTitle.toLowerCase()} skills with targeted practice.`
    };
  };

  const lessonContext = getLessonContext();

  const currentQA = useRef({ question: '', answer: '' });
  const transcriptHistory = useRef<InterviewQA[]>([]);
  const startTimeRef = useRef(new Date());

  const topic = useMemo(() => {
    if (type === ModuleType.CONVERSATION_PRACTICE) return 'Daily Conversation';
    return sessionMeta?.isCompanyWise
      ? `${sessionMeta.company} - ${sessionMeta.role} (${sessionMeta.roundType})`
      : (sessionMeta?.lessonTitle || 'General Session');
  }, [sessionMeta, type]);

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(async (saveResults = false) => {
    if (sessionRef.current) { sessionRef.current.close(); sessionRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    setIsActive(false);
    setIsConnecting(false);
    setIsAiSpeaking(false);
    onSessionEnd(user);

    if (saveResults) {
      const endTime = new Date();

      // Evaluate each answer
      const evaluatedTranscripts = [];
      for (const qa of transcriptHistory.current) {
        try {
          const evaluation = await fetch('/api/evaluate-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: qa.question,
              answer: qa.answer,
              module: type,
              context: sessionMeta
            })
          }).then(r => r.json());

          evaluatedTranscripts.push({
            aiPrompt: qa.question,
            userAnswer: qa.answer,
            aiFeedback: evaluation.aiFeedback || 'Good response',
            idealAnswer: evaluation.idealAnswer || qa.answer,
            scores: evaluation.scores,
            perQuestionScore: evaluation.perQuestionScore
          });
        } catch (error) {
          console.error('Evaluation error:', error);
          evaluatedTranscripts.push({
            aiPrompt: qa.question,
            userAnswer: qa.answer,
            aiFeedback: 'Response recorded',
            idealAnswer: qa.answer,
            scores: { clarity: 7, relevance: 7, grammar: 7, confidence: 7, technicalAccuracy: 7 },
            perQuestionScore: 7
          });
        }
      }

      // Calculate aggregate score
      const totalScore = evaluatedTranscripts.reduce((sum, t) => sum + (t.perQuestionScore || 0), 0);
      const aggregateScore = evaluatedTranscripts.length > 0 ? totalScore / evaluatedTranscripts.length : 0;
      const status = aggregateScore >= 6 ? 'PASS' : 'FAIL';

      // Save to database
      try {
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module: type,
            targetCompany: sessionMeta?.company,
            role: sessionMeta?.role,
            startTime: startTimeRef.current.toISOString(),
            endTime: endTime.toISOString(),
            transcripts: evaluatedTranscripts,
            aggregateScore,
            status
          })
        });

        // Mark lesson as completed
        if (sessionMeta?.lessonId) {
          // ===== CRITICAL FIX: Route to correct endpoint based on module type =====
          let apiEndpoint = '/api/hr-complete'; // Default fallback
          let storageKey = 'hrProgress';
          let moduleLabel = 'HR_INTERVIEW';
          
          if (isEnglishLearning) {
            apiEndpoint = '/api/lesson-complete';
            storageKey = 'englishProgress';
            moduleLabel = 'ENGLISH_LEARNING';
          } else if (isGDCoach) {
            apiEndpoint = '/api/gd-complete';
            storageKey = 'gdProgress';
            moduleLabel = 'GD_COACH';
          } else if (type === ModuleType.TECH_INTERVIEW) {
            apiEndpoint = '/api/technical-complete';
            storageKey = 'technicalProgress';
            moduleLabel = 'TECH_INTERVIEW';
          } else if (type === ModuleType.COMPANY_WISE_HR || type === ModuleType.COMPANY_SPECIFIC) {
            apiEndpoint = '/api/company-complete';
            storageKey = 'companyProgress';
            moduleLabel = 'COMPANY_WISE_HR';
          } else if (type === ModuleType.CONVERSATION_PRACTICE) {
            apiEndpoint = '/api/daily-complete';
            storageKey = 'dailyProgress';
            moduleLabel = 'CONVERSATION_PRACTICE';
          } else if (type === ModuleType.FULL_MOCK) {
            apiEndpoint = '/api/mock-complete';
            storageKey = 'mockProgress';
            moduleLabel = 'FULL_MOCK';
          }

          try {
            console.log(`[SESSION_COMPLETE_DISPATCH_START] Module: ${moduleLabel}, Endpoint: ${apiEndpoint}, LessonID: ${sessionMeta.lessonId}`);
            
            const response = await fetch(apiEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lessonId: sessionMeta.lessonId })
            });
            
            console.log(`[SESSION_COMPLETE_API_RESPONSE] Module: ${moduleLabel}, Status: ${response.status}, OK: ${response.ok}`);
            
            // Trigger usage refresh in other components
            if (response.ok) {
              const responseData = await response.json();
              console.log(`[SESSION_COMPLETE_SUCCESS] Module: ${moduleLabel}, Response:`, responseData);
              
              // Set localStorage as backup
              const updateTimestamp = Date.now().toString();
              localStorage.setItem('usage-updated', updateTimestamp);
              localStorage.setItem(`usage-updated-${moduleLabel}`, updateTimestamp);
              console.log(`[SESSION_COMPLETE_STORAGE] Set usage-updated to ${updateTimestamp}`);
              
              // Dispatch custom event with module info
              const event = new CustomEvent('usage-updated', { 
                detail: { 
                  module: moduleLabel, 
                  timestamp: updateTimestamp,
                  lessonsCompleted: 1
                } 
              });
              window.dispatchEvent(event);
              console.log(`[SESSION_COMPLETE_EVENT_DISPATCH] Event fired for ${moduleLabel}`);
              
              // Also trigger page visibility event in case other tabs are listening
              if (document.visibilityState === 'visible') {
                console.log(`[SESSION_COMPLETE_PAGE_VISIBLE] Current page is visible, UI should update`);
              }
            } else {
              const errorText = await response.text();
              console.error(`[SESSION_COMPLETE_FAILED] Module: ${moduleLabel}, Status: ${response.status}, Error: ${errorText}`);
            }
          } catch (error) {
            console.error(`[SESSION_COMPLETE_ERROR] Module: ${moduleLabel}, Exception:`, error);
          }

          // Always update localStorage as backup
          const stored = localStorage.getItem(storageKey) || '{}';
          const progressData = JSON.parse(stored);
          progressData[sessionMeta.lessonId] = true;
          localStorage.setItem(storageKey, JSON.stringify(progressData));
          console.log(`[SESSION_COMPLETE_PROGRESS_STORED] Lesson marked complete in ${storageKey}`);
        }
      } catch (error) {
        console.error('Session save error:', error);
      }

      setIsFinished(true);
    }
  }, [type, sessionMeta, onSessionEnd, user]);

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);
    onInterviewStart?.();
    try {
      // Create a new instance with a named parameter for the API key.
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
      await inputAudioContextRef.current.resume();
      await outputAudioContextRef.current.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

    
      // Lesson-specific messaging for English
      const getLessonContext = () => {
        if (!isEnglishLearning || !sessionMeta?.lessonTitle) return null;
        const title = sessionMeta.lessonTitle.toLowerCase();
        if (title.includes('introduction') || title.includes('self')) {
          return {
            objective: "Practice introducing yourself confidently in English",
            coachMessage: "Let's build your confidence in self-introductions. I'll guide you through natural English expressions."
          };
        }
        if (title.includes('greetings') || title.includes('basic')) {
          return {
            objective: "Master everyday greetings and basic conversations",
            coachMessage: "Greetings are the foundation of communication. Let's practice common phrases you'll use daily."
          };
        }
        // Default for other lessons
        return {
          objective: `Practice ${sessionMeta.lessonTitle} skills`,
          coachMessage: `Let's work on your ${sessionMeta.lessonTitle.toLowerCase()} skills with targeted practice.`
        };
      };
    
      const lessonContext = getLessonContext();
      
      // Determine level from lesson ID for GD Coach
      const getGDLevel = () => {
        const lessonId = sessionMeta?.lessonId || '';
        const lessonNum = parseInt(lessonId.replace('gd', ''));
        if (lessonNum <= 8) return 'Beginner';
        if (lessonNum <= 16) return 'Intermediate';
        return 'Advanced';
      };

      const instruction = `
        ${SYSTEM_INSTRUCTIONS[type as ModuleType] || 'Senior Interview Coach.'}
        ${isEnglishLearning
          ? `CONTEXT: Lesson Topic: ${sessionMeta?.lessonTitle || 'General English Practice'}, User Proficiency Level: ${user.proficiency}. Focus on teaching English skills, not conducting interviews.`
          : isHRInterview
          ? `CONTEXT: HR Lesson Topic: ${sessionMeta?.lessonTitle || 'General HR Interview Practice'}. Focus on HR interview coaching, behavioral questions, and professional communication skills. Do not ask technical or coding questions.`
          : isConversationPractice
          ? `CONTEXT: Daily conversation practice. Engage in natural English speaking practice with topics like office small talk, daily life, and casual professional chats. User Proficiency Level: ${user.proficiency}. Be a friendly conversation partner, not an interviewer.`
          : isGDCoach
          ? `CONTEXT:
          Selected Level: ${getGDLevel()}
          Selected Chapter: ${sessionMeta?.lessonTitle || 'GD Practice'}
          Selected Module ID: ${sessionMeta?.lessonId || 'gd1'}
          
          STRICT INSTRUCTION: Teach ONLY this chapter "${sessionMeta?.lessonTitle}". Do NOT explain what GD is, GD rules, evaluation criteria, or any other chapter. Stay within the scope of this specific chapter only.`
          : `CONTEXT: Role: ${sessionMeta?.role || user.jobRole}, Company: ${sessionMeta?.company || 'Top MNC'}, Resume: ${sessionMeta?.resumeText || 'General Profile'}.
        Use your thinking budget to analyze resume projects and company requirements before every question.`
        }
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: instruction,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          thinkingConfig: { thinkingBudget: 24576 } // max budget for 2.5 Flash
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false); setIsActive(true);
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(scriptProcessor); scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (m) => {
            if (m.serverContent?.outputTranscription?.text) currentQA.current.question += m.serverContent.outputTranscription.text;
            if (m.serverContent?.inputTranscription?.text) currentQA.current.answer += m.serverContent.inputTranscription.text;
            if (m.serverContent?.turnComplete) {
              transcriptHistory.current.push({ ...currentQA.current, timestamp: new Date().toLocaleTimeString() });
              currentQA.current = { question: '', answer: '' };
            }
            const data = m.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (data) {
              const buf = await decodeAudioData(decode(data), outputAudioContextRef.current!, 24000, 1);
              const src = outputAudioContextRef.current!.createBufferSource();
              src.buffer = buf; src.connect(outputAudioContextRef.current!.destination);
              setIsAiSpeaking(true);
              src.onended = () => { sourcesRef.current.delete(src); if (sourcesRef.current.size === 0) setIsAiSpeaking(false); };
              src.start(Math.max(nextStartTimeRef.current, outputAudioContextRef.current!.currentTime));
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current!.currentTime) + buf.duration;
              sourcesRef.current.add(src);
            }
          },
          onerror: (e) => { console.error(e); setError("Handshake failure. Please check microphone."); cleanup(false); },
          onclose: () => cleanup(false),
        },
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      setIsConnecting(false);
      console.error('Microphone error:', err);

      let errorMessage = "Microphone access failed. ";
      if (err.name === 'NotAllowedError') {
        errorMessage += "Please allow microphone access in your browser settings and refresh the page.";
      } else if (err.name === 'NotFoundError') {
        errorMessage += "No microphone found. Please connect a microphone and try again.";
      } else if (err.name === 'NotReadableError') {
        errorMessage += "Microphone is being used by another application. Please close other apps using the microphone.";
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += "Microphone constraints not satisfied. Please check your audio settings.";
      } else {
        errorMessage += "Please check your microphone permissions and try again.";
      }

      setError(errorMessage);
    }
  };

  useEffect(() => {
    if (isFinished) {
      router.push('/train');
    }
  }, [isFinished, router]);

  // Prevent user from closing/navigating away while data is saving
  useEffect(() => {
    if (!isSaving) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isSaving]);

  return (
    <div className={`flex flex-col rounded-2xl md:rounded-3xl border overflow-hidden relative
      ${isLight
        ? 'bg-white border-slate-200 shadow-lg'
        : isEnglishLearning
          ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 shadow-2xl backdrop-blur-xl'
          : 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50 shadow-2xl backdrop-blur-xl'
      }`}>
      {/* Header */}
      <div className={`px-4 md:px-8 py-3 md:py-5 flex items-center justify-between border-b z-50
        ${isLight ? 'bg-white border-slate-100' : 'bg-slate-800/60 backdrop-blur-xl border-slate-700/50'}`}>
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <div className={`flex-shrink-0 ${
            isEnglishLearning ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-pink-500 to-purple-600'
          } text-white p-2 rounded-xl shadow-lg`}>
            <Sparkles size={18} />
          </div>
          <div className="min-w-0">
            <h2 className={`font-black text-base md:text-lg tracking-tight leading-tight truncate ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>{topic}</h2>
            {isEnglishLearning && lessonContext && (
              <p className={`text-xs font-medium mt-0.5 truncate ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>{lessonContext.objective}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => router.push('/train')}
          className={`flex-shrink-0 p-2 rounded-xl transition-all ml-2 ${
            isLight ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-900' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
          }`}
        >
          <X size={18} />
        </button>
      </div>
      
      <div className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center relative">
        {error && <div className={`absolute top-4 left-4 right-4 md:left-auto md:right-auto px-4 py-2 rounded-xl font-bold flex items-center gap-2 border z-[100] text-sm ${
          isLight ? 'bg-red-50 text-red-600 border-red-200' : 'bg-rose-900/50 text-rose-300 border-rose-700/50'
        }`}><Zap size={14} /> {error}</div>}
        {!isActive && !isConnecting ? (
        <div className="w-full max-w-lg mx-auto">
          <div className={`rounded-2xl border p-5 md:p-8 text-center space-y-5 animate-in fade-in duration-500 ${
            isLight
              ? 'bg-gradient-to-br from-slate-50 to-white border-slate-200 shadow-md'
              : 'bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border-slate-700/50 shadow-2xl'
          }`}>
            {/* Image + Title in row on mobile, column on desktop */}
            <div className="flex flex-row md:flex-col items-center gap-4 md:gap-0 text-left md:text-center">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 blur-lg scale-110" />
                <img
                  src="/image/img.png"
                  alt="AI Coach"
                  className="relative w-16 h-16 md:w-24 md:h-24 rounded-2xl border-2 border-slate-600/50 shadow-xl object-cover"
                />
              </div>
              <div className="flex-1 md:mt-3 space-y-1 md:space-y-2">
                <h3 className={`text-lg md:text-2xl font-black leading-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {isEnglishLearning
                    ? 'Your AI English Coach is Ready'
                    : isConversationPractice
                      ? 'Your AI Friend is Ready'
                      : sessionMeta?.lessonTitle
                        ? sessionMeta.lessonTitle
                        : sessionMeta?.isCompanyWise
                          ? `${sessionMeta?.company ? sessionMeta.company + ' ' : ''}Interview is Ready`
                          : 'HR Interview is Ready'
                  }
                </h3>
                <p className={`text-xs md:text-sm font-medium leading-relaxed hidden md:block ${
                  isLight ? 'text-slate-500' : 'text-slate-300'
                }`}>
                  {isEnglishLearning
                    ? (lessonContext?.coachMessage || 'Get ready to practice your English speaking skills with personalized coaching.')
                    : isConversationPractice
                      ? 'Chat with your AI friend in English — casual, natural, and fun. Great for building everyday fluency.'
                      : sessionMeta?.isCompanyWise
                        ? 'Prepare for your company-specific interview with structured practice and expert feedback.'
                        : `Practice behavioral and HR questions${sessionMeta?.lessonTitle ? ` for: ${sessionMeta.lessonTitle}` : ''} with expert AI coaching.`
                  }
                </p>
              </div>
            </div>
            {/* Description visible on mobile below row */}
            <p className={`text-xs font-medium leading-relaxed md:hidden ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              {isEnglishLearning
                ? (lessonContext?.coachMessage || 'Get ready to practice your English speaking skills.')
                : isConversationPractice
                  ? 'Chat with your AI friend in English — casual and fun.'
                  : sessionMeta?.isCompanyWise
                    ? 'Company-specific structured interview practice.'
                    : `HR behavioral practice${sessionMeta?.lessonTitle ? `: ${sessionMeta.lessonTitle}` : ''}.`
              }
            </p>
            {lessonContext && (
              <div className={`rounded-xl p-3 md:p-4 border ${
                isLight ? 'bg-blue-50 border-blue-100' : 'bg-blue-500/10 border-blue-500/20'
              }`}>
                <p className={`text-xs font-semibold mb-1 ${
                  isLight ? 'text-blue-500' : 'text-blue-300'
                }`}>🎯 Lesson Objective</p>
                <p className={`text-xs leading-relaxed ${
                  isLight ? 'text-slate-700' : 'text-white'
                }`}>{lessonContext.objective}</p>
              </div>
            )}
            <button
              onClick={startSession}
              className={`w-full py-3 md:py-4 rounded-full font-black uppercase tracking-[0.1em] shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all text-sm text-white bg-gradient-to-r ${
                isEnglishLearning
                  ? 'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                  : 'from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
              }`}
            >
              {isEnglishLearning ? 'Start Practice' : isConversationPractice ? 'Start Conversation' : 'Start Interview'}
            </button>
          </div>
        </div>
        ) : (
          <div className="w-full max-w-2xl mx-auto">
            <div className={`rounded-2xl border p-4 md:p-8 text-center space-y-4 md:space-y-6 animate-in zoom-in-95 duration-500 ${
              isLight
                ? 'bg-white border-slate-200 shadow-md'
                : 'bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border-slate-700/50 shadow-2xl'
            }`}>
              {/* Mobile: row layout (image + info side by side); md+: column centered */}
              <div className="flex flex-row md:flex-col items-center gap-4 md:gap-6 md:justify-center">
                <div className="relative flex-shrink-0">
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${isAiSpeaking ? 'from-blue-500/20 to-purple-500/20' : 'from-emerald-500/20 to-teal-500/20'} blur-xl scale-110`} />
                  <img
                    src="/image/img.png"
                    alt="AI Coach"
                    className={`relative rounded-2xl border-2 shadow-lg object-cover ${
                      isLight ? 'border-slate-200' : 'border-slate-600/50'
                    } w-14 h-14 md:w-24 md:h-24`}
                  />
                  <p className={`text-xs font-semibold mt-2 tracking-wide text-center ${isLight ? 'text-slate-500' : 'text-slate-300'}`}>
                    {isEnglishLearning ? 'AI Coach' : isConversationPractice ? 'AI Friend' : (sessionMeta?.isCompanyWise ? 'Company Coach' : 'HR Coach')}
                  </p>
                </div>
                <div className="flex-1 md:w-full space-y-2 md:space-y-4 text-left md:text-center">
                  <h4 className={`text-xs font-black uppercase tracking-[0.2em] ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>
                    {isEnglishLearning ? 'English Practice' : isConversationPractice ? 'Daily Conversation' : 'Interview Practice'}
                  </h4>
                  <p className={`text-sm md:text-xl font-bold leading-snug ${isLight ? 'text-slate-800' : 'text-white'}`}>
                    {isAiSpeaking
                      ? (isEnglishLearning
                          ? 'Your coach is speaking. Listen carefully.'
                          : isConversationPractice
                            ? 'Your friend is talking. Listen carefully.'
                            : 'Your coach is providing feedback. Listen carefully.'
                        )
                      : (isEnglishLearning
                          ? 'Your turn! Speak clearly.'
                          : isConversationPractice
                            ? 'Your turn! Just chat naturally.'
                            : 'Your turn! Answer professionally.'
                        )
                    }
                  </p>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs md:text-sm font-semibold ${
                    isAiSpeaking
                      ? (isLight ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-blue-500/10 border-blue-500/30 text-blue-300')
                      : (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-600 animate-pulse' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 animate-pulse')
                  }`}>
                    <Mic2 size={16} />
                    <span>{isAiSpeaking ? 'Coach Speaking' : (isEnglishLearning ? 'Your Turn' : 'Your Response')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isActive && (
        <div className="mt-4 md:mt-8 flex justify-center">
          <button
            onClick={async () => { setIsSaving(true); await cleanup(true); }}
            className="w-full md:w-auto bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white px-8 py-4 rounded-full font-black uppercase tracking-[0.1em] shadow-2xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-3"
          >
            {isEnglishLearning ? 'End Practice' : isConversationPractice ? 'End Conversation' : 'End Interview'} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {isConnecting && <div className={`absolute inset-0 z-[100] flex flex-col items-center justify-center space-y-6 rounded-2xl md:rounded-3xl ${isLight ? 'bg-white/95' : 'bg-slate-900/95'}`}>
        <div className={`w-16 h-16 md:w-20 md:h-20 border-[5px] rounded-full animate-spin ${isLight ? 'border-slate-200 border-t-blue-500' : 'border-slate-700 border-t-blue-400'}`} />
        <p className={`font-black uppercase tracking-[0.2em] text-xs md:text-sm ${isLight ? 'text-slate-700' : 'text-white'}`}>
          {isEnglishLearning ? 'Preparing Your Coach...' : 'Setting Up Interview Environment...'}
        </p>
      </div>}

      {isSaving && (
        <div className={`absolute inset-0 z-[200] flex flex-col items-center justify-center space-y-5 rounded-2xl md:rounded-3xl ${isLight ? 'bg-white/98' : 'bg-slate-900/98'}`}
          style={{ backdropFilter: 'blur(8px)' }}
        >
          {/* Pulsing save icon */}
          <div className="relative flex items-center justify-center w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
            <div className={`w-14 h-14 rounded-full border-4 border-t-emerald-500 animate-spin ${isLight ? 'border-slate-200' : 'border-slate-700'}`} />
          </div>
          <div className="text-center space-y-1 px-6">
            <p className={`font-black text-sm md:text-base uppercase tracking-[0.2em] ${isLight ? 'text-slate-800' : 'text-white'}`}>
              {isEnglishLearning ? 'Saving Practice Data...' : 'Saving Interview Data...'}
            </p>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Please wait, do not close this page
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceAgent;
