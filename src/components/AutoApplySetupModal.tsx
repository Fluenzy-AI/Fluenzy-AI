"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Check, ChevronRight, ChevronLeft, User, Briefcase, MapPin, Zap,
  AlertCircle, FileText, Mail, Phone, Github, Linkedin, Loader2
} from "lucide-react";

interface CandidateProfile {
  name?: string;
  email?: string;
  phone?: string;
  resumeUrl?: string;
  resumeName?: string;
  skills?: string[];
  experience?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

interface AutoApplySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  plan: string;
}

const PREDEFINED_ROLES = [
  "Frontend Developer", "Backend Developer", "Full Stack Developer", "React Developer",
  "Node.js Developer", "Python Developer", "Data Analyst", "Data Scientist",
  "AI/ML Engineer", "Machine Learning Engineer", "Generative AI Engineer", "DevOps Engineer",
  "Cloud Engineer", "Android Developer", "iOS Developer", "Flutter Developer",
  "UI/UX Designer", "Product Manager", "Embedded Systems Engineer", "Cybersecurity Analyst",
  "QA Engineer", "Business Analyst", "Content Writer", "Digital Marketing"
];

const PREDEFINED_LOCATIONS = [
  "Remote", "Hybrid", "Onsite", "Delhi", "Noida", "Gurugram", "Bangalore",
  "Mumbai", "Hyderabad", "Pune", "Chennai", "Kolkata"
];

const EMPLOYMENT_TYPES = ["Full-time", "Internship", "Contract", "Part-time"];

const STEPS = [
  { id: 1, title: "Your Profile", icon: User },
  { id: 2, title: "Target Roles", icon: Briefcase },
  { id: 3, title: "Job Preferences", icon: MapPin },
  { id: 4, title: "Enable Auto-Apply", icon: Zap },
];

export default function AutoApplySetupModal({
  isOpen,
  onClose,
  onComplete,
  plan,
}: AutoApplySetupModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);

  // Preferences state
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [roleInput, setRoleInput] = useState("");
  const [targetLocations, setTargetLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState("");
  const [targetTypes, setTargetTypes] = useState<string[]>([]);
  const [minSalary, setMinSalary] = useState("");
  const [excludedCompanies, setExcludedCompanies] = useState<string[]>([]);
  const [excludeInput, setExcludeInput] = useState("");
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/candidates/me");
      if (res.ok) {
        const data = await res.json();
        const p = data.candidate?.profile || {};
        const profileData: CandidateProfile = {
          name: data.candidate?.name,
          email: data.candidate?.email,
          phone: p.phone,
          resumeUrl: p.resumeUrl,
          resumeName: p.resumeName,
          skills: p.skills || [],
          experience: p.experience,
          githubUrl: p.github,
          linkedinUrl: p.linkedin,
        };
        setProfile(profileData);

        // Check if required fields are filled
        const isComplete = !!(
          profileData.name &&
          profileData.email &&
          profileData.phone &&
          profileData.resumeUrl &&
          (profileData.skills?.length || 0) > 0
        );
        setProfileComplete(isComplete);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return profileComplete;
      case 2:
        return targetRoles.length > 0;
      case 3:
        return targetLocations.length > 0 && targetTypes.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/candidates/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRoles,
          targetLocations,
          targetTypes,
          minSalary: minSalary || null,
          excludeCompanies: excludedCompanies,
          autoApplyEnabled,
        }),
      });

      if (res.ok) {
        onComplete();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save preferences");
      }
    } catch (error) {
      console.error("Failed to save preferences:", error);
      alert("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const addRole = (role: string) => {
    const trimmed = role.trim();
    if (trimmed && !targetRoles.includes(trimmed)) {
      setTargetRoles([...targetRoles, trimmed]);
    }
    setRoleInput("");
  };

  const removeRole = (role: string) => {
    setTargetRoles(targetRoles.filter((r) => r !== role));
  };

  const addLocation = (location: string) => {
    const trimmed = location.trim();
    if (trimmed && !targetLocations.includes(trimmed)) {
      setTargetLocations([...targetLocations, trimmed]);
    }
    setLocationInput("");
  };

  const removeLocation = (location: string) => {
    setTargetLocations(targetLocations.filter((l) => l !== location));
  };

  const toggleEmploymentType = (type: string) => {
    if (targetTypes.includes(type)) {
      setTargetTypes(targetTypes.filter((t) => t !== type));
    } else {
      setTargetTypes([...targetTypes, type]);
    }
  };

  const addExcludedCompany = (company: string) => {
    const trimmed = company.trim();
    if (trimmed && !excludedCompanies.includes(trimmed)) {
      setExcludedCompanies([...excludedCompanies, trimmed]);
    }
    setExcludeInput("");
  };

  const removeExcludedCompany = (company: string) => {
    setExcludedCompanies(excludedCompanies.filter((c) => c !== company));
  };

  if (!isOpen) return null;

  const monthlyLimit = plan === "Pro" ? 30 : 150;
  const skillThreshold = plan === "Pro" ? "80%" : "60%";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white">Set Up Auto-Apply</h2>
            <p className="text-sm text-slate-400 mt-1">One-time setup to enable automatic job applications</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="px-6 py-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              return (
                <div key={s.id} className="flex items-center">
                  <div className={`flex items-center gap-2 ${isActive ? "text-indigo-400" : isCompleted ? "text-emerald-400" : "text-slate-500"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      isActive ? "border-indigo-400 bg-indigo-400/10" :
                      isCompleted ? "border-emerald-400 bg-emerald-400/10" :
                      "border-slate-600 bg-slate-800"
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`w-8 sm:w-16 h-0.5 mx-2 ${step > s.id ? "bg-emerald-400" : "bg-slate-700"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>
            ) : (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Step 1: Profile Check */}
                {step === 1 && (
                  <div className="space-y-6">
                    <p className="text-slate-400 text-sm">
                      We&apos;ll use your profile information to auto-apply to jobs. Please ensure your profile is complete.
                    </p>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
                      <ProfileField icon={User} label="Full Name" value={profile?.name} required />
                      <ProfileField icon={Mail} label="Email" value={profile?.email} required />
                      <ProfileField icon={Phone} label="Phone" value={profile?.phone} required />
                      <ProfileField icon={FileText} label="Resume" value={profile?.resumeUrl ? profile.resumeName || "Uploaded" : undefined} required />
                      <ProfileField icon={Briefcase} label="Skills" value={profile?.skills?.length ? `${profile.skills.length} skills` : undefined} required />
                      <ProfileField icon={Github} label="GitHub" value={profile?.githubUrl} />
                      <ProfileField icon={Linkedin} label="LinkedIn" value={profile?.linkedinUrl} />
                    </div>

                    {!profileComplete && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                          <div>
                            <p className="text-amber-300 font-medium">Profile Incomplete</p>
                            <p className="text-sm text-slate-400 mt-1">
                              Please complete your profile before setting up auto-apply.
                            </p>
                            <a
                              href="/profile"
                              className="inline-block mt-2 text-sm text-amber-400 hover:text-amber-300 underline"
                            >
                              Complete Profile →
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {profileComplete && (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                        <Check className="w-5 h-5 text-emerald-400" />
                        <span className="text-emerald-300">Profile looks great! You can proceed.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Choose Roles */}
                {step === 2 && (
                  <div className="space-y-6">
                    <p className="text-slate-400 text-sm">
                      Select the job roles you want to be automatically applied for. When any company posts a job matching these roles, we will submit your application instantly.
                    </p>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Target Roles <span className="text-red-400">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {targetRoles.map((role) => (
                          <span
                            key={role}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm"
                          >
                            {role}
                            <button onClick={() => removeRole(role)} className="hover:text-white">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={roleInput}
                          onChange={(e) => setRoleInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addRole(roleInput)}
                          placeholder="Type a role and press Enter"
                          className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 mb-2">Quick add:</p>
                      <div className="flex flex-wrap gap-2">
                        {PREDEFINED_ROLES.filter((r) => !targetRoles.includes(r)).slice(0, 12).map((role) => (
                          <button
                            key={role}
                            onClick={() => addRole(role)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-xs transition"
                          >
                            + {role}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500">
                      Tip: Select roles that match your skills for better auto-apply results.
                    </p>
                  </div>
                )}

                {/* Step 3: Job Preferences */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Preferred Locations <span className="text-red-400">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {targetLocations.map((loc) => (
                          <span
                            key={loc}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm"
                          >
                            {loc}
                            <button onClick={() => removeLocation(loc)} className="hover:text-white">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {PREDEFINED_LOCATIONS.filter((l) => !targetLocations.includes(l)).map((loc) => (
                          <button
                            key={loc}
                            onClick={() => addLocation(loc)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-xs transition"
                          >
                            + {loc}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Employment Types <span className="text-red-400">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {EMPLOYMENT_TYPES.map((type) => (
                          <button
                            key={type}
                            onClick={() => toggleEmploymentType(type)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                              targetTypes.includes(type)
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Minimum Salary (optional)
                      </label>
                      <input
                        type="number"
                        value={minSalary}
                        onChange={(e) => setMinSalary(e.target.value)}
                        placeholder="e.g. 25000"
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <p className="text-xs text-slate-500 mt-1">Leave blank to apply to all salary ranges</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Excluded Companies (optional)
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {excludedCompanies.map((company) => (
                          <span
                            key={company}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm"
                          >
                            {company}
                            <button onClick={() => removeExcludedCompany(company)} className="hover:text-white">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={excludeInput}
                        onChange={(e) => setExcludeInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addExcludedCompany(excludeInput)}
                        placeholder="Type company name and press Enter"
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Enable Auto-Apply */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                      <div>
                        <p className="text-white font-medium">Enable Auto-Apply</p>
                        <p className="text-sm text-slate-400">Start automatically applying to matching jobs</p>
                      </div>
                      <button
                        onClick={() => setAutoApplyEnabled(!autoApplyEnabled)}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          autoApplyEnabled ? "bg-emerald-500" : "bg-slate-600"
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                            autoApplyEnabled ? "right-1" : "left-1"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl text-sm text-slate-400">
                      <p>
                        By enabling Auto-Apply, Fluenzy AI will automatically submit your job application
                        (using your saved profile, resume, and the above preferences) whenever a company
                        posts a job matching your selected roles. You can pause or stop this anytime from
                        your preferences.
                      </p>
                    </div>

                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-5 h-5 text-indigo-400" />
                        <span className="text-indigo-300 font-medium">{plan} Plan</span>
                      </div>
                      <p className="text-sm text-slate-400">
                        You have <strong className="text-white">{monthlyLimit} auto-applications</strong> per month.
                        {plan === "Pro" && " Applications are only submitted when skill match is 80% or higher."}
                        {plan === "Standard" && " Applications are submitted when skill match is 60% or higher."}
                        {" "}Applications reset on the 1st of each month.
                      </p>
                    </div>

                    {/* Summary */}
                    <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                      <p className="text-white font-medium mb-3">Summary</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Target Roles:</span>
                          <span className="text-white">{targetRoles.length} selected</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Locations:</span>
                          <span className="text-white">{targetLocations.join(", ")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Employment Types:</span>
                          <span className="text-white">{targetTypes.join(", ")}</span>
                        </div>
                        {minSalary && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Min Salary:</span>
                            <span className="text-white">₹{parseInt(minSalary).toLocaleString()}/month</span>
                          </div>
                        )}
                        {excludedCompanies.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Excluded:</span>
                            <span className="text-white">{excludedCompanies.length} companies</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700">
          <button
            onClick={step === 1 ? onClose : handleBack}
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? "Cancel" : "Back"}
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : step === 4 ? (
              autoApplyEnabled ? "Save & Activate" : "Save Preferences"
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
  required = false,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  required?: boolean;
}) {
  const filled = !!value;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${filled ? "text-slate-400" : "text-slate-600"}`} />
        <span className={`text-sm ${filled ? "text-slate-300" : "text-slate-500"}`}>
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-xs text-slate-500 max-w-[150px] truncate">{value}</span>}
        {filled ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : (
          <AlertCircle className="w-4 h-4 text-red-400" />
        )}
      </div>
    </div>
  );
}
