"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  CameraOff, 
  Activity, 
  Eye, 
  Smile, 
  AlertTriangle,
  TrendingUp,
  X
} from 'lucide-react';

interface BehavioralMetrics {
  confidence: number;
  eye_contact: number;
  posture: number;
  engagement: number;
  smile: number;
  head_stability: number;
  stress_level: number;
  filler_word_count: number;
  face_detected: boolean;
  alerts: string[];
}

interface VideoAnalysisPanelProps {
  sessionId: string;
  isActive: boolean;
  onSessionEnd?: (metrics: BehavioralMetrics) => void;
  isCompact?: boolean;
}

interface BehavioralTimelinePoint {
  timestamp: string;
  confidence: number;
  eye_contact: number;
  posture: number;
  engagement: number;
  smile: number;
  head_stability: number;
  stress_level: number;
  filler_word_count: number;
  face_detected: boolean;
}

interface BehavioralAlertSnapshot {
  id: string;
  timestamp: string;
  issueCode: string;
  issueDetected: string;
  observation: string;
  suggestion: string;
  imageData: string;
}

const DEFAULT_METRICS: BehavioralMetrics = {
  confidence: 0,
  eye_contact: 0,
  posture: 0,
  engagement: 0,
  smile: 0,
  head_stability: 0,
  stress_level: 0,
  filler_word_count: 0,
  face_detected: false,
  alerts: []
};

const VideoAnalysisPanel: React.FC<VideoAnalysisPanelProps> = ({ 
  sessionId, 
  isActive,
  onSessionEnd,
  isCompact = false
}) => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [metrics, setMetrics] = useState<BehavioralMetrics>(DEFAULT_METRICS);
  const [metricsHistory, setMetricsHistory] = useState<BehavioralMetrics[]>([]);
  const [annotatedFrame, setAnnotatedFrame] = useState<string>("");
  const [wsConnected, setWsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration for frame throttling and optimization
  const TARGET_FPS = 3; // 3 FPS - balanced for real-time analysis
  const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
  const MAX_WIDTH = 640; // Downscale to 640px width
  const MAX_HEIGHT = 480; // Downscale to 480px height
  const JPEG_QUALITY = 0.6; // 60% JPEG quality for smaller payload

  // State for backpressure handling
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);
  const lastFrameTimeRef = useRef<number>(0);
  const pendingFrameRef = useRef<boolean>(false);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const frameCounterRef = useRef<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timelineRef = useRef<BehavioralTimelinePoint[]>([]);
  const metricsRef = useRef<BehavioralMetrics>(DEFAULT_METRICS);
  const alertSnapshotsRef = useRef<BehavioralAlertSnapshot[]>([]);
  const lastSnapshotAtRef = useRef<number>(0);
  const snapshotCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const startedAtRef = useRef<string | null>(null);
  const savingRef = useRef(false);
  const savedRef = useRef(false);

  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  const buildSnapshotForIssue = useCallback(
    (issueCode: string): Omit<BehavioralAlertSnapshot, "id" | "timestamp" | "imageData"> | null => {
      switch (issueCode) {
        case "LOW_EYE_CONTACT":
          return {
            issueCode,
            issueDetected: "Low Eye Contact",
            observation: "Candidate is frequently looking away from the camera.",
            suggestion: "Maintain direct eye contact with the camera lens to project confidence."
          };
        case "POOR_POSTURE":
          return {
            issueCode,
            issueDetected: "Poor Posture",
            observation: "Shoulder alignment and sitting posture appear inconsistent.",
            suggestion: "Sit upright with shoulders aligned and keep your head centered."
          };
        case "HIGH_STRESS":
          return {
            issueCode,
            issueDetected: "High Stress",
            observation: "Facial tension suggests elevated stress during responses.",
            suggestion: "Pause briefly and use controlled breathing before key answers."
          };
        case "PHONE_DETECTED":
          return {
            issueCode,
            issueDetected: "Mobile Phone Detected",
            observation: "A mobile phone was detected in the frame during the interview.",
            suggestion: "Please keep your mobile phone away to avoid distractions and maintain professionalism."
          };
        case "NO_FACE":
          return {
            issueCode,
            issueDetected: "Face Not Detected",
            observation: "Face tracking was interrupted due to camera framing.",
            suggestion: "Center your face in frame with stable lighting and minimal movement."
          };
        case "NEGATIVE_EXPRESSION":
          return {
            issueCode,
            issueDetected: "Negative Expression",
            observation: "Facial expression appears flat or tense for sustained periods.",
            suggestion: "Keep a natural, attentive expression to improve interviewer perception."
          };
        case "LOW_ENGAGEMENT":
          return {
            issueCode,
            issueDetected: "Low Engagement",
            observation: "Visual engagement indicators dropped during interaction.",
            suggestion: "Use attentive posture and nod naturally to show active involvement."
          };
        default:
          return null;
      }
    },
    []
  );

  const resolvePriorityIssue = useCallback((newMetrics: BehavioralMetrics): string | null => {
    const alertSet = new Set((newMetrics.alerts || []).map((a) => String(a).toUpperCase()));

    if (alertSet.has("NO_FACE") || !newMetrics.face_detected) return "NO_FACE";
    if (alertSet.has("PHONE_DETECTED")) return "PHONE_DETECTED";
    if (alertSet.has("HIGH_STRESS") || newMetrics.stress_level > 70) return "HIGH_STRESS";
    if (alertSet.has("POOR_POSTURE") || newMetrics.posture < 50) return "POOR_POSTURE";
    if (alertSet.has("LOW_EYE_CONTACT") || newMetrics.eye_contact < 40) return "LOW_EYE_CONTACT";
    if (newMetrics.smile < 30) return "NEGATIVE_EXPRESSION";
    if (newMetrics.engagement < 45) return "LOW_ENGAGEMENT";
    return null;
  }, []);

  const captureBehavioralSnapshot = useCallback(
    (newMetrics: BehavioralMetrics) => {
      const issueCode = resolvePriorityIssue(newMetrics);
      if (!issueCode) return;

      const now = Date.now();
      const SNAPSHOT_COOLDOWN_MS = 15000;
      const MAX_SNAPSHOTS = 6;

      if (now - lastSnapshotAtRef.current < SNAPSHOT_COOLDOWN_MS) return;
      if (alertSnapshotsRef.current.length >= MAX_SNAPSHOTS) return;

      const issueMeta = buildSnapshotForIssue(issueCode);
      if (!issueMeta) return;

      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      if (!snapshotCanvasRef.current) {
        snapshotCanvasRef.current = document.createElement("canvas");
      }

      const canvas = snapshotCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = Math.min(video.videoWidth || 640, 640);
      const height = Math.min(video.videoHeight || 480, 480);
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(video, 0, 0, width, height);

      const imageData = canvas.toDataURL("image/jpeg", 0.65);
      if (!imageData.startsWith("data:image/jpeg;base64,")) return;

      alertSnapshotsRef.current.push({
        id: `${issueCode}_${now}`,
        timestamp: new Date(now).toISOString(),
        imageData,
        ...issueMeta,
      });
      lastSnapshotAtRef.current = now;
    },
    [buildSnapshotForIssue, resolvePriorityIssue]
  );

  const getBehavioralWsUrl = useCallback(() => {
    const session = encodeURIComponent(sessionId);
    const envBase = (process.env.NEXT_PUBLIC_WS_URL || '').trim().replace(/\/+$/, '');

    if (envBase) {
      if (envBase.endsWith('/ws/behavioral')) return `${envBase}/${session}`;
      if (envBase.endsWith('/ws')) return `${envBase}/behavioral/${session}`;
      return `${envBase}/ws/behavioral/${session}`;
    }

    if (typeof window !== 'undefined') {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      return `${wsProtocol}://${window.location.hostname}:8000/ws/behavioral/${session}`;
    }

    return `ws://localhost:8000/ws/behavioral/${session}`;
  }, [sessionId]);

  // Connect to WebSocket with auto-reconnect
  const connectWebSocket = useCallback(() => {
    const wsUrl = getBehavioralWsUrl();
    
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("✅ Connected to behavioral analysis WebSocket");
      setWsConnected(true);
      setError(null);
      
      // Auto-start analysis after connection
      if (!isAnalyzing) {
        setIsAnalyzing(true);
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("📨 Received message:", message.type);
        
        if (message.type === "behavioral_result") {
          const data = message.data;
          const newMetrics = data.metrics;
          
          // Backpressure: Mark that previous frame is processed
          setIsProcessingFrame(false);
          pendingFrameRef.current = false;
          
          setMetrics(newMetrics);
          setMetricsHistory(prev => [...prev.slice(-100), newMetrics]);
          timelineRef.current.push({
            timestamp: new Date().toISOString(),
            confidence: newMetrics.confidence,
            eye_contact: newMetrics.eye_contact,
            posture: newMetrics.posture,
            engagement: newMetrics.engagement,
            smile: newMetrics.smile,
            head_stability: newMetrics.head_stability,
            stress_level: newMetrics.stress_level,
            filler_word_count: newMetrics.filler_word_count,
            face_detected: newMetrics.face_detected,
          });
          if (timelineRef.current.length > 1500) {
            timelineRef.current = timelineRef.current.slice(-1500);
          }
          
          if (data.annotated_frame) {
            setAnnotatedFrame(data.annotated_frame);
          }
          captureBehavioralSnapshot(newMetrics);
        } else if (message.type === "busy") {
          // Backend is busy - drop pending frame and wait
          console.log("⚠️ Backend busy, dropping frame");
          setIsProcessingFrame(false);
          pendingFrameRef.current = false;
        } else if (message.type === "connected") {
          console.log("🎉 Behavioral analysis session started:", message.message);
        } else if (message.type === "error") {
          console.error("❌ Server error:", message.message);
          setError(message.message);
          // Also reset processing state on error
          setIsProcessingFrame(false);
          pendingFrameRef.current = false;
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
        // Reset processing state on error
        setIsProcessingFrame(false);
        pendingFrameRef.current = false;
      }
    };

    ws.onclose = (e) => {
      console.log("🔌 WebSocket closed:", e.code, e.reason);
      setWsConnected(false);
      
      // Auto-reconnect if still analyzing
      if (isAnalyzing && e.code !== 1000) {
        console.log("🔄 Attempting to reconnect...");
        setTimeout(connectWebSocket, 2000);
      }
    };

    ws.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
      setError(`Failed to connect to analysis server. Ensure backend is running on ${wsUrl}`);
    };

    wsRef.current = ws;
  }, [captureBehavioralSnapshot, getBehavioralWsUrl, isAnalyzing]);

  // Start camera and behavioral analysis together when interview starts
  const startCamera = async () => {
    try {
      console.log("📷 Starting camera...");
      startedAtRef.current = new Date().toISOString();
      timelineRef.current = [];
      alertSnapshotsRef.current = [];
      lastSnapshotAtRef.current = 0;
      savedRef.current = false;
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      });
      
      streamRef.current = stream;
      console.log("✅ Camera started successfully");
      setIsCameraOn(true);
      
      // Connect to WebSocket
      connectWebSocket();
      
    } catch (err) {
      console.error("❌ Error starting camera:", err);
      setError("Failed to access camera. Please check permissions.");
    }
  };

  const persistBehavioralAnalytics = useCallback(async () => {
    if (savedRef.current || savingRef.current || !startedAtRef.current) {
      return;
    }

    const timeline = timelineRef.current;
    if (!timeline.length) {
      return;
    }

    const avg = (pick: (p: BehavioralTimelinePoint) => number) =>
      timeline.reduce((sum, item) => sum + pick(item), 0) / timeline.length;

    const summaryPayload = {
      confidence: Number(avg((p) => p.confidence).toFixed(1)),
      eye_contact: Number(avg((p) => p.eye_contact).toFixed(1)),
      posture: Number(avg((p) => p.posture).toFixed(1)),
      engagement: Number(avg((p) => p.engagement).toFixed(1)),
      smile: Number(avg((p) => p.smile).toFixed(1)),
      head_stability: Number(avg((p) => p.head_stability).toFixed(1)),
      stress_level: Number(avg((p) => p.stress_level).toFixed(1)),
      filler_word_count: Number(avg((p) => p.filler_word_count).toFixed(1)),
      face_detected_rate: Number(((timeline.filter((p) => p.face_detected).length / timeline.length) * 100).toFixed(1)),
    };

    const alerts = Array.from(new Set(metricsRef.current.alerts || []));
    const sampledTimeline = timeline.filter((_, i) => i % 3 === 0).slice(-300);

    try {
      savingRef.current = true;
      await fetch("/api/behavioral-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          startedAt: startedAtRef.current,
          endedAt: new Date().toISOString(),
          summary: summaryPayload,
          timeline: sampledTimeline,
          alerts,
          alertSnapshots: alertSnapshotsRef.current,
          sampleCount: timeline.length,
        }),
      });
      savedRef.current = true;
    } catch (err) {
      console.error("Failed to persist behavioral analytics:", err);
    } finally {
      savingRef.current = false;
    }
  }, [sessionId]);

  // Stop camera
  const stopCamera = () => {
    void persistBehavioralAnalytics();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setIsCameraOn(false);
    setIsAnalyzing(false);
    setWsConnected(false);
    setIsProcessingFrame(false);
    pendingFrameRef.current = false;
    setMetrics(DEFAULT_METRICS);
    setMetricsHistory([]);
    setAnnotatedFrame("");
    alertSnapshotsRef.current = [];
    lastSnapshotAtRef.current = 0;
    setError(null);
  };

  // Process frames and send to backend with throttling, downscaling, and backpressure
  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !wsRef.current || !isAnalyzing) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== 4) {
      return;
    }

    // Backpressure: Skip if previous frame is still being processed
    if (isProcessingFrame || pendingFrameRef.current) {
      console.log("⏳ Skipping frame - backend still processing previous frame");
      return;
    }

    // Throttling: Check time since last frame
    const now = Date.now();
    const timeSinceLastFrame = now - lastFrameTimeRef.current;
    if (timeSinceLastFrame < FRAME_INTERVAL_MS) {
      return;
    }

    try {
      // Downscale: Calculate new dimensions maintaining aspect ratio
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      let newWidth = videoWidth;
      let newHeight = videoHeight;

      // Scale down to fit within MAX_WIDTH x MAX_HEIGHT while maintaining aspect ratio
      if (videoWidth > MAX_WIDTH || videoHeight > MAX_HEIGHT) {
        const widthRatio = MAX_WIDTH / videoWidth;
        const heightRatio = MAX_HEIGHT / videoHeight;
        const ratio = Math.min(widthRatio, heightRatio);
        newWidth = Math.round(videoWidth * ratio);
        newHeight = Math.round(videoHeight * ratio);
      }

      // Set canvas to downscaled dimensions
      canvas.width = newWidth;
      canvas.height = newHeight;

      // Draw downscaled video frame to canvas
      ctx.drawImage(video, 0, 0, newWidth, newHeight);

      // Get frame as base64 with reduced quality for smaller payload
      const imageData = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

      // Backpressure: Mark that we're sending a new frame
      setIsProcessingFrame(true);
      pendingFrameRef.current = true;
      lastFrameTimeRef.current = now;
      frameCounterRef.current += 1;

      // Send to backend via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "frame",
          image: imageData,
          frame_id: frameCounterRef.current,
          timestamp: now,
          resolution: { width: newWidth, height: newHeight }
        }));
        console.log(`📤 Sent frame ${frameCounterRef.current} (${newWidth}x${newHeight})`);
      } else {
        // WebSocket not ready - reset processing state
        setIsProcessingFrame(false);
        pendingFrameRef.current = false;
      }
    } catch (err) {
      console.error("Error processing frame:", err);
      setIsProcessingFrame(false);
      pendingFrameRef.current = false;
    }
  }, [isAnalyzing, isProcessingFrame]);

  // Stop analysis
  const stopAnalysis = () => {
    setIsAnalyzing(false);
    
    // Clear the frame processing interval
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    
    // Reset backpressure state
    setIsProcessingFrame(false);
    pendingFrameRef.current = false;
    
    // Get session summary
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "get_summary" }));
    }

    // Call onSessionEnd callback
    if (onSessionEnd) {
      onSessionEnd(metrics);
    }
  };

  // Process frames when analyzing - use setInterval for throttled FPS
  useEffect(() => {
    if (isAnalyzing && isCameraOn) {
      // Reset frame timing
      lastFrameTimeRef.current = 0;
      pendingFrameRef.current = false;
      setIsProcessingFrame(false);
      
      // Use setInterval for throttled frame processing (3 FPS)
      frameIntervalRef.current = setInterval(() => {
        processFrame();
      }, FRAME_INTERVAL_MS);
      
      console.log(`🎬 Started frame processing at ${TARGET_FPS} FPS (interval: ${FRAME_INTERVAL_MS}ms)`);
    }

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
        console.log("🛑 Stopped frame processing");
      }
    };
  }, [isAnalyzing, isCameraOn, processFrame]);

  // Attach MediaStream only after video element is mounted
  useEffect(() => {
    const attachStream = async () => {
      if (!isCameraOn || !videoRef.current || !streamRef.current) {
        return;
      }

      try {
        if (videoRef.current.srcObject !== streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }
        await videoRef.current.play();
      } catch (err) {
        console.error("❌ Error playing camera stream:", err);
        setError("Camera stream start failed. Please allow camera permission and retry.");
      }
    };

    attachStream();
  }, [isCameraOn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Auto-start/stop strictly based on parent interview state
  useEffect(() => {
    if (isActive && !isCameraOn) {
      startCamera();
    }
    
    // Stop when interview ends
    if (!isActive && (isCameraOn || isAnalyzing)) {
      stopCamera();
    }
  }, [isActive, isCameraOn, isAnalyzing]);

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  // Get stress color (inverse)
  const getStressColor = (stress: number) => {
    if (stress <= 30) return "text-emerald-400";
    if (stress <= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className={`w-5 h-5 ${wsConnected ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span className="text-white font-semibold text-sm">AI Video Analysis</span>
          {wsConnected && (
            <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              Live
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!isCameraOn ? (
            <span className="text-xs text-slate-400">Waiting for interview start...</span>
          ) : (
            <>
              <button
                onClick={stopAnalysis}
                className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-lg transition-colors"
              >
                <CameraOff size={14} />
                Stop
              </button>
              <button
                onClick={stopCamera}
                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Video Display */}
      <div className={`relative bg-slate-900 transition-all duration-300 ${
        isCameraOn 
          ? 'aspect-video' 
          : isCompact 
            ? 'h-[100px]' 
            : 'aspect-video'
      }`}>
        {isCameraOn ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* Overlay with annotated frame if available */}
            {annotatedFrame && isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <img 
                  src={`data:image/jpeg;base64,${annotatedFrame}`} 
                  alt="Analysis"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            
            {/* Analysis indicator */}
            {isAnalyzing && (
              <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white text-xs">Analyzing...</span>
              </div>
            )}
            
            {/* Face detection indicator */}
            {isAnalyzing && !metrics.face_detected && (
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-amber-500/80 px-3 py-1.5 rounded-full">
                <AlertTriangle size={12} className="text-white" />
                <span className="text-white text-xs">No face detected</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 p-4">
            <CameraOff size={32} className="mb-1 opacity-50" />
            <p className="text-xs">Camera Feed Idle (Waiting for start)</p>
          </div>
        )}
        
        {/* Hidden canvas for frame processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Metrics Display */}
      {isCameraOn && (
        <div className="p-4 grid grid-cols-2 gap-3">
          {/* Confidence */}
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <TrendingUp size={12} />
                Confidence
              </span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(metrics.confidence)}`}>
              {metrics.confidence.toFixed(0)}%
            </div>
            <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  metrics.confidence >= 70 ? 'bg-emerald-500' : 
                  metrics.confidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${metrics.confidence}%` }}
              />
            </div>
          </div>

          {/* Eye Contact */}
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <Eye size={12} />
                Eye Contact
              </span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(metrics.eye_contact)}`}>
              {metrics.eye_contact.toFixed(0)}%
            </div>
            <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  metrics.eye_contact >= 70 ? 'bg-emerald-500' : 
                  metrics.eye_contact >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${metrics.eye_contact}%` }}
              />
            </div>
          </div>

          {/* Posture */}
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <Activity size={12} />
                Posture
              </span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(metrics.posture)}`}>
              {metrics.posture.toFixed(0)}%
            </div>
            <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  metrics.posture >= 70 ? 'bg-emerald-500' : 
                  metrics.posture >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${metrics.posture}%` }}
              />
            </div>
          </div>

          {/* Smile */}
          <div className="bg-slate-900/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <Smile size={12} />
                Smile
              </span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(metrics.smile)}`}>
              {metrics.smile.toFixed(0)}%
            </div>
            <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  metrics.smile >= 70 ? 'bg-emerald-500' : 
                  metrics.smile >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${metrics.smile}%` }}
              />
            </div>
          </div>

          {/* Stress Level */}
          <div className="bg-slate-900/50 rounded-lg p-3 col-span-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <AlertTriangle size={12} />
                Stress Level
              </span>
            </div>
            <div className={`text-2xl font-bold ${getStressColor(metrics.stress_level)}`}>
              {metrics.stress_level.toFixed(0)}%
            </div>
            <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  metrics.stress_level <= 30 ? 'bg-emerald-500' : 
                  metrics.stress_level <= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${metrics.stress_level}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {isCameraOn && isAnalyzing && metrics.alerts && metrics.alerts.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <AlertTriangle size={14} />
              <span className="text-xs font-semibold">Alerts</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {metrics.alerts.map((alert, idx) => (
                <span 
                  key={idx} 
                  className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded"
                >
                  {alert.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="px-4 pb-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoAnalysisPanel;
