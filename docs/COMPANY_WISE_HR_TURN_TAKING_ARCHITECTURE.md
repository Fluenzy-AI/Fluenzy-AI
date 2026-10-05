# COMPANY_WISE_HR — Turn-Taking Architecture

## Version 2.0 | Commit: e8b57fa

---

## 1. Problem: What Was Wrong

The previous system used a **single 400ms silence timer** as the sole turn-taking decision mechanism:

```
VAD: avgLevel < threshold for 400ms
    → send activityEnd to Gemini
    → AI generates next question immediately
```

This cannot distinguish:

| Situation | Correct Response | Old Response |
|-----------|-----------------|--------------|
| Candidate thinking (2s pause) | Wait | Asked next question |
| STT still streaming (200ms delay) | Wait for STT | Treated as silence |
| Short YES/NO answer | Complete quickly | May wait too long |
| SYSTEM_DESIGN 30s explanation | Very wide tolerance | Too aggressive |
| User speaks during AI audio | Stop AI (barge-in) | AI kept talking |
| Duplicate generation race | Block second | Both fired |

---

## 2. Root Causes

| # | Root Cause | Manifestation |
|---|-----------|---------------|
| RC-1 | Single 400ms timer = sole decision engine | AI interrupts thinking pauses |
| RC-2 | No barge-in controller | AI continues speaking over user |
| RC-3 | No STT-finalisation tracking | Next Q fired before STT arrives |
| RC-4 | No per-question-type tolerance | YES_NO treated same as SYSTEM_DESIGN |
| RC-5 | No duplicate question guard | Race conditions caused repeated questions |
| RC-6 | No answer completion analysis | Turn advanced before answer was complete |
| RC-7 | 15s nudge fired regardless of context | Irrelevant AI nudge during active conversation |

---

## 3. HLD — Target Architecture

```
                        USER
                         │
                         ▼
                   MICROPHONE
                         │
                         ▼
                  AUDIOWORKLET / ScriptProcessor
                         │
                         ▼
             ┌───────────┴───────────┐
             ▼                       ▼
         RMS Energy              Audio to Gemini (PCM)
             │
             ▼
          ManualVAD
       (Speech threshold)
             │
     ┌───────┴────────┐
     ▼                ▼
Speech Start      Speech End (400ms)
     │                │
     │            activityEnd → Gemini
     │
vadSpeechActiveRef = true
sttFinalisedRef = false
speechStartAtRef = now
     │
     ▼ (Gemini Live WebSocket)
inputTranscription → sttFinalisedRef = true
     │
     ▼ (every 300ms)
┌─────────────────────────────────┐
│      TurnTakingEngine.evaluate()│
│                                 │
│  Signal 1: vadSpeechActive      │
│  Signal 2: aiSpeaking           │
│  Signal 3: silenceDurationMs    │
│  Signal 4: speechDurationMs     │
│  Signal 5: partialTranscript    │
│  Signal 6: sttFinalised         │
│  Signal 7: finalizationOpen     │
│  Signal 8: answerCompletion     │
│  Signal 9: questionType         │
│  Signal 10: generationPending   │
└────────────┬────────────────────┘
             │
             ▼
        TurnDecision
             │
    ┌────────┼────────────────┐
    ▼        ▼                ▼
USER_IS  WAIT_*        ANSWER_COMPLETE
SPEAKING  (nothing)         │
(nothing)              QuestionGate.canAskNextQuestion()
                            │
                      ┌─────┴─────┐
                      ▼           ▼
                  BLOCKED      ALLOWED
                  (reason)       │
                           Gemini generates next question
                                 │
                                 ▼
                            TTS Audio
                                 │
                                 ▼
                             USER HEARS
```

---

## 4. LLD — Three Core Engines

### 4.1 TurnTakingEngine

**File:** `src/lib/interview/core/TurnTakingEngine.ts`

Pure class. No React, no DOM, no network. Same inputs → same output.

**Evaluation priority (highest → lowest):**

```
1. INTERRUPT_AI     — user speaks while AI plays     → stopAiAudio()
2. USER_IS_SPEAKING — VAD active                     → next Q forbidden
3. SESSION_ENDING   — cleanup in progress            → all blocked
4. GENERATION_LOCK  — question already generating   → duplicate forbidden
5. WAIT_FOR_STT     — STT not finalised              → wait
6. WAIT_FOR_STT     — finalization window open       → wait
7. WAIT_FOR_USER    — AI still speaking              → wait
8. ANSWER_COMPLETE  — analysis confirmed complete    → advance turn
9. NO_ANSWER_RECOV  — hard silence + no transcript   → gentle nudge
10. WAIT_LONGER     — thinking/possible-end pause    → wait
```

**Adaptive silence thresholds (per question type):**

```
Question Type    Multiplier   Completion threshold   Hard silence
─────────────   ──────────   ────────────────────   ──────────────
GREETING          0.6x          1 800 ms               4 800 ms
YES_NO            0.6x          1 800 ms               4 800 ms
CLARIFICATION     0.8x          2 400 ms               6 400 ms
HR                0.9x          2 700 ms               7 200 ms
UNKNOWN           1.0x          3 000 ms               8 000 ms
TECHNICAL         1.2x          3 600 ms               9 600 ms
PROJECT           1.3x          3 900 ms              10 400 ms
BEHAVIORAL        1.4x          4 200 ms              11 200 ms
SYSTEM_DESIGN     1.6x          4 800 ms              12 800 ms
```

---

### 4.2 AnswerCompletionAnalyzer

**File:** `src/lib/interview/core/AnswerCompletionAnalyzer.ts`

Local heuristic analysis — runs in < 1ms, **no LLM**, called every 300ms.

**Signal pipeline:**

```
transcript text
    ├─ Empty → NO_ANSWER
    ├─ YES_NO/GREETING + any text → COMPLETE (fast path)
    ├─ Completion marker detected (that's all / to summarize / ...) → COMPLETE
    ├─ Continuation word at end (and / but / because / ...) → INCOMPLETE
    ├─ STT final + sentence ends + long enough + substance → COMPLETE
    ├─ STT final + substance + enough silence → LIKELY_COMPLETE
    ├─ Substance + sentence ends + long enough (no STT final yet) → LIKELY_COMPLETE
    ├─ Substance + insufficient speech duration → INCOMPLETE
    └─ Otherwise → UNKNOWN
```

**Output states:**

```
NO_ANSWER       — transcript empty after full silence window
INCOMPLETE      — still forming (continuation word / too short)
LIKELY_COMPLETE — probably done (TurnTakingEngine can act at POSSIBLE_END)
COMPLETE        — confirmed (TurnTakingEngine acts immediately)
UNKNOWN         — insufficient signals
```

---

### 4.3 QuestionGate

**File:** `src/lib/interview/core/QuestionGate.ts`

Single authoritative gate. **canAskNextQuestion()** returns false if ANY of:

```
USER_SPEAKING             → immediate block
AI_SPEAKING               → wait for completion
STT_PENDING               → wait for STT
TRANSCRIPT_FINALIZATION   → 600ms window open
ANSWER_ANALYSIS_PENDING   → analysis not done
SESSION_ENDING            → terminal state
GENERATION_LOCK           → duplicate prevention
DUPLICATE_QUESTION        → hash match prevents repeat
```

**Generation lifecycle:**

```
acquireGenerationLock() → returns generationId
    ↓
registerQuestion(text, generationId) → QuestionRecord
    ↓
releaseGenerationLock(generationId)
    ↓
updateDeliveryState(id, QUEUED | AUDIO_STARTED | DELIVERED | FAILED)
```

**Duplicate prevention:**
- Questions normalised: lowercase, trim, collapse whitespace, first 200 chars
- FNV-style 32-bit hash stored in Set
- Same question from any path → DUPLICATE_QUESTION block

---

## 5. State Machine

### Turn Lifecycle

```
AI_SPEAKING
    ↓ (AI audio ends / user barge-in)
LISTENING_FOR_USER
    ↓ (VAD: avgLevel > 0.008)
USER_SPEAKING          ← vadSpeechActiveRef = true
    ↓ (VAD: 400ms silence → activityEnd)
USER_PAUSED
    ├── (speech resumes within window) → USER_SPEAKING
    └── (stays silent)
         ↓
WAITING_FOR_STT        ← sttFinalisedRef still false
    ↓ (inputTranscription arrives)
STT_FINALISED          ← sttFinalisedRef = true
    ↓ (TurnTakingEngine + AnswerCompletionAnalyzer)
ANALYZING
    ├── INCOMPLETE     → WAIT_LONGER (re-evaluate at 300ms)
    ├── LIKELY_COMPLETE → POSSIBLE_END window
    └── COMPLETE       → ANSWER_COMPLETE
         ↓
ANSWER_COMPLETE
    ↓ (natural pause elapsed)
READY_FOR_NEXT_QUESTION
    ↓ (QuestionGate.canAskNextQuestion() = true)
NEXT_QUESTION_GENERATED
    ↓
AI_SPEAKING            ← next turn begins
```

### Barge-in Path

```
AI_SPEAKING
    + (VAD: user speech detected)
    ↓
stopAiAudio()          ← stops all AudioBufferSourceNodes immediately
    ↓
currentTurnIdRef = null ← rejects any late audio chunks
    ↓
USER_SPEAKING
```

---

## 6. Invariants (Non-Negotiable)

```
USER_SPEAKING === true        → AI next question = FORBIDDEN
STT not finalised             → AI next question = FORBIDDEN
Finalization window open      → AI next question = FORBIDDEN
Generation already active     → second generation = FORBIDDEN
Same question hash seen       → delivery = FORBIDDEN
Session ending                → all new actions = FORBIDDEN
AI speaking + user speech     → AI audio STOPS
```

---

## 7. VoiceAgent Integration Points

| Location | What changed |
|----------|--------------|
| Imports | `TurnTakingEngine`, `AnswerCompletionAnalyzer`, `QuestionGate` |
| Refs | `ttEngineRef`, `completionRef`, `questionGateRef`, `sttFinalisedRef`, `vadSpeechActiveRef`, `speechStartAtRef` |
| `stopAiAudio()` | New barge-in controller — stops all `AudioBufferSourceNode`s |
| `scriptProcessor.onaudioprocess` | Barge-in check, `vadSpeechActiveRef` updates, `questionGateRef.onUserSpeechStarted()` |
| 300ms `setInterval` | Replaces 5s/15s single timer. Feeds engine, acts on decision |
| `inputTranscription` handler | Sets `sttFinalisedRef = true` |
| `turnComplete` handler | Resets `sttFinalisedRef`, `vadSpeechActiveRef`, `speechStartAtRef` |
| `cleanup()` | Resets all refs, `invalidateGeneration()`, `stopAiAudio()` |

---

## 8. Testing

### Unit Tests: 117/117 passing

| Suite | Tests | Covers |
|-------|-------|--------|
| transcriptFinalization | 10 | P0 race condition (Cases A–J) |
| turnTaking (TurnTakingEngine) | 18 | All 10 production spec scenarios |
| turnTaking (AnswerCompletionAnalyzer) | 7 | Completion signal heuristics |
| turnTaking (QuestionGate) | 17 | Gate conditions, lifecycle, duplicates |
| ManualVAD | existing | VAD frame processing |
| other | existing | Audio, session config |

### Test Cases vs Production Spec

| # | Spec Requirement | Test | Result |
|---|-----------------|------|--------|
| 1 | User speaks 10s → AI does NOT interrupt | `continuous speech → USER_IS_SPEAKING` | ✅ PASS |
| 2 | User pauses 2s → AI waits | `2s silence → THINKING_PAUSE → WAIT_LONGER` | ✅ PASS |
| 3 | User pauses 4s, answer incomplete → no interrupt | `BEHAVIORAL 4s → WAIT_LONGER` | ✅ PASS |
| 4 | User finished + 5s silence → AI advances | `8s+ silence + transcript → ANSWER_COMPLETE` | ✅ PASS |
| 5 | "I don't know" = valid answer | `AnswerCompletionAnalyzer ≠ NO_ANSWER` | ✅ PASS |
| 7 | AI speaking + user speech → stop AI | `INTERRUPT_AI priority 1` | ✅ PASS |
| 8 | STT delayed → not treated as silence | `WAIT_FOR_STT` | ✅ PASS |
| 9 | Duplicate question → gate blocks | `DUPLICATE_QUESTION hash` | ✅ PASS |
| 10 | Second generation → blocked | `GENERATION_LOCK` | ✅ PASS |

---

## 9. What Is Still Required for Full Production Certification

| Item | Status | Required Action |
|------|--------|----------------|
| E2E live voice → DB transcript match | ⚠️ Unit tested only | Real interview session test |
| Barge-in latency measurement | ⚠️ Not measured | Instrument `stopAiAudio()` call latency |
| PDF binary validation | ⚠️ Partial | Server-side %PDF- header check |
| PDF pre-generation queue | ❌ Not done | Background job after session save |
| Load test (concurrent sessions) | ❌ Not done | k6 / locust 100→1000 concurrent |
| STT finalization timeout handling | ⚠️ Partial | Network disconnect ≠ user silent |
| LangSmith turn decision traces | ❌ Not done | Add metadata to each TURN_DECISION |
| Adaptive noise floor calibration | ❌ Not done | Dynamic SPEECH_THRESHOLD |

---

## 10. Commit History

| Hash | Description |
|------|-------------|
| `b7d96c8` | fix: transcript visibility, PDF download, empty STT (Root Causes 1-4) |
| `56a7bd8` | fix(p0): turnComplete/inputTranscription race + 10 finalization tests |
| `e8b57fa` | feat(turn-taking): multi-signal engine, 42 new tests, 117/117 total |
