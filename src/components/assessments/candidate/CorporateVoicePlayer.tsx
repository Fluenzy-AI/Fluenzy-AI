"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  SkipForward,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  RotateCcw,
  FileText,
  MessageSquare,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Types for Corporate Voice sub-types
type CorporateVoiceSubType =
  | "read_aloud"
  | "listen_repeat"
  | "comprehension"
  | "conversation"
  | "extemporaneous"
  | "listen_summarize";

interface CorporateVoiceConfig {
  subType: CorporateVoiceSubType;
  passages?: string[]; // For read aloud
  audioPrompts?: string[]; // For listen & repeat
  comprehensionAudio?: string; // URL for comprehension audio
  comprehensionQuestions?: Array<{
    question: string;
    options: string[];
    correctIndex: number;
  }>;
  conversationTopic?: string;
  extemporaneousTopic?: string;
  prepTime?: number; // seconds for extemporaneous prep
  summarizePassage?: string; // Text that AI will speak for listen & summarize
  duration?: number; // Total duration in seconds
}

interface CorporateVoicePlayerProps {
  assessmentTitle: string;
  assessmentId: string;
  config: CorporateVoiceConfig;
  duration: number; // minutes
  candidateName: string;
  onComplete: (result: CorporateVoiceResult) => void;
  onError?: (error: string) => void;
}

interface CorporateVoiceResult {
  subType: CorporateVoiceSubType;
  transcript: string;
  recordings?: Blob[];
  answers?: number[]; // for comprehension
  scores: {
    pronunciation?: number;
    pace?: number;
    clarity: number;
    fluency: number;
    vocabulary: number;
    relevance?: number;
    confidence: number;
    accuracy?: number;
    recall?: number;
    coherence?: number;
    overall: number;
  };
  totalDuration: number;
  aiFeedback?: string;
}

// Sub-component for audio visualization
const AudioWaveform: React.FC<{ isRecording: boolean; level: number }> = ({
  isRecording,
  level,
}) => {
  const bars = 20;
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {Array.from({ length: bars }).map((_, i) => {
        const height = isRecording
          ? Math.sin(i * 0.5 + Date.now() * 0.01) * level * 30 + 10
          : 4;
        return (
          <motion.div
            key={i}
            className={cn(
              "w-1 rounded-full",
              isRecording ? "bg-red-500" : "bg-slate-600"
            )}
            animate={{ height }}
            transition={{ duration: 0.1 }}
          />
        );
      })}
    </div>
  );
};

// Read Aloud Sub-component
const ReadAloudPlayer: React.FC<{
  passages: string[];
  onComplete: (transcripts: string[], recordings: Blob[]) => void;
}> = ({ passages, onComplete }) => {
  const [currentPassage, setCurrentPassage] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [recordings, setRecordings] = useState<Blob[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordings((prev) => [...prev, blob]);
        stream.getTracks().forEach((track) => track.stop());
      };

      // Setup speech recognition
      if ("webkitSpeechRecognition" in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setTranscripts((prev) => {
            const newTranscripts = [...prev];
            newTranscripts[currentPassage] = transcript;
            return newTranscripts;
          });
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      // Audio level monitoring
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 128);
        if (isRecording) requestAnimationFrame(updateLevel);
      };
      updateLevel();

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  }, [currentPassage, isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setAudioLevel(0);
  }, []);

  const handleNext = () => {
    if (currentPassage < passages.length - 1) {
      setCurrentPassage((prev) => prev + 1);
    } else {
      onComplete(transcripts, recordings);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm text-slate-400">
          Passage {currentPassage + 1} of {passages.length}
        </span>
        <Progress
          value={((currentPassage + 1) / passages.length) * 100}
          className="flex-1"
        />
      </div>

      {/* Passage to read */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-blue-400" />
            Read the following passage aloud
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl leading-relaxed text-white">
            {passages[currentPassage]}
          </p>
        </CardContent>
      </Card>

      {/* Recording UI */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <AudioWaveform isRecording={isRecording} level={audioLevel} />

          {/* Live transcript */}
          {transcripts[currentPassage] && (
            <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
              <p className="text-xs text-emerald-400 mb-1">Your speech:</p>
              <p className="text-slate-200">{transcripts[currentPassage]}</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-4 mt-6">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                className="bg-red-500 hover:bg-red-600 px-8"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500/10 px-8"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop Recording
              </Button>
            )}

            {!isRecording && recordings.length > currentPassage && (
              <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700">
                {currentPassage < passages.length - 1 ? (
                  <>
                    Next Passage
                    <SkipForward className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Submit
                    <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Listen & Repeat Sub-component
const ListenRepeatPlayer: React.FC<{
  audioPrompts: string[];
  onComplete: (transcripts: string[], recordings: Blob[]) => void;
}> = ({ audioPrompts, onComplete }) => {
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [phase, setPhase] = useState<"listen" | "repeat" | "done">("listen");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [recordings, setRecordings] = useState<Blob[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);

  const playPrompt = useCallback(() => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(audioPrompts[currentPrompt]);
      utterance.rate = 0.9;
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        setPhase("repeat");
      };
      synthRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  }, [audioPrompts, currentPrompt]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordings((prev) => [...prev, blob]);
        stream.getTracks().forEach((track) => track.stop());
      };

      if ("webkitSpeechRecognition" in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setTranscripts((prev) => {
            const newTranscripts = [...prev];
            newTranscripts[currentPrompt] = transcript;
            return newTranscripts;
          });
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);
    setPhase("done");
  };

  const handleNext = () => {
    if (currentPrompt < audioPrompts.length - 1) {
      setCurrentPrompt((prev) => prev + 1);
      setPhase("listen");
    } else {
      onComplete(transcripts, recordings);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm text-slate-400">
          Prompt {currentPrompt + 1} of {audioPrompts.length}
        </span>
        <Progress
          value={((currentPrompt + 1) / audioPrompts.length) * 100}
          className="flex-1"
        />
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            {phase === "listen" && (
              <>
                <div className="w-24 h-24 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center">
                  {isPlaying ? (
                    <Volume2 className="w-12 h-12 text-blue-400 animate-pulse" />
                  ) : (
                    <Headphones className="w-12 h-12 text-blue-400" />
                  )}
                </div>
                <p className="text-lg text-white">
                  {isPlaying ? "Listen carefully..." : "Click to listen to the phrase"}
                </p>
                {!isPlaying && (
                  <Button onClick={playPrompt} className="bg-blue-500 hover:bg-blue-600">
                    <Play className="w-5 h-5 mr-2" />
                    Play Audio
                  </Button>
                )}
              </>
            )}

            {phase === "repeat" && (
              <>
                <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                  {isRecording ? (
                    <Mic className="w-12 h-12 text-red-400 animate-pulse" />
                  ) : (
                    <Mic className="w-12 h-12 text-emerald-400" />
                  )}
                </div>
                <p className="text-lg text-white">
                  {isRecording ? "Recording... Repeat the phrase" : "Now repeat what you heard"}
                </p>
                <AudioWaveform isRecording={isRecording} level={audioLevel} />
                {transcripts[currentPrompt] && (
                  <p className="text-slate-300 bg-slate-700/50 p-3 rounded-lg">
                    {transcripts[currentPrompt]}
                  </p>
                )}
                {!isRecording ? (
                  <Button onClick={startRecording} className="bg-red-500 hover:bg-red-600">
                    <Mic className="w-5 h-5 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button onClick={stopRecording} variant="outline" className="border-red-500">
                    <Square className="w-5 h-5 mr-2" />
                    Stop
                  </Button>
                )}
              </>
            )}

            {phase === "done" && (
              <>
                <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-emerald-400" />
                </div>
                <p className="text-lg text-white">Recording saved!</p>
                <div className="flex gap-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setPhase("listen")}
                    className="border-slate-600"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                  <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700">
                    {currentPrompt < audioPrompts.length - 1 ? "Next" : "Submit"}
                    <SkipForward className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Conversation Sub-component
const ConversationPlayer: React.FC<{
  topic: string;
  onComplete: (transcript: Array<{ role: string; content: string }>) => void;
}> = ({ topic, onComplete }) => {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [turnCount, setTurnCount] = useState(0);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const maxTurns = 5;

  // Start with AI introduction
  useEffect(() => {
    const intro = `Hello! I'm here to discuss ${topic} with you. Let's have a professional conversation. Please tell me your thoughts on this topic.`;
    setMessages([{ role: "ai", content: intro }]);
    speakAI(intro);
  }, [topic]);

  const speakAI = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onstart = () => setIsAISpeaking(true);
      utterance.onend = () => setIsAISpeaking(false);
      synthRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  };

  const startRecording = async () => {
    try {
      if ("webkitSpeechRecognition" in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setCurrentTranscript(transcript);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
      }
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = async () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);

    if (currentTranscript) {
      const newMessages = [...messages, { role: "user", content: currentTranscript }];
      setMessages(newMessages);
      setCurrentTranscript("");
      setTurnCount((prev) => prev + 1);

      // Get AI response
      if (turnCount < maxTurns - 1) {
        try {
          const response = await fetch("/api/ai/conversation-response", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topic,
              messages: newMessages,
              context: "corporate_assessment",
            }),
          });
          const data = await response.json();
          const aiResponse = data.response || "That's an interesting point. Could you elaborate more?";
          setMessages((prev) => [...prev, { role: "ai", content: aiResponse }]);
          speakAI(aiResponse);
        } catch {
          const fallback = "That's interesting. Please continue with your thoughts.";
          setMessages((prev) => [...prev, { role: "ai", content: fallback }]);
          speakAI(fallback);
        }
      } else {
        const closing = "Thank you for this conversation. You've made some excellent points.";
        setMessages((prev) => [...prev, { role: "ai", content: closing }]);
        speakAI(closing);
        setTimeout(() => onComplete(newMessages), 3000);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            Corporate Conversation
          </CardTitle>
          <p className="text-slate-400">Topic: {topic}</p>
        </CardHeader>
        <CardContent>
          {/* Conversation thread */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto mb-6">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-3 rounded-lg",
                  msg.role === "ai"
                    ? "bg-blue-500/10 border border-blue-500/30"
                    : "bg-emerald-500/10 border border-emerald-500/30 ml-8"
                )}
              >
                <p className="text-xs mb-1 text-slate-400">
                  {msg.role === "ai" ? "AI Interviewer" : "You"}
                </p>
                <p className="text-white">{msg.content}</p>
              </motion.div>
            ))}
            {currentTranscript && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 ml-8 opacity-70">
                <p className="text-xs mb-1 text-slate-400">You (speaking...)</p>
                <p className="text-white">{currentTranscript}</p>
              </div>
            )}
          </div>

          {/* Recording controls */}
          <div className="text-center">
            {isAISpeaking ? (
              <div className="flex items-center justify-center gap-2 text-blue-400">
                <Volume2 className="w-5 h-5 animate-pulse" />
                <span>AI is speaking...</span>
              </div>
            ) : turnCount >= maxTurns ? (
              <p className="text-emerald-400">Conversation complete!</p>
            ) : (
              <>
                <AudioWaveform isRecording={isRecording} level={audioLevel} />
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    className="bg-emerald-600 hover:bg-emerald-700 mt-4"
                    disabled={isAISpeaking}
                  >
                    <Mic className="w-5 h-5 mr-2" />
                    Your Turn - Start Speaking
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    variant="outline"
                    className="border-red-500 text-red-500 mt-4"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    Done Speaking
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Extemporaneous Sub-component
const ExtemporaneousPlayer: React.FC<{
  topic: string;
  prepTime: number;
  duration: number;
  onComplete: (transcript: string, recording: Blob) => void;
}> = ({ topic, prepTime, duration, onComplete }) => {
  const [phase, setPhase] = useState<"prep" | "speaking" | "done">(prepTime > 0 ? "prep" : "speaking");
  const [timeLeft, setTimeLeft] = useState(prepTime > 0 ? prepTime : duration);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState<Blob | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      if (phase === "prep") {
        setPhase("speaking");
        setTimeLeft(duration);
      } else if (phase === "speaking") {
        stopRecording();
      }
      return;
    }

    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, phase, duration]);

  // Auto-start recording when speaking phase begins
  useEffect(() => {
    if (phase === "speaking" && !isRecording) {
      startRecording();
    }
  }, [phase]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecording(blob);
        stream.getTracks().forEach((track) => track.stop());
        setPhase("done");
      };

      if ("webkitSpeechRecognition" in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let text = "";
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          setTranscript(text);
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);
  };

  const handleSubmit = () => {
    if (recording) {
      onComplete(transcript, recording);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Extemporaneous Speaking</CardTitle>
            <Badge
              className={cn(
                "text-lg px-4 py-2",
                phase === "prep" ? "bg-amber-500" : "bg-red-500"
              )}
            >
              <Clock className="w-4 h-4 mr-2" />
              {formatTime(timeLeft)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Topic display */}
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-6 mb-6">
            <p className="text-sm text-slate-400 mb-2">Your Topic:</p>
            <p className="text-2xl font-bold text-white">{topic}</p>
          </div>

          {phase === "prep" && (
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                <Clock className="w-12 h-12 text-amber-400 animate-pulse" />
              </div>
              <h3 className="text-xl text-white mb-2">Preparation Time</h3>
              <p className="text-slate-400">
                Think about your response. Recording will start automatically.
              </p>
            </div>
          )}

          {phase === "speaking" && (
            <>
              <AudioWaveform isRecording={isRecording} level={audioLevel} />
              <div className="text-center mt-4">
                <Badge className="bg-red-500 animate-pulse">
                  <Mic className="w-4 h-4 mr-1" />
                  Recording
                </Badge>
              </div>
              {transcript && (
                <div className="mt-4 p-4 bg-slate-700/50 rounded-lg max-h-48 overflow-y-auto">
                  <p className="text-slate-200">{transcript}</p>
                </div>
              )}
              <div className="text-center mt-6">
                <Button
                  onClick={stopRecording}
                  variant="outline"
                  className="border-red-500 text-red-500"
                >
                  <Square className="w-5 h-5 mr-2" />
                  End Early
                </Button>
              </div>
            </>
          )}

          {phase === "done" && (
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </div>
              <h3 className="text-xl text-white mb-4">Recording Complete!</h3>
              <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">
                <Send className="w-5 h-5 mr-2" />
                Submit Response
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Main CorporateVoicePlayer Component
export default function CorporateVoicePlayer({
  assessmentTitle,
  assessmentId,
  config,
  duration,
  candidateName,
  onComplete,
  onError,
}: CorporateVoicePlayerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const startTimeRef = useRef(Date.now());

  // Timer
  useEffect(() => {
    if (timeRemaining <= 0) return;
    const timer = setInterval(() => setTimeRemaining((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const evaluateAndComplete = async (data: any) => {
    setIsEvaluating(true);
    try {
      const response = await fetch("/api/ai/evaluate-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: config.subType,
          transcript: data.transcript || data.transcripts?.join(" ") || "",
          originalText: config.passages?.[0] || config.audioPrompts?.[0],
          topic: config.extemporaneousTopic || config.conversationTopic,
          durationSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }),
      });

      const result = await response.json();
      
      onComplete({
        subType: config.subType,
        transcript: data.transcript || data.transcripts?.join(" ") || "",
        recordings: data.recordings,
        scores: result.scores || {
          clarity: 70,
          fluency: 70,
          vocabulary: 70,
          confidence: 70,
          overall: 70,
        },
        totalDuration: Math.floor((Date.now() - startTimeRef.current) / 1000),
        aiFeedback: result.feedback,
      });
    } catch (err) {
      console.error("Evaluation error:", err);
      // Submit with default scores on error
      onComplete({
        subType: config.subType,
        transcript: data.transcript || "",
        scores: {
          clarity: 65,
          fluency: 65,
          vocabulary: 65,
          confidence: 65,
          overall: 65,
        },
        totalDuration: Math.floor((Date.now() - startTimeRef.current) / 1000),
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  // Loading/Evaluating state
  if (isEvaluating) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-purple-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Evaluating Your Response</h2>
          <p className="text-slate-400">Please wait while AI analyzes your performance...</p>
        </div>
      </div>
    );
  }

  const subTypeLabels: Record<CorporateVoiceSubType, string> = {
    read_aloud: "Read Aloud",
    listen_repeat: "Listen & Repeat",
    comprehension: "Comprehension",
    conversation: "Conversation",
    extemporaneous: "Extemporaneous Speaking",
    listen_summarize: "Listen & Summarize",
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">{assessmentTitle}</h1>
            <Badge className="bg-purple-500/20 text-purple-400 mt-1">
              {subTypeLabels[config.subType]}
            </Badge>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full",
              timeRemaining < 60 ? "bg-red-500/20 text-red-400" : "bg-slate-700 text-white"
            )}
          >
            <Clock className="w-4 h-4" />
            <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
          </div>
        </div>
      </div>

      {/* Main content based on sub-type */}
      <div className="max-w-4xl mx-auto p-6">
        {config.subType === "read_aloud" && config.passages && (
          <ReadAloudPlayer
            passages={config.passages}
            onComplete={(transcripts, recordings) =>
              evaluateAndComplete({ transcripts, recordings })
            }
          />
        )}

        {config.subType === "listen_repeat" && config.audioPrompts && (
          <ListenRepeatPlayer
            audioPrompts={config.audioPrompts}
            onComplete={(transcripts, recordings) =>
              evaluateAndComplete({ transcripts, recordings })
            }
          />
        )}

        {config.subType === "conversation" && config.conversationTopic && (
          <ConversationPlayer
            topic={config.conversationTopic}
            onComplete={(transcript) =>
              evaluateAndComplete({ transcript: transcript.map((m) => `${m.role}: ${m.content}`).join("\n") })
            }
          />
        )}

        {config.subType === "extemporaneous" && config.extemporaneousTopic && (
          <ExtemporaneousPlayer
            topic={config.extemporaneousTopic}
            prepTime={config.prepTime || 30}
            duration={config.duration || 120}
            onComplete={(transcript, recording) =>
              evaluateAndComplete({ transcript, recordings: [recording] })
            }
          />
        )}

        {/* Placeholder for other sub-types */}
        {(config.subType === "comprehension" || config.subType === "listen_summarize") && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">
                {subTypeLabels[config.subType]}
              </h2>
              <p className="text-slate-400">
                This assessment type is being configured. Please contact the administrator.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
