
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

const VoiceAgent: React.FC<{ user: UserProfile; onSessionEnd: (u: UserProfile) => void }> = ({ user, onSessionEnd }) => {
  const { type } = useParams<{ type: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const isEnglishLearning = type === ModuleType.ENGLISH_LEARNING;
  const isHRInterview = type === ModuleType.HR_INTERVIEW;
  const isConversationPractice = type === ModuleType.CONVERSATION_PRACTICE;
  const isGDCoach = type === ModuleType.GD_COACH;

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
          const apiEndpoint = isEnglishLearning ? '/api/lesson-complete' : isGDCoach ? '/api/gd-complete' : '/api/hr-complete';
          const storageKey = isEnglishLearning ? 'englishProgress' : isGDCoach ? 'gdProgress' : 'hrProgress';

          try {
            await fetch(apiEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lessonId: sessionMeta.lessonId })
            });
          } catch (error) {
            console.error('API completion failed, using localStorage');
          }

          // Always update localStorage as backup
          const stored = localStorage.getItem(storageKey) || '{}';
          const progressData = JSON.parse(stored);
          progressData[sessionMeta.lessonId] = true;
          localStorage.setItem(storageKey, JSON.stringify(progressData));
        }
      } catch (error) {
        console.error('Session save error:', error);
      }

      setIsFinished(true);
    }
  }, [type, sessionMeta]);

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);
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

  return (
    <div className={`min-h-[85vh] flex flex-col ${isEnglishLearning ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80' : 'bg-slate-50'} rounded-3xl border ${isEnglishLearning ? 'border-slate-700/50' : 'border-slate-200'} shadow-2xl overflow-hidden relative backdrop-blur-xl`}>
      <div className="bg-slate-800/60 backdrop-blur-xl border-slate-700/50 px-6 md:px-10 py-6 md:py-8 flex items-center justify-between border-b z-50">
        <div className="flex items-center gap-3 md:gap-5">
          <div className={`${isEnglishLearning ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-pink-600 to-purple-600'} text-white p-2 md:p-3 rounded-2xl shadow-lg`}>
            <Sparkles size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <h2 className="font-black text-white text-lg md:text-xl tracking-tight leading-tight">{topic}</h2>
            {isEnglishLearning && lessonContext && (
              <p className="text-slate-300 text-sm font-medium mt-1">{lessonContext.objective}</p>
            )}
          </div>
        </div>
        <button onClick={() => router.push('/train')} className="p-2 md:p-3 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-2xl transition-all"><X size={20} className="md:w-6 md:h-6" /></button>
      </div>
      
      <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center relative">
        {error && <div className={`absolute top-10 ${isEnglishLearning ? 'bg-rose-900/50 text-rose-300 border-rose-700/50' : 'bg-rose-50 text-rose-600 border-rose-100'} px-6 py-3 rounded-full font-bold flex items-center gap-2 border z-[100]`}><Zap size={16} /> {error}</div>}
        {!isActive && !isConnecting ? (
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl p-8 md:p-10 text-center space-y-8 animate-in fade-in duration-700">
            <div className="space-y-8">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-xl scale-110" />
                  <img
                    src="/image/img.png"
                    alt="AI English Coach"
                    className="relative w-28 h-28 md:w-32 md:h-32 rounded-3xl border-2 border-slate-600/50 shadow-xl object-cover"
                  />
                  <p className="text-xs font-semibold text-slate-300 mt-3 tracking-wide">
                    {isEnglishLearning ? 'AI English Coach' : 'AI HR Interview Coach'}
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">
                    {isEnglishLearning ? 'Your AI English Coach is Ready' : 'Your AI HR Interview Coach is Ready'}
                  </h3>
                  <p className="text-slate-300 max-w-lg mx-auto font-medium text-base leading-relaxed">
                    {isEnglishLearning
                      ? (lessonContext?.coachMessage || 'Get ready to practice your English speaking skills with personalized coaching.')
                      : 'Prepare for your HR interview with structured practice and expert feedback on your responses.'
                    }
                  </p>
                </div>
              </div>
              {lessonContext && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
                  <p className="text-blue-300 text-sm font-semibold mb-2">🎯 Lesson Objective</p>
                  <p className="text-white text-sm leading-relaxed">{lessonContext.objective}</p>
                </div>
              )}
            </div>
            <button
              onClick={startSession}
              className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full font-black uppercase tracking-[0.1em] shadow-2xl hover:scale-105 active:scale-95 transition-all text-sm"
            >
              {isEnglishLearning ? 'Start Practice' : 'Start Interview'}
            </button>
          </div>
        </div>
        ) : (
          <div className="w-full max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl p-8 md:p-10 text-center space-y-8 animate-in zoom-in-95 duration-500">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${isAiSpeaking ? 'from-blue-500/20 to-purple-500/20' : 'from-emerald-500/20 to-teal-500/20'} blur-xl scale-110`} />
                  <img
                    src="/image/img.png"
                    alt="AI English Coach"
                    className="relative w-28 h-28 md:w-32 md:h-32 rounded-3xl border-2 border-slate-600/50 shadow-xl object-cover"
                  />
                  <p className="text-xs font-semibold text-slate-300 mt-3 tracking-wide">AI English Coach</p>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em]">
                    {isEnglishLearning ? 'English Practice Session' : 'HR Interview Practice'}
                  </h4>
                  <p className="text-xl md:text-2xl font-black text-white leading-tight">
                    {isAiSpeaking
                      ? (isEnglishLearning
                          ? 'Your AI Coach is guiding you through this lesson. Listen and respond naturally.'
                          : 'Your HR Interview Coach is providing structured feedback. Listen carefully.'
                        )
                      : (isEnglishLearning
                          ? 'Your turn to practice! Speak clearly and confidently.'
                          : 'Your turn to respond! Structure your answer professionally.'
                        )
                    }
                  </p>
                  <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border ${isAiSpeaking ? 'bg-blue-500/10 border-blue-500/30 text-blue-300 shadow-lg shadow-blue-500/10' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-lg shadow-emerald-500/10 animate-pulse'}`}>
                    <Mic2 size={20} />
                    <span className="text-sm font-semibold">
                      {isAiSpeaking ? 'Coach Speaking' : (isEnglishLearning ? 'Your Turn' : 'Your Response')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isActive && (
        <div className="mt-8 flex justify-center">
          <button onClick={() => cleanup(true)} className="w-full md:w-auto bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white px-8 py-4 rounded-full font-black uppercase tracking-[0.1em] shadow-2xl hover:scale-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-3">
            {isEnglishLearning ? 'End Practice' : 'End Interview'} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {isConnecting && <div className={`absolute inset-0 ${isEnglishLearning ? 'bg-slate-900/95' : 'bg-white/95'} z-[100] flex flex-col items-center justify-center space-y-8`}>
        <div className={`w-20 h-20 border-[6px] ${isEnglishLearning ? 'border-slate-700 border-t-blue-500' : 'border-slate-100 border-t-blue-600'} rounded-full animate-spin`} />
        <p className="font-black text-white uppercase tracking-[0.2em] md:tracking-[0.4em] text-xs md:text-sm">
          {isEnglishLearning ? 'Preparing Your Coach...' : 'Setting Up Interview Environment...'}
        </p>
      </div>}
    </div>
  );
};

export default VoiceAgent;
