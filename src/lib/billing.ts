import prisma from "@/lib/prisma";

// ============================================================
// MODULE CLASSIFICATION SYSTEM
// ============================================================
// This defines which modules are unlimited, limited, or partial

// Modules that NEVER require usage validation - always unlimited
// These modules do NOT decrement and never show session counts
export const UNLIMITED_MODULES = {
  // Backend keys
  vocabulary: true,
  latestTopics: true,
  latest_topics: true,
  gdPrivate: true,
  gd_random: true,
  gdRandom: true,
  corporateVoice: true,
  
  // Frontend enum keys (SCREAMING_SNAKE_CASE)
  VOCABULARY_BOOSTER: true,
  LATEST_TOPICS: true,
  GD_PRIVATE: true,
  GD_RANDOM: true,
  CORPORATE_VOICE: true,
} as const;

// Modules that always require usage validation - plan-based limits
export const LIMITED_MODULES = {
  // Backend keys
  english: true,         // English Learning
  daily: true,           // Daily Conversation
  hr: true,              // HR Interview
  technical: true,       // Technical Mastery
  company: true,         // Company Tracks
  mock: true,            // Full Mock
  gdCoach: true,         // GD Coach - SEPARATE from GD Agent
  interviewGuide: true,  // Interview Guide
  gd_ai_agents: true,
  gdaiagents: true,
  
  // Frontend enum keys (SCREAMING_SNAKE_CASE)
  ENGLISH_LEARNING: true,
  CONVERSATION_PRACTICE: true,
  HR_INTERVIEW: true,
  TECH_INTERVIEW: true,
  COMPANY_WISE_HR: true,
  FULL_MOCK: true,
  GD_COACH: true,
  COMPANY_SPECIFIC: true,
  GD_AI_AGENTS: true,
} as const;

// Modules that have PARTIAL limits - some features unlimited, some limited
export const PARTIAL_MODULES = {
  // Backend keys
  gd: {
    aiAgents: true,     // AI Agents within GD - LIMITED
    privateGd: false,   // Private GD Room - UNLIMITED
    randomMatching: false, // Random Matching - UNLIMITED
  },
  
  // Frontend enum keys (SCREAMING_SNAKE_CASE)
  GD_DISCUSSION: {
    aiAgents: true,
    privateGd: false,
    randomMatching: false,
  }
} as const;

// Module access type
export type ModuleAccessType = 'unlimited' | 'limited' | 'partial';

// Get module access type
export function getModuleAccessType(module: ModuleType | string): ModuleAccessType {
  if (!module || typeof module !== 'string') {
    console.warn(`[WARNING] Invalid module type:`, module);
    return 'limited'; // Safe default
  }

  // Direct check first for exact matches (frontend enum)
  if (module in UNLIMITED_MODULES) {
    return 'unlimited';
  }
  if (module in LIMITED_MODULES) {
    return 'limited';
  }
  if (module in PARTIAL_MODULES) {
    return 'partial';
  }

  // Normalize for fuzzy matching: camelCase/PascalCase -> lowercase, SCREAMING_SNAKE_CASE -> lowercase
  const normalizedModule = (module as string)
    .toLowerCase()
    .replace(/-/g, '')
    .replace(/_/g, '');
  
  // Check unlimited modules (normalized)
  const unlimitedKeys = Object.keys(UNLIMITED_MODULES).map(k => 
    k.toLowerCase().replace(/-/g, '').replace(/_/g, '')
  );
  if (unlimitedKeys.includes(normalizedModule)) {
    console.log(`[MODULE_CLASSIFICATION] ${module} -> unlimited (normalized match)`);
    return 'unlimited';
  }
  
  // Check limited modules (normalized)
  const limitedKeys = Object.keys(LIMITED_MODULES).map(k => 
    k.toLowerCase().replace(/-/g, '').replace(/_/g, '')
  );
  if (limitedKeys.includes(normalizedModule)) {
    console.log(`[MODULE_CLASSIFICATION] ${module} -> limited (normalized match)`);
    return 'limited';
  }
  
  // Check partial modules (normalized)
  if (normalizedModule === 'gd' || normalizedModule === 'gddiscussion') {
    console.log(`[MODULE_CLASSIFICATION] ${module} -> partial`);
    return 'partial';
  }
  
  console.warn(`[WARNING] Unknown module type: ${module}, defaulting to limited (safe)`);
  // Default to limited for unknown modules (safe default)
  return 'limited';
}

// Check if a specific sub-feature is unlimited within a partial module
export function isSubFeatureUnlimited(module: ModuleType, subFeature?: string): boolean {
  if (subFeature && PARTIAL_MODULES.gd) {
    // For GD module, check sub-feature
    if (module.toLowerCase() === 'gd') {
      return !PARTIAL_MODULES.gd.aiAgents; // Private GD and Random Matching are unlimited
    }
  }
  return false;
}

// Module name to database field mapping
// This maps module keys to the actual database field names
// EXPLICITLY map both SCREAMING_SNAKE_CASE (from frontend) and camelCase (from backend)
export const MODULE_USAGE_FIELDS = {
  // Backend keys (camelCase) - from backend logic
  english: "englishUsage",
  daily: "dailyUsage",
  hr: "hrUsage",
  technical: "technicalUsage",
  company: "companyUsage",
  mock: "mockUsage",
  gdCoach: "gdCoachUsage",  // GD Coach - SEPARATE from GD Agent
  gd: "gdUsage",            // GD Agent (AI Agents, Private GD, Random Matching)
  interviewGuide: "interviewGuideUsage",
  
  // Frontend enum keys (SCREAMING_SNAKE_CASE) - explicit mapping to prevent collision
  ENGLISH_LEARNING: "englishUsage",
  CONVERSATION_PRACTICE: "dailyUsage",
  HR_INTERVIEW: "hrUsage",
  TECH_INTERVIEW: "technicalUsage",
  COMPANY_WISE_HR: "companyUsage",
  FULL_MOCK: "mockUsage",
  
  // GD module enum keys - MUST be distinct
  GD_COACH: "gdCoachUsage",       // GD Coach (LIMITED)
  GD_DISCUSSION: "gdUsage",       // GD Agent parent (UNLIMITED - no direct limit)
  GD_AI_AGENTS: "gdUsage",        // GD Agent AI Agents (LIMITED sub-feature of GD)
  GD_PRIVATE: null,               // GD Agent Private (UNLIMITED - no tracking)
  GD_RANDOM: null,                // GD Agent Random (UNLIMITED - no tracking)
  
  // Unlimited modules
  vocabulary: null,        // No tracking - unlimited
  VOCABULARY_BOOSTER: null, // No tracking - unlimited
  latestTopics: null,      // No tracking - unlimited
  LATEST_TOPICS: null,     // No tracking - unlimited
  gdPrivate: null,         // No tracking - unlimited
  gdRandom: null,          // No tracking - unlimited
  corporateVoice: null,    // No tracking - unlimited
  CORPORATE_VOICE: null,   // No tracking - unlimited
  
  // Legacy keys - for backward compatibility
  latest_topics: null,
  gd_private: null,
  gd_random: null,
  gd_ai_agents: "gdUsage",
} as const;

export type ModuleType = keyof typeof MODULE_USAGE_FIELDS;

// Check if module should be tracked (has a database field)
export function isModuleTracked(module: ModuleType): boolean {
  const field = MODULE_USAGE_FIELDS[module];
  return field !== null && field !== undefined;
}

// Default module limits per plan (FALLBACK ONLY - should be in database)
// This is the CRITICAL FIX: GD Coach and GD Agent are NOW SEPARATE
export const DEFAULT_PLAN_LIMITS: Record<string, { [key: string]: number }> = {
  Free: {
    english: 2,
    daily: 2,
    hr: 2,
    technical: 2,
    company: 2,
    mock: 2,
    gdCoach: 2,    // GD Coach - separate limit from GD Agent
    gd: 2,         // GD Agent (specifically AI Agents sub-feature)
    interviewGuide: 1,
    // Frontend enum keys for fallback mapping
    ENGLISH_LEARNING: 2,
    CONVERSATION_PRACTICE: 2,
    HR_INTERVIEW: 2,
    TECH_INTERVIEW: 2,
    COMPANY_WISE_HR: 2,
    FULL_MOCK: 2,
    GD_COACH: 2,
    GD_AI_AGENTS: 2,
    COMPANY_SPECIFIC: 2,
  },
  Standard: {
    english: 300,
    daily: 300,
    hr: 300,
    technical: 300,
    company: 300,
    mock: 300,
    gdCoach: 300,  // GD Coach - separate limit from GD Agent
    gd: 300,       // GD Agent (specifically AI Agents sub-feature)
    interviewGuide: 30,
    // Frontend enum keys for fallback mapping
    ENGLISH_LEARNING: 300,
    CONVERSATION_PRACTICE: 300,
    HR_INTERVIEW: 300,
    TECH_INTERVIEW: 300,
    COMPANY_WISE_HR: 300,
    FULL_MOCK: 300,
    GD_COACH: 300,
    GD_AI_AGENTS: 300,
    COMPANY_SPECIFIC: 300,
  },
  Pro: {
    english: 30,
    daily: 30,
    hr: 30,
    technical: 30,
    company: 30,
    mock: 30,
    gdCoach: 30,   // GD Coach - separate limit from GD Agent
    gd: 30,        // GD Agent (specifically AI Agents sub-feature)
    interviewGuide: 10,
    // Frontend enum keys for fallback mapping
    ENGLISH_LEARNING: 30,
    CONVERSATION_PRACTICE: 30,
    HR_INTERVIEW: 30,
    TECH_INTERVIEW: 30,
    COMPANY_WISE_HR: 30,
    FULL_MOCK: 30,
    GD_COACH: 30,
    GD_AI_AGENTS: 30,
    COMPANY_SPECIFIC: 30,
  },
  Enterprise: {
    english: 999999,
    daily: 999999,
    hr: 999999,
    technical: 999999,
    company: 999999,
    mock: 999999,
    gdCoach: 999999,  // GD Coach - separate limit from GD Agent
    gd: 999999,       // GD Agent (specifically AI Agents sub-feature)
    interviewGuide: 999999,
    // Frontend enum keys for fallback mapping
    ENGLISH_LEARNING: 999999,
    CONVERSATION_PRACTICE: 999999,
    HR_INTERVIEW: 999999,
    TECH_INTERVIEW: 999999,
    COMPANY_WISE_HR: 999999,
    FULL_MOCK: 999999,
    GD_COACH: 999999,
    GD_AI_AGENTS: 999999,
    COMPANY_SPECIFIC: 999999,
  },
};

/**
 * Get plan configuration from database
 */
export async function getPlanConfig(plan: string) {
  const pricing = await (prisma as any).planPricing.findUnique({
    where: { plan },
  });

  if (!pricing) {
    // Return default limits if not found in DB
    return {
      plan,
      price: 0,
      annualPrice: 0,
      isUnlimited: false,
      moduleLimits: DEFAULT_PLAN_LIMITS[plan] || DEFAULT_PLAN_LIMITS.Free,
      razorpayPlanId: null,
      razorpayPriceId: null,
      billingCycleDays: 30,
    };
  }

  return {
    ...pricing,
    moduleLimits: pricing.moduleLimits || DEFAULT_PLAN_LIMITS[plan] || DEFAULT_PLAN_LIMITS.Free,
    isUnlimited: pricing.isUnlimited || false,
  };
}

// Alias for backward compatibility
export const getPlanPricing = getPlanConfig;

/**
 * Get the current billing cycle dates for a user
 */
export function getBillingCycleDates(renewalDate: Date | null): {
  cycleStart: Date;
  cycleEnd: Date;
  month: number;
  year: number;
} {
  const now = new Date();
  let cycleStart: Date;
  let cycleEnd: Date;

  if (renewalDate && renewalDate > now) {
    // Subscription started after now (future renewal) - use renewal date as cycle start
    cycleStart = new Date(renewalDate);
    cycleEnd = new Date(renewalDate);
    cycleEnd.setDate(cycleEnd.getDate() + 30);
  } else if (renewalDate) {
    // Calculate cycle based on renewal date
    cycleStart = new Date(renewalDate);
    cycleEnd = new Date(renewalDate);
    cycleEnd.setDate(cycleEnd.getDate() + 30);
    
    // If we're past the cycle end, move to next cycle
    if (now > cycleEnd) {
      const monthsDiff = Math.floor((now.getTime() - cycleStart.getTime()) / (30 * 24 * 60 * 60 * 1000));
      cycleStart.setMonth(cycleStart.getMonth() + monthsDiff);
      cycleEnd.setMonth(cycleEnd.getMonth() + monthsDiff + 1);
    }
  } else {
    // No renewal date - use calendar month
    cycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
    cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  return {
    cycleStart,
    cycleEnd,
    month: cycleStart.getMonth() + 1,
    year: cycleStart.getFullYear(),
  };
}

/**
 * Get or create monthly usage record for the current billing cycle
 */
export async function getOrCreateMonthlyUsage(userId: string, plan: string): Promise<{
  id: string;
  englishUsage: number;
  dailyUsage: number;
  hrUsage: number;
  technicalUsage: number;
  companyUsage: number;
  mockUsage: number;
  gdUsage: number;
  interviewGuideUsage: number;
  totalUsage: number;
  billingMonth: number;
  billingYear: number;
}> {
  // Get user's renewal date
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { renewalDate: true },
  });

  const { cycleStart, cycleEnd, month, year } = getBillingCycleDates(user?.renewalDate || null);

  // Try to find existing usage record for this month
  let monthlyUsage = await (prisma as any).monthlyUsage.findFirst({
    where: {
      userId,
      billingMonth: month,
      billingYear: year,
    },
  });

  if (!monthlyUsage) {
    // Create new usage record for this billing cycle
    monthlyUsage = await (prisma as any).monthlyUsage.create({
      data: {
        userId,
        billingMonth: month,
        billingYear: year,
        billingCycleStart: cycleStart,
        billingCycleEnd: cycleEnd,
        englishUsage: 0,
        dailyUsage: 0,
        hrUsage: 0,
        technicalUsage: 0,
        companyUsage: 0,
        mockUsage: 0,
        gdUsage: 0,
        interviewGuideUsage: 0,
        totalUsage: 0,
      },
    });
  }

  return monthlyUsage;
}

/**
 * Check if user can access a specific module
 * Returns structured response for centralized validation
 * 
 * IMPORTANT: This automatically reconciles expired subscriptions
 * 
 * BUSINESS RULES:
 * - UNLIMITED modules: Never block, never decrement, never show session count
 * - LIMITED modules: Plan-based limits, validate and decrement
 * - PARTIAL modules: Validate specific sub-features only
 */
export async function validateModuleAccess(
  userId: string, 
  module: ModuleType | string,
  subFeature?: string, // For partial modules like gd
  skipReconciliation?: boolean // OPTIMIZATION: Skip reconciliation for read-only checks
): Promise<{
  allowed: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  plan: string;
  billingMonth: number;
  billingYear: number;
  resetAt: Date | null;
  isUnlimited: boolean;
  error?: string;
}> {
  // OPTIMIZATION: Only reconcile when explicitly needed (not on every read)
  // Reconciliation is done on: login, payment, and when skipReconciliation is false
  if (!skipReconciliation) {
    await reconcileSubscription(userId);
  }
  
  // Get user with plan info
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      renewalDate: true,
      disabled: true,
    },
  });

  if (!user) {
    console.error(`[VALIDATION_ERROR] User not found: ${userId}`);
    return {
      allowed: false,
      currentUsage: 0,
      limit: 0,
      remaining: 0,
      plan: "Free",
      billingMonth: 0,
      billingYear: 0,
      resetAt: null,
      isUnlimited: false,
      error: "User not found",
    };
  }

  if (user.disabled) {
    console.warn(`[VALIDATION_BLOCKED] Account disabled: ${userId}, module: ${module}`);
    return {
      allowed: false,
      currentUsage: 0,
      limit: 0,
      remaining: 0,
      plan: user.plan as string,
      billingMonth: 0,
      billingYear: 0,
      resetAt: null,
      isUnlimited: false,
      error: "Account is disabled",
    };
  }

  // Get module access type
  const accessType = getModuleAccessType(module as string);
  
  // Get billing cycle info for response
  const { cycleEnd, month, year } = getBillingCycleDates(user.renewalDate);

  console.log(`[MODULE_ACCESS_REQUEST] User: ${userId}, Module: ${module}, Type: ${accessType}, Plan: ${user.plan}, SubFeature: ${subFeature}`);

  // ============================================================
  // UNLIMITED MODULES - Skip all validation
  // ============================================================
  if (accessType === 'unlimited') {
    console.log(`[MODULE_ACCESS_ALLOWED] User: ${userId}, Module: ${module} (UNLIMITED - no validation required)`);
    return {
      allowed: true,
      currentUsage: 0,
      limit: 999999,
      remaining: 999999,
      plan: user.plan as string,
      billingMonth: month,
      billingYear: year,
      resetAt: cycleEnd,
      isUnlimited: true,
    };
  }

  // ============================================================
  // PARTIAL MODULES - Check sub-feature
  // ============================================================
  if (accessType === 'partial') {
    // For GD module, check if the specific feature is unlimited
    const normalizedModule = (module as string).toLowerCase().replace(/-/g, '').replace(/_/g, '');
    if (normalizedModule === 'gd' || normalizedModule === 'gddiscussion') {
      // Private GD and Random Matching are unlimited
      if (subFeature === 'privateGd' || subFeature === 'gdPrivate' || 
          subFeature === 'randomMatching' || subFeature === 'gdRandom' ||
          subFeature === 'gd_private' || subFeature === 'gd_random' ||
          subFeature === 'GD_PRIVATE' || subFeature === 'GD_RANDOM') {
        console.log(`[MODULE_ACCESS_ALLOWED] User: ${userId}, Module: ${module}, SubFeature: ${subFeature} (UNLIMITED sub-feature)`);
        return {
          allowed: true,
          currentUsage: 0,
          limit: 999999,
          remaining: 999999,
          plan: user.plan as string,
          billingMonth: month,
          billingYear: year,
          resetAt: cycleEnd,
          isUnlimited: true,
        };
      }
      // AI Agents are limited - fall through to limited validation
      console.log(`[MODULE_ACCESS_CHECK] User: ${userId}, Module: ${module}, SubFeature: ${subFeature} (LIMITED sub-feature - checking limits)`);
    }
  }

  // ============================================================
  // LIMITED MODULES - Validate against plan limits
  // ============================================================
  
  // Get plan configuration
  const planConfig = await getPlanConfig(user.plan as string);
  
  // Get module limit from plan - try exact match first, then normalized
  let moduleKey = module as string;
  let limit = planConfig.moduleLimits?.[moduleKey as keyof typeof planConfig.moduleLimits] || 
              DEFAULT_PLAN_LIMITS[user.plan as string]?.[moduleKey as keyof typeof DEFAULT_PLAN_LIMITS.Free];
  
  // If not found, try normalized version
  if (!limit) {
    const normalizedKey = moduleKey.toLowerCase().replace(/-/g, '').replace(/_/g, '');
    const limits = planConfig.moduleLimits || DEFAULT_PLAN_LIMITS[user.plan as string] || {};
    const limitKeys = Object.keys(limits);
    for (const key of limitKeys) {
      if (key.toLowerCase().replace(/-/g, '').replace(/_/g, '') === normalizedKey) {
        limit = limits[key as keyof typeof limits];
        break;
      }
    }
  }
  
  limit = limit || 0;

  // Check if unlimited (plan-level or limit-based)
  const isUnlimited = planConfig.isUnlimited || limit >= 999999;

  // Get current month's usage
  const monthlyUsage = await getOrCreateMonthlyUsage(userId, user.plan as string);
  
  // Get the usage field for this module
  const usageField = MODULE_USAGE_FIELDS[moduleKey as keyof typeof MODULE_USAGE_FIELDS];
  
  // If no usage field, treat as unlimited
  if (!usageField) {
    console.log(`[MODULE_ACCESS_ALLOWED] User: ${userId}, Module: ${module} (No usage field - treated as unlimited)`);
    return {
      allowed: true,
      currentUsage: 0,
      limit: 999999,
      remaining: 999999,
      plan: user.plan as string,
      billingMonth: month,
      billingYear: year,
      resetAt: cycleEnd,
      isUnlimited: true,
    };
  }
  
  // Get current usage for the specific module
  const currentUsage = (monthlyUsage[usageField as keyof typeof monthlyUsage] as number) || 0;
  const remaining = isUnlimited ? 999999 : Math.max(0, limit - currentUsage);

  const allowed = isUnlimited || currentUsage < limit;
  
  console.log(`[VALIDATION_RESULT] User: ${userId}, Module: ${module}, Allowed: ${allowed}, Usage: ${currentUsage}/${limit}, Remaining: ${remaining}`);

  return {
    allowed,
    currentUsage,
    limit,
    remaining,
    plan: user.plan as string,
    billingMonth: month,
    billingYear: year,
    resetAt: cycleEnd,
    isUnlimited,
  };
}

/**
 * Increment usage for a specific module
 * Uses database transaction for race-condition safety
 * 
 * BUSINESS RULES:
 * - UNLIMITED modules: NEVER increment
 * - LIMITED modules: Always increment
 * - PARTIAL modules: Only increment for limited sub-features
 */
export async function incrementModuleUsage(
  userId: string, 
  module: ModuleType | string,
  subFeature?: string // For partial modules like gd
): Promise<{
  success: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
  error?: string;
}> {
  console.log(`[INCREMENT_START] User: ${userId}, Module: ${module}, SubFeature: ${subFeature}`);
  
  // Get user with plan info
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      renewalDate: true,
      disabled: true,
    },
  });

  if (!user) {
    console.error(`[INCREMENT_ERROR] User not found: ${userId}`);
    return {
      success: false,
      currentUsage: 0,
      limit: 0,
      remaining: 0,
      isUnlimited: false,
      error: "User not found",
    };
  }

  if (user.disabled) {
    console.warn(`[INCREMENT_ERROR] Account disabled: ${userId}`);
    return {
      success: false,
      currentUsage: 0,
      limit: 0,
      remaining: 0,
      isUnlimited: false,
      error: "Account is disabled",
    };
  }

  // Get module access type
  const accessType = getModuleAccessType(module as string);
  
  console.log(`[INCREMENT_TYPE] Module: ${module}, AccessType: ${accessType}`);

  // ============================================================
  // UNLIMITED MODULES - Never increment
  // ============================================================
  if (accessType === 'unlimited') {
    console.log(`[INCREMENT_SKIPPED] User: ${userId}, Module: ${module} (UNLIMITED - no increment)`);
    return {
      success: true,
      currentUsage: 0,
      limit: 999999,
      remaining: 999999,
      isUnlimited: true,
    };
  }

  // ============================================================
  // PARTIAL MODULES - Check sub-feature
  // ============================================================
  if (accessType === 'partial') {
    const normalizedModule = (module as string).toLowerCase().replace(/-/g, '').replace(/_/g, '');
    if (normalizedModule === 'gd' || normalizedModule === 'gddiscussion') {
      // Private GD and Random Matching are unlimited - don't increment
      if (subFeature === 'privateGd' || subFeature === 'gdPrivate' || 
          subFeature === 'randomMatching' || subFeature === 'gdRandom' ||
          subFeature === 'gd_private' || subFeature === 'gd_random' ||
          subFeature === 'GD_PRIVATE' || subFeature === 'GD_RANDOM') {
        console.log(`[INCREMENT_SKIPPED] User: ${userId}, Module: ${module}, SubFeature: ${subFeature} (UNLIMITED sub-feature)`);
        return {
          success: true,
          currentUsage: 0,
          limit: 999999,
          remaining: 999999,
          isUnlimited: true,
        };
      }
      // AI Agents are limited - continue to increment
      console.log(`[INCREMENT_PARTIAL] User: ${userId}, Module: ${module}, SubFeature: ${subFeature} (LIMITED sub-feature)`);
    }
  }

  // ============================================================
  // LIMITED MODULES - Increment usage
  // ============================================================
  
  // Get plan configuration
  const planConfig = await getPlanConfig(user.plan as string);
  
  // Get module limit from plan - try exact match first, then normalized
  let moduleKey = module as string;
  let limit = planConfig.moduleLimits?.[moduleKey as keyof typeof planConfig.moduleLimits] || 
              DEFAULT_PLAN_LIMITS[user.plan as string]?.[moduleKey as keyof typeof DEFAULT_PLAN_LIMITS.Free];
  
  // If not found, try normalized version
  if (!limit) {
    const normalizedKey = moduleKey.toLowerCase().replace(/-/g, '').replace(/_/g, '');
    const limits = planConfig.moduleLimits || DEFAULT_PLAN_LIMITS[user.plan as string] || {};
    const limitKeys = Object.keys(limits);
    for (const key of limitKeys) {
      if (key.toLowerCase().replace(/-/g, '').replace(/_/g, '') === normalizedKey) {
        limit = limits[key as keyof typeof limits];
        moduleKey = key; // Update moduleKey to the found key
        break;
      }
    }
  }
  
  limit = limit || 0;

  // Check if unlimited
  const isUnlimited = planConfig.isUnlimited || limit >= 999999;

  // If already unlimited, no need to check limits
  if (isUnlimited) {
    console.log(`[INCREMENT_SKIPPED] User: ${userId}, Module: ${module} (Plan-level UNLIMITED)`);
    return {
      success: true,
      currentUsage: 0,
      limit: 999999,
      remaining: 999999,
      isUnlimited: true,
    };
  }

  // Get current month's usage
  const monthlyUsage = await getOrCreateMonthlyUsage(userId, user.plan as string);
  
  // Get the usage field for this module - try exact match first, then normalized
  let usageField = MODULE_USAGE_FIELDS[moduleKey as keyof typeof MODULE_USAGE_FIELDS];
  
  // If not found, try normalized version
  if (!usageField) {
    const normalizedKey = moduleKey.toLowerCase().replace(/-/g, '').replace(/_/g, '');
    const fieldKeys = Object.keys(MODULE_USAGE_FIELDS);
    for (const key of fieldKeys) {
      if (key.toLowerCase().replace(/-/g, '').replace(/_/g, '') === normalizedKey) {
        usageField = MODULE_USAGE_FIELDS[key as keyof typeof MODULE_USAGE_FIELDS];
        break;
      }
    }
  }
  
  // If no usage field, treat as unlimited
  if (!usageField) {
    console.log(`[INCREMENT_SKIPPED] User: ${userId}, Module: ${module} (No usage field - unlimited)`);
    return {
      success: true,
      currentUsage: 0,
      limit: 999999,
      remaining: 999999,
      isUnlimited: true,
    };
  }
  
  const currentUsage = (monthlyUsage[usageField as keyof typeof monthlyUsage] as number) || 0;

  console.log(`[INCREMENT_CHECK] User: ${userId}, Module: ${module}, Usage: ${currentUsage}/${limit}`);

  // Check if user can use more
  if (currentUsage >= limit) {
    console.warn(`[INCREMENT_BLOCKED] User: ${userId}, Module: ${module}, Limit reached: ${currentUsage}/${limit}`);
    return {
      success: false,
      currentUsage,
      limit,
      remaining: 0,
      isUnlimited: false,
      error: "Usage limit reached",
    };
  }

  // Use transaction to prevent race conditions
  try {
    console.log(`[BEFORE_INCREMENT] User: ${userId}, Module: ${module}, Field: ${usageField}, CurrentCount: ${currentUsage}`);
    
    // Update monthly usage with atomic increment
    const updatedUsage = await (prisma as any).monthlyUsage.update({
      where: { id: monthlyUsage.id },
      data: {
        [usageField]: { increment: 1 } as any,
        totalUsage: { increment: 1 },
      },
    });

    const newUsage = updatedUsage[usageField as keyof typeof updatedUsage] as number;
    const remaining = Math.max(0, limit - newUsage);

    console.log(`[AFTER_INCREMENT] User: ${userId}, Module: ${module}, Field: ${usageField}, NewCount: ${newUsage}, Remaining: ${remaining}`);

    return {
      success: true,
      currentUsage: newUsage,
      limit,
      remaining,
      isUnlimited: false,
    };
  } catch (error: any) {
    console.error(`[INCREMENT_FAILED] User: ${userId}, Module: ${module}, Error:`, error);
    return {
      success: false,
      currentUsage,
      limit,
      remaining: 0,
      isUnlimited: false,
      error: "Failed to increment usage",
    };
  }
}

/**
 * Handle subscription renewal - update plan and reset for new cycle
 */
export async function handleSubscriptionRenewal(
  userId: string,
  newPlan: string,
  billingCycle: "monthly" | "annual" = "monthly",
  razorpaySubscriptionId?: string
): Promise<{
  success: boolean;
  message: string;
}> {
  const planConfig = await getPlanConfig(newPlan);
  const billingDays = billingCycle === "annual" ? 365 : (planConfig.billingCycleDays || 30);
  const renewalDate = new Date(Date.now() + billingDays * 24 * 60 * 60 * 1000);

  // Get current user
  const currentUser = await prisma.users.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!currentUser) {
    return { success: false, message: "User not found" };
  }

  // Update user with new plan
  await prisma.users.update({
    where: { id: userId },
    data: {
      plan: newPlan as any,
      renewalDate,
    } as any,
  });

  // Create new monthly usage record for the new billing cycle
  const { cycleStart, cycleEnd, month, year } = getBillingCycleDates(renewalDate);
  
  await (prisma as any).monthlyUsage.upsert({
    where: {
      userId_billingMonth_billingYear: {
        userId,
        billingMonth: month,
        billingYear: year,
      },
    },
    update: {},
    create: {
      userId,
      billingMonth: month,
      billingYear: year,
      billingCycleStart: cycleStart,
      billingCycleEnd: cycleEnd,
      englishUsage: 0,
      dailyUsage: 0,
      hrUsage: 0,
      technicalUsage: 0,
      companyUsage: 0,
      mockUsage: 0,
      gdUsage: 0,
      interviewGuideUsage: 0,
      totalUsage: 0,
    },
  });

  // Update or create subscription record
  if (razorpaySubscriptionId) {
    await (prisma as any).subscriptions.upsert({
      where: { id: razorpaySubscriptionId },
      update: {
        plan: newPlan as any,
        currentPeriodEnd: renewalDate,
        status: "active",
        billingCycle,
      },
      create: {
        userId,
        stripeSubscriptionId: razorpaySubscriptionId,
        stripeCustomerId: "",
        plan: newPlan as any,
        status: "active",
        currentPeriodEnd: renewalDate,
        billingCycle,
        autoRenew: true,
      },
    });
  }

  console.log(`[BILLING] Subscription renewed for user ${userId}: ${newPlan}, renewal date: ${renewalDate}`);

  return {
    success: true,
    message: `Successfully renewed to ${newPlan} plan.`,
  };
}

/**
 * Check subscription status
 */
export async function checkSubscriptionStatus(userId: string): Promise<{
  isActive: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry: number;
  renewalDate: Date | null;
  plan: string;
}> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      renewalDate: true,
      plan: true,
    },
  });

  if (!user || user.plan === "Free" || !user.renewalDate) {
    return {
      isActive: false,
      isExpiringSoon: false,
      daysUntilExpiry: 0,
      renewalDate: null,
      plan: user?.plan || "Free",
    };
  }

  const now = new Date();
  const renewalDate = new Date(user.renewalDate);
  const daysUntilExpiry = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    isActive: renewalDate > now,
    isExpiringSoon: daysUntilExpiry <= 7 && daysUntilExpiry > 0,
    daysUntilExpiry: Math.max(0, daysUntilExpiry),
    renewalDate,
    plan: user.plan as string,
  };
}

/**
 * Subscription Reconciliation - Check and downgrade expired subscriptions
 * MUST be called on:
 * - User login
 * - Any authenticated API request
 * - Billing page load
 * - Module access validation
 */
export async function reconcileSubscription(userId: string): Promise<{
  wasDowngraded: boolean;
  previousPlan: string;
  currentPlan: string;
  action: string;
}> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      renewalDate: true,
    },
  });

  if (!user || user.plan === "Free") {
    return {
      wasDowngraded: false,
      previousPlan: user?.plan || "Free",
      currentPlan: user?.plan || "Free",
      action: "none",
    };
  }

  const now = new Date();
  const isExpired = !user.renewalDate || new Date(user.renewalDate) < now;

  // Check subscription status in database
  const subscription = await (prisma as any).subscriptions.findFirst({
    where: {
      userId,
      status: { not: "active" },
    },
    orderBy: { createdAt: "desc" },
  });

  const isSubscriptionFailed = subscription && (subscription.status === "failed" || subscription.status === "cancelled");

  // Downgrade if expired or subscription failed
  if (isExpired || isSubscriptionFailed) {
    const previousPlan = user.plan as string;
    
    // Downgrade to Free
    await prisma.users.update({
      where: { id: userId },
      data: {
        plan: "Free",
        renewalDate: null,
      } as any,
    });

    // Update subscription status if exists
    if (subscription) {
      await (prisma as any).subscriptions.update({
        where: { id: subscription.id },
        data: { status: "expired" },
      });
    }

    console.log(`[BILLING] Auto-downgraded user ${userId}: ${previousPlan} -> Free (expired: ${isExpired}, subscription failed: ${isSubscriptionFailed})`);

    return {
      wasDowngraded: true,
      previousPlan,
      currentPlan: "Free",
      action: isExpired ? "subscription_expired" : "subscription_failed",
    };
  }

  return {
    wasDowngraded: false,
    previousPlan: user.plan as string,
    currentPlan: user.plan as string,
    action: "none",
  };
}

/**
 * Get all plans with their limits (for admin/frontend)
 */
export async function getAllPlansWithLimits() {
  const plans = ["Free", "Standard", "Pro", "Enterprise"];
  const result: Record<string, any> = {};

  for (const plan of plans) {
    const config = await getPlanConfig(plan);
    result[plan] = {
      ...config,
      moduleLimits: config.moduleLimits || DEFAULT_PLAN_LIMITS[plan],
    };
  }

  return result;
}

/**
 * Get user's current usage breakdown
 */
export async function getUserUsageBreakdown(userId: string) {
  // OPTIMIZATION: Fetch user data once with all needed fields
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { plan: true, renewalDate: true },
  });

  if (!user) {
    return null;
  }

  // OPTIMIZATION: Calculate billing cycle dates synchronously (no DB call)
  const { cycleStart, cycleEnd, month, year } = getBillingCycleDates(user.renewalDate);

  // OPTIMIZATION: Fetch planConfig and monthlyUsage in PARALLEL
  const [planConfig, existingMonthlyUsage] = await Promise.all([
    getPlanConfig(user.plan as string),
    (prisma as any).monthlyUsage.findFirst({
      where: {
        userId,
        billingMonth: month,
        billingYear: year,
      },
    })
  ]);

  // Create monthlyUsage if doesn't exist (separate call only when needed)
  let monthlyUsage = existingMonthlyUsage;
  if (!monthlyUsage) {
    monthlyUsage = await (prisma as any).monthlyUsage.create({
      data: {
        userId,
        billingMonth: month,
        billingYear: year,
        billingCycleStart: cycleStart,
        billingCycleEnd: cycleEnd,
        englishUsage: 0,
        dailyUsage: 0,
        hrUsage: 0,
        technicalUsage: 0,
        companyUsage: 0,
        mockUsage: 0,
        gdUsage: 0,
        interviewGuideUsage: 0,
        totalUsage: 0,
      },
    });
  }

  const usage = {
    english: monthlyUsage.englishUsage || 0,
    daily: monthlyUsage.dailyUsage || 0,
    hr: monthlyUsage.hrUsage || 0,
    technical: monthlyUsage.technicalUsage || 0,
    company: monthlyUsage.companyUsage || 0,
    mock: monthlyUsage.mockUsage || 0,
    gdCoach: (monthlyUsage as any).gdCoachUsage || 0,  // GD Coach - separate from GD Agent
    gd: monthlyUsage.gdUsage || 0,              // GD Agent
    interviewGuide: monthlyUsage.interviewGuideUsage || 0,
    total: monthlyUsage.totalUsage || 0,
  };

  const limits = planConfig.moduleLimits || DEFAULT_PLAN_LIMITS[user.plan as string];
  
  // Calculate remaining for each module
  const remaining: Record<string, number> = {
    english: Math.max(0, (limits.english || 0) - usage.english),
    daily: Math.max(0, (limits.daily || 0) - usage.daily),
    hr: Math.max(0, (limits.hr || 0) - usage.hr),
    technical: Math.max(0, (limits.technical || 0) - usage.technical),
    company: Math.max(0, (limits.company || 0) - usage.company),
    mock: Math.max(0, (limits.mock || 0) - usage.mock),
    gdCoach: Math.max(0, (limits.gdCoach || 0) - usage.gdCoach),  // GD Coach
    gd: Math.max(0, (limits.gd || 0) - usage.gd),  // GD Agent
    interviewGuide: Math.max(0, (limits.interviewGuide || 0) - usage.interviewGuide),
  };
  
  // Calculate isUnlimited for each module
  const isUnlimited: Record<string, boolean> = {};
  const moduleKeys = ['english', 'daily', 'hr', 'technical', 'company', 'mock', 'gdCoach', 'gd', 'interviewGuide'];
  
  for (const key of moduleKeys) {
    const moduleType = key as ModuleType;
    const accessType = getModuleAccessType(moduleType);
    
    if (accessType === 'unlimited') {
      isUnlimited[key] = true;
      remaining[key] = 999999; // Unlimited
    } else {
      // Check if plan-level unlimited or limit >= 999999
      isUnlimited[key] = planConfig.isUnlimited || (limits[key as keyof typeof limits] || 0) >= 999999;
      if (isUnlimited[key]) {
        remaining[key] = 999999;
      }
    }
  }

  return {
    plan: user.plan,
    billingMonth: month,
    billingYear: year,
    resetAt: cycleEnd,
    usage,
    limits,
    remaining,
    isUnlimited,
  };
}
