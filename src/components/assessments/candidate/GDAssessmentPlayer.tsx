"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
  UID,
} from "agora-rtc-sdk-ng";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  Clock,
  Send,
  MessageSquare,
  AlertCircle,
  Volume2,
  Loader2,
  Hand,
  X,
  CheckCircle2,
  Activity,
  Eye,
  Smile,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Video Analysis Configuration
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "wss://techsevaweb.onrender.com";

// Video Analysis Metrics Interface
interface VideoMetrics {
  confidence: number;
  eyeContact: number;
  posture: number;
  smile: number;
  stressLevel: number;
  engagement: number;
}

// Types
interface GDMessage {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  timestamp: Date;
  isAI?: boolean;
}

interface GDParticipant {
  id: string;
  name: string;
  uid: UID;
  isLocal?: boolean;
  isSpeaking?: boolean;
  score?: number;
  role?: string;
  hasVideo?: boolean;
  hasAudio?: boolean;
}

interface GDAgoraConfig {
  appId: string;
  channel: string;
  token: string;
  uid: number;
}

interface GDAssessmentPlayerProps {
  assessmentTitle: string;
  assessmentId: string;
  topic: string;
  duration: number; // minutes
  agoraConfig: GDAgoraConfig;
  participantName: string;
  userId: string;
  onComplete: (result: GDResultData) => void;
  onError?: (error: string) => void;
}

interface GDResultData {
  transcript: GDMessage[];
  totalDuration: number;
  participationScore: number;
  messagesCount: number;
  talkTimePercent: number;
  aiScores?: {
    contentQuality: number;
    communication: number;
    leadership: number;
    teamwork: number;
    confidence: number;
    overall: number;
  };
  aiFeedback?: string;
  videoMetrics?: {
    confidence: number;
    eyeContact: number;
    posture: number;
    smile: number;
    stressLevel: number;
    engagement: number;
    overallBehavioralScore: number;
  };
}

// Video Player Component
const VideoPlayer: React.FC<{
  videoTrack?: ICameraVideoTrack | IRemoteVideoTrack;
  audioTrack?: IMicrophoneAudioTrack | IRemoteAudioTrack;
  participant: GDParticipant;
  isLocal?: boolean;
  isSpeaking?: boolean;
}> = ({ videoTrack, audioTrack, participant, isLocal, isSpeaking }) => {
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoTrack && videoRef.current) {
      videoTrack.play(videoRef.current);
      return () => {
        videoTrack.stop();
      };
    }
  }, [videoTrack]);

  // Play remote audio track (local audio should not be played back to avoid echo)
  useEffect(() => {
    if (audioTrack && !isLocal) {
      console.log(`[GD] Playing remote audio for ${participant.name}`);
      audioTrack.play();
      return () => {
        audioTrack.stop();
      };
    }
  }, [audioTrack, isLocal, participant.name]);

  return (
    <div
      className={cn(
        "relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden",
        isSpeaking && "ring-2 ring-green-500 ring-offset-2 ring-offset-gray-900"
      )}
    >
      <div ref={videoRef} className="absolute inset-0" />
      
      {/* No video fallback */}
      {!participant.hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {participant.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Participant info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium truncate max-w-[120px]">
              {participant.name} {isLocal && "(You)"}
            </span>
            {participant.role && (
              <Badge variant="secondary" className="text-xs">
                {participant.role}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!participant.hasAudio && <MicOff className="w-4 h-4 text-red-500" />}
            {!participant.hasVideo && <VideoOff className="w-4 h-4 text-red-500" />}
            {isSpeaking && <Volume2 className="w-4 h-4 text-green-500 animate-pulse" />}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main GD Player Component
export default function GDAssessmentPlayer({
  assessmentTitle,
  assessmentId,
  topic,
  duration,
  agoraConfig,
  participantName,
  userId,
  onComplete,
  onError,
}: GDAssessmentPlayerProps) {
  // Agora state
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<Map<UID, IAgoraRTCRemoteUser>>(new Map());
  const [joined, setJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  // UI state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  
  // GD state
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [messages, setMessages] = useState<GDMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [participants, setParticipants] = useState<GDParticipant[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<UID | null>(null);
  const [phase, setPhase] = useState<"waiting" | "intro" | "discussion" | "closing">("waiting");
  const [myTalkTime, setMyTalkTime] = useState(0);
  const [totalTalkTime, setTotalTalkTime] = useState(0);

  // Video Analysis State
  const [videoMetrics, setVideoMetrics] = useState<VideoMetrics>({
    confidence: 0,
    eyeContact: 0,
    posture: 0,
    smile: 0,
    stressLevel: 0,
    engagement: 0,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Refs
  const messageEndRef = useRef<HTMLDivElement>(null);
  const speechStartTime = useRef<number | null>(null);
  const isInitialized = useRef(false);
  
  // Video Analysis Refs
  const wsRef = useRef<WebSocket | null>(null);
  const analysisVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const metricsTimelineRef = useRef<VideoMetrics[]>([]);
  const isProcessingFrame = useRef(false);
  const frameCountRef = useRef(0);

  // Video Analysis Functions
  const getVideoAnalysisWsUrl = useCallback(() => {
    const sessionId = `gd_${assessmentId}_${userId}`;
    const envBase = (WS_URL || '').trim().replace(/\/+$/, '');
    if (envBase.endsWith('/ws/behavioral')) return `${envBase}/${sessionId}`;
    if (envBase.endsWith('/ws')) return `${envBase}/behavioral/${sessionId}`;
    return `${envBase}/ws/behavioral/${sessionId}`;
  }, [assessmentId, userId]);

  // Setup hidden video element for frame capture
  useEffect(() => {
    if (!localVideoTrack || isVideoOff) {
      console.log("⏭️ Skipping video setup:", { hasTrack: !!localVideoTrack, isVideoOff });
      return;
    }

    const mediaStreamTrack = localVideoTrack.getMediaStreamTrack();
    if (!mediaStreamTrack) {
      console.error("❌ No media stream track from Agora");
      return;
    }

    console.log("🎥 Setting up hidden video element for analysis");

    // Create or get hidden video element
    if (!analysisVideoRef.current) {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.style.position = 'absolute';
      video.style.visibility = 'hidden';
      video.style.pointerEvents = 'none';
      video.style.width = '1px';
      video.style.height = '1px';
      document.body.appendChild(video);
      analysisVideoRef.current = video;
      console.log("✅ Created hidden video element");
    }

    const video = analysisVideoRef.current;
    const stream = new MediaStream([mediaStreamTrack]);
    video.srcObject = stream;
    
    video.onloadedmetadata = () => {
      console.log(`✅ Video metadata loaded: ${video.videoWidth}x${video.videoHeight}`);
    };
    
    video.oncanplay = () => {
      console.log("✅ Video can play");
    };
    
    video.onerror = (e) => {
      console.error("❌ Video error:", e);
    };
    
    video.play().then(() => {
      console.log("✅ Video playing");
    }).catch((err) => {
      console.error("❌ Video play failed:", err);
    });

    return () => {
      if (analysisVideoRef.current) {
        analysisVideoRef.current.srcObject = null;
      }
    };
  }, [localVideoTrack, isVideoOff]);

  const captureAndSendFrame = useCallback(() => {
    if (!analysisVideoRef.current || !wsRef.current || isVideoOff) {
      console.log("⏭️ Skipping frame:", {
        hasVideo: !!analysisVideoRef.current,
        hasWS: !!wsRef.current,
        isVideoOff
      });
      return;
    }
    if (wsRef.current.readyState !== WebSocket.OPEN) {
      console.log("⏭️ WS not open:", wsRef.current.readyState);
      return;
    }
    if (isProcessingFrame.current) {
      console.log("⏳ Still processing previous frame");
      return;
    }

    const video = analysisVideoRef.current;
    if (video.readyState < 2) {
      console.log("⏭️ Video not ready:", video.readyState);
      return;
    }

    try {
      // Get or create canvas
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error("❌ No canvas context");
        return;
      }

      // Downscale for analysis
      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;
      
      console.log(`📹 Video dimensions: ${videoWidth}x${videoHeight}`);
      
      const maxWidth = 320;
      const maxHeight = 240;
      
      const ratio = Math.min(maxWidth / videoWidth, maxHeight / videoHeight);
      const newWidth = Math.round(videoWidth * ratio);
      const newHeight = Math.round(videoHeight * ratio);

      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.drawImage(video, 0, 0, newWidth, newHeight);

      const imageData = canvas.toDataURL('image/jpeg', 0.6);
      
      isProcessingFrame.current = true;
      frameCountRef.current += 1;

      const payload = {
        type: 'frame',
        image: imageData,
        frame_id: frameCountRef.current,
        timestamp: Date.now(),
        resolution: { width: newWidth, height: newHeight }
      };

      wsRef.current.send(JSON.stringify(payload));

      console.log(`📤 GD Frame ${frameCountRef.current} sent (${newWidth}x${newHeight}), size: ${Math.round(imageData.length / 1024)}KB`);
    } catch (error) {
      console.error("❌ Error capturing frame:", error);
      isProcessingFrame.current = false;
    }
  }, [isVideoOff]);

  const connectVideoAnalysis = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = getVideoAnalysisWsUrl();
    console.log("🎥 Connecting to video analysis:", wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("✅ Video analysis WebSocket connected");
      setWsConnected(true);
      setIsAnalyzing(true);

      // Start frame capture interval (2 FPS)
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
      frameIntervalRef.current = setInterval(() => {
        captureAndSendFrame();
      }, 500);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📥 Received WS message:", data.type, data);
        
        if (data.type === 'analysis' && data.metrics) {
          const metrics: VideoMetrics = {
            confidence: data.metrics.confidence || 0,
            eyeContact: data.metrics.eye_contact || 0,
            posture: data.metrics.posture || 0,
            smile: data.metrics.smile || 0,
            stressLevel: data.metrics.stress_level || 0,
            engagement: data.metrics.engagement || 0,
          };
          
          console.log("📊 Metrics updated:", metrics);
          setVideoMetrics(metrics);
          metricsTimelineRef.current.push(metrics);
          isProcessingFrame.current = false;
        } else if (data.type === 'busy') {
          console.log("⏳ Backend busy");
          isProcessingFrame.current = false;
        } else if (data.type === 'connected') {
          console.log("🎉 Video analysis session started:", data.message);
        } else if (data.type === 'error') {
          console.error("❌ Video analysis error:", data.message);
          isProcessingFrame.current = false;
        } else {
          console.warn("⚠️ Unknown message type:", data.type);
        }
      } catch (e) {
        console.error("❌ Error parsing video analysis message:", e, event.data);
        isProcessingFrame.current = false;
      }
    };

    ws.onclose = (e) => {
      console.log("🔌 Video analysis WebSocket closed:", e.code, e.reason);
      console.log("Close event details:", { 
        wasClean: e.wasClean, 
        code: e.code, 
        reason: e.reason || "No reason provided" 
      });
      
      setWsConnected(false);
      setIsAnalyzing(false);
      
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }

      // Auto-reconnect on abnormal closure (1006) if still joined
      if (e.code === 1006 && joined) {
        console.log("🔄 Attempting auto-reconnect in 3 seconds...");
        setTimeout(() => {
          if (joined && !wsRef.current) {
            console.log("🔄 Reconnecting...");
            connectVideoAnalysis();
          }
        }, 3000);
      }
    };

    ws.onerror = (err) => {
      console.error("❌ Video analysis WebSocket error:", err);
    };

    wsRef.current = ws;
  }, [captureAndSendFrame, getVideoAnalysisWsUrl, joined]);

  const disconnectVideoAnalysis = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Cleanup hidden video element
    if (analysisVideoRef.current) {
      analysisVideoRef.current.srcObject = null;
      analysisVideoRef.current.remove();
      analysisVideoRef.current = null;
    }
    
    setIsAnalyzing(false);
    setWsConnected(false);
  }, []);

  const calculateAverageMetrics = useCallback(() => {
    const timeline = metricsTimelineRef.current;
    if (timeline.length === 0) return null;

    const avg = (key: keyof VideoMetrics) =>
      timeline.reduce((sum, m) => sum + m[key], 0) / timeline.length;

    const avgMetrics = {
      confidence: Math.round(avg('confidence')),
      eyeContact: Math.round(avg('eyeContact')),
      posture: Math.round(avg('posture')),
      smile: Math.round(avg('smile')),
      stressLevel: Math.round(avg('stressLevel')),
      engagement: Math.round(avg('engagement')),
      overallBehavioralScore: 0,
    };

    // Calculate overall score (weighted average)
    avgMetrics.overallBehavioralScore = Math.round(
      avgMetrics.confidence * 0.2 +
      avgMetrics.eyeContact * 0.2 +
      avgMetrics.posture * 0.15 +
      avgMetrics.smile * 0.1 +
      avgMetrics.engagement * 0.25 +
      (100 - avgMetrics.stressLevel) * 0.1 // Inverse stress level
    );

    return avgMetrics;
  }, []);

  // Start video analysis when joined
  useEffect(() => {
    if (joined && localVideoTrack && !isVideoOff) {
      // Wait a bit for tracks to stabilize
      const timeout = setTimeout(() => {
        connectVideoAnalysis();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [joined, localVideoTrack, isVideoOff, connectVideoAnalysis]);

  // Cleanup video analysis on unmount
  useEffect(() => {
    return () => {
      disconnectVideoAnalysis();
    };
  }, [disconnectVideoAnalysis]);

  // Initialize Agora
  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (isInitialized.current) return;
    isInitialized.current = true;
    
    let agoraClient: IAgoraRTCClient | null = null;
    let localAudio: IMicrophoneAudioTrack | null = null;
    let localVideo: ICameraVideoTrack | null = null;
    let isCancelled = false;
    
    const initAgora = async () => {
      try {
        agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        setClient(agoraClient);
        
        // Store reference for event handlers
        const client = agoraClient;

        // Handle remote users
        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          setRemoteUsers((prev) => new Map(prev).set(user.uid, user));
          
          // Update participants
          setParticipants((prev) => {
            const existing = prev.find((p) => p.uid === user.uid);
            if (existing) {
              return prev.map((p) =>
                p.uid === user.uid
                  ? {
                      ...p,
                      hasVideo: mediaType === "video" ? true : p.hasVideo,
                      hasAudio: mediaType === "audio" ? true : p.hasAudio,
                    }
                  : p
              );
            }
            return [
              ...prev,
              {
                id: `remote-${user.uid}`,
                name: `Participant ${user.uid}`,
                uid: user.uid,
                hasVideo: mediaType === "video",
                hasAudio: mediaType === "audio",
              },
            ];
          });
        });

        client.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "video") {
            setRemoteUsers((prev) => {
              const updated = new Map(prev);
              const existingUser = updated.get(user.uid);
              if (existingUser) {
                updated.set(user.uid, { ...existingUser, videoTrack: undefined } as IAgoraRTCRemoteUser);
              }
              return updated;
            });
          }
        });

        client.on("user-left", (user) => {
          setRemoteUsers((prev) => {
            const updated = new Map(prev);
            updated.delete(user.uid);
            return updated;
          });
          setParticipants((prev) => prev.filter((p) => p.uid !== user.uid));
        });

        // Volume indicator for active speaker
        client.enableAudioVolumeIndicator();
        client.on("volume-indicator", (volumes) => {
          const speaking = volumes.find((v) => v.level > 5);
          if (speaking) {
            setActiveSpeaker(speaking.uid);
            
            // Track talk time for local user
            if (speaking.uid === agoraConfig.uid) {
              if (!speechStartTime.current) {
                speechStartTime.current = Date.now();
              }
            }
          } else {
            if (speechStartTime.current && activeSpeaker === agoraConfig.uid) {
              const duration = Date.now() - speechStartTime.current;
              setMyTalkTime((prev) => prev + duration);
              speechStartTime.current = null;
            }
            setActiveSpeaker(null);
          }
        });

        // Validate channel name (Agora 64-byte limit)
        // The backend should have already provided a valid channel, but double-check
        if (agoraConfig.channel.length > 64) {
          console.error(`Channel name too long (${agoraConfig.channel.length} chars). Backend should have regenerated.`);
          throw new Error("Invalid channel configuration. Please refresh the page to get a new session.");
        }
        
        if (isCancelled) return;

        // IMPORTANT: Use the UID that the token was generated for
        // Agora tokens are bound to specific UIDs - using a different UID will cause auth failure
        const tokenUid = agoraConfig.uid;
        console.log(`[GD] Joining channel: ${agoraConfig.channel}, UID: ${tokenUid}`);

        // Join channel with the UID that matches the token
        await client.join(
          agoraConfig.appId,
          agoraConfig.channel,
          agoraConfig.token,
          tokenUid // Must match the UID the token was generated for
        );
        
        if (isCancelled) {
          await client.leave();
          return;
        }

        // Create and publish tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        localAudio = audioTrack;
        localVideo = videoTrack;
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);
        
        if (isCancelled) {
          audioTrack.stop();
          audioTrack.close();
          videoTrack.stop();
          videoTrack.close();
          await client.leave();
          return;
        }
        
        await client.publish([audioTrack, videoTrack]);

        // Add local participant with the UID we joined with
        setParticipants([
          {
            id: userId,
            name: participantName,
            uid: tokenUid,
            isLocal: true,
            hasVideo: true,
            hasAudio: true,
          },
        ]);

        setJoined(true);
        setIsConnecting(false);
        setPhase("intro");

        // Add welcome message
        addSystemMessage(`Welcome to the Group Discussion! Topic: "${topic}". The discussion will begin shortly.`);

        // Start discussion after 10 seconds
        setTimeout(() => {
          if (!isCancelled) {
            setPhase("discussion");
            addSystemMessage("The discussion has begun! Share your thoughts on the topic.");
          }
        }, 10000);

      } catch (error) {
        console.error("Failed to initialize Agora:", error);
        if (!isCancelled) {
          setIsConnecting(false);
          onError?.(`Failed to join discussion: ${error}`);
        }
      }
    };

    initAgora();

    // Cleanup
    return () => {
      isCancelled = true;
      if (localAudio) {
        localAudio.stop();
        localAudio.close();
      }
      if (localVideo) {
        localVideo.stop();
        localVideo.close();
      }
      agoraClient?.leave().catch(console.error);
    };
  }, []);

  // Timer
  useEffect(() => {
    if (!joined || phase === "waiting") return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleEndDiscussion();
          return 0;
        }
        
        // Closing phase warning at 2 minutes
        if (prev === 120) {
          setPhase("closing");
          addSystemMessage("2 minutes remaining! Start wrapping up your points.");
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [joined, phase]);

  // Auto-scroll messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addSystemMessage = (text: string) => {
    const message: GDMessage = {
      id: `sys-${Date.now()}`,
      participantId: "system",
      participantName: "System",
      text,
      timestamp: new Date(),
      isAI: true,
    };
    setMessages((prev) => [...prev, message]);
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

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: GDMessage = {
      id: `msg-${Date.now()}`,
      participantId: userId,
      participantName: participantName,
      text: newMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
    
    // Also update total talk time for typing
    setTotalTalkTime((prev) => prev + newMessage.length * 50); // Estimate typing contribution
  };

  const handleEndDiscussion = async () => {
    // Stop video analysis first
    disconnectVideoAnalysis();

    // Calculate video metrics
    const avgVideoMetrics = calculateAverageMetrics();

    // Calculate results
    const result: GDResultData = {
      transcript: messages,
      totalDuration: (duration * 60) - timeRemaining,
      participationScore: calculateParticipationScore(),
      messagesCount: messages.filter((m) => m.participantId === userId).length,
      talkTimePercent: totalTalkTime > 0 ? Math.round((myTalkTime / totalTalkTime) * 100) : 0,
      videoMetrics: avgVideoMetrics || undefined,
    };

    // Get AI evaluation
    try {
      const response = await fetch("/api/ai/evaluate-gd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: messages.map((m) => ({
            participantId: m.participantId,
            participantName: m.participantName,
            text: m.text,
            timestamp: m.timestamp,
          })),
          topic,
          userId,
          participantName,
          videoMetrics: avgVideoMetrics,
        }),
      });

      if (response.ok) {
        const aiResult = await response.json();
        result.aiScores = aiResult.scores;
        result.aiFeedback = aiResult.feedback;
      }
    } catch (error) {
      console.error("Failed to get AI evaluation:", error);
    }

    // Cleanup
    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
    }
    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
    }
    await client?.leave();

    onComplete(result);
  };

  const calculateParticipationScore = () => {
    const myMessages = messages.filter((m) => m.participantId === userId).length;
    const totalMessages = messages.filter((m) => !m.isAI).length;
    
    if (totalMessages === 0) return 0;
    
    const participationRatio = myMessages / totalMessages;
    // Ideal is around 20-30% for a 4-5 person group
    const idealRatio = 0.25;
    const deviation = Math.abs(participationRatio - idealRatio);
    
    // Score decreases with deviation from ideal
    return Math.round(Math.max(0, 100 - (deviation * 200)));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-900 to-black p-8">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Joining Discussion Room</h3>
        <p className="text-gray-400">Setting up your audio and video...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-gray-900/80 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{assessmentTitle}</h2>
            <p className="text-sm text-gray-400">Topic: {topic}</p>
          </div>
          <Badge
            variant={phase === "discussion" ? "default" : phase === "closing" ? "destructive" : "secondary"}
            className="uppercase"
          >
            {phase}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-300">
            <Users className="w-5 h-5" />
            <span>{participants.length}</span>
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
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden relative min-h-0">
        {/* Video grid */}
        <div className={cn("flex-1 p-4 flex flex-col", showChat ? "w-2/3" : "w-full")}>
          <div
            className={cn(
              "grid gap-4 flex-1 w-full",
              participants.length <= 2
                ? "grid-cols-2"
                : participants.length <= 4
                ? "grid-cols-2 grid-rows-2"
                : "grid-cols-3 grid-rows-2"
            )}
          >
            {/* Local video */}
            <VideoPlayer
              videoTrack={localVideoTrack || undefined}
              audioTrack={localAudioTrack || undefined}
              participant={participants.find((p) => p.isLocal) || {
                id: userId,
                name: participantName,
                uid: agoraConfig.uid,
                isLocal: true,
                hasVideo: !isVideoOff,
                hasAudio: !isMuted,
              }}
              isLocal
              isSpeaking={activeSpeaker === agoraConfig.uid}
            />

            {/* Remote videos */}
            {Array.from(remoteUsers.values()).map((user) => {
              const participant = participants.find((p) => p.uid === user.uid) || {
                id: `remote-${user.uid}`,
                name: `Participant ${user.uid}`,
                uid: user.uid,
                hasVideo: !!user.videoTrack,
                hasAudio: !!user.audioTrack,
              };
              
              return (
                <VideoPlayer
                  key={user.uid}
                  videoTrack={user.videoTrack}
                  audioTrack={user.audioTrack}
                  participant={participant}
                  isSpeaking={activeSpeaker === user.uid}
                />
              );
            })}
          </div>
        </div>

        {/* Chat panel */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "33.333%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-gray-800 flex flex-col bg-gray-900/50"
            >
              <div className="p-4 border-b border-gray-800">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Discussion Chat
                </h3>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "p-3 rounded-lg",
                        msg.isAI
                          ? "bg-blue-500/20 border border-blue-500/30"
                          : msg.participantId === userId
                          ? "bg-purple-500/20 border border-purple-500/30 ml-4"
                          : "bg-gray-800"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            msg.isAI ? "text-blue-400" : msg.participantId === userId ? "text-purple-400" : "text-gray-300"
                          )}
                        >
                          {msg.participantName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-200">{msg.text}</p>
                    </div>
                  ))}
                  <div ref={messageEndRef} />
                </div>
              </ScrollArea>

              {/* Message input */}
              <div className="p-4 border-t border-gray-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your point..."
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Analysis Metrics Panel */}
        <AnimatePresence>
          {showMetrics && isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-4 top-20 w-64 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-xl z-20"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  AI Video Analysis
                </h4>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  wsConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                )} />
              </div>

              <div className="space-y-3">
                {/* Confidence */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Confidence
                    </span>
                    <span className="text-white font-medium">{videoMetrics.confidence}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                      style={{ width: `${videoMetrics.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Eye Contact */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Eye Contact
                    </span>
                    <span className="text-white font-medium">{videoMetrics.eyeContact}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                      style={{ width: `${videoMetrics.eyeContact}%` }}
                    />
                  </div>
                </div>

                {/* Posture */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Posture</span>
                    <span className="text-white font-medium">{videoMetrics.posture}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                      style={{ width: `${videoMetrics.posture}%` }}
                    />
                  </div>
                </div>

                {/* Smile */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Smile className="w-3 h-3" />
                      Smile
                    </span>
                    <span className="text-white font-medium">{videoMetrics.smile}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-500"
                      style={{ width: `${videoMetrics.smile}%` }}
                    />
                  </div>
                </div>

                {/* Engagement */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Engagement</span>
                    <span className="text-white font-medium">{videoMetrics.engagement}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${videoMetrics.engagement}%` }}
                    />
                  </div>
                </div>

                {/* Stress Level */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Stress Level</span>
                    <span className={cn(
                      "font-medium",
                      videoMetrics.stressLevel > 70 ? "text-red-400" : 
                      videoMetrics.stressLevel > 40 ? "text-yellow-400" : "text-green-400"
                    )}>
                      {videoMetrics.stressLevel}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-500",
                        videoMetrics.stressLevel > 70 ? "bg-gradient-to-r from-red-500 to-red-400" : 
                        videoMetrics.stressLevel > 40 ? "bg-gradient-to-r from-yellow-500 to-yellow-400" : 
                        "bg-gradient-to-r from-green-500 to-green-400"
                      )}
                      style={{ width: `${videoMetrics.stressLevel}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-500 text-center">
                  Real-time behavioral analysis
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 flex items-center justify-center gap-4 px-6 py-4 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 z-50">
        <Button
          variant={isMuted ? "destructive" : "outline"}
          size="lg"
          className={cn(
            "rounded-full w-14 h-14 flex items-center justify-center",
            !isMuted && "bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
          )}
          onClick={toggleMute}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </Button>

        <Button
          variant={isVideoOff ? "destructive" : "outline"}
          size="lg"
          className={cn(
            "rounded-full w-14 h-14 flex items-center justify-center",
            !isVideoOff && "bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
          )}
          onClick={toggleVideo}
          title={isVideoOff ? "Turn on camera" : "Turn off camera"}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </Button>

        <Button
          variant={handRaised ? "default" : "outline"}
          size="lg"
          className={cn(
            "rounded-full w-14 h-14 flex items-center justify-center",
            handRaised ? "bg-yellow-600 hover:bg-yellow-500 text-white" : "bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
          )}
          onClick={() => setHandRaised(!handRaised)}
          title={handRaised ? "Lower hand" : "Raise hand"}
        >
          <Hand className="w-6 h-6" />
        </Button>

        <Button
          variant={showChat ? "default" : "outline"}
          size="lg"
          className={cn(
            "rounded-full w-14 h-14 flex items-center justify-center",
            showChat ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
          )}
          onClick={() => setShowChat(!showChat)}
          title={showChat ? "Hide chat" : "Show chat"}
        >
          <MessageSquare className="w-6 h-6" />
        </Button>

        <Button
          variant={showMetrics ? "default" : "outline"}
          size="lg"
          className={cn(
            "rounded-full w-14 h-14 flex items-center justify-center",
            showMetrics ? "bg-green-600 hover:bg-green-500 text-white" : "bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
          )}
          onClick={() => setShowMetrics(!showMetrics)}
          title={showMetrics ? "Hide AI Analysis" : "Show AI Analysis"}
        >
          <Activity className="w-6 h-6" />
        </Button>

        <div className="w-px h-10 bg-gray-700 mx-2" />

        <Button variant="destructive" size="lg" onClick={handleEndDiscussion}>
          End Discussion
        </Button>
      </div>
    </div>
  );
}
