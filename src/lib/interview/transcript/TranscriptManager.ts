// ─── FluenzyAI — TranscriptManager ───────────────────────────────────────────
// Per-turn transcript isolation with reconstruction pipeline integration.
//
// Problem it solves:
//   The current system uses ONE shared `currentQA.current.answer` for the
//   entire interview. When multiple turns overlap (rare but possible) or when
//   the turn boundary detection misfires, answers from different questions
//   contaminate each other.
//
// Solution:
//   • Each turn has its own `InterviewTurn` object identified by `turnId`.
//   • `activeTurnId` tracks exactly which turn is currently accumulating text.
//   • `finalizeCurrentTurn()` seals the turn, triggers Prompt 1 reconstruction,
//     and back-patches the entry once reconstruction resolves.
//   • History is bounded to prevent unbounded memory growth.
//
// Thread model: All methods are synchronous. Async work (Prompt 1) is
//   fire-and-forget background tasks. Never block the Gemini Live stream.

import { runTranscriptReconstruction, type Prompt1Output } from '@/lib/interviewEngine';

// ── Turn Status ───────────────────────────────────────────────────────────────
export type TurnStatus =
  | 'ACTIVE'        // Currently accumulating speech
  | 'FINALIZING'    // Waiting for Prompt 1 to complete
  | 'COMPLETED'     // Fully reconstructed and ready for evaluation
  | 'CAPTURE_FAILED' // No audio captured — need re-prompt
  | 'ERROR';         // Reconstruction failed fatally

// ── Turn Data ─────────────────────────────────────────────────────────────────
export interface InterviewTurn {
  turnId: string;
  turnIndex: number;
  /** Raw AI question text as received from outputTranscription */
  rawQuestion: string;
  /** Raw STT answer text as received from inputTranscription */
  rawAnswer: string;
  /** Reconstructed answer after Prompt 1 (replaces rawAnswer if successful) */
  reconstructedAnswer?: string;
  /** Final answer to use for evaluation (reconstructed ?? raw) */
  finalAnswer: string;
  /** Prompt 1 metadata */
  p1Status?: Prompt1Output['status'];
  p1Confidence?: Prompt1Output['confidence'];
  p1UnclearSpans?: string[];
  /** Whether the system determined this turn had no audio capture */
  isCaptureFailed: boolean;
  status: TurnStatus;
  startedAt: Date;
  completedAt?: Date;
  timestamp: string;
}

// ── Options ───────────────────────────────────────────────────────────────────
export interface TranscriptManagerOptions {
  /** Maximum number of turns to retain in memory. Default: 100 */
  maxTurns?: number;
  /** Whether to run Prompt 1 reconstruction. Default: true */
  enableReconstruction?: boolean;
  /** Called when a turn is finalized (after Prompt 1 completes or times out) */
  onTurnFinalized?: (turn: InterviewTurn) => void;
  /** Called when a capture_failed turn needs re-prompt */
  onCaptureFailDetected?: (turn: InterviewTurn) => void;
  /** Module type — reconstruction only runs for interview modules */
  isInterviewModule?: boolean;
}

export class TranscriptManager {
  private _turns: InterviewTurn[] = [];
  private _activeTurnId: string | null = null;
  private _turnCounter = 0;
  private _opts: Required<TranscriptManagerOptions>;
  private _sessionId: string;

  constructor(sessionId: string, opts: TranscriptManagerOptions = {}) {
    this._sessionId = sessionId;
    this._opts = {
      maxTurns:            opts.maxTurns ?? 100,
      enableReconstruction: opts.enableReconstruction ?? true,
      onTurnFinalized:     opts.onTurnFinalized ?? (() => {}),
      onCaptureFailDetected: opts.onCaptureFailDetected ?? (() => {}),
      isInterviewModule:   opts.isInterviewModule ?? true,
    };
  }

  // ── Turn Lifecycle ────────────────────────────────────────────────────────

  /**
   * Begin a new turn. Must be called at the start of each AI question turn.
   * @returns The new turnId.
   */
  startTurn(): string {
    // Create new turn
    const turnId = `T_${this._sessionId}_${++this._turnCounter}`;
    const turn: InterviewTurn = {
      turnId,
      turnIndex: this._turnCounter,
      rawQuestion: '',
      rawAnswer: '',
      finalAnswer: '',
      isCaptureFailed: false,
      status: 'ACTIVE',
      startedAt: new Date(),
      timestamp: new Date().toLocaleTimeString(),
    };
    this._turns.push(turn);
    this._activeTurnId = turnId;

    // Bound memory
    if (this._turns.length > this._opts.maxTurns) {
      this._turns.shift();
    }

    console.log(`[TranscriptManager] Turn started: turnId=${turnId} index=${this._turnCounter}`);
    return turnId;
  }

  // ── Append Streaming Text ─────────────────────────────────────────────────

  /** Append AI output transcription text (question being asked). */
  appendQuestion(text: string): void {
    const turn = this._getActiveTurn();
    if (!turn) return;
    turn.rawQuestion += text;
  }

  /** Append user input transcription text (candidate's partial answer). */
  appendAnswer(text: string): void {
    const turn = this._getActiveTurn();
    if (!turn) return;
    turn.rawAnswer += text;
  }

  // ── Finalize Turn ─────────────────────────────────────────────────────────

  /**
   * Called on `turnComplete` from Gemini. Seals the active turn and
   * asynchronously runs Prompt 1 reconstruction (for interview modules).
   *
   * @returns The finalized turn (status still FINALIZING while Prompt 1 runs).
   */
  finalizeCurrentTurn(): InterviewTurn | null {
    const turn = this._getActiveTurn();
    if (!turn) {
      console.warn('[TranscriptManager] finalizeCurrentTurn() called with no active turn');
      return null;
    }

    turn.completedAt = new Date();
    turn.finalAnswer = turn.rawAnswer.trim();
    turn.status = 'FINALIZING';
    this._activeTurnId = null;

    console.log(
      `[TranscriptManager] Turn finalized: turnId=${turn.turnId} ` +
      `rawAnswer="${turn.rawAnswer.slice(0, 80)}" rawQuestion="${turn.rawQuestion.slice(0, 60)}"`,
    );

    // ── Prompt 1: Async Transcript Reconstruction ─────────────────────────
    if (this._opts.isInterviewModule && this._opts.enableReconstruction) {
      const context = this._buildConversationContext(turn.turnId);
      this._runReconstruction(turn, context);
    } else {
      turn.status = 'COMPLETED';
      this._opts.onTurnFinalized(turn);
    }

    return turn;
  }

  // ── Reconstruction Pipeline ───────────────────────────────────────────────
  private async _runReconstruction(turn: InterviewTurn, context: string): Promise<void> {
    try {
      const p1Output = await runTranscriptReconstruction(turn.rawAnswer, context);

      turn.p1Status = p1Output.status;
      turn.p1Confidence = p1Output.confidence;
      turn.p1UnclearSpans = p1Output.unclear_spans;
      turn.reconstructedAnswer = p1Output.reconstructed_text || undefined;

      if (p1Output.status === 'capture_failed') {
        turn.isCaptureFailed = true;
        turn.status = 'CAPTURE_FAILED';
        turn.finalAnswer = turn.rawAnswer.trim(); // keep raw as fallback
        console.warn(`[TranscriptManager] CAPTURE_FAILED on turn ${turn.turnId}`);
        this._opts.onCaptureFailDetected(turn);
      } else {
        turn.finalAnswer = p1Output.reconstructed_text || turn.rawAnswer.trim();
        turn.status = 'COMPLETED';
      }

      this._opts.onTurnFinalized(turn);
    } catch (err) {
      console.error(`[TranscriptManager] Reconstruction error on turn ${turn.turnId}:`, err);
      turn.status = 'COMPLETED'; // graceful degrade — keep raw
      turn.finalAnswer = turn.rawAnswer.trim();
      this._opts.onTurnFinalized(turn);
    }
  }

  private _buildConversationContext(currentTurnId: string): string {
    const completedTurns = this._turns
      .filter((t) => t.turnId !== currentTurnId && t.status === 'COMPLETED')
      .slice(-4);
    return completedTurns
      .map((t) => `[HR]: ${t.rawQuestion}\n[Candidate]: ${t.finalAnswer}`)
      .join('\n\n');
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  get activeTurnId(): string | null { return this._activeTurnId; }

  get allTurns(): readonly InterviewTurn[] { return this._turns; }

  get completedTurns(): InterviewTurn[] {
    return this._turns.filter((t) => t.status === 'COMPLETED');
  }

  get captureFailedTurns(): InterviewTurn[] {
    return this._turns.filter((t) => t.isCaptureFailed);
  }

  getTurnById(turnId: string): InterviewTurn | undefined {
    return this._turns.find((t) => t.turnId === turnId);
  }

  getLastCompletedTurn(): InterviewTurn | undefined {
    const completed = this.completedTurns;
    return completed[completed.length - 1];
  }

  /** Build the QA pairs array for evaluation/session save. */
  toQAPairs(): Array<{ question: string; answer: string; timestamp: string }> {
    return this.completedTurns.map((t) => ({
      question:  t.rawQuestion.trim(),
      answer:    t.finalAnswer,
      timestamp: t.timestamp,
    }));
  }

  private _getActiveTurn(): InterviewTurn | null {
    if (!this._activeTurnId) return null;
    return this._turns.find((t) => t.turnId === this._activeTurnId) ?? null;
  }

  // ── Debug ─────────────────────────────────────────────────────────────────
  toJSON() {
    return {
      sessionId: this._sessionId,
      totalTurns: this._turns.length,
      activeTurnId: this._activeTurnId,
      completedTurns: this.completedTurns.length,
      captureFailedTurns: this.captureFailedTurns.length,
    };
  }
}
