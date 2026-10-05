/**
 * Unit tests: VoiceAgent post-turn finalization buffer
 *
 * Simulates all realistic Gemini Live event orderings described in the
 * P0 race analysis. Each test creates a minimal harness that mimics the
 * onmessage dispatch logic extracted from VoiceAgent.tsx.
 *
 * Cases tested:
 *   A — inputTranscription × 2, turnComplete          (normal order)
 *   B — inputTranscription, turnComplete, late STT     (race condition)
 *   C — inputTranscription, turnComplete, more STT     (full race)
 *   D — turnComplete, no user speech (AI question turn)
 *   E — turnComplete, no inputTranscription (genuine NO_SPEECH)
 *   F — End-button flush: user presses End during finalization window
 *   G — Long answer (300+ words) survives the window intact
 *   H — Turn isolation: STT for turn N+1 does NOT pollute turn N
 *   I — Hinglish text preserved verbatim
 *   J — Window extension: timer resets when late chunks keep arriving
 */

import { jest } from '@jest/globals';

// ─── Minimal harness mirroring VoiceAgent's buffer logic ────────────────────

interface HistoryEntry {
  question: string;
  answer: string;
  transcriptStatus?: string;
  timestamp: string;
}

interface PostTurnBuffer {
  entryIndex: number;
  extraAnswer: string;
  timer: ReturnType<typeof setTimeout> | null;
}

class TranscriptHarness {
  transcriptHistory: HistoryEntry[] = [];
  currentQA = { question: '', answer: '' };
  postTurnBuffer: PostTurnBuffer | null = null;
  readonly WINDOW_MS = 600;
  private finalizeLog: string[] = [];

  finalizeTurn(entryIndex: number) {
    if (this.postTurnBuffer?.entryIndex === entryIndex) {
      this.postTurnBuffer = null;
    }
    const entry = this.transcriptHistory[entryIndex];
    if (!entry) return;
    const finalAnswer = entry.answer.trim();
    if (!finalAnswer) {
      this.transcriptHistory[entryIndex] = { ...entry, transcriptStatus: 'NO_SPEECH' };
      this.finalizeLog.push(`TURN_${entryIndex}:NO_SPEECH`);
    } else {
      this.transcriptHistory[entryIndex] = { ...entry, transcriptStatus: 'FINALIZED' };
      this.finalizeLog.push(`TURN_${entryIndex}:FINALIZED`);
    }
  }

  onmessage(m: {
    inputTranscription?: string;
    outputTranscription?: string;
    turnComplete?: boolean;
  }) {
    if (m.outputTranscription) {
      this.currentQA.question += m.outputTranscription;
    }

    if (m.inputTranscription) {
      const sttText = m.inputTranscription;
      const buf = this.postTurnBuffer;

      if (buf) {
        // Late STT → back-patch committed entry
        buf.extraAnswer += sttText;
        const entry = this.transcriptHistory[buf.entryIndex];
        if (entry) {
          this.transcriptHistory[buf.entryIndex] = {
            ...entry,
            answer: entry.answer + sttText,
          };
        }
        if (buf.timer) clearTimeout(buf.timer);
        buf.timer = setTimeout(() => this.finalizeTurn(buf.entryIndex), this.WINDOW_MS);
      } else {
        this.currentQA.answer += sttText;
      }
    }

    if (m.turnComplete) {
      const completed = { ...this.currentQA, timestamp: new Date().toISOString() };
      this.transcriptHistory.push(completed);
      const entryIndex = this.transcriptHistory.length - 1;
      this.currentQA = { question: '', answer: '' };

      if (this.postTurnBuffer?.timer) {
        clearTimeout(this.postTurnBuffer.timer);
      }
      this.postTurnBuffer = {
        entryIndex,
        extraAnswer: '',
        timer: setTimeout(() => this.finalizeTurn(entryIndex), this.WINDOW_MS),
      };
    }
  }

  flushPostTurnBuffer() {
    const buf = this.postTurnBuffer;
    if (!buf) return;
    if (buf.timer) { clearTimeout(buf.timer); buf.timer = null; }
    this.postTurnBuffer = null;
  }

  getFinalLog() { return this.finalizeLog; }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

jest.useFakeTimers();

describe('VoiceAgent post-turn finalization buffer', () => {
  let h: TranscriptHarness;

  beforeEach(() => { h = new TranscriptHarness(); jest.clearAllTimers(); });
  afterEach(() => { jest.runAllTimers(); });

  test('Case A — Normal order: complete answer before turnComplete', () => {
    h.onmessage({ outputTranscription: 'Tell me about yourself.' });
    h.onmessage({ inputTranscription: 'I am ' });
    h.onmessage({ inputTranscription: 'a developer.' });
    h.onmessage({ turnComplete: true });

    expect(h.transcriptHistory).toHaveLength(1);
    expect(h.transcriptHistory[0].answer).toBe('I am a developer.');

    jest.advanceTimersByTime(700);
    expect(h.transcriptHistory[0].transcriptStatus).toBe('FINALIZED');
  });

  test('Case B — Race: turnComplete arrives before final STT chunk', () => {
    h.onmessage({ inputTranscription: 'I am ' });
    h.onmessage({ turnComplete: true }); // fires before final STT!

    expect(h.transcriptHistory[0].answer).toBe('I am ');
    expect(h.postTurnBuffer).not.toBeNull();

    jest.advanceTimersByTime(150);
    h.onmessage({ inputTranscription: 'a developer.' });

    // Back-patch must have applied
    expect(h.transcriptHistory[0].answer).toBe('I am a developer.');

    jest.advanceTimersByTime(700);
    expect(h.transcriptHistory[0].transcriptStatus).toBe('FINALIZED');
    expect(h.postTurnBuffer).toBeNull();
  });

  test('Case C — Multiple late chunks back-patched correctly', () => {
    h.onmessage({ inputTranscription: 'I ' });
    h.onmessage({ turnComplete: true });

    jest.advanceTimersByTime(100);
    h.onmessage({ inputTranscription: 'am ' });
    expect(h.transcriptHistory[0].answer).toBe('I am ');

    jest.advanceTimersByTime(100);
    h.onmessage({ inputTranscription: 'a software engineer' });
    expect(h.transcriptHistory[0].answer).toBe('I am a software engineer');

    jest.advanceTimersByTime(700);
    expect(h.transcriptHistory[0].transcriptStatus).toBe('FINALIZED');
  });

  test('Case D — AI question turn: turnComplete with no user STT → NO_SPEECH', () => {
    h.onmessage({ outputTranscription: 'Tell me about yourself.' });
    h.onmessage({ turnComplete: true });

    expect(h.transcriptHistory[0].answer).toBe('');
    jest.advanceTimersByTime(700);
    expect(h.transcriptHistory[0].transcriptStatus).toBe('NO_SPEECH');
  });

  test('Case E — Genuine NO_SPEECH: no inputTranscription at all', () => {
    h.onmessage({ turnComplete: true });
    jest.advanceTimersByTime(700);
    expect(h.transcriptHistory[0].answer).toBe('');
    expect(h.transcriptHistory[0].transcriptStatus).toBe('NO_SPEECH');
  });

  test('Case F — End-button race: flush preserves already back-patched STT', () => {
    h.onmessage({ inputTranscription: 'I worked on ' });
    h.onmessage({ turnComplete: true });
    jest.advanceTimersByTime(100);
    h.onmessage({ inputTranscription: 'FluenzyAI.' }); // late STT back-patched

    expect(h.transcriptHistory[0].answer).toBe('I worked on FluenzyAI.');

    h.flushPostTurnBuffer(); // simulate End button
    expect(h.postTurnBuffer).toBeNull();

    // Complete answer still preserved
    expect(h.transcriptHistory[0].answer).toBe('I worked on FluenzyAI.');
  });

  test('Case G — Long answer: 300+ word equivalent chunks all preserved', () => {
    const words = Array.from({ length: 60 }, (_, i) => `word${i}`);
    for (const w of words.slice(0, 50)) {
      h.onmessage({ inputTranscription: w + ' ' });
    }
    h.onmessage({ turnComplete: true });

    jest.advanceTimersByTime(50);
    for (const w of words.slice(50)) {
      h.onmessage({ inputTranscription: w + ' ' });
    }

    const expected = words.join(' ') + ' ';
    expect(h.transcriptHistory[0].answer).toBe(expected);

    jest.advanceTimersByTime(700);
    expect(h.transcriptHistory[0].transcriptStatus).toBe('FINALIZED');
  });

  test('Case H — Turn isolation: STT for turn N+1 does NOT pollute turn N', () => {
    h.onmessage({ inputTranscription: 'Answer to question one.' });
    h.onmessage({ turnComplete: true });

    jest.advanceTimersByTime(700); // window closes
    expect(h.postTurnBuffer).toBeNull();

    // Turn 1 starts
    h.onmessage({ inputTranscription: 'Answer to question two.' });

    // Must go to currentQA (turn 1), NOT back-patch turn 0
    expect(h.transcriptHistory[0].answer).toBe('Answer to question one.');
    expect(h.currentQA.answer).toBe('Answer to question two.');
  });

  test('Case I — Hinglish answer preserved verbatim', () => {
    const hinglish = 'Basically maine multiple full stack projects pe kaam kiya hai...';
    h.onmessage({ inputTranscription: hinglish });
    h.onmessage({ turnComplete: true });
    expect(h.transcriptHistory[0].answer).toBe(hinglish);
    jest.advanceTimersByTime(700);
    expect(h.transcriptHistory[0].transcriptStatus).toBe('FINALIZED');
  });

  test('Case J — Window extends when late STT keeps arriving', () => {
    h.onmessage({ inputTranscription: 'Part 1 ' });
    h.onmessage({ turnComplete: true });

    for (let i = 0; i < 5; i++) {
      jest.advanceTimersByTime(200);
      h.onmessage({ inputTranscription: `part${i + 2} ` });
      expect(h.postTurnBuffer).not.toBeNull(); // window still open
    }

    jest.advanceTimersByTime(700);
    expect(h.postTurnBuffer).toBeNull(); // window closed

    const finalAnswer = h.transcriptHistory[0].answer;
    expect(finalAnswer).toContain('Part 1 ');
    expect(finalAnswer).toContain('part6 ');
    expect(h.transcriptHistory[0].transcriptStatus).toBe('FINALIZED');
  });
});
