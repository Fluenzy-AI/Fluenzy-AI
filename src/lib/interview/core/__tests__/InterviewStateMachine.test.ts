// ─── FluenzyAI — Unit Tests: InterviewStateMachine ──────────────────────────
// Run with: npx jest src/lib/interview/core/__tests__/InterviewStateMachine.test.ts

import { InterviewStateMachine, type InterviewState } from '../InterviewStateMachine';

describe('InterviewStateMachine', () => {
  let sm: InterviewStateMachine;

  beforeEach(() => {
    sm = new InterviewStateMachine('test-session-001');
  });

  // ── Initial State ──────────────────────────────────────────────────────────
  describe('initial state', () => {
    it('should start in IDLE', () => {
      expect(sm.state).toBe('IDLE');
    });

    it('should not be terminal initially', () => {
      expect(sm.isTerminal).toBe(false);
    });

    it('should expose the sessionId', () => {
      expect(sm.sessionId).toBe('test-session-001');
    });
  });

  // ── Valid Transitions ──────────────────────────────────────────────────────
  describe('valid transitions', () => {
    it('IDLE → INITIALIZING → READY', () => {
      sm.transition('INITIALIZING');
      expect(sm.state).toBe('INITIALIZING');
      sm.transition('READY');
      expect(sm.state).toBe('READY');
    });

    it('READY → AI_SPEAKING → WAITING_USER → LISTENING → USER_SPEAKING → PROCESSING → GENERATING', () => {
      sm.transition('INITIALIZING');
      sm.transition('READY');
      sm.transition('AI_SPEAKING');
      sm.transition('WAITING_USER');
      sm.transition('LISTENING');
      sm.transition('USER_SPEAKING');
      sm.transition('PROCESSING');
      sm.transition('GENERATING');
      expect(sm.state).toBe('GENERATING');
    });

    it('any state → ENDING → COMPLETED', () => {
      sm.transition('INITIALIZING');
      sm.transition('READY');
      sm.transition('AI_SPEAKING');
      sm.transition('ENDING');
      expect(sm.state).toBe('ENDING');
      sm.transition('COMPLETED');
      expect(sm.state).toBe('COMPLETED');
      expect(sm.isTerminal).toBe(true);
    });

    it('AI_SPEAKING → USER_SPEAKING (barge-in)', () => {
      sm.transition('INITIALIZING');
      sm.transition('READY');
      sm.transition('AI_SPEAKING');
      sm.transition('USER_SPEAKING');
      expect(sm.state).toBe('USER_SPEAKING');
    });
  });

  // ── Invalid Transitions (must throw) ──────────────────────────────────────
  describe('invalid transitions', () => {
    it('IDLE → PROCESSING should throw', () => {
      expect(() => sm.transition('PROCESSING')).toThrow();
      expect(sm.state).toBe('IDLE'); // State unchanged
    });

    it('AI_SPEAKING → AI_SPEAKING should throw', () => {
      sm.transition('INITIALIZING');
      sm.transition('READY');
      sm.transition('AI_SPEAKING');
      expect(() => sm.transition('AI_SPEAKING')).toThrow();
    });

    it('COMPLETED → LISTENING should throw (terminal)', () => {
      sm.transition('INITIALIZING');
      sm.transition('READY');
      sm.transition('ENDING');
      sm.transition('COMPLETED');
      expect(() => sm.transition('LISTENING')).toThrow();
    });

    it('ENDING → LISTENING should throw', () => {
      sm.transition('INITIALIZING');
      sm.transition('READY');
      sm.transition('ENDING');
      expect(() => sm.transition('LISTENING')).toThrow();
    });

    it('ENDING → GENERATING should throw', () => {
      sm.transition('INITIALIZING');
      sm.transition('READY');
      sm.transition('ENDING');
      expect(() => sm.transition('GENERATING')).toThrow();
    });
  });

  // ── tryTransition (non-throwing variant) ──────────────────────────────────
  describe('tryTransition', () => {
    it('returns true on valid transition', () => {
      const result = sm.tryTransition('INITIALIZING');
      expect(result).toBe(true);
      expect(sm.state).toBe('INITIALIZING');
    });

    it('returns false on invalid transition without throwing', () => {
      const result = sm.tryTransition('PROCESSING'); // IDLE → PROCESSING is invalid
      expect(result).toBe(false);
      expect(sm.state).toBe('IDLE'); // State unchanged
    });

    it('allows safe cleanup calls from ENDING', () => {
      sm.transition('INITIALIZING');
      sm.transition('READY');
      sm.transition('AI_SPEAKING');
      // Simulate cleanup called from multiple paths
      expect(sm.tryTransition('ENDING')).toBe(true);
      expect(sm.tryTransition('ENDING')).toBe(false); // ENDING → ENDING is invalid, no throw
      expect(sm.state).toBe('ENDING');
    });
  });

  // ── Listeners ─────────────────────────────────────────────────────────────
  describe('listeners', () => {
    it('calls listener on transition with prev and next', () => {
      const events: Array<[InterviewState, InterviewState]> = [];
      sm.addListener((prev, next) => events.push([prev, next]));

      sm.transition('INITIALIZING');
      sm.transition('READY');

      expect(events).toEqual([
        ['IDLE', 'INITIALIZING'],
        ['INITIALIZING', 'READY'],
      ]);
    });

    it('allows removing a listener via returned unsubscribe fn', () => {
      const calls: number[] = [];
      const unsub = sm.addListener(() => calls.push(1));

      sm.transition('INITIALIZING');
      unsub();
      sm.transition('READY');

      expect(calls).toHaveLength(1); // Only fired once before unsub
    });

    it('does not throw if a listener throws', () => {
      sm.addListener(() => { throw new Error('listener error'); });
      // Should not propagate the listener error
      expect(() => sm.transition('INITIALIZING')).not.toThrow();
      expect(sm.state).toBe('INITIALIZING');
    });
  });

  // ── canTransitionTo / assertState ─────────────────────────────────────────
  describe('guards', () => {
    it('canTransitionTo returns true for valid next state', () => {
      expect(sm.canTransitionTo('INITIALIZING')).toBe(true);
      expect(sm.canTransitionTo('PROCESSING')).toBe(false);
    });

    it('assertState does not throw when state matches', () => {
      expect(() => sm.assertState('IDLE')).not.toThrow();
    });

    it('assertState throws when state does not match', () => {
      expect(() => sm.assertState('AI_SPEAKING')).toThrow();
    });
  });

  // ── Idempotency of ENDING ─────────────────────────────────────────────────
  describe('graceful shutdown path', () => {
    it('tryTransition ENDING is idempotent in cleanup scenarios', () => {
      sm.transition('INITIALIZING');
      sm.transition('READY');
      // Simulate onerror + onclose both calling cleanup
      sm.transition('ENDING');
      const secondCall = sm.tryTransition('ENDING'); // Should not throw, just return false
      expect(secondCall).toBe(false);
      expect(sm.state).toBe('ENDING');
    });
  });

  // ── toJSON ─────────────────────────────────────────────────────────────────
  describe('toJSON', () => {
    it('includes required debug fields', () => {
      const json = sm.toJSON();
      expect(json).toMatchObject({
        sessionId: 'test-session-001',
        state: 'IDLE',
        transitionCount: 0,
        isTerminal: false,
      });
    });
  });
});
