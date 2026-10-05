// ─── FluenzyAI — Unit Tests: AudioPlaybackManager ───────────────────────────
// Tests the single-speaker guarantee (turn-ID arbitration).
// Run with: npx jest src/lib/interview/audio/__tests__/AudioPlaybackManager.test.ts
//
// NOTE: AudioContext is mocked — these tests run in Node.js (Jest/jsdom).

import { AudioPlaybackManager, type PlaybackEvent, type ScheduleResult } from '../AudioPlaybackManager';

// ── Minimal AudioBuffer mock ──────────────────────────────────────────────────
const createMockBuffer = (durationSec = 0.1): AudioBuffer =>
  ({
    duration: durationSec,
    sampleRate: 24000,
    length: Math.floor(durationSec * 24000),
    numberOfChannels: 1,
    getChannelData: jest.fn(() => new Float32Array(Math.floor(durationSec * 24000))),
    copyFromChannel: jest.fn(),
    copyToChannel: jest.fn(),
  } as unknown as AudioBuffer);

// ── AudioBufferSourceNode mock ───────────────────────────────────────────────
const createMockSourceNode = () => {
  const node = {
    buffer: null as AudioBuffer | null,
    onended: null as (() => void) | null,
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn().mockImplementation(function (this: any) {
      // Simulate stop → triggers onended
      if (this.onended) this.onended();
    }),
  };
  return node;
};

// ── AudioContext mock ─────────────────────────────────────────────────────────
const createMockAudioContext = () => {
  const sourceNodes: ReturnType<typeof createMockSourceNode>[] = [];
  return {
    state: 'running' as AudioContextState,
    currentTime: 0,
    destination: {},
    resume: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    createBufferSource: jest.fn().mockImplementation(() => {
      const node = createMockSourceNode();
      sourceNodes.push(node);
      return node;
    }),
    _sourceNodes: sourceNodes,
  };
};

// ── Global mock ───────────────────────────────────────────────────────────────
let mockCtx: ReturnType<typeof createMockAudioContext>;

beforeEach(() => {
  mockCtx = createMockAudioContext();
  global.AudioContext = jest.fn().mockImplementation(() => mockCtx) as any;
});

// ─────────────────────────────────────────────────────────────────────────────

describe('AudioPlaybackManager', () => {
  let mgr: AudioPlaybackManager;
  const SESSION_ID = 'SID_001';
  const TURN_1 = 'TURN_001';
  const TURN_2 = 'TURN_002';

  beforeEach(() => {
    mgr = new AudioPlaybackManager();
    mgr.init(24000);
  });

  afterEach(async () => {
    await mgr.close();
  });

  // ── Initialization ────────────────────────────────────────────────────────
  describe('initialization', () => {
    it('creates AudioContext via init()', () => {
      expect(global.AudioContext).toHaveBeenCalledWith({ sampleRate: 24000 });
      expect(mgr.audioContext).toBeTruthy();
    });

    it('does not create duplicate AudioContext on second init()', () => {
      mgr.init(24000);
      expect(global.AudioContext).toHaveBeenCalledTimes(1);
    });
  });

  // ── Single Speaker Guarantee ──────────────────────────────────────────────
  describe('single speaker guarantee — THE core invariant', () => {
    it('rejects audio chunks from a different turnId (stale turn)', () => {
      mgr.startTurn(SESSION_ID, TURN_1);
      const buf = createMockBuffer(0.1);
      const result1: ScheduleResult = mgr.scheduleChunk(SESSION_ID, TURN_1, buf);
      expect(result1).toBe('scheduled');

      // Start new turn (old turn now stale)
      mgr.startTurn(SESSION_ID, TURN_2);

      // Chunk from TURN_1 arrives AFTER TURN_2 started — must be rejected
      const result2: ScheduleResult = mgr.scheduleChunk(SESSION_ID, TURN_1, buf);
      expect(result2).toBe('rejected_stale_turn');
    });

    it('rejects audio chunks from wrong session (stale callback)', () => {
      mgr.startTurn(SESSION_ID, TURN_1);
      const buf = createMockBuffer(0.1);
      const result = mgr.scheduleChunk('WRONG_SESSION_ID', TURN_1, buf);
      expect(result).toBe('rejected_wrong_session');
    });

    it('correctly schedules multiple chunks for the same turn', () => {
      mgr.startTurn(SESSION_ID, TURN_1);
      const results = [
        mgr.scheduleChunk(SESSION_ID, TURN_1, createMockBuffer(0.1)),
        mgr.scheduleChunk(SESSION_ID, TURN_1, createMockBuffer(0.1)),
        mgr.scheduleChunk(SESSION_ID, TURN_1, createMockBuffer(0.1)),
      ];
      expect(results.every((r) => r === 'scheduled')).toBe(true);
      expect(mgr.isSpeaking).toBe(true);
    });
  });

  // ── cancelCurrentTurn ─────────────────────────────────────────────────────
  describe('cancelCurrentTurn (barge-in)', () => {
    it('stops all active nodes', () => {
      mgr.startTurn(SESSION_ID, TURN_1);
      mgr.scheduleChunk(SESSION_ID, TURN_1, createMockBuffer(0.5));
      mgr.scheduleChunk(SESSION_ID, TURN_1, createMockBuffer(0.5));

      expect(mockCtx._sourceNodes).toHaveLength(2);

      mgr.cancelCurrentTurn();

      // All nodes should have been stopped
      mockCtx._sourceNodes.forEach((node) => {
        expect(node.stop).toHaveBeenCalled();
      });
      expect(mgr.isSpeaking).toBe(false);
    });

    it('invalidates turnId so subsequent chunks are rejected', () => {
      mgr.startTurn(SESSION_ID, TURN_1);
      mgr.cancelCurrentTurn();

      const result = mgr.scheduleChunk(SESSION_ID, TURN_1, createMockBuffer(0.1));
      expect(result).toBe('rejected_stale_turn');
    });

    it('is idempotent — safe to call multiple times', () => {
      mgr.startTurn(SESSION_ID, TURN_1);
      mgr.cancelCurrentTurn();
      expect(() => mgr.cancelCurrentTurn()).not.toThrow();
    });
  });

  // ── New turn cancels old turn automatically ───────────────────────────────
  describe('startTurn cancels previous turn', () => {
    it('starting a new turn cancels the previous one', () => {
      const events: PlaybackEvent[] = [];
      mgr.addListener((e) => events.push(e));

      mgr.startTurn(SESSION_ID, TURN_1);
      mgr.scheduleChunk(SESSION_ID, TURN_1, createMockBuffer(0.5));

      // Start new turn — should cancel TURN_1
      mgr.startTurn(SESSION_ID, TURN_2);

      const cancelEvent = events.find(
        (e) => e.type === 'TURN_CANCELLED' && e.turnId === TURN_1,
      );
      expect(cancelEvent).toBeDefined();
    });
  });

  // ── Events ────────────────────────────────────────────────────────────────
  describe('events', () => {
    it('emits TURN_STARTED on startTurn', () => {
      const events: PlaybackEvent[] = [];
      mgr.addListener((e) => events.push(e));

      mgr.startTurn(SESSION_ID, TURN_1);

      expect(events[0]).toMatchObject({ type: 'TURN_STARTED', turnId: TURN_1 });
    });

    it('emits CHUNK_SCHEDULED on successful scheduleChunk', () => {
      const events: PlaybackEvent[] = [];
      mgr.addListener((e) => events.push(e));

      mgr.startTurn(SESSION_ID, TURN_1);
      mgr.scheduleChunk(SESSION_ID, TURN_1, createMockBuffer(0.1));

      const chunkEvent = events.find((e) => e.type === 'CHUNK_SCHEDULED');
      expect(chunkEvent).toBeDefined();
      expect((chunkEvent as any).turnId).toBe(TURN_1);
    });

    it('emits CHUNK_REJECTED on stale chunk', () => {
      const events: PlaybackEvent[] = [];
      mgr.addListener((e) => events.push(e));

      mgr.startTurn(SESSION_ID, TURN_1);
      mgr.startTurn(SESSION_ID, TURN_2); // invalidates TURN_1

      mgr.scheduleChunk(SESSION_ID, TURN_1, createMockBuffer(0.1));

      const rejectedEvent = events.find((e) => e.type === 'CHUNK_REJECTED');
      expect(rejectedEvent).toBeDefined();
    });

    it('listener unsubscribe works', () => {
      const events: PlaybackEvent[] = [];
      const unsub = mgr.addListener((e) => events.push(e));

      mgr.startTurn(SESSION_ID, TURN_1);
      unsub();
      mgr.startTurn(SESSION_ID, TURN_2);

      // Only events before unsub
      expect(events).toHaveLength(1);
    });
  });

  // ── Scheduling order (nextStartTime) ──────────────────────────────────────
  describe('scheduling', () => {
    it('schedules chunks in sequence (next chunk starts after previous ends)', () => {
      mgr.startTurn(SESSION_ID, TURN_1, 0);

      const buf1 = createMockBuffer(0.5);
      const buf2 = createMockBuffer(0.3);
      mgr.scheduleChunk(SESSION_ID, TURN_1, buf1);
      mgr.scheduleChunk(SESSION_ID, TURN_1, buf2);

      const nodes = mockCtx._sourceNodes;
      expect(nodes).toHaveLength(2);

      const t1 = (nodes[0].start as jest.Mock).mock.calls[0][0] as number;
      const t2 = (nodes[1].start as jest.Mock).mock.calls[0][0] as number;

      // Second chunk should start after the first
      expect(t2).toBeGreaterThanOrEqual(t1 + buf1.duration - 0.001);
    });
  });

  // ── Close ─────────────────────────────────────────────────────────────────
  describe('close', () => {
    it('closes AudioContext and resets state', async () => {
      mgr.startTurn(SESSION_ID, TURN_1);
      await mgr.close();
      expect(mockCtx.close).toHaveBeenCalled();
      expect(mgr.audioContext).toBeNull();
      expect(mgr.isSpeaking).toBe(false);
    });

    it('is safe to call close() twice', async () => {
      await mgr.close();
      await expect(mgr.close()).resolves.not.toThrow();
    });
  });
});
