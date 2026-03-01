# 🚀 PRODUCTION DEBUG PROMPT: FEATURE-SCOPED USAGE CONTROL + CORRECT DECREMENT TRIGGER

## 📌 CONTEXT

I have implemented a plan-based SaaS billing system using:
- **Prisma + MongoDB** for data persistence
- **Razorpay** for subscriptions
- **MonthlyUsage** tracking
- **PlanModuleLimit** configuration
- **validateModuleAccess()** and **incrementModuleUsage()** functions

However, the module classification logic is broken, causing incorrect quota handling and UI inconsistencies.

---

## 🚨 CRITICAL ISSUES (PRODUCTION BREAKING)

### Issue #1: Cross-Module Decrement Bug
- Clicking "Start Interview" decrements **GD Agent quota** instead of **HR Interview quota**
- This indicates **module key collision** or **moduleType enum reuse**
- GD Coach and GD Agent are treated as the same module at backend level

### Issue #2: Parent Module Session Display
- GD Agent parent module shows **"0 sessions"** in UI
- GD Agent is an **unlimited parent module** — should NOT show session limits
- Session limits should ONLY apply to → **AI Agents sub-feature**

### Issue #3: Unlimited Modules UI Display
- Vocabulary Booster displays **session count** (should be hidden)
- Latest Topics displays **session count** (should be hidden)
- UI is rendering session counts for all modules regardless of limit type

### Issue #4: Decrement Timing
- Decrement might be happening **before** session actually starts
- No validation that session was successfully initiated before usage is consumed

### Issue #5: Sub-Feature Scope Loss
- GD Agent parent module lacks proper sub-feature separation
- No distinction between:
  - `GD_AGENT_PRIVATE` → Unlimited
  - `GD_AGENT_RANDOM` → Unlimited
  - `GD_AGENT_AI` → Limited (plan-based)

---

## 🎯 REQUIRED MODULE CLASSIFICATION (BUSINESS RULES)

### TIER 1: Fully Unlimited Modules (Never validate, never decrement, never show UI)
- ✅ Vocabulary Booster
- ✅ Latest Topics
- ✅ GD Agent (parent level)

### TIER 2: Unlimited Sub-Features (Under parent modules, no limits)
- ✅ GD Agent → Private GD
- ✅ GD Agent → Random Matching

### TIER 3: Limited Modules (Plan-based usage validation)
- ✅ HR Interview
- ✅ GD Coach
- ✅ Technical Mastery
- ✅ Company Tracks
- ✅ Daily Conversation
- ✅ English Learning
- ✅ Voice Practice
- ✅ GD Agent → AI Agents ONLY

### Module Limits Configuration
```
FREE PLAN:
  - Limited modules → 2 sessions per month
  - Interview Guide → 1 per month
  
STANDARD PLAN:
  - Limited modules → 30 sessions per month
  - Interview Guide → 10 per month
  
PREMIUM PLAN:
  - Limited modules → 300 sessions per month
  - Interview Guide → 30 per month
```

---

## 🔍 ROOT CAUSE ANALYSIS INVESTIGATION

### Investigation Points

1. **ModuleType Enum Verification**
   - [ ] Check if `ModuleType.GD_COACH` is distinct from `ModuleType.GD_AGENT`
   - [ ] Verify that `ModuleType.GD_AGENT_AI` exists separately
   - [ ] Confirm no reuse of enum values across different features
   - [ ] Check if enum is used consistently across all API endpoints

2. **Feature Key Mapping Verification**
   - [ ] Inspect `PlanModuleLimit` schema — are keys properly mapped?
   - [ ] Verify `GD_COACH` has its own usage column/field
   - [ ] Verify `GD_AGENT_AI` has separate usage tracking
   - [ ] Ensure `GD_AGENT` (parent) is NOT in usage validation layer
   - [ ] Check if there's a collision between module keys (case-sensitivity issue?)

3. **incrementModuleUsage() Logic**
   - [ ] Trace what `moduleType` parameter is passed when Start Interview is clicked
   - [ ] Log the exact `moduleType` value being used to increment
   - [ ] Verify the MongoDB query is updating the correct field
   - [ ] Check if there's a fallback or default module type

4. **validateModuleAccess() Logic**
   - [ ] Verify it receives correct feature identifier
   - [ ] Check if it has special handling for parent vs sub-features
   - [ ] Ensure it bypasses validation for unlimited modules
   - [ ] Ensure it only validates `GD_AGENT_AI`, not `GD_AGENT` parent

5. **API Endpoint Routing**
   - [ ] When "Start Interview" is clicked, which API endpoint is hit?
   - [ ] What `moduleType` value is sent in the request body?
   - [ ] Is the module type derived from the route URL or explicitly passed?
   - [ ] Is there a mismatch between frontend module naming and backend enum?

6. **Frontend Module Identification**
   - [ ] How does the frontend determine which module is active?
   - [ ] Is module type hardcoded in components or derived dynamically?
   - [ ] Are route parameters parsed correctly in API calls?
   - [ ] Is there state pollution (wrong module persisting between clicks)?

7. **MonthlyUsage Record Creation**
   - [ ] For a given user and billing cycle, is only ONE record created per module?
   - [ ] Is the current month record fetched correctly?
   - [ ] Are there orphaned/duplicate records causing growth?
   - [ ] Is the month comparison logic correct (timezone-aware)?

---

## ✅ REQUIRED CORRECTIONS

### Correction #1: Module Classification Layer
Create a **centralized, immutable module classification** system:

```typescript
// Define module classification clearly
enum ModuleType {
  // Unlimited Modules
  VOCABULARY_BOOSTER = "vocabulary_booster",
  LATEST_TOPICS = "latest_topics",
  
  // GD Agent Sub-Features
  GD_AGENT_PRIVATE = "gd_agent_private",      // Unlimited
  GD_AGENT_RANDOM = "gd_agent_random",        // Unlimited
  GD_AGENT_AI = "gd_agent_ai",                // Limited
  
  // Limited Modules
  HR_INTERVIEW = "hr_interview",
  GD_COACH = "gd_coach",
  TECHNICAL_MASTERY = "technical_mastery",
  COMPANY_TRACKS = "company_tracks",
  DAILY_CONVERSATION = "daily_conversation",
  ENGLISH_LEARNING = "english_learning",
  VOICE_PRACTICE = "voice_practice",
}

// Classification mapping
const MODULE_ACCESS_TYPE = {
  [ModuleType.VOCABULARY_BOOSTER]: "unlimited",
  [ModuleType.LATEST_TOPICS]: "unlimited",
  [ModuleType.GD_AGENT_PRIVATE]: "unlimited",
  [ModuleType.GD_AGENT_RANDOM]: "unlimited",
  [ModuleType.GD_AGENT_AI]: "limited",
  [ModuleType.HR_INTERVIEW]: "limited",
  [ModuleType.GD_COACH]: "limited",
  [ModuleType.TECHNICAL_MASTERY]: "limited",
  [ModuleType.COMPANY_TRACKS]: "limited",
  [ModuleType.DAILY_CONVERSATION]: "limited",
  [ModuleType.ENGLISH_LEARNING]: "limited",
  [ModuleType.VOICE_PRACTICE]: "limited",
}
```

### Correction #2: Access Control Validation
Ensure `validateModuleAccess()` respects classification:

```typescript
async function validateModuleAccess(
  userId: string,
  moduleType: ModuleType,
  planId: string
): Promise<{
  allowed: boolean;
  remaining?: number;
  limit?: number;
  reason?: string;
}> {
  // Step 1: Check classification
  const accessType = MODULE_ACCESS_TYPE[moduleType];
  
  if (accessType === "unlimited") {
    // Bypass all validation
    return { allowed: true };
  }
  
  // Step 2: Only run validation for limited modules
  if (accessType === "limited") {
    // Fetch user subscription + plan limits
    const [user, planLimit, usage] = await Promise.all([
      getUserById(userId),
      getPlanModuleLimit(planId, moduleType),
      getUserMonthlyUsage(userId, moduleType),
    ]);
    
    // Step 3: Calculate remaining
    const remaining = planLimit.limit - (usage?.currentCount || 0);
    
    if (remaining <= 0) {
      return {
        allowed: false,
        reason: "Session limit reached for this month",
      };
    }
    
    return {
      allowed: true,
      remaining,
      limit: planLimit.limit,
    };
  }
  
  return { allowed: false, reason: "Unknown module type" };
}
```

### Correction #3: Usage Increment Logic
Ensure decrement happens AFTER session confirmation:

```typescript
async function incrementModuleUsage(
  userId: string,
  moduleType: ModuleType,
  metadata?: { sessionId?: string; duration?: number }
): Promise<{
  success: boolean;
  remaining: number;
  error?: string;
}> {
  // Step 1: Check if module is unlimited
  const accessType = MODULE_ACCESS_TYPE[moduleType];
  
  if (accessType === "unlimited") {
    // Do NOT increment for unlimited modules
    return { success: true, remaining: Infinity };
  }
  
  // Step 2: Only increment for limited modules
  if (accessType === "limited") {
    try {
      // Use atomic transaction to prevent race conditions
      const result = await prisma.$transaction(async (tx) => {
        // Fetch current month's usage
        const currentMonth = new Date();
        const usage = await tx.userMonthlyUsage.findUnique({
          where: {
            userId_moduleType_billingCycleStart: {
              userId,
              moduleType,
              billingCycleStart: new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                1
              ),
            },
          },
        });
        
        // Get plan limit
        const user = await tx.user.findUnique({ where: { id: userId } });
        const planLimit = await tx.planModuleLimit.findUnique({
          where: { planId_moduleType: { planId: user.planId, moduleType } },
        });
        
        // Increment usage
        const updated = await tx.userMonthlyUsage.update({
          where: { id: usage.id },
          data: { currentCount: { increment: 1 } },
        });
        
        return {
          totalLimit: planLimit.limit,
          currentCount: updated.currentCount,
          remaining: planLimit.limit - updated.currentCount,
        };
      });
      
      return {
        success: true,
        remaining: result.remaining,
      };
    } catch (error) {
      console.error(
        `[ERROR] Failed to increment ${moduleType} for user ${userId}:`,
        error
      );
      return {
        success: false,
        remaining: 0,
        error: error.message,
      };
    }
  }
  
  return {
    success: false,
    remaining: 0,
    error: "Invalid module type",
  };
}
```

### Correction #4: API Endpoint Update
Ensure correct moduleType is passed:

```typescript
// Example: Start Interview endpoint
export async function POST(req: NextRequest) {
  const { userId, sessionType } = await req.json();
  
  // Determine module type based on sessionType
  let moduleType: ModuleType;
  
  if (sessionType === "hr_interview") {
    moduleType = ModuleType.HR_INTERVIEW;
  } else if (sessionType === "gd_coach") {
    moduleType = ModuleType.GD_COACH;
  } else if (sessionType === "gd_agent_ai") {
    moduleType = ModuleType.GD_AGENT_AI;
  } else {
    return errorResponse("Invalid session type", 400);
  }
  
  // Validate access
  const validation = await validateModuleAccess(userId, moduleType, user.planId);
  if (!validation.allowed) {
    return errorResponse(validation.reason, 403);
  }
  
  try {
    // Start session first
    const session = await createSession(userId, moduleType);
    
    // ONLY increment after session is confirmed to start
    const increment = await incrementModuleUsage(userId, moduleType, {
      sessionId: session.id,
    });
    
    if (!increment.success) {
      // Rollback session if increment fails
      await deleteSession(session.id);
      return errorResponse("Failed to allocate session", 500);
    }
    
    return successResponse({
      sessionId: session.id,
      remaining: increment.remaining,
    });
  } catch (error) {
    return errorResponse("Session creation failed", 500);
  }
}
```

### Correction #5: UI Layer Updates

#### For Unlimited Modules (Hide session display):
```typescript
// DO NOT render session count for unlimited modules
function VocabularyBooster() {
  const moduleType = ModuleType.VOCABULARY_BOOSTER;
  
  // Never fetch quota for unlimited modules
  if (MODULE_ACCESS_TYPE[moduleType] === "unlimited") {
    return (
      <div>
        {/* No session badge */}
        {/* No remaining count */}
        {/* Just show feature UI */}
      </div>
    );
  }
}
```

#### For Limited Modules (Show dynamic quota):
```typescript
// Always fetch fresh usage for limited modules
async function GDCoach() {
  const moduleType = ModuleType.GD_COACH;
  
  // Fetch real-time quota
  const { totalLimit, remaining } = await fetchModuleQuota(
    userId,
    moduleType
  );
  
  return (
    <div>
      <span>Sessions Remaining: {remaining} / {totalLimit}</span>
      <Button
        onClick={startSession}
        disabled={remaining === 0}
      >
        Start Session
      </Button>
    </div>
  );
}
```

## 🎯 EXPECTED CORRECT BEHAVIOR (POST-FIX)

### Scenario 1: Click Start Interview
```
✅ Identifies module as HR_INTERVIEW
✅ Validates plan access (only hr_interview limit checked)
✅ Increments HR_INTERVIEW usage (not GD_AGENT)
✅ Returns remaining HR_INTERVIEW count
✅ UI refreshes only HR_INTERVIEW quota
```

### Scenario 2: Click GD Coach
```
✅ Identifies module as GD_COACH
✅ Validates plan access (only gd_coach limit checked)
✅ Increments GD_COACH usage (not GD_AGENT)
✅ Returns remaining GD_COACH count
✅ UI refreshes only GD_COACH quota
```

### Scenario 3: GD Agent Parent View (Free User)
```
✅ Does NOT show "0 sessions"
✅ Does NOT show any session badge
✅ Shows three sub-options:
   - Private GD (unlimited) - click to enter
   - Random Matching (unlimited) - click to enter
   - AI Agents (N remaining sessions) - shows limit
✅ Only AI Agents sub-feature shows usage
```

### Scenario 4: Click "Start with AI Agents"
```
✅ Identifies module as GD_AGENT_AI
✅ Validates plan access (only gd_agent_ai limit checked)
✅ Increments GD_AGENT_AI usage (not GD_AGENT)
✅ Returns remaining GD_AGENT_AI count
✅ Other GD Agent sub-features unaffected
```

### Scenario 5: Vocabulary Booster
```
✅ No session count displayed
✅ No "Quota Remaining" badge
✅ No usage validation
✅ Users can access unlimited times
```

### Scenario 6: Latest Topics
```
✅ No session count displayed
✅ No session tracking
✅ Unlimited access regardless of plan
```

---

## 🚀 VERIFICATION CHECKLIST

- [ ] ModuleType enum has no reused values
- [ ] MODULE_ACCESS_TYPE map is correctly populated
- [ ] validateModuleAccess() skips unlimited modules
- [ ] validateModuleAccess() only checks limited modules
- [ ] incrementModuleUsage() does not run for unlimited modules
- [ ] All API endpoints pass correct moduleType to increment function
- [ ] No parent module (GD_AGENT) in usage validation
- [ ] Only sub-features (GD_AGENT_AI) in usage validation
- [ ] UI does not show session count for unlimited modules
- [ ] UI always fetches fresh quota for limited modules
- [ ] MonthlyUsage records are created per module (no parent module tracking)
- [ ] Decrement happens AFTER session is confirmed to start
- [ ] Atomic transaction prevents race conditions
- [ ] Cross-module quota contamination is eliminated
- [ ] All module limits work independently

---

## 📊 LOGGING REQUIREMENTS

Add detailed logging at critical points:

```typescript
console.log(`[MODULE_ACCESS] User: ${userId}, Module: ${moduleType}, Access: ${accessType}`);
console.log(`[VALIDATION] Module: ${moduleType}, Allowed: ${allowed}, Remaining: ${remaining}`);
console.log(`[BEFORE_DECREMENT] Module: ${moduleType}, CurrentCount: ${before}`);
console.log(`[AFTER_DECREMENT] Module: ${moduleType}, CurrentCount: ${after}`);
console.log(`[SESSION_START] SessionID: ${sessionId}, Module: ${moduleType}, Remaining: ${remaining}`);
```

---

## 🏆 POST-IMPLEMENTATION TESTING

1. **Cross-Module Isolation Test**
   - Use HR Interview 1 session
   - Verify GD Coach quota unchanged
   - Verify GD_AGENT_AI quota unchanged

2. **Unlimited Module Test**
   - Generate 100 Vocabulary Booster sessions
   - Verify no limit error
   - Verify UI shows no session count

3. **Sub-Feature Test**
   - Use GD Agent → AI Agents twice
   - Switch to GD Agent → Private GD
   - Verify Private GD has no limit
   - Verify AI Agents shows 0 remaining

4. **Downgrade Test**
   - Use all Standard plan sessions
   - Downgrade to Free during billing cycle
   - Verify immediate limit update

---

**This is a production-grade fix. Implement all corrections to ensure SaaS stability.** 🚀
