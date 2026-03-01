# 🔧 SESSION PERSISTENCE FIX - TROUBLESHOOTING GUIDE

**Critical Data Flow Fix Implementation**

---

## **⚡ QUICK VERIFICATION TEST**

Run this immediately after deployment:

### **Test 1: Complete a Session**
```
1. Login as test user
2. Go to any training module (HR Interview, Technical, etc.)
3. Complete 1 session
4. Check browser console - should see refetch calls
5. Refresh page manually - data should persist
```

### **Test 2: Check Database**
```javascript
// MongoDB query - Run in MongoDB Atlas
use fluenzy_db;

// Should have exactly 1 record
db.session.countDocuments({ userId: "test_user_id" })  // → 1 ✓

// Should have updated usage
db.monthlyUsage.findOne({ userId: "test_user_id" })
// → { hrUsage: 1, totalUsage: 1, ... }  ✓
```

### **Test 3: Check Logs**
```bash
# In your server logs, search for:
grep SESSION_COMPLETE_SUCCESS app.log

# Should see complete flow (no gaps):
[SESSION_CREATE_START] ...
[SESSION_SAVED_SUCCESS] ...
[USAGE_INCREMENT_START] ...
[USAGE_INCREMENT_SUCCESS] ...
[FRONTEND_REFETCH_REQUIRED] ...
```

---

## **❌ COMMON ISSUES & FIXES**

### **Issue #1: Sessions Save But Usage Doesn't Increment**

**Symptoms**:
- ✓ Session appears in DB
- ✗ MonthlyUsage not updated
- ✗ UI still shows full usage available

**Root Causes & Fixes**:

| Cause | Fix |
|-------|-----|
| `incrementModuleUsage` not imported | Check [src/app/api/sessions/route.ts](src/app/api/sessions/route.ts) line 5 has import |
| Function called with wrong module name | Verify module name matches: 'hr', 'english', 'technical', etc. (lowercase) |
| User not found in billing function | Check user exists in users table (email is matched correctly) |
| MonthlyUsage record doesn't exist | Check billing.ts `getOrCreateMonthlyUsage` creates it automatically |
| Database transaction fails silently | Check MongoDB connection and MonthlyUsage table permissions |

**Quick Fix**:
```typescript
// In /api/sessions/route.ts, add this before incrementModuleUsage call:
console.log('[DEBUG] About to increment:', {
  userId: user.id,
  module: module,
  userExists: !!user,
  moduleValid: ['hr', 'english', 'technical', 'company', 'daily', 'mock', 'gd'].includes(module)
});
```

---

### **Issue #2: Usage Increments But Remains 0**

**Symptoms**:
- ✓ Logs show increment succeeds
- ✗ Database shows 0 usage
- ✗ UI shows "Can use infinite times"

**Root Causes & Fixes**:

| Cause | Fix |
|-------|-----|
| Reading old MonthlyUsage (not refreshed) | MonthlyUsage should be recreated each billing cycle |
| Module field name mismatch | Module 'hr' should update `hrUsage` field (check mapping) |
| MonthlyUsage composite unique prevents update | Check: `@@unique([userId, billingMonth, billingYear])` exists in schema |
| Usage field is null not 0 | Should default to 0, check schema default values |

**Quick Fix**:
```javascript
// Check module -> field mapping in /lib/billing.ts
MODULE_USAGE_FIELDS: {
  hr: "hrUsage",           // hr module → hrUsage field ✓
  english: "englishUsage",
  technical: "technicalUsage",
  // etc.
}
```

---

### **Issue #3: History Page Empty Even After Sessions Saved**

**Symptoms**:
- ✓ Sessions in database
- ✓ Usage incremented
- ✗ History page shows no sessions
- ✗ Analytics page empty

**Root Causes & Fixes**:

| Cause | Fix |
|-------|-----|
| `/api/analytics` not finding sessions | Check analytics query WHERE clause: `{ userId: user.id }` |
| Sessions have wrong userId | Verify session.userId matches authenticated user.id |
| Sessions created with NULL userId | Check /api/sessions POST stores user.id |
| Analytics caching stale data | Clear browser cache and refetch |
| Frontend not calling /api/analytics | Check refetch calls in training completion code |

**Quick Fix**:
```typescript
// In /api/analytics, add debug query
const sessions = await prisma.session.findMany({
  where: { userId },
});
console.log(`[ANALYTICS_DEBUG] Found ${sessions.length} sessions for user ${userId}`);
```

---

### **Issue #4: Limit Check Doesn't Work (Can Exceed Limit)**

**Symptoms**:
- ✓ Usage increments
- ✗ User can exceed limit
- ✗ Can use more than 2 sessions on Free plan

**Root Causes & Fixes**:

| Cause | Fix |
|-------|-----|
| Frontend validation missing | Must check `/api/training-usage` before allowing session |
| Plan/Limit configuration wrong | Check PlanPricing table has correct moduleLimits |
| `validateModuleAccess` returns wrong limit | Verify function uses correct plan limits from DB |
| UNLIMITED modules aren't excluded | Mark UNLIMITED_MODULES in billing.ts by module name |

**Quick Test**:
```javascript
// Test limit validation
fetch('/api/training-usage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ module: 'hr', mode: 'validate-only' })
}).then(r => r.json()).then(data => {
  console.log('Can use?', data.canUse);
  console.log('Remaining:', data.remaining);
  console.log('Limit:', data.limit);
});
```

---

### **Issue #5: UI Doesn't Update After Completion (Still Shows As Available)**

**Symptoms**:
- ✓ Session completed successfully
- ✓ Usage incremented in DB
- ✗ UI still shows old value
- ✗ Page needs refresh to see changes

**Root Causes & Fixes**:

| Cause | Fix |
|-------|-----|
| Frontend not refetching after completion | Add these after session response: `queryClient.invalidateQueries(['training-usage'])` |
| Response doesn't include usage info | Check /api/sessions returns `{ usage: { ... } }` |
| Frontend ignoring response usage data | Update component to use response.usage instead of stale state |
| Cache TTL too high | Reduce React Query stale time or set staleTime: 0 |

**Quick Fix**:
```typescript
// After session completion response
const response = await fetch('/api/sessions', { ... });
const data = await response.json();

// Immediately update UI from response (don't wait for refetch)
setRemainingUses(data.usage.remaining);
setUsageCount(data.usage.currentUsage);

// Then refetch to sync state
queryClient.invalidateQueries({ queryKey: ['training-usage'] });
```

---

### **Issue #6: Logs Show No Refetch Calls**

**Symptoms**:
```
[SESSION_CREATE_START] ✓
[SESSION_SAVED_SUCCESS] ✓
[USAGE_INCREMENT_SUCCESS] ✓
[FRONTEND_REFETCH_REQUIRED] ✓
[BUT NO REFETCH LOG FOLLOWS] ✗
```

**Root Causes & Fixes**:

| Cause | Fix |
|-------|-----|
| Frontend not calling refetch | Add console.log before each queryClient.invalidate call |
| React Query not set up | Check useQueryClient() is available in component |
| Wrong query key name | Must match the key used in useQuery hooks |
| Refetch happening but no logs | Add logs in the data fetching functions |

**Quick Fix**:
```typescript
// Add this in training completion code
console.log('[REFETCH_START] Invalidating training-usage query');
queryClient.invalidateQueries({ queryKey: ['training-usage'] });

// Then in your useQuery hook, add onSuccess
const { data, refetch } = useQuery({
  queryKey: ['training-usage'],
  onSuccess: () => console.log('[REFETCH_SUCCESS] Query updated'),
  onError: (err) => console.log('[REFETCH_ERROR]', err)
});
```

---

## **🔍 DEBUG CHECKLIST**

When something isn't working, check these in order:

### **Backend Checks**
- [ ] `/api/sessions` POST endpoint exists and is accessible
- [ ] `incrementModuleUsage` imported at top of file
- [ ] Try/catch wraps the entire POST handler
- [ ] Console.logs appear in server output (not swallowed)
- [ ] Module name is lowercase: 'hr', 'english', not 'HR', 'English'
- [ ] User lookup works: `prisma.users.findUnique({ where: { email } })`
- [ ] User object is not null before incrementing

### **Database Checks**
- [ ] MonthlyUsage table has the user's current billing period record
- [ ] Session and MonthlyUsage have same userId (not mismatched)
- [ ] No duplicate MonthlyUsage records (violates unique constraint)
- [ ] hrUsage field exists in MonthlyUsage schema (not null)
- [ ] totalUsage matches sum of individual module fields

### **Frontend Checks**
- [ ] Session POST request succeeds (status 200)
- [ ] Response includes `usage` object with `remaining` field
- [ ] Component receives response data (check props)
- [ ] UI component renders usage display
- [ ] Query client is initialized in React Provider
- [ ] useQuery hooks include the correct queryKey

### **Network Checks**
- [ ] Network tab shows POST /api/sessions returning 200
- [ ] Response payload has usage metadata (not just sessionId)
- [ ] No CORS errors blocking refetch calls
- [ ] /api/training-usage GET returning correct remaining count

---

## **📊 EXPECTED DATA FLOW LOGS**

### **Success Case: Complete 1 HR Session, Free Plan (Limit 2)**

**Server Logs** (in order):
```
[SESSION_CREATE_START] userId: user123, module: hr, timestamp: 2026-03-01T10:30:00Z
[SESSION_SAVED_SUCCESS] sessionId: S_1704732600000, duration: 45, score: 0.85
[USAGE_INCREMENT_START] userId: user123, module: hr, sessionId: S_1704732600000
[INCREMENT_TYPE] Module: hr, AccessType: limited
[INCREMENT_CHECK] User: user123, Module: hr, Usage: 0/2
[BEFORE_INCREMENT] User: user123, Module: hr, Field: hrUsage, CurrentCount: 0
[AFTER_INCREMENT] User: user123, Module: hr, Field: hrUsage, NewCount: 1, Remaining: 1
[USAGE_INCREMENT_SUCCESS] userId: user123, module: hr, newUsage: 1, remaining: 1, limitReached: false
[SESSION_COMPLETE_SUCCESS] HR Interview session completed successfully
[FRONTEND_REFETCH_REQUIRED] reason: session_completed, data: usage_updated, history_updated, user_plan_updated
```

**Browser Logs** (if frontend logging enabled):
```
[REFETCH_START] Invalidating: training-usage, analytics, user-plan
[REFETCH_RESULT] training-usage: { hr: { currentUsage: 1, remaining: 1 } }
[REFETCH_RESULT] analytics: [ { sessionId: "S_1704732600000", module: "hr", ... } ]
[UI_UPDATE] Remaining sessions: 2 → 1
[UI_LOCK] HR button: enabled (can use 1 more time)
```

### **Failure Case: Usage Not Incrementing**

**Server Logs** (notice the gap):
```
[SESSION_CREATE_START] ...
[SESSION_SAVED_SUCCESS] ...
[USAGE_INCREMENT_START] ...
[INCREMENT_ERROR] User not found: user123    ← PROBLEM HERE
[INCREMENT_FAILED] Error: User not found
```

**What it means**: User.id in session doesn't exist when incrementModuleUsage queries for it.

**Fix**: Verify user's email was found correctly, user exists in same database.

---

## **🔐 SECURITY VALIDATIONS**

Ensure these integrity checks are in place:

- [ ] Only authenticated users can POST /api/sessions
- [ ] Users can only see their own sessions (userId filter)
- [ ] Usage increment happens AFTER session save (no orphaned records)
- [ ] Monthly reset only applies to users in that billing cycle
- [ ] Disabled users cannot increment usage
- [ ] Unlimited modules skip increment (correct behavior)
- [ ] Logging doesn't expose passwords/sensitive data

---

## **📈 PERFORMANCE NOTES**

### **Database Calls per Session**
```
Session Completion Flow:
├─ Find user (1 query)
├─ Upsert progress record (1 query)
├─ Get/Create MonthlyUsage (1-2 queries)
├─ Increment usage (1 query with atomic operation)
├─ (Analytics later) Find sessions (1 query)
├─ (Analytics later) Find transcripts (1 query)
└─ Total: ~5-7 queries per session completion
```

**If slow**:
- Add index on MonthlyUsage: `@@index([userId, billingYear, billingMonth])`
- Add index on Session: `@@index([userId, startTime])`
- Use aggregation pipeline for analytics (heavy computation)

---

## **✅ VALIDATION SCRIPT**

Run this in MongoDB to verify data integrity:
```javascript
// Get all users with sessions
const users = db.session.aggregate([
  { $group: { _id: "$userId", sessionCount: { $sum: 1 } } }
]).toArray();

// For each user, verify usage matches
users.forEach(user => {
  const usage = db.monthlyUsage.findOne({ userId: user._id });
  const totalUsage = usage.englishUsage + usage.dailyUsage + usage.hrUsage + 
                     usage.technicalUsage + usage.companyUsage + usage.mockUsage + 
                     usage.gdCoachUsage + usage.gdUsage + usage.interviewGuideUsage;
  
  if (totalUsage !== usage.totalUsage) {
    print(`MISMATCH: User ${user._id}, calculated: ${totalUsage}, recorded: ${usage.totalUsage}`);
  }
});
```

---

## **🚨 CRITICAL INDICATORS**

If you see any of these, the fix is broken:

| Indicator | Impact | Fix |
|-----------|--------|-----|
| History page still empty | Users can't see past work | Check session saving |
| Usage doesn't decrement | Can exceed limit | Check increment logic |
| UI shows stale values | Users confused | Check refetch calls |
| Logs show gaps | Data flow broken | Check error logs |
| DB has orphaned sessions | Data inconsistency | Rebuild MonthlyUsage |

---

**Need support? Check the [PRODUCTION_FIX_IMPLEMENTATION.md](PRODUCTION_FIX_IMPLEMENTATION.md) file for complete details.**
