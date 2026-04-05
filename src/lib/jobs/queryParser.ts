/**
 * Smart Query Parser - AI-First Job Search
 * Parses natural language queries like:
 * - "python intern remote"
 * - "data analyst 2 years bangalore 5 lpa"
 * - "senior react developer full-time mumbai"
 */

export interface ParsedQuery {
  role: string;
  experience?: {
    years?: number;
    level?: 'internship' | 'fresher' | 'junior' | 'mid' | 'senior';
  };
  location?: string;
  jobType?: 'fulltime' | 'parttime' | 'contract' | 'internship' | 'freelance';
  salary?: {
    min?: number;
    max?: number;
    currency?: 'INR' | 'USD';
  };
  workMode?: 'remote' | 'hybrid' | 'onsite';
  rawQuery: string;
}

// Experience level keywords
const EXPERIENCE_KEYWORDS = {
  internship: ['intern', 'internship', 'trainee'],
  fresher: ['fresher', 'entry', 'entry-level', 'graduate', 'beginner'],
  junior: ['junior', 'jr'],
  mid: ['mid', 'mid-level', 'intermediate'],
  senior: ['senior', 'sr', 'lead', 'principal'],
};

// Job type keywords
const JOB_TYPE_KEYWORDS = {
  internship: ['intern', 'internship'],
  fulltime: ['full-time', 'fulltime', 'full time', 'ft'],
  parttime: ['part-time', 'parttime', 'part time', 'pt'],
  contract: ['contract', 'contractor', 'freelance', 'freelancer'],
  freelance: ['freelance', 'freelancer'],
};

// Work mode keywords
const WORK_MODE_KEYWORDS = {
  remote: ['remote', 'work from home', 'wfh'],
  hybrid: ['hybrid', 'flexible'],
  onsite: ['onsite', 'on-site', 'office', 'in-office'],
};

// Common Indian cities (expandable)
const INDIAN_CITIES = [
  'bangalore', 'mumbai', 'delhi', 'pune', 'hyderabad', 'chennai', 'kolkata',
  'ahmedabad', 'surat', 'jaipur', 'lucknow', 'kanpur', 'nagpur', 'indore',
  'thane', 'bhopal', 'visakhapatnam', 'patna', 'vadodara', 'ghaziabad',
  'ludhiana', 'agra', 'nashik', 'faridabad', 'meerut', 'rajkot', 'varanasi',
  'srinagar', 'aurangabad', 'dhanbad', 'amritsar', 'navi mumbai', 'allahabad',
  'ranchi', 'howrah', 'coimbatore', 'jabalpur', 'gwalior', 'vijayawada',
  'jodhpur', 'madurai', 'raipur', 'kota', 'chandigarh', 'guwahati',
  'noida', 'gurugram', 'gurgaon', 'darbhanga', 'mathura', 'kochi', 'mysore'
];

// Indian states for better location detection
const INDIAN_STATES = [
  'bihar', 'up', 'uttar pradesh', 'karnataka', 'maharashtra', 'delhi',
  'tamil nadu', 'kerala', 'gujarat', 'rajasthan', 'west bengal',
  'andhra pradesh', 'telangana', 'punjab', 'haryana', 'mp', 'madhya pradesh'
];

/**
 * Parse natural language query to extract job search parameters
 */
export function parseJobQuery(query: string): ParsedQuery {
  // Clean up query - handle slashes, extra spaces
  const cleanedQuery = query.replace(/[\/\\]/g, ' ').replace(/\s+/g, ' ').trim();
  const lowerQuery = cleanedQuery.toLowerCase();
  const tokens = lowerQuery.split(/\s+/);
  
  const parsed: ParsedQuery = {
    role: '',
    rawQuery: query,
  };

  // Extract experience level
  for (const [level, keywords] of Object.entries(EXPERIENCE_KEYWORDS)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      parsed.experience = { level: level as any };
      break;
    }
  }

  // Extract years of experience (e.g., "2 years", "3 yrs", "5+")
  const yearPatterns = [
    /(\d+)\s*(years?|yrs?)/i,
    /(\d+)\+/,
    /(\d+)\s*to\s*(\d+)\s*(years?|yrs?)/i,
  ];
  
  for (const pattern of yearPatterns) {
    const match = query.match(pattern);
    if (match) {
      if (!parsed.experience) parsed.experience = {};
      parsed.experience.years = parseInt(match[1]);
      break;
    }
  }

  // Extract job type
  for (const [type, keywords] of Object.entries(JOB_TYPE_KEYWORDS)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      parsed.jobType = type as any;
      break;
    }
  }

  // Extract work mode
  for (const [mode, keywords] of Object.entries(WORK_MODE_KEYWORDS)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      parsed.workMode = mode as any;
      break;
    }
  }

  // Extract salary (e.g., "5 lpa", "3-5 lpa", "10 lakh", "$50k")
  const salaryPatterns = [
    /(\d+)\s*(?:to|-)\s*(\d+)\s*(?:lpa|lakh|lakhs)/i, // Range: "3-5 lpa"
    /(\d+)\s*(?:lpa|lakh|lakhs)/i,                   // Single: "5 lpa"
    /\$(\d+)k/i,                                      // USD: "$50k"
    /₹\s*(\d+)/i,                                     // Rupee symbol
  ];

  for (const pattern of salaryPatterns) {
    const match = query.match(pattern);
    if (match) {
      if (!parsed.salary) parsed.salary = {};
      
      if (pattern.source.includes('to|-')) {
        // Range
        parsed.salary.min = parseInt(match[1]);
        parsed.salary.max = parseInt(match[2]);
      } else {
        // Single value (treat as minimum)
        parsed.salary.min = parseInt(match[1]);
      }
      
      // Detect currency
      if (pattern.source.includes('\\$')) {
        parsed.salary.currency = 'USD';
      } else {
        parsed.salary.currency = 'INR';
      }
      break;
    }
  }

  // Extract location (cities and states)
  const locationTokens: string[] = [];
  
  // Check for multi-word city names (e.g., "navi mumbai")
  for (const city of INDIAN_CITIES) {
    if (lowerQuery.includes(city)) {
      locationTokens.push(city);
      break;
    }
  }
  
  // Check for state names
  for (const state of INDIAN_STATES) {
    if (lowerQuery.includes(state)) {
      locationTokens.push(state);
    }
  }
  
  if (locationTokens.length > 0) {
    parsed.location = locationTokens
      .map(t => t.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
      .join(', ');
  }

  // Extract role (everything that's not a keyword)
  const filterKeywords = new Set([
    ...Object.values(EXPERIENCE_KEYWORDS).flat(),
    ...Object.values(JOB_TYPE_KEYWORDS).flat(),
    ...Object.values(WORK_MODE_KEYWORDS).flat(),
    ...INDIAN_CITIES,
    ...INDIAN_STATES,
    'years', 'yrs', 'year', 'lpa', 'lakh', 'lakhs', 'to', 'at', 'in'
  ]);

  const roleTokens = tokens.filter(token => {
    // Keep token if it's not a filter keyword and not a number
    if (filterKeywords.has(token)) return false;
    if (/^\d+$/.test(token)) return false;
    if (token.length <= 1) return false;
    return true;
  });

  parsed.role = roleTokens
    .map(t => t.charAt(0).toUpperCase() + t.slice(1))
    .join(' ')
    .trim();

  // If no role was extracted, use the entire query as role
  if (!parsed.role) {
    parsed.role = query.trim();
  }

  return parsed;
}

/**
 * Generate search suggestions based on partial input
 */
export function generateSearchSuggestions(input: string): string[] {
  const suggestions = [
    'python developer intern remote',
    'data analyst 2 years bangalore',
    'senior react developer full-time',
    'frontend developer remote',
    'java developer 3 years pune',
    'product manager 5 years mumbai',
    'devops engineer remote 8 lpa',
    'ui/ux designer freelance',
    'backend developer node.js delhi',
    'machine learning intern',
  ];

  if (!input || input.trim().length < 2) {
    return suggestions.slice(0, 5);
  }

  const lowerInput = input.toLowerCase();
  const filtered = suggestions.filter(s => 
    s.toLowerCase().includes(lowerInput)
  );

  return filtered.slice(0, 5);
}

/**
 * Format parsed query for display
 */
export function formatParsedQuery(parsed: ParsedQuery): string {
  const parts: string[] = [];

  if (parsed.role) parts.push(parsed.role);
  
  if (parsed.experience?.level) {
    parts.push(`(${parsed.experience.level})`);
  } else if (parsed.experience?.years) {
    parts.push(`(${parsed.experience.years} years)`);
  }
  
  if (parsed.jobType) parts.push(parsed.jobType);
  if (parsed.workMode) parts.push(parsed.workMode);
  if (parsed.location) parts.push(`in ${parsed.location}`);
  
  if (parsed.salary) {
    if (parsed.salary.min && parsed.salary.max) {
      parts.push(`₹${parsed.salary.min}-${parsed.salary.max} LPA`);
    } else if (parsed.salary.min) {
      parts.push(`₹${parsed.salary.min}+ LPA`);
    }
  }

  return parts.join(' ');
}
