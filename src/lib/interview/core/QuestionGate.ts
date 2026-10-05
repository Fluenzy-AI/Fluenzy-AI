// ─── FluenzyAI — QuestionGate ─────────────────────────────────────────────────
// Single authoritative gate: "can the next question be asked?"
//
// Implements:
//   • One-at-a-time question generation lock
//   • Duplicate question prevention (hash + ID set)
//   • Stale generation invalidation (generationId)
//   • Delivery acknowledgement lifecycle
//   • Full audit log for every decision
//
// Design:
//   • Pure class — no React, no DOM, no side-effects
//   • All state stored in-memory for this session
//   • Question delivery = GENERATED → QUEUED → AUDIO_STARTED → DELIVERED

export type QuestionDeliveryState =
  | 'NONE'
  | 'GENERATED'
  | 'QUEUED'
  | 'AUDIO_STARTED'
  | 'DELIVERED'
  | 'FAILED';

export interface QuestionRecord {
  questionId:     string;
  questionHash:   string;
  questionText:   string;
  askedAt:        number;
  deliveryState:  QuestionDeliveryState;
  generationId:   string;
  parentId:       string | null;  // For follow-up questions
}

export interface GateDecision {
  allowed:  boolean;
  reason:   string;
  blocked?: string;  // Which gate blocked it
}

export class QuestionGate {
  private _generationActive   = false;
  private _currentGenerationId: string | null = null;
  private _askedQuestions     = new Map<string, QuestionRecord>(); // hash → record
  private _lastQuestion: QuestionRecord | null = null;
  private _sessionId: string;
  private _auditLog: Array<{ ts: number; event: string; detail: string }> = [];
  private _silenceRecoveryCount = 0;
  private readonly MAX_RECOVERY_PROMPTS = 3;

  constructor(sessionId: string) {
    this._sessionId = sessionId;
  }

  // ── Primary gate check ────────────────────────────────────────────────────
  /**
   * Returns { allowed: true } ONLY when ALL conditions are met.
   * Call this before starting any question generation.
   */
  canAskNextQuestion(context: {
    userSpeaking:             boolean;
    sttPending:               boolean;
    transcriptFinalization:   boolean;
    answerAnalysisPending:    boolean;
    aiCurrentlySpeaking:      boolean;
    sessionEnding:            boolean;
    proposedQuestionText?:    string;
  }): GateDecision {
    const c = context;

    if (c.userSpeaking) {
      return this._block('USER_SPEAKING', 'User is currently speaking — next question forbidden');
    }
    if (c.aiCurrentlySpeaking) {
      return this._block('AI_SPEAKING', 'AI audio still playing — wait for completion');
    }
    if (c.sttPending) {
      return this._block('STT_PENDING', 'STT finalization not complete — transcript may still change');
    }
    if (c.transcriptFinalization) {
      return this._block('TRANSCRIPT_FINALIZATION', 'Post-turn finalization window open — 600ms buffer active');
    }
    if (c.answerAnalysisPending) {
      return this._block('ANSWER_ANALYSIS_PENDING', 'Answer completion analysis in progress');
    }
    if (c.sessionEnding) {
      return this._block('SESSION_ENDING', 'Session is ending — no new questions');
    }
    if (this._generationActive) {
      return this._block('GENERATION_LOCK', 'Question generation already in progress');
    }

    // Duplicate question check
    if (c.proposedQuestionText) {
      const hash = this._hashQuestion(c.proposedQuestionText);
      if (this._askedQuestions.has(hash)) {
        const prev = this._askedQuestions.get(hash)!;
        return this._block(
          'DUPLICATE_QUESTION',
          `This question was already asked (id=${prev.questionId}, state=${prev.deliveryState})`
        );
      }
    }

    return { allowed: true, reason: 'All gate conditions satisfied' };
  }

  // ── Generation lifecycle ──────────────────────────────────────────────────

  /** Acquire the generation lock. Returns a generationId to track this attempt. */
  acquireGenerationLock(): string {
    if (this._generationActive) {
      throw new Error('[QuestionGate] Cannot acquire lock — generation already active');
    }
    const gid = `GEN_${this._sessionId}_${Date.now()}`;
    this._generationActive    = true;
    this._currentGenerationId = gid;
    this._log('LOCK_ACQUIRED', `generationId=${gid}`);
    return gid;
  }

  /**
   * Release the lock. Must be called on both success and failure.
   * If generationId does not match the active one, it is treated as a stale release.
   */
  releaseGenerationLock(generationId: string): void {
    if (this._currentGenerationId !== generationId) {
      this._log('STALE_RELEASE', `generationId=${generationId} != active=${this._currentGenerationId}`);
      return;
    }
    this._generationActive    = false;
    this._currentGenerationId = null;
    this._log('LOCK_RELEASED', `generationId=${generationId}`);
  }

  /** Register a question that has been generated and is about to be delivered. */
  registerQuestion(text: string, generationId: string, parentId: string | null = null): QuestionRecord {
    if (this._currentGenerationId !== generationId) {
      throw new Error(
        `[QuestionGate] Stale registration: generationId=${generationId} != active=${this._currentGenerationId}`
      );
    }

    const hash = this._hashQuestion(text);
    const record: QuestionRecord = {
      questionId:    `Q_${Date.now()}`,
      questionHash:  hash,
      questionText:  text.slice(0, 200),
      askedAt:       Date.now(),
      deliveryState: 'GENERATED',
      generationId,
      parentId,
    };

    this._askedQuestions.set(hash, record);
    this._lastQuestion = record;
    this._log('QUESTION_REGISTERED', `id=${record.questionId} hash=${hash} parent=${parentId}`);
    return record;
  }

  /** Update delivery state lifecycle */
  updateDeliveryState(questionId: string, state: QuestionDeliveryState): void {
    for (const [, record] of this._askedQuestions) {
      if (record.questionId === questionId) {
        record.deliveryState = state;
        this._log('DELIVERY_STATE', `id=${questionId} → ${state}`);
        return;
      }
    }
    console.warn(`[QuestionGate] updateDeliveryState: questionId=${questionId} not found`);
  }

  // ── Stale generation invalidation ────────────────────────────────────────
  /**
   * Invalidate an in-progress generation.
   * Use when a new turn starts before the previous generation completes.
   */
  invalidateGeneration(reason: string): void {
    if (!this._generationActive) return;
    const old = this._currentGenerationId;
    this._generationActive    = false;
    this._currentGenerationId = null;
    this._log('INVALIDATED', `old=${old} reason=${reason}`);
  }

  // ── Silence recovery ──────────────────────────────────────────────────────
  canSendSilenceRecovery(): boolean {
    return this._silenceRecoveryCount < this.MAX_RECOVERY_PROMPTS;
  }

  recordSilenceRecovery(): void {
    this._silenceRecoveryCount++;
    this._log('SILENCE_RECOVERY', `count=${this._silenceRecoveryCount}`);
  }

  resetSilenceRecovery(): void {
    this._silenceRecoveryCount = 0;
  }

  // ── Reset for new turn ────────────────────────────────────────────────────
  onUserSpeechStarted(): void {
    // Cancel any in-flight generation
    this.invalidateGeneration('User speech started');
    this.resetSilenceRecovery();
    this._log('USER_SPEECH_STARTED', 'Generation cancelled, recovery reset');
  }

  // ── Read-only state ───────────────────────────────────────────────────────
  get isGenerationActive(): boolean { return this._generationActive; }
  get currentGenerationId(): string | null { return this._currentGenerationId; }
  get lastQuestion(): QuestionRecord | null { return this._lastQuestion; }
  get askedCount(): number { return this._askedQuestions.size; }

  // ── Private helpers ───────────────────────────────────────────────────────
  private _block(gate: string, reason: string): GateDecision {
    this._log('GATE_BLOCKED', `gate=${gate} reason=${reason}`);
    return { allowed: false, reason, blocked: gate };
  }

  private _hashQuestion(text: string): string {
    // Deterministic 32-char hash based on normalised text (lowercase, trimmed, first 200 chars)
    const normalised = text.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 200);
    let hash = 0;
    for (let i = 0; i < normalised.length; i++) {
      const ch = normalised.charCodeAt(i);
      hash = ((hash << 5) - hash) + ch;
      hash |= 0; // Convert to 32-bit int
    }
    return `Q${Math.abs(hash).toString(16).padStart(8, '0')}`;
  }

  private _log(event: string, detail: string): void {
    this._auditLog.push({ ts: Date.now(), event, detail });
    console.log(`[QuestionGate] ${event}: ${detail} session=${this._sessionId}`);
  }

  getAuditLog() {
    return [...this._auditLog];
  }

  toJSON() {
    return {
      sessionId:          this._sessionId,
      generationActive:   this._generationActive,
      askedCount:         this._askedQuestions.size,
      silenceRecovery:    this._silenceRecoveryCount,
      lastQuestion:       this._lastQuestion
        ? { id: this._lastQuestion.questionId, state: this._lastQuestion.deliveryState }
        : null,
    };
  }
}
