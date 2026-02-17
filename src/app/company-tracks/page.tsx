"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import HeaderOffset from "@/components/HeaderOffset";
import {
  Activity,
  AlertTriangle,
  Camera,
  CameraOff,
  Download,
  History,
  Play,
  Pause,
  RefreshCw,
  Settings,
  TrendingUp,
  Users,
  Smartphone,
  Car,
  Clock,
  FileText,
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Types
interface Detection {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: number[];
}

interface FrameAnalysis {
  frame_id: string;
  timestamp: number;
  detections: Detection[];
  total_objects: number;
  person_count: number;
  phone_count: number;
  vehicle_count: number;
  alerts: string[];
  processing_time_ms: number;
  annotated_frame?: string;
}

interface AlertEvent {
  id: string;
  type: string;
  message: string;
  timestamp: number;
  personCount: number;
  phoneCount: number;
}

interface AnalyticsSession {
  sessionId: string;
  startTime: number;
  totalFrames: number;
  totalDetections: number;
  peakPersonCount: number;
  peakPhoneCount: number;
  alerts: AlertEvent[];
  detectionHistory: Array<{
    timestamp: number;
    person_count: number;
    phone_count: number;
    vehicle_count: number;
    total_objects: number;
  }>;
}

// WebSocket URL - configurable for different environments
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function CompanyTracksPage() {
  // Video state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const processingRef = useRef<boolean>(false);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // UI state
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Detection state
  const [currentDetection, setCurrentDetection] = useState<FrameAnalysis | null>(null);
  const [detectionHistory, setDetectionHistory] = useState<AnalyticsSession["detectionHistory"]>([]);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [sessionStats, setSessionStats] = useState({
    totalFrames: 0,
    totalDetections: 0,
    peakPersonCount: 0,
    peakPhoneCount: 0,
    sessionDuration: 0,
    avgConfidence: 0,
  });

  // Session management
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [sessionStartTime] = useState(() => Date.now());

  // Refs for stats calculation
  const totalDetectionsRef = useRef(0);
  const confidenceSumRef = useRef(0);
  const confidenceCountRef = useRef(0);

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = `${WS_URL}/ws/${sessionId}`;
    console.log("Connecting to WebSocket:", wsUrl);

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setConnectionError(null);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionError("Connection error. Please check if the backend is running.");
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      setConnectionError("Failed to connect. Please ensure the backend server is running.");
    }
  }, [sessionId]);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((message: { type: string; data?: any; session_id?: string; message?: string }) => {
    if (message.type === "connected") {
      console.log("Session connected:", message.session_id);
      return;
    }

    if (message.type === "detection_result" && message.data) {
      const data = message.data;
      const analysis: FrameAnalysis = {
        frame_id: data.frame_id,
        timestamp: data.timestamp,
        detections: data.detections || [],
        total_objects: data.total_objects || 0,
        person_count: data.person_count || 0,
        phone_count: data.phone_count || 0,
        vehicle_count: data.vehicle_count || 0,
        alerts: data.alerts || [],
        processing_time_ms: data.processing_time_ms || 0,
        annotated_frame: data.annotated_frame,
      };

      setCurrentDetection(analysis);

      // Update detection history for charts
      setDetectionHistory((prev) => {
        const newHistory = [
          ...prev,
          {
            timestamp: analysis.timestamp,
            person_count: analysis.person_count,
            phone_count: analysis.phone_count,
            vehicle_count: analysis.vehicle_count,
            total_objects: analysis.total_objects,
          },
        ].slice(-100); // Keep last 100 entries
        return newHistory;
      });

      // Update stats
      totalDetectionsRef.current += analysis.total_objects;
      analysis.detections.forEach((d) => {
        confidenceSumRef.current += d.confidence;
        confidenceCountRef.current += 1;
      });

      setSessionStats((prev) => ({
        totalFrames: prev.totalFrames + 1,
        totalDetections: totalDetectionsRef.current,
        peakPersonCount: Math.max(prev.peakPersonCount, analysis.person_count),
        peakPhoneCount: Math.max(prev.peakPhoneCount, analysis.phone_count),
        sessionDuration: Math.floor((Date.now() - sessionStartTime) / 1000),
        avgConfidence:
          confidenceCountRef.current > 0
            ? (confidenceSumRef.current / confidenceCountRef.current) * 100
            : 0,
      }));

      // Generate alerts
      if (analysis.alerts && analysis.alerts.length > 0) {
        const newAlerts: AlertEvent[] = analysis.alerts.map((alertType: string) => {
          // Play alert sound for important alerts
          if (alertType === "PHONE_DETECTED" || alertType === "MULTIPLE_PERSONS") {
            playAlertSound();
          }
          return {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: alertType,
            message: getAlertMessage(alertType),
            timestamp: Date.now(),
            personCount: analysis.person_count,
            phoneCount: analysis.phone_count,
          };
        });

        setAlerts((prev) => [...newAlerts, ...prev].slice(0, 50)); // Keep last 50 alerts
      }

      // Draw detections on canvas
      if (canvasRef.current && analysis.detections.length > 0) {
        drawDetections(analysis);
      }
    }
  }, [sessionStartTime]);

  // Get alert message
  const getAlertMessage = (alertType: string): string => {
    const messages: Record<string, string> = {
      PHONE_DETECTED: "Phone detected in restricted zone",
      NO_FACE: "No face detected",
      MULTIPLE_PERSONS: "Multiple persons detected in frame",
      SUSPICIOUS_MOVEMENT: "Suspicious movement detected",
      PHONE_USAGE: "Phone usage detected",
      NO_PERSON: "No person detected in frame",
      HIGH_CONFIDENCE: "High confidence detection recorded",
    };
    return messages[alertType] || alertType;
  };

  // Play alert sound
  const playAlertSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      // Audio not supported
    }
  };

  // Draw detections on canvas
  const drawDetections = (analysis: FrameAnalysis) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw detections
    analysis.detections.forEach((det) => {
      const [x1, y1, x2, y2] = det.bbox;
      const scaleX = canvas.width / (video.videoWidth || 640);
      const scaleY = canvas.height / (video.videoHeight || 480);

      // Choose color based on class
      let color = "#FFFF00"; // Yellow
      if (det.class_name === "person") color = "#00FF00"; // Green
      else if (det.class_name === "cell phone") color = "#FF00FF"; // Magenta
      else if (["car", "truck", "bus"].includes(det.class_name)) color = "#00FFFF"; // Cyan

      // Draw rectangle
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x1 * scaleX, y1 * scaleY, (x2 - x1) * scaleX, (y2 - y1) * scaleY);

      // Draw label
      const label = `${det.class_name}: ${(det.confidence * 100).toFixed(1)}%`;
      ctx.fillStyle = color;
      ctx.font = "bold 16px Arial";
      ctx.fillText(label, x1 * scaleX, y1 * scaleY - 5);
    });
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsStreaming(true);
      connectWebSocket();
      startFrameProcessing();
    } catch (error) {
      console.error("Error accessing camera:", error);
      setConnectionError("Failed to access camera. Please check camera permissions.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    setIsStreaming(false);
    setIsPaused(false);
  };

  // Start frame processing
  const startFrameProcessing = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }

    // Process frames at ~10 FPS for real-time detection
    frameIntervalRef.current = setInterval(async () => {
      if (!isStreaming || isPaused || !videoRef.current || !wsRef.current || processingRef.current) {
        return;
      }

      const video = videoRef.current;
      if (video.readyState !== 4) return;

      processingRef.current = true;

      try {
        // Create canvas to capture frame
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        const imageData = canvas.toDataURL("image/jpeg", 0.8);

        // Send via WebSocket
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "frame",
              image: imageData,
            })
          );
        }
      } catch (error) {
        console.error("Error processing frame:", error);
      } finally {
        processingRef.current = false;
      }
    }, 100); // 100ms = 10 FPS
  };

  // Toggle pause
  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Export analytics as CSV
  const exportCSV = () => {
    if (detectionHistory.length === 0) return;

    const headers = ["Timestamp", "Person Count", "Phone Count", "Vehicle Count", "Total Objects"];
    const rows = detectionHistory.map((d) => [
      new Date(d.timestamp).toISOString(),
      d.person_count,
      d.phone_count,
      d.vehicle_count,
      d.total_objects,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `company-tracks-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // Clear session
  const clearSession = () => {
    setDetectionHistory([]);
    setAlerts([]);
    setCurrentDetection(null);
    setSessionStats({
      totalFrames: 0,
      totalDetections: 0,
      peakPersonCount: 0,
      peakPhoneCount: 0,
      sessionDuration: 0,
      avgConfidence: 0,
    });
    totalDetectionsRef.current = 0;
    confidenceSumRef.current = 0;
    confidenceCountRef.current = 0;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Update session duration
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      setSessionStats((prev) => ({
        ...prev,
        sessionDuration: Math.floor((Date.now() - sessionStartTime) / 1000),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isStreaming, sessionStartTime]);

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <HeaderOffset />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Camera className="w-8 h-8 text-cyan-400" />
              Company Tracks
              <span className="text-sm font-normal text-slate-400 ml-2">Real-time Video Analysis</span>
            </h1>
            <p className="text-slate-400 mt-1">
              AI-powered monitoring with YOLOv8 object detection
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <Badge
              variant={isConnected ? "default" : "destructive"}
              className={`flex items-center gap-1.5 px-3 py-1.5 ${
                isConnected ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-red-500/20 text-red-400 border-red-500/50"
              }`}
            >
              {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>

            {/* Control Buttons */}
            {!isStreaming ? (
              <Button onClick={startCamera} className="bg-cyan-600 hover:bg-cyan-700">
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={togglePause} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button onClick={stopCamera} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  <CameraOff className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {connectionError && (
          <Card className="mb-6 bg-red-500/10 border-red-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <p>{connectionError}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConnectionError(null)}
                  className="ml-auto text-red-400 hover:text-red-300"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Preview Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Container */}
            <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
              <CardHeader className="pb-2 border-b border-slate-700">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Eye className="w-5 h-5 text-cyan-400" />
                    Live Video Feed
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowOverlay(!showOverlay)}
                      className="text-slate-400 hover:text-white"
                    >
                      {showOverlay ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFullscreen}
                      className="text-slate-400 hover:text-white"
                    >
                      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className={`relative ${isFullscreen ? "fixed inset-0 z-50 bg-slate-900 p-4" : ""}`}>
                  {/* Video Element */}
                  <video
                    ref={videoRef}
                    className={`w-full ${isFullscreen ? "max-h-[calc(100vh-100px)]" : "h-[400px]"} object-cover bg-black`}
                    playsInline
                    muted
                    style={{ display: isStreaming ? "block" : "none" }}
                  />

                  {/* Canvas Overlay */}
                  <canvas
                    ref={canvasRef}
                    className={`absolute top-0 left-0 w-full h-full pointer-events-none ${
                      showOverlay && currentDetection?.detections?.length ? "block" : "hidden"
                    }`}
                    style={{ objectFit: "cover" }}
                  />

                  {/* Placeholder when not streaming */}
                  {!isStreaming && (
                    <div className="w-full h-[400px] bg-slate-900 flex flex-col items-center justify-center text-slate-500">
                      <CameraOff className="w-16 h-16 mb-4 opacity-50" />
                      <p className="text-lg">Camera not active</p>
                      <p className="text-sm mt-2">Click "Start Camera" to begin monitoring</p>
                    </div>
                  )}

                  {/* Stats overlay */}
                  {isStreaming && currentDetection && (
                    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-green-400" />
                          <span>{currentDetection.person_count}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4 text-magenta-400" />
                          <span>{currentDetection.phone_count}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Car className="w-4 h-4 text-cyan-400" />
                          <span>{currentDetection.vehicle_count}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Processing indicator */}
                  {isStreaming && (
                    <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-white text-xs">
                        {isPaused ? "Paused" : `Processing: ${currentDetection?.processing_time_ms?.toFixed(1) || 0}ms`}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Detection History Chart */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  Detection History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={detectionHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                        stroke="#94a3b8"
                        fontSize={10}
                      />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                        labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="person_count"
                        name="Persons"
                        stroke="#22c55e"
                        fill="#22c55e"
                        fillOpacity={0.2}
                      />
                      <Area
                        type="monotone"
                        dataKey="phone_count"
                        name="Phones"
                        stroke="#d946ef"
                        fill="#d946ef"
                        fillOpacity={0.2}
                      />
                      <Area
                        type="monotone"
                        dataKey="vehicle_count"
                        name="Vehicles"
                        stroke="#06b6d4"
                        fill="#06b6d4"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Dashboard */}
          <div className="space-y-6">
            {/* Session Stats */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Session Stats
                  </span>
                  <Badge variant="outline" className="border-slate-600 text-slate-400">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDuration(sessionStats.sessionDuration)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-white">{sessionStats.totalFrames}</p>
                    <p className="text-xs text-slate-400">Total Frames</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-white">{sessionStats.totalDetections}</p>
                    <p className="text-xs text-slate-400">Detections</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">{sessionStats.peakPersonCount}</p>
                    <p className="text-xs text-slate-400">Peak Persons</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-magenta-400">{sessionStats.peakPhoneCount}</p>
                    <p className="text-xs text-slate-400">Peak Phones</p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-700/30 rounded-lg p-3">
                  <span className="text-slate-400 text-sm">Avg. Confidence</span>
                  <span className="text-white font-semibold">{sessionStats.avgConfidence.toFixed(1)}%</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={exportCSV}
                    disabled={detectionHistory.length === 0}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export CSV
                  </Button>
                  <Button
                    onClick={clearSession}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Alerts */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Alert History
                  <Badge variant="secondary" className="ml-auto">
                    {alerts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[300px] overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">No alerts yet</p>
                ) : (
                  <div className="space-y-2">
                    {alerts.slice(0, 20).map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-lg border ${
                          alert.type === "PHONE_DETECTED"
                            ? "bg-red-500/10 border-red-500/30"
                            : alert.type === "MULTIPLE_PERSONS"
                            ? "bg-amber-500/10 border-amber-500/30"
                            : "bg-slate-700/30 border-slate-600"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${
                            alert.type === "PHONE_DETECTED"
                              ? "text-red-400"
                              : alert.type === "MULTIPLE_PERSONS"
                              ? "text-amber-400"
                              : "text-slate-300"
                          }`}>
                            {alert.message}
                          </p>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {alert.personCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Smartphone className="w-3 h-3" />
                            {alert.phoneCount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detection Classes */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  Detection Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { name: "Person", color: "bg-green-500", count: currentDetection?.detections?.filter((d) => d.class_name === "person").length || 0 },
                    { name: "Cell Phone", color: "bg-magenta-500", count: currentDetection?.detections?.filter((d) => d.class_name === "cell phone").length || 0 },
                    { name: "Vehicle", color: "bg-cyan-500", count: currentDetection?.detections?.filter((d) => ["car", "truck", "bus"].includes(d.class_name)).length || 0 },
                    { name: "Laptop", color: "bg-blue-500", count: currentDetection?.detections?.filter((d) => d.class_name === "laptop").length || 0 },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-sm text-slate-300">{item.name}</span>
                      </div>
                      <Badge variant="secondary" className="bg-slate-700">
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Detections List */}
            {currentDetection && currentDetection.detections.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-cyan-400" />
                    Current Detections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {currentDetection.detections.map((det, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-700/30 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm text-slate-300 capitalize">{det.class_name}</span>
                        <span className="text-sm font-medium text-cyan-400">
                          {(det.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Confidence Score Chart */}
        <Card className="mt-6 bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Live Confidence Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={detectionHistory.slice(-30)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    stroke="#94a3b8"
                    fontSize={10}
                  />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                    labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="total_objects"
                    name="Total Objects"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fullscreen exit button */}
      {isFullscreen && (
        <Button
          onClick={toggleFullscreen}
          className="fixed top-4 right-4 z-50 bg-slate-800/80 hover:bg-slate-700"
        >
          <Minimize2 className="w-4 h-4 mr-2" />
          Exit Fullscreen
        </Button>
      )}
    </div>
  );
}
