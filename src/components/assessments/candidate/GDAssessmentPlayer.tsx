"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
}

// Video Player Component
const VideoPlayer: React.FC<{
  videoTrack?: ICameraVideoTrack;
  audioTrack?: IMicrophoneAudioTrack;
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
  
  // GD state
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [messages, setMessages] = useState<GDMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [participants, setParticipants] = useState<GDParticipant[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<UID | null>(null);
  const [phase, setPhase] = useState<"waiting" | "intro" | "discussion" | "closing">("waiting");
  const [myTalkTime, setMyTalkTime] = useState(0);
  const [totalTalkTime, setTotalTalkTime] = useState(0);

  // Refs
  const messageEndRef = useRef<HTMLDivElement>(null);
  const speechStartTime = useRef<number | null>(null);

  // Initialize Agora
  useEffect(() => {
    const initAgora = async () => {
      try {
        const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        setClient(agoraClient);

        // Handle remote users
        agoraClient.on("user-published", async (user, mediaType) => {
          await agoraClient.subscribe(user, mediaType);
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

        agoraClient.on("user-unpublished", (user, mediaType) => {
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

        agoraClient.on("user-left", (user) => {
          setRemoteUsers((prev) => {
            const updated = new Map(prev);
            updated.delete(user.uid);
            return updated;
          });
          setParticipants((prev) => prev.filter((p) => p.uid !== user.uid));
        });

        // Volume indicator for active speaker
        agoraClient.enableAudioVolumeIndicator();
        agoraClient.on("volume-indicator", (volumes) => {
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

        // Join channel
        await agoraClient.join(
          agoraConfig.appId,
          agoraConfig.channel,
          agoraConfig.token,
          agoraConfig.uid
        );

        // Create and publish tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);
        
        await agoraClient.publish([audioTrack, videoTrack]);

        // Add local participant
        setParticipants([
          {
            id: userId,
            name: participantName,
            uid: agoraConfig.uid,
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
          setPhase("discussion");
          addSystemMessage("The discussion has begun! Share your thoughts on the topic.");
        }, 10000);

      } catch (error) {
        console.error("Failed to initialize Agora:", error);
        setIsConnecting(false);
        onError?.(`Failed to join discussion: ${error}`);
      }
    };

    initAgora();

    // Cleanup
    return () => {
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
      }
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
      }
      client?.leave();
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
    // Calculate results
    const result: GDResultData = {
      transcript: messages,
      totalDuration: (duration * 60) - timeRemaining,
      participationScore: calculateParticipationScore(),
      messagesCount: messages.filter((m) => m.participantId === userId).length,
      talkTimePercent: totalTalkTime > 0 ? Math.round((myTalkTime / totalTalkTime) * 100) : 0,
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
      <div className="flex flex-col items-center justify-center min-h-[600px] bg-gradient-to-b from-gray-900 to-black rounded-xl p-8">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Joining Discussion Room</h3>
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
      <div className="flex flex-1 overflow-hidden">
        {/* Video grid */}
        <div className={cn("flex-1 p-4", showChat ? "w-2/3" : "w-full")}>
          <div
            className={cn(
              "grid gap-4 h-full",
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
                  videoTrack={user.videoTrack as ICameraVideoTrack | undefined}
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

        <Button
          variant={isVideoOff ? "destructive" : "secondary"}
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={toggleVideo}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </Button>

        <Button
          variant={handRaised ? "default" : "secondary"}
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={() => setHandRaised(!handRaised)}
        >
          <Hand className={cn("w-6 h-6", handRaised && "text-yellow-400")} />
        </Button>

        <Button
          variant={showChat ? "default" : "secondary"}
          size="lg"
          className="rounded-full w-14 h-14"
          onClick={() => setShowChat(!showChat)}
        >
          <MessageSquare className="w-6 h-6" />
        </Button>

        <div className="w-px h-10 bg-gray-700 mx-2" />

        <Button variant="destructive" size="lg" onClick={handleEndDiscussion}>
          End Discussion
        </Button>
      </div>
    </div>
  );
}
