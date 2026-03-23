"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import CompanyPortalLayout from "@/components/CompanyPortalLayout";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  FileText,
  Zap,
  Globe,
  Building2,
  LayoutDashboard,
  UserPlus,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const COMPANY_NAV = [
  { label: "Dashboard", href: "/company/portal", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Job Postings", href: "/company/portal/jobs", icon: <Briefcase className="w-4 h-4" /> },
  { label: "Applications", href: "/company/portal/applications", icon: <Users className="w-4 h-4" /> },
  { label: "Assessments", href: "/company/portal/assessments", icon: <FileText className="w-4 h-4" /> },
  { label: "Team", href: "/company/portal/team", icon: <UserPlus className="w-4 h-4" />, adminOnly: true },
  { label: "Settings", href: "/company/portal/settings", icon: <Settings className="w-4 h-4" />, adminOnly: true },
];

// Generate slug from title
const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
};

export default function NewJobPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "REMOTE" as "REMOTE" | "HYBRID" | "ONSITE",
    city: "",
    employmentType: "FULL_TIME",
    experienceYears: "",
    salaryMin: "",
    salaryMax: "",
    skills: [] as string[],
    description: "",
    requirements: "",
    responsibilities: "",
    autoApplyEnabled: true,
  });
  const [skillInput, setSkillInput] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Parse requirements and responsibilities into arrays (split by newline)
      const requirementsArray = formData.requirements
        .split("\n")
        .map((r) => r.trim())
        .filter((r) => r.length > 0);

      const responsibilitiesArray = formData.responsibilities
        .split("\n")
        .map((r) => r.trim())
        .filter((r) => r.length > 0);

      const payload = {
        title: formData.title,
        slug: generateSlug(formData.title),
        department: formData.department,
        location: formData.location,
        city: formData.city || undefined,
        employmentType: formData.employmentType,
        experienceYears: formData.experienceYears,
        salaryMin: formData.salaryMin || undefined,
        salaryMax: formData.salaryMax || undefined,
        skills: formData.skills,
        description: formData.description,
        requirements: requirementsArray,
        responsibilities: responsibilitiesArray,
        autoApplyEnabled: formData.autoApplyEnabled,
      };

      const res = await fetch("/api/company/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("API Response:", data);
      
      if (res.ok) {
        router.push("/company/portal/jobs");
      } else {
        const data = await res.json();
        console.error("API Error:", data);
        alert(data.error || "Failed to create job");
      }
    } catch (error) {
      console.error("Failed to create job:", error);
      alert("Failed to create job");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CompanyPortalLayout navItems={COMPANY_NAV} title="Post New Job">
      <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Job Postings
        </Button>
        <h1 className="text-3xl font-bold text-white">Post New Job</h1>
        <p className="text-slate-400 mt-1">Fill in the details to create a new job posting</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Job Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="e.g., Senior Software Engineer"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Department <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
                placeholder="e.g., Engineering"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Work Location <span className="text-red-400">*</span>
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">On-site</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="e.g., Bangalore, Mumbai"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Employment Type <span className="text-red-400">*</span>
              </label>
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Experience Required <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="experienceYears"
                value={formData.experienceYears}
                onChange={handleInputChange}
                required
                placeholder="e.g., 3-5 years"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Salary Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Salary Range
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Minimum Salary (₹)
              </label>
              <input
                type="text"
                name="salaryMin"
                value={formData.salaryMin}
                onChange={handleInputChange}
                placeholder="e.g., 800000"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Maximum Salary (₹)
              </label>
              <input
                type="text"
                name="salaryMax"
                value={formData.salaryMax}
                onChange={handleInputChange}
                placeholder="e.g., 1200000"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Skills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            Required Skills
          </h2>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Add a skill (e.g., React, Node.js)"
                className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Button type="button" onClick={addSkill} className="bg-indigo-600 hover:bg-indigo-700">
                Add
              </Button>
            </div>

            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-sm flex items-center gap-2"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-red-400 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Job Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Job Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Job Description <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={6}
                placeholder="Describe the role, responsibilities, and what the candidate will be working on... (minimum 50 characters)"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Requirements <span className="text-red-400">*</span>
                <span className="text-slate-500 font-normal ml-2">(one per line)</span>
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                required
                rows={6}
                placeholder="Bachelor's degree in Computer Science&#10;3+ years of experience with React&#10;Strong problem-solving skills&#10;Excellent communication abilities"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Responsibilities <span className="text-red-400">*</span>
                <span className="text-slate-500 font-normal ml-2">(one per line)</span>
              </label>
              <textarea
                name="responsibilities"
                value={formData.responsibilities}
                onChange={handleInputChange}
                required
                rows={6}
                placeholder="Design and develop user interfaces&#10;Collaborate with backend team&#10;Write clean, maintainable code&#10;Participate in code reviews"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            Job Settings
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="autoApplyEnabled"
                checked={formData.autoApplyEnabled}
                onChange={handleInputChange}
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <span className="text-white font-medium">Enable Auto-Apply</span>
                <p className="text-sm text-slate-400">
                  Allow candidates with matching profiles to auto-apply to this job
                </p>
              </div>
            </label>
          </div>
        </motion.div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1 border-slate-700 hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
          >
            {isSubmitting ? "Creating..." : "Post Job"}
          </Button>
        </div>
      </form>
    </div>
    </CompanyPortalLayout>
  );
}
