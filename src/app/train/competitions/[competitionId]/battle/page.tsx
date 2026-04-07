'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { CompetitionTimer } from '@/components/competitions';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Send,
  Clock,
  Loader2,
  Trophy,
  Target,
  BookOpen,
  MessageSquare,
  Headphones,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Dynamic import for GD Battle Room to avoid SSR issues with Agora
const CompetitionGDBattleRoom = dynamic(
  () => import('@/components/competitions/CompetitionGDBattleRoom'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    )
  }
);

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Module {
  id: string;
  moduleType: string;
  weight: number;
  order: number;
  config?: any;
}

interface Competition {
  id: string;
  name: string;
  type: string;
  durationPerModule: number;
  maxAttempts: number;
  modules: Module[];
  topic?: string;
  minGDParticipants?: number;
  maxGDParticipants?: number;
}

interface Participant {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  status: string;
  startedAt?: string;
  completedModules: string[];
}

interface ModuleScore {
  moduleId: string;
  score: number;
  evaluation: {
    pronunciationScore?: number;
    grammarScore?: number;
    confidenceScore?: number;
    clarityScore?: number;
    fluencyScore?: number;
    paceScore?: number;
    communicationScore?: number;
    feedback?: {
      strengths: string[];
      improvements: string[];
      detailedFeedback: string;
    };
  };
}

// ─── Module Type Icons ─────────────────────────────────────────────────────────

const moduleIcons: Record<string, React.ElementType> = {
  READ_ALOUD: BookOpen,
  LISTEN_AND_REPEAT: Headphones,
  COMPREHENSION: FileText,
  CONVERSATION: MessageSquare,
  EXTEMPORANEOUS: Mic,
  LISTEN_AND_SUMMARIZE: FileText,
};

const moduleLabels: Record<string, string> = {
  READ_ALOUD: 'Read Aloud',
  LISTEN_AND_REPEAT: 'Listen & Repeat',
  COMPREHENSION: 'Comprehension',
  CONVERSATION: 'Conversation',
  EXTEMPORANEOUS: 'Extemporaneous',
  LISTEN_AND_SUMMARIZE: 'Listen & Summarize',
};

// ─── Battle Room Page ──────────────────────────────────────────────────────────

export default function BattleRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const competitionId = params.competitionId as string;

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [moduleScores, setModuleScores] = useState<Record<string, ModuleScore>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [textResponse, setTextResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [moduleTimeLeft, setModuleTimeLeft] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [battleStarted, setBattleStarted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<ModuleScore['evaluation'] | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Fetch Competition Data ────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch competition details
        const compRes = await fetch(`/api/competitions/${competitionId}`);
        const compData = await compRes.json();
        
        if (!compData.success) {
          throw new Error(compData.error || 'Failed to load competition');
        }
        
        setCompetition(compData.data);

        // Fetch participant info
        const partRes = await fetch(`/api/competitions/${competitionId}/participants?me=true`);
        const partData = await partRes.json();
        
        if (partData.success && partData.data) {
          setParticipant(partData.data);
          // Set current module based on completed modules
          const completedCount = partData.data.completedModules?.length || 0;
          setCurrentModuleIndex(Math.min(completedCount, compData.data.modules.length - 1));
          
          if (partData.data.status === 'IN_PROGRESS') {
            setBattleStarted(true);
          }
        }
        
        // For GD_BATTLE, fetch all participants and auto-start
        if (compData.data.type === 'GD_BATTLE') {
          const allPartRes = await fetch(`/api/competitions/${competitionId}/participants`);
          const allPartData = await allPartRes.json();
          
          if (allPartData.success) {
            setParticipants(allPartData.data.participants || []);
          }
          
          // Auto-start the battle if not already started
          if (partData.data && partData.data.status === 'REGISTERED') {
            const startRes = await fetch(`/api/competitions/${competitionId}/start`, {
              method: 'POST',
            });
            
            const startData = await startRes.json();
            
            if (startData.success) {
              setBattleStarted(true);
              // Refresh participant data
              setParticipant({ ...partData.data, status: 'IN_PROGRESS' });
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [competitionId]);

  // ─── Module Timer ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (battleStarted && competition && !showResults) {
      setModuleTimeLeft(competition.durationPerModule);
      
      timerIntervalRef.current = setInterval(() => {
        setModuleTimeLeft(prev => {
          if (prev <= 1) {
            // Auto-submit when time runs out
            handleModuleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    }
  }, [battleStarted, currentModuleIndex, competition, showResults]);

  // ─── Start Battle ──────────────────────────────────────────────────────────────

  const handleStartBattle = async () => {
    try {
      const res = await fetch(`/api/competitions/${competitionId}/start`, {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to start battle');
      }
      
      setBattleStarted(true);
      setModuleTimeLeft(competition?.durationPerModule || 120);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start battle');
    }
  };

  // ─── Recording Functions ───────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please grant permission.');
    }
  };

  const stopRecording = (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          resolve(audioBlob);
        };
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      }
    });
  };

  // ─── Submit Module Response ────────────────────────────────────────────────────

  const handleModuleSubmit = async () => {
    if (submitting || !competition || !participant) return;
    
    setSubmitting(true);
    
    try {
      let audioUrl = '';
      
      // Stop recording if active
      if (isRecording) {
        const audioBlob = await stopRecording();
        
        // Upload audio (you would implement this with your upload service)
        // For now, we'll just convert to base64
        // In production, upload to R2/S3 and get URL
        const reader = new FileReader();
        audioUrl = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(audioBlob);
        });
      }
      
      const currentModule = competition.modules[currentModuleIndex];
      
      // Submit the score
      const res = await fetch(`/api/competitions/${competitionId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: currentModule.id,
          audioUrl,
          textResponse,
        }),
      });
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit response');
      }
      
      // Store the score
      setModuleScores(prev => ({
        ...prev,
        [currentModule.id]: {
          moduleId: currentModule.id,
          score: data.data.moduleScore?.score || 0,
          evaluation: data.data.evaluation || {},
        },
      }));
      
      // Show feedback
      setCurrentFeedback(data.data.evaluation || {});
      setShowFeedback(true);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Next Module ───────────────────────────────────────────────────────────────

  const handleNextModule = () => {
    setShowFeedback(false);
    setCurrentFeedback(null);
    setTextResponse('');
    
    if (competition && currentModuleIndex < competition.modules.length - 1) {
      setCurrentModuleIndex(prev => prev + 1);
      setModuleTimeLeft(competition.durationPerModule);
    } else {
      // All modules completed
      setShowResults(true);
    }
  };

  // ─── Finish Competition ────────────────────────────────────────────────────────

  const handleFinishCompetition = async () => {
    try {
      const res = await fetch(`/api/competitions/${competitionId}/complete`, {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (data.success) {
        router.push(`/train/competitions/${competitionId}?tab=results`);
      }
    } catch (err) {
      console.error('Error completing competition:', err);
    }
  };

  // ─── Loading State ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-slate-300">Loading battle room...</p>
        </div>
      </div>
    );
  }

  // ─── Error State ───────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">Error</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!competition) return null;

  const currentModule = competition.modules[currentModuleIndex];
  const ModuleIcon = moduleIcons[currentModule?.moduleType] || Target;
  const progress = ((currentModuleIndex + 1) / competition.modules.length) * 100;

  // ─── GD Battle Room ────────────────────────────────────────────────────────────
  // For GD_BATTLE type, show video room with Agora
  if (competition.type === 'GD_BATTLE' && battleStarted) {
    return (
      <CompetitionGDBattleRoom
        competition={competition}
        competitionId={competitionId}
        userId={session?.user?.id || ''}
        participants={participants}
      />
    );
  }

  // ─── Pre-Battle Screen ─────────────────────────────────────────────────────────

  if (!battleStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-violet-950 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 max-w-lg w-full border border-slate-700"
        >
          <div className="text-center">
            <div className="w-20 h-20 bg-violet-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-violet-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">{competition.name}</h1>
            <p className="text-slate-400 mb-8">
              {competition.modules.length} modules • {Math.floor(competition.durationPerModule / 60)} min each
            </p>
            
            {/* Module Preview */}
            <div className="bg-slate-900/50 rounded-xl p-4 mb-8">
              <h3 className="text-sm font-medium text-slate-400 mb-3">Battle Modules</h3>
              <div className="flex justify-center flex-wrap gap-2">
                {competition.modules.map((module, idx) => {
                  const Icon = moduleIcons[module.moduleType] || Target;
                  return (
                    <div
                      key={module.id}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg"
                    >
                      <Icon className="w-4 h-4 text-violet-400" />
                      <span className="text-sm text-slate-300">
                        {moduleLabels[module.moduleType]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Rules */}
            <div className="text-left bg-slate-900/50 rounded-xl p-4 mb-8">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Rules</h3>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Complete each module within the time limit</li>
                <li>• Speak clearly into your microphone</li>
                <li>• You have {competition.maxAttempts} attempt(s) per module</li>
                <li>• Your final score is weighted by module importance</li>
              </ul>
            </div>
            
            <Button 
              onClick={handleStartBattle}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 py-6 text-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Battle
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Results Screen ────────────────────────────────────────────────────────────

  if (showResults) {
    const totalScore = Object.values(moduleScores).reduce((sum, ms) => sum + ms.score, 0) / competition.modules.length;
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-violet-950 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 max-w-lg w-full border border-slate-700"
        >
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Battle Complete!</h1>
            <p className="text-slate-400 mb-8">You've completed all modules</p>
            
            {/* Score Display */}
            <div className="bg-slate-900/50 rounded-xl p-6 mb-6">
              <div className="text-5xl font-bold text-violet-400 mb-2">
                {Math.round(totalScore)}%
              </div>
              <p className="text-slate-400">Overall Score</p>
            </div>
            
            {/* Module Scores */}
            <div className="space-y-3 mb-8">
              {competition.modules.map((module) => {
                const score = moduleScores[module.id]?.score || 0;
                const Icon = moduleIcons[module.moduleType] || Target;
                
                return (
                  <div key={module.id} className="bg-slate-900/50 rounded-lg p-3 flex items-center gap-3">
                    <Icon className="w-5 h-5 text-violet-400" />
                    <span className="text-slate-300 flex-1 text-left text-sm">
                      {moduleLabels[module.moduleType]}
                    </span>
                    <span className={cn(
                      "font-semibold",
                      score >= 80 ? "text-green-400" :
                      score >= 60 ? "text-yellow-400" :
                      "text-red-400"
                    )}>
                      {Math.round(score)}%
                    </span>
                  </div>
                );
              })}
            </div>
            
            <Button 
              onClick={handleFinishCompetition}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600"
            >
              View Full Results
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Feedback Modal ────────────────────────────────────────────────────────────

  if (showFeedback && currentFeedback) {
    const score = moduleScores[currentModule?.id]?.score || 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-violet-950 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 max-w-lg w-full border border-slate-700"
        >
          <div className="text-center mb-6">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
              score >= 80 ? "bg-green-500/20" :
              score >= 60 ? "bg-yellow-500/20" :
              "bg-red-500/20"
            )}>
              <CheckCircle2 className={cn(
                "w-8 h-8",
                score >= 80 ? "text-green-500" :
                score >= 60 ? "text-yellow-500" :
                "text-red-500"
              )} />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-1">Module Complete</h2>
            <p className="text-slate-400">{moduleLabels[currentModule?.moduleType]}</p>
          </div>
          
          {/* Score */}
          <div className="bg-slate-900/50 rounded-xl p-4 mb-6 text-center">
            <div className="text-4xl font-bold text-violet-400 mb-1">
              {Math.round(score)}%
            </div>
            <p className="text-sm text-slate-400">Module Score</p>
          </div>
          
          {/* Score Breakdown */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {currentFeedback.pronunciationScore !== undefined && (
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-white">
                  {Math.round(currentFeedback.pronunciationScore)}%
                </div>
                <div className="text-xs text-slate-400">Pronunciation</div>
              </div>
            )}
            {currentFeedback.fluencyScore !== undefined && (
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-white">
                  {Math.round(currentFeedback.fluencyScore)}%
                </div>
                <div className="text-xs text-slate-400">Fluency</div>
              </div>
            )}
            {currentFeedback.grammarScore !== undefined && (
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-white">
                  {Math.round(currentFeedback.grammarScore)}%
                </div>
                <div className="text-xs text-slate-400">Grammar</div>
              </div>
            )}
            {currentFeedback.confidenceScore !== undefined && (
              <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                <div className="text-lg font-semibold text-white">
                  {Math.round(currentFeedback.confidenceScore)}%
                </div>
                <div className="text-xs text-slate-400">Confidence</div>
              </div>
            )}
          </div>
          
          {/* Feedback */}
          {currentFeedback.feedback && (
            <div className="space-y-3 mb-6">
              {currentFeedback.feedback.strengths?.length > 0 && (
                <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-green-400 mb-2">Strengths</h4>
                  <ul className="text-sm text-slate-300 space-y-1">
                    {currentFeedback.feedback.strengths.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {currentFeedback.feedback.improvements?.length > 0 && (
                <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-amber-400 mb-2">Areas to Improve</h4>
                  <ul className="text-sm text-slate-300 space-y-1">
                    {currentFeedback.feedback.improvements.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <Button 
            onClick={handleNextModule}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600"
          >
            {currentModuleIndex < competition.modules.length - 1 ? (
              <>Next Module <ArrowRight className="w-4 h-4 ml-2" /></>
            ) : (
              <>View Results <Trophy className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </motion.div>
      </div>
    );
  }

  // ─── Main Battle Interface ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-violet-950">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <ModuleIcon className="w-6 h-6 text-violet-400" />
              <div>
                <h1 className="font-semibold text-white">
                  {moduleLabels[currentModule?.moduleType]}
                </h1>
                <p className="text-sm text-slate-400">
                  Module {currentModuleIndex + 1} of {competition.modules.length}
                </p>
              </div>
            </div>
            
            {/* Timer */}
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg",
              moduleTimeLeft <= 30 ? "bg-red-900/50 text-red-400" : "bg-slate-700 text-slate-300"
            )}>
              <Clock className="w-5 h-5" />
              <span className="font-mono text-lg">
                {Math.floor(moduleTimeLeft / 60)}:{(moduleTimeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
          
          {/* Progress */}
          <Progress value={progress} className="h-2" />
        </div>
      </div>
      
      {/* Module Content Area */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentModuleIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Module Instructions */}
            <div className="bg-slate-800/80 backdrop-blur rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-3">Instructions</h2>
              <p className="text-slate-300">
                {currentModule?.moduleType === 'READ_ALOUD' && 
                  "Read the following passage clearly and at a natural pace. Focus on pronunciation and clarity."}
                {currentModule?.moduleType === 'LISTEN_AND_REPEAT' && 
                  "Listen to the audio carefully, then repeat what you heard as accurately as possible."}
                {currentModule?.moduleType === 'COMPREHENSION' && 
                  "Read the passage and answer the questions that follow."}
                {currentModule?.moduleType === 'CONVERSATION' && 
                  "Engage in a conversation on the given topic. Respond naturally and thoughtfully."}
                {currentModule?.moduleType === 'EXTEMPORANEOUS' && 
                  "Speak on the given topic for the allotted time. Organize your thoughts and speak confidently."}
                {currentModule?.moduleType === 'LISTEN_AND_SUMMARIZE' && 
                  "Listen to the audio and provide a summary of the main points."}
              </p>
            </div>
            
            {/* Content Area - This would be dynamically loaded based on module config */}
            <div className="bg-slate-800/80 backdrop-blur rounded-xl p-6 border border-slate-700 min-h-[200px]">
              <div className="text-center text-slate-400">
                {/* Module-specific content would be rendered here based on config */}
                <p className="text-lg text-slate-300">
                  {currentModule?.config?.prompt || 
                    "Loading module content..."}
                </p>
              </div>
            </div>
            
            {/* Response Area */}
            <div className="bg-slate-800/80 backdrop-blur rounded-xl p-6 border border-slate-700">
              <h3 className="text-sm font-medium text-slate-400 mb-4">Your Response</h3>
              
              {/* Audio Response */}
              {['READ_ALOUD', 'LISTEN_AND_REPEAT', 'CONVERSATION', 'EXTEMPORANEOUS'].includes(currentModule?.moduleType) && (
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={isRecording ? () => stopRecording() : startRecording}
                    className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center transition-all",
                      isRecording 
                        ? "bg-red-500 animate-pulse" 
                        : "bg-violet-600 hover:bg-violet-500"
                    )}
                  >
                    {isRecording ? (
                      <MicOff className="w-8 h-8 text-white" />
                    ) : (
                      <Mic className="w-8 h-8 text-white" />
                    )}
                  </button>
                </div>
              )}
              
              {/* Text Response */}
              {['COMPREHENSION', 'LISTEN_AND_SUMMARIZE'].includes(currentModule?.moduleType) && (
                <textarea
                  value={textResponse}
                  onChange={(e) => setTextResponse(e.target.value)}
                  placeholder="Type your response here..."
                  className="w-full h-32 bg-slate-900/50 border border-slate-600 rounded-lg p-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 resize-none"
                />
              )}
              
              {/* Recording Status */}
              {isRecording && (
                <div className="text-center text-red-400 animate-pulse">
                  Recording... Speak now
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-xl border-t border-slate-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Weight: {currentModule?.weight}% of total score
          </div>
          
          <Button
            onClick={handleModuleSubmit}
            disabled={submitting}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 px-8"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit
                <Send className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
