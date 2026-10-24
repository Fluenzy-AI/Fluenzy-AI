/**
 * SpeechStateGuard — Comprehensive Regression Tests
 *
 * Tests the 12 invariants and 10 scenario tests from the P0 bug report:
 *   "AI remains in LISTENING when candidate is silent"
 *
 * Coverage:
 *   - All 12 required invariants
 *   - 10 regression scenarios
 *   - Hysteresis (start/end frame counting)
 *   - Hard stale-state expiry via reconcile()
 *   - lastConfirmedCandidateSpeechAt only refreshed by genuine candidate frames
 *   - AI echo must never trigger candidate speaking
 *   - Background speech must never trigger candidate speaking
 *   - Music/noise must never trigger candidate speaking
 *   - STT pending must not keep candidateSpeaking=true
 *   - Microphone enabled != candidate speaking
 *   - Thinking pause does not interrupt answer
 *   - Genuine answer completion does eventually generate next question
 */

import { SpeechStateGuard, SpeechGuardFrame } from '../SpeechStateGuard';

// ─── Helper builders ──────────────────────────────────────────────────────────

const silentFrame = (overrides: Partial<SpeechGuardFrame> = {}): SpeechGuardFrame => ({
  isCandidateSpeech:   false,
  isCalibrating:       false,
  rawVadSpeechActive:  false,
  isAiEcho:            false,
  isBackgroundSpeech:  false,
  isBackgroundAudio:   false,
  aiCurrentlySpeaking: false,
  ...overrides,
});

const candidateFrame = (overrides: Partial<SpeechGuardFrame> = {}): SpeechGuardFrame => ({
  isCandidateSpeech:   true,
  isCalibrating:       false,
  rawVadSpeechActive:  true,
  isAiEcho:            false,
  isBackgroundSpeech:  false,
  isBackgroundAudio:   false,
  aiCurrentlySpeaking: false,
  ...overrides,
});

const backgroundSpeechFrame = (): SpeechGuardFrame => ({
  isCandidateSpeech:   false,
  isCalibrating:       false,
  rawVadSpeechActive:  true,   // VAD might fire but ASIE classifies as background
  isAiEcho:            false,
  isBackgroundSpeech:  true,
  isBackgroundAudio:   false,
  aiCurrentlySpeaking: false,
});

const musicFrame = (): SpeechGuardFrame => ({
  isCandidateSpeech:   false,
  isCalibrating:       false,
  rawVadSpeechActive:  false,
  isAiEcho:            false,
  isBackgroundSpeech:  false,
  isBackgroundAudio:   true,
  aiCurrentlySpeaking: false,
});

const aiEchoFrame = (): SpeechGuardFrame => ({
  isCandidateSpeech:   false,
  isCalibrating:       false,
  rawVadSpeechActive:  false,
  isAiEcho:            true,
  isBackgroundSpeech:  false,
  isBackgroundAudio:   false,
  aiCurrentlySpeaking: true,
});

const mechanicalNoiseFrame = (): SpeechGuardFrame => silentFrame({
  isBackgroundAudio: true,  // fan/AC/traffic → classified as background audio
});

// Feed N identical frames to the guard
function feedN(guard: SpeechStateGuard, frame: SpeechGuardFrame, n: number): boolean {
  let result = false;
  for (let i = 0; i < n; i++) result = guard.feedFrame(frame);
  return result;
}

// ─── INVARIANT TESTS ─────────────────────────────────────────────────────────

describe('SpeechStateGuard — 12 Invariants', () => {

  // INVARIANT 1: No candidate audio → candidateSpeaking MUST eventually become false
  it('INV-1: no candidate audio → candidateSpeaking=false', () => {
    const guard = new SpeechStateGuard();
    // Feed many silent frames
    feedN(guard, silentFrame(), 20);
    expect(guard.candidateSpeaking).toBe(false);
  });

  // INVARIANT 2: Candidate silent for extended period → AI must not remain in listening
  it('INV-2: extended silence → reconcile() expires any stale speaking state', () => {
    const guard = new SpeechStateGuard();
    // Manually start speaking via frames
    feedN(guard, candidateFrame(), 3);
    expect(guard.candidateSpeaking).toBe(true);

    // Now feed silent frames to trigger SPEECH_END hysteresis
    feedN(guard, silentFrame(), 5);
    expect(guard.candidateSpeaking).toBe(false);

    // Even if we simulate stale state by not calling feedFrame:
    // reconcile() will expire it after 2500ms
    const guard2 = new SpeechStateGuard();
    feedN(guard2, candidateFrame(), 3);
    expect(guard2.candidateSpeaking).toBe(true);

    // Simulate 3000ms passing without any frames
    jest.useFakeTimers();
    jest.setSystemTime(Date.now() + 3000);
    const state = guard2.reconcile();
    jest.useRealTimers();

    expect(state.candidateSpeaking).toBe(false);
    expect(state.staleSpeechExpired).toBe(true);
  });

  // INVARIANT 3: AI echo only → candidateSpeaking MUST remain false
  it('INV-3: AI echo only → candidateSpeaking=false', () => {
    const guard = new SpeechStateGuard();
    feedN(guard, aiEchoFrame(), 10);
    expect(guard.candidateSpeaking).toBe(false);
  });

  // INVARIANT 4: Background speech only → candidateSpeaking MUST remain false
  it('INV-4: background speech only → candidateSpeaking=false', () => {
    const guard = new SpeechStateGuard();
    feedN(guard, backgroundSpeechFrame(), 10);
    expect(guard.candidateSpeaking).toBe(false);
  });

  // INVARIANT 5: Music only → candidateSpeaking MUST remain false
  it('INV-5: music only → candidateSpeaking=false', () => {
    const guard = new SpeechStateGuard();
    feedN(guard, musicFrame(), 10);
    expect(guard.candidateSpeaking).toBe(false);
  });

  // INVARIANT 6: Fan/AC/traffic only → candidateSpeaking MUST remain false
  it('INV-6: mechanical noise only → candidateSpeaking=false', () => {
    const guard = new SpeechStateGuard();
    feedN(guard, mechanicalNoiseFrame(), 10);
    expect(guard.candidateSpeaking).toBe(false);
  });

  // INVARIANT 7: STT pending alone → candidateSpeaking MUST NOT remain true forever
  // SpeechStateGuard does not depend on STT; it uses audio frames only.
  // Without genuine audio frames, candidateSpeaking decays to false.
  it('INV-7: STT pending but no audio frames → candidateSpeaking decays to false', () => {
    const guard = new SpeechStateGuard();
    // Start speaking
    feedN(guard, candidateFrame(), 3);
    expect(guard.candidateSpeaking).toBe(true);
    // STT hasn't arrived yet. But audio stopped (candidate silent).
    feedN(guard, silentFrame(), 5); // SPEECH_END hysteresis (3 frames needed)
    expect(guard.candidateSpeaking).toBe(false);
  });

  // INVARIANT 8: Microphone enabled ≠ candidate speaking
  it('INV-8: mic enabled with silent audio → candidateSpeaking=false', () => {
    const guard = new SpeechStateGuard();
    // Mic is on but candidate is silent (raw VAD=false, ASIE decision=SILENCE)
    feedN(guard, silentFrame({ rawVadSpeechActive: false }), 30);
    expect(guard.candidateSpeaking).toBe(false);
  });

  // INVARIANT 9: Candidate speech ending → answer finalization can start
  it('INV-9: speech → silence transitions correctly through SPEECH_ENDING', () => {
    const guard = new SpeechStateGuard();
    feedN(guard, candidateFrame(), 3);
    expect(guard.candidateSpeaking).toBe(true);

    // 1-2 silent frames: NOT yet ended (hysteresis protecting thinking pause)
    feedN(guard, silentFrame(), 2);
    expect(guard.candidateSpeaking).toBe(true); // still in SPEECH_ENDING hysteresis

    // 3+ silent frames: ended
    feedN(guard, silentFrame(), 1);
    expect(guard.candidateSpeaking).toBe(false); // now SILENT
  });

  // INVARIANT 10: Candidate actually speaking → candidateSpeaking=true (AI must not interrupt)
  it('INV-10: genuine candidate speech → candidateSpeaking=true', () => {
    const guard = new SpeechStateGuard();
    feedN(guard, candidateFrame(), 3);
    expect(guard.candidateSpeaking).toBe(true);
  });

  // INVARIANT 11: Thinking pause → AI must NOT interrupt (candidateSpeaking remains true)
  it('INV-11: thinking pause (1-2 silent frames) does not end speech', () => {
    const guard = new SpeechStateGuard();
    feedN(guard, candidateFrame(), 3);
    // Simulate 1 frame of silence (thinking pause ~256ms)
    guard.feedFrame(silentFrame());
    expect(guard.candidateSpeaking).toBe(true); // 1 negative frame, need 3 to end
    // Simulate 2nd silence frame
    guard.feedFrame(silentFrame());
    expect(guard.candidateSpeaking).toBe(true); // 2 negative frames, still need 1 more
    // Resume speaking
    guard.feedFrame(candidateFrame()); // positive frame resets negative counter
    expect(guard.candidateSpeaking).toBe(true);
  });

  // INVARIANT 12: Genuine answer completion → handled by TTE (guard just clears speech)
  it('INV-12: after speech ends guard correctly reports candidateSpeaking=false for TTE', () => {
    const guard = new SpeechStateGuard();
    // Speak then go silent
    feedN(guard, candidateFrame(), 3);
    expect(guard.candidateSpeaking).toBe(true);
    feedN(guard, silentFrame(), 5);
    expect(guard.candidateSpeaking).toBe(false);
    // Guard state is now clear — TTE can proceed to ANSWER_COMPLETE
    const state = guard.reconcile();
    expect(state.candidateSpeaking).toBe(false);
    expect(state.staleSpeechExpired).toBe(false);
  });
});

// ─── SCENARIO TESTS ──────────────────────────────────────────────────────────

describe('SpeechStateGuard — 10 Regression Scenarios', () => {

  // TEST 1: Complete silence for 20+ seconds
  it('TEST-1: 20s complete silence → candidateSpeaking=false throughout', () => {
    const guard = new SpeechStateGuard();
    // 20 seconds / 256ms per frame = ~78 frames
    feedN(guard, silentFrame(), 78);
    expect(guard.candidateSpeaking).toBe(false);

    // reconcile() should also report false (no stale state to expire)
    const state = guard.reconcile();
    expect(state.candidateSpeaking).toBe(false);
    expect(state.staleSpeechExpired).toBe(false);
  });

  // TEST 2: Candidate speaks then stops
  it('TEST-2: speech → silence transitions correctly', () => {
    const guard = new SpeechStateGuard();

    // SPEAKING: 3+ positive frames
    feedN(guard, candidateFrame(), 4);
    expect(guard.candidateSpeaking).toBe(true);

    // SPEECH_ENDING: 1-2 negative frames (hysteresis prevents premature end)
    guard.feedFrame(silentFrame());
    guard.feedFrame(silentFrame());
    expect(guard.candidateSpeaking).toBe(true); // still true

    // SILENT: 3rd negative frame triggers SPEECH_END
    guard.feedFrame(silentFrame());
    expect(guard.candidateSpeaking).toBe(false);
  });

  // TEST 3: Background speaker while candidate silent
  it('TEST-3: background person speaking does not set candidateSpeaking=true', () => {
    const guard = new SpeechStateGuard();
    // Many background speech frames
    feedN(guard, backgroundSpeechFrame(), 20);
    expect(guard.candidateSpeaking).toBe(false);
    // lastConfirmedAt was never set by background speech
    expect(guard.lastConfirmedAt).toBe(0);
  });

  // TEST 4: Music only
  it('TEST-4: music detected → candidateSpeaking=false always', () => {
    const guard = new SpeechStateGuard();
    feedN(guard, musicFrame(), 30);
    expect(guard.candidateSpeaking).toBe(false);
    expect(guard.lastConfirmedAt).toBe(0);
  });

  // TEST 5: AI echo only
  it('TEST-5: AI echo → candidateSpeaking=false, lastConfirmedAt never refreshed', () => {
    const guard = new SpeechStateGuard();
    const before = guard.lastConfirmedAt;
    feedN(guard, aiEchoFrame(), 20);
    expect(guard.candidateSpeaking).toBe(false);
    expect(guard.lastConfirmedAt).toBe(before); // never refreshed by echo
  });

  // TEST 6: Fan/AC mechanical noise
  it('TEST-6: fan/AC noise → candidateSpeaking=false', () => {
    const guard = new SpeechStateGuard();
    feedN(guard, mechanicalNoiseFrame(), 40);
    expect(guard.candidateSpeaking).toBe(false);
  });

  // TEST 7: Short thinking pause (candidate resumes after 1-2 silent frames)
  it('TEST-7: thinking pause (1-2 frames) does not interrupt', () => {
    const guard = new SpeechStateGuard();
    feedN(guard, candidateFrame(), 3);
    expect(guard.candidateSpeaking).toBe(true);

    // 2 silent frames = ~512ms pause (thinking) — must NOT end speech
    guard.feedFrame(silentFrame());
    guard.feedFrame(silentFrame());
    expect(guard.candidateSpeaking).toBe(true);

    // Resume
    feedN(guard, candidateFrame(), 3);
    expect(guard.candidateSpeaking).toBe(true);
  });

  // TEST 8: Candidate finishes answer normally
  it('TEST-8: complete answer cycle: start → speak → stop → silent', () => {
    const guard = new SpeechStateGuard();
    // Start speaking
    feedN(guard, candidateFrame(), 3);
    expect(guard.candidateSpeaking).toBe(true);
    const speakTime = guard.lastConfirmedAt;
    expect(speakTime).toBeGreaterThan(0);

    // Stop (silence end hysteresis)
    feedN(guard, silentFrame(), 3);
    expect(guard.candidateSpeaking).toBe(false);

    // Guard state ready for TTE to proceed to ANSWER_COMPLETE
    const state = guard.reconcile();
    expect(state.candidateSpeaking).toBe(false);
    expect(state.msSinceLastConfirmedSpeech).toBeGreaterThanOrEqual(0);
  });

  // TEST 9: STT delayed — candidateSpeaking still decays when audio stops
  it('TEST-9: STT delay does not keep candidateSpeaking=true', () => {
    const guard = new SpeechStateGuard();
    // Candidate speaks
    feedN(guard, candidateFrame(), 3);
    expect(guard.candidateSpeaking).toBe(true);

    // Audio stops (STT still pending in real system) but audio frames are silent
    feedN(guard, silentFrame(), 5);
    expect(guard.candidateSpeaking).toBe(false);
    // Guard doesn't know about STT — it just tracks audio frames
    // TTE receives candidateSpeaking=false and will wait for STT separately
  });

  // TEST 10: Long silence after short answer → stale state expires via reconcile
  it('TEST-10: long silence after answer → hard expiry via reconcile()', () => {
    const guard = new SpeechStateGuard();

    // Short answer
    feedN(guard, candidateFrame(), 3);

    // Abrupt stop (simulate stale state scenario):
    // Don't feed enough negative frames to trigger SPEECH_END normally.
    // Simulate 3000ms time jump (> 2500ms SPEECH_STATE_MAX_IDLE_MS)
    jest.useFakeTimers();
    const startTime = Date.now();
    jest.setSystemTime(startTime + 3000);

    // reconcile() must expire the stale state
    const state = guard.reconcile();
    jest.useRealTimers();

    expect(state.candidateSpeaking).toBe(false);
    expect(state.staleSpeechExpired).toBe(true);
  });
});

// ─── HYSTERESIS PRECISION TESTS ──────────────────────────────────────────────

describe('SpeechStateGuard — Hysteresis Precision', () => {

  it('requires exactly 2 positive frames to start (1 frame is not enough)', () => {
    const guard = new SpeechStateGuard();
    guard.feedFrame(candidateFrame()); // 1 frame
    expect(guard.candidateSpeaking).toBe(false); // not started yet

    guard.feedFrame(candidateFrame()); // 2nd frame
    expect(guard.candidateSpeaking).toBe(true);  // now started
  });

  it('requires exactly 3 negative frames to end (2 frames is not enough)', () => {
    const guard = new SpeechStateGuard();
    feedN(guard, candidateFrame(), 3);
    expect(guard.candidateSpeaking).toBe(true);

    guard.feedFrame(silentFrame()); // 1 negative
    expect(guard.candidateSpeaking).toBe(true);

    guard.feedFrame(silentFrame()); // 2 negative
    expect(guard.candidateSpeaking).toBe(true);

    guard.feedFrame(silentFrame()); // 3 negative → SPEECH_END
    expect(guard.candidateSpeaking).toBe(false);
  });

  it('single noise spike (1 frame) does not trigger speech start', () => {
    const guard = new SpeechStateGuard();
    guard.feedFrame(candidateFrame()); // noise spike
    expect(guard.candidateSpeaking).toBe(false);
    guard.feedFrame(silentFrame());    // returns to silent
    expect(guard.candidateSpeaking).toBe(false);
  });

  it('positive frame resets negative counter (resume after thinking pause)', () => {
    const guard = new SpeechStateGuard();
    feedN(guard, candidateFrame(), 3);
    guard.feedFrame(silentFrame()); // 1 negative
    guard.feedFrame(silentFrame()); // 2 negative
    guard.feedFrame(candidateFrame()); // positive → resets negative counter to 0
    guard.feedFrame(silentFrame()); // 1 negative again (not 3, won't end)
    guard.feedFrame(silentFrame()); // 2 negative
    expect(guard.candidateSpeaking).toBe(true); // still true (counter reset)
    guard.feedFrame(silentFrame()); // 3rd consecutive negative → now ends
    expect(guard.candidateSpeaking).toBe(false);
  });

  it('negative frame resets positive counter (cannot accumulate across gaps)', () => {
    const guard = new SpeechStateGuard();
    guard.feedFrame(candidateFrame()); // 1 positive
    guard.feedFrame(silentFrame());    // reset
    guard.feedFrame(candidateFrame()); // 1 positive again (not 2)
    expect(guard.candidateSpeaking).toBe(false); // not started (reset happened)
  });
});

// ─── STALE EXPIRY PRECISION ───────────────────────────────────────────────────

describe('SpeechStateGuard — Stale Expiry via reconcile()', () => {

  it('reconcile() does NOT fire when within 2500ms idle window', () => {
    jest.useFakeTimers();
    const guard = new SpeechStateGuard();
    feedN(guard, candidateFrame(), 3);
    expect(guard.candidateSpeaking).toBe(true);

    // 1000ms later — still within window
    jest.setSystemTime(Date.now() + 1000);
    const state = guard.reconcile();
    expect(state.candidateSpeaking).toBe(true);
    expect(state.staleSpeechExpired).toBe(false);

    jest.useRealTimers();
  });

  it('reconcile() fires exactly when crossing 2500ms threshold', () => {
    jest.useFakeTimers();
    const guard = new SpeechStateGuard();
    feedN(guard, candidateFrame(), 3);

    // 2501ms later — just past the limit
    jest.setSystemTime(Date.now() + 2501);
    const state = guard.reconcile();
    expect(state.candidateSpeaking).toBe(false);
    expect(state.staleSpeechExpired).toBe(true);

    jest.useRealTimers();
  });

  it('reconcile() is idempotent — calling twice does not re-fire expired flag', () => {
    jest.useFakeTimers();
    const guard = new SpeechStateGuard();
    feedN(guard, candidateFrame(), 3);
    jest.setSystemTime(Date.now() + 3000);

    const state1 = guard.reconcile();
    expect(state1.staleSpeechExpired).toBe(true);

    // Second call — staleSpeechExpired should reset to false
    const state2 = guard.reconcile();
    expect(state2.staleSpeechExpired).toBe(false);
    expect(state2.candidateSpeaking).toBe(false);

    jest.useRealTimers();
  });

  it('reconcile() on already-silent guard is a no-op', () => {
    const guard = new SpeechStateGuard();
    // Never spoke — guard is silent
    const state = guard.reconcile();
    expect(state.candidateSpeaking).toBe(false);
    expect(state.staleSpeechExpired).toBe(false);
  });
});

// ─── lastConfirmedCandidateSpeechAt INTEGRITY ────────────────────────────────

describe('SpeechStateGuard — lastConfirmedAt integrity', () => {

  it('lastConfirmedAt is 0 before any candidate speech', () => {
    const guard = new SpeechStateGuard();
    feedN(guard, silentFrame(), 10);
    expect(guard.lastConfirmedAt).toBe(0);
    expect(guard.msSinceLastConfirmedSpeech).toBe(Infinity);
  });

  it('lastConfirmedAt is NOT updated by AI echo', () => {
    const guard = new SpeechStateGuard();
    const before = Date.now();
    feedN(guard, aiEchoFrame(), 10);
    expect(guard.lastConfirmedAt).toBe(0); // never refreshed
  });

  it('lastConfirmedAt is NOT updated by background speech', () => {
    const guard = new SpeechStateGuard();
    feedN(guard, backgroundSpeechFrame(), 10);
    expect(guard.lastConfirmedAt).toBe(0);
  });

  it('lastConfirmedAt IS updated by genuine candidate speech', () => {
    const guard = new SpeechStateGuard();
    const before = Date.now();
    feedN(guard, candidateFrame(), 3);
    expect(guard.lastConfirmedAt).toBeGreaterThanOrEqual(before);
  });

  it('lastConfirmedAt preserved after forceSilent (allows TTE to measure silence)', () => {
    const guard = new SpeechStateGuard();
    feedN(guard, candidateFrame(), 3);
    const confirmedAt = guard.lastConfirmedAt;
    expect(confirmedAt).toBeGreaterThan(0);

    guard.forceSilent('test');
    expect(guard.candidateSpeaking).toBe(false);
    expect(guard.lastConfirmedAt).toBe(confirmedAt); // preserved
  });
});

// ─── forceSilent / reset ──────────────────────────────────────────────────────

describe('SpeechStateGuard — forceSilent and reset', () => {

  it('forceSilent immediately sets candidateSpeaking=false', () => {
    const guard = new SpeechStateGuard();
    feedN(guard, candidateFrame(), 3);
    expect(guard.candidateSpeaking).toBe(true);
    guard.forceSilent('test');
    expect(guard.candidateSpeaking).toBe(false);
  });

  it('reset() clears all state including lastConfirmedAt', () => {
    const guard = new SpeechStateGuard();
    feedN(guard, candidateFrame(), 5);
    expect(guard.candidateSpeaking).toBe(true);
    expect(guard.lastConfirmedAt).toBeGreaterThan(0);

    guard.reset();
    expect(guard.candidateSpeaking).toBe(false);
    expect(guard.lastConfirmedAt).toBe(0);
  });

  it('can restart speaking after reset()', () => {
    const guard = new SpeechStateGuard();
    feedN(guard, candidateFrame(), 3);
    guard.reset();
    expect(guard.candidateSpeaking).toBe(false);

    // Start again
    feedN(guard, candidateFrame(), 2);
    expect(guard.candidateSpeaking).toBe(true);
  });
});
