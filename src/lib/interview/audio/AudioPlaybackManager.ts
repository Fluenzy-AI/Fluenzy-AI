// ─── FluenzyAI — AudioPlaybackManager ────────────────────────────────────────
// THE critical class for the Single-Speaker Guarantee.
//
// Problem it solves:
//   Without turn-ID arbitration, audio chunks from turn N-1 continue playing
//   after turn N has started. Gemini Live streams chunks async; if the user
//   interrupts (barge-in) or the AI starts a new question, old chunks arrive
//   in the onmessage callback and the old AudioBufferSourceNode.start() is
//   still called — producing 2 simultaneous AI voices.
//
// Solution:
//   • Every Gemini Live response turn gets a unique `turnId`.
//   • Before playing any chunk, check `chunk.turnId === this.currentTurnId`.
//   • On barge-in or new turn start → call `cancelCurrentTurn()` which:
//     1. Stops ALL active AudioBufferSourceNodes immediately (<1 audio frame)
//     2. Clears the active node set
//     3. Resets the next-start-time scheduler
//     4. Invalidates currentTurnId so in-flight chunks are silently rejected
//
// Invariant: MAX_ACTIVE_AI_VOICES = 1 at all times.
//
// This class is deliberately framework-agnostic (no React) so it can be
// unit-tested in Node.js without a DOM.

import type { InterviewState } from '../core/InterviewStateMachine';

// ── Events emitted by AudioPlaybackManager ────────────────────────────────────
export type PlaybackEvent =
  | { type: 'TURN_STARTED'; turnId: string }
  | { type: 'CHUNK_SCHEDULED'; turnId: string; chunkIndex: number; durationSec: number }
  | { type: 'CHUNK_REJECTED'; turnId: string; reason: string }
  | { type: 'TURN_CANCELLED'; turnId: string; activeNodesStopped: number }
  | { type: 'TURN_COMPLETED'; turnId: string }
  | { type: 'AUDIO_CONTEXT_CLOSED' };

export type PlaybackEventListener = (event: PlaybackEvent) => void;

// ── Result of scheduleChunk ───────────────────────────────────────────────────
export type ScheduleResult = 'scheduled' | 'rejected_stale_turn' | 'rejected_wrong_session' | 'rejected_no_ctx';

export class AudioPlaybackManager {
  private _ctx: AudioContext | null = null;
  private _currentTurnId: string | null = null;
  private _currentSessionId: string | null = null;
  private _activeNodes: Set<AudioBufferSourceNode> = new Set();
  private _nextStartTime = 0;
  private _chunkIndex = 0;
  private _listeners: PlaybackEventListener[] = [];

  // ── Initialise / Teardown ─────────────────────────────────────────────────
  init(sampleRate = 24000): AudioContext {
    if (this._ctx && this._ctx.state !== 'closed') {
      return this._ctx;
    }
    this._ctx = new AudioContext({ sampleRate });
    console.log('[AudioPlaybackManager] AudioContext created, state=', this._ctx.state);
    return this._ctx;
  }

  async resume(): Promise<void> {
    if (this._ctx && this._ctx.state === 'suspended') {
      await this._ctx.resume();
    }
  }

  async close(): Promise<void> {
    this.cancelCurrentTurn();
    if (this._ctx && this._ctx.state !== 'closed') {
      await this._ctx.close().catch(() => {});
      console.log('[AudioPlaybackManager] AudioContext closed');
      this._emit({ type: 'AUDIO_CONTEXT_CLOSED' });
    }
    this._ctx = null;
    this._currentTurnId = null;
    this._currentSessionId = null;
  }

  get audioContext(): AudioContext | null {
    return this._ctx;
  }

  get isSpeaking(): boolean {
    return this._activeNodes.size > 0;
  }

  get currentTurnId(): string | null {
    return this._currentTurnId;
  }

  // ── Turn Lifecycle ────────────────────────────────────────────────────────

  /**
   * Begin a new audio turn. Cancels any in-progress turn first.
   * Must be called at the START of every Gemini response (before chunks arrive).
   *
   * @param sessionId  Must match the current session. Guards against stale async callbacks.
   * @param turnId     Unique ID for this AI response turn.
   * @param responseDelayMs  Initial delay before first chunk plays (0 = instant).
   */
  startTurn(sessionId: string, turnId: string, responseDelayMs = 0): void {
    if (!this._ctx) {
      console.error('[AudioPlaybackManager] startTurn() called before init()');
      return;
    }

    // Cancel any currently playing audio (barge-in / new turn overrides old)
    if (this._currentTurnId && this._currentTurnId !== turnId) {
      this.cancelCurrentTurn();
    }

    this._currentSessionId = sessionId;
    this._currentTurnId = turnId;
    this._chunkIndex = 0;

    // Schedule first audio chunk after responseDelayMs
    const now = Math.max(this._nextStartTime, this._ctx.currentTime);
    this._nextStartTime = now + responseDelayMs / 1000;

    this._emit({ type: 'TURN_STARTED', turnId });
    console.log(`[AudioPlaybackManager] Turn started: turnId=${turnId} delay=${responseDelayMs}ms`);
  }

  /**
   * Schedule an audio buffer for playback. Rejects silently if:
   *   • turnId does not match currentTurnId (stale async chunk)
   *   • sessionId does not match (stale session callback)
   *   • AudioContext is not available
   *
   * @returns A ScheduleResult indicating what happened.
   */
  scheduleChunk(
    sessionId: string,
    turnId: string,
    buffer: AudioBuffer,
  ): ScheduleResult {
    if (!this._ctx || this._ctx.state === 'closed') {
      this._emit({ type: 'CHUNK_REJECTED', turnId, reason: 'no_ctx' });
      return 'rejected_no_ctx';
    }

    if (sessionId !== this._currentSessionId) {
      this._emit({ type: 'CHUNK_REJECTED', turnId, reason: 'wrong_session' });
      return 'rejected_wrong_session';
    }

    if (turnId !== this._currentTurnId) {
      this._emit({ type: 'CHUNK_REJECTED', turnId, reason: 'stale_turn' });
      return 'rejected_stale_turn';
    }

    const src = this._ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this._ctx.destination);

    const startTime = Math.max(this._nextStartTime, this._ctx.currentTime);
    src.start(startTime);
    this._nextStartTime = startTime + buffer.duration;
    this._activeNodes.add(src);

    const capturedTurnId = turnId;
    const capturedChunkIdx = this._chunkIndex++;

    src.onended = () => {
      this._activeNodes.delete(src);
      if (this._activeNodes.size === 0 && this._currentTurnId === capturedTurnId) {
        this._emit({ type: 'TURN_COMPLETED', turnId: capturedTurnId });
        console.log(`[AudioPlaybackManager] Turn completed: turnId=${capturedTurnId}`);
      }
    };

    this._emit({
      type: 'CHUNK_SCHEDULED',
      turnId,
      chunkIndex: capturedChunkIdx,
      durationSec: buffer.duration,
    });

    return 'scheduled';
  }

  /**
   * Cancel the currently playing turn. Stops all active audio nodes within
   * one sample block (~21ms at 48kHz). This is the barge-in entry point.
   */
  cancelCurrentTurn(): void {
    const stopped = this._activeNodes.size;
    const cancelledTurnId = this._currentTurnId;

    this._activeNodes.forEach((node) => {
      try { node.stop(0); } catch { /* already stopped */ }
    });
    this._activeNodes.clear();
    this._currentTurnId = null;
    this._nextStartTime = this._ctx ? this._ctx.currentTime : 0;
    this._chunkIndex = 0;

    if (cancelledTurnId) {
      this._emit({ type: 'TURN_CANCELLED', turnId: cancelledTurnId, activeNodesStopped: stopped });
      console.log(`[AudioPlaybackManager] Turn cancelled: turnId=${cancelledTurnId} stopped=${stopped} nodes`);
    }
  }

  // ── Observer ──────────────────────────────────────────────────────────────
  addListener(fn: PlaybackEventListener): () => void {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter((l) => l !== fn); };
  }

  private _emit(event: PlaybackEvent): void {
    this._listeners.forEach((fn) => {
      try { fn(event); } catch (e) { console.error('[AudioPlaybackManager] Listener error:', e); }
    });
  }

  // ── Debug ─────────────────────────────────────────────────────────────────
  toJSON() {
    return {
      currentTurnId: this._currentTurnId,
      activeNodes: this._activeNodes.size,
      nextStartTime: this._nextStartTime,
      ctxState: this._ctx?.state ?? 'null',
      isSpeaking: this.isSpeaking,
    };
  }
}
