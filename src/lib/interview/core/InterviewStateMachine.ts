// ─── FluenzyAI — Deterministic Interview State Machine ───────────────────────
// Single source of truth for interview phase. Every state transition must
// go through `transition()`. Invalid transitions throw synchronously so they
// are never silently swallowed.
//
// Design constraints:
//   • Pure class (no React, no DOM) — unit-testable in isolation
//   • All listener callbacks are synchronous fire-and-forget
//   • Never triggers side-effects itself; callers act on state-change events

export type InterviewState =
  | 'IDLE'
  | 'INITIALIZING'
  | 'READY'
  | 'AI_SPEAKING'
  | 'WAITING_USER'
  | 'LISTENING'
  | 'USER_SPEAKING'
  | 'PROCESSING'
  | 'GENERATING'
  | 'ENDING'
  | 'COMPLETED'
  | 'ERROR';

export type StateChangeListener = (
  prev: InterviewState,
  next: InterviewState,
  meta?: Record<string, unknown>,
) => void;

// ── Valid transition map (adjacency list) ────────────────────────────────────
// Only listed transitions are allowed. Any other call throws an error.
const VALID_TRANSITIONS: Readonly<Record<InterviewState, ReadonlyArray<InterviewState>>> = {
  IDLE:          ['INITIALIZING', 'ERROR'],
  INITIALIZING:  ['READY', 'ERROR', 'IDLE'],
  READY:         ['AI_SPEAKING', 'WAITING_USER', 'ENDING', 'ERROR'],
  AI_SPEAKING:   ['WAITING_USER', 'ENDING', 'ERROR', 'USER_SPEAKING'],
  WAITING_USER:  ['LISTENING', 'ENDING', 'ERROR', 'AI_SPEAKING'],
  LISTENING:     ['USER_SPEAKING', 'WAITING_USER', 'ENDING', 'ERROR'],
  USER_SPEAKING: ['PROCESSING', 'WAITING_USER', 'ENDING', 'ERROR'],
  PROCESSING:    ['GENERATING', 'WAITING_USER', 'ENDING', 'ERROR'],
  GENERATING:    ['AI_SPEAKING', 'WAITING_USER', 'ENDING', 'ERROR'],
  ENDING:        ['COMPLETED', 'ERROR'],
  COMPLETED:     [],        // Terminal. No further transitions.
  ERROR:         ['IDLE'],  // Allow reset after error.
};

export class InterviewStateMachine {
  private _state: InterviewState = 'IDLE';
  private _listeners: StateChangeListener[] = [];
  private _sessionId: string;
  private _transitionCount = 0;

  constructor(sessionId: string) {
    this._sessionId = sessionId;
  }

  // ── Public read-only state ─────────────────────────────────────────────────
  get state(): InterviewState {
    return this._state;
  }

  get sessionId(): string {
    return this._sessionId;
  }

  get isTerminal(): boolean {
    return this._state === 'COMPLETED' || this._state === 'ERROR';
  }

  get isEnding(): boolean {
    return this._state === 'ENDING' || this._state === 'COMPLETED';
  }

  get isAiActive(): boolean {
    return this._state === 'AI_SPEAKING' || this._state === 'GENERATING';
  }

  get isUserActive(): boolean {
    return this._state === 'LISTENING' || this._state === 'USER_SPEAKING';
  }

  // ── Transition ─────────────────────────────────────────────────────────────
  /**
   * Attempt a state transition.
   * @throws Error if the transition is not allowed from the current state.
   */
  transition(next: InterviewState, meta?: Record<string, unknown>): void {
    const allowed = VALID_TRANSITIONS[this._state];

    if (!allowed.includes(next)) {
      const msg =
        `[InterviewStateMachine] INVALID TRANSITION: ${this._state} → ${next} ` +
        `(allowed: ${allowed.join(', ')}) session=${this._sessionId}`;
      console.error(msg, meta ?? {});
      throw new Error(msg);
    }

    const prev = this._state;
    this._state = next;
    this._transitionCount++;

    console.log(
      `[InterviewStateMachine] ${prev} → ${next} ` +
      `(#${this._transitionCount}) session=${this._sessionId}`,
      meta ?? {},
    );

    // Notify all listeners synchronously
    this._listeners.forEach((fn) => {
      try {
        fn(prev, next, meta);
      } catch (err) {
        console.error('[InterviewStateMachine] Listener error:', err);
      }
    });
  }

  /**
   * Like `transition()` but does NOT throw if the transition is invalid.
   * Use this only in cleanup paths where you cannot guarantee state.
   * @returns true if the transition succeeded, false if rejected.
   */
  tryTransition(next: InterviewState, meta?: Record<string, unknown>): boolean {
    try {
      this.transition(next, meta);
      return true;
    } catch {
      return false;
    }
  }

  // ── Observers ──────────────────────────────────────────────────────────────
  addListener(fn: StateChangeListener): () => void {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== fn);
    };
  }

  removeAllListeners(): void {
    this._listeners = [];
  }

  // ── Convenience guards (call before expensive operations) ──────────────────
  assertState(expected: InterviewState): void {
    if (this._state !== expected) {
      throw new Error(
        `[InterviewStateMachine] Expected state ${expected} but current is ${this._state}`,
      );
    }
  }

  canTransitionTo(next: InterviewState): boolean {
    return VALID_TRANSITIONS[this._state].includes(next);
  }

  // ── Debug ──────────────────────────────────────────────────────────────────
  toJSON() {
    return {
      sessionId: this._sessionId,
      state: this._state,
      transitionCount: this._transitionCount,
      isTerminal: this.isTerminal,
    };
  }
}
