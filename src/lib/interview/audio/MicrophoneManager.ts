// ─── FluenzyAI — MicrophoneManager ───────────────────────────────────────────
// Owns the complete microphone capture lifecycle:
//   getUserMedia → AudioContext (16kHz) → ScriptProcessor (legacy fallback)
//   → PCM encoding → callback
//
// MIGRATION PATH:
//   Phase 1 (current): ScriptProcessor (deprecated but universally supported)
//   Phase 2 (planned): AudioWorkletNode when AudioWorklet support is confirmed
//
// Responsibilities:
//   • Request microphone permission exactly once
//   • Encode PCM frames as base64 for Gemini Live sendRealtimeInput
//   • Compute RMS level for VAD
//   • Own the MediaStream and AudioContext lifecycle
//   • Be safely callable multiple times (start/stop/start)
//
// IMPORTANT: Does NOT contain VAD logic. The VAD decision (activityStart /
//   activityEnd) is made by the caller (GeminiSessionManager / VoiceAgent)
//   using the RMS values emitted by this class.

export interface MicFrame {
  /** base64-encoded PCM Int16 audio at 16kHz mono */
  base64Pcm: string;
  /** RMS energy level 0..1 for VAD (averaged over frame) */
  rmsLevel: number;
  /** AudioContext timestamp when frame was captured */
  timestamp: number;
}

export type MicFrameCallback = (frame: MicFrame) => void;

export type MicState = 'IDLE' | 'STARTING' | 'ACTIVE' | 'STOPPING' | 'STOPPED' | 'ERROR';

export interface MicrophoneManagerOptions {
  /** PCM sample rate sent to Gemini. Default: 16000 */
  sampleRate?: number;
  /** ScriptProcessor buffer size. Default: 4096 */
  bufferSize?: number;
  /** Callback invoked for every captured audio frame */
  onFrame: MicFrameCallback;
  /** Called when mic state changes */
  onStateChange?: (state: MicState) => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

export class MicrophoneManager {
  private _state: MicState = 'IDLE';
  private _audioCtx: AudioContext | null = null;
  private _stream: MediaStream | null = null;
  private _sourceNode: MediaStreamAudioSourceNode | null = null;
  private _processorNode: ScriptProcessorNode | null = null;
  private _opts: MicrophoneManagerOptions;

  constructor(opts: MicrophoneManagerOptions) {
    this._opts = opts;
  }

  get state(): MicState { return this._state; }
  get isActive(): boolean { return this._state === 'ACTIVE'; }
  get audioContext(): AudioContext | null { return this._audioCtx; }

  private _setState(next: MicState): void {
    this._state = next;
    this._opts.onStateChange?.(next);
  }

  // ── Start ─────────────────────────────────────────────────────────────────
  async start(): Promise<void> {
    if (this._state === 'ACTIVE' || this._state === 'STARTING') {
      console.warn('[MicrophoneManager] start() called while already active/starting — ignoring');
      return;
    }

    this._setState('STARTING');

    try {
      // Request microphone with audio quality constraints
      this._stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl:  true,
          sampleRate: this._opts.sampleRate ?? 16000,
        },
      });

      const sr = this._opts.sampleRate ?? 16000;
      this._audioCtx = new AudioContext({ sampleRate: sr });
      await this._audioCtx.resume();

      this._sourceNode = this._audioCtx.createMediaStreamSource(this._stream);

      // ScriptProcessor (deprecated but universally supported — AudioWorklet migration in Phase 2)
      const bufSize = this._opts.bufferSize ?? 4096;
      this._processorNode = this._audioCtx.createScriptProcessor(bufSize, 1, 1);
      this._processorNode.onaudioprocess = this._onAudioProcess.bind(this);

      this._sourceNode.connect(this._processorNode);
      this._processorNode.connect(this._audioCtx.destination);

      this._setState('ACTIVE');
      console.log('[MicrophoneManager] Active. sampleRate=%d bufferSize=%d', sr, bufSize);
    } catch (err) {
      this._setState('ERROR');
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[MicrophoneManager] Failed to start:', error);
      this._opts.onError?.(error);
      throw error;
    }
  }

  // ── Stop ──────────────────────────────────────────────────────────────────
  async stop(): Promise<void> {
    if (this._state === 'STOPPED' || this._state === 'IDLE') return;

    this._setState('STOPPING');

    // Disconnect nodes (order matters — processor first, then source)
    try {
      this._processorNode?.disconnect();
      this._processorNode = null;
    } catch { /* already disconnected */ }

    try {
      this._sourceNode?.disconnect();
      this._sourceNode = null;
    } catch { /* already disconnected */ }

    // Stop all tracks to release the microphone icon in the browser
    this._stream?.getTracks().forEach((t) => {
      try { t.stop(); } catch { /* already stopped */ }
    });
    this._stream = null;

    // Close AudioContext (prevents the browser's 6-context hard cap)
    if (this._audioCtx && this._audioCtx.state !== 'closed') {
      try { await this._audioCtx.close(); } catch { /* already closed */ }
      console.log('[MicrophoneManager] AudioContext closed');
    }
    this._audioCtx = null;

    this._setState('STOPPED');
    console.log('[MicrophoneManager] Stopped and resources released');
  }

  // ── Audio Processing ──────────────────────────────────────────────────────
  private _onAudioProcess(event: AudioProcessingEvent): void {
    if (this._state !== 'ACTIVE') return;

    const inputData = event.inputBuffer.getChannelData(0);
    const int16 = new Int16Array(inputData.length);

    let sum = 0;
    for (let i = 0; i < inputData.length; i++) {
      const sample = Math.max(-1, Math.min(1, inputData[i]));
      int16[i] = sample * 32768;
      sum += Math.abs(inputData[i]);
    }

    const rmsLevel = sum / inputData.length;

    // Encode to base64 for Gemini Live sendRealtimeInput
    const base64Pcm = this._uint8ToBase64(new Uint8Array(int16.buffer));

    this._opts.onFrame({
      base64Pcm,
      rmsLevel,
      timestamp: event.playbackTime,
    });
  }

  private _uint8ToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // ── Debug ─────────────────────────────────────────────────────────────────
  toJSON() {
    return {
      state: this._state,
      ctxState: this._audioCtx?.state ?? 'null',
      tracks: this._stream?.getTracks().map(t => ({ kind: t.kind, readyState: t.readyState })) ?? [],
    };
  }
}
