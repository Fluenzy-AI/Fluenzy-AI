'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Camera, Mic, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useMediaCapture } from '@/hooks/useMediaCapture';
import { connectHireLensSocket } from '@/lib/hirelens-ws';


// ─── Minimal Mobile Capture Screen ───────────────────────────────────────────
// This is the ONLY screen the HR rep interacts with on the phone — open it,
// frame the candidate, tap Start, then prop the phone up and ignore it.
// No candidate info, no multi-step wizard — all that happened on the laptop.

export default function CapturePage() {
  const { pairingCode } = useParams<{ pairingCode: string }>();
  const sessionId = useSearchParams().get('sessionId') ?? '';

  const { stream, permissionStatus, isCameraReady, isMicReady, error, requestPermissions } =
    useMediaCapture();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isCapturingRef = useRef(false);
  const recognitionRef = useRef<any>(null);

  // Request camera/mic as soon as the page loads
  useEffect(() => {
    requestPermissions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach stream to video element
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Setup speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';
      
      rec.onresult = (event: any) => {
        const resultIndex = event.resultIndex;
        const transcriptText = event.results[resultIndex][0].transcript.trim();
        
        console.log('[SpeechRecognition] Final transcript:', transcriptText);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'audio',
            transcript: transcriptText,
            is_speaking: false
          }));
        }
      };
      
      rec.onstart = () => {
        console.log('[SpeechRecognition] Started');
      };
      
      rec.onend = () => {
        console.log('[SpeechRecognition] Ended');
        if (isCapturingRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error('Failed to restart SpeechRecognition:', e);
          }
        }
      };
      
      rec.onerror = (e: any) => {
        console.error('[SpeechRecognition] Error:', e);
      };
      
      recognitionRef.current = rec;
    }
  }, []);

  // Handle frame sending and speech recognition on capture start
  useEffect(() => {
    isCapturingRef.current = isCapturing;
    if (isCapturing) {
      const ws = connectHireLensSocket(sessionId);
      wsRef.current = ws;

      let frameCounter = 0;
      let frameInterval: NodeJS.Timeout;
      let pingInterval: NodeJS.Timeout;

      ws.onopen = () => {
        console.log('[CapturePage] WebSocket opened');
        
        // Start SpeechRecognition
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error('Failed to start SpeechRecognition:', e);
          }
        }

        // Frame sending interval (~3fps)
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');

        frameInterval = setInterval(() => {
          if (videoRef.current && ws.readyState === WebSocket.OPEN && ctx) {
            try {
              ctx.drawImage(videoRef.current, 0, 0, 320, 240);
              const base64 = canvas.toDataURL('image/jpeg', 0.6);
              frameCounter++;
              ws.send(JSON.stringify({
                type: 'frame',
                image: base64,
                frame_id: frameCounter,
                timestamp: Date.now()
              }));
            } catch (err) {
              console.error('[CapturePage] Frame capture/send error:', err);
            }
          }
        }, 333);

        // Ping interval (every 10 seconds)
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 10000);
      };

      ws.onclose = () => {
        console.log('[CapturePage] WebSocket closed');
        clearInterval(frameInterval);
        clearInterval(pingInterval);
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        }
      };

      ws.onerror = (e) => {
        console.error('[CapturePage] WebSocket error:', e);
      };

      return () => {
        clearInterval(frameInterval);
        clearInterval(pingInterval);
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        }
        ws.close();
        wsRef.current = null;
      };
    }
  }, [isCapturing, sessionId]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartCapture = () => {
    if (permissionStatus !== 'granted') return;

    setIsCapturing(true);
    const startedAt = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── ACTIVE CAPTURE SCREEN ─────────────────────────────────────────────────
  // This is what faces the candidate. Minimal, non-distracting.
  // Full-screen camera + only a small recording indicator at bottom.
  if (isCapturing) {
    return (
      <div className="fixed inset-0 bg-black">
        {/* Full-bleed camera feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Semi-transparent overlay — minimal, top only */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent" />

        {/* Recording indicator — top left */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-xs font-semibold font-mono">{formatTime(elapsedSeconds)}</span>
        </div>

        {/* Session info — top right */}
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <span className="text-white/60 text-[10px] font-mono">{pairingCode}</span>
        </div>

        {/* Bottom status bar — very minimal */}
        <div className="absolute inset-x-0 bottom-0 pb-safe">
          <div className="flex items-center justify-center pb-8">
            <div className="flex items-center gap-2.5 bg-black/60 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-white/70 text-xs">Recording · Dashboard live on HR laptop</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── SETUP SCREEN (before capture starts) ──────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-indigo-500/20 flex items-center justify-center">
            <Camera className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="text-white text-sm font-semibold">HireLens Capture</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Permission status pills */}
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${isCameraReady ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
            <Camera className="w-2.5 h-2.5" />
            {isCameraReady ? 'Cam ✓' : 'Cam'}
          </div>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${isMicReady ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
            <Mic className="w-2.5 h-2.5" />
            {isMicReady ? 'Mic ✓' : 'Mic'}
          </div>
        </div>
      </div>

      {/* Camera viewfinder */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 space-y-5">

        {/* Video preview */}
        <div className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/80 aspect-[3/4] shadow-xl shadow-black/40">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Face alignment guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              <div className="w-32 h-44 border-2 border-indigo-400/60 rounded-xl" />
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-indigo-400 rounded-tl-sm" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-indigo-400 rounded-tr-sm" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-indigo-400 rounded-bl-sm" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-indigo-400 rounded-br-sm" />
            </div>
          </div>

          {/* Permission requesting overlay */}
          <AnimatePresence>
            {permissionStatus === 'requesting' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center gap-3"
              >
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-300 text-sm">Allow camera access…</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status watermark */}
          {permissionStatus === 'granted' && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              LIVE PREVIEW
            </div>
          )}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-xs leading-relaxed">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Positioning tip */}
        <div className="w-full max-w-sm flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-300/80 text-xs leading-relaxed">
            Position the candidate&apos;s face in the frame, then <strong className="text-amber-200">prop this phone up</strong> facing them at eye level.
            Tap Start, then leave the phone in place — you won&apos;t need to touch it again.
          </p>
        </div>

        {/* Start button */}
        <div className="w-full max-w-sm space-y-3">
          {permissionStatus !== 'granted' ? (
            <button
              onClick={() => requestPermissions()}
              disabled={permissionStatus === 'requesting'}
              className="w-full py-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              Allow Camera & Microphone
            </button>
          ) : (
            <button
              onClick={handleStartCapture}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98]"
            >
              <Play className="w-5 h-5" />
              Start Capture
            </button>
          )}

          <p className="text-center text-slate-600 text-xs">
            Session: <span className="font-mono">{sessionId.slice(0, 20)}…</span>
          </p>
        </div>
      </div>
    </div>
  );
}
