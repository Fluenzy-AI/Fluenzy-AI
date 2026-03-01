"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import {
  X, Sparkles, Zap, ArrowRight, Mic2, MicOff, Users, ShieldCheck, AlertCircle, Volume2, Activity, Play, Trophy, BarChart3, Star, CheckCircle2, History, ArrowLeft, Building2, Target, MessageSquare, UserCheck, Crown, Lightbulb, HandHeart, TrendingUp, ChevronRight
} from 'lucide-react';
import { UserProfile, ModuleType, SessionRecord, QAPair, GDRole } from '../types';

// --- Multi-Persona Audio Configuration ---
const VOICE_MAP: Record<string, string> = {
  "Mr. Sharma": "Charon", // Deep, Authoritative Male
  "Chandni": "Zephyr",    // High-pitched, Energetic Female
  "Priya": "Kore",        // Soft, Professional Female
  "Riya": "Zephyr",       // Sharp, Analytical Female
  "Arjun": "Fenrir",      // Assertive, Bold Male
  "Sneha": "Kore",        // Gentle, Cooperative Female
  "Rahul": "Puck",        // Friendly, Conversational Male
  "Kavya": "Zephyr"       // Youthful Female
};

const ALL_AI_PERSONAS = [
  { name: "Mr. Sharma", role: "HR Moderator", gender: "Male", description: "Authoritative, senior HR tone, deep baritone." },
  { name: "Chandni", role: "Initiator", gender: "Female", description: "Very energetic, enthusiastic, fast-paced." },
  { name: "Priya", role: "Info Provider", gender: "Female", description: "Calm, factual, researcher-like soft tone." },
  { name: "Riya", role: "Analyzer", gender: "Female", description: "Sharp, serious, professional urban accent." },
  { name: "Arjun", role: "Challenger", gender: "Male", description: "Loud, bold, assertive, competitive male." },
  { name: "Sneha", role: "Supporter", gender: "Female", description: "Gentle, cooperative, kind vocal tone." },
  { name: "Rahul", role: "Summarizer", gender: "Male", description: "Balanced, friendly, thoughtful male." }
];

// --- Audio Utilities ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
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

const ParticipantAvatar: React.FC<{ name: string, role: string, isSpeaking: boolean, isActive: boolean, isUser?: boolean, isMuted?: boolean }> = ({ name, role, isSpeaking, isActive, isUser, isMuted }) => (
  <div className={`relative flex flex-col items-center gap-2 transition-all duration-500 ${isActive ? 'opacity-100 scale-100' : 'opacity-40 scale-90'}`}>
    <div className={`relative w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${isSpeaking ? 'border-purple-500 scale-110 shadow-lg shadow-purple-500/40' : isUser ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/5 bg-slate-900'}`}>
      <div className={`absolute inset-0 flex items-center justify-center font-black text-xl ${isUser ? 'text-emerald-500' : 'text-slate-500'}`}>
        {name[0]}
      </div>
      {isSpeaking && <div className={`absolute inset-0 ${isUser ? 'bg-emerald-500/10' : 'bg-purple-500/10'} animate-pulse`} />}
      {isUser && isMuted && (
        <div className="absolute inset-0 bg-rose-500/40 backdrop-blur-[2px] flex items-center justify-center z-10">
          <MicOff size={18} className="text-white" />
        </div>
      )}
    </div>
    <div className="text-center">
      <p className={`text-[9px] font-black uppercase tracking-widest truncate w-20 ${isUser ? 'text-emerald-400' : 'text-white'}`}>
        {isUser ? `${name.split(' ')[0]} (You)` : name}
      </p>
      <p className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter truncate w-20">{role}</p>
    </div>
  </div>
);

interface EvaluationResult {
  name: string;
  role: string;
  scores: { leadership: number; logic: number; interjection: number; roleExecution: number; };
  feedback: string;
  isUser?: boolean;
}

const GDAgent: React.FC<{ user: UserProfile; onSessionEnd: (u: UserProfile) => void }> = ({ user, onSessionEnd }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string>('');
  const [evaluation, setEvaluation] = useState<EvaluationResult[] | null>(null);

  // Setup states
  const [participants, setParticipants] = useState(5);
  const [company, setCompany] = useState('Google');
  const [intensity, setIntensity] = useState('Moderate');
  const [topicMode, setTopicMode] = useState('Company-Based');
  const [selectedRole, setSelectedRole] = useState<GDRole>(GDRole.INITIATOR);
  const [canLaunch, setCanLaunch] = useState(false);

  const sessionMeta = {
    size: participants,
    lessonTitle: topicMode,
    company,
    role: selectedRole
  };

  const dynamicAI = ALL_AI_PERSONAS.slice(1, participants);
  const allParticipants = [ALL_AI_PERSONAS[0], ...dynamicAI, { name: user.name, role: selectedRole, isUser: true }];

  const transcriptRef = useRef<QAPair[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueue = useRef<{ name: string; buffer: AudioBuffer }[]>([]);
  const isPlayingAudio = useRef(false);

  const performEvaluation = async () => {
    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      const prompt = `
        Evaluate the following Group Discussion transcript. Provide role-based analysis for EVERY participant (AI and User).
        Transcript: ${JSON.stringify(transcriptRef.current)}

        Participants & Roles:
        ${allParticipants.map(p => `${p.name} as ${p.role}`).join('\n')}

        Evaluation Metrics: Leadership, Logic, Interjection, Role Execution (0-100).
        Output strictly as a JSON array of objects.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING },
                scores: {
                  type: Type.OBJECT,
                  properties: {
                    leadership: { type: Type.NUMBER },
                    logic: { type: Type.NUMBER },
                    interjection: { type: Type.NUMBER },
                    roleExecution: { type: Type.NUMBER }
                  }
                },
                feedback: { type: Type.STRING },
                isUser: { type: Type.BOOLEAN }
              },
              required: ["name", "role", "scores", "feedback"]
            }
          }
        }
      });

      const evalData = JSON.parse(response.text || "[]");
      setEvaluation(evalData);
    } catch (e) {
      console.error("Evaluation Error:", e);
      cleanup(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const cleanup = useCallback((saveResults = false) => {
    if (audioContextRef.current) audioContextRef.current.close();
    setIsActive(false);
    setIsProcessing(false);

    if (saveResults) {
      const userEval = evaluation?.find(e => e.isUser) || { scores: { roleExecution: 75 } };
      const endTime = new Date();
      const mockScore = (userEval as any).scores?.roleExecution || 80;
      const newSession: SessionRecord = {
        id: `gd_${Date.now()}`,
        date: new Date().toLocaleDateString(),
        startTime: new Date().toLocaleTimeString(),
        endTime: endTime.toLocaleTimeString(),
        durationMinutes: 15,
        type: ModuleType.GD_DISCUSSION,
        topic: sessionMeta.lessonTitle || "GD Discussion",
        score: mockScore,
        feedback: "Multi-persona GD session complete. Full role-based evaluation synced.",
        company: sessionMeta.company,
        role: sessionMeta.role,
        resumeUsed: false,
        resultStatus: mockScore > 80 ? 'Selected' : 'Borderline',
        readinessLevel: mockScore > 75 ? 'Interview Ready' : 'Needs Practice',
        transcript: transcriptRef.current,
        strengths: ["Role Compliance", "Neural Sync"],
        weaknesses: ["Interjection Frequency"],
        mistakes: [],
        skillScores: { communication: 85, confidence: 85, clarity: 80, hrReadiness: 80, companyFit: 85, content: 80 },
        analytics: { totalSpeakingTime: "12m", avgAnswerLength: "45s", pauseTime: "5s", responseSpeed: "Optimal", talkingBalance: "Good" },
        actionPlan: ["Watch interjection pacing"]
      };
      const updatedUser: UserProfile = JSON.parse(JSON.stringify(user));
      updatedUser.history = [newSession, ...updatedUser.history];
      onSessionEnd(updatedUser);
      setIsFinished(true);
    }
  }, [user, onSessionEnd, sessionMeta, evaluation]);

  // --- Audio Queue Processing ---
  const processAudioQueue = async () => {
    if (isPlayingAudio.current || audioQueue.current.length === 0 || !audioContextRef.current) return;
    isPlayingAudio.current = true;
    const { name, buffer } = audioQueue.current.shift()!;
    setActiveSpeaker(name);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => {
      isPlayingAudio.current = false;
      setActiveSpeaker('');
      processAudioQueue();
    };
    source.start(0);
  };

  const speakPersona = async (name: string, text: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      const voiceName = VOICE_MAP[name] || "Puck";
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Act as ${name}. Gender profile: ${VOICE_MAP[name] === 'Zephyr' || VOICE_MAP[name] === 'Kore' ? 'Female' : 'Male'}. Text: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
        }
      });
      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioBase64 && audioContextRef.current) {
        const audioBuffer = await decodeAudioData(decode(audioBase64), audioContextRef.current, 24000, 1);
        audioQueue.current.push({ name, buffer: audioBuffer });
        processAudioQueue();
      }
    } catch (e) { console.error("TTS Failed", e); }
  };

  const triggerNextAIPhase = async (userInputText?: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      const systemInstruction = `
        ROLE: GD Orchestrator. FAST RESPONSE MODE.
        Participants: ${allParticipants.map(p => `${p.name} as ${p.role}`).join(', ')}.
        Current Discussion Flow: Competitive but professional.
        GOAL: Generate next 1-2 interjections in JSON format. Respond to User if provided.
      `;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: userInputText || "Moderator starts the discussion with the topic: Digital Ethics in 2025." }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { speaker: { type: Type.STRING }, text: { type: Type.STRING } },
              required: ["speaker", "text"]
            }
          }
        }
      });
      const turns = JSON.parse(response.text || "[]");
      for (const turn of turns) {
        transcriptRef.current.push({ speaker: turn.speaker, text: turn.text, timestamp: new Date().toLocaleTimeString() });
        await speakPersona(turn.speaker, turn.text);
      }
    } catch (e) { setError("Neural Brain Sync latency high. Retrying..."); } finally { setIsProcessing(false); }
  };

  const startSession = async () => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    setIsActive(true);
    triggerNextAIPhase();
  };

  useEffect(() => {
    if (isFinished) {
      router.push('/train');
    }
  }, [isFinished, router]);

  useEffect(() => {
    const checkUsage = async () => {
      try {
        const response = await fetch('/api/training-usage');
        if (response.ok) {
          const data = await response.json();
          const isPro = data.plan?.toString().toLowerCase() === 'pro';
          setCanLaunch(isPro || (data.canUse?.gd ?? false));
        }
      } catch (error) {
        console.error('Usage check error:', error);
      }
    };
    checkUsage();

    // Listen for usage updates from other components
    const handleUsageUpdate = () => checkUsage();
    window.addEventListener('usage-updated', handleUsageUpdate);

    return () => {
      window.removeEventListener('usage-updated', handleUsageUpdate);
    };
  }, []);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const launchGDRoom = () => {
    setStep(6); // Launch the GD room
  };

  // Setup Steps UI
  if (step < 6) {
    return (
      <div className="bg-blue-950/40 backdrop-blur-xl rounded-3xl border border-blue-800/50 shadow-2xl overflow-hidden min-h-[600px] flex flex-col relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-blue-900/5 to-indigo-900/10 rounded-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(147,51,234,0.1),transparent_50%)] rounded-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)] rounded-3xl" />
        <div className="relative z-10 flex flex-col min-h-[600px]">
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-700/50">
          <button
            onClick={() => {
              try {
                step > 1 ? prevStep() : router.push('/train');
              } catch (error) {
                console.error('Navigation error:', error);
                window.location.href = '/train';
              }
            }}
            className="flex items-center gap-2 text-slate-400 font-bold text-sm md:text-base hover:text-slate-300 transition-colors p-2 md:p-0"
          >
            <ArrowLeft size={16} />
            {step > 1 ? 'Previous Step' : 'Back to Modules'}
          </button>
          <div className="flex gap-1 md:gap-2">
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} className={`h-1.5 w-8 md:w-12 rounded-full transition-all ${step >= s ? 'bg-purple-500' : 'bg-slate-600'}`}></div>
            ))}
          </div>
        </div>

        <div className="flex-1 p-6 md:p-12">
          {/* Step 1: Discussion Size */}
          {step === 1 && (
            <div className="space-y-8 md:space-y-10 flex-1 animate-in slide-in-from-right-4 duration-500 ease-out">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Discussion Size</h2>
                <p className="text-slate-300 font-medium">How many participants should join this GD session?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 max-w-4xl mx-auto">
                {[3, 4, 5, 6, 8].map(size => (
                  <button
                    key={size}
                    onClick={() => { setParticipants(size); nextStep(); }}
                    className={`w-full p-4 md:p-8 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2 md:gap-4 hover:shadow-lg touch-manipulation ${
                      participants === size ? 'border-purple-500 bg-purple-900/30' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 backdrop-blur-sm'
                    }`}
                  >
                    <Users size={24} className={`md:w-8 md:h-8 ${participants === size ? 'text-purple-400' : 'text-slate-400'}`} />
                    <span className="font-bold text-white text-sm md:text-base">{size} People</span>
                    <span className="text-xs text-slate-300 text-center">Includes You + {size - 1} AI Agents + 1 HR Moderator</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Environment */}
          {step === 2 && (
            <div className="space-y-8 md:space-y-10 flex-1 animate-in slide-in-from-right-4 duration-500 ease-out">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Environment Setup</h2>
                <p className="text-slate-300 font-medium">Configure the GD environment and intensity.</p>
              </div>

              <div className="space-y-6 md:space-y-8 max-w-lg mx-auto">
                <div className="space-y-3">
                  <label className="text-sm font-black uppercase text-slate-400 tracking-widest px-2">Target Company</label>
                  <select
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-2xl px-6 py-4 font-bold text-white focus:ring-2 focus:ring-purple-500 transition-all outline-none backdrop-blur-sm"
                  >
                    <option>Google</option>
                    <option>Amazon</option>
                    <option>Microsoft</option>
                    <option>Meta</option>
                    <option>Apple</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black uppercase text-slate-400 tracking-widest px-2">Intensity Level</label>
                  <div className="grid grid-cols-3 gap-3 md:gap-4">
                    {['Calm', 'Moderate', 'Aggressive'].map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => setIntensity(lvl)}
                        className={`py-3 md:py-4 rounded-2xl font-bold transition-all border-2 touch-manipulation ${
                          intensity === lvl ? 'border-purple-500 bg-purple-600 text-white shadow-lg' : 'border-slate-600 bg-slate-800/50 text-slate-300 backdrop-blur-sm'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-6 md:pt-8">
                <button onClick={nextStep} className="bg-slate-800 text-white px-8 md:px-12 py-3 md:py-4 rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm flex items-center gap-2 hover:bg-slate-700 transition-all touch-manipulation">
                  Topic Config <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Topic Configuration */}
          {step === 3 && (
            <div className="space-y-8 md:space-y-10 flex-1 animate-in slide-in-from-right-4 duration-500 ease-out">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Topic Configuration</h2>
                <p className="text-slate-300 font-medium">Choose how the GD topic should be generated.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
                {[
                  { id: 'Company-Based', icon: Building2, desc: 'Topics relevant to the selected company' },
                  { id: 'Random-Based', icon: Target, desc: 'Random contemporary topics' },
                  { id: 'Custom-Based', icon: MessageSquare, desc: 'Custom topic input' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setTopicMode(t.id); nextStep(); }}
                    className={`w-full p-4 md:p-6 rounded-3xl border-2 flex flex-col items-center text-center gap-3 md:gap-4 transition-all touch-manipulation ${
                      topicMode === t.id ? 'border-purple-500 bg-purple-900/30' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 backdrop-blur-sm'
                    }`}
                  >
                    <div className={`p-3 rounded-2xl ${topicMode === t.id ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                      <t.icon size={24} />
                    </div>
                    <div>
                      <p className="font-black text-white uppercase tracking-widest text-[10px] mb-1">{t.id}</p>
                      <p className="text-xs text-slate-300 font-medium">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Role Selection */}
          {step === 4 && (
            <div className="space-y-8 md:space-y-10 flex-1 animate-in slide-in-from-right-4 duration-500 ease-out">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Role Selection</h2>
                <p className="text-slate-300 font-medium">Choose your role in the group discussion.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
                {[
                  { id: GDRole.INITIATOR, icon: Crown, desc: 'Start discussions, set agenda' },
                  { id: GDRole.INFO_PROVIDER, icon: Lightbulb, desc: 'Provide facts and data' },
                  { id: GDRole.ANALYZER, icon: TrendingUp, desc: 'Analyze and evaluate ideas' },
                  { id: GDRole.MODERATOR, icon: ShieldCheck, desc: 'Facilitate and manage flow' },
                  { id: GDRole.SUPPORTER, icon: HandHeart, desc: 'Support and encourage others' },
                  { id: GDRole.CHALLENGER, icon: Zap, desc: 'Challenge ideas constructively' },
                  { id: GDRole.CONCLUDER, icon: CheckCircle2, desc: 'Summarize and conclude' }
                ].map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setSelectedRole(r.id); nextStep(); }}
                    className={`w-full p-4 md:p-6 rounded-3xl border-2 flex flex-col items-center text-center gap-3 md:gap-4 transition-all touch-manipulation ${
                      selectedRole === r.id ? 'border-purple-500 bg-purple-900/30' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 backdrop-blur-sm'
                    }`}
                  >
                    <div className={`p-3 rounded-2xl ${selectedRole === r.id ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                      <r.icon size={24} />
                    </div>
                    <div>
                      <p className="font-black text-white uppercase tracking-widest text-[10px] mb-1">{r.id.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-300 font-medium">{r.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Mission Briefing */}
          {step === 5 && (
            <div className="space-y-8 md:space-y-10 flex-1 animate-in slide-in-from-right-4 duration-500 ease-out">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Mission Briefing</h2>
                <p className="text-slate-300 font-medium">Review your GD configuration and prepare for launch.</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-slate-800/50 p-6 md:p-8 rounded-3xl border border-slate-600 space-y-6 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Target Company</p>
                      <p className="font-bold text-white">{company}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Intensity</p>
                      <p className="font-bold text-white">{intensity}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Participants</p>
                      <p className="font-bold text-white">{participants}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Your Role</p>
                      <p className="font-bold text-white">{selectedRole.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                    <p className="text-sm text-slate-300 font-medium">
                      HR Manager will start the session. You must speak ONLY in English. Jump in during pauses or interject politely.
                    </p>
                  </div>
                </div>

                <div className="flex justify-center pt-6">
                  {canLaunch ? (
                    <button
                      onClick={() => {
                        try {
                          launchGDRoom();
                        } catch (error) {
                          console.error('Launch error:', error);
                        }
                      }}
                      className="bg-purple-600 text-white px-12 md:px-20 py-4 md:py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-xs md:text-sm shadow-2xl shadow-purple-500/25 hover:bg-purple-700 transition-all transform hover:scale-105 touch-manipulation"
                    >
                      Launch GD Room
                    </button>
                  ) : (
                    <div className="text-center">
                      <p className="text-red-400 font-bold">Usage limit reached. Upgrade to continue.</p>
                      <button onClick={() => window.location.href = '/api/create-checkout-session'} className="mt-2 bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition-all">
                        Upgrade Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    );
  }

  // GD Room UI (Step 6)
  if (evaluation) {
    return (
      <div className="bg-slate-900/30 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
        <div className="p-6 md:p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">Performance Scoreboard</h1>
              <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-500" /> Neural GD Analysis Complete
              </p>
            </div>
            <button onClick={() => cleanup(true)} className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl hover:scale-105 transition-all touch-manipulation">Save to Archive</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {evaluation.map((ev, i) => (
              <div key={i} className={`p-6 rounded-3xl border transition-all ${ev.isUser ? 'bg-purple-600 border-purple-400 shadow-[0_0_50px_rgba(147,51,234,0.3)]' : 'bg-slate-800/50 border-slate-600 backdrop-blur-sm shadow-xl'}`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${ev.isUser ? 'bg-white text-purple-600' : 'bg-slate-700 text-slate-400'}`}>
                    {ev.name[0]}
                  </div>
                  <div>
                    <p className="font-black text-white uppercase tracking-tight text-lg">{ev.isUser ? `${ev.name} (You)` : ev.name}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${ev.isUser ? 'text-purple-200' : 'text-slate-500'}`}>{ev.role}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {[
                    { label: 'Leadership', val: ev.scores.leadership, icon: Star },
                    { label: 'Logic', val: ev.scores.logic, icon: Zap },
                    { label: 'Interjection', val: ev.scores.interjection, icon: Volume2 },
                    { label: 'Role Execution', val: ev.scores.roleExecution, icon: Trophy }
                  ].map((s, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="flex items-center gap-1.5 opacity-60"><s.icon size={12} /> {s.label}</span>
                        <span className="text-white">{s.val}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${ev.isUser ? 'bg-white' : 'bg-purple-500'}`} style={{ width: `${s.val}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`p-4 rounded-2xl text-[11px] font-bold leading-relaxed ${ev.isUser ? 'bg-purple-700/50 text-purple-100' : 'bg-slate-900/50 text-slate-400 border border-slate-700'}`}>
                  "{ev.feedback}"
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/30 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden min-h-[600px] flex flex-col relative text-white">
      {/* Header */}
      <div className="px-10 py-6 flex items-center justify-between border-b border-white/5 z-50 bg-slate-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-5">
          <div className="bg-purple-600 text-white p-3 rounded-2xl shadow-lg"><Users size={24} /></div>
          <div>
            <h2 className="font-black text-white text-xl tracking-tight leading-tight">Neural GD Room</h2>
            <p className="text-[10px] font-black uppercase text-purple-400 tracking-widest mt-1">
              {isActive ? 'Live Interaction | Fast Engine Active' : 'Establishing Vocal Identities...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isActive && (
            <button onClick={() => setMicEnabled(!micEnabled)} className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-black uppercase text-[10px] tracking-widest transition-all ${micEnabled ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/10' : 'bg-rose-600 text-white shadow-lg'}`}>
              {micEnabled ? <Mic2 size={14} /> : <MicOff size={14} />} {micEnabled ? 'MIC READY' : 'MUTED'}
            </button>
          )}
          <button onClick={() => {
            try {
              router.push('/train');
            } catch (error) {
              console.error('Navigation error:', error);
              window.location.href = '/train';
            }
          }} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X size={24} /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row relative">
        <div className="flex-1 p-8 flex flex-col items-center justify-center relative">
          {!isActive ? (
            <div className="text-center space-y-12 animate-in fade-in zoom-in duration-700">
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 bg-purple-500 blur-[60px] opacity-30 animate-pulse" />
                <div className="relative bg-purple-600 rounded-[3rem] w-full h-full flex items-center justify-center shadow-2xl"><Zap size={48} className="text-white fill-white" /></div>
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black text-white tracking-tight uppercase">Enter Neural Discussion</h3>
                <p className="text-slate-400 max-w-sm mx-auto font-medium leading-relaxed">Latency Optimized: Powered by Flash Neural Engine for real-time interjections.</p>
              </div>
              <button onClick={startSession} className="bg-white text-slate-900 px-24 py-7 rounded-full font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all text-xs">Begin Session</button>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-12">
              <div className={`grid gap-x-6 gap-y-10 items-center justify-center ${participants > 6 ? 'grid-cols-4 md:grid-cols-5' : 'grid-cols-3 md:grid-cols-4'}`}>
                {allParticipants.map((p, i) => (
                  <ParticipantAvatar key={i} name={p.name as string} role={p.role as string} isSpeaking={activeSpeaker === p.name} isActive={true} isUser={'isUser' in p} isMuted={('isUser' in p) && !micEnabled} />
                ))}
              </div>

              <div className="relative w-48 h-48 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full border-4 border-dashed transition-all duration-1000 ${isProcessing || isPlayingAudio.current ? 'border-purple-500 animate-spin-slow scale-110 shadow-[0_0_50px_rgba(168,85,247,0.2)]' : 'border-white/10'}`} />
                <div className={`w-36 h-36 rounded-full bg-slate-900 flex flex-col items-center justify-center shadow-2xl border transition-all ${isProcessing || isPlayingAudio.current ? 'border-purple-500' : 'border-white/5'}`}>
                  {isPlayingAudio.current ? <Volume2 size={40} className="text-purple-500 animate-pulse" /> : isProcessing ? <Zap size={40} className="text-amber-500 animate-pulse" /> : <Mic2 size={40} className="text-emerald-500" />}
                  <p className={`mt-4 text-[9px] font-black uppercase tracking-widest ${isPlayingAudio.current ? 'text-purple-500' : 'text-slate-400'}`}>
                    {isPlayingAudio.current ? 'AI INTERJECTING' : isProcessing ? 'THINKING...' : 'LIVE FEED'}
                  </p>
                </div>
              </div>

              {!isPlayingAudio.current && !isProcessing && (
                <button onClick={() => triggerNextAIPhase("I believe technology is not just displacing jobs, it's evolving them.")} className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-12 py-5 rounded-full font-black uppercase tracking-widest text-[11px] hover:bg-emerald-500 hover:text-white transition-all animate-bounce shadow-xl">Interject Now</button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-96 bg-black/40 border-l border-white/5 p-8 flex flex-col gap-6">
          <h4 className="text-[10px] font-black uppercase text-purple-400 tracking-[0.3em] pb-2 border-b border-white/5 flex items-center gap-2"><Activity size={14} /> GD ANALYTICS</h4>
          <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
            <div className="flex justify-between items-center"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">ENGINE LATENCY</p><Zap size={16} className="text-amber-500" /></div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{ width: '92%' }}></div></div>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">FLASH OPTIMIZATION: ACTIVE</p>
          </div>
          <div className="p-6 bg-purple-500/5 rounded-3xl border border-purple-500/10">
            <p className="text-[10px] font-black uppercase text-purple-400 tracking-widest mb-3">CURRENT DYNAMICS</p>
            <div className="space-y-3">
              <p className="text-xs text-white font-bold leading-relaxed">{activeSpeaker ? `${activeSpeaker} is speaking as ${VOICE_MAP[activeSpeaker]} neural profile.` : isProcessing ? "Brain is calculating logical counters..." : "Room is open for your leadership interjection."}</p>
              <div className="flex items-center gap-2 text-[8px] font-black text-slate-500 uppercase tracking-tighter"><Play size={10} className="fill-slate-500" /> ROLE-BASED EVALUATION ACTIVE</div>
            </div>
          </div>
          <div className="mt-auto p-4 border border-white/5 rounded-2xl bg-white/2">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">TARGET ROUND</p>
            <p className="text-[10px] font-bold text-white uppercase">{sessionMeta.company || 'GLOBAL'} GD ROUND</p>
          </div>
        </div>
      </div>

      {isActive && (
        <div className="px-10 py-8 border-t border-white/5 flex justify-center bg-slate-900/50 backdrop-blur-md sticky bottom-0 z-50">
          <button onClick={performEvaluation} className="group bg-rose-600 hover:bg-rose-700 text-white px-24 py-5 rounded-full font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50" disabled={isProcessing}>
            {isProcessing ? 'Calculating Scoreboard...' : 'Conclude GD Session'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
};

export default GDAgent;
