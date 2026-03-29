"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  ClipboardList,
  Code,
  Mic,
  Video,
  Users,
  Timer,
  Target,
  Building2,
  Play,
  ArrowRight,
  ArrowLeft,
  Send,
  Loader2,
  AlertCircle,
  StopCircle,
  Mic2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GoogleGenAI, Modality } from "@google/genai";
import dynamic from "next/dynamic";

// Dynamically import GD and Voice players to avoid SSR issues with Agora
const GDAssessmentPlayer = dynamic(
  () => import("@/components/assessments/candidate/GDAssessmentPlayer"),
  { ssr: false, loading: () => <div className="flex items-center justify-center min-h-[600px]"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div> }
);

const VoiceAssessmentPlayer = dynamic(
  () => import("@/components/assessments/candidate/VoiceAssessmentPlayer"),
  { ssr: false, loading: () => <div className="flex items-center justify-center min-h-[600px]"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div> }
);

const CorporateVoicePlayer = dynamic(
  () => import("@/components/assessments/candidate/CorporateVoicePlayer"),
  { ssr: false, loading: () => <div className="flex items-center justify-center min-h-[600px]"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div> }
);

interface Question {
  id: string;
  text: string;
  type: "single" | "multiple";
  options: string[];
  correctAnswers: number[];
  marks: number;
}

interface AssessmentData {
  session: {
    id: string;
    status: string;
    startedAt: string | null;
    expiresAt: string | null;
  };
  assessment: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    duration: number;
    passingScore: number;
    questionsCount: number;
  };
  candidate: {
    name: string;
    email: string;
    jobTitle: string;
  };
  company: {
    name: string;
    logo: string | null;
  };
  questions?: Question[];
  agora?: {
    appId: string;
    channel: string;
    token: string;
    uid: number;
  };
  gdRoomId?: string;
  gdTopic?: string;
  voiceConfig?: {
    audioOnly: boolean;
    categories: string[];
  };
  corporateVoiceConfig?: {
    subType: "read_aloud" | "listen_repeat" | "comprehension" | "conversation" | "extemporaneous" | "listen_summarize";
    passages?: string[];
    audioPrompts?: string[];
    comprehensionAudio?: string;
    comprehensionQuestions?: Array<{
      question: string;
      options: string[];
      correctIndex: number;
    }>;
    conversationTopic?: string;
    extemporaneousTopic?: string;
    prepTime?: number;
    summarizePassage?: string;
    duration?: number;
  };
}

const assessmentTypeIcons: Record<string, any> = {
  MCQ: ClipboardList,
  CODING: Code,
  AI_INTERVIEW: Mic,
  VOICE: Video,
  GD: Users,
  CORPORATE_VOICE: Mic,
};

const assessmentTypeLabels: Record<string, string> = {
  MCQ: "Multiple Choice",
  CODING: "Coding Challenge",
  AI_INTERVIEW: "AI Interview",
  VOICE: "Voice Interview",
  GD: "Group Discussion",
  CORPORATE_VOICE: "Corporate Voice Assessment",
};

export default function CandidateAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // MCQ State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | number[]>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // AI Interview State
  const [isAIInterviewActive, setIsAIInterviewActive] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiTranscript, setAiTranscript] = useState("");
  const [userTranscript, setUserTranscript] = useState("");
  const [interviewTranscripts, setInterviewTranscripts] = useState<Array<{
    question: string;
    answer: string;
    timestamp: string;
  }>>([]);
  const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(null);
  const [showEndInterviewConfirm, setShowEndInterviewConfirm] = useState(false);
  
  // AI Interview Refs
  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const currentQARef = useRef<{ question: string; answer: string }>({ question: "", answer: "" });
  const transcriptHistoryRef = useRef<Array<{ question: string; answer: string; timestamp: string }>>([]);
  const nextPlayTimeRef = useRef<number>(0);

  // Result State
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    timeTaken: number;
    passingScore: number;
  } | null>(null);

  // Fetch assessment data
  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/candidate/assessment/${token}`);
        const data = await response.json();

        if (!response.ok) {
          if (data.completed) {
            setResult({
              score: data.score,
              passed: data.passed,
              timeTaken: 0,
              passingScore: 0,
            });
          }
          setError(data.error || "Failed to load assessment");
          return;
        }

        setAssessmentData(data);
        
        if (data.session.status === "IN_PROGRESS" && data.questions) {
          setHasStarted(true);
          setQuestions(data.questions);
          // Calculate remaining time
          if (data.session.startedAt) {
            const startTime = new Date(data.session.startedAt).getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);
            const total = data.assessment.duration * 60;
            setTimeRemaining(Math.max(0, total - elapsed));
          }
        }
      } catch (err) {
        setError("Network error. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchAssessment();
    }
  }, [token]);

  // Timer countdown
  useEffect(() => {
    if (!hasStarted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
    try {
      setIsStarting(true);
      const response = await fetch(`/api/candidate/assessment/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start assessment");
      }

      if (data.questions) {
        setQuestions(data.questions);
      }
      
      // Update assessmentData with Agora credentials and config for Voice/GD/Corporate Voice
      if (assessmentData) {
        setAssessmentData({
          ...assessmentData,
          agora: data.agora || assessmentData.agora,
          gdTopic: data.gdTopic || assessmentData.gdTopic,
          voiceConfig: data.voiceConfig || assessmentData.voiceConfig,
          corporateVoiceConfig: data.corporateVoiceConfig || assessmentData.corporateVoiceConfig,
          session: {
            ...assessmentData.session,
            status: "IN_PROGRESS",
            startedAt: data.session?.startedAt || new Date().toISOString(),
          },
        });
      }
      
      setHasStarted(true);
      setTimeRemaining(assessmentData!.assessment.duration * 60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsStarting(false);
    }
  };

  const handleAnswer = (questionIndex: number, answer: number | number[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit) {
      setShowSubmitConfirm(true);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/candidate/assessment/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          answers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit assessment");
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  // ============= AI Interview Functions =============
  
  // Audio decode helper
  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Decode audio data to AudioBuffer
  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number
  ): Promise<AudioBuffer> => {
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
  };

  // Start AI Interview
  const startAIInterview = async () => {
    if (!assessmentData) return;

    try {
      setIsStarting(true);
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 16000, 
          channelCount: 1, 
          echoCancellation: true,
          noiseSuppression: true 
        } 
      });
      mediaStreamRef.current = stream;

      // Create audio contexts
      inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
      await inputAudioContextRef.current.resume();
      await outputAudioContextRef.current.resume();

      // Initialize Google Gemini AI
      const ai = new GoogleGenAI({ 
        apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" 
      });

      // Build system instruction for assessment interview
      const systemInstruction = `You are an AI Interviewer conducting a professional job interview assessment.

CONTEXT:
- Company: ${assessmentData.company.name}
- Position: ${assessmentData.candidate.jobTitle}
- Candidate: ${assessmentData.candidate.name}
- Assessment: ${assessmentData.assessment.title}
- Duration: ${assessmentData.assessment.duration} minutes

YOUR ROLE:
1. Start by greeting the candidate and introducing yourself
2. Ask relevant interview questions one at a time
3. Listen carefully to answers and ask follow-up questions
4. Evaluate communication skills, technical knowledge, and problem-solving
5. Be professional but friendly
6. Keep track of time and wrap up appropriately
7. At the end, thank the candidate

GUIDELINES:
- Ask clear, concise questions
- Allow candidate to fully answer before asking next question
- Mix behavioral and technical questions relevant to the role
- Provide brief acknowledgments after answers
- Total interview should have 5-8 main questions
- End with asking if candidate has any questions for you

Begin the interview now with a warm greeting.`;

      // Helper to encode audio
      const encodeAudio = (bytes: Uint8Array) => {
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      };

      // Connect to Gemini Live API with callbacks
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: systemInstruction,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsStarting(false);
            setIsAIInterviewActive(true);
            setHasStarted(true);
            setInterviewStartTime(new Date());
            setTimeRemaining(assessmentData!.assessment.duration * 60);

            // Set up audio input streaming
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const processor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16Data = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16Data[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
              }
              sessionPromise.then(s => {
                s.sendRealtimeInput({ 
                  media: { 
                    data: encodeAudio(new Uint8Array(int16Data.buffer)), 
                    mimeType: 'audio/pcm;rate=16000' 
                  } 
                });
              });
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (m: any) => {
            // Handle AI's transcription (what AI is saying)
            if (m.serverContent?.outputTranscription?.text) {
              const text = m.serverContent.outputTranscription.text;
              currentQARef.current.question += text;
              setAiTranscript(prev => prev + text);
            }

            // Handle user's transcription (what user is saying)
            if (m.serverContent?.inputTranscription?.text) {
              const text = m.serverContent.inputTranscription.text;
              currentQARef.current.answer += text;
              setUserTranscript(prev => prev + text);
            }

            // Handle audio output
            if (m.data) {
              try {
                const audioData = decodeBase64(m.data);
                if (outputAudioContextRef.current) {
                  const audioBuffer = await decodeAudioData(
                    audioData, 
                    outputAudioContextRef.current, 
                    24000, 
                    1
                  );
                  
                  const source = outputAudioContextRef.current.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(outputAudioContextRef.current.destination);
                  
                  const startTime = Math.max(
                    outputAudioContextRef.current.currentTime, 
                    nextPlayTimeRef.current
                  );
                  source.start(startTime);
                  nextPlayTimeRef.current = startTime + audioBuffer.duration;
                  
                  setIsAISpeaking(true);
                  source.onended = () => {
                    setIsAISpeaking(false);
                    setIsListening(true);
                  };
                }
              } catch (e) {
                console.error("Audio playback error:", e);
              }
            }

            // Handle turn completion
            if (m.serverContent?.turnComplete) {
              if (currentQARef.current.question || currentQARef.current.answer) {
                const qa = {
                  question: currentQARef.current.question.trim(),
                  answer: currentQARef.current.answer.trim(),
                  timestamp: new Date().toLocaleTimeString(),
                };
                transcriptHistoryRef.current.push(qa);
                setInterviewTranscripts([...transcriptHistoryRef.current]);
                currentQARef.current = { question: "", answer: "" };
                setAiTranscript("");
                setUserTranscript("");
              }
            }
          },
          onerror: (e: any) => {
            console.error("Session error:", e);
            setError("Interview session error. Please try again.");
          },
        },
      });

      const session = await sessionPromise;
      sessionRef.current = session;

      // Mark assessment as started in the backend
      fetch(`/api/candidate/assessment/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      }).catch(err => console.error("Failed to mark assessment started:", err));

    } catch (err: any) {
      console.error("Failed to start AI interview:", err);
      setError(err.message || "Failed to start AI interview. Please check microphone permissions.");
      setIsStarting(false);
    }
  };

  // End AI Interview and submit results
  const endAIInterview = async (skipConfirm = false) => {
    if (!skipConfirm) {
      setShowEndInterviewConfirm(true);
      return;
    }

    try {
      setIsSubmitting(true);
      setShowEndInterviewConfirm(false);

      // Stop audio processing
      if (processorRef.current) {
        processorRef.current.disconnect();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (sessionRef.current) {
        sessionRef.current.close();
      }
      if (inputAudioContextRef.current) {
        inputAudioContextRef.current.close();
      }
      if (outputAudioContextRef.current) {
        outputAudioContextRef.current.close();
      }

      setIsAIInterviewActive(false);
      setIsAISpeaking(false);
      setIsListening(false);

      const endTime = new Date();
      const transcripts = transcriptHistoryRef.current;
      
      // Calculate interview duration
      const durationMinutes = interviewStartTime 
        ? Math.ceil((endTime.getTime() - interviewStartTime.getTime()) / 60000)
        : assessmentData?.assessment.duration || 10;

      // Simple scoring based on transcript quality
      const evaluatedTranscripts = [];
      let totalScore = 0;

      for (const qa of transcripts) {
        if (qa.question && qa.answer) {
          // Simple heuristic scoring
          const wordCount = qa.answer.split(/\s+/).length;
          let score = 5; // Base score
          
          // Award points for longer, more detailed answers
          if (wordCount > 10) score += 1;
          if (wordCount > 25) score += 1;
          if (wordCount > 50) score += 1;
          
          // Check for positive indicators
          if (qa.answer.toLowerCase().includes('experience') || 
              qa.answer.toLowerCase().includes('worked') ||
              qa.answer.toLowerCase().includes('project')) {
            score += 1;
          }
          
          score = Math.min(10, Math.max(1, score)); // Clamp to 1-10
          
          evaluatedTranscripts.push({
            aiPrompt: qa.question,
            userAnswer: qa.answer,
            aiFeedback: "Answer evaluated based on content quality",
            idealAnswer: "",
            scores: { overall: score },
            perQuestionScore: score,
          });
          totalScore += score;
        }
      }

      const aggregateScore = evaluatedTranscripts.length > 0 
        ? (totalScore / evaluatedTranscripts.length) / 10 
        : 0.5;
      const scorePercentage = Math.round(aggregateScore * 100);
      const passed = scorePercentage >= (assessmentData?.assessment.passingScore || 70);

      // Save session to history for PDF generation
      try {
        await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            module: "ASSESSMENT_INTERVIEW",
            targetCompany: assessmentData?.company.name || "Unknown",
            role: assessmentData?.candidate.jobTitle || "Unknown",
            startTime: interviewStartTime?.toISOString(),
            endTime: endTime.toISOString(),
            duration: durationMinutes,
            transcripts: evaluatedTranscripts,
            aggregateScore,
            status: passed ? "PASS" : "FAIL",
            metadata: {
              assessmentId: assessmentData?.assessment.id,
              sessionToken: token,
              candidateEmail: assessmentData?.candidate.email,
            },
          }),
        });
      } catch (e) {
        console.error("Failed to save session to history:", e);
      }

      // Submit assessment results
      const response = await fetch(`/api/candidate/assessment/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          interviewData: {
            transcripts: evaluatedTranscripts,
            aggregateScore,
            duration: durationMinutes,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit assessment");
      }

      setResult({
        score: scorePercentage,
        passed,
        timeTaken: durationMinutes,
        passingScore: assessmentData?.assessment.passingScore || 70,
      });

    } catch (err: any) {
      console.error("Failed to end AI interview:", err);
      setError(err.message || "Failed to submit interview results");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processorRef.current) {
        processorRef.current.disconnect();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (sessionRef.current) {
        try { sessionRef.current.close(); } catch (e) {}
      }
      if (inputAudioContextRef.current) {
        try { inputAudioContextRef.current.close(); } catch (e) {}
      }
      if (outputAudioContextRef.current) {
        try { outputAudioContextRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-slate-800 border-slate-700">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              {result ? "Assessment Completed" : "Unable to Load Assessment"}
            </h2>
            <p className="text-slate-400 mb-6">{error}</p>
            {result && (
              <div className="mb-6 p-4 rounded-lg bg-slate-700">
                <p className="text-2xl font-bold text-white mb-2">
                  Score: {result.score}%
                </p>
                <Badge className={result.passed ? "bg-green-500" : "bg-red-500"}>
                  {result.passed ? "Passed" : "Not Passed"}
                </Badge>
              </div>
            )}
            <Button onClick={() => router.push("/train/assessments")}>
              Back to My Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Result state
  if (result) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-8 text-center">
              {result.passed ? (
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
              ) : (
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
              )}

              <h2 className="text-2xl font-bold text-white mb-2">
                {result.passed ? "Congratulations!" : "Assessment Complete"}
              </h2>
              <p className="text-slate-400 mb-6">
                {result.passed
                  ? "You have successfully passed the assessment."
                  : "Unfortunately, you did not reach the passing score."}
              </p>

              <div className="bg-slate-700/50 rounded-xl p-6 mb-6">
                <div className="text-4xl font-bold text-white mb-2">
                  {result.score}%
                </div>
                <p className="text-slate-400">Your Score</p>
                <div className="mt-4 pt-4 border-t border-slate-600 flex justify-center gap-8 text-sm">
                  <div>
                    <p className="text-slate-400">Passing Score</p>
                    <p className="text-white font-semibold">{result.passingScore}%</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Time Taken</p>
                    <p className="text-white font-semibold">{result.timeTaken} min</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => router.push("/train/assessments")}
                className="w-full"
              >
                Back to My Assessments
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!assessmentData) return null;

  const { assessment, company, candidate } = assessmentData;
  const TypeIcon = assessmentTypeIcons[assessment.type] || FileText;

  // Pre-start screen
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full"
        >
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="text-center border-b border-slate-700 pb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                {company.logo ? (
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm text-slate-400">{company.name}</p>
                  <p className="text-white font-medium">{candidate.jobTitle}</p>
                </div>
              </div>
              <CardTitle className="text-2xl text-white">{assessment.title}</CardTitle>
              <Badge className="mt-2 bg-indigo-500/20 text-indigo-400">
                <TypeIcon className="w-3 h-3 mr-1" />
                {assessmentTypeLabels[assessment.type]}
              </Badge>
            </CardHeader>

            <CardContent className="pt-6">
              {assessment.description && (
                <p className="text-slate-400 mb-6">{assessment.description}</p>
              )}

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <Timer className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                  <p className="text-xl font-bold text-white">{assessment.duration}</p>
                  <p className="text-sm text-slate-400">Minutes</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <Target className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <p className="text-xl font-bold text-white">{assessment.passingScore}%</p>
                  <p className="text-sm text-slate-400">To Pass</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <FileText className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xl font-bold text-white">{assessment.questionsCount}</p>
                  <p className="text-sm text-slate-400">Questions</p>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-200">
                    <p className="font-medium mb-1">Important Instructions:</p>
                    <ul className="list-disc list-inside space-y-1 text-amber-300/80">
                      <li>Ensure you have a stable internet connection</li>
                      <li>The timer will start immediately after clicking Start</li>
                      <li>You cannot pause or restart the assessment</li>
                      <li>Do not refresh or close the browser during the test</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-600"
                  onClick={() => router.push("/train/assessments")}
                >
                  Go Back
                </Button>
                <Button
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleStart}
                  disabled={isStarting}
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Assessment
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // MCQ Assessment Interface
  if (assessment.type === "MCQ" && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / questions.length) * 100;

    return (
      <div className="min-h-screen bg-slate-950">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-white">{assessment.title}</h1>
              <Badge variant="outline" className="text-slate-400">
                {currentQuestionIndex + 1} / {questions.length}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                timeRemaining < 300 ? "bg-red-500/20 text-red-400" : "bg-slate-700 text-white"
              }`}>
                <Clock className="w-4 h-4" />
                <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
              </div>
              <Button
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="h-1 bg-slate-700">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Content */}
        <div className="max-w-4xl mx-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-400 font-bold">{currentQuestionIndex + 1}</span>
                </div>
                <div>
                  <h2 className="text-xl text-white mb-2">{currentQuestion.text}</h2>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>{currentQuestion.type === "multiple" ? "Multiple answers" : "Single answer"}</span>
                    <span>•</span>
                    <span>{currentQuestion.marks} mark{currentQuestion.marks > 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {currentQuestion.type === "single" ? (
                  <RadioGroup
                    value={String(answers[currentQuestionIndex] ?? "")}
                    onValueChange={(value) => handleAnswer(currentQuestionIndex, parseInt(value))}
                  >
                    {currentQuestion.options.map((option, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                          answers[currentQuestionIndex] === idx
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-slate-700 hover:border-slate-600"
                        }`}
                        onClick={() => handleAnswer(currentQuestionIndex, idx)}
                      >
                        <RadioGroupItem value={String(idx)} id={`option-${idx}`} />
                        <Label htmlFor={`option-${idx}`} className="text-white cursor-pointer flex-1">
                          <span className="text-slate-400 mr-2">{String.fromCharCode(65 + idx)}.</span>
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  currentQuestion.options.map((option, idx) => {
                    const selectedAnswers = (answers[currentQuestionIndex] as number[]) || [];
                    const isSelected = selectedAnswers.includes(idx);

                    return (
                      <div
                        key={idx}
                        className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-slate-700 hover:border-slate-600"
                        }`}
                        onClick={() => {
                          const newAnswers = isSelected
                            ? selectedAnswers.filter((a) => a !== idx)
                            : [...selectedAnswers, idx];
                          handleAnswer(currentQuestionIndex, newAnswers);
                        }}
                      >
                        <Checkbox checked={isSelected} />
                        <Label className="text-white cursor-pointer flex-1">
                          <span className="text-slate-400 mr-2">{String.fromCharCode(65 + idx)}.</span>
                          {option}
                        </Label>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="border-slate-600"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button
                  onClick={() =>
                    setCurrentQuestionIndex((prev) =>
                      Math.min(questions.length - 1, prev + 1)
                    )
                  }
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Question Navigation Grid */}
          <div className="mt-6 bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-3">Question Navigator</p>
            <div className="flex flex-wrap gap-2">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    idx === currentQuestionIndex
                      ? "bg-indigo-500 text-white"
                      : answers[idx] !== undefined
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                      : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Confirmation Dialog */}
        <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
          <AlertDialogContent className="bg-slate-800 border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Submit Assessment?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                You have answered {answeredCount} out of {questions.length} questions.
                {answeredCount < questions.length && (
                  <span className="text-amber-400 block mt-2">
                    Warning: {questions.length - answeredCount} question(s) are unanswered.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-600">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleSubmit(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Submit Now
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ============= AI Interview Interface =============
  if (assessment.type === "AI_INTERVIEW") {
    // Active Interview UI
    if (isAIInterviewActive) {
      return (
        <div className="min-h-screen bg-slate-950">
          {/* Header */}
          <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold text-white">{assessment.title}</h1>
                <Badge className="bg-green-500/20 text-green-400">
                  <Mic2 className="w-3 h-3 mr-1 animate-pulse" />
                  Live Interview
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  timeRemaining < 300 ? "bg-red-500/20 text-red-400" : "bg-slate-700 text-white"
                }`}>
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
                </div>
                <Button
                  onClick={() => endAIInterview(false)}
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <StopCircle className="w-4 h-4 mr-2" />
                      End Interview
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Avatar & Status */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="text-center mb-6">
                  <div className="relative w-48 h-48 mx-auto mb-4">
                    {/* AI Avatar */}
                    <div className={`w-full h-full rounded-full overflow-hidden border-4 transition-all duration-300 ${
                      isAISpeaking 
                        ? "border-blue-500 shadow-lg shadow-blue-500/30" 
                        : isListening 
                          ? "border-emerald-500 shadow-lg shadow-emerald-500/30" 
                          : "border-slate-600"
                    }`}>
                      <img 
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800"
                        alt="AI Interviewer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Speaking/Listening indicator */}
                    <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium ${
                      isAISpeaking 
                        ? "bg-blue-500 text-white" 
                        : isListening 
                          ? "bg-emerald-500 text-white" 
                          : "bg-slate-600 text-slate-300"
                    }`}>
                      {isAISpeaking ? "Speaking..." : isListening ? "Listening..." : "Ready"}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white">AI Interviewer</h3>
                  <p className="text-sm text-slate-400">{company.name}</p>
                </div>

                {/* Current transcription */}
                <div className="space-y-4">
                  {aiTranscript && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <p className="text-xs text-blue-400 mb-1">AI is saying:</p>
                      <p className="text-white">{aiTranscript}</p>
                    </div>
                  )}
                  {userTranscript && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                      <p className="text-xs text-emerald-400 mb-1">You are saying:</p>
                      <p className="text-white">{userTranscript}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transcript History */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  Interview Transcript
                </h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {interviewTranscripts.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">
                      Interview conversation will appear here...
                    </p>
                  ) : (
                    interviewTranscripts.map((qa, idx) => (
                      <div key={idx} className="space-y-2">
                        {qa.question && (
                          <div className="bg-slate-700/50 rounded-lg p-3">
                            <p className="text-xs text-blue-400 mb-1">Interviewer</p>
                            <p className="text-slate-200 text-sm">{qa.question}</p>
                          </div>
                        )}
                        {qa.answer && (
                          <div className="bg-emerald-500/10 rounded-lg p-3 ml-4">
                            <p className="text-xs text-emerald-400 mb-1">You</p>
                            <p className="text-slate-200 text-sm">{qa.answer}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* End Interview Confirmation Dialog */}
          <AlertDialog open={showEndInterviewConfirm} onOpenChange={setShowEndInterviewConfirm}>
            <AlertDialogContent className="bg-slate-800 border-slate-700">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">End Interview?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  Are you sure you want to end the interview? Your responses will be evaluated and submitted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-slate-600">Continue Interview</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => endAIInterview(true)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  End & Submit
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    }

    // Pre-interview setup screen
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Mic className="w-10 h-10 text-indigo-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                AI Interview
              </h2>
              <p className="text-slate-400 mb-6">
                This assessment type requires additional setup. Please ensure you have:
              </p>
              
              <ul className="text-left text-slate-300 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  A working microphone
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  A working camera (if video required)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  A quiet environment
                </li>
              </ul>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-amber-200">
                  <strong>Note:</strong> The AI interviewer will ask you questions and evaluate your responses. 
                  Speak clearly and take your time to answer. You have {assessment.duration} minutes to complete the interview.
                </p>
              </div>

              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                onClick={startAIInterview}
                disabled={isStarting}
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting Interview...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Begin AI Interview
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ============= GROUP DISCUSSION Interface =============
  if (assessment.type === "GD" && hasStarted && assessmentData?.agora) {
    const handleGDComplete = async (result: any) => {
      try {
        setIsSubmitting(true);
        
        const response = await fetch(`/api/candidate/assessment/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "submit",
            gdTranscript: JSON.stringify(result.transcript),
            score: result.participationScore,
            feedback: result.aiFeedback,
            interviewData: {
              aggregateScore: result.participationScore / 100,
              transcripts: result.transcript,
            },
          }),
        });

        if (response.ok) {
          router.push(`/candidate/assessment/${token}/result`);
        } else {
          const data = await response.json();
          setError(data.error || "Failed to submit assessment");
        }
      } catch (err: any) {
        setError(err.message || "Failed to submit assessment");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-950">
        <GDAssessmentPlayer
          assessmentTitle={assessment.title}
          assessmentId={assessment.id}
          topic={assessmentData.gdTopic || "General Discussion"}
          duration={assessment.duration}
          agoraConfig={assessmentData.agora}
          participantName={candidate.name}
          userId={candidate.email}
          onComplete={handleGDComplete}
          onError={(error) => setError(error)}
        />
      </div>
    );
  }

  // ============= VOICE INTERVIEW Interface =============
  if (assessment.type === "VOICE" && hasStarted && assessmentData?.agora) {
    const handleVoiceComplete = async (result: any) => {
      try {
        setIsSubmitting(true);
        
        const response = await fetch(`/api/candidate/assessment/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "submit",
            aiTranscript: JSON.stringify(result.transcript),
            score: result.scores.overall,
            feedback: result.aiFeedback,
            interviewData: {
              aggregateScore: result.scores.overall / 100,
              transcripts: result.transcript,
            },
          }),
        });

        if (response.ok) {
          router.push(`/candidate/assessment/${token}/result`);
        } else {
          const data = await response.json();
          setError(data.error || "Failed to submit assessment");
        }
      } catch (err: any) {
        setError(err.message || "Failed to submit assessment");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-950">
        <VoiceAssessmentPlayer
          assessmentTitle={assessment.title}
          assessmentId={assessment.id}
          jobRole={candidate.jobTitle || "Professional"}
          duration={assessment.duration}
          categories={assessmentData.voiceConfig?.categories || ["Technical", "Behavioral"]}
          agoraConfig={assessmentData.agora}
          candidateName={candidate.name}
          userId={candidate.email}
          audioOnly={assessmentData.voiceConfig?.audioOnly || false}
          onComplete={handleVoiceComplete}
          onError={(error) => setError(error)}
        />
      </div>
    );
  }

  // ============= CORPORATE VOICE Interface =============
  if (assessment.type === "CORPORATE_VOICE" && hasStarted && assessmentData?.corporateVoiceConfig) {
    const handleCorporateVoiceComplete = async (result: any) => {
      try {
        setIsSubmitting(true);
        
        const response = await fetch(`/api/candidate/assessment/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "submit",
            aiTranscript: result.transcript,
            score: result.scores.overall,
            feedback: result.aiFeedback,
            interviewData: {
              aggregateScore: result.scores.overall / 100,
              transcripts: [{ question: "Assessment", answer: result.transcript }],
            },
          }),
        });

        if (response.ok) {
          router.push(`/candidate/assessment/${token}/result`);
        } else {
          const data = await response.json();
          setError(data.error || "Failed to submit assessment");
        }
      } catch (err: any) {
        setError(err.message || "Failed to submit assessment");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-950">
        <CorporateVoicePlayer
          assessmentTitle={assessment.title}
          assessmentId={assessment.id}
          config={assessmentData.corporateVoiceConfig}
          duration={assessment.duration}
          candidateName={candidate.name}
          onComplete={handleCorporateVoiceComplete}
          onError={(error) => setError(error)}
        />
      </div>
    );
  }

  // For other types not yet implemented - Show coming soon placeholder
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-slate-800 border-slate-700">
        <CardContent className="pt-6 text-center">
          <TypeIcon className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            {assessmentTypeLabels[assessment.type]}
          </h2>
          <p className="text-slate-400 mb-6">
            This assessment type is coming soon. Please contact the recruiter for more information.
          </p>
          <Button 
            variant="outline"
            className="border-slate-600"
            onClick={() => router.push("/train/assessments")}
          >
            Back to My Assessments
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
