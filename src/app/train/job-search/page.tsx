"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { JobCard } from "@/components/jobs/JobCard";
import { SessionUsageBar } from "@/components/jobs/SessionUsageBar";
import { JobMatch, PLAN_LIMITS, UserPlan } from "@/types/jobs";
import { Search, Loader2, MapPin, Briefcase, Sparkles, Globe, ChevronDown, CheckCircle2, History, AlertCircle, X, GraduationCap, Award } from "lucide-react";

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

// Experience Level options
const EXPERIENCE_LEVELS = [
  { value: "internship", label: "Internship / Apprentice" },
  { value: "entry", label: "Entry-level (0–2 years)" },
  { value: "mid", label: "Mid-level (2–5 years)" },
  { value: "senior", label: "Senior / Advanced (5+ years)" },
  { value: "director", label: "Director / Leadership" },
];

// Education options
const EDUCATION_LEVELS = [
  { value: "pursuing", label: "Currently pursuing a degree" },
  { value: "associate", label: "Associate degree" },
  { value: "bachelor", label: "Bachelor's degree" },
  { value: "master", label: "Master's degree" },
  { value: "doctorate", label: "Doctorate (Ph.D.)" },
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
  jobs?: JobMatch[]; // Include saved job results
  createdAt: string;
}

export default function BrowseJobsPage() {
  const { data: session } = useSession();
  
  // Step 1: Job Position
  const [jobPosition, setJobPosition] = useState("");
  
  // Step 2: Job Type (multi-select)
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  
  // Step 3: Location (multi-city)
  const [country, setCountry] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [isRemote, setIsRemote] = useState(false);
  
  // Step 4: Experience Level (multi-select)
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  
  // Step 5: Education (multi-select)
  const [selectedEducation, setSelectedEducation] = useState<string[]>([]);
  
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [userSkills, setUserSkills] = useState<string[]>([]);
  
  // Resume upload (optional)
  const [showResumeUpload, setShowResumeUpload] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  
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

  // Reset cities and remote when country changes
  useEffect(() => {
    setSelectedCities([]);
    setIsRemote(false);
  }, [country]);

  // Fetch session info on mount
  useEffect(() => {
    if (session?.user) {
      fetchSessionInfo();
      fetchSearchHistory();
      fetchSavedJobs();
      fetchResume();
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
      const res = await fetch("/api/job-search/history?limit=20");
      if (!res.ok) return;
      
      const data = await res.json();
      if (data.history && Array.isArray(data.history)) {
        setSearchHistory(data.history);
      }
    } catch (err) {
      console.error("Failed to fetch search history:", err);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const res = await fetch("/api/job-search/save");
      if (!res.ok) return;
      
      const data = await res.json();
      if (data.jobs && Array.isArray(data.jobs)) {
        setSavedIds(new Set(data.jobs.map((j: any) => j.id)));
      }
    } catch (err) {
      console.error("Failed to fetch saved jobs:", err);
    }
  };

  const fetchResume = async () => {
    try {
      const res = await fetch("/api/job-search/resume");
      if (!res.ok) return;
      
      const data = await res.json();
      if (data.resume) {
        setUserSkills(data.resume.skills || []);
        setResumeFileName(data.resume.fileName);
      }
    } catch (err) {
      console.error("Failed to fetch resume:", err);
    }
  };

  const handleResumeUpload = async (file: File) => {
    if (!file) return;
    
    setResumeUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("resume", file);
      
      console.log("[Frontend] Uploading resume:", file.name, file.size);
      
      const res = await fetch("/api/job-search/resume", {
        method: "POST",
        body: formData,
      });
      
      console.log("[Frontend] Response status:", res.status);
      
      // Always try to parse JSON
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error("[Frontend] Failed to parse response:", parseErr);
        throw new Error("Invalid server response");
      }
      
      if (!res.ok || !data.success) {
        console.error("[Frontend] Upload failed:", data);
        throw new Error(data.error || "Upload failed");
      }
      
      if (data.skills && Array.isArray(data.skills)) {
        setUserSkills(data.skills);
        setResumeFileName(data.fileName);
        setShowResumeUpload(false);
        console.log("[Frontend] Resume uploaded successfully, skills:", data.skills.length);
      }
    } catch (err: any) {
      console.error("[Frontend] Resume upload error:", err);
      setError(err.message || "Failed to upload resume. Please try again.");
    } finally {
      setResumeUploading(false);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      const res = await fetch(`/api/job-search/history?id=${id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setSearchHistory(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete history item:", err);
    }
  };

  // Derive experience level from selections
  const getExperienceLevelParam = () => {
    if (selectedExperience.length === 0) return "";
    return selectedExperience.join(",");
  };

  // Check if form is valid for search
  const canSearch = () => {
    if (!jobPosition.trim()) return false;
    if (selectedJobTypes.length === 0) return false;
    if (!country && !isRemote) return false;
    // If country selected but no city and not remote
    if (country && selectedCities.length === 0 && !isRemote) return false;
    return true;
  };

  // Get search summary text
  const getSearchSummary = () => {
    const parts = [];
    if (jobPosition) parts.push(jobPosition);
    
    // Job types
    if (selectedJobTypes.length > 0) {
      const typeLabels = selectedJobTypes.map(t => 
        JOB_TYPES.find(jt => jt.value === t)?.label || t
      );
      if (typeLabels.length <= 2) {
        parts.push(`(${typeLabels.join(" / ")})`);
      } else {
        parts.push(`(${typeLabels.length} job types)`);
      }
    }
    
    // Location
    if (isRemote) {
      parts.push("Remote");
      if (country) {
        parts.push(`in ${selectedCountry?.name || country}`);
      }
    } else if (selectedCities.length > 0 && country) {
      if (selectedCities.length === 1) {
        parts.push(`in ${selectedCities[0]}, ${selectedCountry?.name}`);
      } else {
        parts.push(`in ${selectedCities.length} cities, ${selectedCountry?.name}`);
      }
    }
    
    return parts.join(" ");
  };

  // Toggle multi-select for job types
  const toggleJobType = (value: string) => {
    setSelectedJobTypes(prev => 
      prev.includes(value) 
        ? prev.filter(t => t !== value)
        : [...prev, value]
    );
  };

  // Toggle multi-select for cities
  const toggleCity = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city)
        : [...prev, city]
    );
  };

  // Toggle multi-select for experience
  const toggleExperience = (value: string) => {
    setSelectedExperience(prev => 
      prev.includes(value) 
        ? prev.filter(e => e !== value)
        : [...prev, value]
    );
  };

  // Toggle multi-select for education
  const toggleEducation = (value: string) => {
    setSelectedEducation(prev => 
      prev.includes(value) 
        ? prev.filter(e => e !== value)
        : [...prev, value]
    );
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
      
      // Build location string (multiple cities)
      let locationStr = "";
      if (isRemote) {
        if (country) {
          locationStr = `remote ${selectedCountry?.name || country}`;
        } else {
          locationStr = "remote";
        }
      } else if (selectedCities.length > 0 && country) {
        // Use all selected cities in query
        locationStr = selectedCities.map(c => `${c}, ${selectedCountry?.name || country}`).join(" OR ");
        // For API, just use first city but make query broader
        locationStr = `${selectedCities[0]}, ${selectedCountry?.name || country}`;
      }
      
      if (locationStr) params.set("location", locationStr);
      
      // Add job types (use first for API, but search will be broader)
      if (selectedJobTypes.length > 0) {
        params.set("job_type", selectedJobTypes.join(","));
      }
      
      // Add experience levels
      const expLevel = getExperienceLevelParam();
      if (expLevel) {
        params.set("experience_level", expLevel);
      }
      
      // Add education levels
      if (selectedEducation.length > 0) {
        params.set("education", selectedEducation.join(","));
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
    // If history item has saved jobs, show them directly
    if (item.jobs && item.jobs.length > 0) {
      setJobs(item.jobs);
      setTotalResults(item.jobs.length);
      setFromCache(true);
      setJobPosition(item.query);
      setShowHistory(false);
      console.log(`[Frontend] Loaded ${item.jobs.length} jobs from history`);
      return;
    }
    
    // Otherwise, populate search form and let user re-search
    setJobPosition(item.query);
    
    // Parse job types (could be comma-separated)
    if (item.jobType) {
      const types = item.jobType.split(",").map(t => t.trim());
      setSelectedJobTypes(types);
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
                setSelectedCities([cityName]);
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

        {/* Search History & Resume Upload Buttons */}
        <div className="flex justify-between items-center gap-3">
          {/* Resume Upload Button (Optional) */}
          <button
            onClick={() => setShowResumeUpload(!showResumeUpload)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 rounded-lg border border-purple-600/50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {resumeFileName ? `Resume: ${resumeFileName.slice(0, 20)}...` : "Upload Resume (Optional)"}
          </button>
          
          {searchHistory.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700 transition-all"
            >
              <History className="w-4 h-4" />
              Recent Searches ({searchHistory.length})
            </button>
          )}
        </div>

        {/* Resume Upload Dropdown */}
        {showResumeUpload && (
          <div className="bg-purple-900/20 backdrop-blur-sm border border-purple-700/50 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Upload Resume for Better Matching
              </h3>
              <button onClick={() => setShowResumeUpload(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {userSkills.length > 0 && (
              <div className="mb-3 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                <p className="text-sm text-green-300 mb-2">✓ Skills detected: {userSkills.length}</p>
                <div className="flex flex-wrap gap-1">
                  {userSkills.slice(0, 10).map((skill, i) => (
                    <span key={i} className="text-xs bg-green-600/30 text-green-200 px-2 py-0.5 rounded-full">
                      {skill}
                    </span>
                  ))}
                  {userSkills.length > 10 && (
                    <span className="text-xs text-gray-400">+{userSkills.length - 10} more</span>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleResumeUpload(file);
                }}
                disabled={resumeUploading}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-500 file:cursor-pointer cursor-pointer disabled:opacity-50"
              />
              {resumeUploading && (
                <div className="flex items-center gap-2 text-sm text-purple-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting skills from resume...
                </div>
              )}
              <p className="text-xs text-gray-500">
                Upload your resume (PDF only, max 5MB) to get personalized job matches based on your skills.
              </p>
            </div>
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
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                >
                  <button
                    onClick={() => runHistorySearch(item)}
                    className="flex-1 text-left"
                  >
                    <p className="text-white text-sm font-medium">{item.query}</p>
                    <p className="text-gray-400 text-xs">
                      {item.location || "Any location"} • {item.resultsCount} results
                    </p>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHistoryItem(item.id);
                      }}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
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

            {/* Step 2: Job Type (Multi-select) */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-white font-medium">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-xs font-bold">2</span>
                What type of job? <span className="text-xs text-gray-400 font-normal">(select multiple)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {JOB_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => toggleJobType(type.value)}
                    className={`px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                      selectedJobTypes.includes(type.value)
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-gray-700/50 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              {selectedJobTypes.length > 0 && (
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{selectedJobTypes.map(t => JOB_TYPES.find(jt => jt.value === t)?.label).join(", ")} selected</span>
                </div>
              )}
            </div>

            {/* Step 3: Location (Multi-city) */}
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
                      if (!isRemote) setSelectedCities([]);
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

                  {/* City Selection - Multi-select grid */}
                  {!isRemote && availableCities.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-gray-400 text-xs">Select cities <span className="text-blue-400">(max 6)</span>:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {availableCities.map((c) => (
                          <button
                            key={c}
                            onClick={() => {
                              if (selectedCities.includes(c)) {
                                toggleCity(c);
                              } else if (selectedCities.length < 6) {
                                toggleCity(c);
                              }
                            }}
                            disabled={!selectedCities.includes(c) && selectedCities.length >= 6}
                            className={`px-3 py-2 rounded-lg border transition-all text-sm ${
                              selectedCities.includes(c)
                                ? "bg-blue-600 border-blue-500 text-white"
                                : selectedCities.length >= 6
                                ? "bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed"
                                : "bg-gray-700/50 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700"
                            }`}
                          >
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {c}
                          </button>
                        ))}
                      </div>
                      {selectedCities.length > 0 && (
                        <p className="text-xs text-gray-500">{selectedCities.length}/6 cities selected</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Location confirmation */}
              {(selectedCities.length > 0 || isRemote) && (
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {isRemote
                      ? `Remote work${country ? ` in ${selectedCountry?.name}` : ""}`
                      : selectedCities.length === 1 
                        ? `${selectedCities[0]}, ${selectedCountry?.name}`
                        : `${selectedCities.length} cities in ${selectedCountry?.name}`}
                  </span>
                </div>
              )}
            </div>

            {/* Step 4: Experience Level (Multi-select) - Optional */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-white font-medium">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-600 text-xs font-bold">4</span>
                Experience Level <span className="text-xs text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {EXPERIENCE_LEVELS.map((exp) => (
                  <button
                    key={exp.value}
                    onClick={() => toggleExperience(exp.value)}
                    className={`px-3 py-2 rounded-lg border transition-all text-xs font-medium ${
                      selectedExperience.includes(exp.value)
                        ? "bg-green-600 border-green-500 text-white"
                        : "bg-gray-700/50 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700"
                    }`}
                  >
                    <Award className="h-3 w-3 inline mr-1" />
                    {exp.label}
                  </button>
                ))}
              </div>
              {selectedExperience.length > 0 && (
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{selectedExperience.length} level(s) selected</span>
                </div>
              )}
            </div>

            {/* Step 5: Education (Multi-select) - Optional */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-white font-medium">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-600 text-xs font-bold">5</span>
                Education <span className="text-xs text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {EDUCATION_LEVELS.map((edu) => (
                  <button
                    key={edu.value}
                    onClick={() => toggleEducation(edu.value)}
                    className={`px-3 py-2 rounded-lg border transition-all text-xs font-medium ${
                      selectedEducation.includes(edu.value)
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "bg-gray-700/50 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700"
                    }`}
                  >
                    <GraduationCap className="h-3 w-3 inline mr-1" />
                    {edu.label}
                  </button>
                ))}
              </div>
              {selectedEducation.length > 0 && (
                <div className="flex items-center gap-1 text-purple-400 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{selectedEducation.length} education level(s) selected</span>
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
                 selectedJobTypes.length === 0 ? "Select at least one job type" :
                 !country ? "Select a country" :
                 selectedCities.length === 0 && !isRemote ? "Select a city or choose remote" : ""}
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
