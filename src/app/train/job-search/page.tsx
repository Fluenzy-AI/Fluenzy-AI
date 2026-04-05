"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { JobCard } from "@/components/jobs/JobCard";
import { SessionUsageBar } from "@/components/jobs/SessionUsageBar";
import { JobMatch, PLAN_LIMITS, UserPlan } from "@/types/jobs";
import { Search, Loader2, MapPin, Briefcase, Sparkles, Globe, ChevronDown, CheckCircle2, History, AlertCircle, X } from "lucide-react";

// Country options with major cities
const COUNTRIES = [
  { code: "IN", name: "India", cities: ["Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Gurgaon", "Noida"] },
  { code: "US", name: "United States", cities: ["New York", "San Francisco", "Los Angeles", "Seattle", "Austin", "Chicago", "Boston", "Denver", "Miami", "Washington DC"] },
  { code: "UK", name: "United Kingdom", cities: ["London", "Manchester", "Birmingham", "Edinburgh", "Bristol", "Leeds", "Liverpool"] },
  { code: "CA", name: "Canada", cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"] },
  { code: "AU", name: "Australia", cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"] },
  { code: "DE", name: "Germany", cities: ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne"] },
  { code: "SG", name: "Singapore", cities: ["Singapore"] },
  { code: "AE", name: "UAE", cities: ["Dubai", "Abu Dhabi"] },
];

// Job type options
const JOB_TYPES = [
  { value: "internship", label: "Internship" },
  { value: "fulltime", label: "Full-time" },
  { value: "parttime", label: "Part-time" },
  { value: "contract", label: "Contract / Freelance" },
];

interface SessionInfo {
  plan: UserPlan;
  canSearch: boolean;
  sessionsUsed: number;
  sessionsRemaining: number;
  sessionsLimit: number;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  location: string | null;
  jobType: string | null;
  workMode: string | null;
  resultsCount: number;
  createdAt: string;
}

export default function BrowseJobsPage() {
  const { data: session } = useSession();
  
  // Step 1: Job Position
  const [jobPosition, setJobPosition] = useState("");
  
  // Step 2: Job Type
  const [jobType, setJobType] = useState("");
  
  // Step 3: Location
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [userSkills, setUserSkills] = useState<string[]>([]);
  
  // Session info
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [showLimitBanner, setShowLimitBanner] = useState(false);
  
  // Search history
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Search metadata
  const [fromCache, setFromCache] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // Get cities for selected country
  const selectedCountry = COUNTRIES.find(c => c.code === country);
  const availableCities = selectedCountry?.cities || [];

  // Reset city and remote when country changes
  useEffect(() => {
    setCity("");
    setIsRemote(false);
  }, [country]);

  // Fetch session info on mount
  useEffect(() => {
    if (session?.user) {
      fetchSessionInfo();
      fetchSearchHistory();
      fetchSavedJobs();
    }
  }, [session]);

  const fetchSessionInfo = async () => {
    try {
      const res = await fetch("/api/job-search/session");
      const data = await res.json();
      if (res.ok) {
        setSessionInfo(data);
        // Show limit banner if no searches allowed
        if (!data.canSearch || data.sessionsRemaining === 0) {
          setShowLimitBanner(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch session info:", err);
    }
  };

  const fetchSearchHistory = async () => {
    try {
      const res = await fetch("/api/job-search/history?limit=10");
      const data = await res.json();
      if (res.ok && data.history) {
        setSearchHistory(data.history);
      }
    } catch (err) {
      console.error("Failed to fetch search history:", err);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const res = await fetch("/api/job-search/save");
      const data = await res.json();
      if (data.jobs) {
        setSavedIds(new Set(data.jobs.map((j: any) => j.id)));
      }
    } catch (err) {
      console.error("Failed to fetch saved jobs:", err);
    }
  };

  // Derive experience level from job type (internship = internship, fulltime/etc = all)
  const getExperienceLevel = () => {
    if (jobType === "internship") return "internship";
    return "all";
  };

  // Check if form is valid for search
  const canSearch = () => {
    if (!jobPosition.trim()) return false;
    if (!jobType) return false;
    if (!country && !isRemote) return false;
    // If country selected but no city and not remote
    if (country && !city && !isRemote) return false;
    return true;
  };

  // Get search summary text
  const getSearchSummary = () => {
    const parts = [];
    if (jobPosition) parts.push(jobPosition);
    if (jobType) {
      const typeLabel = JOB_TYPES.find(t => t.value === jobType)?.label || jobType;
      parts.push(`(${typeLabel})`);
    }
    if (isRemote) {
      parts.push("Remote");
      if (country) {
        parts.push(`in ${selectedCountry?.name || country}`);
      }
    } else if (city && country) {
      parts.push(`in ${city}, ${selectedCountry?.name}`);
    }
    return parts.join(" ");
  };

  // Fetch jobs with structured filters
  const fetchJobs = async () => {
    if (!canSearch()) return;
    
    // Check session limit before search
    if (sessionInfo && !sessionInfo.canSearch) {
      setShowLimitBanner(true);
      setError("Your plan doesn't include job searches. Please upgrade to continue.");
      return;
    }
    
    if (sessionInfo && sessionInfo.sessionsRemaining === 0) {
      setShowLimitBanner(true);
      setError("Daily search limit reached. Please upgrade for more searches.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setShowLimitBanner(false);

    try {
      const params = new URLSearchParams({ query: jobPosition.trim() });
      
      // Build location string
      let locationStr = "";
      if (isRemote) {
        if (country) {
          locationStr = `remote ${selectedCountry?.name || country}`;
        } else {
          locationStr = "remote";
        }
      } else if (city && country) {
        locationStr = `${city}, ${selectedCountry?.name || country}`;
      }
      
      if (locationStr) params.set("location", locationStr);
      
      // Add job type
      if (jobType) {
        params.set("job_type", jobType);
      }
      
      // Add experience level based on job type
      const expLevel = getExperienceLevel();
      if (expLevel && expLevel !== "all") {
        params.set("experience_level", expLevel);
      }
      
      // Add work mode
      if (isRemote) {
        params.set("work_mode", "remote");
      }

      const res = await fetch(`/api/job-search/search?${params}`);
      const result = await res.json();

      if (!res.ok) {
        // Handle specific error codes
        if (res.status === 403 || res.status === 429) {
          setShowLimitBanner(true);
          setError(result.message || "Search limit reached. Please upgrade your plan.");
          // Update session info
          if (result.sessionsUsed !== undefined) {
            setSessionInfo(prev => prev ? {
              ...prev,
              sessionsUsed: result.sessionsUsed,
              sessionsRemaining: result.sessionsRemaining || 0,
            } : null);
          }
        } else {
          setError(result.message || result.error || "Search failed. Please try again.");
        }
        return;
      }

      // Success - update state
      setJobs(result.jobs || []);
      setTotalResults(result.total || 0);
      setFromCache(result.fromCache || false);
      
      // Update session info
      setSessionInfo(prev => prev ? {
        ...prev,
        sessionsUsed: result.sessionsUsed,
        sessionsRemaining: result.sessionsRemaining,
      } : null);

      // Refresh search history
      fetchSearchHistory();
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Re-run a search from history
  const runHistorySearch = (item: SearchHistoryItem) => {
    setJobPosition(item.query);
    
    // Parse job type
    if (item.jobType) {
      setJobType(item.jobType);
    }
    
    // Parse location
    if (item.location) {
      const locLower = item.location.toLowerCase();
      if (locLower.includes("remote")) {
        setIsRemote(true);
        // Try to extract country from "remote India" format
        for (const c of COUNTRIES) {
          if (locLower.includes(c.name.toLowerCase())) {
            setCountry(c.code);
            break;
          }
        }
      } else {
        // Parse "City, Country" format
        const parts = item.location.split(",").map(s => s.trim());
        if (parts.length >= 2) {
          const cityName = parts[0];
          const countryName = parts[1];
          for (const c of COUNTRIES) {
            if (c.name.toLowerCase() === countryName.toLowerCase()) {
              setCountry(c.code);
              if (c.cities.includes(cityName)) {
                setCity(cityName);
              }
              break;
            }
          }
        }
      }
    }
    
    setShowHistory(false);
  };

  // Handle save
  const handleSave = async (job: JobMatch) => {
    const isSaved = savedIds.has(job.id);
    const method = isSaved ? "DELETE" : "POST";
    const body = isSaved ? { jobId: job.id } : { job };

    try {
      const res = await fetch("/api/job-search/save", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSavedIds(prev => {
          const next = new Set(prev);
          isSaved ? next.delete(job.id) : next.add(job.id);
          return next;
        });
      }
    } catch {}
  };

  // Handle apply
  const handleApply = async (job: JobMatch) => {
    try {
      await fetch("/api/job-search/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job, status: "applied" }),
      });
    } catch {}
  };

  const plan = sessionInfo?.plan || "free";
  const sessionsUsed = sessionInfo?.sessionsUsed || 0;
  const sessionsLimit = sessionInfo?.sessionsLimit || PLAN_LIMITS[plan].sessions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/20 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              AI Job Search
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Answer 3 simple questions to find your perfect job
          </p>
        </div>
        
        {/* Session Usage Bar - Always visible when session info loaded */}
        {sessionInfo && (
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-300">Search Sessions</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">{sessionsUsed}/{sessionsLimit} used</span>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-600/30 text-blue-300 capitalize">{plan} plan</span>
              </div>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  sessionsLimit === 0 ? "bg-red-500" :
                  (sessionsUsed / sessionsLimit) >= 0.8 ? "bg-red-500" : 
                  (sessionsUsed / sessionsLimit) >= 0.5 ? "bg-yellow-500" : "bg-green-500"
                }`}
                style={{ width: sessionsLimit === 0 ? "100%" : `${Math.min((sessionsUsed / sessionsLimit) * 100, 100)}%` }} 
              />
            </div>
          </div>
        )}

        {/* Session Limit Banner - Conditional */}
        {showLimitBanner && (
          <div className="flex items-center gap-3 p-4 bg-red-950/40 border border-red-800/50 rounded-xl">
            <AlertCircle className="text-red-400 w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-300 font-medium">
                {plan === "free" 
                  ? "Free plan doesn't include job searches." 
                  : "Daily search limit reached."}
              </p>
              <a href="/billing" className="text-xs text-red-400 underline mt-0.5 block hover:text-red-300">
                Upgrade for more searches →
              </a>
            </div>
            <button onClick={() => setShowLimitBanner(false)} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search History Button */}
        {searchHistory.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700 transition-all"
            >
              <History className="w-4 h-4" />
              Recent Searches ({searchHistory.length})
            </button>
          </div>
        )}

        {/* Search History Dropdown */}
        {showHistory && searchHistory.length > 0 && (
          <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                Recent Searches
              </h3>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => runHistorySearch(item)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors text-left"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{item.query}</p>
                    <p className="text-gray-400 text-xs">
                      {item.location || "Any location"} • {item.resultsCount} results
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Search Box - 3 Step Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-2xl">
          <div className="space-y-6">
            
            {/* Step 1: Job Position */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-white font-medium">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-xs font-bold">1</span>
                What job are you looking for?
              </label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={jobPosition}
                  onChange={(e) => setJobPosition(e.target.value)}
                  placeholder="e.g., Data Science Intern, Software Developer, Marketing Manager"
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              {jobPosition && (
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Position selected</span>
                </div>
              )}
            </div>

            {/* Step 2: Job Type */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-white font-medium">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-xs font-bold">2</span>
                What type of job?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {JOB_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setJobType(type.value)}
                    className={`px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                      jobType === type.value
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-gray-700/50 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              {jobType && (
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{JOB_TYPES.find(t => t.value === jobType)?.label} selected</span>
                </div>
              )}
            </div>

            {/* Step 3: Location */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-white font-medium">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-xs font-bold">3</span>
                Where do you want to work?
              </label>
              
              {/* Country Selection */}
              <div className="space-y-2">
                <p className="text-gray-400 text-sm">Select a country:</p>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl pl-12 pr-4 py-3.5 text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select a country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* City Selection OR Remote - Only show when country is selected */}
              {country && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-gray-400 text-sm">Choose city or remote:</p>
                  
                  {/* Remote Option */}
                  <button
                    onClick={() => {
                      setIsRemote(!isRemote);
                      if (!isRemote) setCity("");
                    }}
                    className={`w-full px-4 py-3 rounded-xl border transition-all flex items-center justify-center gap-2 font-medium ${
                      isRemote
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "bg-gray-700/50 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700"
                    }`}
                  >
                    <Globe className="h-5 w-5" />
                    Remote / Work from Home
                    {isRemote && <CheckCircle2 className="h-5 w-5 ml-1" />}
                  </button>

                  {/* City Selection - Only if not remote and cities available */}
                  {!isRemote && availableCities.length > 0 && (
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl pl-12 pr-4 py-3.5 text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select a city</option>
                        {availableCities.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                  )}
                </div>
              )}

              {/* Location confirmation */}
              {(city || isRemote) && (
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {isRemote
                      ? `Remote work${country ? ` in ${selectedCountry?.name}` : ""}`
                      : `${city}, ${selectedCountry?.name}`}
                  </span>
                </div>
              )}
            </div>

            {/* Search Summary */}
            {canSearch() && (
              <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-gray-400 text-sm">AI will search for:</p>
                    <p className="text-blue-300 font-medium text-lg">{getSearchSummary()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Search Button */}
            <button
              onClick={fetchJobs}
              disabled={isLoading || !canSearch()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl font-semibold text-lg hover:from-blue-500 hover:to-purple-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-6 w-6" />
                  Search Jobs
                </>
              )}
            </button>

            {/* Help text when form incomplete */}
            {!canSearch() && (
              <p className="text-center text-gray-500 text-sm">
                {!jobPosition ? "Enter a job position to start" :
                 !jobType ? "Select a job type" :
                 !country ? "Select a country" :
                 !city && !isRemote ? "Select a city or choose remote" : ""}
              </p>
            )}
          </div>
        </div>

        {/* Results Info */}
        {jobs.length > 0 && !isLoading && (
          <div className="flex items-center justify-between text-sm bg-gray-800/30 rounded-lg px-4 py-3">
            <span className="text-gray-300">
              Found <span className="text-white font-bold text-lg">{totalResults}</span> jobs
              {fromCache && (
                <span className="text-blue-400 ml-2">(⚡ instant)</span>
              )}
            </span>
            <span className="text-gray-400">
              <span className="text-blue-400 capitalize font-medium">{sessionInfo?.plan || 'free'}</span> plan
            </span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-800/30 rounded-2xl">
            <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-300 text-lg font-medium">AI is finding perfect matches...</p>
            <p className="text-gray-500 text-sm mt-1">Analyzing thousands of jobs</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Briefcase className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-red-400 font-medium">{error}</p>
              {error.includes("limit") && (
                <a href="/billing" className="text-sm text-red-300 underline mt-1 inline-block">
                  Upgrade for more searches →
                </a>
              )}
            </div>
          </div>
        )}

        {/* Job Grid */}
        {jobs.length > 0 && !isLoading && (
          <div className="space-y-4">
            <div className="text-sm text-gray-400">
              {userSkills.length > 0 && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span className="text-purple-300">Jobs ranked by AI match with your resume</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4">
              {jobs.map((job: JobMatch) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSaved={savedIds.has(job.id)}
                  onSave={handleSave}
                  onApply={handleApply}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {jobs.length === 0 && totalResults === 0 && !isLoading && !error && jobPosition && (
          <div className="text-center py-20 bg-gray-800/30 rounded-2xl">
            <div className="p-4 bg-gray-700/50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Briefcase className="h-10 w-10 text-gray-500" />
            </div>
            <p className="text-gray-400 text-lg mb-2">No jobs found for "{getSearchSummary()}"</p>
            <p className="text-gray-500 text-sm">Try different position or location</p>
          </div>
        )}
      </div>
    </div>
  );
}
