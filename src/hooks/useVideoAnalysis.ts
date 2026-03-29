"use client";

import { useRef, useEffect, useCallback, useState } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "wss://techsevaweb.onrender.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://techsevaweb.onrender.com";

export interface VideoMetrics {
  confidence: number;
  eyeContact: number;
  posture: number;
  smile: number;
  stressLevel: number;
  engagement: number;
  stressControl: number;
  focus: number;
  faceDetection: number;
  expressionAnalysis: number;
}

export interface VideoAnalysisState {
  metrics: VideoMetrics;
  isConnected: boolean;
  isAnalyzing: boolean;
  sessionId: string | null;
  metricsHistory: Array<VideoMetrics & { timestamp: number }>;
  error: string | null;
}

const initialMetrics: VideoMetrics = {
  confidence: 0,
  eyeContact: 0,
  posture: 0,
  smile: 0,
  stressLevel: 0,
  engagement: 0,
  stressControl: 0,
  focus: 0,
  faceDetection: 0,
  expressionAnalysis: 0,
};

export function useVideoAnalysis(autoStart = false) {
  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clientId = useRef<string>(generateUUID());
  const sessionId = useRef<string>(generateUUID());
  const isAnalyzingRef = useRef<boolean>(false);

  const [state, setState] = useState<VideoAnalysisState>({
    metrics: initialMetrics,
    isConnected: false,
    isAnalyzing: false,
    sessionId: sessionId.current,
    metricsHistory: [],
    error: null,
  });

  // Generate a simple UUID
  function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Clean up any existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const ws = new WebSocket(`${WS_URL}/ws/${clientId.current}`);

      ws.onopen = () => {
        console.log("[VideoAnalysis] WebSocket connected");
        setState(prev => ({ ...prev, isConnected: true, error: null }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Map server response to our metrics format
          const metrics: VideoMetrics = {
            confidence: Math.round(data.confidence ?? 0),
            eyeContact: Math.round(data.eye_contact ?? 0),
            posture: Math.round(data.posture ?? 0),
            smile: Math.round(data.smile ?? 0),
            stressLevel: Math.round(data.stress_level ?? 0),
            engagement: Math.round(data.engagement ?? 0),
            stressControl: Math.round(data.stress_control ?? 0),
            focus: Math.round(data.focus ?? 0),
            faceDetection: Math.round(data.face_detection ?? 0),
            expressionAnalysis: Math.round(data.expression_analysis ?? 0),
          };

          setState(prev => ({
            ...prev,
            metrics,
            metricsHistory: [
              ...prev.metricsHistory.slice(-300), // Keep last 5 min at 1fps
              { ...metrics, timestamp: Date.now() },
            ],
          }));
        } catch (err) {
          console.error("[VideoAnalysis] Failed to parse message:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("[VideoAnalysis] WebSocket error:", error);
        setState(prev => ({ 
          ...prev, 
          error: "Video analysis connection failed",
          isConnected: false 
        }));
      };

      ws.onclose = () => {
        console.log("[VideoAnalysis] WebSocket closed");
        setState(prev => ({ ...prev, isConnected: false }));
        
        // Reconnect if still analyzing
        if (isAnalyzingRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("[VideoAnalysis] Attempting reconnect...");
            connectWebSocket();
          }, 3000);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("[VideoAnalysis] Failed to create WebSocket:", err);
      setState(prev => ({ 
        ...prev, 
        error: "Failed to connect to video analysis server",
        isConnected: false 
      }));
    }
  }, []);

  const startCamera = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      return true;
    } catch (err: any) {
      console.error("[VideoAnalysis] Camera access error:", err);
      setState(prev => ({ 
        ...prev, 
        error: err.name === "NotAllowedError" 
          ? "Camera access denied" 
          : "Failed to access camera" 
      }));
      return false;
    }
  }, []);

  const sendFrame = useCallback(() => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      wsRef.current?.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Downsample for bandwidth efficiency
    canvasRef.current.width = 320;
    canvasRef.current.height = 240;
    ctx.drawImage(videoRef.current, 0, 0, 320, 240);

    const base64 = canvasRef.current.toDataURL("image/jpeg", 0.7);
    const base64Data = base64.split(",")[1]; // Remove data:image/jpeg;base64, prefix

    if (base64Data && wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: "frame",
        data: base64Data,
        sessionId: sessionId.current,
        timestamp: Date.now(),
      }));
    }
  }, []);

  const startAnalysis = useCallback(async () => {
    // Connect WebSocket first
    connectWebSocket();
    
    // Start camera
    const cameraStarted = await startCamera();
    if (!cameraStarted) return;

    isAnalyzingRef.current = true;
    setState(prev => ({ ...prev, isAnalyzing: true }));

    // Send frame every 1 second (1fps is sufficient for behavioral analysis)
    frameIntervalRef.current = setInterval(sendFrame, 1000);
  }, [connectWebSocket, startCamera, sendFrame]);

  const stopAnalysis = useCallback(async (): Promise<{
    averageMetrics: VideoMetrics;
    metricsHistory: Array<VideoMetrics & { timestamp: number }>;
    sessionId: string;
  } | null> => {
    isAnalyzingRef.current = false;

    // Stop frame sending
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Calculate average metrics from history
    const history = state.metricsHistory;
    if (history.length === 0) {
      setState(prev => ({ ...prev, isAnalyzing: false }));
      return null;
    }

    const averageMetrics: VideoMetrics = {
      confidence: Math.round(history.reduce((sum, m) => sum + m.confidence, 0) / history.length),
      eyeContact: Math.round(history.reduce((sum, m) => sum + m.eyeContact, 0) / history.length),
      posture: Math.round(history.reduce((sum, m) => sum + m.posture, 0) / history.length),
      smile: Math.round(history.reduce((sum, m) => sum + m.smile, 0) / history.length),
      stressLevel: Math.round(history.reduce((sum, m) => sum + m.stressLevel, 0) / history.length),
      engagement: Math.round(history.reduce((sum, m) => sum + m.engagement, 0) / history.length),
      stressControl: Math.round(history.reduce((sum, m) => sum + m.stressControl, 0) / history.length),
      focus: Math.round(history.reduce((sum, m) => sum + m.focus, 0) / history.length),
      faceDetection: Math.round(history.reduce((sum, m) => sum + m.faceDetection, 0) / history.length),
      expressionAnalysis: Math.round(history.reduce((sum, m) => sum + m.expressionAnalysis, 0) / history.length),
    };

    setState(prev => ({ ...prev, isAnalyzing: false }));

    // Try to fetch final analytics from server
    try {
      const res = await fetch(`${API_URL}/analytics/${sessionId.current}`);
      if (res.ok) {
        const serverData = await res.json();
        console.log("[VideoAnalysis] Server analytics:", serverData);
      }
    } catch (err) {
      console.log("[VideoAnalysis] Could not fetch server analytics:", err);
    }

    return {
      averageMetrics,
      metricsHistory: history,
      sessionId: sessionId.current,
    };
  }, [state.metricsHistory]);

  // Reset metrics history
  const resetMetrics = useCallback(() => {
    setState(prev => ({
      ...prev,
      metrics: initialMetrics,
      metricsHistory: [],
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    if (autoStart) {
      startAnalysis();
    }

    return () => {
      isAnalyzingRef.current = false;
      
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [autoStart, startAnalysis]);

  return {
    videoRef,
    canvasRef,
    state,
    startAnalysis,
    stopAnalysis,
    resetMetrics,
    metrics: state.metrics,
    isConnected: state.isConnected,
    isAnalyzing: state.isAnalyzing,
    sessionId: sessionId.current,
    metricsHistory: state.metricsHistory,
    error: state.error,
  };
}

// Calculate overall behavioral score from metrics
export function calculateBehavioralScore(metrics: VideoMetrics): number {
  // Weighted average formula:
  // confidence(20%) + eyeContact(15%) + posture(10%) + smile(5%) +
  // engagement(15%) + (100 - stressLevel)(10%) + stressControl(10%) +
  // focus(10%) + expressionAnalysis(5%)
  const score = (
    metrics.confidence * 0.20 +
    metrics.eyeContact * 0.15 +
    metrics.posture * 0.10 +
    metrics.smile * 0.05 +
    metrics.engagement * 0.15 +
    (100 - metrics.stressLevel) * 0.10 + // Invert stress
    metrics.stressControl * 0.10 +
    metrics.focus * 0.10 +
    metrics.expressionAnalysis * 0.05
  );
  return Math.round(Math.max(0, Math.min(100, score)));
}

// Get color for metric value
export function getMetricColor(value: number, isStress = false): string {
  if (isStress) {
    // For stress: lower is BETTER
    if (value <= 30) return "text-green-400";
    if (value <= 60) return "text-yellow-400";
    return "text-red-400";
  }
  // For all other metrics: higher is BETTER
  if (value >= 80) return "text-green-400";
  if (value >= 50) return "text-yellow-400";
  return "text-red-400";
}

// Get label for metric value
export function getMetricLabel(value: number, isStress = false): string {
  if (isStress) {
    if (value <= 30) return "Excellent";
    if (value <= 60) return "Moderate";
    return "Critical";
  }
  if (value >= 80) return "Excellent";
  if (value >= 60) return "Good";
  if (value >= 40) return "Fair";
  return "Needs Work";
}

// Get background color class for metric
export function getMetricBgColor(value: number, isStress = false): string {
  if (isStress) {
    if (value <= 30) return "bg-green-500";
    if (value <= 60) return "bg-yellow-500";
    return "bg-red-500";
  }
  if (value >= 80) return "bg-green-500";
  if (value >= 50) return "bg-yellow-500";
  return "bg-red-500";
}
