"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Clock,
  Volume2,
  Loader2,
  Phone,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Types
interface InterviewMessage {
  id: string;
  role: "interviewer" | "candidate";
  text: string;
  timestamp: Date;
  score?: number;
  feedback?: string;
}

interface VoiceAgoraConfig {
  appId: string;
  channel: string;
  token: string;
  uid: number;
}

interface VoiceAssessmentPlayerProps {
  assessmentTitle: string;
  assessmentId: string;
  jobRole: string;
  duration: number; // minutes
  categories: string[]; // Technical, Behavioral, Situational, Culture Fit
  agoraConfig: VoiceAgoraConfig;
  candidateName: string;
  userId: string;
  audioOnly?: boolean;
  onComplete: (result: VoiceResultData) => void;
  onError?: (error: string) => void;
}

interface VoiceResultData {
  transcript: InterviewMessage[];
  totalDuration: number;
  scores: {
    fluency: number;
    vocabulary: number;
    clarity: number;
    relevance: number;
    confidence: number;
    technical?: number;
    overall: number;
  };
  aiFeedback: string;
  highlights: string[];
  improvements: string[];
}

// Interview phases
type InterviewPhase = "connecting" | "intro" | "technical" | "behavioral" | "closing" | "completed";

const PHASE_QUESTIONS: Record<string, string[]> = {
  intro: [
    "Please introduce yourself and tell me about your background.",
    "What interests you about this role?",
  ],
  technical: [
    "Can you describe a challenging technical problem you solved recently?",
    "What technologies or tools are you most proficient with?",
    "How do you approach debugging complex issues?",
  ],
  behavioral: [
    "Tell me about a time you worked effectively under pressure.",
    "Describe a situation where you had to collaborate with difficult team members.",
    "How do you handle receiving critical feedback?",
  ],
  closing: [
    "What questions do you have about the role or company?",
    "Where do you see yourself in 5 years?",
  ],
};

export default function VoiceAssessmentPlayer({
  assessmentTitle,
  assessmentId,
  jobRole,
  duration,
  categories,
  agoraConfig,
  candidateName,
  userId,
  audioOnly = false,
  onComplete,
  onError,
}: VoiceAssessmentPlayerProps) {
  // Agora state
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [joined, setJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  // UI state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(audioOnly);
  const [showTranscript, setShowTranscript] = useState(true);

  // Interview state
  const [phase, setPhase] = useState<InterviewPhase>("connecting");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [currentResponse, setCurrentResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveScores, setLiveScores] = useState<{
    fluency: number;
    vocabulary: number;
    clarity: number;
    relevance: number;
    confidence: number;
  } | null>(null);

  // Speech recognition
  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Get current phase questions
  const getCurrentPhaseQuestions = useCallback(() => {
    const phaseKey = phase === "technical" || phase === "behavioral" ? phase : "intro";
    return PHASE_QUESTIONS[phaseKey] || [];
  }, [phase]);

  // Initialize Agora and Speech Recognition
  useEffect(() => {
    const initAgora = async () => {
      try {
        const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        setClient(agoraClient);

        // Join channel
        await agoraClient.join(
          agoraConfig.appId,
          agoraConfig.channel,
          agoraConfig.token,
          agoraConfig.uid
        );

        // Create tracks
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        setLocalAudioTrack(audioTrack);

        if (!audioOnly) {
          const videoTrack = await AgoraRTC.createCameraVideoTrack();
          setLocalVideoTrack(videoTrack);
          await agoraClient.publish([audioTrack, videoTrack]);
        } else {
          await agoraClient.publish([audioTrack]);
        }

        setJoined(true);
        setIsConnecting(false);
        setPhase("intro");

        // Add interviewer greeting
        setTimeout(() => {
          addInterviewerMessage(
            `Hello ${candidateName}! Welcome to your ${assessmentTitle}. I'll be conducting this interview for the ${jobRole} position. Let's begin with some introductory questions.`
          );
          
          setTimeout(() => {
            askNextQuestion();
          }, 3000);
        }, 2000);

      } catch (error) {
        console.error("Failed to initialize Agora:", error);
        setIsConnecting(false);
        onError?.(`Failed to start interview: ${error}`);
      }
    };

    // Initialize speech recognition
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setCurrentResponse(finalTranscript || interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
      };

      recognitionRef.current = recognition;
    }

    initAgora();

    return () => {
      recognitionRef.current?.stop();
      localAudioTrack?.stop();
      localAudioTrack?.close();
      localVideoTrack?.stop();
      localVideoTrack?.close();
      client?.leave();
    };
  }, []);

  // Timer
  useEffect(() => {
    if (!joined || phase === "connecting" || phase === "completed") return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleEndInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [joined, phase]);

  // Play video track
  useEffect(() => {
    if (localVideoTrack && videoRef.current) {
      localVideoTrack.play(videoRef.current);
      return () => {
        localVideoTrack.stop();
      };
    }
  }, [localVideoTrack]);

  // Auto-scroll messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addInterviewerMessage = (text: string) => {
    const message: InterviewMessage = {
      id: `int-${Date.now()}`,
      role: "interviewer",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);

    // Text-to-speech
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const askNextQuestion = () => {
    const questions = getCurrentPhaseQuestions();
    if (currentQuestionIndex < questions.length) {
      addInterviewerMessage(questions[currentQuestionIndex]);
    } else {
      // Move to next phase
      if (phase === "intro" && categories.includes("Technical")) {
        setPhase("technical");
        setCurrentQuestionIndex(0);
        setTimeout(() => {
          addInterviewerMessage("Great! Now let's discuss some technical aspects.");
          setTimeout(() => askNextQuestion(), 2000);
        }, 1000);
      } else if ((phase === "intro" || phase === "technical") && categories.includes("Behavioral")) {
        setPhase("behavioral");
        setCurrentQuestionIndex(0);
        setTimeout(() => {
          addInterviewerMessage("Now I'd like to understand your behavioral traits.");
          setTimeout(() => askNextQuestion(), 2000);
        }, 1000);
      } else {
        setPhase("closing");
        setCurrentQuestionIndex(0);
        addInterviewerMessage("We're almost done. Just a few closing questions.");
        setTimeout(() => {
          const closingQuestions = PHASE_QUESTIONS.closing;
          if (closingQuestions.length > 0) {
            addInterviewerMessage(closingQuestions[0]);
          }
        }, 2000);
      }
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setCurrentResponse("");
    recognitionRef.current?.start();
  };

  const stopRecording = async () => {
    setIsRecording(false);
    recognitionRef.current?.stop();

    if (!currentResponse.trim()) return;

    setIsProcessing(true);

    // Add candidate message
    const candidateMessage: InterviewMessage = {
      id: `cand-${Date.now()}`,
      role: "candidate",
      text: currentResponse,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, candidateMessage]);

    // Evaluate response with AI
    try {
      const response = await fetch("/api/ai/evaluate-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "interview_response",
          transcript: currentResponse,
          question: messages[messages.length - 1]?.text || "",
          jobRole,
          phase,
        }),
      });

      if (response.ok) {
        const evaluation = await response.json();
        
        // Update live scores
        setLiveScores({
          fluency: evaluation.scores?.fluency || 0,
          vocabulary: evaluation.scores?.vocabulary || 0,
          clarity: evaluation.scores?.clarity || 0,
          relevance: evaluation.scores?.relevance || 0,
          confidence: evaluation.scores?.confidence || 0,
        });

        // Add score to message
        candidateMessage.score = evaluation.overallScore;
        candidateMessage.feedback = evaluation.feedback;
        setMessages((prev) =>
          prev.map((m) => (m.id === candidateMessage.id ? candidateMessage : m))
        );
      }
    } catch (error) {
      console.error("Failed to evaluate response:", error);
    }

    setIsProcessing(false);
    setCurrentResponse("");

    // Ask next question
    setCurrentQuestionIndex((prev) => prev + 1);
    setTimeout(() => {
      askNextQuestion();
    }, 2000);
  };

  const toggleMute = () => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localVideoTrack) {
      localVideoTrack.setEnabled(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleEndInterview = async () => {
    setPhase("completed");

    // Calculate final scores
    const candidateMessages = messages.filter((m) => m.role === "candidate" && m.score);
    const avgScore =
      candidateMessages.length > 0
        ? Math.round(
            candidateMessages.reduce((acc, m) => acc + (m.score || 0), 0) / candidateMessages.length
          )
        : 0;

    // Get final AI evaluation
    let finalResult: VoiceResultData = {
      transcript: messages,
      totalDuration: duration * 60 - timeRemaining,
      scores: {
        fluency: liveScores?.fluency || 0,
        vocabulary: liveScores?.vocabulary || 0,
        clarity: liveScores?.clarity || 0,
        relevance: liveScores?.relevance || 0,
        confidence: liveScores?.confidence || 0,
        overall: avgScore,
      },
      aiFeedback: "",
      highlights: [],
      improvements: [],
    };

    try {
      const response = await fetch("/api/ai/evaluate-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "final_evaluation",
          transcript: messages.map((m) => ({
            role: m.role,
            text: m.text,
            score: m.score,
          })),
          jobRole,
          candidateName,
        }),
      });

      if (response.ok) {
        const evaluation = await response.json();
        finalResult.scores = { ...finalResult.scores, ...evaluation.scores };
        finalResult.aiFeedback = evaluation.feedback || "";
        finalResult.highlights = evaluation.highlights || [];
        finalResult.improvements = evaluation.improvements || [];
      }
    } catch (error) {
      console.error("Failed to get final evaluation:", error);
    }

    // Cleanup
    localAudioTrack?.stop();
    localAudioTrack?.close();
    localVideoTrack?.stop();
    localVideoTrack?.close();
    await client?.leave();

    onComplete(finalResult);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] bg-gradient-to-b from-gray-900 to-black rounded-xl p-8">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Starting Interview</h3>
        <p className="text-gray-400">Setting up your audio and video...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[700px] bg-gradient-to-b from-gray-900 to-black rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900/80 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{assessmentTitle}</h2>
            <p className="text-sm text-gray-400">Position: {jobRole}</p>
          </div>
          <Badge
            variant={
              phase === "technical" ? "default" : phase === "behavioral" ? "secondary" : "outline"
            }
            className="uppercase"
          >
            {phase}
          </Badge>
        </div>

        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg",
            timeRemaining <= 120 ? "bg-red-500/20 text-red-400" : "bg-gray-800 text-gray-300"
          )}
        >
          <Clock className="w-5 h-5" />
          <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video section */}
        <div className="w-2/3 p-4 flex flex-col gap-4">
          {/* AI Interviewer */}
          <div className="relative aspect-video bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl overflow-hidden flex-1">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">AI Interviewer</h3>
                <p className="text-gray-400 text-sm">Conducting your interview</p>
              </div>
            </div>
            
            {/* Speaking indicator */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full">
              <Volume2 className="w-4 h-4 text-green-500 animate-pulse" />
              <span className="text-sm text-white">Speaking...</span>
            </div>
          </div>

          {/* Candidate video */}
          <div className="relative aspect-video max-h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden">
            {!audioOnly && <div ref={videoRef} className="absolute inset-0" />}
            
            {(audioOnly || isVideoOff) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {candidateName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
              You {isRecording && <span className="text-red-500 ml-1">● Recording</span>}
            </div>
          </div>

          {/* Recording controls */}
          <div className="flex items-center justify-center gap-4 p-4 bg-gray-800/50 rounded-xl">
            {isRecording ? (
              <Button
                size="lg"
                variant="destructive"
                onClick={stopRecording}
                disabled={isProcessing}
                className="px-8"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                )}
                {isProcessing ? "Processing..." : "Submit Response"}
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={startRecording}
                disabled={phase === "completed"}
                className="px-8 bg-green-600 hover:bg-green-700"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Speaking
              </Button>
            )}

            {currentResponse && (
              <div className="flex-1 max-w-md">
                <p className="text-sm text-gray-400 mb-1">Current response:</p>
                <p className="text-white text-sm truncate">{currentResponse}</p>
              </div>
            )}
          </div>
        </div>

        {/* Transcript panel */}
        <AnimatePresence>
          {showTranscript && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "33.333%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-gray-800 flex flex-col bg-gray-900/50"
            >
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Interview Transcript
                </h3>
                
                {/* Live scores */}
                {liveScores && (
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      {Math.round((liveScores.fluency + liveScores.clarity + liveScores.confidence) / 3)}%
                    </Badge>
                  </div>
                )}
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "p-3 rounded-lg",
                        msg.role === "interviewer"
                          ? "bg-blue-500/20 border border-blue-500/30"
                          : "bg-purple-500/20 border border-purple-500/30 ml-4"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            msg.role === "interviewer" ? "text-blue-400" : "text-purple-400"
                          )}
                        >
                          {msg.role === "interviewer" ? "Interviewer" : "You"}
                        </span>
                        {msg.score !== undefined && (
                          <Badge
                            variant={msg.score >= 70 ? "default" : msg.score >= 50 ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {msg.score}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-200">{msg.text}</p>
                      {msg.feedback && (
                        <p className="text-xs text-gray-400 mt-2 italic">{msg.feedback}</p>
                      )}
                    </div>
                  ))}
                  <div ref={messageEndRef} />
                </div>
              </ScrollArea>

              {/* Score breakdown */}
              {liveScores && (
                <div className="p-4 border-t border-gray-800 space-y-2">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Live Scores</h4>
                  {Object.entries(liveScores).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-20 capitalize">{key}</span>
                      <Progress value={value} className="flex-1 h-2" />
                      <span className="text-xs text-gray-300 w-8">{value}%</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 px-6 py-4 bg-gray-900/80 border-t border-gray-800">
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={toggleMute}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </Button>

        {!audioOnly && (
          <Button
            variant={isVideoOff ? "destructive" : "secondary"}
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={toggleVideo}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </Button>
        )}

        <Button
          variant={showTranscript ? "default" : "secondary"}
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={() => setShowTranscript(!showTranscript)}
        >
          <MessageSquare className="w-6 h-6" />
        </Button>

        <div className="w-px h-10 bg-gray-700 mx-2" />

        <Button variant="destructive" size="lg" onClick={handleEndInterview}>
          <Phone className="w-5 h-5 mr-2 rotate-[135deg]" />
          End Interview
        </Button>
      </div>
    </div>
  );
}
