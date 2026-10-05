// ─── FluenzyAI — Unit Tests: GracefulShutdownCoordinator ────────────────────
// Tests idempotency, step ordering, timeout handling, and partial failure resilience.

import { GracefulShutdownCoordinator, type ShutdownStep } from '../GracefulShutdownCoordinator';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

describe('GracefulShutdownCoordinator', () => {
  let coord: GracefulShutdownCoordinator;

  beforeEach(() => {
    coord = new GracefulShutdownCoordinator();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ── Idempotency ───────────────────────────────────────────────────────────
  describe('idempotency', () => {
    it('returns early on second execute() call', async () => {
      const fn = jest.fn().mockResolvedValue(undefined);
      const steps: ShutdownStep[] = [{ name: 'STEP_1', timeoutMs: 1000, fn }];

      const p1 = coord.execute(steps);
      jest.runAllTimersAsync();
      await p1;

      // Second call should be a no-op
      const result = await coord.execute(steps);
      expect(result.success).toBe(false);
      expect(result.stepResults).toHaveLength(0);
      expect(fn).toHaveBeenCalledTimes(1); // Not called again
    });

    it('ignores execute() while still running', async () => {
      let resolveStep: () => void;
      const blockingStep = jest.fn().mockImplementation(
        () => new Promise<void>((r) => { resolveStep = r; }),
      );

      const steps: ShutdownStep[] = [{ name: 'BLOCKING', timeoutMs: 5000, fn: blockingStep }];
      const p1 = coord.execute(steps);

      // Try second call while first is still running
      const p2 = coord.execute(steps);
      const result2 = await p2;
      expect(result2.success).toBe(false);
      expect(result2.stepResults).toHaveLength(0);

      resolveStep!();
      await p1;
    });
  });

  // ── Step ordering ──────────────────────────────────────────────────────────
  describe('step ordering', () => {
    it('executes steps in order', async () => {
      const order: string[] = [];
      const steps: ShutdownStep[] = [
        { name: 'STEP_A', timeoutMs: 1000, fn: () => { order.push('A'); } },
        { name: 'STEP_B', timeoutMs: 1000, fn: () => { order.push('B'); } },
        { name: 'STEP_C', timeoutMs: 1000, fn: () => { order.push('C'); } },
      ];

      await coord.execute(steps);
      expect(order).toEqual(['A', 'B', 'C']);
    });
  });

  // ── Failure resilience (continue on error) ────────────────────────────────
  describe('failure resilience', () => {
    it('continues to next step even if a step throws', async () => {
      const order: string[] = [];
      const steps: ShutdownStep[] = [
        { name: 'STEP_OK_1', timeoutMs: 1000, fn: () => { order.push('1'); } },
        { name: 'STEP_FAIL', timeoutMs: 1000, fn: () => { order.push('2'); throw new Error('step failed'); } },
        { name: 'STEP_OK_3', timeoutMs: 1000, fn: () => { order.push('3'); } },
      ];

      const result = await coord.execute(steps);

      // All 3 steps ran, despite step 2 failing
      expect(order).toEqual(['1', '2', '3']);

      // Result shows failure
      const failedStep = result.stepResults.find((s) => s.step === 'STEP_FAIL');
      expect(failedStep?.ok).toBe(false);
      expect(failedStep?.errorMsg).toBe('step failed');

      // Third step succeeded
      const okStep = result.stepResults.find((s) => s.step === 'STEP_OK_3');
      expect(okStep?.ok).toBe(true);
    });

    it('reports overall success=false when any step fails', async () => {
      const steps: ShutdownStep[] = [
        { name: 'OK', timeoutMs: 1000, fn: () => {} },
        { name: 'FAIL', timeoutMs: 1000, fn: () => { throw new Error('fail'); } },
      ];

      const result = await coord.execute(steps);
      expect(result.success).toBe(false);
    });

    it('reports overall success=true when all steps succeed', async () => {
      const steps: ShutdownStep[] = [
        { name: 'OK_1', timeoutMs: 1000, fn: () => {} },
        { name: 'OK_2', timeoutMs: 1000, fn: () => {} },
      ];

      const result = await coord.execute(steps);
      expect(result.success).toBe(true);
    });
  });

  // ── Timeout handling ──────────────────────────────────────────────────────
  describe('timeout handling', () => {
    it('times out a hanging step and continues to next', async () => {
      const order: string[] = [];
      const steps: ShutdownStep[] = [
        {
          name: 'HANGING',
          timeoutMs: 100,
          fn: () => new Promise<void>(() => { /* never resolves */ }),
        },
        { name: 'AFTER_TIMEOUT', timeoutMs: 1000, fn: () => { order.push('after'); } },
      ];

      const p = coord.execute(steps);
      jest.advanceTimersByTime(200); // Advance past the 100ms timeout
      jest.runAllTimersAsync();
      const result = await p;

      // Timed-out step is marked as failed
      const hangStep = result.stepResults.find((s) => s.step === 'HANGING');
      expect(hangStep?.ok).toBe(false);
      expect(hangStep?.errorMsg).toContain('timed out');

      // Step after timeout still ran
      expect(order).toContain('after');
    });
  });

  // ── Step results ──────────────────────────────────────────────────────────
  describe('step results', () => {
    it('includes timing and status for each step', async () => {
      // Use synchronous fn (no real async needed) — fake timers + real async don't mix
      const steps: ShutdownStep[] = [
        { name: 'TIMED_STEP', timeoutMs: 1000, fn: () => { /* sync */ } },
      ];

      const result = await coord.execute(steps);
      const step = result.stepResults[0];
      expect(step.step).toBe('TIMED_STEP');
      expect(step.ok).toBe(true);
      expect(typeof step.durationMs).toBe('number');
      expect(step.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('includes errorMsg when step fails', async () => {
      const steps: ShutdownStep[] = [
        { name: 'FAIL', timeoutMs: 1000, fn: () => { throw new Error('something went wrong'); } },
      ];

      const result = await coord.execute(steps);
      expect(result.stepResults[0].errorMsg).toBe('something went wrong');
    });
  });

  // ── Total duration ────────────────────────────────────────────────────────
  describe('total duration', () => {
    it('reports total duration for the sequence', async () => {
      const steps: ShutdownStep[] = [
        { name: 'A', timeoutMs: 1000, fn: () => {} },
        { name: 'B', timeoutMs: 1000, fn: () => {} },
      ];

      const result = await coord.execute(steps);
      expect(typeof result.totalDurationMs).toBe('number');
      expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Empty steps ───────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('handles empty steps array gracefully', async () => {
      const result = await coord.execute([]);
      expect(result.success).toBe(true);
      expect(result.stepResults).toHaveLength(0);
    });

    it('isRunning is false after completion', async () => {
      await coord.execute([{ name: 'A', timeoutMs: 100, fn: () => {} }]);
      expect(coord.isRunning).toBe(false);
      expect(coord.isCompleted).toBe(true);
    });
  });
});
