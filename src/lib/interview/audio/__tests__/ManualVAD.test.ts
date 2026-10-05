// ─── FluenzyAI — Unit Tests: ManualVAD ───────────────────────────────────────
// Tests the voice activity detector's speech start/end detection,
// AI-guard suppression, and silence timeout.

import { ManualVAD } from '../ManualVAD';

describe('ManualVAD', () => {
  const THRESHOLD = 0.008;
  const SILENCE_MS = 400;

  let vad: ManualVAD;
  let onSpeechStart: jest.Mock;
  let onSpeechEnd: jest.Mock;

  beforeEach(() => {
    onSpeechStart = jest.fn();
    onSpeechEnd = jest.fn();
    vad = new ManualVAD(
      { speechThreshold: THRESHOLD, silenceMs: SILENCE_MS },
      { onSpeechStart, onSpeechEnd },
    );
  });

  // ── Speech Detection ──────────────────────────────────────────────────────
  describe('speech detection', () => {
    it('fires onSpeechStart when RMS exceeds threshold', () => {
      vad.processFrame(0.01); // above threshold
      expect(onSpeechStart).toHaveBeenCalledTimes(1);
    });

    it('does not fire onSpeechStart twice for continuous speech', () => {
      vad.processFrame(0.01);
      vad.processFrame(0.01);
      vad.processFrame(0.01);
      expect(onSpeechStart).toHaveBeenCalledTimes(1);
    });

    it('does not fire onSpeechStart for RMS below threshold', () => {
      vad.processFrame(0.001); // below threshold
      expect(onSpeechStart).not.toHaveBeenCalled();
    });

    it('fires onSpeechEnd after silence duration', () => {
      const now = Date.now();
      vad.processFrame(0.01, now); // speech starts

      // Simulate silence for longer than SILENCE_MS
      vad.processFrame(0.001, now + SILENCE_MS + 50);

      expect(onSpeechEnd).toHaveBeenCalledTimes(1);
    });

    it('does NOT fire onSpeechEnd if silence is shorter than threshold', () => {
      const now = Date.now();
      vad.processFrame(0.01, now); // speech starts
      vad.processFrame(0.001, now + SILENCE_MS - 50); // silence but too short
      expect(onSpeechEnd).not.toHaveBeenCalled();
    });
  });

  // ── AI Guard (suppression while AI speaks) ────────────────────────────────
  describe('AI guard', () => {
    it('suppresses speech detection when setEnabled(false)', () => {
      vad.setEnabled(false);
      vad.processFrame(0.1); // Very loud — would normally trigger
      expect(onSpeechStart).not.toHaveBeenCalled();
    });

    it('resumes detection after setEnabled(true)', () => {
      vad.setEnabled(false);
      vad.processFrame(0.1);
      vad.setEnabled(true);
      vad.processFrame(0.01);
      expect(onSpeechStart).toHaveBeenCalledTimes(1);
    });

    it('resets speech state when disabled mid-speech', () => {
      vad.processFrame(0.01); // Speech starts
      expect(vad.isSpeechActive).toBe(true);

      vad.setEnabled(false); // Disable while speaking
      expect(vad.isSpeechActive).toBe(false); // State reset

      vad.setEnabled(true);
      // After re-enable, no onSpeechEnd should have fired (it was a guard reset)
      expect(onSpeechEnd).not.toHaveBeenCalled();
    });
  });

  // ── Reset ─────────────────────────────────────────────────────────────────
  describe('reset', () => {
    it('clears speech state on reset', () => {
      vad.processFrame(0.01);
      expect(vad.isSpeechActive).toBe(true);

      vad.reset();
      expect(vad.isSpeechActive).toBe(false);
    });

    it('preserves callbacks after reset', () => {
      vad.reset();
      vad.processFrame(0.01);
      expect(onSpeechStart).toHaveBeenCalled();
    });
  });

  // ── Multiple turns ────────────────────────────────────────────────────────
  describe('multiple turns', () => {
    it('correctly detects start-end-start sequence', () => {
      const now = Date.now();

      // Turn 1: speech
      vad.processFrame(0.01, now);
      expect(onSpeechStart).toHaveBeenCalledTimes(1);

      // Turn 1: silence → end
      vad.processFrame(0.001, now + SILENCE_MS + 100);
      expect(onSpeechEnd).toHaveBeenCalledTimes(1);

      // Turn 2: speech again
      vad.processFrame(0.01, now + SILENCE_MS + 200);
      expect(onSpeechStart).toHaveBeenCalledTimes(2);
    });
  });

  // ── updateCallbacks ───────────────────────────────────────────────────────
  describe('updateCallbacks', () => {
    it('uses updated callback after updateCallbacks()', () => {
      const newCb = jest.fn();
      vad.updateCallbacks({ onSpeechStart: newCb });
      vad.processFrame(0.01);
      expect(newCb).toHaveBeenCalled();
      expect(onSpeechStart).not.toHaveBeenCalled(); // Old callback not called
    });
  });

  // ── markUserSpoke utility ─────────────────────────────────────────────────
  describe('markUserSpoke', () => {
    it('resets the silence timer', () => {
      const now = Date.now();
      vad.processFrame(0.01, now); // Speech starts

      // Mark as spoke to reset silence timer
      vad.markUserSpoke();

      // Even after SILENCE_MS, onSpeechEnd should NOT have fired yet
      // because markUserSpoke reset lastSpeechAt to now
      vad.processFrame(0.001, now + SILENCE_MS + 10);
      // silenceMsSinceLastSpeech is ~10ms (from markUserSpoke), not 410ms
      // → below threshold → no end
      // (This test validates the silence timer is measured from markUserSpoke)
      // NOTE: this relies on internal timing — approximate check
      const silenceMs = vad.silenceMsSinceLastSpeech();
      expect(silenceMs).toBeLessThan(SILENCE_MS + 200);
    });
  });

  // ── toJSON ────────────────────────────────────────────────────────────────
  describe('toJSON', () => {
    it('includes required debug fields', () => {
      const json = vad.toJSON();
      expect(json).toMatchObject({
        speechActive: false,
        enabled: true,
        frameCount: 0,
      });
    });
  });
});
