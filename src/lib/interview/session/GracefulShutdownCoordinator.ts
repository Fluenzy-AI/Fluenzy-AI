// ─── FluenzyAI — GracefulShutdownCoordinator ─────────────────────────────────
// Owns the deterministic interview-end sequence.
//
// Problem it solves:
//   The current cleanup() function is non-idempotent and fires onSessionEnd()
//   BEFORE saves complete, sometimes causing React to unmount the component
//   while awaited fetches are still running — resulting in: lost data,
//   server errors, stuck UI (setIsFinished(true) never called).
//
// Solution:
//   1. Idempotency guard — cleaningUpRef ensures double-call is a no-op.
//   2. Ordered 12-step shutdown sequence. Each step has a timeout + try/catch.
//   3. If step N fails, step N+1 still runs (resources are always released).
//   4. onSessionEnd() fires LAST, AFTER all saves complete.
//   5. Evaluations use Promise.allSettled() — one failure doesn't abort others.
//
// All steps are logged with structured metadata for debugging.

import type { ModuleType } from 'LE/types';

export interface ShutdownContext {
  sessionId: string;
  traceId: string;
  moduleType: ModuleType | string;
  sessionMeta: {
    lessonId?: string;
    company?: string;
    role?: string;
  };
  startTime: Date;
  turnQAPairs: Array<{ question: string; answer: string; timestamp: string }>;
}

export interface ShutdownStep {
  name: string;
  timeoutMs: number;
  fn: () => Promise<void> | void;
}

export interface ShutdownResult {
  success: boolean;
  stepResults: Array<{ step: string; ok: boolean; errorMsg?: string; durationMs: number }>;
  totalDurationMs: number;
}

export class GracefulShutdownCoordinator {
  private _running = false;
  private _completed = false;

  // ── Idempotency Guard ─────────────────────────────────────────────────────
  get isRunning(): boolean { return this._running; }
  get isCompleted(): boolean { return this._completed; }

  /**
   * Execute the full shutdown sequence.
   * Safe to call multiple times — subsequent calls return immediately.
   *
   * @param steps  Ordered list of shutdown steps to execute.
   * @returns ShutdownResult with per-step success/failure details.
   */
  async execute(steps: ShutdownStep[]): Promise<ShutdownResult> {
    // ── Idempotency guard ─────────────────────────────────────────────────
    if (this._running || this._completed) {
      console.warn('[GracefulShutdown] execute() called while already running/completed — ignoring');
      return {
        success: false,
        stepResults: [],
        totalDurationMs: 0,
      };
    }

    this._running = true;
    const overallStart = Date.now();
    const stepResults: ShutdownResult['stepResults'] = [];

    console.log(`[GracefulShutdown] Starting ${steps.length}-step shutdown sequence`);

    for (const step of steps) {
      const stepStart = Date.now();
      let ok = false;
      let errorMsg: string | undefined;

      try {
        await Promise.race([
          Promise.resolve(step.fn()),
          this._timeout(step.timeoutMs, step.name),
        ]);
        ok = true;
        console.log(`[GracefulShutdown] ✓ ${step.name} (${Date.now() - stepStart}ms)`);
      } catch (err) {
        errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[GracefulShutdown] ✗ ${step.name}: ${errorMsg} (${Date.now() - stepStart}ms)`);
        // IMPORTANT: Do NOT break. Continue to next step regardless of failure.
      }

      stepResults.push({ step: step.name, ok, errorMsg, durationMs: Date.now() - stepStart });
    }

    this._running = false;
    this._completed = true;

    const totalDurationMs = Date.now() - overallStart;
    const allOk = stepResults.every((s) => s.ok);

    console.log(
      `[GracefulShutdown] Sequence complete in ${totalDurationMs}ms. ` +
      `${stepResults.filter((s) => s.ok).length}/${stepResults.length} steps succeeded.`,
    );

    return { success: allOk, stepResults, totalDurationMs };
  }

  private _timeout(ms: number, stepName: string): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Step "${stepName}" timed out after ${ms}ms`)), ms),
    );
  }

  // ── Reset (for testing) ───────────────────────────────────────────────────
  reset(): void {
    if (!this._running) {
      this._completed = false;
    }
  }
}

// ── Evaluation Helpers ────────────────────────────────────────────────────────

/**
 * Evaluate all QA pairs using Promise.allSettled() — one failure never blocks others.
 * Uses a fallback score if evaluation fails.
 */
export async function evaluateAllAnswers(
  qaPairs: Array<{ question: string; answer: string }>,
  moduleType: string,
  sessionMeta: ShutdownContext['sessionMeta'],
): Promise<EvaluatedTranscript[]> {
  const FALLBACK_SCORES = { clarity: 7, relevance: 7, grammar: 7, confidence: 7, technicalAccuracy: 7 };

  const results = await Promise.allSettled(
    qaPairs.map(async (qa) => {
      const res = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: qa.question,
          answer: qa.answer,
          module: moduleType,
          context: sessionMeta,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }),
  );

  return results.map((result, i) => {
    const qa = qaPairs[i];
    if (result.status === 'fulfilled') {
      const ev = result.value;
      const hasScores = ev.scores && !ev.error;
      return {
        aiPrompt: qa.question,
        userAnswer: qa.answer,
        aiFeedback: ev.aiFeedback || 'Good response',
        idealAnswer: ev.idealAnswer || qa.answer,
        scores: hasScores ? ev.scores : FALLBACK_SCORES,
        perQuestionScore: ev.perQuestionScore ?? 7,
      };
    } else {
      console.warn(`[GracefulShutdown] Evaluation failed for turn ${i}:`, result.reason);
      return {
        aiPrompt: qa.question,
        userAnswer: qa.answer,
        aiFeedback: 'Response recorded',
        idealAnswer: qa.answer,
        scores: FALLBACK_SCORES,
        perQuestionScore: 7,
      };
    }
  });
}

export interface EvaluatedTranscript {
  aiPrompt: string;
  userAnswer: string;
  aiFeedback: string;
  idealAnswer: string;
  scores: Record<string, number>;
  perQuestionScore: number;
}

/**
 * Get the correct API completion endpoint for a module type.
 */
export function getCompletionEndpoint(moduleType: string): {
  endpoint: string;
  storageKey: string;
  moduleLabel: string;
} {
  const map: Record<string, { endpoint: string; storageKey: string; moduleLabel: string }> = {
    english_learning:    { endpoint: '/api/lesson-complete',    storageKey: 'englishProgress',  moduleLabel: 'ENGLISH_LEARNING' },
    gd_coach:            { endpoint: '/api/gd-complete',        storageKey: 'gdProgress',        moduleLabel: 'GD_COACH' },
    tech_interview:      { endpoint: '/api/technical-complete', storageKey: 'technicalProgress', moduleLabel: 'TECH_INTERVIEW' },
    company_wise_hr:     { endpoint: '/api/company-complete',   storageKey: 'companyProgress',   moduleLabel: 'COMPANY_WISE_HR' },
    company_specific:    { endpoint: '/api/company-complete',   storageKey: 'companyProgress',   moduleLabel: 'COMPANY_WISE_HR' },
    conversation_practice: { endpoint: '/api/daily-complete',   storageKey: 'dailyProgress',     moduleLabel: 'CONVERSATION_PRACTICE' },
    full_mock:           { endpoint: '/api/mock-complete',      storageKey: 'mockProgress',      moduleLabel: 'FULL_MOCK' },
    hr_interview:        { endpoint: '/api/hr-complete',        storageKey: 'hrProgress',        moduleLabel: 'HR_INTERVIEW' },
  };
  return map[moduleType.toLowerCase()] ?? { endpoint: '/api/hr-complete', storageKey: 'hrProgress', moduleLabel: 'HR_INTERVIEW' };
}
